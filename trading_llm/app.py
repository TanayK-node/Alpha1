
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from supabase import create_client, Client
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
from dotenv import load_dotenv
from market_data_service import MarketDataService  # Import our enhanced service
import logging

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

# Initialize clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

# Initialize enhanced market data service (use Finnhub primary with provided key if env missing)
FINNHUB_API_KEY = os.getenv('FINNHUB_API_KEY') or 'd31talhr01qsprr2hh0gd31talhr01qsprr2hh10'
market_service = MarketDataService(gemini_api_key=GEMINI_API_KEY, finnhub_api_key=FINNHUB_API_KEY)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedTradingAssistant:
    def __init__(self):
        self.supabase = supabase
        self.model = model
        self.market_service = market_service
    
    def get_trader_portfolio(self, trader_id):
        """Fetch trader's portfolio data"""
        try:
            # Get trader basic info
            trader_response = self.supabase.table('traders').select('*').eq('trader_id', trader_id).execute()
            if not trader_response.data:
                return None
            
            trader = trader_response.data[0]
            
            # Get positions
            positions_response = self.supabase.table('positions').select('*').eq('trader_id', trader_id).execute()
            positions = positions_response.data
            
            # Get recent trades
            trades_response = self.supabase.table('trades').select('*').eq('trader_id', trader_id).order('trade_date', desc=True).limit(50).execute()
            trades = trades_response.data
            
            # Calculate P&L
            total_pnl = sum(trade['realized_pnl'] for trade in trades if trade['realized_pnl'])
            
            return {
                'trader': trader,
                'positions': positions,
                'trades': trades,
                'total_pnl': total_pnl
            }
        except Exception as e:
            logger.error(f"Error fetching portfolio: {e}")
            return None
    
    def get_enhanced_market_data(self, symbols, period="1d"):
        """Get market data using the enhanced service with fallbacks"""
        try:
            if isinstance(symbols, str):
                symbols = [symbols]
            
            logger.info(f"Fetching enhanced market data for: {symbols}")
            market_data = self.market_service.get_multiple_stocks_data(symbols, period)
            
            # Transform data for compatibility with existing code
            transformed_data = {}
            for symbol, data in market_data.items():
                transformed_data[symbol] = {
                    'current_price': data.get('current_price', 0),
                    'change_percent': data.get('change_percent', 0),
                    'volume': data.get('volume', 0),
                    'market_cap': data.get('market_cap'),
                    'pe_ratio': data.get('pe_ratio'),
                    'sector': data.get('sector', 'Unknown'),
                    'technical_indicators': data.get('technical_indicators', {}),
                    'source': data.get('source', 'unknown'),
                    'timestamp': data.get('timestamp'),
                    'error': data.get('error')  # Include error info if present
                }
                
                # Add AI insights if available (from Gemini)
                if 'ai_insights' in data:
                    transformed_data[symbol]['ai_insights'] = data['ai_insights']
                if 'fundamental_analysis' in data:
                    transformed_data[symbol]['fundamental_analysis'] = data['fundamental_analysis']
            
            return transformed_data
        except Exception as e:
            logger.error(f"Error fetching enhanced market data: {e}")
            return {}
    
    def calculate_portfolio_metrics(self, portfolio_data):
        """Calculate advanced portfolio metrics"""
        if not portfolio_data:
            return {}
        
        positions = portfolio_data['positions']
        trades = portfolio_data['trades']
        
        # Portfolio value
        total_value = sum(pos['quantity'] * pos['current_price'] for pos in positions)
        
        # Sector allocation
        sector_allocation = {}
        for pos in positions:
            sector = pos.get('sector', 'Unknown')
            sector_allocation[sector] = sector_allocation.get(sector, 0) + (pos['quantity'] * pos['current_price'])
        
        # Risk metrics
        winning_trades = [t for t in trades if t['realized_pnl'] > 0]
        losing_trades = [t for t in trades if t['realized_pnl'] < 0]
        
        win_rate = len(winning_trades) / len(trades) * 100 if trades else 0
        avg_win = np.mean([t['realized_pnl'] for t in winning_trades]) if winning_trades else 0
        avg_loss = np.mean([t['realized_pnl'] for t in losing_trades]) if losing_trades else 0
        
        return {
            'total_portfolio_value': total_value,
            'sector_allocation': sector_allocation,
            'win_rate': win_rate,
            'avg_win': avg_win,
            'avg_loss': avg_loss,
            'total_trades': len(trades),
            'profit_factor': abs(avg_win / avg_loss) if avg_loss != 0 else 0
        }
    
    def generate_enhanced_analysis(self, market_data):
        """Generate AI-powered market analysis with enhanced data"""
        # Check data sources and quality
        data_sources = [data.get('source', 'unknown') for data in market_data.values()]
        has_errors = any(data.get('error') for data in market_data.values())
        
        source_info = f"Data Sources: {', '.join(set(data_sources))}"
        if has_errors:
            source_info += " (Some data sources experienced issues - analysis may be limited)"
        
        prompt = f"""
        As an expert trading analyst, provide a comprehensive market analysis based on the following enhanced data:
        
        {source_info}
        
        Market Data: {json.dumps(market_data, indent=2, default=str)}
        
        Please provide:
        1. Overall market sentiment and trend analysis
        2. Key technical patterns and indicators
        3. Sector-specific insights
        4. Risk factors and opportunities
        5. Short-term trading recommendations
        6. Data quality assessment and reliability notes
        
        Consider the data sources used and note any limitations in your analysis.
        Keep the analysis concise but actionable.
        """
        
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Error generating enhanced analysis: {e}")
            return f"Error generating market analysis: {e}"
    
    def generate_personalized_recommendations(self, trader_id, portfolio_data, market_data, user_query=""):
        """Generate personalized trading recommendations with enhanced market data"""
        metrics = self.calculate_portfolio_metrics(portfolio_data)
        
        # Check data quality
        data_quality_note = ""
        error_symbols = [symbol for symbol, data in market_data.items() if data.get('error')]
        if error_symbols:
            data_quality_note = f"Note: Limited data available for {', '.join(error_symbols)} due to API issues."
        
        prompt = f"""
        As a personalized AI trading advisor, analyze the following trader's portfolio and provide recommendations:
        
        Trader ID: {trader_id}
        Portfolio Summary:
        - Total Value: ${metrics.get('total_portfolio_value', 0):,.2f}
        - Total P&L: ${portfolio_data.get('total_pnl', 0):,.2f}
        - Win Rate: {metrics.get('win_rate', 0):.1f}%
        - Total Trades: {metrics.get('total_trades', 0)}
        - Profit Factor: {metrics.get('profit_factor', 0):.2f}
        
        Current Positions: {json.dumps(portfolio_data['positions'][:5], indent=2)}
        Recent Trades: {json.dumps(portfolio_data['trades'][:10], indent=2)}
        
        Enhanced Market Data: {json.dumps(market_data, indent=2, default=str)}
        
        Sector Allocation: {json.dumps(metrics.get('sector_allocation', {}), indent=2)}
        
        Trader's Question: "{user_query}"
        
        {data_quality_note}
        
        Provide personalized recommendations including:
        1. Portfolio optimization suggestions based on current market conditions
        2. Risk management advice considering data reliability
        3. Specific trade ideas with technical and AI insights
        4. Position sizing recommendations
        5. Sector diversification suggestions
        6. Market timing considerations
        
        Make recommendations specific to their trading patterns, risk profile, and current market data quality.
        """
        
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Error generating personalized recommendations: {e}")
            return f"Error generating recommendations: {e}"

# Initialize enhanced assistant
assistant = EnhancedTradingAssistant()

@app.route('/health', methods=['GET'])
def health_check():
    """Enhanced health check with service status"""
    try:
        # Test market data service
        test_data = market_service.get_market_data_with_fallback("AAPL", "1d")
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'services': {
                'supabase': 'connected' if supabase else 'error',
                'gemini': 'connected' if GEMINI_API_KEY else 'missing_key',
                'market_data': 'working' if test_data and not test_data.get('error') else 'limited',
                'market_data_source': test_data.get('source', 'unknown') if test_data else 'none'
            },
            'cache_stats': {
                'cached_items': len(market_service.cache),
                'cache_timeout': market_service.cache_timeout
            }
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/market-analysis', methods=['GET'])
def enhanced_market_analysis():
    """Get enhanced AI-powered market analysis with multiple data sources"""
    try:
        # Get symbols from request or use defaults
        symbols = request.args.get('symbols', 'AAPL,GOOGL,MSFT,TSLA,NVDA').split(',')
        symbols = [s.strip().upper() for s in symbols]
        
        logger.info(f"Fetching enhanced market analysis for: {symbols}")
        
        # Get enhanced market data
        market_data = assistant.get_enhanced_market_data(symbols)
        
        if not market_data:
            return jsonify({
                'success': False, 
                'error': 'Unable to fetch market data from any source'
            }), 503
        
        # Generate enhanced analysis
        analysis = assistant.generate_enhanced_analysis(market_data)
        
        # Get market sentiment if Gemini is available
        sentiment_analysis = {}
        try:
            sentiment_analysis = market_service.get_market_sentiment_analysis(symbols)
        except Exception as e:
            logger.warning(f"Could not get sentiment analysis: {e}")
            sentiment_analysis = {'error': str(e)}
        
        return jsonify({
            'success': True,
            'market_data': market_data,
            'analysis': analysis,
            'sentiment_analysis': sentiment_analysis,
            'data_sources': list(set(data.get('source', 'unknown') for data in market_data.values())),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error in enhanced market analysis: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/recommendations/<trader_id>', methods=['POST'])
def get_enhanced_recommendations(trader_id):
    """Get enhanced personalized trading recommendations"""
    try:
        data = request.json or {}
        user_query = data.get('query', '')
        symbols = data.get('symbols', ['AAPL', 'GOOGL', 'MSFT'])
        
        logger.info(f"Getting enhanced recommendations for trader {trader_id}")
        
        # Get portfolio data
        portfolio_data = assistant.get_trader_portfolio(trader_id)
        if not portfolio_data:
            return jsonify({'success': False, 'error': 'Trader not found'}), 404
        
        # Get enhanced market data for relevant symbols
        market_data = assistant.get_enhanced_market_data(symbols)
        
        # Generate enhanced recommendations
        recommendations = assistant.generate_personalized_recommendations(
            trader_id, portfolio_data, market_data, user_query
        )
        
        # Get individual stock recommendations if requested
        stock_recommendations = {}
        if data.get('include_stock_recommendations', True):
            for symbol in symbols[:3]:  # Limit to avoid rate limits
                try:
                    trader_profile = portfolio_data['trader']
                    stock_rec = market_service.get_stock_recommendations(symbol, {
                        'risk_tolerance': trader_profile.get('risk_tolerance', 'medium'),
                        'investment_horizon': trader_profile.get('investment_horizon', 'medium'),
                        'trading_style': trader_profile.get('trading_style', 'swing'),
                        'portfolio_value': assistant.calculate_portfolio_metrics(portfolio_data).get('total_portfolio_value', 10000)
                    })
                    stock_recommendations[symbol] = stock_rec
                except Exception as e:
                    logger.warning(f"Could not get recommendations for {symbol}: {e}")
                    stock_recommendations[symbol] = {'error': str(e)}
        
        # Store the query in database for learning
        try:
            supabase.table('queries').insert({
                'trader_id': trader_id,
                'query': user_query,
                'response': recommendations,
                'market_data_snapshot': market_data,
                'timestamp': datetime.now().isoformat()
            }).execute()
        except Exception as e:
            logger.warning(f"Could not store query: {e}")
        
        return jsonify({
            'success': True,
            'trader_id': trader_id,
            'recommendations': recommendations,
            'stock_recommendations': stock_recommendations,
            'portfolio_summary': assistant.calculate_portfolio_metrics(portfolio_data),
            'market_data_summary': {
                'symbols_analyzed': list(market_data.keys()),
                'data_sources': list(set(data.get('source', 'unknown') for data in market_data.values())),
                'data_quality': 'good' if not any(data.get('error') for data in market_data.values()) else 'limited'
            },
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error getting enhanced recommendations: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/stock-data/<symbol>', methods=['GET'])
def get_stock_data(symbol):
    """Get detailed stock data with multiple sources"""
    try:
        period = request.args.get('period', '1d')
        include_recommendations = request.args.get('recommendations', 'false').lower() == 'true'
        
        logger.info(f"Fetching stock data for {symbol}")
        
        # Get enhanced market data
        stock_data = market_service.get_market_data_with_fallback(symbol.upper(), period)
        
        if not stock_data:
            return jsonify({'success': False, 'error': f'No data available for {symbol}'}), 404
        
        response_data = {
            'success': True,
            'symbol': symbol.upper(),
            'data': stock_data,
            'timestamp': datetime.now().isoformat()
        }
        
        # Add recommendations if requested
        if include_recommendations:
            try:
                recommendations = market_service.get_stock_recommendations(symbol.upper())
                response_data['recommendations'] = recommendations
            except Exception as e:
                logger.warning(f"Could not get recommendations for {symbol}: {e}")
                response_data['recommendations'] = {'error': str(e)}
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error fetching stock data for {symbol}: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/market-sentiment', methods=['GET'])
def get_market_sentiment():
    """Get AI-powered market sentiment analysis"""
    try:
        symbols = request.args.get('symbols', 'SPY,QQQ,DIA,IWM,VIX').split(',')
        symbols = [s.strip().upper() for s in symbols]
        
        logger.info(f"Getting market sentiment for: {symbols}")
        
        # Get sentiment analysis
        sentiment_data = market_service.get_market_sentiment_analysis(symbols)
        
        # Get basic market data for context
        market_data = assistant.get_enhanced_market_data(symbols)
        
        return jsonify({
            'success': True,
            'sentiment_analysis': sentiment_data,
            'market_data': market_data,
            'analyzed_symbols': symbols,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting market sentiment: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/portfolio/<trader_id>', methods=['GET'])
def get_portfolio(trader_id):
    """Get trader's portfolio with enhanced market data"""
    try:
        portfolio_data = assistant.get_trader_portfolio(trader_id)
        if not portfolio_data:
            return jsonify({'success': False, 'error': 'Trader not found'}), 404
        
        # Get current market data for positions
        position_symbols = [pos['symbol'] for pos in portfolio_data['positions']]
        if position_symbols:
            current_market_data = assistant.get_enhanced_market_data(position_symbols)
            
            # Update position data with current market prices and insights
            for position in portfolio_data['positions']:
                symbol = position['symbol']
                if symbol in current_market_data:
                    market_info = current_market_data[symbol]
                    position['current_market_price'] = market_info.get('current_price')
                    position['market_change_percent'] = market_info.get('change_percent')
                    position['data_source'] = market_info.get('source')
                    position['ai_insights'] = market_info.get('ai_insights', {})
        
        metrics = assistant.calculate_portfolio_metrics(portfolio_data)
        
        return jsonify({
            'success': True,
            'trader_id': trader_id,
            'portfolio': portfolio_data,
            'metrics': metrics,
            'market_data_quality': 'good' if position_symbols and not any(
                current_market_data.get(s, {}).get('error') for s in position_symbols
            ) else 'limited',
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error fetching portfolio for {trader_id}: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/cache-status', methods=['GET'])
def get_cache_status():
    """Get cache status and statistics"""
    try:
        cache_stats = {
            'total_cached_items': len(market_service.cache),
            'cache_timeout_seconds': market_service.cache_timeout,
            'cached_symbols': [],
            'cache_hit_info': {}
        }
        
        for cache_key, cache_data in market_service.cache.items():
            parts = cache_key.split('_')
            if len(parts) >= 2:
                source = parts[0]
                symbol = parts[1]
                cache_stats['cached_symbols'].append(f"{symbol} ({source})")
                cache_stats['cache_hit_info'][cache_key] = {
                    'timestamp': cache_data.get('timestamp', 0),
                    'age_seconds': time.time() - cache_data.get('timestamp', 0)
                }
        
        return jsonify({
            'success': True,
            'cache_statistics': cache_stats,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/clear-cache', methods=['POST'])
def clear_cache():
    """Clear the market data cache"""
    try:
        cache_size_before = len(market_service.cache)
        market_service.cache.clear()
        
        return jsonify({
            'success': True,
            'message': f'Cache cleared. Removed {cache_size_before} items.',
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

@app.errorhandler(503)
def service_unavailable(error):
    return jsonify({'success': False, 'error': 'Service temporarily unavailable'}), 503

if __name__ == '__main__':
    logger.info("Starting Enhanced Trading Assistant Flask App...")
    logger.info(f"Market Data Service initialized with Gemini: {'Yes' if GEMINI_API_KEY else 'No'}")
    # Run on 5001 to avoid clashing with the main backend on 5000
    app.run(debug=True, host='0.0.0.0', port=5001)