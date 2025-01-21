import {
  Line,
  LineChart,
  XAxis,
  CartesianGrid,
  LabelList,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { useEffect, useState } from "react";

interface CpuData {
  timestamp: string;
  usage: number;
}
const chartConfig = {
  views: {
    label: "Page Views",
  },
  usage: {
    label: "usage",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;
export function PerformanceTab() {
  const [cpuData, setCpuData] = useState<CpuData[]>([]);

  const fetchCpuData = async () => {
    try {
      // @ts-ignore
      const res = await window.pywebview.api.get_cpu_info();
      console.log(res);
      setCpuData((prevData) => [...prevData, { ...res }]);
    } catch (error) {
      console.error("Error fetching CPU data:", error);
    }
  };

  useEffect(() => {
    fetchCpuData();
    const intervalId = setInterval(fetchCpuData, 1000);

    // 清理函数
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Area Chart - Interactive</CardTitle>
          <CardDescription>
            Showing total visitors for the last 3 months
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <LineChart
            accessibilityLayer
            data={cpuData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMinutes()}:${date.getSeconds().toString().padStart(2, "0")}`;
              }}
              label={{
                value: "Time (MM:SS)",
                position: "insideBottomRight",
                offset: -10,
              }}
            />

            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                />
              }
            />

            <Line
              dataKey="usage"
              type="natural"
              stroke="var(--color-usage)"
              name="CPU Usage (%)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-desktop)",
              }}
              activeDot={{
                r: 6,
              }}
            >
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Line>
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
