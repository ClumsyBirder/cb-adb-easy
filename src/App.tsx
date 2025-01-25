import {
  Boxes,
  Play,
  Activity,
  Zap,
  FileJson,
  ScreenShareOff,
  FileText,
  Video,
} from "lucide-react";
import { NavMenu } from "@/components/nav-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Overview } from "@/components/overview";
import { Files } from "@/components/files";
import { Apps } from "@/components/apps";
import { Process } from "@/components/process";
import { Performance } from "@/components/performance";
import { Terminal } from "@/components/terminal";
import { Instruct } from "@/components/instruct";
import { Logs } from "@/components/logs";
import { Screenshot } from "@/components/screenshot";
import { useDeviceStore } from "@/store/device-store";
import { useEffect } from "react";

import { usePythonState } from "@/hooks/pythonBridge";
import Screenrecord from "@/components/screenrecord.tsx";

function App() {
  const { deviceInfo, fetchDevices } = useDeviceStore();
  const fetchDeviceInfo = useDeviceStore((state) => state.fetchDeviceInfo);
  usePythonState("ticker");
  useEffect(() => {
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
              <TabsTrigger
                value="screen-recording"
                className="h-12 px-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                <Video className="w-4 h-4 mr-2" />
                录屏
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
                {deviceInfo && <Overview deviceInfo={deviceInfo} />}
              </div>
            </TabsContent>

            <TabsContent value="apps" className="m-0">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <Apps />
              </div>
            </TabsContent>
            <TabsContent value="process" className="m-0">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <Process />
              </div>
            </TabsContent>
            <TabsContent value="performance" className="m-0">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <Performance />
              </div>
            </TabsContent>
            <TabsContent value="files" className="m-0">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <Files />
              </div>
            </TabsContent>
            <TabsContent value="terminal" className="m-0">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <Terminal />
              </div>
            </TabsContent>
            <TabsContent value="backup" className="m-0">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <Instruct />
              </div>
            </TabsContent>
            <TabsContent value="logs" className="m-0">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <Logs />
              </div>
            </TabsContent>
            <TabsContent value="screenshot" className="m-0">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <Screenshot />
              </div>
            </TabsContent>
            <TabsContent value="screen-recording" className="m-0">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <Screenrecord />
              </div>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}

export default App;
