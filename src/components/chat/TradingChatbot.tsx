import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, User, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface TradingChatbotProps {
  className?: string;
}

export function TradingChatbot({ className }: TradingChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content:
        "Hello! I'm your AI Trading Assistant. Please enter your Trader ID to get personalized recommendations and market insights.",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [traderId, setTraderId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSetTraderId, setHasSetTraderId] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (
    content: string,
    type: "user" | "bot",
    isLoading = false
  ) => {
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: new Date(),
      isLoading,
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage.id;
  };

  const updateMessage = (id: string, content: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, content, isLoading: false } : msg
      )
    );
  };

  const callTradingAPI = async (query: string, endpoint: string) => {
    // Two backends: legacy on 5000, enhanced (Supabase + Finnhub) on 5001
    const legacyBaseURL = "http://localhost:5000";
    const enhancedBaseURL = "http://localhost:5001";

    try {
      if (endpoint === "recommendations") {
        // Validate and get recommendations from enhanced service (Supabase-backed)
        const response = await fetch(
          `${enhancedBaseURL}/api/recommendations/${traderId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query,
              symbols: ["AAPL", "GOOGL", "MSFT", "TSLA", "NVDA"],
              include_stock_recommendations: true,
            }),
          }
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } else if (endpoint === "market-analysis") {
        const response = await fetch(
          `${enhancedBaseURL}/api/market-analysis?symbols=AAPL,GOOGL,MSFT,TSLA,NVDA`,
          {
            method: "GET",
          }
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } else if (endpoint === "risk-analysis") {
        const response = await fetch(
          `${legacyBaseURL}/api/risk-analysis/${traderId}`,
          {
            method: "GET",
          }
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } else if (endpoint === "trading-signals") {
        const response = await fetch(`${legacyBaseURL}/api/trading-signals`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            symbols: ["AAPL", "GOOGL", "MSFT", "TSLA", "NVDA"],
          }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } else if (endpoint.startsWith("stock-price:")) {
        const symbol = endpoint.split(":")[1];
        const response = await fetch(
          `${enhancedBaseURL}/api/stock-data/${encodeURIComponent(symbol)}`,
          { method: "GET" }
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      }
    } catch (error) {
      throw new Error(`Failed to fetch from trading API: ${error}`);
    }
  };

  const validateTraderId = async (traderId: string): Promise<boolean> => {
    try {
      // Validate against enhanced service which checks Supabase
      const response = await fetch(
        `http://localhost:5001/api/recommendations/${traderId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: "validate",
            symbols: ["AAPL"],
            include_stock_recommendations: false,
          }),
        }
      );

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error("Error validating trader ID:", error);
      return false;
    }
  };

  const processUserMessage = async (message: string) => {
    if (!hasSetTraderId) {
      // First message should be trader ID
      if (message.trim()) {
        const traderId = message.trim();

        // Validate trader ID
        const loadingMessageId = addMessage(
          "Validating your Trader ID...",
          "bot",
          true
        );

        const isValid = await validateTraderId(traderId);

        if (isValid) {
          setTraderId(traderId);
          setHasSetTraderId(true);
          updateMessage(
            loadingMessageId,
            `Great! I've validated your Trader ID: ${traderId}. Now you can ask me about:

• Market analysis and insights
• Personalized trading recommendations
• Portfolio risk analysis
• Trading signals for specific stocks
• Technical analysis

What would you like to know about the markets today?`
          );
        } else {
          updateMessage(
            loadingMessageId,
            `Sorry, I couldn't validate the Trader ID "${traderId}". Please make sure you're entering a valid Trader ID (at least 3 characters) and that the trading backend is running on localhost:5000.`
          );
        }
      } else {
        addMessage("Please enter a valid Trader ID to continue.", "bot");
      }
      return;
    }

    const loadingMessageId = addMessage(
      "Analyzing your request...",
      "bot",
      true
    );

    try {
      // Determine which API to call based on message content
      const lowerMessage = message.toLowerCase();
      let response;

      if (
        lowerMessage.includes("market") ||
        lowerMessage.includes("analysis") ||
        lowerMessage.includes("sentiment") ||
        lowerMessage.includes("trend")
      ) {
        response = await callTradingAPI(message, "market-analysis");
        if (response.success) {
          const marketData = response.market_data;
          const analysis = response.analysis;

          let responseText = `## Market Analysis\n\n${analysis}\n\n### Key Market Data:\n`;
          Object.entries(marketData).forEach(
            ([symbol, data]: [string, any]) => {
              responseText += `\n**${symbol}**: $${data.current_price?.toFixed(
                2
              )} (${data.change_percent?.toFixed(2)}%)\n`;
            }
          );

          updateMessage(loadingMessageId, responseText);
        }
      } else if (
        lowerMessage.includes("risk") ||
        lowerMessage.includes("portfolio")
      ) {
        response = await callTradingAPI(message, "risk-analysis");
        if (response.success) {
          const riskData = response.risk_analysis;
          const responseText = `## Portfolio Risk Analysis

**Risk Score**: ${riskData.risk_score?.toFixed(1)}/100 (${riskData.risk_level})
**Portfolio Beta**: ${riskData.portfolio_beta?.toFixed(2)}
**Max Position Weight**: ${riskData.max_position_weight?.toFixed(1)}%

### Risk Recommendations:
${
  riskData.recommendations?.map((rec: string) => `• ${rec}`).join("\n") ||
  "No specific recommendations at this time."
}

### Sector Allocation:
${Object.entries(riskData.sector_allocation || {})
  .map(
    ([sector, weight]: [string, any]) => `• ${sector}: ${weight.toFixed(1)}%`
  )
  .join("\n")}`;

          updateMessage(loadingMessageId, responseText);
        }
      } else if (
        lowerMessage.includes("signal") ||
        lowerMessage.includes("buy") ||
        lowerMessage.includes("sell") ||
        lowerMessage.includes("trade")
      ) {
        response = await callTradingAPI(message, "trading-signals");
        if (response.success) {
          const signals = response.signals;
          let responseText = `## Trading Signals\n\n`;

          Object.entries(signals).forEach(([symbol, signal]: [string, any]) => {
            responseText += `**${symbol}**: ${signal.signal} (${signal.strength}, ${signal.confidence}% confidence)\n`;
            responseText += `${signal.ai_analysis}\n\n`;
          });

          updateMessage(loadingMessageId, responseText);
        }
      } else if (
        /(?:price|quote|current\s+price)\s+of\s+([A-Za-z]{1,5})/.test(
          lowerMessage
        ) ||
        /^(?:[A-Za-z]{1,5})\s+price$/.test(lowerMessage)
      ) {
        const match =
          message.match(
            /(?:price|quote|current\s+price)\s+of\s+([A-Za-z]{1,5})/i
          ) || message.match(/^([A-Za-z]{1,5})\s+price$/i);
        const symbol = match ? match[1].toUpperCase() : "AAPL";
        response = await callTradingAPI(message, `stock-price:${symbol}`);
        if (response.success) {
          const data = response.data || {};
          const price = data.current_price ?? data.price ?? data.c ?? 0;
          const changePct = data.change_percent ?? data.dp ?? 0;
          const source = data.source || "Finnhub";
          updateMessage(
            loadingMessageId,
            `Current price for ${symbol}: $${Number(price).toFixed(
              2
            )} (${Number(changePct).toFixed(2)}%).\nSource: ${source}`
          );
        }
      } else {
        // General query - use recommendations endpoint
        response = await callTradingAPI(message, "recommendations");
        if (response.success) {
          updateMessage(loadingMessageId, response.recommendations);
        }
      }

      if (!response?.success) {
        throw new Error(response?.error || "Unknown error occurred");
      }
    } catch (error) {
      updateMessage(
        loadingMessageId,
        `I apologize, but I'm having trouble connecting to the trading data service right now. Please make sure your trading backend is running on localhost:5000.\n\nError: ${error}`
      );
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setIsLoading(true);

    // Add user message
    addMessage(userMessage, "user");

    // Process the message
    await processUserMessage(userMessage);

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90 z-50",
            className
          )}
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-2xl border-0 z-50 flex flex-col bg-background">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary/5 rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">AI Trading Assistant</h3>
                <p className="text-xs text-muted-foreground">
                  {hasSetTraderId ? `Trader: ${traderId}` : "Setup required"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2",
                    message.type === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.type === "bot" && (
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                      message.type === "user"
                        ? "bg-primary text-primary-foreground ml-auto"
                        : "bg-muted"
                    )}
                  >
                    {message.isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Thinking...</span>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">
                        {message.content}
                      </div>
                    )}
                  </div>
                  {message.type === "user" && (
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  hasSetTraderId
                    ? "Ask about markets, portfolio, or trading signals..."
                    : "Enter your Trader ID..."
                }
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
