import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { X, Plus } from 'lucide-react';
import { EntryCondition, ExitCondition } from '@/types/strategy';

interface ConditionsBuilderProps {
  entryConditions: EntryCondition[];
  exitConditions: ExitCondition[];
  onUpdateEntryConditions: (conditions: EntryCondition[]) => void;
  onUpdateExitConditions: (conditions: ExitCondition[]) => void;
}

export function ConditionsBuilder({
  entryConditions,
  exitConditions,
  onUpdateEntryConditions,
  onUpdateExitConditions
}: ConditionsBuilderProps) {
  const [activeTab, setActiveTab] = useState<'entry' | 'exit'>('entry');

  const addEntryCondition = () => {
    const newCondition: EntryCondition = {
      id: `entry-${Date.now()}`,
      type: 'time',
      parameter: 'market_open',
      operator: '>=',
      value: '09:15',
      enabled: true
    };
    onUpdateEntryConditions([...entryConditions, newCondition]);
  };

  const addExitCondition = () => {
    const newCondition: ExitCondition = {
      id: `exit-${Date.now()}`,
      type: 'profit_target',
      parameter: 'percentage',
      value: 25,
      enabled: true
    };
    onUpdateExitConditions([...exitConditions, newCondition]);
  };

  const updateEntryCondition = (id: string, updates: Partial<EntryCondition>) => {
    const updated = entryConditions.map(condition =>
      condition.id === id ? { ...condition, ...updates } : condition
    );
    onUpdateEntryConditions(updated);
  };

  const updateExitCondition = (id: string, updates: Partial<ExitCondition>) => {
    const updated = exitConditions.map(condition =>
      condition.id === id ? { ...condition, ...updates } : condition
    );
    onUpdateExitConditions(updated);
  };

  const removeEntryCondition = (id: string) => {
    onUpdateEntryConditions(entryConditions.filter(c => c.id !== id));
  };

  const removeExitCondition = (id: string) => {
    onUpdateExitConditions(exitConditions.filter(c => c.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entry & Exit Conditions</CardTitle>
        <div className="flex space-x-2">
          <Button
            variant={activeTab === 'entry' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('entry')}
          >
            Entry ({entryConditions.length})
          </Button>
          <Button
            variant={activeTab === 'exit' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('exit')}
          >
            Exit ({exitConditions.length})
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {activeTab === 'entry' && (
          <div className="space-y-4">
            {entryConditions.map((condition) => (
              <div key={condition.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Entry Condition</Badge>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={condition.enabled}
                      onCheckedChange={(enabled) => updateEntryCondition(condition.id, { enabled })}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeEntryCondition(condition.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Select
                      value={condition.type}
                      onValueChange={(type: any) => updateEntryCondition(condition.id, { type })}
                    >
                      <SelectTrigger className="h-8 bg-background border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border z-50">
                        <SelectItem value="time">Time</SelectItem>
                        <SelectItem value="price">Price</SelectItem>
                        <SelectItem value="volatility">Volatility</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Parameter</Label>
                    <Input
                      className="h-8"
                      value={condition.parameter}
                      onChange={(e) => updateEntryCondition(condition.id, { parameter: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Operator</Label>
                    <Select
                      value={condition.operator}
                      onValueChange={(operator: any) => updateEntryCondition(condition.id, { operator })}
                    >
                      <SelectTrigger className="h-8 bg-background border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border z-50">
                        <SelectItem value=">">Greater than</SelectItem>
                        <SelectItem value="<">Less than</SelectItem>
                        <SelectItem value="=">Equal to</SelectItem>
                        <SelectItem value=">=">Greater or equal</SelectItem>
                        <SelectItem value="<=">Less or equal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Value</Label>
                    <Input
                      className="h-8"
                      value={condition.value}
                      onChange={(e) => updateEntryCondition(condition.id, { value: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <Button
              variant="outline"
              onClick={addEntryCondition}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Entry Condition
            </Button>
          </div>
        )}
        
        {activeTab === 'exit' && (
          <div className="space-y-4">
            {exitConditions.map((condition) => (
              <div key={condition.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Exit Condition</Badge>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={condition.enabled}
                      onCheckedChange={(enabled) => updateExitCondition(condition.id, { enabled })}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeExitCondition(condition.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Select
                      value={condition.type}
                      onValueChange={(type: any) => updateExitCondition(condition.id, { type })}
                    >
                      <SelectTrigger className="h-8 bg-background border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border z-50">
                        <SelectItem value="profit_target">Profit Target</SelectItem>
                        <SelectItem value="stop_loss">Stop Loss</SelectItem>
                        <SelectItem value="time_based">Time Based</SelectItem>
                        <SelectItem value="trailing_sl">Trailing SL</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Parameter</Label>
                    <Input
                      className="h-8"
                      value={condition.parameter}
                      onChange={(e) => updateExitCondition(condition.id, { parameter: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Value</Label>
                    <Input
                      className="h-8"
                      type="number"
                      value={condition.value}
                      onChange={(e) => updateExitCondition(condition.id, { value: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <Button
              variant="outline"
              onClick={addExitCondition}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Exit Condition
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}