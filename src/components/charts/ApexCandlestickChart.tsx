import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

export interface CandlestickData {
  x: Date | string | number;
  y: [number, number, number, number]; // [open, high, low, close]
}

interface ApexCandlestickChartProps {
  data: CandlestickData[];
  title?: string;
  height?: number;
  width?: string | number;
  showToolbar?: boolean;
  showGrid?: boolean;
  colors?: {
    up?: string;
    down?: string;
  };
  className?: string;
}

export function ApexCandlestickChart({
  data,
  title = "Candlestick Chart",
  height = 350,
  width = "100%",
  showToolbar = true,
  showGrid = true,
  colors = {
    up: "#00C853", // Green for bullish candles
    down: "#FF1744", // Red for bearish candles
  },
  className = "",
}: ApexCandlestickChartProps) {
  const [chartOptions, setChartOptions] = useState<ApexOptions>({});

  useEffect(() => {
    const options: ApexOptions = {
      chart: {
        type: "candlestick",
        height: height,
        width: width,
        toolbar: {
          show: showToolbar,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
          },
        },
        background: "transparent",
        animations: {
          enabled: true,
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150,
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350,
          },
        },
      },
      title: {
        text: title,
        align: "left",
        style: {
          fontSize: "16px",
          fontWeight: "600",
          color: "hsl(var(--foreground))",
        },
      },
      xaxis: {
        type: "datetime",
        labels: {
          style: {
            colors: "hsl(var(--muted-foreground))",
            fontSize: "12px",
          },
        },
        axisBorder: {
          color: "hsl(var(--border))",
        },
        axisTicks: {
          color: "hsl(var(--border))",
        },
      },
      yaxis: {
        tooltip: {
          enabled: true,
        },
        labels: {
          style: {
            colors: "hsl(var(--muted-foreground))",
            fontSize: "12px",
          },
          formatter: (value: number) => {
            return `₹${value.toFixed(2)}`;
          },
        },
      },
      grid: {
        show: showGrid,
        borderColor: "hsl(var(--border))",
        strokeDashArray: 3,
        xaxis: {
          lines: {
            show: true,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
      },
      plotOptions: {
        candlestick: {
          colors: {
            upward: colors.up,
            downward: colors.down,
          },
          wick: {
            useFillColor: true,
          },
        },
      },
      tooltip: {
        enabled: true,
        theme: "dark",
        style: {
          fontSize: "12px",
        },
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
          const data =
            w.globals.initialSeries[seriesIndex].data[dataPointIndex];
          const [open, high, low, close] = data.y;

          return `
            <div class="bg-card border rounded-lg p-3 shadow-lg">
              <div class="text-sm font-medium mb-2">${new Date(
                data.x
              ).toLocaleDateString()}</div>
              <div class="space-y-1 text-xs">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Open:</span>
                  <span>₹${open.toFixed(2)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">High:</span>
                  <span class="text-green-500">₹${high.toFixed(2)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Low:</span>
                  <span class="text-red-500">₹${low.toFixed(2)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Close:</span>
                  <span class="font-medium">₹${close.toFixed(2)}</span>
                </div>
              </div>
            </div>
          `;
        },
      },
      responsive: [
        {
          breakpoint: 768,
          options: {
            chart: {
              height: 300,
            },
            title: {
              style: {
                fontSize: "14px",
              },
            },
          },
        },
      ],
    };

    setChartOptions(options);
  }, [data, title, height, width, showToolbar, showGrid, colors]);

  const series = [
    {
      data: data,
    },
  ];

  return (
    <div className={`w-full ${className}`}>
      <ReactApexChart
        options={chartOptions}
        series={series}
        type="candlestick"
        height={height}
        width={width}
      />
    </div>
  );
}

// Sample data generator for testing
export function generateSampleCandlestickData(
  days: number = 30
): CandlestickData[] {
  const data: CandlestickData[] = [];
  const basePrice = 50000;
  let currentPrice = basePrice;

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));

    // Generate random price movement
    const volatility = 0.02; // 2% volatility
    const change = (Math.random() - 0.5) * volatility;
    const open = currentPrice;
    const close = open * (1 + change);

    // Generate high and low
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);

    data.push({
      x: date.getTime(),
      y: [open, high, low, close],
    });

    currentPrice = close;
  }

  return data;
}
