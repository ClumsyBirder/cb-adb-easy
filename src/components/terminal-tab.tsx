import { useState, useEffect, useCallback } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
import { Button } from "@/components/ui/button";

interface CPUData {
  time: string;
  value: number;
}

interface CPUCoreInfo {
  frequency: string;
  usage: number;
}

export function TerminalTab() {
  const [isRunning, setIsRunning] = useState(true);
  const [cpuData, setCpuData] = useState<CPUData[]>([]);
  const [memoryData, setMemoryData] = useState<CPUData[]>([]);
  const [fpsData, setFpsData] = useState<CPUData[]>([]);
  const [cpuCores, setCpuCores] = useState<CPUCoreInfo[]>([
    { frequency: "1804MHz", usage: 15 },
    { frequency: "1804MHz", usage: 23 },
    { frequency: "1612MHz", usage: 50 },
    { frequency: "1804MHz", usage: 31 },
    { frequency: "710MHz", usage: 4 },
    { frequency: "710MHz", usage: 4 },
    { frequency: "710MHz", usage: 0 },
    { frequency: "844MHz", usage: 0 },
  ]);

  const generateTimeString = useCallback(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
  }, []);

  const updateData = useCallback(() => {
    const newTime = generateTimeString();
    const newCpuValue = Math.floor(Math.random() * 30);
    const newMemValue = 35 + Math.random() * 5;
    const newFpsValue = Math.floor(Math.random() * 60);

    setCpuData((prev) => {
      const newData = [...prev, { time: newTime, value: newCpuValue }];
      return newData.slice(-30);
    });

    setMemoryData((prev) => {
      const newData = [...prev, { time: newTime, value: newMemValue }];
      return newData.slice(-30);
    });

    setFpsData((prev) => {
      const newData = [...prev, { time: newTime, value: newFpsValue }];
      return newData.slice(-30);
    });

    setCpuCores((prev) =>
      prev.map((core) => ({
        ...core,
        usage: Math.floor(Math.random() * 100),
      })),
    );
  }, [generateTimeString]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(updateData, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, updateData]);

  const CustomizedDot = (props: any) => {
    const { cx, cy } = props;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={3}
        fill="#22c55e"
        stroke="white"
        strokeWidth={2}
      />
    );
  };

  const renderCPUCores = () => {
    return cpuCores.map((core, index) => (
      <div key={index} className="border rounded-lg p-4 bg-white">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium ">
            CPU{index} {core.frequency}
          </div>
          <div className="text-sm text-green-500">{core.usage}%</div>
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <AreaChart
            data={[{ value: 0 }, { value: core.usage }, { value: core.usage }]}
          >
            <defs>
              <linearGradient
                id={`colorCpu${index}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis domain={[0, 100]} hide />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#22c55e"
              fill={`url(#colorCpu${index})`}
              strokeWidth={2}
              isAnimationActive={true}
            />
            <ReferenceLine y={50} stroke="#e5e7eb" strokeDasharray="3 3" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    ));
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">性能监控</h2>
        <Button variant="outline" onClick={() => setIsRunning(!isRunning)}>
          {isRunning ? "停止" : "开始"}
        </Button>
      </div>

      {/* Main CPU Usage */}
      <div className="border rounded-lg p-4 bg-white ">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium">CPU</div>
          <div className="text-sm text-green-500">
            {cpuData[cpuData.length - 1]?.value ?? 0}%
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={cpuData}>
            <defs>
              <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e5e7eb"
            />
            <XAxis
              dataKey="time"
              tickFormatter={(value) => value.split(":")[2]}
              interval="preserveStartEnd"
              stroke="#94a3b8"
              tick={{ fill: "#94a3b8" }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#94a3b8"
              tick={{ fill: "#94a3b8" }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#22c55e"
              fill="url(#colorCpu)"
              strokeWidth={2}
              dot={<CustomizedDot />}
              isAnimationActive={true}
            />
            <ReferenceLine y={50} stroke="#e5e7eb" strokeDasharray="3 3" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* CPU Cores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderCPUCores()}
      </div>

      {/* Memory Usage */}
      <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium dark:text-gray-200">内存 35%</div>
          <div className="text-sm text-purple-500">2637MB</div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={memoryData}>
            <defs>
              <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e5e7eb"
            />
            <XAxis
              dataKey="time"
              tickFormatter={(value) => value.split(":")[2]}
              interval="preserveStartEnd"
              stroke="#94a3b8"
              tick={{ fill: "#94a3b8" }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#94a3b8"
              tick={{ fill: "#94a3b8" }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#a855f7"
              fill="url(#colorMemory)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
            />
            <ReferenceLine y={50} stroke="#e5e7eb" strokeDasharray="3 3" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* FPS */}
      <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium dark:text-gray-200">FPS</div>
          <div className="text-sm text-orange-500">
            {fpsData[fpsData.length - 1]?.value ?? 0}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={fpsData}>
            <defs>
              <linearGradient id="colorFps" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e5e7eb"
            />
            <XAxis
              dataKey="time"
              tickFormatter={(value) => value.split(":")[2]}
              interval="preserveStartEnd"
              stroke="#94a3b8"
              tick={{ fill: "#94a3b8" }}
            />
            <YAxis
              domain={[0, 60]}
              stroke="#94a3b8"
              tick={{ fill: "#94a3b8" }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#f97316"
              fill="url(#colorFps)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
            />
            <ReferenceLine y={30} stroke="#e5e7eb" strokeDasharray="3 3" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
