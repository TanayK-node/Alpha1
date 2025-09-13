import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trade } from '@/pages/Backtest';

interface TradesListProps {
  trades: Trade[];
}

export function TradesList({ trades }: TradesListProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getPnLBadge = (pnl: number) => {
    if (pnl > 0) return <Badge variant="default" className="bg-green-500">Profit</Badge>;
    if (pnl < 0) return <Badge variant="destructive">Loss</Badge>;
    return <Badge variant="secondary">Break Even</Badge>;
  };

  if (trades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trades</CardTitle>
          <CardDescription>No trades were executed during this backtest period</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade History</CardTitle>
        <CardDescription>
          {trades.length} trades executed during the backtest period
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entry Date</TableHead>
                <TableHead>Exit Date</TableHead>
                <TableHead>Entry Price</TableHead>
                <TableHead>Exit Price</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>P&L</TableHead>
                <TableHead>P&L %</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade, index) => (
                <TableRow key={index}>
                  <TableCell>{new Date(trade.entryTime).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(trade.exitTime).toLocaleDateString()}</TableCell>
                  <TableCell>{formatCurrency(trade.entryPrice)}</TableCell>
                  <TableCell>{formatCurrency(trade.exitPrice)}</TableCell>
                  <TableCell>{trade.size.toFixed(0)}</TableCell>
                  <TableCell className={trade.pnl >= 0 ? 'text-green-600' : 'text-destructive'}>
                    {formatCurrency(trade.pnl)}
                  </TableCell>
                  <TableCell className={trade.pnlPct >= 0 ? 'text-green-600' : 'text-destructive'}>
                    {formatPercent(trade.pnlPct)}
                  </TableCell>
                  <TableCell>
                    {getPnLBadge(trade.pnl)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}