import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, MoreHorizontal, Target } from 'lucide-react';

interface OptionsPosition {
  id: string;
  strategy: string;
  underlying: string;
  strikes: number[];
  expiry: string;
  quantity: number;
  premium: number;
  ltp: number;
  pnl: number;
  pnlPercent: number;
  type: 'combination';
}

interface OptionsPositionCardProps {
  position: OptionsPosition;
}

export function OptionsPositionCard({ position }: OptionsPositionCardProps) {
  const isProfitable = position.pnl >= 0;
  
  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-semibold">
            {position.strategy}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{position.underlying}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            <Target className="h-3 w-3 mr-1" />
            Strategy
          </Badge>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Strike Prices */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Strike Prices</p>
          <div className="flex flex-wrap gap-1">
            {position.strikes.map((strike, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {strike}
              </Badge>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Quantity</p>
            <p className="font-medium">{position.quantity}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Expiry</p>
            <p className="font-medium">{position.expiry}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Premium</p>
            <p className="font-medium">₹{position.premium.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">LTP</p>
            <p className="font-medium">₹{position.ltp.toFixed(2)}</p>
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