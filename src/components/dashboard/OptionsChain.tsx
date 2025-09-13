import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OptionData {
  strike: number;
  callLTP: number;
  callOI: number;
  callIV: number;
  putLTP: number;
  putOI: number;
  putIV: number;
  isATM?: boolean;
}

const optionsData: OptionData[] = [
  { strike: 24000, callLTP: 245.60, callOI: 1250, callIV: 15.2, putLTP: 12.40, putOI: 2100, putIV: 16.8 },
  { strike: 24050, callLTP: 198.30, callOI: 1890, callIV: 14.9, putLTP: 18.60, putOI: 1950, putIV: 16.5 },
  { strike: 24100, callLTP: 152.80, callOI: 2340, callIV: 14.6, putLTP: 28.90, putOI: 1780, putIV: 16.2, isATM: true },
  { strike: 24150, callLTP: 112.40, callOI: 1670, callIV: 14.4, putLTP: 42.50, putOI: 1520, putIV: 15.9 },
  { strike: 24200, callLTP: 78.20, callOI: 1420, callIV: 14.1, putLTP: 62.80, putOI: 1340, putIV: 15.6 },
];

export function OptionsChain() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>NIFTY Options Chain</span>
          <Badge variant="outline">21 Nov 24</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-profit">CALL</th>
                <th className="text-left py-2">OI</th>
                <th className="text-left py-2">IV</th>
                <th className="text-center py-2 font-semibold">STRIKE</th>
                <th className="text-right py-2">IV</th>
                <th className="text-right py-2">OI</th>
                <th className="text-right py-2 text-loss">PUT</th>
              </tr>
            </thead>
            <tbody>
              {optionsData.map((option) => (
                <tr 
                  key={option.strike}
                  className={cn(
                    "border-b hover:bg-muted/50 transition-colors",
                    option.isATM && "bg-trading-primary/10"
                  )}
                >
                  <td className="py-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-1 text-profit hover:text-profit hover:bg-profit/10"
                    >
                      {option.callLTP}
                    </Button>
                  </td>
                  <td className="py-2 text-muted-foreground">{option.callOI}</td>
                  <td className="py-2 text-muted-foreground">{option.callIV}%</td>
                  <td className={cn(
                    "py-2 text-center font-medium",
                    option.isATM && "text-trading-primary font-bold"
                  )}>
                    {option.strike}
                  </td>
                  <td className="py-2 text-right text-muted-foreground">{option.putIV}%</td>
                  <td className="py-2 text-right text-muted-foreground">{option.putOI}</td>
                  <td className="py-2 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-1 text-loss hover:text-loss hover:bg-loss/10"
                    >
                      {option.putLTP}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}