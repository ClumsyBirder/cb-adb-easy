import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  Card,
  CardContent,
  // CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button.tsx";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { usePerformanceStore } from "@/store/performance-store";
import { useAppsStore } from "@/store/apps-store";
import { Copy, Download, Play, RotateCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";

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

export function Performance() {
  const {
    isRunning,
    timePoints,
    updateInterval,
    startMonitoring,
    stopMonitoring,
    setUpdateInterval,
  } = usePerformanceStore();
  const { toast } = useToast();
  const selectedPackage = useAppsStore((state) => state.selectedPackage);

  const handleToggle = () => {
    if (!selectedPackage) {
      return;
    }

    if (!isRunning) {
      timePoints.length = 0;
      startMonitoring(selectedPackage);
    } else {
      stopMonitoring();
    }
  };
  const handleExportData = (processName: string) => {
    if (timePoints.length === 0) return;
    const exportData = timePoints.map((point) => ({
      time: point.time,
      ...point.processes[processName],
    }));

    const success = window.pywebview.api.save_memory_content(
      JSON.stringify(
        {
          processName,
          data: exportData,
        },
        null,
        2,
      ),
    );
    if (success) {
      toast({
        title: "导出成功",
      });
    } else {
      toast({
        title: "保存失败",
        variant: "destructive",
      });
    }
  };

  const handleCopyImg = async (processName: string) => {
    const chartElement = document.getElementById(processName);
    if (!chartElement) return;

    const canvas = await html2canvas(chartElement);
    const dataUrl = canvas.toDataURL("image/png");

    // 将图片复制到剪贴板
    const blob = await (await fetch(dataUrl)).blob();
    const item = new ClipboardItem({ "image/png": blob });
    navigator.clipboard
      .write([item])
      .then(() => {
        toast({
          title: `${processName} 复制到剪贴板`,
        });
      })
      .catch(() => {
        toast({
          title: "复制失败",
          variant: "destructive",
        });
      });
  };
  const renderProcessChart = (processName: string) => {
    const chartData = timePoints.map((point) => ({
      time: point.time,
      ...point.processes[processName],
    }));
    // const averageValue =
    //   chartData.reduce((sum, point) => sum + point[processName], 0) /
    //   chartData.length;
    const formatYAxis = (value: number) => `${value} MB`;

    return (
      <Card key={processName}>
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1 text-center sm:text-left">
            <CardTitle className="flex items-center gap-2">
              <Badge className="h-5 px-2">内存</Badge>
              {processName}
            </CardTitle>
            {/* <CardDescription>Memory usage trends</CardDescription> */}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleCopyImg(processName)}
            disabled={timePoints.length === 0}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleExportData(processName)}
            disabled={timePoints.length === 0}
          >
            <Download className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6" id={processName}>
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[280px] w-full"
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
              {/*<ReferenceLine*/}
              {/*  y={averageValue}*/}
              {/*  label="平均值"*/}
              {/*  stroke="red"*/}
              {/*  strokeDasharray="3 3"*/}
              {/*/>*/}
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
        {(selectedPackage && (
          <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm  mr-auto">
            <img
              src={"/vite.svg"}
              alt={selectedPackage}
              className="w-6 h-6 mr-4"
            />
            <span>{selectedPackage}</span>
          </div>
        )) || <span className="mr-auto">请先选择应用</span>}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium whitespace-nowrap">
            更新间隔:
          </label>
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
          className="h-7"
          onClick={handleToggle}
          variant={isRunning ? "destructive" : "default"}
          disabled={!selectedPackage}
        >
          {isRunning ? (
            <RotateCw
              className={`h-4 w-4 ${isRunning ? "animate-spin" : ""}`}
            />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
      </div>
      {processNames.map(renderProcessChart)}
    </div>
  );
}
