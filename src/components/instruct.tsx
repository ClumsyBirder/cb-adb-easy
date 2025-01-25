import { Zap } from "lucide-react";

export function Instruct() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
      <Zap className="w-12 h-12 mb-4" />
      <p>快捷指令</p>
    </div>
  );
}
