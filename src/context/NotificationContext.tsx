import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppNotification } from '../types';
import { repository } from '../services/storageService';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const loadNotifs = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);
        if (!error && data) {
          setNotifications(data as AppNotification[]);
          return;
        }
      } catch (e) {
        console.warn('Notification fetch from Supabase failed:', e);
      }
    }
    const items = repository.getNotifications(user.id);
    setNotifications(items);
  }, [user?.id]);

  useEffect(() => {
    loadNotifs();
  }, [loadNotifs]);

  const markAsRead = useCallback(async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      } catch (e) {
        repository.markNotificationRead(id);
      }
    } else {
      repository.markNotificationRead(id);
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (isSupabaseConfigured && supabase && user?.id) {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.id)
          .eq('is_read', false);
      } catch (e) {
        notifications.forEach((n) => repository.markNotificationRead(n.id));
      }
    } else {
      notifications.forEach((n) => repository.markNotificationRead(n.id));
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, [notifications, user?.id]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications: loadNotifs,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
};
