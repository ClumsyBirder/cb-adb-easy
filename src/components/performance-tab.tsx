import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button.tsx";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { usePerformanceStore } from "@/store/performance-store";
import { useAppsStore } from "@/store/apps-store";

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
  const {
    isRunning,
    timePoints,
    updateInterval,
    startMonitoring,
    stopMonitoring,
    setUpdateInterval,
  } = usePerformanceStore();

  const selectedPackage = useAppsStore((state) => state.selectedPackage);

  const handleToggle = () => {
    if (!selectedPackage) {
      // 可以添加一个提示，告诉用户需要先选择应用
      return;
    }

    if (!isRunning) {
      startMonitoring(selectedPackage);
    } else {
      stopMonitoring();
    }
  };

  const renderProcessChart = (processName: string) => {
    // 转换数据格式以适应图表
    const chartData = timePoints.map((point) => ({
      time: point.time,
      ...point.processes[processName],
    }));

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
              data={chartData}
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
              {/* <ChartLegend content={<ChartLegendContent />} /> */}

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

  // 获取当前所有进程名称
  const processNames =
    timePoints.length > 0
      ? Object.keys(timePoints[timePoints.length - 1].processes)
      : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium whitespace-nowrap">当前应用:</label>
          <span className="text-sm">
            {selectedPackage || "请在应用页面选择要监控的应用"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium whitespace-nowrap">更新间隔:</label>
          <input
            type="number"
            value={updateInterval}
            onChange={(e) => setUpdateInterval(Number(e.target.value))}
            className="rounded border px-2 py-1 w-24"
            min={100}
            step={100}
            disabled={isRunning}
          />
          <span className="text-sm text-gray-500">ms</span>
        </div>
        <Button 
          className="rounded h-8" 
          onClick={handleToggle}
          variant={isRunning ? "destructive" : "default"}
          disabled={!selectedPackage}
        >
          {isRunning ? "停止" : "开始"}
        </Button>
      </div>
      {processNames.map(renderProcessChart)}
    </div>
  );
}
