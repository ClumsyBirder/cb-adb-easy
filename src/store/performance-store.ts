import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createJSONStorage } from 'zustand/middleware';

interface ProcessMemoryInfo {
  "Java Heap": number;
  "Native Heap": number;
  Code: number;
  Stack: number;
  Graphics: number;
  "Private Other": number;
  System: number;
  "TOTAL PSS": number;
}

interface TimePoint {
  time: string;
  processes: {
    [processName: string]: ProcessMemoryInfo;
  };
}

interface MonitoringState {
  isRunning: boolean;
  intervalId: NodeJS.Timeout | null;
  setRunning: (running: boolean) => void;
  setIntervalId: (id: NodeJS.Timeout | null) => void;
}

interface DataState {
  timePoints: TimePoint[];
  addTimePoint: (timePoint: TimePoint) => void;
  clearData: () => void;
}

interface ConfigState {
  updateInterval: number;
  setUpdateInterval: (interval: number) => void;
}

interface PerformanceStore extends MonitoringState, DataState, ConfigState {
  startMonitoring: (packageName: string) => void;
  stopMonitoring: () => void;
}

export const usePerformanceStore = create<PerformanceStore>()(
  persist(
    (set, get) => ({
      isRunning: false,
      intervalId: null,
      setRunning: (running) => set({ isRunning: running }),
      setIntervalId: (id) => set({ intervalId: id }),
      timePoints: [],
      addTimePoint: (timePoint) => set((state) => ({
        timePoints: [...state.timePoints, timePoint]
      })),
      clearData: () => set({ timePoints: [] }),
      updateInterval: 1000,
      setUpdateInterval: (interval) => set({ updateInterval: interval }),

      startMonitoring: async (packageName: string) => {
        const store = get();
        if (store.isRunning) return;

        const updateData = async () => {
          try {
            const response = await window.pywebview.api.get_memory_info(packageName);
            const now = new Date();
            const timeString = `${now.getHours().toString().padStart(2, "0")}:${
              now.getMinutes().toString().padStart(2, "0")}:${
              now.getSeconds().toString().padStart(2, "0")}`;

            store.addTimePoint({
              time: timeString,
              processes: response
            });
          } catch (error) {
            console.error("Failed to fetch memory data:", error);
          }
        };

        await updateData();
        const id = setInterval(updateData, store.updateInterval);
        
        set({ 
          isRunning: true,
          intervalId: id 
        });
      },

      stopMonitoring: () => {
        const { intervalId } = get();
        if (intervalId) {
          clearInterval(intervalId);
        }
        set({ 
          isRunning: false,
          intervalId: null 
        });
      },
    }),
    {
      name: 'performance-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        updateInterval: state.updateInterval,
      }),
    }
  )
); 