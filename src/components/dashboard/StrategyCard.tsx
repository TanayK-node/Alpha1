import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Play, Pause, Settings, BarChart3 } from 'lucide-react';

interface Strategy {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'paused' | 'stopped';
  pnl: number;
  pnlPercent: number;
  trades: number;
  winRate: number;
  nextTrade?: string;
}

interface StrategyCardProps {
  strategy: Strategy;
}

export function StrategyCard({ strategy }: StrategyCardProps) {
  const isProfitable = strategy.pnl >= 0;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-profit text-profit-foreground';
      case 'paused': return 'bg-yellow-500 text-white';
      default: return 'bg-neutral text-white';
    }
  };

  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-semibold">{strategy.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{strategy.type}</p>
        </div>
        <Badge className={getStatusColor(strategy.status)}>
          {strategy.status}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* P&L Section */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total P&L</p>
            <p className={cn(
              "text-lg font-semibold",
              isProfitable ? "text-profit" : "text-loss"
            )}>
              ₹{Math.abs(strategy.pnl).toFixed(2)}
            </p>
          </div>
          <Badge 
            variant="outline"
            className={cn(
              isProfitable ? "border-profit text-profit" : "border-loss text-loss"
            )}
          >
            {isProfitable ? '+' : ''}{strategy.pnlPercent.toFixed(2)}%
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Trades</p>
            <p className="font-medium">{strategy.trades}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Win Rate</p>
            <p className="font-medium">{strategy.winRate}%</p>
          </div>
        </div>

        {strategy.nextTrade && (
          <div className="text-xs text-muted-foreground">
            Next trade: {strategy.nextTrade}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex items-center space-x-2 pt-2 border-t">
          <Button 
            size="sm" 
            variant={strategy.status === 'active' ? 'outline' : 'default'}
            className="flex-1"
          >
            {strategy.status === 'active' ? (
              <Pause className="h-3 w-3 mr-1" />
            ) : (
              <Play className="h-3 w-3 mr-1" />
            )}
            {strategy.status === 'active' ? 'Pause' : 'Start'}
          </Button>
          
          <Button size="sm" variant="outline">
            <Settings className="h-3 w-3" />
          </Button>
          
          <Button size="sm" variant="outline">
            <BarChart3 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}