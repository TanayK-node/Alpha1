import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';

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

interface HoldingsTableProps {
  holdings: StockHolding[];
}

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Holdings Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Avg Price</TableHead>
              <TableHead className="text-right">LTP</TableHead>
              <TableHead className="text-right">Day Change</TableHead>
              <TableHead className="text-right">Current Value</TableHead>
              <TableHead className="text-right">P&L</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holdings.map((stock) => {
              const isProfitable = stock.pnl >= 0;
              const isDayPositive = stock.dayChange >= 0;
              
              return (
                <TableRow key={stock.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{stock.symbol}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {stock.name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{stock.quantity}</TableCell>
                  <TableCell className="text-right">₹{stock.avgPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <div>₹{stock.ltp.toFixed(2)}</div>
                      <div className="w-2 h-2 bg-profit rounded-full animate-pulse" title="Live Price"></div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      {isDayPositive ? (
                        <TrendingUp className="h-3 w-3 text-profit" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-loss" />
                      )}
                      <span className={cn(
                        "text-sm",
                        isDayPositive ? "text-profit" : "text-loss"
                      )}>
                        {isDayPositive ? '+' : ''}₹{Math.abs(stock.dayChange).toFixed(2)}
                      </span>
                    </div>
                    <div className={cn(
                      "text-xs",
                      isDayPositive ? "text-profit" : "text-loss"
                    )}>
                      ({isDayPositive ? '+' : ''}{stock.dayChangePercent.toFixed(2)}%)
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{stock.currentValue.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={cn(
                      "font-semibold",
                      isProfitable ? "text-profit" : "text-loss"
                    )}>
                      {isProfitable ? '+' : ''}₹{Math.abs(stock.pnl).toFixed(2)}
                    </div>
                    <Badge 
                      variant="outline"
                      className={cn(
                        "text-xs",
                        isProfitable ? "border-profit text-profit" : "border-loss text-loss"
                      )}
                    >
                      {isProfitable ? '+' : ''}{stock.pnlPercent.toFixed(2)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}