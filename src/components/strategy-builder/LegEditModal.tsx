import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OptionLeg } from '@/types/strategy';

interface LegEditModalProps {
  leg: OptionLeg | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (leg: OptionLeg) => void;
}

export function LegEditModal({ leg, isOpen, onClose, onSave }: LegEditModalProps) {
  const [formData, setFormData] = useState<OptionLeg>({
    id: '',
    type: 'CE',
    action: 'BUY',
    strike: 24100,
    expiry: '21 Nov 24',
    quantity: 1,
    lotSize: 25,
    premium: 150
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (leg) {
      setFormData(leg);
      setErrors({});
    }
  }, [leg]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.strike || formData.strike <= 0) {
      newErrors.strike = 'Strike price must be positive';
    }

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be positive';
    }

    if (!formData.lotSize || formData.lotSize <= 0) {
      newErrors.lotSize = 'Lot size must be positive';
    }

    if (!formData.premium || formData.premium < 0) {
      newErrors.premium = 'Premium cannot be negative';
    }

    if (!formData.expiry.trim()) {
      newErrors.expiry = 'Expiry date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
      onClose();
    }
  };

  const expiryOptions = [
    '14 Nov 24',
    '21 Nov 24',
    '28 Nov 24',
    '05 Dec 24',
    '12 Dec 24',
    '19 Dec 24',
    '26 Dec 24',
    '30 Jan 25',
    '27 Feb 25',
    '27 Mar 25'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-background border z-50">
        <DialogHeader>
          <DialogTitle>Edit Strategy Leg</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Option Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'CE' | 'PE') => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="bg-background border z-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  <SelectItem value="CE">Call (CE)</SelectItem>
                  <SelectItem value="PE">Put (PE)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="action">Action</Label>
              <Select
                value={formData.action}
                onValueChange={(value: 'BUY' | 'SELL') => setFormData({ ...formData, action: value })}
              >
                <SelectTrigger className="bg-background border z-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  <SelectItem value="BUY">Buy</SelectItem>
                  <SelectItem value="SELL">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="strike">Strike Price</Label>
            <Input
              id="strike"
              type="number"
              step="50"
              value={formData.strike}
              onChange={(e) => setFormData({ ...formData, strike: Number(e.target.value) })}
              className={errors.strike ? 'border-destructive' : ''}
            />
            {errors.strike && <p className="text-xs text-destructive mt-1">{errors.strike}</p>}
          </div>

          <div>
            <Label htmlFor="expiry">Expiry</Label>
            <Select
              value={formData.expiry}
              onValueChange={(value) => setFormData({ ...formData, expiry: value })}
            >
              <SelectTrigger className="bg-background border z-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border z-50 max-h-[200px] overflow-y-auto">
                {expiryOptions.map((expiry) => (
                  <SelectItem key={expiry} value={expiry}>{expiry}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.expiry && <p className="text-xs text-destructive mt-1">{errors.expiry}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity (Lots)</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                className={errors.quantity ? 'border-destructive' : ''}
              />
              {errors.quantity && <p className="text-xs text-destructive mt-1">{errors.quantity}</p>}
            </div>

            <div>
              <Label htmlFor="lotSize">Lot Size</Label>
              <Input
                id="lotSize"
                type="number"
                min="1"
                value={formData.lotSize}
                onChange={(e) => setFormData({ ...formData, lotSize: Number(e.target.value) })}
                className={errors.lotSize ? 'border-destructive' : ''}
              />
              {errors.lotSize && <p className="text-xs text-destructive mt-1">{errors.lotSize}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="premium">Premium (₹)</Label>
            <Input
              id="premium"
              type="number"
              step="0.05"
              min="0"
              value={formData.premium}
              onChange={(e) => setFormData({ ...formData, premium: Number(e.target.value) })}
              className={errors.premium ? 'border-destructive' : ''}
            />
            {errors.premium && <p className="text-xs text-destructive mt-1">{errors.premium}</p>}
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Total Quantity:</span>
                <span className="font-medium">{formData.quantity * formData.lotSize}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Value:</span>
                <span className="font-medium">
                  {formData.action === 'BUY' ? '-' : '+'}₹{(formData.premium * formData.quantity * formData.lotSize).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}