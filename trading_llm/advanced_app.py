# Additional Flask endpoints and services for comprehensive trading LLM

from flask import Flask, request, jsonify
import google.generativeai as genai
import os
from supabase import create_client, Client
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
from functools import wraps
import logging
from typing import Dict, List, Optional
import requests

# Enhanced TradingAssistant class with more features
class AdvancedTradingAssistant:
    def __init__(self):
        self.supabase = supabase
        self.model = model
        
    def get_technical_indicators(self, symbol: str, period: str = "3mo") -> Dict:
        """Calculate comprehensive technical indicators"""
        try:
            ticker = yf.Ticker(symbol)
            data = ticker.history(period=period)
            
            if data.empty:
                return {}
            
            # Calculate various technical indicators
            close = data['Close']
            high = data['High']
            low = data['Low']
            volume = data['Volume']
            
            # Moving Averages
            ma_20 = close.rolling(window=20).mean().iloc[-1]
            ma_50 = close.rolling(window=50).mean().iloc[-1]
            ma_200 = close.rolling(window=200).mean().iloc[-1]
            
            # RSI
            delta = close.diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
            rs = gain / loss
            rsi = 100 - (100 / (1 + rs)).iloc[-1]
            
            # MACD
            ema_12 = close.ewm(span=12).mean()
            ema_26 = close.ewm(span=26).mean()
            macd = (ema_12 - ema_26).iloc[-1]
            macd_signal = (ema_12 - ema_26).ewm(span=9).mean().iloc[-1]
            macd_histogram = macd - macd_signal
            
            # Bollinger Bands
            bb_period = 20
            bb_std = close.rolling(window=bb_period).std()
            bb_middle = close.rolling(window=bb_period).mean()
            bb_upper = (bb_middle + (bb_std * 2)).iloc[-1]
            bb_lower = (bb_middle - (bb_std * 2)).iloc[-1]
            bb_middle = bb_middle.iloc[-1]
            
            # Volume indicators
            avg_volume = volume.rolling(window=20).mean().iloc[-1]
            current_volume = volume.iloc[-1]
            volume_ratio = current_volume / avg_volume if avg_volume > 0 else 0
            
            # Support and Resistance levels
            recent_highs = high.tail(50)
            recent_lows = low.tail(50)
            resistance = recent_highs.quantile(0.9)
            support = recent_lows.quantile(0.1)
            
            return {
                'symbol': symbol,
                'current_price': close.iloc[-1],
                'moving_averages': {
                    'ma_20': ma_20,
                    'ma_50': ma_50,
                    'ma_200': ma_200
                },
                'rsi': rsi,
                'macd': {
                    'macd': macd,
                    'signal': macd_signal,
                    'histogram': macd_histogram
                },
                'bollinger_bands': {
                    'upper': bb_upper,
                    'middle': bb_middle,
                    'lower': bb_lower
                },
                'volume': {
                    'current': current_volume,
                    'average': avg_volume,
                    'ratio': volume_ratio
                },
                'support_resistance': {
                    'support': support,
                    'resistance': resistance
                },
                'trend_analysis': {
                    'trend': self._determine_trend(ma_20, ma_50, ma_200),
                    'strength': self._calculate_trend_strength(close)
                }
            }
        except Exception as e:
            print(f"Error calculating technical indicators for {symbol}: {e}")
            return {}
    
    def _determine_trend(self, ma_20: float, ma_50: float, ma_200: float) -> str:
        """Determine overall trend based on moving averages"""
        if ma_20 > ma_50 > ma_200:
            return "strong_uptrend"
        elif ma_20 > ma_50:
            return "uptrend"
        elif ma_20 < ma_50 < ma_200:
            return "strong_downtrend"
        elif ma_20 < ma_50:
            return "downtrend"
        else:
            return "sideways"
    
    def _calculate_trend_strength(self, close_prices: pd.Series) -> float:
        """Calculate trend strength using linear regression slope"""
        try:
            x = np.arange(len(close_prices.tail(20)))
            y = close_prices.tail(20).values
            slope = np.polyfit(x, y, 1)[0]
            return float(slope)
        except:
            return 0.0
    
    def analyze_portfolio_risk(self, portfolio_data: Dict) -> Dict:
        """Comprehensive portfolio risk analysis"""
        if not portfolio_data or not portfolio_data.get('positions'):
            return {}
        
        positions = portfolio_data['positions']
        total_value = sum(pos['quantity'] * pos['current_price'] for pos in positions)
        
        # Position concentration risk
        position_weights = [(pos['quantity'] * pos['current_price']) / total_value for pos in positions]
        max_position_weight = max(position_weights) if position_weights else 0
        
        # Sector concentration
        sector_allocation = {}
        for pos in positions:
            sector = pos.get('sector', 'Unknown')
            value = pos['quantity'] * pos['current_price']
            sector_allocation[sector] = sector_allocation.get(sector, 0) + value
        
        sector_weights = [value / total_value for value in sector_allocation.values()]
        max_sector_weight = max(sector_weights) if sector_weights else 0
        
        # Calculate portfolio beta (simplified - assuming market beta of 1.0 for sectors)
        sector_betas = {
            'Technology': 1.3,
            'Healthcare': 0.9,
            'Finance': 1.1,
            'Consumer': 1.0,
            'Energy': 1.4,
            'Utilities': 0.7,
            'Materials': 1.2,
            'Industrial': 1.1,
            'Real Estate': 0.8,
            'Telecommunications': 0.8
        }
        
        portfolio_beta = sum(
            (sector_allocation.get(sector, 0) / total_value) * beta 
            for sector, beta in sector_betas.items()
        )
        
        # Risk score calculation
        risk_factors = {
            'concentration_risk': max_position_weight * 100,  # Higher is riskier
            'sector_concentration': max_sector_weight * 100,
            'portfolio_beta': abs(portfolio_beta - 1.0) * 100,  # Deviation from market
            'position_count': len(positions)  # Lower count = higher concentration risk
        }
        
        # Overall risk score (0-100, higher is riskier)
        risk_score = (
            risk_factors['concentration_risk'] * 0.3 +
            risk_factors['sector_concentration'] * 0.3 +
            risk_factors['portfolio_beta'] * 0.2 +
            max(0, (10 - risk_factors['position_count']) * 5) * 0.2
        )
        
        return {
            'risk_score': min(100, max(0, risk_score)),
            'risk_level': self._categorize_risk_level(risk_score),
            'portfolio_beta': portfolio_beta,
            'max_position_weight': max_position_weight * 100,
            'max_sector_weight': max_sector_weight * 100,
            'sector_allocation': {k: (v/total_value)*100 for k, v in sector_allocation.items()},
            'risk_factors': risk_factors,
            'recommendations': self._generate_risk_recommendations(risk_score, risk_factors)
        }
    
    def _categorize_risk_level(self, risk_score: float) -> str:
        """Categorize risk level based on score"""
        if risk_score < 20:
            return "Low"
        elif risk_score < 40:
            return "Moderate"
        elif risk_score < 60:
            return "High"
        else:
            return "Very High"
    
    def _generate_risk_recommendations(self, risk_score: float, risk_factors: Dict) -> List[str]:
        """Generate risk management recommendations"""
        recommendations = []
        
        if risk_factors['concentration_risk'] > 30:
            recommendations.append("Consider diversifying - your largest position exceeds 30% of portfolio")
        
        if risk_factors['sector_concentration'] > 40:
            recommendations.append("High sector concentration detected - consider diversifying across sectors")
        
        if risk_factors['position_count'] < 5:
            recommendations.append("Consider adding more positions to reduce concentration risk")
        
        if risk_factors['portfolio_beta'] > 150:
            recommendations.append("Portfolio is highly volatile compared to market - consider defensive stocks")
        
        return recommendations
    
    def generate_trading_signals(self, symbols: List[str]) -> Dict:
        """Generate AI-powered trading signals for given symbols"""
        signals = {}
        
        for symbol in symbols:
            try:
                # Get technical indicators
                tech_data = self.get_technical_indicators(symbol)
                if not tech_data:
                    continue
                
                # Generate signal based on technical analysis
                signal = self._calculate_trading_signal(tech_data)
                
                # Get AI analysis for the signal
                ai_analysis = self._get_ai_signal_analysis(symbol, tech_data, signal)
                
                signals[symbol] = {
                    'signal': signal['action'],
                    'strength': signal['strength'],
                    'confidence': signal['confidence'],
                    'technical_data': tech_data,
                    'ai_analysis': ai_analysis,
                    'timestamp': datetime.now().isoformat()
                }
            except Exception as e:
                print(f"Error generating signal for {symbol}: {e}")
                continue
        
        return signals
    
    def _calculate_trading_signal(self, tech_data: Dict) -> Dict:
        """Calculate trading signal based on technical indicators"""
        score = 0
        factors = []
        
        # RSI analysis
        rsi = tech_data.get('rsi', 50)
        if rsi > 70:
            score -= 2
            factors.append("RSI overbought")
        elif rsi < 30:
            score += 2
            factors.append("RSI oversold")
        elif 40 <= rsi <= 60:
            score += 1
            factors.append("RSI neutral")
        
        # Moving average analysis
        ma_data = tech_data.get('moving_averages', {})
        current_price = tech_data.get('current_price', 0)
        
        if current_price > ma_data.get('ma_20', 0) > ma_data.get('ma_50', 0):
            score += 2
            factors.append("Price above moving averages")
        elif current_price < ma_data.get('ma_20', 0) < ma_data.get('ma_50', 0):
            score -= 2
            factors.append("Price below moving averages")
        
        # MACD analysis
        macd_data = tech_data.get('macd', {})
        if macd_data.get('macd', 0) > macd_data.get('signal', 0):
            score += 1
            factors.append("MACD bullish")
        else:
            score -= 1
            factors.append("MACD bearish")
        
        # Volume analysis
        volume_data = tech_data.get('volume', {})
        if volume_data.get('ratio', 0) > 1.5:
            score += 1
            factors.append("High volume")
        
        # Determine action
        if score >= 3:
            action = "BUY"
            strength = "Strong"
        elif score >= 1:
            action = "BUY"
            strength = "Weak"
        elif score <= -3:
            action = "SELL"
            strength = "Strong"
        elif score <= -1:
            action = "SELL"
            strength = "Weak"
        else:
            action = "HOLD"
            strength = "Neutral"
        
        confidence = min(100, abs(score) * 15)
        
        return {
            'action': action,
            'strength': strength,
            'confidence': confidence,
            'score': score,
            'factors': factors
        }
    
    def _get_ai_signal_analysis(self, symbol: str, tech_data: Dict, signal: Dict) -> str:
        """Get AI analysis for the trading signal"""
        prompt = f"""
        As a professional trading analyst, provide a brief analysis of the trading signal for {symbol}:
        
        Technical Data:
        - Current Price: ${tech_data.get('current_price', 0):.2f}
        - RSI: {tech_data.get('rsi', 0):.1f}
        - MACD: {tech_data.get('macd', {}).get('macd', 0):.3f}
        - Trend: {tech_data.get('trend_analysis', {}).get('trend', 'unknown')}
        
        Signal Generated:
        - Action: {signal['action']}
        - Strength: {signal['strength']}
        - Confidence: {signal['confidence']}%
        - Key Factors: {', '.join(signal['factors'])}
        
        Provide a 2-3 sentence analysis explaining the reasoning behind this signal and any important considerations.
        """
        
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Analysis unavailable: {str(e)}"

# Initialize enhanced assistant
enhanced_assistant = AdvancedTradingAssistant()

# Additional Flask endpoints

@app.route('/api/technical-analysis/<symbol>', methods=['GET'])
def technical_analysis(symbol):
    """Get comprehensive technical analysis for a symbol"""
    try:
        period = request.args.get('period', '3mo')
        tech_data = enhanced_assistant.get_technical_indicators(symbol.upper(), period)
        
        if not tech_data:
            return jsonify({'success': False, 'error': f'Unable to fetch data for {symbol}'}), 404
        
        return jsonify({
            'success': True,
            'symbol': symbol.upper(),
            'technical_analysis': tech_data,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/trading-signals', methods=['POST'])
def trading_signals():
    """Generate trading signals for multiple symbols"""
    try:
        data = request.json
        symbols = data.get('symbols', [])
        
        if not symbols:
            return jsonify({'success': False, 'error': 'No symbols provided'}), 400
        
        signals = enhanced_assistant.generate_trading_signals(symbols)
        
        return jsonify({
            'success': True,
            'signals': signals,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/risk-analysis/<trader_id>', methods=['GET'])
def risk_analysis(trader_id):
    """Get comprehensive risk analysis for trader's portfolio"""
    try:
        portfolio_data = assistant.get_trader_portfolio(trader_id)
        if not portfolio_data:
            return jsonify({'success': False, 'error': 'Trader not found'}), 404
        
        risk_analysis = enhanced_assistant.analyze_portfolio_risk(portfolio_data)
        
        return jsonify({
            'success': True,
            'trader_id': trader_id,
            'risk_analysis': risk_analysis,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/portfolio-optimization/<trader_id>', methods=['POST'])
def portfolio_optimization(trader_id):
    """Get AI-powered portfolio optimization suggestions"""
    try:
        data = request.json
        target_allocation = data.get('target_allocation', {})
        risk_tolerance = data.get('risk_tolerance', 'medium')
        
        portfolio_data = assistant.get_trader_portfolio(trader_id)
        if not portfolio_data:
            return jsonify({'success': False, 'error': 'Trader not found'}), 404
        
        risk_analysis = enhanced_assistant.analyze_portfolio_risk(portfolio_data)
        
        # Generate optimization recommendations
        optimization_prompt = f"""
        As a portfolio optimization expert, analyze this trader's portfolio and provide specific optimization recommendations:
        
        Current Portfolio:
        - Total Value: ${sum(pos['quantity'] * pos['current_price'] for pos in portfolio_data['positions']):,.2f}
        - Positions: {len(portfolio_data['positions'])}
        - Risk Score: {risk_analysis.get('risk_score', 0):.1f}/100
        - Risk Level: {risk_analysis.get('risk_level', 'Unknown')}
        
        Current Sector Allocation:
        {json.dumps(risk_analysis.get('sector_allocation', {}), indent=2)}
        
        Risk Factors:
        {json.dumps(risk_analysis.get('risk_factors', {}), indent=2)}
        
        Trader Profile:
        - Risk Tolerance: {risk_tolerance}
        - Target Allocation: {json.dumps(target_allocation, indent=2)}
        
        Provide specific recommendations for:
        1. Position sizing adjustments
        2. Sector rebalancing
        3. New positions to consider
        4. Positions to reduce/exit
        5. Risk management improvements
        
        Be specific with percentages and reasoning.
        """
        
        response = model.generate_content(optimization_prompt)
        
        return jsonify({
            'success': True,
            'trader_id': trader_id,
            'current_risk_analysis': risk_analysis,
            'optimization_recommendations': response.text,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/market-sentiment', methods=['GET'])
def market_sentiment():
    """Get AI-powered overall market sentiment analysis"""
    try:
        # Get data for major market indicators
        major_symbols = ['SPY', 'QQQ', 'IWM', 'VIX', '^GSPC', '^IXIC', '^RUT']
        market_data = assistant.get_market_data(major_symbols)
        
        # Get additional market indicators
        sentiment_data = {
            'market_indices': market_data,
            'fear_greed_index': 'VIX' in market_data and market_data['VIX']['current_price'] or 'N/A',
            'analysis_timestamp': datetime.now().isoformat()
        }
        
        sentiment_prompt = f"""
        As a market analyst, provide a comprehensive market sentiment analysis based on current data:
        
        Market Data:
        {json.dumps(market_data, indent=2, default=str)}
        
        Please analyze:
        1. Overall market sentiment (Bullish/Bearish/Neutral)
        2. Key market drivers and concerns
        3. Sector rotation trends
        4. Volatility assessment
        5. Short-term and medium-term outlook
        6. Key levels to watch
        7. Risk factors for traders
        
        Provide actionable insights for different trading styles (day trading, swing trading, long-term investing).
        """
        
        response = model.generate_content(sentiment_prompt)
        
        return jsonify({
            'success': True,
            'market_sentiment': response.text,
            'market_data': sentiment_data,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/earnings-calendar', methods=['GET'])
def earnings_calendar():
    """Get upcoming earnings and their potential impact"""
    try:
        # This would typically integrate with financial data APIs
        # For demo purposes, we'll use a simple implementation
        symbols = request.args.get('symbols', 'AAPL,GOOGL,MSFT,AMZN,TSLA').split(',')
        
        earnings_info = {}
        for symbol in symbols:
            try:
                ticker = yf.Ticker(symbol)
                calendar = ticker.calendar
                if calendar is not None and not calendar.empty:
                    earnings_info[symbol] = {
                        'next_earnings_date': calendar.index[0].strftime('%Y-%m-%d') if len(calendar.index) > 0 else 'N/A',
                        'earnings_estimate': 'Available in calendar data'
                    }
                else:
                    earnings_info[symbol] = {
                        'next_earnings_date': 'N/A',
                        'earnings_estimate': 'N/A'
                    }
            except:
                earnings_info[symbol] = {
                    'next_earnings_date': 'N/A',
                    'earnings_estimate': 'N/A'
                }
        
        # Generate AI analysis of earnings impact
        earnings_prompt = f"""
        As an earnings analyst, provide insights on upcoming earnings for these stocks:
        
        {json.dumps(earnings_info, indent=2)}
        
        Analyze:
        1. Which earnings are most likely to move markets
        2. Sector implications of these earnings
        3. Trading strategies around earnings dates
        4. Risk management for earnings plays
        5. Historical earnings patterns for these stocks
        
        Provide actionable advice for traders holding or considering these positions.
        """
        
        response = model.generate_content(earnings_prompt)
        
        return jsonify({
            'success': True,
            'earnings_calendar': earnings_info,
            'ai_analysis': response.text,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/news-sentiment/<symbol>', methods=['GET'])
def news_sentiment(symbol):
    """Get news sentiment analysis for a specific symbol"""
    try:
        # This would integrate with news APIs in production
        # For demo, we'll provide a framework
        
        news_prompt = f"""
        Analyze the current news sentiment for {symbol.upper()}. Based on recent market conditions and typical news patterns for this stock, provide:
        
        1. Overall news sentiment (Positive/Negative/Neutral)
        2. Key themes in recent news
        3. Potential catalysts or concerns
        4. Impact on stock price direction
        5. Recommendations for traders
        
        Consider factors like:
        - Earnings reports and guidance
        - Product launches or updates  
        - Regulatory changes
        - Market sector trends
        - Analyst upgrades/downgrades
        
        Provide a balanced analysis with specific trading implications.
        """
        
        response = model.generate_content(news_prompt)
        
        return jsonify({
            'success': True,
            'symbol': symbol.upper(),
            'news_sentiment_analysis': response.text,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/backtesting/<trader_id>', methods=['POST'])
def backtesting(trader_id):
    """Perform backtesting analysis on trading strategies"""
    try:
        data = request.json
        strategy_params = data.get('strategy_params', {})
        symbols = data.get('symbols', ['AAPL'])
        start_date = data.get('start_date', (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d'))
        end_date = data.get('end_date', datetime.now().strftime('%Y-%m-%d'))
        
        # Get historical data for backtesting
        backtest_results = {}
        
        for symbol in symbols:
            try:
                ticker = yf.Ticker(symbol)
                hist_data = ticker.history(start=start_date, end=end_date)
                
                if hist_data.empty:
                    continue
                
                # Simple moving average crossover strategy for demo
                hist_data['MA_20'] = hist_data['Close'].rolling(window=20).mean()
                hist_data['MA_50'] = hist_data['Close'].rolling(window=50).mean()
                
                # Generate buy/sell signals
                hist_data['Signal'] = 0
                hist_data.loc[hist_data['MA_20'] > hist_data['MA_50'], 'Signal'] = 1
                hist_data.loc[hist_data['MA_20'] < hist_data['MA_50'], 'Signal'] = -1
                
                # Calculate returns
                hist_data['Returns'] = hist_data['Close'].pct_change()
                hist_data['Strategy_Returns'] = hist_data['Signal'].shift(1) * hist_data['Returns']
                
                # Performance metrics
                total_return = (hist_data['Strategy_Returns'] + 1).prod() - 1
                sharpe_ratio = hist_data['Strategy_Returns'].mean() / hist_data['Strategy_Returns'].std() * np.sqrt(252)
                max_drawdown = (hist_data['Strategy_Returns'].cumsum() - hist_data['Strategy_Returns'].cumsum().expanding().max()).min()
                
                backtest_results[symbol] = {
                    'total_return': float(total_return),
                    'sharpe_ratio': float(sharpe_ratio) if not np.isnan(sharpe_ratio) else 0,
                    'max_drawdown': float(max_drawdown),
                    'total_trades': int(hist_data['Signal'].diff().abs().sum() / 2),
                    'win_rate': len(hist_data[hist_data['Strategy_Returns'] > 0]) / len(hist_data[hist_data['Strategy_Returns'] != 0]) * 100 if len(hist_data[hist_data['Strategy_Returns'] != 0]) > 0 else 0
                }
                
            except Exception as e:
                print(f"Error backtesting {symbol}: {e}")
                continue
        
        # Generate AI analysis of backtest results
        backtest_prompt = f"""
        Analyze these backtesting results for trader {trader_id}:
        
        Strategy Parameters: {json.dumps(strategy_params, indent=2)}
        Period: {start_date} to {end_date}
        
        Results by Symbol:
        {json.dumps(backtest_results, indent=2)}
        
        Provide analysis on:
        1. Strategy performance assessment
        2. Risk-adjusted returns evaluation
        3. Consistency across different symbols
        4. Recommendations for strategy improvement
        5. Market conditions where this strategy works best
        6. Risk management suggestions
        
        Be specific about strengths and weaknesses of the strategy.
        """
        
        response = model.generate_content(backtest_prompt)
        
        return jsonify({
            'success': True,
            'trader_id': trader_id,
            'backtest_results': backtest_results,
            'strategy_analysis': response.text,
            'period': f"{start_date} to {end_date}",
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'error': 'Internal server error'}), 500

# Rate limiting (basic implementation)
from collections import defaultdict
import time

request_counts = defaultdict(list)

def rate_limit(max_requests=100, window=3600):  # 100 requests per hour
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            client_ip = request.remote_addr
            now = time.time()
            
            # Clean old requests
            request_counts[client_ip] = [req_time for req_time in request_counts[client_ip] if now - req_time < window]
            
            # Check rate limit
            if len(request_counts[client_ip]) >= max_requests:
                return jsonify({'success': False, 'error': 'Rate limit exceeded'}), 429
            
            # Add current request
            request_counts[client_ip].append(now)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Apply rate limiting to sensitive endpoints
app.route('/api/recommendations/<trader_id>', methods=['POST'])(rate_limit(20, 3600)(get_recommendations))
app.route('/api/trading-signals', methods=['POST'])(rate_limit(30, 3600)(trading_signals))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)