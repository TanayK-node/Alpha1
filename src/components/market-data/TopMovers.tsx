import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StockMover {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

const topGainers: StockMover[] = [
  { symbol: 'ADANIPORTS', price: 1234.50, change: 67.80, changePercent: 5.82, volume: 2345678 },
  { symbol: 'TATASTEEL', price: 890.30, change: 45.60, changePercent: 5.40, volume: 3456789 },
  { symbol: 'JSWSTEEL', price: 756.90, change: 35.20, changePercent: 4.88, volume: 1567890 },
  { symbol: 'HINDALCO', price: 567.40, change: 25.80, changePercent: 4.76, volume: 2234567 },
  { symbol: 'COALINDIA', price: 423.70, change: 18.90, changePercent: 4.67, volume: 1789012 }
];

const topLosers: StockMover[] = [
  { symbol: 'BAJFINANCE', price: 6789.20, change: -245.60, changePercent: -3.49, volume: 1234567 },
  { symbol: 'HDFCLIFE', price: 567.80, change: -18.90, changePercent: -3.22, volume: 2345678 },
  { symbol: 'SBILIFE', price: 1345.60, change: -42.30, changePercent: -3.05, volume: 1567890 },
  { symbol: 'KOTAKBANK', price: 1789.40, change: -52.80, changePercent: -2.87, volume: 2234567 },
  { symbol: 'AXISBANK', price: 1123.50, change: -31.20, changePercent: -2.70, volume: 1789012 }
];

const mostActive: StockMover[] = [
  { symbol: 'RELIANCE', price: 2456.30, change: 23.45, changePercent: 0.96, volume: 12345678 },
  { symbol: 'ICICIBANK', price: 1234.50, change: 18.90, changePercent: 1.55, volume: 11234567 },
  { symbol: 'HDFCBANK', price: 1643.80, change: 12.30, changePercent: 0.75, volume: 10567890 },
  { symbol: 'TCS', price: 3789.60, change: -45.20, changePercent: -1.18, volume: 9876543 },
  { symbol: 'INFY', price: 1567.90, change: -8.40, changePercent: -0.53, volume: 8765432 }
];

function MoversList({ stocks }: { stocks: StockMover[] }) {
  return (
    <div className="space-y-2">
      {stocks.map((stock, index) => {
        const isPositive = stock.change >= 0;
        
        return (
          <div key={stock.symbol} className="flex items-center justify-between p-2 rounded border bg-gradient-card">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
              <div>
                <div className="font-medium text-sm">{stock.symbol}</div>
                <div className="text-xs text-muted-foreground">
                  Vol: {(stock.volume / 1000000).toFixed(1)}M
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-medium text-sm">₹{stock.price.toFixed(2)}</div>
              <div className={cn(
                "flex items-center gap-1 text-xs",
                isPositive ? "text-profit" : "text-loss"
              )}>
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TopMovers() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Movers</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="gainers">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gainers">Top Gainers</TabsTrigger>
            <TabsTrigger value="losers">Top Losers</TabsTrigger>
            <TabsTrigger value="active">Most Active</TabsTrigger>
          </TabsList>
          
          <TabsContent value="gainers" className="mt-4">
            <MoversList stocks={topGainers} />
          </TabsContent>
          
          <TabsContent value="losers" className="mt-4">
            <MoversList stocks={topLosers} />
          </TabsContent>
          
          <TabsContent value="active" className="mt-4">
            <MoversList stocks={mostActive} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}