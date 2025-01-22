import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ProcessMemoryInfo {
  "Java Heap": number;
  "Native Heap": number;
  Code: number;
  Stack: number;
  Graphics: number;
  "Private Other": number;
  System: number;
  "TOTAL PSS": number;
}

interface MemoryResponse {
  [processName: string]: ProcessMemoryInfo;
}

interface DataPoint extends ProcessMemoryInfo {
  time: string;
  process: string;
}
const chartConfig = {
  JavaHeap: {
    label: "Java Heap",
    color: "hsl(var(--chart-1))",
  },
  NativeHeap: {
    label: "Native Heap",
    color: "hsl(var(--chart-2))",
  },
  Code: {
    label: "Code",
    color: "hsl(var(--chart-3))",
  },
  Stack: {
    label: "Stack",
    color: "hsl(var(--chart-4))",
  },
  Graphics: {
    label: "Graphics",
    color: "hsl(var(--chart-5))",
  },
  PrivateOther: {
    label: "Private Other",
    color: "hsl(var(--chart-6))",
  },
  System: {
    label: "System",
    color: "hsl(var(--chart-7))",
  },
  TOTALPSS: {
    label: "TOTAL PSS",
    color: "hsl(var(--chart-8))",
  },
} satisfies ChartConfig;
export function PerformanceTab() {
  const [isRunning, setIsRunning] = useState(true);
  const [memoryData, setMemoryData] = useState<DataPoint[]>([]);
  const [processes, setProcesses] = useState<string[]>([]);

  const generateTimeString = useCallback(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
  }, []);

  const updateData = useCallback(async () => {
    const newTime = generateTimeString();
    try {
      const response: MemoryResponse =
        await window.pywebview.api.get_memory_info("com.tencent.mm");

      const currentProcesses = Object.keys(response);
      if (JSON.stringify(currentProcesses) !== JSON.stringify(processes)) {
        setProcesses(currentProcesses);
      }

      setMemoryData((prev) => {
        return [
          ...prev,
          ...currentProcesses.map((processName) => ({
            time: newTime,
            process: processName,
            ...response[processName],
          })),
        ];
      });
    } catch (error) {
      console.error("Failed to fetch memory data:", error);
    }
  }, [generateTimeString, processes]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      updateData();
      interval = setInterval(updateData, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, updateData]);

  const renderProcessChart = (processName: string) => {
    const processData = memoryData.filter((d) => d.process === processName);

    const formatYAxis = (value: number) => `${value} MB`;

    return (
      <Card key={processName}>
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1 text-center sm:text-left">
            <CardTitle>{processName}</CardTitle>
            <CardDescription>Memory usage trends</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <LineChart
              accessibilityLayer
              data={processData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                interval="preserveStartEnd"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickCount={5}
                tickFormatter={formatYAxis}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent className="w-[150px]" />}
              />
              <ChartLegend content={<ChartLegendContent />} />

              <Line
                dataKey="Java Heap"
                type="monotone"
                stroke="var(--color-JavaHeap)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                dataKey="Native Heap"
                type="monotone"
                stroke="var(--color-NativeHeap)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                dataKey="Code"
                type="monotone"
                stroke="var(--color-Code)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                dataKey="Stack"
                type="monotone"
                stroke="var(--color-Stack)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                dataKey="Graphics"
                type="monotone"
                stroke="var(--color-Graphics)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                dataKey="Private Other"
                type="monotone"
                stroke="var(--color-PrivateOther)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                dataKey="System"
                type="monotone"
                stroke="var(--color-System)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                dataKey="TOTAL PSS"
                type="monotone"
                stroke="var(--color-TOTALPSS)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          className={"rounded h-8"}
          onClick={() => setIsRunning(!isRunning)}
        >
          {isRunning ? "停止" : "开始"}
        </Button>
      </div>
      {processes.map((processName) => renderProcessChart(processName))}
    </div>
  );
}
