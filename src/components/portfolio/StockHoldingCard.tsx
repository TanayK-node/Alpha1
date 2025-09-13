import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, MoreHorizontal } from 'lucide-react';

interface StockHolding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  ltp: number;
  investedValue: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

interface StockHoldingCardProps {
  stock: StockHolding;
}

export function StockHoldingCard({ stock }: StockHoldingCardProps) {
  const isProfitable = stock.pnl >= 0;
  const isDayPositive = stock.dayChange >= 0;
  
  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-semibold">
            {stock.symbol}
          </CardTitle>
          <p className="text-xs text-muted-foreground truncate max-w-[180px]">
            {stock.name}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Price Information */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold">₹{stock.ltp.toFixed(2)}</p>
              <div className="w-2 h-2 bg-profit rounded-full animate-pulse" title="Live Price"></div>
            </div>
            <div className="flex items-center space-x-1">
              {isDayPositive ? (
                <TrendingUp className="h-3 w-3 text-profit" />
              ) : (
                <TrendingDown className="h-3 w-3 text-loss" />
              )}
              <span className={cn(
                "text-xs",
                isDayPositive ? "text-profit" : "text-loss"
              )}>
                {isDayPositive ? '+' : ''}₹{Math.abs(stock.dayChange).toFixed(2)} ({isDayPositive ? '+' : ''}{stock.dayChangePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Qty: {stock.quantity}</p>
            <p className="text-sm text-muted-foreground">Avg: ₹{stock.avgPrice.toFixed(2)}</p>
          </div>
        </div>
        
        {/* Investment Summary */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Invested</p>
            <p className="font-medium">₹{stock.investedValue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Current</p>
            <p className="font-medium">₹{stock.currentValue.toLocaleString()}</p>
          </div>
        </div>
        
        {/* P&L */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">P&L:</span>
            <span className={cn(
              "font-semibold",
              isProfitable ? "text-profit" : "text-loss"
            )}>
              {isProfitable ? '+' : ''}₹{Math.abs(stock.pnl).toFixed(2)}
            </span>
          </div>
          <Badge 
            variant="outline"
            className={cn(
              isProfitable ? "border-profit text-profit" : "border-loss text-loss"
            )}
          >
            {isProfitable ? '+' : ''}{stock.pnlPercent.toFixed(2)}%
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}