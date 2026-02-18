import { create } from "zustand";

interface NotificationStore {
    hasNewOrder: boolean;
    setHasNewOrder: (value: boolean) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
    hasNewOrder: false,
    setHasNewOrder: (value) => set({ hasNewOrder: value }),
}));
