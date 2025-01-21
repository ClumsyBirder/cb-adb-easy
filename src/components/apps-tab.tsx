import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";


interface App {
  id: string;
  name: string;
  icon: string;
  isSystem: boolean;
}
const apps: App[] = [
  {
    id: "1",
    name: "讯飞输入法",
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20250120235843.png-Y4IVEAIcYcBw0albiB6Z16ufDIaVgB.jpeg",
    isSystem: false,
  },
  {
    id: "2",
    name: "宿了么",
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20250120235843.png-Y4IVEAIcYcBw0albiB6Z16ufDIaVgB.jpeg",
    isSystem: false,
  },
  {
    id: "3",
    name: "L-ink",
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20250120235843.png-Y4IVEAIcYcBw0albiB6Z16ufDIaVgB.jpeg",
    isSystem: false,
  },
  {
    id: "4",
    name: "中国移动",
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20250120235843.png-Y4IVEAIcYcBw0albiB6Z16ufDIaVgB.jpeg",
    isSystem: false,
  },
  {
    id: "5",
    name: "我的服务",
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20250120235843.png-Y4IVEAIcYcBw0albiB6Z16ufDIaVgB.jpeg",
    isSystem: true,
  },
  {
    id: "6",
    name: "微信",
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20250120235843.png-Y4IVEAIcYcBw0albiB6Z16ufDIaVgB.jpeg",
    isSystem: false,
  },
  {
    id: "7",
    name: "QQ安全中心",
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20250120235843.png-Y4IVEAIcYcBw0albiB6Z16ufDIaVgB.jpeg",
    isSystem: true,
  },
  {
    id: "8",
    name: "com.lmiot",
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20250120235843.png-Y4IVEAIcYcBw0albiB6Z16ufDIaVgB.jpeg",
    isSystem: true,
  },
  {
    id: "9",
    name: "小米文档",
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20250120235843.png-Y4IVEAIcYcBw0albiB6Z16ufDIaVgB.jpeg",
    isSystem: true,
  },
  // Add more apps as needed
];
export function AppsTab() {
  const [filter, setFilter] = useState("");
  const [showSystemApps, setShowSystemApps] = useState(false);

  const filteredApps = apps.filter((app) => {
    const matchesFilter = app.name.toLowerCase().includes(filter.toLowerCase());
    if (showSystemApps) {
      return matchesFilter && app.isSystem;
    }
    return matchesFilter;
  });
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
            onCheckedChange={(checked) => setShowSystemApps(checked as boolean)}
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
