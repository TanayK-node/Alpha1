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
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  date: string;
  time: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  amount: number;
  charges: number;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
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
              <TableHead className="text-right">Charges</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{transaction.date}</div>
                    <div className="text-xs text-muted-foreground">{transaction.time}</div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {transaction.symbol}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={transaction.type === 'BUY' ? 'default' : 'secondary'}
                    className={cn(
                      transaction.type === 'BUY' ? 'bg-profit/10 text-profit border-profit' : 'bg-loss/10 text-loss border-loss'
                    )}
                  >
                    {transaction.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{transaction.quantity}</TableCell>
                <TableCell className="text-right">₹{transaction.price.toFixed(2)}</TableCell>
                <TableCell className="text-right font-medium">
                  ₹{transaction.amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  ₹{transaction.charges.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}