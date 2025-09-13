import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WatchlistStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  isFavorite: boolean;
}

const watchlistData: WatchlistStock[] = [
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd',
    price: 2456.30,
    change: 23.45,
    changePercent: 0.96,
    volume: 1234567,
    high: 2478.90,
    low: 2432.10,
    isFavorite: true
  },
  {
    symbol: 'TCS',
    name: 'Tata Consultancy Services',
    price: 3789.60,
    change: -45.20,
    changePercent: -1.18,
    volume: 892345,
    high: 3834.80,
    low: 3756.40,
    isFavorite: false
  },
  {
    symbol: 'HDFC',
    name: 'HDFC Bank Limited',
    price: 1643.80,
    change: 12.30,
    changePercent: 0.75,
    volume: 2345678,
    high: 1659.20,
    low: 1625.40,
    isFavorite: true
  },
  {
    symbol: 'INFY',
    name: 'Infosys Limited',
    price: 1567.90,
    change: -8.40,
    changePercent: -0.53,
    volume: 1567890,
    high: 1582.30,
    low: 1545.60,
    isFavorite: false
  },
  {
    symbol: 'ICICIBANK',
    name: 'ICICI Bank Limited',
    price: 1234.50,
    change: 18.90,
    changePercent: 1.55,
    volume: 3456789,
    high: 1248.70,
    low: 1221.30,
    isFavorite: true
  }
];

export function Watchlist() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>My Watchlist</CardTitle>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Stock
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {watchlistData.map((stock) => {
            const isPositive = stock.change >= 0;
            
            return (
              <div
                key={stock.symbol}
                className="flex items-center justify-between p-3 rounded-lg border bg-gradient-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                  >
                    <Star className={cn(
                      "h-4 w-4",
                      stock.isFavorite ? "fill-warning text-warning" : "text-muted-foreground"
                    )} />
                  </Button>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{stock.symbol}</span>
                      <Badge variant="outline" className="text-xs">NSE</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {stock.name}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-medium">₹{stock.price.toFixed(2)}</div>
                  <div className={cn(
                    "flex items-center gap-1 text-xs",
                    isPositive ? "text-profit" : "text-loss"
                  )}>
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>{isPositive ? '+' : ''}{stock.change.toFixed(2)}</span>
                    <span>({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)</span>
                  </div>
                </div>
                
                <div className="text-right text-xs text-muted-foreground">
                  <div>Vol: {(stock.volume / 1000).toFixed(0)}K</div>
                  <div>H: {stock.high.toFixed(2)} L: {stock.low.toFixed(2)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}