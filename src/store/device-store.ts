import { create } from "zustand";

interface DeviceState {
  deviceInfo: API.DeviceInfo | null;
  devices: API.Device[];
  loading: boolean;
  currentDevice: string | null;
  setDeviceInfo: (info: API.DeviceInfo | null) => void;
  fetchDeviceInfo: (serial: string) => Promise<void>;
  fetchDevices: () => Promise<void>;
  setCurrentDevice: (serial: string) => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  deviceInfo: null,
  devices: [],
  loading: false,
  currentDevice: null,
  setDeviceInfo: (info) => set({ deviceInfo: info }),
  setCurrentDevice: (serial) => set({ currentDevice: serial }),
  fetchDeviceInfo: async (serial) => {
    try {
      const res = await window.pywebview.api.device_info(serial);
      set({ deviceInfo: res, currentDevice: serial });
    } catch (error) {
      console.error("Error fetching device info:", error);
    }
  },
  fetchDevices: async () => {
    set({ loading: true });
    try {
      const res = await window.pywebview.api.get_device_list();
      set({ devices: res });
      if (res.length > 0) {
        const deviceInfo = await window.pywebview.api.device_info(
          res[0].serial,
        );
        set({
          deviceInfo,
          currentDevice: res[0].serial,
        });
      }
    } catch (error) {
      console.error("获取设备错误:", error);
    } finally {
      set({ loading: false });
    }
  },
}));
