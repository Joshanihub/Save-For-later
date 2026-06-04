import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import useUIStore from '../../store/uiStore';

/**
 * Shows a one-time, non-intrusive banner asking the user to enable
 * browser notifications. It will NOT appear if:
 *   - Notifications are already granted
 *   - The browser doesn't support notifications
 *   - The user previously dismissed or denied the prompt
 */
export function NotificationPrompt() {
  const { notificationsEnabled, setPreferences } = useUIStore();
  const [visible, setVisible] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    if (!('Notification' in window)) {
      setPermissionState('unsupported');
      return;
    }

    const perm = Notification.permission;
    setPermissionState(perm);

    // Show the banner only when:
    // 1. Permission is still "default" (never asked before)
    // 2. The user hasn't explicitly disabled notifications in the app settings
    if (perm === 'default' && notificationsEnabled) {
      setVisible(true);
    }
  }, [notificationsEnabled]);

  const handleEnable = async () => {
    if (!('Notification' in window)) return;

    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);

      if (permission === 'granted') {
        setPreferences({ notificationsEnabled: true });

        // Send a confirmation notification
        try {
          new Notification('Notewise', {
            body: 'Notifications are enabled! You\'ll be notified about reminders and focus sessions.',
            icon: '/vite.svg',
          });
        } catch {
          // Can fail in some environments
        }
      } else if (permission === 'denied') {
        setPreferences({ notificationsEnabled: false });
      }
    } catch {
      // Permission request failed
    }

    setVisible(false);
  };

  const handleDismiss = () => {
    // User dismissed — don't nag again. Mark as disabled so we don't re-show.
    setPreferences({ notificationsEnabled: false });
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="mx-4 mb-3 p-3 bg-brand-500/10 border border-brand-500/20 rounded-lg animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-full bg-brand-500/20 text-brand-500 shrink-0 mt-0.5">
          <Bell size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-txt-primary mb-0.5">
            Enable notifications?
          </p>
          <p className="text-xs text-txt-secondary leading-relaxed mb-2">
            Get notified when your focus timer ends and when reminders are due.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEnable}
              className="text-xs px-3 py-1 rounded bg-brand-500 text-white hover:bg-brand-600 transition-colors font-medium"
            >
              Enable
            </button>
            <button
              onClick={handleDismiss}
              className="text-xs px-3 py-1 rounded bg-surface-2 text-txt-secondary hover:bg-surface-3 transition-colors font-medium"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-txt-tertiary hover:text-txt-secondary transition-colors shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
