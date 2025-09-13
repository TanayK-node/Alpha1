import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Position {
  id?: string;
  strategy?: string;
  underlying?: string;
  type?: 'CE' | 'PE';
  strike?: number;
  expiry?: string;
  quantity: number;
  entry?: number;
  ltp?: number;
  pnl: number;
  pnlPercent: number;
  // For stock positions
  symbol?: string;
  avgPrice?: number;
  currentPrice?: number;
}

interface PositionCardProps {
  position: Position;
}

export function PositionCard({ position }: PositionCardProps) {
  const isProfitable = position.pnl >= 0;
  const isStockPosition = !!position.symbol;
  const displayTitle = isStockPosition ? position.symbol : position.strategy;
  const displaySubtitle = isStockPosition 
    ? `Qty: ${position.quantity}` 
    : `${position.underlying} ${position.strike} ${position.type}`;
  const displayPrice = isStockPosition ? position.currentPrice : position.ltp;
  const displayEntry = isStockPosition ? position.avgPrice : position.entry;
  
  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">
            {displayTitle}
          </CardTitle>
          <div className="text-xs text-muted-foreground">
            {displaySubtitle}
            {!isStockPosition && position.expiry && (
              <div className="mt-1">
                <Badge variant="outline" className="text-xs">
                  {position.expiry}
                </Badge>
              </div>
            )}
          </div>
        </div>
        {!isStockPosition && position.type && (
          <Badge variant={position.type === 'CE' ? 'default' : 'secondary'}>
            {position.type}
          </Badge>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">
              {isStockPosition ? 'Current Price' : 'LTP'}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-lg font-semibold">₹{displayPrice?.toFixed(2)}</div>
              {isStockPosition && (
                <div className="w-2 h-2 bg-profit rounded-full animate-pulse" title="Live Price"></div>
              )}
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="text-sm text-muted-foreground">
              {isStockPosition ? 'Avg Price' : 'Entry'}
            </div>
            <div className="text-lg font-medium">₹{displayEntry?.toFixed(2)}</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-2">
            {isProfitable ? (
              <TrendingUp className="h-4 w-4 text-profit" />
            ) : (
              <TrendingDown className="h-4 w-4 text-loss" />
            )}
            <span className={cn(
              "font-semibold",
              isProfitable ? "text-profit" : "text-loss"
            )}>
              ₹{Math.abs(position.pnl).toFixed(2)}
            </span>
          </div>
          <Badge 
            variant="outline"
            className={cn(
              isProfitable ? "border-profit text-profit" : "border-loss text-loss"
            )}
          >
            {isProfitable ? '+' : ''}{position.pnlPercent.toFixed(2)}%
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}