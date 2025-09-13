import streamlit as st
import os
import json
import time
import re
from datetime import datetime
from typing import Dict, List, Optional
import google.generativeai as genai
from supabase import create_client, Client
from dotenv import load_dotenv
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from market_data_service import MarketDataService

# Use the shared MarketDataService (Finnhub as primary)

# Load environment variables
load_dotenv()

# Configure Streamlit page
st.set_page_config(
    page_title="Real-Time Trading Assistant",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better appearance
st.markdown("""
<style>
    .main {
        padding-top: 1rem;
    }
    
    .stAlert {
        margin: 0.5rem 0;
    }
    
    .stock-card {
        background: white;
        padding: 1rem;
        border-radius: 0.5rem;
        border: 1px solid #ddd;
        margin: 0.5rem 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .price-positive {
        color: #4CAF50;
        font-weight: bold;
    }
    
    .price-negative {
        color: #f44336;
        font-weight: bold;
    }
    
    .data-source {
        font-size: 0.8em;
        color: #666;
        font-style: italic;
    }
    
    .metric-card {
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1rem;
        border-radius: 0.5rem;
        text-align: center;
        margin: 0.5rem 0;
    }
    
    .api-status {
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.8em;
        font-weight: bold;
    }
    
    .api-active {
        background-color: #4CAF50;
        color: white;
    }
    
    .api-inactive {
        background-color: #f44336;
        color: white;
    }
    
    .chat-input {
        position: sticky;
        bottom: 0;
        background: white;
        padding: 1rem;
        border-top: 1px solid #ddd;
    }
    
    .market-update {
        background: #e3f2fd;
        border-left: 4px solid #2196f3;
        padding: 1rem;
        margin: 1rem 0;
        border-radius: 0 0.5rem 0.5rem 0;
    }
</style>
""", unsafe_allow_html=True)

class EnhancedTradingChatbot:
    """Enhanced Trading Assistant with Real-Time Market Data"""
    
    def __init__(self):
        # Initialize services
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_ANON_KEY')
        self.gemini_api_key = os.getenv('GEMINI_API_KEY')
        
        # Initialize clients
        if self.supabase_url and self.supabase_key:
            self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        else:
            self.supabase = None
            
        # Initialize market data service (Finnhub primary)
        self.finnhub_key = os.getenv('FINNHUB_API_KEY') or 'd31talhr01qsprr2hh0gd31talhr01qsprr2hh10'
        self.market_service = MarketDataService(
            gemini_api_key=self.gemini_api_key,
            finnhub_api_key=self.finnhub_key,
        )
        
        # Initialize Gemini for chat
        if self.gemini_api_key:
            genai.configure(api_key=self.gemini_api_key)
            self.gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.gemini_model = None
        
        # Disclaimer text
        self.disclaimer = (
            "\n\n—\nThis is AI-generated analysis for educational purposes, not financial advice. "
            "Markets carry risk; do your own research and consider consulting a professional."
        )
    
    def check_api_status(self) -> Dict[str, bool]:
        """Check which APIs are configured and working"""
        status = {}
        
        # Finnhub status for this app
        status['finnhub'] = bool(self.finnhub_key)
        
        # Test at least one API
        try:
            test_data = self.market_service.get_market_data_with_fallback("AAPL")
            status['market_data_working'] = True
            status['working_source'] = test_data.get('source', 'unknown')
        except Exception as e:
            status['market_data_working'] = False
            status['error'] = str(e)
        
        return status
    
    def get_trader_portfolio(self, trader_id: str) -> Optional[Dict]:
        """Fetch trader profile, positions, and recent trades from Supabase."""
        if not self.supabase or not trader_id:
            return None
        try:
            trader_response = self.supabase.table('traders').select('*').eq('trader_id', trader_id).execute()
            if not trader_response.data:
                return None
            trader = trader_response.data[0]
            positions = self.supabase.table('positions').select('*').eq('trader_id', trader_id).execute().data
            trades = self.supabase.table('trades').select('*').eq('trader_id', trader_id).order('trade_date', desc=True).limit(50).execute().data
            return {
                'trader': trader,
                'positions': positions,
                'trades': trades,
            }
        except Exception:
            return None
    
    def extract_stock_symbols(self, query: str) -> List[str]:
        """Extract stock symbols from user query"""
        # Enhanced symbol extraction
        patterns = [
            r'\b[A-Z]{1,5}\b',  # 1-5 uppercase letters
            r'\$([A-Z]{1,5})',  # $SYMBOL format
        ]
        
        symbols = set()
        for pattern in patterns:
            matches = re.findall(pattern, query.upper())
            if pattern.startswith(r'\$'):
                symbols.update(matches)
            else:
                symbols.update(matches)
        
        # Remove common false positives
        false_positives = {
            'THE', 'AND', 'FOR', 'YOU', 'CAN', 'GET', 'BUY', 'SELL', 'STOCK', 
            'PRICE', 'OF', 'IS', 'IT', 'TO', 'IN', 'ON', 'AT', 'MY', 'ME', 
            'I', 'A', 'AN', 'OR', 'BUT', 'NOT', 'WITH', 'WHAT', 'HOW', 'WHY',
            'WHEN', 'WHERE', 'WHO', 'WILL', 'WOULD', 'COULD', 'SHOULD', 'DO',
            'DOES', 'DID', 'HAVE', 'HAS', 'HAD', 'BE', 'WAS', 'WERE', 'ARE',
            'AM', 'BEEN', 'BEING', 'AI', 'API', 'USD', 'EUR', 'GBP', 'JPY'
        }
        symbols = symbols - false_positives
        
        # Company name to symbol mapping
        company_to_symbol = {
            'APPLE': 'AAPL', 'GOOGLE': 'GOOGL', 'ALPHABET': 'GOOGL',
            'MICROSOFT': 'MSFT', 'TESLA': 'TSLA', 'AMAZON': 'AMZN',
            'META': 'META', 'FACEBOOK': 'META', 'NVIDIA': 'NVDA',
            'NETFLIX': 'NFLX', 'DISNEY': 'DIS', 'WALMART': 'WMT',
            'JOHNSON': 'JNJ', 'JPMORGAN': 'JPM', 'VISA': 'V',
            'MASTERCARD': 'MA', 'BOEING': 'BA', 'COCA': 'KO',
            'PEPSI': 'PEP', 'INTEL': 'INTC', 'IBM': 'IBM'
        }
        
        query_upper = query.upper()
        for company, symbol in company_to_symbol.items():
            if company in query_upper and symbol not in symbols:
                symbols.add(symbol)
                break
        
        return list(symbols)[:5]  # Limit to 5 symbols
    
    def get_real_time_stock_data(self, symbols: List[str]) -> Dict:
        """Get real-time stock data for symbols"""
        try:
            return self.market_service.get_multiple_stocks_data(symbols)
        except Exception as e:
            st.error(f"Error fetching real-time data: {e}")
            return {}
    
    def create_stock_chart(self, symbol: str, data: Dict) -> go.Figure:
        """Create a simple price chart (mock historical data for demo)"""
        # In a real implementation, you'd fetch historical data
        # For now, create a simple current price display
        fig = go.Figure()
        
        current_price = data.get('current_price', 0)
        change = data.get('change', 0)
        
        # Create a simple gauge chart for the current price
        fig = go.Figure(go.Indicator(
            mode = "gauge+number+delta",
            value = current_price,
            delta = {'reference': current_price - change},
            title = {'text': f"{symbol} Current Price"},
            gauge = {'axis': {'range': [None, current_price * 1.2]},
                     'bar': {'color': "darkblue"},
                     'steps': [{'range': [0, current_price * 0.8], 'color': "lightgray"},
                               {'range': [current_price * 0.8, current_price * 1.1], 'color': "gray"}],
                     'threshold': {'line': {'color': "red", 'width': 4},
                                   'thickness': 0.75, 'value': current_price}}
        ))
        
        fig.update_layout(height=300, font={'color': "darkblue", 'family': "Arial"})
        return fig
    
    def generate_market_response(self, query: str, symbols: List[str], trader_id: Optional[str]) -> str:
        """Generate decisive AI response using real-time Finnhub data and portfolio context."""
        if not self.gemini_model:
            return "❌ AI analysis not available - Gemini API key not configured"
        
        try:
            # Get real-time data
            market_data = self.get_real_time_stock_data(symbols)
            portfolio = self.get_trader_portfolio(trader_id) if trader_id else None
            
            # Filter successful data
            successful_data = {k: v for k, v in market_data.items() if not v.get('error')}
            
            if not successful_data:
                return "❌ Unable to fetch real-time market data. Please check API configurations."
            
            # Create context for AI
            market_context = "Current Real-Time Market Data:\n"
            for symbol, data in successful_data.items():
                cp = float(data.get('current_price') or 0)
                ch = float(data.get('change') or 0)
                chp = float(data.get('change_percent') or 0)
                vol = int(data.get('volume') or 0)
                mcap = int(data.get('market_cap') or 0)
                src = data.get('source') or 'unknown'
                ts = data.get('timestamp') or 'unknown'
                market_context += f"""
                {symbol}:
                - Current Price: ${cp:.2f}
                - Change: {ch:+.2f} ({chp:+.2f}%)
                - Volume: {vol:,}
                - Market Cap: ${mcap:,}
                - Source: {src}
                - Data Time: {ts}
                """
            portfolio_context = json.dumps(portfolio, default=str) if portfolio else "{}"
            
            prompt = f"""
            You are a decisive professional trading advisor. Avoid hedging language.
            Provide clear, actionable guidance based on the data and the user's profile.
            
            User Question: "{query}"
            
            {market_context}
            
            User Portfolio Context (JSON):
            {portfolio_context}
            
            Please provide:
            1. Direct answer using the real-time data above (Finnhub)
            2. Current market analysis for the mentioned stocks
            3. A clear recommendation (strong_buy/buy/hold/sell/strong_sell) with concise reasoning
            4. Target price, stop loss, and estimated holding horizon
            5. Position sizing suggestion as % of portfolio (if portfolio context provided)
            6. 2-3 key risk factors and what would invalidate the thesis
            
            Be specific and actionable. Use firm language. Mention Finnhub as the data source and include timestamps.
            """
            
            response = self.gemini_model.generate_content(prompt)
            return (response.text or "").strip() + self.disclaimer
            
        except Exception as e:
            return f"❌ Error generating market analysis: {str(e)}"
    
    def generate_general_response(self, query: str, trader_id: Optional[str]) -> str:
        """Generate personalized trading advice using portfolio context."""
        if not self.gemini_model:
            return "❌ AI not available - please configure Gemini API key"
        
        portfolio = self.get_trader_portfolio(trader_id) if trader_id else None
        portfolio_context = json.dumps(portfolio, default=str) if portfolio else "{}"
        prompt = f"""
        You are a decisive professional trading advisor. Avoid hedging language.
        
        User Question: "{query}"
        
        User Portfolio Context (JSON):
        {portfolio_context}
        
        Provide personalized guidance that references the user's holdings, risk tolerance (if present), and trading style.
        Include concrete next steps and specific suggestions. Use firm language.
        """
        
        try:
            response = self.gemini_model.generate_content(prompt)
            return (response.text or "").strip() + self.disclaimer
        except Exception as e:
            return f"❌ Error generating response: {str(e)}"


def display_stock_cards(market_data: Dict):
    """Display stock data in card format"""
    for symbol, data in market_data.items():
        if data.get('error'):
            st.error(f"❌ {symbol}: {data['error']}")
            continue
        
        current_price = float(data.get('current_price') or 0)
        change = float(data.get('change') or 0)
        change_percent = float(data.get('change_percent') or 0)
        volume = int(data.get('volume') or 0)
        source = data.get('source', 'unknown')
        
        # Determine color based on change
        price_class = 'price-positive' if change >= 0 else 'price-negative'
        change_emoji = '📈' if change >= 0 else '📉'
        
        st.markdown(f"""
        <div class="stock-card">
            <h3>{symbol} {change_emoji}</h3>
            <div class="{price_class}">
                <h2>${current_price:.2f}</h2>
                <p>{change:+.2f} ({change_percent:+.2f}%)</p>
            </div>
            <p><strong>Volume:</strong> {volume:,}</p>
            <p><strong>Market Cap:</strong> ${int(data.get('market_cap') or 0):,}</p>
            <p class="data-source">Source: {source} | Updated: {data.get('timestamp', 'unknown')[:16]}</p>
        </div>
        """, unsafe_allow_html=True)


def display_api_status(status: Dict):
    """Display API configuration status"""
    st.sidebar.markdown("### 📡 Data Sources")
    
    api_names = {
        'finnhub': 'Finnhub'
    }
    
    for api_key, api_name in api_names.items():
        is_configured = status.get(api_key, False)
        status_class = 'api-active' if is_configured else 'api-inactive'
        status_text = '✅ Active' if is_configured else '❌ Not configured'
        
        st.sidebar.markdown(f"""
        <div class="{status_class} api-status">
            {api_name}: {status_text}
        </div>
        """, unsafe_allow_html=True)
    
    # Overall status
    if status.get('market_data_working'):
        st.sidebar.success(f"✅ Market data working via {status.get('working_source', 'unknown')}")
    else:
        st.sidebar.error(f"❌ Market data unavailable: {status.get('error', 'Unknown error')}")


def main():
    """Main Streamlit application"""
    
    # Initialize chatbot
    if 'chatbot' not in st.session_state:
        st.session_state.chatbot = EnhancedTradingChatbot()
    if 'trader_id' not in st.session_state:
        st.session_state.trader_id = ''
    
    # Initialize chat history
    if 'messages' not in st.session_state:
        st.session_state.messages = []
    
    # Initialize last market data
    if 'last_market_data' not in st.session_state:
        st.session_state.last_market_data = {}
    
    chatbot = st.session_state.chatbot
    
    # Header
    st.title("📈 Real-Time Trading Assistant")
    st.markdown("*AI-powered trading assistant with live market data*")
    
    # Check API status
    with st.spinner("Checking API status..."):
        api_status = chatbot.check_api_status()
    
    # Sidebar: Trader ID and API status
    with st.sidebar:
        st.markdown("### 👤 Trader Session")
        trader_id_input = st.text_input("Enter Trader ID", value=st.session_state.trader_id)
        col_sid_a, col_sid_b = st.columns([1,1])
        with col_sid_a:
            if st.button("Set ID"):
                st.session_state.trader_id = trader_id_input.strip()
        with col_sid_b:
            if st.button("Clear ID"):
                st.session_state.trader_id = ''
        display_api_status(api_status)
    
    # Main content area
    col1, col2 = st.columns([2, 1])
    
    with col1:
        # Market data display section
        st.markdown("### 📊 Live Market Data")
        
        # Quick stock lookup
        col1a, col1b = st.columns([3, 1])
        with col1a:
            quick_symbols = st.text_input(
                "Enter stock symbols (comma-separated):",
                placeholder="e.g., AAPL, GOOGL, MSFT",
                key="quick_lookup"
            )
        with col1b:
            if st.button("📈 Get Data", key="fetch_data"):
                if quick_symbols:
                    symbols = [s.strip().upper() for s in quick_symbols.split(',')]
                    with st.spinner("Fetching real-time data..."):
                        market_data = chatbot.get_real_time_stock_data(symbols)
                        st.session_state.last_market_data = market_data
        
        # Display market data if available
        if st.session_state.last_market_data:
            display_stock_cards(st.session_state.last_market_data)
        
        # Chat interface
        st.markdown("### 💬 Chat with AI Assistant")
        
        # Display chat messages
        for message in st.session_state.messages:
            with st.chat_message(message["role"]):
                st.markdown(message["content"])
        
        # Chat input
        if prompt := st.chat_input("Ask about stocks, markets, or trading strategies..."):
            # Add user message
            st.session_state.messages.append({"role": "user", "content": prompt})
            
            # Display user message
            with st.chat_message("user"):
                st.markdown(prompt)
            
            # Generate and display response
            with st.chat_message("assistant"):
                with st.spinner("Analyzing market data and generating response..."):
                    try:
                        # Extract symbols from query
                        symbols = chatbot.extract_stock_symbols(prompt)
                        
                        if symbols:
                            # Market-related query with real-time data
                            response = chatbot.generate_market_response(prompt, symbols, st.session_state.trader_id)
                        else:
                            # Personalized/general query
                            response = chatbot.generate_general_response(prompt, st.session_state.trader_id)
                        
                        st.markdown(response)
                        st.session_state.messages.append({"role": "assistant", "content": response})
                        
                    except Exception as e:
                        error_msg = f"❌ Sorry, I encountered an error: {str(e)}"
                        st.error(error_msg)
                        st.session_state.messages.append({"role": "assistant", "content": error_msg})
    
    with col2:
        # Sidebar content
        st.markdown("### 🎯 Quick Actions")
        
        # Preset queries
        preset_queries = [
            "What's the current price of AAPL?",
            "Should I buy TSLA now?",
            "Analyze my portfolio risk",
            "Position sizing for MSFT",
            "Short-term plan for NVDA"
        ]
        
        for query in preset_queries:
            if st.button(query, key=f"preset_{hash(query)}"):
                # Add to chat
                st.session_state.messages.append({"role": "user", "content": query})
                
                # Generate response
                symbols = chatbot.extract_stock_symbols(query)
                if symbols:
                    response = chatbot.generate_market_response(query, symbols, st.session_state.trader_id)
                else:
                    response = chatbot.generate_general_response(query, st.session_state.trader_id)
                
                st.session_state.messages.append({"role": "assistant", "content": response})
                st.rerun()
        
        # Settings and info
        st.markdown("---")
        st.markdown("### ⚙️ Settings")
        
        if st.button("🗑️ Clear Chat"):
            st.session_state.messages = []
            st.session_state.last_market_data = {}
            st.rerun()
        
        if st.button("🔄 Refresh Data"):
            if st.session_state.last_market_data:
                symbols = list(st.session_state.last_market_data.keys())
                with st.spinner("Refreshing..."):
                    market_data = chatbot.get_real_time_stock_data(symbols)
                    st.session_state.last_market_data = market_data
                st.rerun()
        
        # Data source info
        st.markdown("### 📋 Setup Instructions")
        st.info("""
        **To get real-time data, add API keys to Streamlit secrets:**
        
        1. Create `.streamlit/secrets.toml`
        2. Add API keys:
        ```toml
        FINNHUB_API_KEY = "your_key"
        GEMINI_API_KEY = "your_key"
        ```
        
        **Free API option used here:**
        - Finnhub: 60 calls/minute (free)
        """)
        
        # Market overview
        st.markdown("### 📈 Market Overview")
        if st.session_state.last_market_data:
            total_symbols = len(st.session_state.last_market_data)
            positive_changes = sum(1 for data in st.session_state.last_market_data.values() 
                                 if data.get('change_percent', 0) > 0)
            
            st.metric("Symbols Tracked", total_symbols)
            st.metric("Positive Moves", f"{positive_changes}/{total_symbols}")
            
            # Average change
            avg_change = np.mean([data.get('change_percent', 0) 
                                for data in st.session_state.last_market_data.values() 
                                if not data.get('error')])
            st.metric("Avg Change %", f"{avg_change:.2f}%")


if __name__ == "__main__":
    # Import numpy for calculations
    import numpy as np
    
    # Check for required environment variables
    required_vars = ['GEMINI_API_KEY']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        st.error(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        st.info("Please add these to your .env file or Streamlit secrets")
        st.code("""
        # .env file
        GEMINI_API_KEY=your_gemini_api_key
        
        # .streamlit/secrets.toml
        GEMINI_API_KEY = "your_gemini_api_key"
        """)
    else:
        main()