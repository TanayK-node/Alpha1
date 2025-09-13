import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Plus, Zap, Shield, Target, TrendingUp } from 'lucide-react';
import { StrategyTemplate } from '@/types/strategy';

const strategyTemplates: StrategyTemplate[] = [
  {
    id: 'long-straddle',
    name: 'Long Straddle',
    description: 'Buy ATM Call + Buy ATM Put',
    category: 'Volatility',
    legs: [
      { type: 'CE', action: 'BUY', quantity: 1, lotSize: 25 },
      { type: 'PE', action: 'BUY', quantity: 1, lotSize: 25 }
    ],
    defaultConditions: {
      entry: [{ type: 'time', parameter: 'market_open', operator: '>=', value: '09:20', enabled: true }],
      exit: [
        { type: 'profit_target', parameter: 'percentage', value: 25, enabled: true },
        { type: 'stop_loss', parameter: 'percentage', value: 50, enabled: true }
      ]
    }
  },
  {
    id: 'iron-condor',
    name: 'Iron Condor',
    description: 'Sell ITM Call + Buy OTM Call + Sell ITM Put + Buy OTM Put',
    category: 'Range Bound',
    legs: [
      { type: 'CE', action: 'SELL', quantity: 1, lotSize: 25 },
      { type: 'CE', action: 'BUY', quantity: 1, lotSize: 25 },
      { type: 'PE', action: 'SELL', quantity: 1, lotSize: 25 },
      { type: 'PE', action: 'BUY', quantity: 1, lotSize: 25 }
    ],
    defaultConditions: {
      entry: [{ type: 'volatility', parameter: 'iv', operator: '<', value: 20, enabled: true }],
      exit: [
        { type: 'profit_target', parameter: 'percentage', value: 50, enabled: true },
        { type: 'time_based', parameter: 'dte', value: 5, enabled: true }
      ]
    }
  },
  {
    id: 'long-butterfly',
    name: 'Long Butterfly',
    description: 'Buy ITM + Sell 2 ATM + Buy OTM (same type)',
    category: 'Neutral',
    legs: [
      { type: 'CE', action: 'BUY', quantity: 1, lotSize: 25 },
      { type: 'CE', action: 'SELL', quantity: 2, lotSize: 25 },
      { type: 'CE', action: 'BUY', quantity: 1, lotSize: 25 }
    ],
    defaultConditions: {
      entry: [{ type: 'price', parameter: 'underlying', operator: '>=', value: 24100, enabled: true }],
      exit: [
        { type: 'profit_target', parameter: 'points', value: 30, enabled: true },
        { type: 'stop_loss', parameter: 'points', value: 15, enabled: true }
      ]
    }
  },
  {
    id: 'covered-call',
    name: 'Covered Call',
    description: 'Sell OTM Call (when holding underlying)',
    category: 'Income',
    legs: [
      { type: 'CE', action: 'SELL', quantity: 1, lotSize: 25 }
    ],
    defaultConditions: {
      entry: [{ type: 'technical', parameter: 'rsi', operator: '>', value: 70, enabled: true }],
      exit: [
        { type: 'profit_target', parameter: 'percentage', value: 80, enabled: true },
        { type: 'time_based', parameter: 'dte', value: 7, enabled: true }
      ]
    }
  }
];

interface StrategyTemplatesProps {
  onSelectTemplate: (template: StrategyTemplate) => void;
}

export function StrategyTemplates({ onSelectTemplate }: StrategyTemplatesProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Volatility': return Zap;
      case 'Range Bound': return Shield;
      case 'Neutral': return Target;
      case 'Income': return TrendingUp;
      default: return Plus;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Volatility': return 'bg-yellow-500';
      case 'Range Bound': return 'bg-blue-500';
      case 'Neutral': return 'bg-green-500';
      case 'Income': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Strategy Templates</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strategyTemplates.map((template) => {
            const Icon = getCategoryIcon(template.category);
            const colorClass = getCategoryColor(template.category);
            
            return (
              <div
                key={template.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onSelectTemplate(template)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={cn("p-2 rounded-lg text-white", colorClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{template.name}</h3>
                      <Badge variant="outline" className="text-xs mt-1">
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground mb-2">
                  {template.description}
                </p>
                
                <div className="text-xs text-muted-foreground">
                  {template.legs.length} leg{template.legs.length > 1 ? 's' : ''} • 
                  {template.defaultConditions.entry.length + template.defaultConditions.exit.length} conditions
                </div>
              </div>
            );
          })}
        </div>
        
        <Button 
          variant="outline" 
          className="w-full mt-4"
          onClick={() => onSelectTemplate({
            id: 'custom',
            name: 'Custom Strategy',
            description: 'Build your own custom options strategy',
            category: 'Custom',
            legs: [],
            defaultConditions: {
              entry: [],
              exit: []
            }
          })}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Custom Strategy
        </Button>
      </CardContent>
    </Card>
  );
}