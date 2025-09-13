import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OptionLeg } from '@/types/strategy';
import { SimpleChart } from '../charts/SimpleChart';

interface PnLVisualizationProps {
  legs: OptionLeg[];
}

export function PnLVisualization({ legs }: PnLVisualizationProps) {
  // Calculate P&L curve for the strategy
  const calculatePnL = () => {
    if (legs.length === 0) return [];
    
    const strikes = legs.map(leg => leg.strike);
    const minStrike = Math.min(...strikes);
    const maxStrike = Math.max(...strikes);
    const range = maxStrike - minStrike;
    const padding = range * 0.2 || 500; // 20% padding or 500 points
    
    const startPrice = minStrike - padding;
    const endPrice = maxStrike + padding;
    const step = (endPrice - startPrice) / 100;
    
    const data = [];
    
    for (let price = startPrice; price <= endPrice; price += step) {
      let totalPnL = 0;
      
      legs.forEach(leg => {
        const premium = leg.premium || 150; // Default premium if not set
        const multiplier = leg.quantity * leg.lotSize;
        
        let legPnL = 0;
        if (leg.type === 'CE') {
          // Call option
          const intrinsic = Math.max(0, price - leg.strike);
          if (leg.action === 'BUY') {
            legPnL = (intrinsic - premium) * multiplier;
          } else {
            legPnL = (premium - intrinsic) * multiplier;
          }
        } else {
          // Put option
          const intrinsic = Math.max(0, leg.strike - price);
          if (leg.action === 'BUY') {
            legPnL = (intrinsic - premium) * multiplier;
          } else {
            legPnL = (premium - intrinsic) * multiplier;
          }
        }
        
        totalPnL += legPnL;
      });
      
      data.push({
        time: price.toFixed(0),
        value: totalPnL
      });
    }
    
    return data;
  };

  const pnlData = calculatePnL();
  const maxProfit = Math.max(...pnlData.map(d => d.value));
  const maxLoss = Math.min(...pnlData.map(d => d.value));
  
  // Find breakeven points (where P&L crosses zero)
  const breakevens = [];
  for (let i = 0; i < pnlData.length - 1; i++) {
    const current = pnlData[i].value;
    const next = pnlData[i + 1].value;
    
    if ((current <= 0 && next >= 0) || (current >= 0 && next <= 0)) {
      const currentPrice = parseFloat(pnlData[i].time);
      const nextPrice = parseFloat(pnlData[i + 1].time);
      const breakeven = currentPrice + (nextPrice - currentPrice) * (0 - current) / (next - current);
      breakevens.push(breakeven);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Strategy P&L Visualization</CardTitle>
      </CardHeader>
      <CardContent>
        {legs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Add strategy legs to see P&L visualization
          </div>
        ) : (
          <div className="space-y-4">
            {/* P&L Chart */}
            <SimpleChart 
              data={pnlData}
              type="line"
              color="hsl(var(--chart-primary))"
              height={300}
            />
            
            {/* Strategy Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Max Profit</p>
                <p className={`text-lg font-bold ${maxProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {maxProfit === Infinity ? 'Unlimited' : `₹${maxProfit.toFixed(0)}`}
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Max Loss</p>
                <p className={`text-lg font-bold ${maxLoss >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {maxLoss === -Infinity ? 'Unlimited' : `₹${Math.abs(maxLoss).toFixed(0)}`}
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Breakeven Points</p>
                <p className="text-lg font-bold">
                  {breakevens.length === 0 ? 'None' : breakevens.map(be => be.toFixed(0)).join(', ')}
                </p>
              </div>
            </div>
            
            {/* Risk Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Risk Profile</p>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Risk/Reward Ratio:</span>
                    <span className="font-medium">
                      {maxLoss < 0 && maxProfit > 0 
                        ? `1:${(maxProfit / Math.abs(maxLoss)).toFixed(2)}`
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Strategy Type:</span>
                    <span className="font-medium">
                      {maxProfit === Infinity ? 'Unlimited Profit' : 
                       maxLoss === -Infinity ? 'Unlimited Risk' : 'Limited Risk'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Capital Requirements</p>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Net Credit/Debit:</span>
                    <span className="font-medium">
                      {legs.reduce((total, leg) => {
                        const premium = leg.premium || 150;
                        const value = premium * leg.quantity * leg.lotSize;
                        return total + (leg.action === 'BUY' ? -value : value);
                      }, 0).toFixed(0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Margin Required:</span>
                    <span className="font-medium">₹{Math.abs(maxLoss).toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}