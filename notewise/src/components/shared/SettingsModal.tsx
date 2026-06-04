import { useState, useEffect } from 'react';
import { X, Bell, BellOff } from 'lucide-react';
import useUIStore from '../../store/uiStore';
import useToastStore from '../../store/toastStore';
import { ImportSection } from './ImportSection';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { theme, setTheme, notificationsEnabled, setPreferences } = useUIStore();
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    } else {
      setBrowserPermission('unsupported');
    }
  }, []);

  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      // If the user wants to enable notifications, request browser permission first
      if ('Notification' in window && Notification.permission !== 'granted') {
        try {
          const permission = await Notification.requestPermission();
          setBrowserPermission(permission);

          if (permission === 'denied') {
            useToastStore.getState().showToast(
              'Notifications were blocked by your browser. Please enable them in your browser settings.',
              'error',
            );
            return; // Don't flip the toggle
          }
        } catch {
          useToastStore.getState().showToast(
            'Failed to request notification permission.',
            'error',
          );
          return;
        }
      }
    }

    setPreferences({ notificationsEnabled: enabled });
  };

  const notifStatusText = (): string => {
    if (browserPermission === 'unsupported') return 'Your browser does not support notifications.';
    if (browserPermission === 'denied') return 'Notifications are blocked in your browser settings.';
    if (browserPermission === 'granted' && notificationsEnabled) return 'You will receive focus timer and reminder notifications.';
    return 'Get notified for task reminders and focus sessions.';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-surface-0 w-full max-w-md rounded-2xl shadow-xl border border-edge overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-edge">
          <h2 className="text-lg font-semibold text-txt-primary">Settings</h2>
          <button onClick={onClose} className="p-1.5 text-txt-tertiary hover:bg-surface-1 rounded-full">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-txt-secondary uppercase tracking-wider">Appearance</h3>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-txt-primary">Theme</span>
              <select
                className="input text-sm py-1"
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'auto')}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">System</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-txt-secondary uppercase tracking-wider">Notifications</h3>
            
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                {notificationsEnabled && browserPermission === 'granted' ? (
                  <Bell size={16} className="text-brand-500" />
                ) : (
                  <BellOff size={16} className="text-txt-tertiary" />
                )}
                <span className="text-sm text-txt-primary">Desktop Notifications</span>
              </div>
              <div className="relative inline-block w-10 h-6">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={notificationsEnabled}
                  disabled={browserPermission === 'unsupported'}
                  onChange={(e) => handleToggleNotifications(e.target.checked)}
                />
                <div className="w-10 h-6 bg-surface-2 rounded-full peer peer-checked:bg-brand-500 peer-disabled:opacity-50 transition-colors"></div>
                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4"></div>
              </div>
            </label>
            <p className="text-xs text-txt-tertiary">
              {notifStatusText()}
            </p>
            {browserPermission === 'denied' && (
              <p className="text-xs text-status-error">
                To re-enable, click the lock icon in your browser's address bar and allow notifications.
              </p>
            )}
          </div>

          <ImportSection />
        </div>

        <div className="p-4 border-t border-edge bg-surface-1 flex justify-end">
          <button onClick={onClose} className="btn btn-primary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
