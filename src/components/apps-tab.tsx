import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppsStore } from "@/store/apps-store";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Play, Trash, RefreshCcw, Loader2, BadgePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface App {
  id: string;
  name: string;
  icon: string;
  isSystem: boolean;
  packageName: string;
}

export function AppsTab() {
  const { selectedPackage, setSelectedPackage } = useAppsStore();
  const [filter, setFilter] = useState("");
  const [showSystemApps, setShowSystemApps] = useState(false);
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchApps = async (showSystem: boolean) => {
    try {
      setLoading(true);
      const response = await window.pywebview.api.get_packages(showSystem);
      setApps(response);
    } catch (error) {
      console.error("Failed to fetch apps:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps(showSystemApps);
  }, [showSystemApps]);

  const filteredApps = apps.filter((app) => {
    return app.name.toLowerCase().includes(filter.toLowerCase());
  });

  const handleSystemAppsChange = (checked: boolean) => {
    setShowSystemApps(checked);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  const handleAppClick = (packageName: string) => {
    setSelectedPackage(packageName);
  };
  const handleContextMenuAction = (action: string, appId: string) => {
    switch (action) {
      case "start":
        console.log("Starting app:", appId);
        break;
      case "stop":
        console.log("Stopping app:", appId);
        break;
      case "restart":
        console.log("Restarting app:", appId);
        break;
      case "uninstall":
        console.log("Uninstalling app:", appId);
        break;
      default:
        break;
    }
  };
  const handleOpenApk = () => {
    window.pywebview.api.install_package();
    console.log("Opening APK file...");
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="过滤"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex items-center space-x-2">
          <Checkbox
            id="system"
            checked={showSystemApps}
            onCheckedChange={(checked) =>
              handleSystemAppsChange(checked as boolean)
            }
          />
          <label
            htmlFor="system"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            系统应用
          </label>
        </div>
        <div className="text-sm text-muted-foreground">
          共 {filteredApps.length} 个应用
        </div>
        <Button onClick={handleOpenApk} className="ml-auto h-7">
          <BadgePlus className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {filteredApps.map((app) => (
          <ContextMenu key={app.id}>
            <ContextMenuTrigger>
              <div
                className={cn(
                  "group relative flex flex-col items-center",
                  "p-4 rounded-lg border",
                  "transition-colors duration-200",
                  "cursor-pointer select-none",
                  selectedPackage === app.packageName
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:bg-gray-50",
                )}
                onClick={() => handleAppClick(app.packageName)}
              >
                <div className="w-16 h-16 mb-3 rounded-lg bg-gray-100 flex items-center justify-center">
                  <img
                    src={"/vite.svg"}
                    alt={app.name}
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "/vite.svg";
                    }}
                  />
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="block text-sm text-center truncate w-full">
                        {app.name}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{app.packageName}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem
                onClick={() => handleContextMenuAction("start", app.id)}
              >
                <Play className="mr-2 h-4 w-4" />
                <span>启动</span>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => handleContextMenuAction("stop", app.id)}
              >
                <Play className="mr-2 h-4 w-4" />
                <span>停止</span>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => handleContextMenuAction("restart", app.id)}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                <span>重启</span>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => handleContextMenuAction("uninstall", app.id)}
                className="text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                <span>卸载</span>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>
    </div>
  );
}
