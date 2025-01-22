import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppsStore {
  selectedPackage: string | null;
  setSelectedPackage: (packageName: string | null) => void;
}

export const useAppsStore = create<AppsStore>()(
  persist(
    (set) => ({
      selectedPackage: null,
      setSelectedPackage: (packageName) => set({ selectedPackage: packageName }),
    }),
    {
      name: 'apps-storage',
      storage: localStorage,
    }
  )
); 