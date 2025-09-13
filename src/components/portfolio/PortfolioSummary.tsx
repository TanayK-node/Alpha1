import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Target, PieChart, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PortfolioSummaryProps {
  totalInvested: number;
  totalCurrent: number;
  totalPnL: number;
  totalPnLPercent: number;
  dayChange: number;
  dayChangePercent: number;
  holdingsCount?: number;
}

export function PortfolioSummary({
  totalInvested,
  totalCurrent,
  totalPnL,
  totalPnLPercent,
  dayChange,
  dayChangePercent,
  holdingsCount = 0
}: PortfolioSummaryProps) {
  const isProfitable = totalPnL >= 0;
  const isDayPositive = dayChange >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Portfolio Value */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Portfolio Value
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{totalCurrent.toLocaleString()}</div>
          <div className="flex items-center space-x-2 mt-1">
            {isDayPositive ? (
              <TrendingUp className="h-4 w-4 text-profit" />
            ) : (
              <TrendingDown className="h-4 w-4 text-loss" />
            )}
            <span className={cn(
              "text-sm font-medium",
              isDayPositive ? "text-profit" : "text-loss"
            )}>
              ₹{Math.abs(dayChange).toFixed(2)} ({isDayPositive ? '+' : ''}{dayChangePercent.toFixed(2)}%)
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Today's change</p>
        </CardContent>
      </Card>

      {/* Total P&L */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total P&L
          </CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={cn(
            "text-2xl font-bold",
            isProfitable ? "text-profit" : "text-loss"
          )}>
            {isProfitable ? '+' : ''}₹{Math.abs(totalPnL).toLocaleString()}
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <Badge 
              variant="outline"
              className={cn(
                isProfitable ? "border-profit text-profit" : "border-loss text-loss"
              )}
            >
              {isProfitable ? '+' : ''}{totalPnLPercent.toFixed(2)}%
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Overall returns</p>
        </CardContent>
      </Card>

      {/* Invested Amount */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Invested
          </CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{totalInvested.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">Total investment</p>
        </CardContent>
      </Card>

      {/* Holdings Count */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Holdings
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{holdingsCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Active stocks</p>
        </CardContent>
      </Card>
    </div>
  );
}