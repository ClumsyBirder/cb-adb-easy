import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppsStore } from "@/store/apps-store";
import { Loader2 } from "lucide-react";

interface App {
  id: string;
  name: string;
  icon: string;
  isSystem: boolean;
  packageName: string;
}

export function AppsTab() {
  const { setSelectedPackage } = useAppsStore();
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

  const handleAppSelect = (packageName: string) => {
    setSelectedPackage(packageName);
  };

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
            onCheckedChange={(checked) => handleSystemAppsChange(checked as boolean)}
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
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-4">
        {filteredApps.map((app) => (
          <div
            key={app.id}
            className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            onClick={() => handleAppSelect(app.packageName)}
          >
            <div className="w-12 h-12 mb-2">
              <img
                src={app.icon || "/placeholder.svg"}
                alt={app.name}
                className="w-full h-full rounded-lg object-cover"
              />
            </div>
            <span className="text-xs text-center line-clamp-2">{app.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
