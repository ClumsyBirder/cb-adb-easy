import { FileText } from "lucide-react";

export function FilesTab() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
      <FileText className="w-12 h-12 mb-4" />
      <p>文件管理器</p>
    </div>
  );
}
