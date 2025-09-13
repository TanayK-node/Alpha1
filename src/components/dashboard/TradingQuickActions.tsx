import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  TrendingUp, 
  Shield, 
  Target,
  Play,
  Pause,
  Settings
} from 'lucide-react';

const quickStrategies = [
  {
    name: '920 Straddle',
    description: 'ATM Straddle at 9:20 AM',
    status: 'Ready',
    color: 'bg-profit',
    icon: Zap
  },
  {
    name: 'Iron Condor',
    description: 'Weekly expiry range strategy',
    status: 'Active',
    color: 'bg-trading-primary',
    icon: Shield
  },
  {
    name: 'Butterfly',
    description: 'Limited risk neutral strategy',
    status: 'Paused',
    color: 'bg-yellow-500',
    icon: Target
  },
  {
    name: 'Range Breakout',
    description: 'Momentum based strategy',
    status: 'Ready',
    color: 'bg-profit',
    icon: TrendingUp
  }
];

export function TradingQuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Strategy Deploy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {quickStrategies.map((strategy, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${strategy.color} text-white`}>
                <strategy.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-sm">{strategy.name}</p>
                <p className="text-xs text-muted-foreground">{strategy.description}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge 
                variant="outline"
                className={
                  strategy.status === 'Active' ? 'border-trading-primary text-trading-primary' :
                  strategy.status === 'Ready' ? 'border-profit text-profit' :
                  'border-yellow-500 text-yellow-600'
                }
              >
                {strategy.status}
              </Badge>
              
              <div className="flex space-x-1">
                {strategy.status === 'Ready' && (
                  <Button size="sm" variant="outline" className="h-7 w-7 p-0">
                    <Play className="h-3 w-3" />
                  </Button>
                )}
                
                {strategy.status === 'Active' && (
                  <Button size="sm" variant="outline" className="h-7 w-7 p-0">
                    <Pause className="h-3 w-3" />
                  </Button>
                )}
                
                <Button size="sm" variant="outline" className="h-7 w-7 p-0">
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        
        <Button className="w-full mt-4" variant="outline">
          <Zap className="h-4 w-4 mr-2" />
          Create New Strategy
        </Button>
      </CardContent>
    </Card>
  );
}