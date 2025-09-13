import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface ChartData {
  time: string;
  value: number;
  volume?: number;
}

interface SimpleChartProps {
  data: ChartData[];
  type?: "line" | "area" | "candlestick";
  color?: string;
  height?: number;
  showGrid?: boolean;
  showAxis?: boolean;
  title?: string;
}

export function SimpleChart({
  data,
  type = "line",
  color = "hsl(var(--chart-primary))",
  height = 300,
  showGrid = true,
  showAxis = true,
  title = "Chart",
}: SimpleChartProps) {
  // Convert data to candlestick format if needed
  const candlestickData =
    type === "candlestick"
      ? data.map((item, index) => {
          const prevValue = index > 0 ? data[index - 1].value : item.value;
          const open = prevValue;
          const close = item.value;
          const high = Math.max(open, close) * (1 + Math.random() * 0.01);
          const low = Math.min(open, close) * (1 - Math.random() * 0.01);

          return {
            x: new Date(item.time).getTime(),
            y: [open, high, low, close],
          };
        })
      : data.map((item) => ({
          x: item.time,
          y: item.value,
        }));

  const options: ApexOptions = {
    chart: {
      type:
        type === "candlestick"
          ? "candlestick"
          : type === "area"
          ? "area"
          : "line",
      height: height,
      toolbar: {
        show: true,
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
      type: type === "candlestick" ? "datetime" : "category",
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
    },
    colors: [color],
    stroke: {
      curve: "smooth",
      width: 2,
    },
    fill:
      type === "area"
        ? {
            type: "gradient",
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.7,
              opacityTo: 0.1,
              stops: [0, 100],
            },
          }
        : undefined,
    tooltip: {
      enabled: true,
      theme: "dark",
      style: {
        fontSize: "12px",
      },
    },
    plotOptions:
      type === "candlestick"
        ? {
            candlestick: {
              colors: {
                upward: "#00C853",
                downward: "#FF1744",
              },
            },
          }
        : undefined,
  };

  const series =
    type === "candlestick"
      ? [{ data: candlestickData }]
      : [{ data: candlestickData }];

  return (
    <div style={{ width: "100%", height }}>
      <ReactApexChart
        options={options}
        series={series}
        type={
          type === "candlestick"
            ? "candlestick"
            : type === "area"
            ? "area"
            : "line"
        }
        height={height}
        width="100%"
      />
    </div>
  );
}
