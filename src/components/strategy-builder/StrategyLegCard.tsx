import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GripVertical, X, Settings, TrendingUp, TrendingDown } from 'lucide-react';
import { OptionLeg } from '@/types/strategy';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface StrategyLegCardProps {
  leg: OptionLeg;
  onRemove: (id: string) => void;
  onEdit: (leg: OptionLeg) => void;
  isDragging?: boolean;
}

export function StrategyLegCard({ leg, onRemove, onEdit, isDragging }: StrategyLegCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: sortableIsDragging,
  } = useSortable({ id: leg.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const premium = leg.premium || 150 + Math.random() * 100;
  const totalValue = premium * leg.quantity * leg.lotSize;
  const isDebit = leg.action === 'BUY';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-white border rounded-lg p-4 shadow-sm transition-all",
        (isDragging || sortableIsDragging) && "opacity-50 shadow-lg scale-105",
        "hover:shadow-md"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab hover:cursor-grabbing p-1 hover:bg-gray-100 rounded"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </button>
          
          <div className="flex items-center space-x-2">
            <Badge 
              variant={leg.action === 'BUY' ? 'default' : 'destructive'}
              className="text-xs"
            >
              {leg.action}
            </Badge>
            <Badge 
              variant={leg.type === 'CE' ? 'outline' : 'secondary'}
              className="text-xs"
            >
              {leg.type}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(leg)}
            className="h-6 w-6 p-0"
          >
            <Settings className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(leg.id)}
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Strike Price</span>
          <span className="text-sm font-bold">₹{leg.strike}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Quantity</span>
          <span className="text-sm">{leg.quantity} lots ({leg.quantity * leg.lotSize} qty)</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Premium</span>
          <span className="text-sm">₹{premium.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Expiry</span>
          <span className="text-sm">{leg.expiry}</span>
        </div>
        
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Value</span>
            <div className="flex items-center space-x-1">
              {isDebit ? (
                <TrendingDown className="h-3 w-3 text-destructive" />
              ) : (
                <TrendingUp className="h-3 w-3 text-profit" />
              )}
              <span className={cn(
                "text-sm font-bold",
                isDebit ? "text-destructive" : "text-profit"
              )}>
                {isDebit ? '-' : '+'}₹{totalValue.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}