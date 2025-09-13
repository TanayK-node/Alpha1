import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PortfolioSummaryProps {
  portfolio: any;
  positions: any[];
}

export function PortfolioSummary({ portfolio, positions }: PortfolioSummaryProps) {
  // Calculate portfolio metrics
  const investedValue = positions.reduce((sum, pos) => sum + (pos.avg_price * pos.quantity), 0);
  const currentValue = positions.reduce((sum, pos) => sum + (pos.current_price * pos.quantity), 0);
  const totalValue = portfolio.cash_balance + currentValue;
  const totalPnL = currentValue - investedValue;
  const totalPnLPercent = investedValue > 0 ? (totalPnL / investedValue) * 100 : 0;
  const dayChange = 0; // Would calculate from position price changes
  const dayChangePercent = 0;

  const metrics = [
    {
      title: "Portfolio Value",
      value: `₹${totalValue.toLocaleString()}`,
      change: `₹${dayChange.toLocaleString()} (${dayChangePercent.toFixed(2)}%)`,
      changeType: dayChange >= 0 ? "profit" : "loss",
      icon: DollarSign
    },
    {
      title: "Total P&L",
      value: `₹${totalPnL.toLocaleString()}`,
      change: `${totalPnLPercent.toFixed(2)}%`,
      changeType: totalPnL >= 0 ? "profit" : "loss",
      icon: TrendingUp
    },
    {
      title: "Cash Balance",
      value: `₹${portfolio.cash_balance.toLocaleString()}`,
      change: `${((portfolio.cash_balance / totalValue) * 100).toFixed(1)}% of portfolio`,
      changeType: "neutral",
      icon: PieChart
    },
    {
      title: "Invested Amount",
      value: `₹${investedValue.toLocaleString()}`,
      change: `${positions.length} positions`,
      changeType: "neutral",
      icon: Target
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <Card key={index} className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.title}
            </CardTitle>
            <metric.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <div className={cn(
              "text-xs flex items-center gap-1 mt-1",
              metric.changeType === "profit" && "text-profit",
              metric.changeType === "loss" && "text-loss",
              metric.changeType === "neutral" && "text-muted-foreground"
            )}>
              {metric.changeType === "profit" && <TrendingUp className="h-3 w-3" />}
              {metric.changeType === "loss" && <TrendingDown className="h-3 w-3" />}
              {metric.change}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}