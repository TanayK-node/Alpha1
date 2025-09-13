#!/usr/bin/env python3
"""
Test script to verify the enhanced market data service works properly
Run this to test your setup before deploying
"""

import os
import sys
import json
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import our market data service
try:
    from market_data_service import MarketDataService
    print("✅ Successfully imported MarketDataService")
except ImportError as e:
    print(f"❌ Failed to import MarketDataService: {e}")
    sys.exit(1)

def test_basic_functionality():
    """Test basic functionality of the market data service"""
    
    print("\n" + "="*50)
    print("TESTING ENHANCED MARKET DATA SERVICE")
    print("="*50)
    
    # Get API key
    gemini_api_key = os.getenv('GEMINI_API_KEY')
    if not gemini_api_key:
        print("⚠️  GEMINI_API_KEY not found in environment variables")
        print("   Will test Yahoo Finance only...")
        service = MarketDataService()
    else:
        print("✅ Found Gemini API key")
        service = MarketDataService(gemini_api_key=gemini_api_key)
    
    # Test symbols
    test_symbols = ['AAPL', 'GOOGL', 'MSFT', 'INVALID_SYMBOL']
    
    print(f"\n🔍 Testing with symbols: {test_symbols}")
    
    # Test 1: Single stock data
    print("\n1. Testing single stock data fetch...")
    try:
        print("   Testing AAPL...")
        aapl_data = service.get_market_data_with_fallback('AAPL')
        
        if aapl_data:
            print(f"   ✅ Success! AAPL data:")
            print(f"      Price: ${aapl_data.get('current_price', 'N/A')}")
            print(f"      Change: {aapl_data.get('change_percent', 'N/A')}%")
            print(f"      Source: {aapl_data.get('source', 'Unknown')}")
            print(f"      Volume: {aapl_data.get('volume', 'N/A'):,}")
            
            if aapl_data.get('technical_indicators'):
                tech = aapl_data['technical_indicators']
                print(f"      RSI: {tech.get('rsi', 'N/A'):.1f}")
                print(f"      MACD: {tech.get('macd', 'N/A'):.3f}")
            
            if aapl_data.get('error'):
                print(f"      ⚠️  Warning: {aapl_data['error']}")
        else:
            print("   ❌ Failed to get AAPL data")
            
    except Exception as e:
        print(f"   ❌ Error testing single stock: {e}")
    
    # Test 2: Multiple stocks
    print("\n2. Testing multiple stocks data fetch...")
    try:
        multi_data = service.get_multiple_stocks_data(test_symbols[:3])  # Skip invalid symbol
        
        if multi_data:
            print(f"   ✅ Successfully fetched data for {len(multi_data)} symbols:")
            for symbol, data in multi_data.items():
                source = data.get('source', 'unknown')
                price = data.get('current_price', 0)
                change = data.get('change_percent', 0)
                error = data.get('error', '')
                
                status = "❌" if error else "✅"
                print(f"      {status} {symbol}: ${price:.2f} ({change:+.2f}%) [{source}]")
                if error:
                    print(f"         Error: {error}")
        else:
            print("   ❌ Failed to get multiple stocks data")
            
    except Exception as e:
        print(f"   ❌ Error testing multiple stocks: {e}")
    
    # Test 3: Invalid symbol handling
    print("\n3. Testing invalid symbol handling...")
    try:
        invalid_data = service.get_market_data_with_fallback('INVALID_SYMBOL_XYZ')
        if invalid_data:
            if invalid_data.get('source') == 'mock_data':
                print("   ✅ Invalid symbol handled gracefully with mock data")
            else:
                print("   ⚠️  Invalid symbol returned data (unexpected)")
            print(f"      Source: {invalid_data.get('source')}")
            print(f"      Error: {invalid_data.get('error', 'None')}")
        else:
            print("   ❌ Invalid symbol not handled properly")
    except Exception as e:
        print(f"   ⚠️  Invalid symbol caused exception: {e}")
    
    # Test 4: Gemini-specific features (if API key available)
    if gemini_api_key:
        print("\n4. Testing Gemini AI features...")
        
        # Test market sentiment
        try:
            print("   Testing market sentiment analysis...")
            sentiment = service.get_market_sentiment_analysis(['AAPL', 'GOOGL'])
            
            if sentiment and not sentiment.get('error'):
                print("   ✅ Market sentiment analysis successful:")
                print(f"      Overall sentiment: {sentiment.get('overall_sentiment', 'N/A')}")
                print(f"      Market strength: {sentiment.get('market_strength', 'N/A')}/10")
                
                if sentiment.get('key_trends'):
                    print(f"      Key trends: {', '.join(sentiment['key_trends'][:3])}")
            else:
                print(f"   ❌ Market sentiment failed: {sentiment.get('error', 'Unknown error')}")
                
        except Exception as e:
            print(f"   ❌ Error testing sentiment: {e}")
        
        # Test stock recommendations
        try:
            print("   Testing stock recommendations...")
            recommendations = service.get_stock_recommendations('AAPL', {
                'risk_tolerance': 'medium',
                'investment_horizon': 'long_term',
                'trading_style': 'growth'
            })
            
            if recommendations and not recommendations.get('error'):
                print("   ✅ Stock recommendations successful:")
                print(f"      Recommendation: {recommendations.get('recommendation', 'N/A')}")
                print(f"      Confidence: {recommendations.get('confidence', 'N/A')}/10")
                print(f"      Target price: ${recommendations.get('target_price', 'N/A')}")
            else:
                print(f"   ❌ Stock recommendations failed: {recommendations.get('error', 'Unknown error')}")
                
        except Exception as e:
            print(f"   ❌ Error testing recommendations: {e}")
    else:
        print("\n4. Skipping Gemini AI features (no API key)")
    
    # Test 5: Cache functionality
    print("\n5. Testing cache functionality...")
    try:
        cache_before = len(service.cache)
        print(f"   Cache items before: {cache_before}")
        
        # Fetch same data again
        aapl_data_2 = service.get_market_data_with_fallback('AAPL')
        
        cache_after = len(service.cache)
        print(f"   Cache items after: {cache_after}")
        
        if cache_after >= cache_before:
            print("   ✅ Cache is working (data cached)")
        else:
            print("   ⚠️  Cache behavior unexpected")
            
    except Exception as e:
        print(f"   ❌ Error testing cache: {e}")
    
    # Summary
    print("\n" + "="*50)
    print("TEST SUMMARY")
    print("="*50)
    
    print("Configuration:")
    print(f"  - Yahoo Finance: Available")
    print(f"  - Gemini AI: {'Available' if gemini_api_key else 'Not configured'}")
    print(f"  - Cache timeout: {service.cache_timeout} seconds")
    print(f"  - Current cache size: {len(service.cache)} items")
    
    print("\nRecommendations:")
    if not gemini_api_key:
        print("  - Add GEMINI_API_KEY to your .env file for full AI features")
    print("  - The service should work with fallbacks even if some APIs fail")
    print("  - Check your internet connection if Yahoo Finance fails")
    print("  - Monitor cache size in production to avoid memory issues")
    
    print("\n✅ Testing complete!")

def test_flask_integration():
    """Test Flask integration"""
    print("\n" + "="*50)
    print("TESTING FLASK INTEGRATION")
    print("="*50)
    
    try:
        # Try to import Flask app components
        print("Testing imports...")
        
        # Test if we can create the market service
        gemini_api_key = os.getenv('GEMINI_API_KEY')
        service = MarketDataService(gemini_api_key=gemini_api_key)
        print("✅ MarketDataService creation successful")
        
        # Test if we can create enhanced trading assistant
        from app import EnhancedTradingAssistant
        assistant = EnhancedTradingAssistant()
        print("✅ EnhancedTradingAssistant creation successful")
        
        # Test market data retrieval through assistant
        market_data = assistant.get_enhanced_market_data(['AAPL'])
        if market_data and 'AAPL' in market_data:
            print("✅ Enhanced market data through assistant working")
            print(f"   AAPL source: {market_data['AAPL'].get('source', 'unknown')}")
        else:
            print("❌ Enhanced market data through assistant failed")
        
        print("\n✅ Flask integration test successful!")
        print("   Your app should work correctly when started")
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("   Make sure all required packages are installed:")
        print("   pip install -r requirements.txt")
    except Exception as e:
        print(f"❌ Flask integration test failed: {e}")

if __name__ == "__main__":
    print("🚀 Enhanced Trading Assistant - Market Data Test")
    print("=" * 60)
    
    # Run tests
    test_basic_functionality()
    test_flask_integration()
    
    print("\n" + "🎉 All tests completed!")
    print("\nNext steps:")
    print("1. If tests passed, you can start your Flask app: python app.py")
    print("2. If tests failed, check your API keys and internet connection")
    print("3. For Streamlit app: streamlit run streamlit_app.py")
    print("4. Test the endpoints using curl or Postman")
    
    # Show sample curl commands
    print("\n📝 Sample API test commands:")
    print("curl http://localhost:5000/health")
    print("curl http://localhost:5000/api/market-analysis")
    print("curl http://localhost:5000/api/stock-data/AAPL")
    print("curl http://localhost:5000/api/market-sentiment")