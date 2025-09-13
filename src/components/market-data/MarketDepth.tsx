import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface OrderBookEntry {
  price: number;
  quantity: number;
  orders: number;
}

const bidData: OrderBookEntry[] = [
  { price: 24123.40, quantity: 125, orders: 8 },
  { price: 24122.90, quantity: 245, orders: 12 },
  { price: 24122.40, quantity: 180, orders: 15 },
  { price: 24121.95, quantity: 320, orders: 22 },
  { price: 24121.50, quantity: 150, orders: 10 }
];

const askData: OrderBookEntry[] = [
  { price: 24124.10, quantity: 95, orders: 6 },
  { price: 24124.55, quantity: 210, orders: 14 },
  { price: 24125.00, quantity: 165, orders: 11 },
  { price: 24125.45, quantity: 280, orders: 18 },
  { price: 24125.90, quantity: 135, orders: 9 }
];

export function MarketDepth() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Market Depth</CardTitle>
          <Select defaultValue="NIFTY50">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NIFTY50">NIFTY 50</SelectItem>
              <SelectItem value="BANKNIFTY">BANK NIFTY</SelectItem>
              <SelectItem value="RELIANCE">RELIANCE</SelectItem>
              <SelectItem value="TCS">TCS</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Headers */}
          <div className="grid grid-cols-6 gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
            <div className="text-center">Orders</div>
            <div className="text-center">Qty</div>
            <div className="text-center text-profit">Bid</div>
            <div className="text-center text-loss">Ask</div>
            <div className="text-center">Qty</div>
            <div className="text-center">Orders</div>
          </div>
          
          {/* Order Book Data */}
          <div className="space-y-1">
            {bidData.map((bid, index) => {
              const ask = askData[index];
              const maxQty = Math.max(
                Math.max(...bidData.map(b => b.quantity)),
                Math.max(...askData.map(a => a.quantity))
              );
              
              return (
                <div key={index} className="grid grid-cols-6 gap-2 text-xs items-center py-1">
                  {/* Bid Side */}
                  <div className="text-center text-muted-foreground">{bid.orders}</div>
                  <div className="text-center relative">
                    <div 
                      className="absolute inset-0 bg-profit/10 rounded"
                      style={{ width: `${(bid.quantity / maxQty) * 100}%` }}
                    />
                    <span className="relative">{bid.quantity}</span>
                  </div>
                  <div className="text-center font-medium text-profit">{bid.price.toFixed(2)}</div>
                  
                  {/* Ask Side */}
                  <div className="text-center font-medium text-loss">{ask.price.toFixed(2)}</div>
                  <div className="text-center relative">
                    <div 
                      className="absolute inset-0 bg-loss/10 rounded"
                      style={{ width: `${(ask.quantity / maxQty) * 100}%` }}
                    />
                    <span className="relative">{ask.quantity}</span>
                  </div>
                  <div className="text-center text-muted-foreground">{ask.orders}</div>
                </div>
              );
            })}
          </div>
          
          {/* Summary */}
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-muted-foreground">Total Bid Qty</div>
                <div className="font-medium text-profit">
                  {bidData.reduce((sum, bid) => sum + bid.quantity, 0)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">Total Ask Qty</div>
                <div className="font-medium text-loss">
                  {askData.reduce((sum, ask) => sum + ask.quantity, 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}