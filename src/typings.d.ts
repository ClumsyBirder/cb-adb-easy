declare namespace API {
  type DeviceInfo = {
    name: string;
    brand: string;
    model: string;
    serialNumber: string;
    androidVersion: string;
    kernelVersion: string;
    processor: string;
    storage: {
      used: string;
      total: string;
    };
    abi: string;
    memTotal: string;
    memFree: string;
    physicalResolution: string;
    resolution: string;
    wifi: string;
    ipAddress: string;
    macAddress: string;
    fontScale: string;
  };

  type Device = {
    serial: string;
    model: string;
  };
}
