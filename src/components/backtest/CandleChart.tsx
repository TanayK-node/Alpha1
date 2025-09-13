import { useEffect, useState } from "react";
import {
  ApexCandlestickChart,
  CandlestickData,
} from "../charts/ApexCandlestickChart";

export interface OHLC {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CandleChartProps {
  symbol: string;
  startDate: string;
  endDate: string;
  height?: number;
}

export function CandleChart({
  symbol,
  startDate,
  endDate,
  height = 400,
}: CandleChartProps) {
  const [candles, setCandles] = useState<OHLC[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:5000/api/backtest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbol, startDate, endDate }),
        });
        const data = await res.json();
        if (data.success) {
          setCandles(data.ohlcData);
        } else {
          console.error("Backtest failed:", data.error);
        }
      } catch (err) {
        console.error("Error fetching backtest data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [symbol, startDate, endDate]);

  // Convert OHLC data to candlestick format
  const candlestickData: CandlestickData[] = candles.map((c) => ({
    x: new Date(c.time).getTime(),
    y: [c.open, c.high, c.low, c.close],
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading chart data...</div>
      </div>
    );
  }

  if (candles.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">
          No data available for {symbol}
        </div>
      </div>
    );
  }

  return (
    <ApexCandlestickChart
      data={candlestickData}
      title={`${symbol} - Candlestick Chart`}
      height={height}
      colors={{
        up: "#00C853",
        down: "#FF1744",
      }}
    />
  );
}
