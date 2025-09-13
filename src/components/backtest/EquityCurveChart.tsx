import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { EquityPoint } from "@/pages/Backtest";

interface EquityCurveChartProps {
  data: EquityPoint[];
  height?: number;
}

export function EquityCurveChart({
  data,
  height = 400,
}: EquityCurveChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Convert data to ApexCharts format
  const chartData = data.map((point) => ({
    x: new Date(point.date).getTime(),
    equity: point.equity,
    drawdown: point.drawdown,
  }));

  const options: ApexOptions = {
    chart: {
      type: "line",
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
      text: "Equity Curve & Drawdown",
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
        formatter: (value: string) => new Date(value).toLocaleDateString(),
      },
      axisBorder: {
        color: "hsl(var(--border))",
      },
      axisTicks: {
        color: "hsl(var(--border))",
      },
    },
    yaxis: [
      {
        title: {
          text: "Equity ($)",
          style: {
            color: "hsl(var(--foreground))",
            fontSize: "12px",
          },
        },
        labels: {
          style: {
            colors: "hsl(var(--muted-foreground))",
            fontSize: "12px",
          },
          formatter: formatCurrency,
        },
      },
      {
        opposite: true,
        title: {
          text: "Drawdown (%)",
          style: {
            color: "hsl(var(--foreground))",
            fontSize: "12px",
          },
        },
        labels: {
          style: {
            colors: "hsl(var(--muted-foreground))",
            fontSize: "12px",
          },
          formatter: formatPercent,
        },
      },
    ],
    grid: {
      show: true,
      borderColor: "hsl(var(--border))",
      strokeDashArray: 3,
    },
    colors: ["hsl(var(--primary))", "hsl(var(--destructive))"],
    stroke: {
      curve: "smooth",
      width: [2, 1],
    },
    tooltip: {
      enabled: true,
      theme: "dark",
      style: {
        fontSize: "12px",
      },
      x: {
        formatter: (value: number) => new Date(value).toLocaleDateString(),
      },
      y: [
        {
          formatter: (value: number) => formatCurrency(value),
        },
        {
          formatter: (value: number) => formatPercent(value),
        },
      ],
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      labels: {
        colors: "hsl(var(--foreground))",
      },
    },
  };

  const series = [
    {
      name: "Equity",
      type: "line",
      data: chartData.map((d) => ({ x: d.x, y: d.equity })),
    },
    {
      name: "Drawdown %",
      type: "line",
      data: chartData.map((d) => ({ x: d.x, y: d.drawdown })),
    },
  ];

  return (
    <div className="w-full">
      <ReactApexChart
        options={options}
        series={series}
        type="line"
        height={height}
        width="100%"
      />
    </div>
  );
}
