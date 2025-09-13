import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { TradingStrategy } from '@/types/strategy';

interface StrategyValidationProps {
  strategy: Partial<TradingStrategy>;
}

export function StrategyValidation({ strategy }: StrategyValidationProps) {
  const validations = [
    {
      id: 'name',
      label: 'Strategy Name',
      status: strategy.name ? 'valid' : 'invalid',
      message: strategy.name ? 'Strategy has a name' : 'Strategy name is required'
    },
    {
      id: 'legs',
      label: 'Strategy Legs',
      status: strategy.legs && strategy.legs.length > 0 ? 'valid' : 'invalid',
      message: strategy.legs && strategy.legs.length > 0 
        ? `${strategy.legs.length} leg${strategy.legs.length > 1 ? 's' : ''} configured`
        : 'At least one strategy leg is required'
    },
    {
      id: 'entry-conditions',
      label: 'Entry Conditions',
      status: strategy.entryConditions && strategy.entryConditions.length > 0 ? 'valid' : 'warning',
      message: strategy.entryConditions && strategy.entryConditions.length > 0
        ? `${strategy.entryConditions.length} entry condition${strategy.entryConditions.length > 1 ? 's' : ''} set`
        : 'No entry conditions set (strategy will execute immediately)'
    },
    {
      id: 'exit-conditions',
      label: 'Exit Conditions',
      status: strategy.exitConditions && strategy.exitConditions.length > 0 ? 'valid' : 'warning',
      message: strategy.exitConditions && strategy.exitConditions.length > 0
        ? `${strategy.exitConditions.length} exit condition${strategy.exitConditions.length > 1 ? 's' : ''} set`
        : 'No exit conditions set (manual exit required)'
    }
  ];

  const validCount = validations.filter(v => v.status === 'valid').length;
  const warningCount = validations.filter(v => v.status === 'warning').length;
  const invalidCount = validations.filter(v => v.status === 'invalid').length;

  const isDeployable = invalidCount === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Strategy Validation
          <Badge variant={isDeployable ? 'default' : 'destructive'}>
            {isDeployable ? 'Ready to Deploy' : 'Incomplete'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {validations.map((validation) => {
            const StatusIcon = validation.status === 'valid' ? CheckCircle :
                              validation.status === 'warning' ? AlertTriangle : XCircle;
            const statusColor = validation.status === 'valid' ? 'text-green-500' :
                               validation.status === 'warning' ? 'text-yellow-500' : 'text-red-500';

            return (
              <div key={validation.id} className="flex items-center space-x-3">
                <StatusIcon className={`h-4 w-4 ${statusColor}`} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{validation.label}</div>
                  <div className="text-xs text-muted-foreground">{validation.message}</div>
                </div>
              </div>
            );
          })}
        </div>

        {!isDeployable && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Complete all required fields to deploy your strategy for live trading.
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-green-500">{validCount} Valid</span>
            <span className="text-yellow-500">{warningCount} Warnings</span>
            <span className="text-red-500">{invalidCount} Issues</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}