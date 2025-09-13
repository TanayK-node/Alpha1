import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface TransactionHistoryProps {
  transactions: any[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No transactions found. Start trading to see your transaction history.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Fees</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => {
              const date = new Date(transaction.executed_at);
              const dateStr = date.toLocaleDateString();
              const timeStr = date.toLocaleTimeString();

              return (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{dateStr}</div>
                      <div className="text-xs text-muted-foreground">{timeStr}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {transaction.symbol}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={transaction.type === 'BUY' ? 'default' : 'secondary'}
                      className={cn(
                        transaction.type === 'BUY' 
                          ? 'bg-profit/10 text-profit border-profit' 
                          : 'bg-loss/10 text-loss border-loss'
                      )}
                    >
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{transaction.quantity}</TableCell>
                  <TableCell className="text-right">₹{transaction.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{transaction.total_amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    ₹{transaction.fees.toFixed(2)}
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