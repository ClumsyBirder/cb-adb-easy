import { useState, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type LogLevel = "I" | "D" | "W" | "E";

interface LogEntry {
  timestamp: string;
  processId: string;
  component: string;
  package: string;
  level: LogLevel;
  message: string;
}

const views = [
  "Standard View",
  "VERBOSE",
  "DEBUG",
  "INFO",
  "WARNING",
  "ERROR",
] as const;

export function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedView, setSelectedView] = useState<string>("Standard View");
  const [packageFilter, setPackageFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [messageWidth, setMessageWidth] = useState(0);
  const messageColumnRef = useRef<HTMLTableCellElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (window.pywebview && window.pywebview.state) {
      window.pywebview.state.addLogEntry = (logEntry: LogEntry) => {
        console.log(logEntry);
        setLogs((prevLogs) => [...prevLogs, logEntry].slice(-1000));
      };
    }
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const charsPerWidth = Math.floor(width / 8);
        setMessageWidth(Math.max(30, charsPerWidth - 10));
      }
    });

    if (messageColumnRef.current) {
      observer.observe(messageColumnRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        description: "消息已复制到剪贴板",
        duration: 2000,
      });
    } catch (err) {
      toast({
        description: err as string,
        variant: "destructive",
      });
    }
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case "I":
        return "text-blue-500";
      case "D":
        return "text-green-500";
      case "W":
        return "text-yellow-500";
      case "E":
        return "text-red-500";
      default:
        return "";
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (
      packageFilter &&
      !log.package.toLowerCase().includes(packageFilter.toLowerCase())
    ) {
      return false;
    }
    if (
      tagFilter &&
      !log.component.toLowerCase().includes(tagFilter.toLowerCase())
    ) {
      return false;
    }
    if (selectedView !== "Standard View") {
      const level = selectedView[0] as LogLevel;
      if (log.level !== level) {
        return false;
      }
    }
    return true;
  });

  const truncateMessage = (message: string) => {
    if (message.length <= messageWidth) return message;
    return message.slice(0, messageWidth) + "...";
  };

  return (
    <div className="flex flex-col text-gray-500">
      <div className="flex items-center gap-4 p-2 border-b bg-background">
        <Select value={selectedView} onValueChange={setSelectedView}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Select View" />
          </SelectTrigger>
          <SelectContent>
            {views.map((view) => (
              <SelectItem key={view} value={view}>
                {view}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Package"
          value={packageFilter}
          onChange={(e) => setPackageFilter(e.target.value)}
          className="max-w-[200px]"
        />
        <Input
          placeholder="Tag"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="max-w-[200px]"
        />
      </div>

      <div
        className="relative overflow-auto"
        style={{ maxHeight: "calc(100vh - 13rem)" }}
      >
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-[200px] font-mono">Timestamp</TableHead>
              <TableHead className="w-[100px] font-mono">Process ID</TableHead>
              <TableHead className="w-[200px] font-mono">Component</TableHead>
              <TableHead className="w-[200px] font-mono">Package</TableHead>
              <TableHead ref={messageColumnRef} className="font-mono">
                Message
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log, index) => (
              <TableRow key={index} className="font-mono">
                <TableCell className="whitespace-nowrap">
                  {log.timestamp}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {log.processId}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {log.component}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {log.package}
                </TableCell>
                <TableCell className={`${getLevelColor(log.level)}`}>
                  <div className="flex items-center gap-2">
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <span className="cursor-help whitespace-nowrap">
                          {truncateMessage(log.message)}
                        </span>
                      </HoverCardTrigger>
                      <HoverCardContent
                        className="w-[450px] text-sm break-all bg-background border"
                        side="left"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-mono flex-1">{log.message}</div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(log.message)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
