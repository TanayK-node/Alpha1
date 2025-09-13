import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Play } from 'lucide-react';
import { BacktestParams } from '@/pages/Backtest';

interface BacktestFormProps {
  onSubmit: (params: BacktestParams) => void;
  isLoading: boolean;
}

const stockOptions = [
  { value: 'RELIANCE.NS', label: 'Reliance Industries' },
  { value: 'TCS.NS', label: 'Tata Consultancy Services' },
  { value: 'INFY.NS', label: 'Infosys' },
  { value: 'HDFCBANK.NS', label: 'HDFC Bank' },
];

export function BacktestForm({ onSubmit, isLoading }: BacktestFormProps) {
  const [formData, setFormData] = useState<BacktestParams>({
    symbol: 'RELIANCE.NS',
    startDate: '2020-01-01',
    endDate: '2024-12-31',
    initialCash: 10000,
    commission: 0.002,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof BacktestParams, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="symbol">Stock Symbol</Label>
        <Select
          value={formData.symbol}
          onValueChange={(value) => handleInputChange('symbol', value)}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a stock" />
          </SelectTrigger>
          <SelectContent>
            {stockOptions.map((stock) => (
              <SelectItem key={stock.value} value={stock.value}>
                {stock.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => handleInputChange('endDate', e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="initialCash">Initial Cash (₹)</Label>
        <Input
          id="initialCash"
          type="number"
          value={formData.initialCash}
          onChange={(e) => handleInputChange('initialCash', parseFloat(e.target.value))}
          min="1000"
          step="1000"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="commission">Commission (%)</Label>
        <Input
          id="commission"
          type="number"
          value={formData.commission}
          onChange={(e) => handleInputChange('commission', parseFloat(e.target.value))}
          min="0"
          max="1"
          step="0.001"
          disabled={isLoading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Running Backtest...
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Run Backtest
          </>
        )}
      </Button>
    </form>
  );
}