import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export function Process() {
  const [filter, setFilter] = useState("");
  const [showSystemOnly, setShowSystemOnly] = useState(false);
  const [processes, setProcesses] = useState<any[]>([]);

  let destroyed = false;

  useEffect(() => {
    const fetchProcesses = async () => {
      const res = await window.pywebview.api.get_processes();
      setProcesses(res);

      if (!destroyed) {
        setTimeout(fetchProcesses, 5000);
      }
    };

    fetchProcesses().then((r) => console.log(r));

    return () => {
      destroyed = true;
    };
  }, []);

  const filteredProcesses = useMemo(() => {
    return processes.filter((process) => {
      const matchesFilter = process?.name
        .toLowerCase()
        .includes(filter.toLowerCase());
      if (showSystemOnly) {
        return matchesFilter && process?.user === "system";
      }
      return matchesFilter;
    });
  }, [processes, filter, showSystemOnly]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="过滤名称"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex items-center space-x-2">
          <Checkbox
            id="system"
            checked={showSystemOnly}
            onCheckedChange={(checked) => setShowSystemOnly(checked as boolean)}
          />
          <label
            htmlFor="system"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            仅显示应用
          </label>
        </div>
        <div className="text-sm text-muted-foreground">
          共 {filteredProcesses.length} 个进程
        </div>
      </div>
      <div
        className="overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 13rem)" }}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>进程名称</TableHead>
              <TableHead className="w-[100px]">CPU(%)</TableHead>
              <TableHead className="w-[100px]">CPU 时间</TableHead>
              <TableHead className="w-[100px]">内存</TableHead>
              <TableHead className="w-[100px]">PID</TableHead>
              <TableHead className="w-[100px]">用户</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProcesses.map((process) => (
              <TableRow key={process.pid} className={"hover:bg-primary/70"}>
                <TableCell className="font-medium">{process.name}</TableCell>
                <TableCell>{process["%cpu"]}</TableCell>
                <TableCell>{process["time+"]}</TableCell>
                <TableCell>{process.res}</TableCell>
                <TableCell>{process.pid}</TableCell>
                <TableCell>{process.user}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
