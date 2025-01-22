import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDeviceStore } from "@/store/device-store";
// import { ThemeToggle } from "@/components/theme-toggle";

export function NavMenu({
  onDeviceChange,
}: {
  onDeviceChange: (serial: string) => void;
}) {
  // const ticker = usePythonState("ticker");
  const { devices, loading, fetchDevices, currentDevice } = useDeviceStore()

  const handleDeviceChange = (serial: string) => {
    onDeviceChange(serial)
  }

  return (
    <div className="border-b dark:border-gray-700">
      <div className="flex items-center justify-between gap-1 px-2 h-12">
        <div className="flex items-center gap-1">
          <Select value={currentDevice || undefined} onValueChange={handleDeviceChange}>
            <SelectTrigger className="w-[150px] h-8 border-0">
              <SelectValue placeholder={loading ? "Loading..." : "选择设备"} />
            </SelectTrigger>
            <SelectContent>
              {devices.map((device) => (
                <SelectItem key={device.serial} value={device.serial}>
                  {device.model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => fetchDevices()}
            disabled={loading}
          >
            <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        {/*<ThemeToggle />*/}
      </div>
    </div>
  );
}
