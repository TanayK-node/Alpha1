import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ApexCandlestickChart,
  CandlestickData,
} from "../charts/ApexCandlestickChart";

// Sample P&L data converted to candlestick format
const generatePnLCandlestickData = (): CandlestickData[] => {
  const baseValues = [
    0, 1200, 800, 1500, 2100, 1800, 2400, 2800, 2200, 3200, 3800, 3400, 4200,
    4800, 4500, 5200,
  ];
  const times = [
    "09:15",
    "09:30",
    "09:45",
    "10:00",
    "10:15",
    "10:30",
    "10:45",
    "11:00",
    "11:15",
    "11:30",
    "11:45",
    "12:00",
    "12:15",
    "12:30",
    "12:45",
    "13:00",
  ];

  return baseValues.map((value, index) => {
    const prevValue = index > 0 ? baseValues[index - 1] : value;
    const open = prevValue;
    const close = value;
    const high = Math.max(open, close) + Math.random() * 200;
    const low = Math.min(open, close) - Math.random() * 200;

    const date = new Date();
    date.setHours(9 + Math.floor((index * 15) / 60), (index * 15) % 60, 0, 0);

    return {
      x: date.getTime(),
      y: [open, high, low, close],
    };
  });
};

export function PnLChart() {
  const pnlData = generatePnLCandlestickData();
  const currentPnL = pnlData[pnlData.length - 1]?.y[3] || 0; // Close price
  const isProfit = currentPnL >= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Daily P&L - Candlestick View</span>
          <span
            className={`text-lg font-bold ${
              isProfit ? "text-profit" : "text-loss"
            }`}
          >
            ₹{Math.abs(currentPnL).toFixed(2)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ApexCandlestickChart
          data={pnlData}
          title="P&L Candlestick Chart"
          height={250}
          colors={{
            up: "hsl(var(--profit))",
            down: "hsl(var(--loss))",
          }}
        />
      </CardContent>
    </Card>
  );
}
