import { supabase } from '../lib/supabaseClient';

// Store already notified reminder IDs to prevent spamming
const notifiedReminders = new Set<string>();

export function initReminderWorker() {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notification');
    return;
  }

  // Request permission if not already granted
  if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission();
  }

  // Poll every 10 seconds for more responsive notifications
  const intervalId = setInterval(async () => {
    if (Notification.permission !== 'granted') return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('reminders')
        .select('*, notes(title)')
        .eq('user_id', user.id)
        .eq('is_snoozed', false)
        .lte('next_due_at', now);

      if (error || !data) return;

      for (const reminder of data) {
        if (!notifiedReminders.has(reminder.id)) {
          // Show notification
          const noteTitle = reminder.notes?.title || 'Note';
          
          const notification = new Notification(`Reminder: ${noteTitle}`, {
            body: reminder.message,
            icon: '/vite.svg', 
          });

          notification.onclick = () => {
            window.focus();
            notification.close();
          };

          notifiedReminders.add(reminder.id);

          // Automatically delete the reminder so it doesn't fire again on next load
          await supabase.from('reminders').delete().eq('id', reminder.id);
        }
      }
    } catch (err) {
      console.error('Error polling reminders:', err);
    }
  }, 10000);

  return () => clearInterval(intervalId);
}
