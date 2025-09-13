# Trading Backtest API Backend

This Flask backend provides algorithmic trading strategy backtesting capabilities using Yahoo Finance data.

## Quick Start

### Option 1: Using the helper script (Recommended)
```bash
cd backend
python run_server.py
```

### Option 2: Manual startup
```bash
cd backend
pip install -r requirements.txt
python app.py
```

The server will start at `http://localhost:5000`

## API Endpoints

### Health Check
```http
GET /api/health
```

### Run Backtest
```http
POST /api/backtest
Content-Type: application/json

{
  "symbol": "AAPL",
  "startDate": "2020-01-01", 
  "endDate": "2024-12-31",
  "initialCash": 10000,
  "commission": 0.002,
  "strategyType": "buy_and_hold",
  "shortWindow": 20,
  "longWindow": 50
}
```

## Supported Strategies

### 1. Buy and Hold (`buy_and_hold`)
- Buys asset once at the beginning
- Holds until the end of the period
- Good baseline for comparison

### 2. Moving Average Crossover (`moving_average_crossover`)
- Buy when short-term MA crosses above long-term MA
- Sell when short-term MA crosses below long-term MA
- Configurable window periods

### 3. Legacy SMA Cross (`sma_cross`) - Default
- Similar to MA crossover with fixed 20/50 day windows

## Response Format

```json
{
  "success": true,
  "strategy": {
    "type": "buy_and_hold",
    "symbol": "AAPL",
    "shortWindow": 20,
    "longWindow": 50
  },
  "stats": {
    "totalReturn": 15.34,
    "sharpeRatio": 1.2,
    "maxDrawdown": -8.5,
    "numTrades": 12,
    "winRate": 65.5
  },
  "equityCurve": [...],
  "trades": [...]
}
```

## Requirements

- Python 3.7+
- Flask 
- yfinance
- backtesting
- pandas

All requirements are listed in `requirements.txt` and will be installed automatically when using the helper script.