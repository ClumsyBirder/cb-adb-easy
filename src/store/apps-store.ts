import { create } from "zustand";
import { persist, PersistStorage } from "zustand/middleware";

interface AppsStore {
  selectedPackage: string | null;
  setSelectedPackage: (packageName: string | null) => void;
}

const customStorage: PersistStorage<AppsStore> = {
  getItem: (name) => {
    const item = localStorage.getItem(name);
    return Promise.resolve(item ? JSON.parse(item) : null); // Parse the stored JSON
  },
  setItem: (name, value) => {
    localStorage.setItem(name, JSON.stringify(value)); // Stringify the value before storing
    return Promise.resolve();
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
    return Promise.resolve();
  },
};


export const useAppsStore = create<AppsStore>()(
  persist(
    (set) => ({
      selectedPackage: null,
      setSelectedPackage: (packageName) =>
        set({ selectedPackage: packageName }),
    }),
    {
      name: "apps-storage",
      storage: customStorage,
    },
  ),
);
