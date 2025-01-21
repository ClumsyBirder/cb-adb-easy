import { Database } from "lucide-react";

export function BackupTab() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
      <Database className="w-12 h-12 mb-4" />
      <p>备份管理</p>
    </div>
  );
}
