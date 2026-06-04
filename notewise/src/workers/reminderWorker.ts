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

  // Poll every 60 seconds
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

      data.forEach((reminder: any) => {
        if (!notifiedReminders.has(reminder.id)) {
          // Show notification
          const noteTitle = reminder.notes?.title || 'Note';
          
          new Notification(`Reminder: ${noteTitle}`, {
            body: reminder.message,
            icon: '/favicon.ico', // Update if you have an app icon
          });

          notifiedReminders.add(reminder.id);
        }
      });
    } catch (err) {
      console.error('Error polling reminders:', err);
    }
  }, 60000);

  return () => clearInterval(intervalId);
}
