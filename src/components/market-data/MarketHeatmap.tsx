import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface HeatmapStock {
  symbol: string;
  name: string;
  change: number;
  marketCap: number;
  sector: string;
}

const heatmapData: HeatmapStock[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', change: 2.34, marketCap: 1567890, sector: 'Oil & Gas' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', change: 1.87, marketCap: 1234567, sector: 'IT' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', change: 0.89, marketCap: 987654, sector: 'Banking' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', change: -1.23, marketCap: 876543, sector: 'Banking' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', change: 1.56, marketCap: 765432, sector: 'FMCG' },
  { symbol: 'INFY', name: 'Infosys', change: 2.11, marketCap: 654321, sector: 'IT' },
  { symbol: 'ITC', name: 'ITC Limited', change: -0.45, marketCap: 543210, sector: 'FMCG' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', change: 0.67, marketCap: 432109, sector: 'Banking' },
  { symbol: 'LT', name: 'Larsen & Toubro', change: 1.34, marketCap: 321098, sector: 'Construction' },
  { symbol: 'AXISBANK', name: 'Axis Bank', change: -0.78, marketCap: 298765, sector: 'Banking' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki', change: 2.89, marketCap: 287654, sector: 'Auto' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', change: -1.67, marketCap: 276543, sector: 'Pharma' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', change: 1.45, marketCap: 265432, sector: 'NBFC' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', change: 0.23, marketCap: 254321, sector: 'Telecom' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints', change: -0.89, marketCap: 243210, sector: 'Paints' },
  { symbol: 'WIPRO', name: 'Wipro Limited', change: 1.78, marketCap: 232109, sector: 'IT' },
  { symbol: 'NTPC', name: 'NTPC Limited', change: 0.56, marketCap: 221098, sector: 'Power' },
  { symbol: 'TATASTEEL', name: 'Tata Steel', change: 3.45, marketCap: 210987, sector: 'Steel' },
  { symbol: 'JSWSTEEL', name: 'JSW Steel', change: 2.67, marketCap: 198765, sector: 'Steel' },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation', change: -0.34, marketCap: 187654, sector: 'Power' }
];

function getChangeColor(change: number) {
  if (change > 2) return 'bg-profit text-white';
  if (change > 1) return 'bg-profit/70 text-white';
  if (change > 0) return 'bg-profit/40 text-foreground';
  if (change > -1) return 'bg-loss/40 text-foreground';
  if (change > -2) return 'bg-loss/70 text-white';
  return 'bg-loss text-white';
}

function getItemSize(marketCap: number, maxMarketCap: number) {
  const ratio = marketCap / maxMarketCap;
  if (ratio > 0.8) return 'col-span-3 row-span-2';
  if (ratio > 0.6) return 'col-span-2 row-span-2';
  if (ratio > 0.4) return 'col-span-2';
  if (ratio > 0.2) return 'col-span-1';
  return 'col-span-1';
}

export function MarketHeatmap() {
  const maxMarketCap = Math.max(...heatmapData.map(stock => stock.marketCap));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-8 gap-2 h-96">
          {heatmapData.slice(0, 20).map((stock) => (
            <div
              key={stock.symbol}
              className={cn(
                "rounded p-2 flex flex-col justify-between transition-all hover:scale-105 cursor-pointer",
                getItemSize(stock.marketCap, maxMarketCap),
                getChangeColor(stock.change)
              )}
            >
              <div>
                <div className="font-bold text-xs">{stock.symbol}</div>
                <div className="text-xs opacity-80 truncate">{stock.sector}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm">
                  {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}%
                </div>
                <div className="text-xs opacity-80">
                  ₹{(stock.marketCap / 1000).toFixed(0)}K Cr
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-profit rounded"></div>
              <span>Gainers</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-loss rounded"></div>
              <span>Losers</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Size represents market capitalization
          </div>
        </div>
      </CardContent>
    </Card>
  );
}