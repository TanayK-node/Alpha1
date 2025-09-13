import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IndexData {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
}

const indicesData: IndexData[] = [
  {
    name: 'NIFTY 50',
    value: 24123.40,
    change: 203.65,
    changePercent: 0.85,
    high: 24198.30,
    low: 23945.20
  },
  {
    name: 'BANK NIFTY',
    value: 51234.60,
    change: -216.40,
    changePercent: -0.42,
    high: 51456.80,
    low: 51123.45
  },
  {
    name: 'NIFTY IT',
    value: 43567.80,
    change: 312.45,
    changePercent: 0.72,
    high: 43689.20,
    low: 43234.50
  },
  {
    name: 'SENSEX',
    value: 79823.50,
    change: 167.30,
    changePercent: 0.21,
    high: 79945.80,
    low: 79567.20
  }
];

export function MarketIndices() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {indicesData.map((index) => {
        const isPositive = index.change >= 0;
        
        return (
          <Card key={index.name} className="bg-gradient-card">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">{index.name}</h3>
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4 text-profit" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-loss" />
                  )}
                </div>
                
                <div className="space-y-1">
                  <div className="text-lg font-bold">
                    {index.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-sm font-medium",
                    isPositive ? "text-profit" : "text-loss"
                  )}>
                    <span>{isPositive ? '+' : ''}{index.change.toFixed(2)}</span>
                    <span>({isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%)</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    H: {index.high.toFixed(2)} | L: {index.low.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}