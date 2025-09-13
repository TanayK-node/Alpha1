from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf
from backtesting import Backtest, Strategy
from backtesting.lib import crossover
from backtesting.test import SMA
import pandas as pd
import math
import numpy as np
from scipy import stats

app = Flask(__name__)
CORS(app)

# -------- Safe float helper --------
def safe_float(value):
    try:
        f = float(value)
        return f if math.isfinite(f) else 0.0
    except:
        return 0.0


# -------- Strategy --------
# -------- Buy and Hold Strategy --------
class BuyAndHold(Strategy):
    def init(self):
        self.bought = False
    
    def next(self):
        # Buy on first day and hold
        if not self.bought:
            self.buy()
            self.bought = True


# -------- Moving Average Crossover Strategy --------
# -------- Fixed Moving Average Crossover Strategy --------
class MovingAverageCrossover(Strategy):
    short_window = 20
    long_window = 50
    
    def init(self):
        self.short_ma = self.I(SMA, self.data.Close, self.short_window)
        self.long_ma = self.I(SMA, self.data.Close, self.long_window)
    
    def next(self):
        # Buy when short MA crosses above long MA
        if crossover(self.short_ma, self.long_ma):
            # Close any existing position first
            if self.position:
                self.position.close()
            # Then open new long position
            self.buy()
            
        # Sell when short MA crosses below long MA
        elif crossover(self.long_ma, self.short_ma):
            # Close any existing position
            if self.position:
                self.position.close()


# -------- Alternative: Long/Short Strategy --------
class MovingAverageLongShort(Strategy):
    short_window = 20
    long_window = 50
    
    def init(self):
        self.short_ma = self.I(SMA, self.data.Close, self.short_window)
        self.long_ma = self.I(SMA, self.data.Close, self.long_window)
    
    def next(self):
        # Buy when short MA crosses above long MA
        if crossover(self.short_ma, self.long_ma):
            # Close any existing position and go long
            if self.position.is_short:
                self.position.close()
            if not self.position.is_long:
                self.buy()
                
        # Sell when short MA crosses below long MA  
        elif crossover(self.long_ma, self.short_ma):
            # Close any existing position and go short
            if self.position.is_long:
                self.position.close()
            if not self.position.is_short:
                self.sell()  # This opens a short position


# -------- Simple RSI Strategy (Multiple Trades Example) --------
class RSIStrategy(Strategy):
    rsi_window = 14
    oversold = 30
    overbought = 70
    
    def init(self):
        self.rsi = self.I(self.calculate_rsi, self.data.Close, self.rsi_window)
    
    def calculate_rsi(self, prices, window):
        """Calculate RSI indicator"""
        prices = pd.Series(prices)
        delta = prices.diff()
        gain = delta.where(delta > 0, 0).rolling(window=window).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi.fillna(50)
    
    def next(self):
        # Buy when RSI indicates oversold
        if self.rsi[-1] < self.oversold:
            if not self.position:
                self.buy()
                
        # Sell when RSI indicates overbought
        elif self.rsi[-1] > self.overbought:
            if self.position:
                self.position.close()


# -------- Fixed SmaCross (Original) --------
class SmaCross(Strategy):
    def init(self):
        self.sma1 = self.I(SMA, self.data.Close, 20)  # short SMA
        self.sma2 = self.I(SMA, self.data.Close, 50)  # long SMA

    def next(self):
        # ORIGINAL ISSUE: This logic is correct and should generate multiple trades
        if crossover(self.sma1, self.sma2):
            self.buy()
        elif crossover(self.sma2, self.sma1):
            self.sell()  # This actually closes the position, not short sell


# -------- Mean Reversion Strategy (Multiple Trades) --------
class MeanReversionStrategy(Strategy):
    lookback_period = 20
    entry_threshold = 2.0  # Standard deviations
    exit_threshold = 0.5   # Standard deviations
    
    def init(self):
        self.sma = self.I(SMA, self.data.Close, self.lookback_period)
        self.price_std = self.I(self.calculate_std, self.data.Close, self.lookback_period)
        
    def calculate_std(self, prices, window):
        """Calculate rolling standard deviation"""
        return pd.Series(prices).rolling(window=window).std().fillna(0)
    
    def next(self):
        if len(self.data.Close) < self.lookback_period:
            return
            
        current_price = self.data.Close[-1]
        sma = self.sma[-1]
        std = self.price_std[-1]
        
        if std == 0:  # Avoid division by zero
            return
            
        # Calculate z-score
        z_score = (current_price - sma) / std
        
        # Mean reversion logic
        if z_score < -self.entry_threshold and not self.position:
            # Price is significantly below mean, buy
            self.buy()
            
        elif z_score > self.entry_threshold and not self.position:
            # Price is significantly above mean, sell short (or don't trade if no shorting)
            pass  # Skip short selling for now
            
        elif abs(z_score) < self.exit_threshold and self.position:
            # Price returned close to mean, close position
            self.position.close()


# -------- Momentum Strategy (Multiple Trades) --------
class MomentumStrategy(Strategy):
    lookback_period = 10
    momentum_threshold = 0.02  # 2% price change
    
    def init(self):
        self.momentum = self.I(self.calculate_momentum, self.data.Close, self.lookback_period)
        
    def calculate_momentum(self, prices, window):
        """Calculate price momentum (rate of change)"""
        prices = pd.Series(prices)
        momentum = prices.pct_change(periods=window)
        return momentum.fillna(0)
    
    def next(self):
        if len(self.data.Close) < self.lookback_period:
            return
            
        current_momentum = self.momentum[-1]
        
        # Momentum-based trading
        if current_momentum > self.momentum_threshold and not self.position:
            # Strong upward momentum, buy
            self.buy()
            
        elif current_momentum < -self.momentum_threshold and self.position:
            # Downward momentum, close long position
            self.position.close()


# -------- Testing Strategy Behavior --------
class DebugStrategy(Strategy):
    """Strategy to debug trading behavior"""
    
    def init(self):
        self.sma1 = self.I(SMA, self.data.Close, 10)
        self.sma2 = self.I(SMA, self.data.Close, 20)
        self.trade_count = 0
    
    def next(self):
        if crossover(self.sma1, self.sma2):
            self.trade_count += 1
            print(f"Trade {self.trade_count}: BUY signal on {self.data.index[-1]}, Price: {self.data.Close[-1]:.2f}")
            if self.position:
                print(f"  Closing existing position first")
                self.position.close()
            self.buy()
            
        elif crossover(self.sma2, self.sma1):
            if self.position:
                print(f"Trade {self.trade_count}: SELL signal on {self.data.index[-1]}, Price: {self.data.Close[-1]:.2f}")
                self.position.close()

# -------- Backtest API --------
@app.route('/api/backtest', methods=['POST'])
# Add these strategy selections to your existing backend:

# In your /api/backtest route, update the strategy selection:

@app.route('/api/backtest', methods=['POST'])
def run_backtest():
    try:
        data = request.json
        symbol = data.get('symbol', 'AAPL')
        start_date = data.get('startDate', '2020-01-01')
        end_date = data.get('endDate', '2024-01-01')  # Fixed default date
        initial_cash = data.get('initialCash', 10000)
        commission = data.get('commission', 0.002)
        strategy_type = data.get('strategyType', 'sma_cross')
        
        print(f"Fetching data for {symbol} from {start_date} to {end_date}")
        
        # Strategy parameters
        short_window = data.get('shortWindow', 20)
        long_window = data.get('longWindow', 50)
        
        # RSI parameters
        rsi_window = data.get('rsiWindow', 14)
        oversold = data.get('oversold', 30)
        overbought = data.get('overbought', 70)
        
        # Mean Reversion parameters
        lookback_period = data.get('lookbackPeriod', 20)
        entry_threshold = data.get('entryThreshold', 2.0)
        exit_threshold = data.get('exitThreshold', 0.5)
        
        # Momentum parameters
        momentum_lookback = data.get('momentumLookback', 10)
        momentum_threshold = data.get('momentumThreshold', 0.02)
        
        # Download data
        stock_data = yf.download(symbol, start=start_date, end=end_date)
        print(f"Downloaded data shape: {stock_data.shape}")
        
        if stock_data.empty:
            return jsonify({"success": False, "error": f"No data found for {symbol}"}), 400
            
        # Flatten MultiIndex if present
        if isinstance(stock_data.columns, pd.MultiIndex):
            stock_data.columns = [col[0] for col in stock_data.columns]
        
        # Keep only required columns
        stock_data = stock_data[['Open', 'High', 'Low', 'Close', 'Volume']]
        
        # Validate sufficient data
        min_required_data = max(short_window, long_window, rsi_window, lookback_period, momentum_lookback) + 10
        if len(stock_data) < min_required_data:
            return jsonify({
                "success": False, 
                "error": f"Insufficient data. Need at least {min_required_data} days, got {len(stock_data)}"
            }), 400
        
        # Select strategy
        if strategy_type == 'buy_and_hold':
            strategy_class = BuyAndHold
            
        elif strategy_type == 'moving_average_crossover':
            # Fixed MA Crossover - will generate multiple trades
            class DynamicMA(Strategy):
                def init(self):
                    self.short_ma = self.I(SMA, self.data.Close, short_window)
                    self.long_ma = self.I(SMA, self.data.Close, long_window)
                
                def next(self):
                    # Buy when short MA crosses above long MA
                    if crossover(self.short_ma, self.long_ma):
                        if self.position:
                            self.position.close()
                        self.buy()
                    # Sell when short MA crosses below long MA
                    elif crossover(self.long_ma, self.short_ma):
                        if self.position:
                            self.position.close()
            
            strategy_class = DynamicMA
            
        elif strategy_type == 'rsi':
            # RSI Strategy - multiple trades based on overbought/oversold
            class DynamicRSI(Strategy):
                def init(self):
                    self.rsi = self.I(self.calculate_rsi, self.data.Close, rsi_window)
                
                def calculate_rsi(self, prices, window):
                    prices = pd.Series(prices)
                    delta = prices.diff()
                    gain = delta.where(delta > 0, 0).rolling(window=window).mean()
                    loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
                    rs = gain / loss
                    rsi = 100 - (100 / (1 + rs))
                    return rsi.fillna(50)
                
                def next(self):
                    if self.rsi[-1] < oversold and not self.position:
                        self.buy()
                    elif self.rsi[-1] > overbought and self.position:
                        self.position.close()
            
            strategy_class = DynamicRSI
            
        elif strategy_type == 'mean_reversion':
            # Mean Reversion Strategy
            class DynamicMeanReversion(Strategy):
                def init(self):
                    self.sma = self.I(SMA, self.data.Close, lookback_period)
                    self.price_std = self.I(self.calculate_std, self.data.Close, lookback_period)
                    
                def calculate_std(self, prices, window):
                    return pd.Series(prices).rolling(window=window).std().fillna(0)
                
                def next(self):
                    if len(self.data.Close) < lookback_period:
                        return
                        
                    current_price = self.data.Close[-1]
                    sma = self.sma[-1]
                    std = self.price_std[-1]
                    
                    if std == 0:
                        return
                        
                    z_score = (current_price - sma) / std
                    
                    # Buy when price is significantly below mean
                    if z_score < -entry_threshold and not self.position:
                        self.buy()
                    # Sell when price returns close to mean
                    elif abs(z_score) < exit_threshold and self.position:
                        self.position.close()
            
            strategy_class = DynamicMeanReversion
            
        elif strategy_type == 'momentum':
            # Momentum Strategy
            class DynamicMomentum(Strategy):
                def init(self):
                    self.momentum = self.I(self.calculate_momentum, self.data.Close, momentum_lookback)
                    
                def calculate_momentum(self, prices, window):
                    prices = pd.Series(prices)
                    momentum = prices.pct_change(periods=window)
                    return momentum.fillna(0)
                
                def next(self):
                    if len(self.data.Close) < momentum_lookback:
                        return
                        
                    current_momentum = self.momentum[-1]
                    
                    # Momentum-based trading
                    if current_momentum > momentum_threshold and not self.position:
                        self.buy()
                    elif current_momentum < -momentum_threshold and self.position:
                        self.position.close()
            
            strategy_class = DynamicMomentum
            
        elif strategy_type == 'moving_average_long_short':
            # Long/Short MA Strategy
            class DynamicMALongShort(Strategy):
                def init(self):
                    self.short_ma = self.I(SMA, self.data.Close, short_window)
                    self.long_ma = self.I(SMA, self.data.Close, long_window)
                
                def next(self):
                    if crossover(self.short_ma, self.long_ma):
                        if self.position.is_short:
                            self.position.close()
                        if not self.position.is_long:
                            self.buy()
                    elif crossover(self.long_ma, self.short_ma):
                        if self.position.is_long:
                            self.position.close()
                        if not self.position.is_short:
                            self.sell()
            
            strategy_class = DynamicMALongShort
            
        else:  # Default SMA Cross
            strategy_class = SmaCross
        
        # Run backtest
        print(f"Running backtest with {strategy_type} strategy")
        bt = Backtest(stock_data, strategy_class, cash=initial_cash, commission=commission)
        stats = bt.run()
        
        # Process results (same as before)
        equity_curve = stats['_equity_curve']
        equity_data = [
            {
                'date': index.strftime('%Y-%m-%d'),
                'equity': float(row['Equity']),
                'drawdown': float(row['DrawdownPct'])
            }
            for index, row in equity_curve.iterrows()
        ]
        
        trades = stats['_trades']
        trades_data = [
            {
                'entryTime': trade['EntryTime'].strftime('%Y-%m-%d'),
                'exitTime': trade['ExitTime'].strftime('%Y-%m-%d'),
                'entryPrice': float(trade['EntryPrice']),
                'exitPrice': float(trade['ExitPrice']),
                'pnl': float(trade['PnL']),
                'pnlPct': float(trade['ReturnPct']),
                'size': float(trade['Size'])
            }
            for _, trade in trades.iterrows()
        ]
        
        print(f"Backtest completed. Total trades: {len(trades_data)}")
        
        # Strategy info
        strategy_info = {
            'type': strategy_type,
            'symbol': symbol,
            'shortWindow': short_window,
            'longWindow': long_window,
        }
        
        if strategy_type == 'rsi':
            strategy_info.update({
                'rsiWindow': rsi_window,
                'oversold': oversold,
                'overbought': overbought
            })
        elif strategy_type == 'mean_reversion':
            strategy_info.update({
                'lookbackPeriod': lookback_period,
                'entryThreshold': entry_threshold,
                'exitThreshold': exit_threshold
            })
        elif strategy_type == 'momentum':
            strategy_info.update({
                'momentumLookback': momentum_lookback,
                'momentumThreshold': momentum_threshold
            })
        
        result = {
            'success': True,
            'strategy': strategy_info,
            'stats': {
                'startDate': start_date,
                'endDate': end_date,
                'duration': str(stats['Duration']),
                'exposureTime': safe_float(stats['Exposure Time [%]']),
                'equityFinal': safe_float(stats['Equity Final [$]']),
                'equityPeak': safe_float(stats['Equity Peak [$]']),
                'totalReturn': safe_float(stats['Return [%]']),
                'buyHoldReturn': safe_float(stats['Buy & Hold Return [%]']),
                'returnAnnualized': safe_float(stats['Return (Ann.) [%]']),
                'volatilityAnnualized': safe_float(stats['Volatility (Ann.) [%]']),
                'sharpeRatio': safe_float(stats['Sharpe Ratio']),
                'sortinoRatio': safe_float(stats['Sortino Ratio']),
                'calmarRatio': safe_float(stats['Calmar Ratio']),
                'maxDrawdown': safe_float(stats['Max. Drawdown [%]']),
                'avgDrawdown': safe_float(stats['Avg. Drawdown [%]']),
                'maxDrawdownDuration': str(stats['Max. Drawdown Duration']),
                'avgDrawdownDuration': str(stats['Avg. Drawdown Duration']),
                'numTrades': int(stats['# Trades']),
                'winRate': safe_float(stats['Win Rate [%]']),
                'bestTrade': safe_float(stats['Best Trade [%]']),
                'worstTrade': safe_float(stats['Worst Trade [%]']),
                'avgTrade': safe_float(stats['Avg. Trade [%]']),
                'maxTradeDuration': str(stats['Max. Trade Duration']),
                'avgTradeDuration': str(stats['Avg. Trade Duration']),
                'profitFactor': safe_float(stats['Profit Factor']),
                'sqn': safe_float(stats['SQN'])
            },
            'equityCurve': equity_data,
            'trades': trades_data
        }
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in backtest: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# -------- Trading API Endpoints --------
@app.route('/api/recommendations/<trader_id>', methods=['POST'])
def get_recommendations(trader_id):
    try:
        data = request.json
        query = data.get('query', '')
        symbols = data.get('symbols', ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'])
        include_stock_recommendations = data.get('include_stock_recommendations', True)
        
        # Validate trader ID (in a real app, this would check against a database)
        if not trader_id or len(trader_id) < 3:
            return jsonify({
                'success': False,
                'error': 'Invalid trader ID. Please provide a valid trader ID.'
            }), 400
        
        # Mock recommendations based on query
        recommendations = f"Based on your query '{query}', here are some personalized recommendations for trader {trader_id}:\n\n"
        
        if include_stock_recommendations:
            recommendations += "Stock Recommendations:\n"
            for symbol in symbols[:3]:  # Limit to 3 symbols
                recommendations += f"• {symbol}: Consider monitoring for potential entry points\n"
        
        recommendations += f"\nMarket Analysis:\n"
        recommendations += "• Current market conditions suggest cautious optimism\n"
        recommendations += "• Consider diversifying across sectors\n"
        recommendations += "• Monitor key support and resistance levels\n"
        
        return jsonify({
            'success': True,
            'recommendations': recommendations,
            'trader_id': trader_id
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/market-analysis', methods=['GET'])
def get_market_analysis():
    try:
        symbols = request.args.get('symbols', 'AAPL,GOOGL,MSFT,TSLA,NVDA').split(',')
        
        # Mock market data
        market_data = {}
        for symbol in symbols:
            market_data[symbol] = {
                'current_price': round(100 + (hash(symbol) % 200), 2),
                'change_percent': round((hash(symbol) % 20) - 10, 2)
            }
        
        analysis = "Market Analysis:\n\n"
        analysis += "The current market shows mixed signals with technology stocks leading gains. "
        analysis += "Key indicators suggest moderate volatility ahead. "
        analysis += "Investors should remain cautious and consider risk management strategies."
        
        return jsonify({
            'success': True,
            'market_data': market_data,
            'analysis': analysis
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/risk-analysis/<trader_id>', methods=['GET'])
def get_risk_analysis(trader_id):
    try:
        # Validate trader ID
        if not trader_id or len(trader_id) < 3:
            return jsonify({
                'success': False,
                'error': 'Invalid trader ID. Please provide a valid trader ID.'
            }), 400
        
        # Mock risk analysis
        risk_analysis = {
            'risk_score': round(30 + (hash(trader_id) % 40), 1),
            'risk_level': 'Moderate',
            'portfolio_beta': round(0.8 + (hash(trader_id) % 0.4), 2),
            'max_position_weight': round(15 + (hash(trader_id) % 10), 1),
            'recommendations': [
                'Consider reducing position sizes in volatile sectors',
                'Diversify across different asset classes',
                'Monitor correlation between holdings'
            ],
            'sector_allocation': {
                'Technology': round(30 + (hash(trader_id) % 20), 1),
                'Healthcare': round(20 + (hash(trader_id) % 15), 1),
                'Finance': round(15 + (hash(trader_id) % 10), 1),
                'Energy': round(10 + (hash(trader_id) % 10), 1),
                'Other': round(25 + (hash(trader_id) % 15), 1)
            }
        }
        
        return jsonify({
            'success': True,
            'risk_analysis': risk_analysis,
            'trader_id': trader_id
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/trading-signals', methods=['POST'])
def get_trading_signals():
    try:
        data = request.json
        symbols = data.get('symbols', ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'])
        
        signals = {}
        for symbol in symbols:
            signal_strength = hash(symbol) % 3
            strength_map = {0: 'Weak', 1: 'Moderate', 2: 'Strong'}
            signal_type = hash(symbol) % 3
            signal_map = {0: 'BUY', 1: 'HOLD', 2: 'SELL'}
            
            signals[symbol] = {
                'signal': signal_map[signal_type],
                'strength': strength_map[signal_strength],
                'confidence': round(60 + (hash(symbol) % 30), 1),
                'ai_analysis': f"Technical indicators suggest {signal_map[signal_type].lower()} signal for {symbol} based on current market conditions."
            }
        
        return jsonify({
            'success': True,
            'signals': signals
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Yahoo Finance API endpoints for real-time data
@app.route('/api/realtime/<symbol>')
def get_realtime_data(symbol):
    try:
        # Fetch real-time data from Yahoo Finance
        ticker = yf.Ticker(symbol)
        info = ticker.info
        hist = ticker.history(period="2d")
        
        if hist.empty:
            return jsonify({"success": False, "error": f"No data found for {symbol}"}), 400
        
        latest = hist.iloc[-1]
        previous = hist.iloc[-2] if len(hist) > 1 else latest
        
        current_price = float(latest['Close'])
        previous_price = float(previous['Close'])
        change = current_price - previous_price
        change_percent = (change / previous_price) * 100 if previous_price > 0 else 0
        
        return jsonify({
            "success": True,
            "data": {
                "symbol": symbol.replace('.NS', ''),
                "name": info.get('longName', symbol),
                "price": current_price,
                "change": change,
                "changePercent": change_percent,
                "volume": int(latest['Volume']),
                "high": float(latest['High']),
                "low": float(latest['Low']),
                "open": float(latest['Open']),
                "marketCap": info.get('marketCap', 0),
                "pe": info.get('trailingPE', 0),
                "sector": info.get('sector', 'Unknown')
            }
        })
        
    except Exception as e:
        print(f"Error fetching real-time data for {symbol}: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/market-overview')
def get_market_overview():
    try:
        # Indian market symbols
        symbols = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS']
        indices = ['^NSEI', '^NSEBANK']  # NIFTY 50 and BANK NIFTY
        
        all_symbols = indices + symbols
        market_data = []
        
        for symbol in all_symbols:
            try:
                ticker = yf.Ticker(symbol)
                hist = ticker.history(period="2d")
                info = ticker.info
                
                if not hist.empty:
                    latest = hist.iloc[-1]
                    previous = hist.iloc[-2] if len(hist) > 1 else latest
                    
                    current_price = float(latest['Close'])
                    previous_price = float(previous['Close'])
                    change = current_price - previous_price
                    change_percent = (change / previous_price) * 100 if previous_price > 0 else 0
                    
                    # Format symbol name for display
                    display_symbol = symbol.replace('.NS', '').replace('^NSEI', 'NIFTY50').replace('^NSEBANK', 'BANKNIFTY')
                    display_name = info.get('longName', display_symbol)
                    
                    market_data.append({
                        "symbol": display_symbol,
                        "name": display_name,
                        "price": current_price,
                        "change": change,
                        "changePercent": change_percent,
                        "volume": int(latest['Volume']) if 'Volume' in latest and not pd.isna(latest['Volume']) else 0
                    })
            except Exception as e:
                print(f"Error fetching data for {symbol}: {str(e)}")
                continue
        
        return jsonify({
            "success": True,
            "data": market_data
        })
        
    except Exception as e:
        print(f"Error fetching market overview: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/top-movers')
def get_top_movers():
    try:
        # Extended list of Indian stocks
        symbols = [
            'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 
            'SBIN.NS', 'ADANIGREEN.NS', 'TATAMOTORS.NS', 'BAJFINANCE.NS',
            'COALINDIA.NS', 'NTPC.NS', 'ONGC.NS', 'LT.NS', 'WIPRO.NS', 
            'MARUTI.NS', 'HINDUNILVR.NS'
        ]
        
        stocks_data = []
        
        for symbol in symbols:
            try:
                ticker = yf.Ticker(symbol)
                hist = ticker.history(period="2d")
                info = ticker.info
                
                if not hist.empty:
                    latest = hist.iloc[-1]
                    previous = hist.iloc[-2] if len(hist) > 1 else latest
                    
                    current_price = float(latest['Close'])
                    previous_price = float(previous['Close'])
                    change = current_price - previous_price
                    change_percent = (change / previous_price) * 100 if previous_price > 0 else 0
                    
                    display_symbol = symbol.replace('.NS', '')
                    
                    stocks_data.append({
                        "symbol": display_symbol,
                        "name": info.get('longName', display_symbol),
                        "price": current_price,
                        "change": change,
                        "changePercent": change_percent,
                        "volume": int(latest['Volume']) if 'Volume' in latest and not pd.isna(latest['Volume']) else 0
                    })
            except Exception as e:
                print(f"Error fetching data for {symbol}: {str(e)}")
                continue
        
        # Sort by change percentage
        stocks_data.sort(key=lambda x: x['changePercent'], reverse=True)
        
        top_gainers = stocks_data[:5]
        top_losers = stocks_data[-5:]
        
        # Sort by volume for most active
        most_active = sorted(stocks_data, key=lambda x: x['volume'], reverse=True)[:5]
        
        return jsonify({
            "success": True,
            "data": {
                "topGainers": top_gainers,
                "topLosers": top_losers,
                "mostActive": most_active
            }
        })
        
    except Exception as e:
        print(f"Error fetching top movers: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

# -------- Health check --------
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})


if __name__ == '__main__':
    app.run(debug=True, port=5000)
