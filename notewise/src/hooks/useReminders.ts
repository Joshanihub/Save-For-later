import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { Reminder } from '../types';

export function useReminders(noteId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ['reminders', noteId];

  const { data: reminders = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('reminders')
        .select('*')
        .order('next_due_at', { ascending: true });

      if (noteId) {
        query = query.eq('note_id', noteId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return data.map((r) => ({
        id: r.id,
        noteId: r.note_id,
        userId: r.user_id,
        message: r.message,
        nextDueAt: r.next_due_at,
        isSnoozed: r.is_snoozed,
        snoozeUntil: r.snooze_until,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })) as Reminder[];
    }
  });

  const { mutate: createReminder, isPending: isCreating } = useMutation({
    mutationFn: async (reminderData: Partial<Reminder> & { noteId: string, nextDueAt: string, message: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('reminders')
        .insert([{
          note_id: reminderData.noteId,
          user_id: user.id,
          message: reminderData.message,
          next_due_at: reminderData.nextDueAt,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    }
  });

  const { mutate: updateReminder, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Reminder> }) => {
      const dbUpdates: Record<string, any> = {
        message: updates.message,
        next_due_at: updates.nextDueAt,
        is_snoozed: updates.isSnoozed,
        snooze_until: updates.snoozeUntil,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('reminders')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    }
  });

  const { mutate: deleteReminder } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    }
  });

  return {
    reminders,
    isLoading,
    error,
    createReminder,
    isCreating,
    updateReminder,
    isUpdating,
    deleteReminder
  };
}
