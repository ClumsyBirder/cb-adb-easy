import { FileJson } from "lucide-react";

export function LogsTab() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
      <FileJson className="w-12 h-12 mb-4" />
      <p>日志查看</p>
    </div>
  );
}
