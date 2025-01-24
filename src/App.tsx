import {
  Boxes,
  Play,
  Activity,
  Zap,
  // Terminal,
  // Database,
  FileJson,
  ScreenShareOff,
  FileText,
  // Globe,
} from "lucide-react";
import { NavMenu } from "@/components/nav-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "@/components/overview-tab";
import { FilesTab } from "@/components/files-tab";
import { AppsTab } from "@/components/apps-tab";
import { ProcessTab } from "@/components/process-tab";
import { PerformanceTab } from "@/components/performance-tab";
import { TerminalTab } from "@/components/terminal-tab";
import { InstructTab } from "@/components/instruct-tab";
import { LogsTab } from "@/components/logs-tab";
import { useDeviceStore } from "@/store/device-store";
import { useEffect } from "react";

import { usePythonState } from "@/hooks/pythonBridge";
import { ScreenshotTab } from "@/components/screenshot-tab";

function App() {
  const { deviceInfo, fetchDevices } = useDeviceStore();
  const fetchDeviceInfo = useDeviceStore((state) => state.fetchDeviceInfo);
  usePythonState("ticker");
  useEffect(() => {
    // 应用启动时加载设备列表
    fetchDevices().then((r) => console.log(r));
  }, []);

  const handleDeviceChange = async (serial: string) => {
    await fetchDeviceInfo(serial);
  };
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Tabs defaultValue="overview" className="w-full">
        <div className="sticky top-0 z-10 bg-white shadow">
          <div className="flex items-center px-4">
            <NavMenu onDeviceChange={handleDeviceChange} />
            <TabsList className="h-12 p-0 bg-white border-b rounded-none sticky top-12 z-10">
              <TabsTrigger
                value="overview"
                className="h-12 px-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                概览
              </TabsTrigger>
              <TabsTrigger
                value="apps"
                className="h-12 px-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                <Boxes className="w-4 h-4 mr-2" />
                应用
              </TabsTrigger>
              <TabsTrigger
                value="process"
                className="h-12 px-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                <Play className="w-4 h-4 mr-2" />
                进程
              </TabsTrigger>
              <TabsTrigger
                value="files"
                className="h-12 px-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                <FileText className="w-4 h-4 mr-2" />
                文件
              </TabsTrigger>
              <TabsTrigger
                value="performance"
                className="h-12 px-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                <Activity className="w-4 h-4 mr-2" />
                性能
              </TabsTrigger>
              <TabsTrigger
                value="screenshot"
                className="h-12 px-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                <ScreenShareOff className="w-4 h-4 mr-2" />
                截屏
              </TabsTrigger>

              {/*<TabsTrigger*/}
              {/*  value="terminal"*/}
              {/*  className="h-12 px-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"*/}
              {/*>*/}
              {/*  <Terminal className="w-4 h-4 mr-2" />*/}
              {/*  终端*/}
              {/*</TabsTrigger>*/}
              <TabsTrigger
                value="logs"
                className="h-12 px-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                <FileJson className="w-4 h-4 mr-2" />
                日志
              </TabsTrigger>
              <TabsTrigger
                value="backup"
                className="h-12 px-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                <Zap className="w-4 h-4 mr-2" />
                快捷指令
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="p-6">
          <div className="mx-auto">
            <TabsContent value="overview" className="m-0">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                {deviceInfo && <OverviewTab deviceInfo={deviceInfo} />}
              </div>
            </TabsContent>

            <TabsContent value="apps" className="m-0">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <AppsTab />
              </div>
            </TabsContent>
            <TabsContent value="process" className="m-0">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <ProcessTab />
              </div>
            </TabsContent>
            <TabsContent value="performance" className="m-0">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <PerformanceTab />
              </div>
            </TabsContent>
            <TabsContent value="files" className="m-0">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <FilesTab />
              </div>
            </TabsContent>
            <TabsContent value="terminal" className="m-0">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <TerminalTab />
              </div>
            </TabsContent>
            <TabsContent value="backup" className="m-0">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <InstructTab />
              </div>
            </TabsContent>
            <TabsContent value="logs" className="m-0">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <LogsTab />
              </div>
            </TabsContent>
            <TabsContent value="screenshot" className="m-0">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <ScreenshotTab />
              </div>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}

export default App;
