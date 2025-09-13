import yfinance as yf
import requests
import json
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import pandas as pd
import numpy as np
from functools import wraps
import google.generativeai as genai
import os

class MarketDataService:
    """Enhanced market data service with multiple data sources and fallbacks"""
    
    def __init__(self, gemini_api_key: str = None, alpha_vantage_api_key: str = None, finnhub_api_key: str = None):
        self.gemini_api_key = gemini_api_key
        if gemini_api_key:
            genai.configure(api_key=gemini_api_key)
            self.gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Alpha Vantage configuration (kept for compatibility, not primary)
        env_alpha_key = os.getenv('ALPHA_VANTAGE_API_KEY')
        self.alpha_vantage_api_key = alpha_vantage_api_key or env_alpha_key
        self.alpha_base_url = 'https://www.alphavantage.co/query'
        self._last_alpha_call_ts = 0.0

        # Finnhub configuration (primary)
        env_finnhub_key = os.getenv('FINNHUB_API_KEY')
        # Fallback to provided key literal if not configured via env/param (per user request)
        default_finnhub_key = 'd31talhr01qsprr2hh0gd31talhr01qsprr2hh10'
        self.finnhub_api_key = finnhub_api_key or env_finnhub_key or default_finnhub_key
        self.finnhub_base_url = 'https://finnhub.io/api/v1'
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
        # Cache for reducing API calls
        self.cache = {}
        self.cache_timeout = 300  # 5 minutes
        
    def retry_on_failure(max_retries=3, delay=1):
        """Decorator for retry logic"""
        def decorator(func):
            @wraps(func)
            def wrapper(self, *args, **kwargs):
                for attempt in range(max_retries):
                    try:
                        return func(self, *args, **kwargs)
                    except Exception as e:
                        if attempt == max_retries - 1:
                            self.logger.error(f"Failed after {max_retries} attempts: {e}")
                            raise e
                        self.logger.warning(f"Attempt {attempt + 1} failed: {e}, retrying...")
                        time.sleep(delay * (attempt + 1))
                return None
            return wrapper
        return decorator
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        """Check if cached data is still valid"""
        if cache_key not in self.cache:
            return False
        
        cached_time = self.cache[cache_key].get('timestamp', 0)
        return time.time() - cached_time < self.cache_timeout
    
    def _cache_data(self, cache_key: str, data: Dict) -> None:
        """Cache data with timestamp"""
        self.cache[cache_key] = {
            'data': data,
            'timestamp': time.time()
        }
    
    def _get_cached_data(self, cache_key: str) -> Optional[Dict]:
        """Get cached data if valid"""
        if self._is_cache_valid(cache_key):
            return self.cache[cache_key]['data']
        return None
    def _alpha_rate_limit(self):
        """Simple client-side throttle for Alpha Vantage free tier (~5 req/min)."""
        try:
            now = time.time()
            min_interval = 12.5  # seconds between calls
            if now - self._last_alpha_call_ts < min_interval:
                time.sleep(min_interval - (now - self._last_alpha_call_ts))
            self._last_alpha_call_ts = time.time()
        except Exception:
            # Best-effort; never block on throttle errors
            pass

    @retry_on_failure(max_retries=3, delay=2)
    def get_alpha_vantage_data(self, symbol: str, interval: str = "1min") -> Dict:
        """Fetch real-time stock data from Alpha Vantage only.

        Uses GLOBAL_QUOTE for current price and change. Optionally augments with
        OVERVIEW (cached) for fundamentals. Intraday time series used to compute
        simple indicators when available.
        """
        if not self.alpha_vantage_api_key:
            raise ValueError("ALPHA_VANTAGE_API_KEY not provided")

        # Check cache first
        cache_key = f"alpha_{symbol}_{interval}"
        cached = self._get_cached_data(cache_key)
        if cached:
            return cached

        params_quote = {
            'function': 'GLOBAL_QUOTE',
            'symbol': symbol.upper(),
            'apikey': self.alpha_vantage_api_key,
        }

        # Throttle per Alpha Vantage policy
        self._alpha_rate_limit()
        resp_q = requests.get(self.alpha_base_url, params=params_quote, timeout=30)
        if resp_q.status_code != 200:
            raise RuntimeError(f"Alpha Vantage error {resp_q.status_code}: {resp_q.text[:200]}")
        quote = resp_q.json().get('Global Quote', {})
        if not quote:
            # Alpha often returns note when throttled
            note = resp_q.json().get('Note') or resp_q.json().get('Information')
            raise RuntimeError(note or 'No quote data returned')

        # Parse quote fields
        def f(key, cast=float, default=0.0):
            try:
                val = quote.get(key)
                return cast(val) if val is not None and val != '' else default
            except Exception:
                return default

        current_price = f('05. price', float, 0.0)
        prev_close = f('08. previous close', float, current_price)
        change = f('09. change', float, current_price - prev_close)
        change_percent_str = quote.get('10. change percent', '0%').replace('%', '').strip()
        try:
            change_percent = float(change_percent_str)
        except Exception:
            change_percent = (current_price - prev_close) / prev_close * 100 if prev_close else 0.0
        volume = int(f('06. volume', int, 0))

        # Try intraday series for basic indicators (best-effort)
        indicators = {}
        try:
            params_ts = {
                'function': 'TIME_SERIES_INTRADAY',
                'symbol': symbol.upper(),
                'interval': interval,
                'outputsize': 'compact',
                'apikey': self.alpha_vantage_api_key,
            }
            self._alpha_rate_limit()
            resp_ts = requests.get(self.alpha_base_url, params=params_ts, timeout=30)
            ts_json = resp_ts.json()
            key = next((k for k in ts_json.keys() if 'Time Series' in k), None)
            if key and isinstance(ts_json.get(key), dict):
                df = pd.DataFrame(ts_json[key]).T
                df = df.astype(float)
                close = df['4. close']
                if len(close) >= 14:
                    delta = close.diff()
                    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
                    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
                    rs = gain / loss
                    indicators['rsi'] = float(100 - (100 / (1 + rs.iloc[-1]))) if loss.iloc[-1] != 0 else 50.0
                if len(close) >= 26:
                    ema_12 = close.ewm(span=12).mean()
                    ema_26 = close.ewm(span=26).mean()
                    macd = ema_12 - ema_26
                    indicators['macd'] = float(macd.iloc[-1])
                    indicators['macd_signal'] = float(macd.ewm(span=9).mean().iloc[-1])
        except Exception:
            # Ignore indicator errors
            pass

        # Fundamentals via OVERVIEW (cached longer)
        market_cap = None
        pe_ratio = None
        sector = 'Unknown'
        try:
            overview_cache_key = f"alpha_overview_{symbol}"
            overview = self._get_cached_data(overview_cache_key)
            if not overview:
                params_overview = {
                    'function': 'OVERVIEW',
                    'symbol': symbol.upper(),
                    'apikey': self.alpha_vantage_api_key,
                }
                self._alpha_rate_limit()
                resp_o = requests.get(self.alpha_base_url, params=params_overview, timeout=30)
                if resp_o.status_code == 200:
                    overview = resp_o.json()
                    # Cache fundamentals for 1 day separately
                    self.cache[overview_cache_key] = {'data': overview, 'timestamp': time.time() - (self.cache_timeout - 86400)}
            if isinstance(overview, dict):
                market_cap = float(overview.get('MarketCapitalization')) if overview.get('MarketCapitalization') else None
                pe_ratio = float(overview.get('PERatio')) if overview.get('PERatio') else None
                sector = overview.get('Sector') or sector
        except Exception:
            pass

        data = {
            'symbol': symbol.upper(),
            'current_price': float(current_price),
            'previous_close': float(prev_close),
            'change': float(change),
            'change_percent': float(change_percent),
            'volume': int(volume),
            'market_cap': market_cap,
            'pe_ratio': pe_ratio,
            'sector': sector,
            'technical_indicators': indicators,
            'timestamp': datetime.now().isoformat(),
            'source': 'alpha_vantage'
        }

        self._cache_data(cache_key, data)
        return data
    
    @retry_on_failure(max_retries=3, delay=2)
    def get_finnhub_data(self, symbol: str) -> Dict:
        """Fetch real-time stock data from Finnhub.

        Uses /quote for price fields and /stock/profile2 for fundamentals.
        """
        if not self.finnhub_api_key:
            raise ValueError("FINNHUB_API_KEY not provided")

        # Check cache
        cache_key = f"finnhub_{symbol}"
        cached = self._get_cached_data(cache_key)
        if cached:
            return cached

        # Quote endpoint
        params_quote = {
            'symbol': symbol.upper(),
            'token': self.finnhub_api_key,
        }
        resp_q = requests.get(f"{self.finnhub_base_url}/quote", params=params_quote, timeout=30)
        if resp_q.status_code != 200:
            raise RuntimeError(f"Finnhub error {resp_q.status_code}: {resp_q.text[:200]}")
        q = resp_q.json() or {}

        current_price = float(q.get('c') or 0.0)
        change = float(q.get('d') or 0.0)
        change_percent = float(q.get('dp') or 0.0)
        prev_close = float(q.get('pc') or (current_price - change)) if current_price else float(q.get('pc') or 0.0)
        volume = 0  # Finnhub /quote does not include volume

        # Company profile for fundamentals
        market_cap = None
        pe_ratio = None
        sector = 'Unknown'
        try:
            params_profile = {
                'symbol': symbol.upper(),
                'token': self.finnhub_api_key,
            }
            resp_p = requests.get(f"{self.finnhub_base_url}/stock/profile2", params=params_profile, timeout=30)
            if resp_p.status_code == 200:
                prof = resp_p.json() or {}
                # marketCapitalization in billions according to Finnhub docs
                if prof.get('marketCapitalization') is not None:
                    market_cap = float(prof.get('marketCapitalization')) * 1_000_000_000
                sector = prof.get('finnhubIndustry') or prof.get('industry') or sector
        except Exception:
            pass

        data = {
            'symbol': symbol.upper(),
            'current_price': float(current_price),
            'previous_close': float(prev_close),
            'change': float(change if change != 0.0 else (current_price - prev_close)),
            'change_percent': float(change_percent if change_percent != 0.0 else ((current_price - prev_close) / prev_close * 100 if prev_close else 0.0)),
            'volume': int(volume),
            'market_cap': market_cap,
            'pe_ratio': pe_ratio,
            'sector': sector,
            'technical_indicators': {},
            'timestamp': datetime.now().isoformat(),
            'source': 'finnhub'
        }

        self._cache_data(cache_key, data)
        return data
    
    @retry_on_failure(max_retries=3, delay=2)
    def get_yahoo_finance_data(self, symbol: str, period: str = "1d") -> Dict:
        """Enhanced Yahoo Finance data fetching with better error handling"""
        try:
            # Check cache first
            cache_key = f"yf_{symbol}_{period}"
            cached_data = self._get_cached_data(cache_key)
            if cached_data:
                self.logger.info(f"Using cached data for {symbol}")
                return cached_data
            
            # Create ticker with session for better reliability
            session = requests.Session()
            session.headers.update({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            })
            
            ticker = yf.Ticker(symbol, session=session)
            
            # Get different types of data
            try:
                # Current data
                info = ticker.info
                hist = ticker.history(period=period, interval="1m" if period == "1d" else "1d")
                
                if hist.empty:
                    raise ValueError(f"No historical data available for {symbol}")
                
                # Calculate technical indicators
                close = hist['Close']
                high = hist['High']
                low = hist['Low']
                volume = hist['Volume']
                
                # Moving averages
                hist['MA_20'] = close.rolling(window=min(20, len(close))).mean()
                hist['MA_50'] = close.rolling(window=min(50, len(close))).mean()
                hist['MA_200'] = close.rolling(window=min(200, len(close))).mean()
                
                # RSI calculation
                if len(close) >= 14:
                    delta = close.diff()
                    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
                    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
                    rs = gain / loss
                    hist['RSI'] = 100 - (100 / (1 + rs))
                else:
                    hist['RSI'] = 50  # Neutral RSI for insufficient data
                
                # MACD
                if len(close) >= 26:
                    ema_12 = close.ewm(span=12).mean()
                    ema_26 = close.ewm(span=26).mean()
                    hist['MACD'] = ema_12 - ema_26
                    hist['MACD_Signal'] = hist['MACD'].ewm(span=9).mean()
                    hist['MACD_Histogram'] = hist['MACD'] - hist['MACD_Signal']
                
                # Bollinger Bands
                bb_period = min(20, len(close))
                bb_std = close.rolling(window=bb_period).std()
                bb_middle = close.rolling(window=bb_period).mean()
                hist['BB_Upper'] = bb_middle + (bb_std * 2)
                hist['BB_Lower'] = bb_middle - (bb_std * 2)
                hist['BB_Middle'] = bb_middle
                
                # Calculate change
                current_price = close.iloc[-1]
                prev_price = close.iloc[-2] if len(close) > 1 else current_price
                change_pct = ((current_price - prev_price) / prev_price * 100) if prev_price != 0 else 0
                
                # Volume analysis
                avg_volume = volume.rolling(window=min(20, len(volume))).mean().iloc[-1]
                volume_ratio = volume.iloc[-1] / avg_volume if avg_volume > 0 else 1
                
                data = {
                    'symbol': symbol.upper(),
                    'current_price': float(current_price),
                    'previous_close': float(prev_price),
                    'change': float(current_price - prev_price),
                    'change_percent': float(change_pct),
                    'volume': int(volume.iloc[-1]) if not pd.isna(volume.iloc[-1]) else 0,
                    'avg_volume': int(avg_volume) if not pd.isna(avg_volume) else 0,
                    'volume_ratio': float(volume_ratio),
                    'market_cap': info.get('marketCap', 0),
                    'pe_ratio': info.get('trailingPE'),
                    'sector': info.get('sector', 'Unknown'),
                    'industry': info.get('industry', 'Unknown'),
                    'technical_indicators': {
                        'rsi': float(hist['RSI'].iloc[-1]) if 'RSI' in hist.columns and not pd.isna(hist['RSI'].iloc[-1]) else 50,
                        'macd': float(hist['MACD'].iloc[-1]) if 'MACD' in hist.columns and not pd.isna(hist['MACD'].iloc[-1]) else 0,
                        'macd_signal': float(hist['MACD_Signal'].iloc[-1]) if 'MACD_Signal' in hist.columns and not pd.isna(hist['MACD_Signal'].iloc[-1]) else 0,
                        'ma_20': float(hist['MA_20'].iloc[-1]) if 'MA_20' in hist.columns and not pd.isna(hist['MA_20'].iloc[-1]) else current_price,
                        'ma_50': float(hist['MA_50'].iloc[-1]) if 'MA_50' in hist.columns and not pd.isna(hist['MA_50'].iloc[-1]) else current_price,
                        'ma_200': float(hist['MA_200'].iloc[-1]) if 'MA_200' in hist.columns and not pd.isna(hist['MA_200'].iloc[-1]) else current_price,
                        'bb_upper': float(hist['BB_Upper'].iloc[-1]) if 'BB_Upper' in hist.columns and not pd.isna(hist['BB_Upper'].iloc[-1]) else current_price * 1.02,
                        'bb_lower': float(hist['BB_Lower'].iloc[-1]) if 'BB_Lower' in hist.columns and not pd.isna(hist['BB_Lower'].iloc[-1]) else current_price * 0.98,
                        'bb_middle': float(hist['BB_Middle'].iloc[-1]) if 'BB_Middle' in hist.columns and not pd.isna(hist['BB_Middle'].iloc[-1]) else current_price,
                    },
                    'historical_data': hist,
                    'info': info,
                    'timestamp': datetime.now().isoformat(),
                    'source': 'yahoo_finance'
                }
                
                # Cache the data
                self._cache_data(cache_key, data)
                self.logger.info(f"Successfully fetched Yahoo Finance data for {symbol}")
                return data
                
            except Exception as e:
                self.logger.error(f"Error processing Yahoo Finance data for {symbol}: {e}")
                raise e
                
        except Exception as e:
            self.logger.error(f"Yahoo Finance API error for {symbol}: {e}")
            raise e
    
    def get_gemini_market_data(self, symbol: str) -> Dict:
        """Get market data and analysis using Gemini AI"""
        if not self.gemini_api_key:
            raise ValueError("Gemini API key not provided")
        
        try:
            # Check cache first
            cache_key = f"gemini_{symbol}"
            cached_data = self._get_cached_data(cache_key)
            if cached_data:
                return cached_data
            
            prompt = f"""
            Please provide current market data and analysis for {symbol.upper()}. 
            
            I need the following information in a structured JSON format:
            {{
                "symbol": "{symbol.upper()}",
                "current_price": estimated_current_price_as_number,
                "change_percent": estimated_change_percent_as_number,
                "volume": estimated_volume_as_number,
                "market_cap": estimated_market_cap_as_number,
                "sector": "sector_name",
                "pe_ratio": estimated_pe_ratio_as_number_or_null,
                "technical_analysis": {{
                    "trend": "bullish/bearish/neutral",
                    "support_level": estimated_support_price,
                    "resistance_level": estimated_resistance_price,
                    "rsi_estimate": estimated_rsi_0_to_100,
                    "recommendation": "buy/sell/hold"
                }},
                "fundamental_analysis": {{
                    "business_summary": "brief_company_description",
                    "key_metrics": ["metric1", "metric2", "metric3"],
                    "recent_news_sentiment": "positive/negative/neutral"
                }},
                "ai_insights": {{
                    "price_target": estimated_price_target,
                    "risk_level": "low/medium/high",
                    "investment_horizon": "short/medium/long",
                    "key_catalysts": ["catalyst1", "catalyst2"],
                    "risk_factors": ["risk1", "risk2"]
                }}
            }}
            
            Please ensure all numeric values are actual numbers (not strings) and provide realistic estimates based on your knowledge.
            Return only the JSON, no additional text.
            """
            
            response = self.gemini_model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Clean the response to ensure it's valid JSON
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            try:
                data = json.loads(response_text)
                data['timestamp'] = datetime.now().isoformat()
                data['source'] = 'gemini_ai'
                
                # Cache the data
                self._cache_data(cache_key, data)
                self.logger.info(f"Successfully fetched Gemini data for {symbol}")
                return data
                
            except json.JSONDecodeError as e:
                self.logger.error(f"Error parsing Gemini response: {e}")
                # Fallback data structure
                return {
                    'symbol': symbol.upper(),
                    'current_price': 0,
                    'change_percent': 0,
                    'volume': 0,
                    'sector': 'Unknown',
                    'ai_insights': {
                        'recommendation': 'hold',
                        'risk_level': 'medium'
                    },
                    'source': 'gemini_ai_fallback',
                    'timestamp': datetime.now().isoformat(),
                    'error': 'JSON parsing error'
                }
                
        except Exception as e:
            self.logger.error(f"Gemini API error for {symbol}: {e}")
            raise e
    
    def get_market_data_with_fallback(self, symbol: str, period: str = "1d") -> Dict:
        """Fetch market data using Finnhub as primary source."""
        self.logger.info(f"Fetching Finnhub data for {symbol}")
        try:
            return self.get_finnhub_data(symbol)
        except Exception as e:
            self.logger.error(f"Finnhub failed for {symbol}: {e}")
            # Optional secondary: try Alpha Vantage if configured
            try:
                if self.alpha_vantage_api_key:
                    self.logger.info(f"Falling back to Alpha Vantage for {symbol}")
                    return self.get_alpha_vantage_data(symbol)
            except Exception as e2:
                self.logger.error(f"Alpha Vantage fallback failed for {symbol}: {e2}")
            return self._get_mock_data(symbol, str(e))
    
    def _get_mock_data(self, symbol: str, error_msg: str) -> Dict:
        """Generate mock data when all APIs fail"""
        return {
            'symbol': symbol.upper(),
            'current_price': 100.00,
            'change_percent': 0.0,
            'volume': 1000000,
            'market_cap': 1000000000,
            'sector': 'Unknown',
            'technical_indicators': {
                'rsi': 50.0,
                'macd': 0.0,
                'ma_20': 100.00,
                'ma_50': 100.00,
                'ma_200': 100.00
            },
            'source': 'mock_data',
            'timestamp': datetime.now().isoformat(),
            'error': f'API Error: {error_msg}',
            'note': 'This is mock data due to API failures'
        }
    
    def get_multiple_stocks_data(self, symbols: List[str], period: str = "1d") -> Dict[str, Dict]:
        """Get market data for multiple symbols efficiently"""
        results = {}
        
        for symbol in symbols:
            try:
                results[symbol] = self.get_market_data_with_fallback(symbol, period)
            except Exception as e:
                self.logger.error(f"Failed to get data for {symbol}: {e}")
                results[symbol] = self._get_mock_data(symbol, str(e))
        
        return results
    
    def get_market_sentiment_analysis(self, symbols: List[str]) -> Dict:
        """Get AI-powered market sentiment analysis"""
        if not self.gemini_api_key:
            return {'error': 'Gemini API key required for sentiment analysis'}
        
        try:
            # Get basic data for symbols
            market_data = self.get_multiple_stocks_data(symbols)
            
            prompt = f"""
            As a market analyst, provide a comprehensive market sentiment analysis based on this data:
            
            Market Data:
            {json.dumps({k: {
                'symbol': v.get('symbol', k),
                'current_price': v.get('current_price', 0),
                'change_percent': v.get('change_percent', 0),
                'volume': v.get('volume', 0),
                'sector': v.get('sector', 'Unknown')
            } for k, v in market_data.items()}, indent=2)}
            
            Provide analysis in JSON format:
            {{
                "overall_sentiment": "bullish/bearish/neutral",
                "market_strength": 1-10_rating,
                "key_trends": ["trend1", "trend2", "trend3"],
                "sector_analysis": {{
                    "strongest_sectors": ["sector1", "sector2"],
                    "weakest_sectors": ["sector1", "sector2"]
                }},
                "trading_recommendations": {{
                    "short_term": "recommendation_text",
                    "medium_term": "recommendation_text",
                    "risk_factors": ["risk1", "risk2"]
                }},
                "individual_stock_signals": {{
                    {json.dumps({symbol: "buy/sell/hold" for symbol in symbols})[1:-1]}
                }}
            }}
            
            Return only valid JSON.
            """
            
            response = self.gemini_model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Clean JSON response
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            sentiment_data = json.loads(response_text)
            sentiment_data['timestamp'] = datetime.now().isoformat()
            sentiment_data['analyzed_symbols'] = symbols
            
            return sentiment_data
            
        except Exception as e:
            self.logger.error(f"Error in sentiment analysis: {e}")
            return {
                'error': str(e),
                'overall_sentiment': 'neutral',
                'timestamp': datetime.now().isoformat()
            }
    
    def get_stock_recommendations(self, symbol: str, user_profile: Dict = None) -> Dict:
        """Get personalized stock recommendations"""
        if not self.gemini_api_key:
            return {'error': 'Gemini API key required for recommendations'}
        
        try:
            # Get stock data
            stock_data = self.get_market_data_with_fallback(symbol)
            
            profile_str = ""
            if user_profile:
                profile_str = f"""
                User Profile:
                - Risk Tolerance: {user_profile.get('risk_tolerance', 'medium')}
                - Investment Horizon: {user_profile.get('investment_horizon', 'medium')}
                - Trading Style: {user_profile.get('trading_style', 'swing')}
                - Portfolio Value: ${user_profile.get('portfolio_value', 10000):,.2f}
                """
            
            prompt = f"""
            Provide detailed stock analysis and recommendations for {symbol}:
            
            Stock Data:
            {json.dumps(stock_data, indent=2, default=str)}
            
            {profile_str}
            
            Provide recommendations in JSON format:
            {{
                "recommendation": "strong_buy/buy/hold/sell/strong_sell",
                "confidence": 1-10_rating,
                "target_price": estimated_target_price,
                "stop_loss": suggested_stop_loss_price,
                "position_size": "percentage_of_portfolio_to_allocate",
                "time_horizon": "days_or_weeks_to_hold",
                "analysis": {{
                    "technical": "technical_analysis_summary",
                    "fundamental": "fundamental_analysis_summary",
                    "risk_reward": "risk_reward_assessment"
                }},
                "pros": ["positive_factor1", "positive_factor2"],
                "cons": ["risk_factor1", "risk_factor2"],
                "key_levels": {{
                    "support": price_level,
                    "resistance": price_level
                }}
            }}
            
            Return only valid JSON.
            """
            
            response = self.gemini_model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Clean JSON response
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            recommendations = json.loads(response_text)
            recommendations['symbol'] = symbol
            recommendations['timestamp'] = datetime.now().isoformat()
            
            return recommendations
            
        except Exception as e:
            self.logger.error(f"Error getting recommendations for {symbol}: {e}")
            return {
                'symbol': symbol,
                'recommendation': 'hold',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }


# Usage example and testing functions
def test_market_data_service():
    """Test function to verify the service works"""
    
    # Initialize with your API key
    service = MarketDataService(gemini_api_key="YOUR_GEMINI_API_KEY")
    
    # Test single stock data
    print("Testing single stock data fetch...")
    try:
        data = service.get_market_data_with_fallback("AAPL")
        print(f"✅ Successfully fetched data for AAPL: ${data.get('current_price', 'N/A')}")
    except Exception as e:
        print(f"❌ Failed to fetch AAPL data: {e}")
    
    # Test multiple stocks
    print("\nTesting multiple stocks data fetch...")
    symbols = ["AAPL", "GOOGL", "MSFT", "TSLA"]
    try:
        multi_data = service.get_multiple_stocks_data(symbols)
        print(f"✅ Successfully fetched data for {len(multi_data)} symbols")
        for symbol, data in multi_data.items():
            print(f"  {symbol}: ${data.get('current_price', 'N/A')} ({data.get('change_percent', 0):.2f}%)")
    except Exception as e:
        print(f"❌ Failed to fetch multiple stocks: {e}")
    
    # Test sentiment analysis
    print("\nTesting sentiment analysis...")
    try:
        sentiment = service.get_market_sentiment_analysis(symbols)
        print(f"✅ Market sentiment: {sentiment.get('overall_sentiment', 'unknown')}")
    except Exception as e:
        print(f"❌ Failed sentiment analysis: {e}")
    
    # Test stock recommendations
    print("\nTesting stock recommendations...")
    try:
        recommendations = service.get_stock_recommendations("AAPL", {
            'risk_tolerance': 'medium',
            'investment_horizon': 'long_term',
            'trading_style': 'value'
        })
        print(f"✅ AAPL recommendation: {recommendations.get('recommendation', 'unknown')}")
    except Exception as e:
        print(f"❌ Failed recommendations: {e}")


if __name__ == "__main__":
    test_market_data_service()