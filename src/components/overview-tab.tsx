import {
  Smartphone,
  Cpu,
  HardDrive,
  Monitor,
  Wifi,
  Globe,
  Network,
  Info,
  Hash,
  SmartphoneIcon as Android,
  CaseUpper,
} from "lucide-react";

export function OverviewTab({ deviceInfo }: { deviceInfo: API.DeviceInfo }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="flex items-start gap-3">
        <Smartphone className="w-5 h-5 mt-1 text-gray-500" />
        <div>
          <div className="text-sm text-gray-500">名称</div>
          <div className="font-medium">{deviceInfo.name}</div>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 mt-1 text-gray-500" />
        <div>
          <div className="text-sm text-gray-500">品牌</div>
          <div className="font-medium">{deviceInfo.brand}</div>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Hash className="w-5 h-5 mt-1 text-gray-500" />
        <div>
          <div className="text-sm text-gray-500">型号</div>
          <div className="font-medium">{deviceInfo.model}</div>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Hash className="w-5 h-5 mt-1 text-gray-500" />
        <div>
          <div className="text-sm text-gray-500">序列号</div>
          <div className="font-medium">未知</div>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Android className="w-5 h-5 mt-1 text-gray-500" />
        <div>
          <div className="text-sm text-gray-500">Android 版本</div>
          <div className="font-medium">{deviceInfo.androidVersion}</div>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Cpu className="w-5 h-5 mt-1 text-gray-500" />
        <div>
          <div className="text-sm text-gray-500">内核版本</div>
          <div className="font-medium truncate">{deviceInfo.kernelVersion}</div>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Cpu className="w-5 h-5 mt-1 text-gray-500" />
        <div>
          <div className="text-sm text-gray-500">处理器</div>
          <div className="font-medium">{deviceInfo.abi}</div>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <HardDrive className="w-5 h-5 mt-1 text-gray-500" />
        <div>
          <div className="text-sm text-gray-500">存储</div>
          <div className="font-medium">
            <span className="text-green-600">{deviceInfo.memFree}</span>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <HardDrive className="w-5 h-5 mt-1 text-gray-500" />
        <div>
          <div className="text-sm text-gray-500">内存</div>
          <div className="font-medium">{deviceInfo.memTotal}</div>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Monitor className="w-5 h-5 mt-1 text-gray-500" />
        <div>
          <div className="text-sm text-gray-500">物理分辨率</div>
          <div className="font-medium">{deviceInfo.physicalResolution}</div>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Monitor className="w-5 h-5 mt-1 text-gray-500" />
        <div>
          <div className="text-sm text-gray-500">分辨率</div>
          <div className="font-medium">{deviceInfo.resolution}</div>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Wifi className="w-5 h-5 mt-1 text-gray-500" />
        <div>
          <div className="text-sm text-gray-500">Wi-Fi</div>
          <div className="font-medium">未知</div>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Globe className="w-5 h-5 mt-1 text-gray-500" />
        <div>
          <div className="text-sm text-gray-500">IP 地址</div>
          <div className="font-medium">{deviceInfo.ipAddress}</div>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Network className="w-5 h-5 mt-1 text-gray-500" />
        <div>
          <div className="text-sm text-gray-500">MAC 地址</div>
          <div className="font-medium">{deviceInfo.macAddress}</div>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <CaseUpper className="w-5 h-5 mt-1 text-gray-500" />
        <div>
          <div className="text-sm text-gray-500">字体缩放</div>
          <div className="font-medium">{deviceInfo.fontScale}</div>
        </div>
      </div>
    </div>
  );
}
