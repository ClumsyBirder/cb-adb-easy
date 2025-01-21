import { Globe } from "lucide-react";

export function WebTab() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
      <Globe className="w-12 h-12 mb-4" />
      <p>网页浏览</p>
    </div>
  );
}
