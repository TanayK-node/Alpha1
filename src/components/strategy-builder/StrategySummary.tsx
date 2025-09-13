import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TradingStrategy } from '@/types/strategy';
import { TrendingUp, TrendingDown, Target, Zap } from 'lucide-react';

interface StrategySummaryProps {
  strategy: Partial<TradingStrategy>;
}

export function StrategySummary({ strategy }: StrategySummaryProps) {
  const totalCredit = strategy.legs?.reduce((total, leg) => {
    const premium = leg.premium || 150;
    const value = premium * leg.quantity * leg.lotSize;
    return total + (leg.action === 'SELL' ? value : 0);
  }, 0) || 0;

  const totalDebit = strategy.legs?.reduce((total, leg) => {
    const premium = leg.premium || 150;
    const value = premium * leg.quantity * leg.lotSize;
    return total + (leg.action === 'BUY' ? value : 0);
  }, 0) || 0;

  const netPremium = totalCredit - totalDebit;
  const isNetCredit = netPremium > 0;

  const getStrategyTypeIcon = (type?: string) => {
    switch (type) {
      case 'directional': return TrendingUp;
      case 'neutral': return Target;
      case 'volatility': return Zap;
      default: return Target;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Strategy Summary
          <Badge variant={strategy.isActive ? 'default' : 'secondary'}>
            {strategy.isActive ? 'Active' : 'Draft'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Strategy Name</div>
              <div className="font-medium">{strategy.name || 'Unnamed Strategy'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Strategy Type</div>
              <div className="flex items-center space-x-2">
                {strategy.type && (() => {
                  const Icon = getStrategyTypeIcon(strategy.type);
                  return <Icon className="h-4 w-4" />;
                })()}
                <span className="font-medium capitalize">{strategy.type || 'Not set'}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Legs Summary */}
          <div>
            <div className="text-sm text-muted-foreground mb-2">Strategy Legs ({strategy.legs?.length || 0})</div>
            {strategy.legs && strategy.legs.length > 0 ? (
              <div className="space-y-2">
                {strategy.legs.map((leg, index) => (
                  <div key={leg.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                    <div className="flex items-center space-x-2">
                      <Badge variant={leg.action === 'BUY' ? 'default' : 'destructive'} className="text-xs">
                        {leg.action}
                      </Badge>
                      <Badge variant={leg.type === 'CE' ? 'outline' : 'secondary'} className="text-xs">
                        {leg.type}
                      </Badge>
                      <span>₹{leg.strike}</span>
                      <span className="text-muted-foreground">({leg.quantity}x{leg.lotSize})</span>
                    </div>
                    <div className={leg.action === 'BUY' ? 'text-destructive' : 'text-profit'}>
                      {leg.action === 'BUY' ? '-' : '+'}₹{((leg.premium || 150) * leg.quantity * leg.lotSize).toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No legs configured</div>
            )}
          </div>

          <Separator />

          {/* Premium Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Total Credit</div>
              <div className="text-lg font-bold text-profit">₹{totalCredit.toFixed(0)}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Total Debit</div>
              <div className="text-lg font-bold text-destructive">₹{totalDebit.toFixed(0)}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Net Premium</div>
              <div className={`text-lg font-bold ${isNetCredit ? 'text-profit' : 'text-destructive'}`}>
                {isNetCredit ? '+' : ''}₹{netPremium.toFixed(0)}
              </div>
            </div>
          </div>

          <Separator />

          {/* Conditions Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Entry Conditions</div>
              <div className="text-sm">
                {strategy.entryConditions && strategy.entryConditions.length > 0 
                  ? `${strategy.entryConditions.length} condition${strategy.entryConditions.length > 1 ? 's' : ''}`
                  : 'None set'
                }
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Exit Conditions</div>
              <div className="text-sm">
                {strategy.exitConditions && strategy.exitConditions.length > 0 
                  ? `${strategy.exitConditions.length} condition${strategy.exitConditions.length > 1 ? 's' : ''}`
                  : 'None set'
                }
              </div>
            </div>
          </div>

          {strategy.description && (
            <>
              <Separator />
              <div>
                <div className="text-sm text-muted-foreground mb-1">Description</div>
                <div className="text-sm">{strategy.description}</div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}