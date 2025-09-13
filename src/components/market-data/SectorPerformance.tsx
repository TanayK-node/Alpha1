import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectorData {
  name: string;
  change: number;
  volume: number;
  marketCap: number;
  topStocks: string[];
}

const sectorData: SectorData[] = [
  {
    name: 'Information Technology',
    change: 2.34,
    volume: 2345678900,
    marketCap: 15678900000000,
    topStocks: ['TCS', 'INFY', 'WIPRO', 'HCLTECH']
  },
  {
    name: 'Banking & Financial',
    change: 1.87,
    volume: 3456789000,
    marketCap: 12345600000000,
    topStocks: ['HDFCBANK', 'ICICIBANK', 'KOTAKBANK', 'AXISBANK']
  },
  {
    name: 'Oil & Gas',
    change: -1.23,
    volume: 1234567800,
    marketCap: 8765400000000,
    topStocks: ['RELIANCE', 'ONGC', 'IOC', 'BPCL']
  },
  {
    name: 'Automobiles',
    change: 0.89,
    volume: 987654300,
    marketCap: 6543200000000,
    topStocks: ['MARUTI', 'TATAMOTORS', 'M&M', 'BAJAJ-AUTO']
  },
  {
    name: 'Pharmaceuticals',
    change: -0.45,
    volume: 876543200,
    marketCap: 5432100000000,
    topStocks: ['SUNPHARMA', 'DRREDDY', 'CIPLA', 'DIVISLAB']
  },
  {
    name: 'Fast Moving Consumer Goods',
    change: 1.56,
    volume: 765432100,
    marketCap: 4321000000000,
    topStocks: ['HINDUNILVR', 'NESTLEIND', 'ITC', 'BRITANNIA']
  },
  {
    name: 'Metals & Mining',
    change: 3.78,
    volume: 1567890000,
    marketCap: 3210000000000,
    topStocks: ['TATASTEEL', 'JSWSTEEL', 'HINDALCO', 'COALINDIA']
  },
  {
    name: 'Real Estate',
    change: -2.11,
    volume: 543210000,
    marketCap: 2100000000000,
    topStocks: ['DLF', 'GODREJPROP', 'OBEROIRLTY', 'PRESTIGE']
  }
];

export function SectorPerformance() {
  const maxAbsChange = Math.max(...sectorData.map(sector => Math.abs(sector.change)));
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sector Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sectorData.map((sector) => {
              const isPositive = sector.change >= 0;
              const progressValue = (Math.abs(sector.change) / maxAbsChange) * 100;
              
              return (
                <div key={sector.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{sector.name}</span>
                      {isPositive ? (
                        <TrendingUp className="h-4 w-4 text-profit" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-loss" />
                      )}
                    </div>
                    <div className={cn(
                      "font-semibold",
                      isPositive ? "text-profit" : "text-loss"
                    )}>
                      {isPositive ? '+' : ''}{sector.change.toFixed(2)}%
                    </div>
                  </div>
                  
                  <Progress 
                    value={progressValue} 
                    className={cn(
                      "h-2",
                      isPositive ? "[&>div]:bg-profit" : "[&>div]:bg-loss"
                    )}
                  />
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div>
                      Vol: ₹{(sector.volume / 1000000000).toFixed(1)}B
                    </div>
                    <div>
                      MCap: ₹{(sector.marketCap / 1000000000000).toFixed(1)}T
                    </div>
                  </div>
                  
                  <div className="flex gap-1 flex-wrap">
                    {sector.topStocks.map((stock) => (
                      <span 
                        key={stock} 
                        className="px-2 py-1 text-xs bg-muted rounded text-muted-foreground"
                      >
                        {stock}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}