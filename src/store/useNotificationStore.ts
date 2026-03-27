import { create } from "zustand";

export interface AdminNotification {
    id: string;
    title: string;
    body: string;
    type?: string;
    data?: Record<string, unknown>;
    is_read: boolean;
    read_at?: string;
    created_at: string;
}

interface NotificationStore {
    notifications: AdminNotification[];
    hasNewOrder: boolean;
    setNotifications: (notifications: AdminNotification[]) => void;
    addNotification: (notification: AdminNotification) => void;
    markAsRead: (id: string) => void;
    setHasNewOrder: (value: boolean) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
    notifications: [],
    hasNewOrder: false,
    setNotifications: (notifications) => set({ notifications }),
    addNotification: (notification) => set((state) => ({ 
        notifications: [notification, ...state.notifications],
        hasNewOrder: notification.type === 'new_order' ? true : state.hasNewOrder
    })),
    markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => 
            n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
    })),
    setHasNewOrder: (value) => set({ hasNewOrder: value }),
}));
