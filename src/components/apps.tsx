import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppsStore } from "@/store/apps-store";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Play,
  Trash,
  Loader2,
  BadgePlus,
  Pause,
  ShieldBan,
  ShieldCheck,
  Eraser,
  ArrowDownToLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface App {
  id: string;
  name: string;
  icon: string;
  isSystem: boolean;
  packageName: string;
}

export function Apps() {
  const { selectedPackage, setSelectedPackage } = useAppsStore();
  const [filter, setFilter] = useState("");
  const [showSystemApps, setShowSystemApps] = useState(false);
  const [apps, setApps] = useState<App[]>([]);
  const [actionLoading, setActionLoading] = useState<{
    type: string;
    packageName: string;
  } | null>(null);

  const fetchApps = async (showSystem: boolean) => {
    const response = await window.pywebview.api.get_packages(showSystem);
    setApps(response);
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

  const handleAppClick = (packageName: string) => {
    setSelectedPackage(packageName);
  };
  const handleContextMenuAction = async (
    action: string,
    packageName: string,
  ) => {
    try {
      setActionLoading({ type: action, packageName });

      switch (action) {
        case "start":
          console.log("Starting app:", packageName);
          await window.pywebview.api.start_package(packageName);
          break;
        case "stop":
          console.log("Stopping app:", packageName);
          await window.pywebview.api.stop_package(packageName);
          break;
        case "disable":
          console.log("disable app:", packageName);
          await window.pywebview.api.disable_package(packageName);
          break;
        case "enable":
          console.log("enable app:", packageName);
          await window.pywebview.api.enable_package(packageName);
          break;
        case "pull":
          console.log("pull apk:", packageName);
          await window.pywebview.api.pull_apk(packageName);
          break;
        case "clear":
          console.log("clear app:", packageName);
          await window.pywebview.api.clear_package(packageName);
          break;
        case "uninstall":
          console.log("Uninstalling app:", packageName);
          await window.pywebview.api.uninstall_package(packageName);
          break;
        default:
          break;
      }

      await fetchApps(showSystemApps);
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
    } finally {
      setActionLoading(null);
    }
  };
  const handleOpenApk = async () => {
    try {
      setActionLoading({ type: "install", packageName: "" });
      await window.pywebview.api.install_package();
      await fetchApps(showSystemApps);
    } catch (error) {
      console.error("Failed to install apk:", error);
    } finally {
      setActionLoading(null);
    }
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
        <Button
          onClick={handleOpenApk}
          className="ml-auto h-7"
          disabled={!!actionLoading}
        >
          {actionLoading?.type === "install" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <BadgePlus className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div
        className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 overflow-auto"
        style={{ maxHeight: "calc(100vh - 13rem)" }}
      >
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
                onClick={() =>
                  handleContextMenuAction("start", app.packageName)
                }
              >
                <Play className="mr-2 h-4 w-4" />
                <span>启动</span>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => handleContextMenuAction("stop", app.packageName)}
              >
                <Pause className="mr-2 h-4 w-4" />
                <span>停止</span>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={() =>
                  handleContextMenuAction("enable", app.packageName)
                }
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>启用</span>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() =>
                  handleContextMenuAction("disable", app.packageName)
                }
              >
                <ShieldBan className="mr-2 h-4 w-4" />
                <span>禁用</span>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={() => handleContextMenuAction("pull", app.packageName)}
                disabled={!!actionLoading}
              >
                {actionLoading?.type === "pull" &&
                actionLoading.packageName === app.packageName ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowDownToLine className="mr-2 h-4 w-4" />
                )}
                <span>导出</span>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() =>
                  handleContextMenuAction("clear", app.packageName)
                }
              >
                <Eraser className="mr-2 h-4 w-4" />
                <span>清理</span>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() =>
                  handleContextMenuAction("uninstall", app.packageName)
                }
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
