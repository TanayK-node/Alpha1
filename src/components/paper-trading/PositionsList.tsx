import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PositionsListProps {
  positions: any[];
}

export function PositionsList({ positions }: PositionsListProps) {
  if (positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Positions</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No positions found. Start trading to see your positions here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Positions ({positions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {positions.map((position) => {
            const currentValue = position.current_price * position.quantity;
            const investedValue = position.avg_price * position.quantity;
            const pnl = currentValue - investedValue;
            const pnlPercent = (pnl / investedValue) * 100;

            return (
              <div
                key={position.id}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{position.symbol}</h3>
                    <p className="text-sm text-muted-foreground">
                      Qty: {position.quantity} | Avg: ₹{position.avg_price.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-medium">₹{position.current_price.toFixed(2)}</div>
                      <div className="w-2 h-2 bg-profit rounded-full animate-pulse" title="Live Price"></div>
                    </div>
                    <div className={cn(
                      "text-sm flex items-center gap-1",
                      pnl >= 0 ? "text-profit" : "text-loss"
                    )}>
                      {pnl >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      ₹{pnl.toFixed(2)} ({pnlPercent.toFixed(2)}%)
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Current Value:</span>
                    <div className="font-medium">₹{currentValue.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Invested:</span>
                    <div className="font-medium">₹{investedValue.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Day Change:</span>
                    <div className="font-medium text-neutral">₹0.00 (0.00%)</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={pnl >= 0 ? "default" : "destructive"}>
                      {pnl >= 0 ? "Profit" : "Loss"}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}