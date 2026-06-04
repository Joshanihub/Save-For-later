import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { Task } from '../types';

export function useTasks(noteId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ['tasks', noteId];

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select('*')
        .order('position', { ascending: true })
        .order('created_at', { ascending: false });

      if (noteId) {
        query = query.eq('note_id', noteId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return data.map((t) => ({
        id: t.id,
        noteId: t.note_id,
        userId: t.user_id,
        title: t.title,
        isCompleted: t.is_completed,
        dueDate: t.due_date,
        recurrence: t.recurrence,
        nextDueDate: t.next_due_date,
        priority: t.priority,
        position: t.position,
        createdAt: t.created_at,
        completedAt: t.completed_at,
        updatedAt: t.updated_at,
      })) as Task[];
    }
  });

  const { mutate: createTask, isPending: isCreating } = useMutation({
    mutationFn: async (taskData: Partial<Task> & { noteId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          note_id: taskData.noteId,
          user_id: user.id,
          title: taskData.title,
          is_completed: false,
          due_date: taskData.dueDate,
          recurrence: taskData.recurrence || null,
          priority: taskData.priority || 3,
          position: taskData.position || 0,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const { mutate: updateTask, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      const dbUpdates: Record<string, any> = {
        title: updates.title,
        is_completed: updates.isCompleted,
        due_date: updates.dueDate,
        recurrence: updates.recurrence,
        priority: updates.priority,
        position: updates.position,
        updated_at: new Date().toISOString()
      };

      if (updates.isCompleted !== undefined) {
        dbUpdates.completed_at = updates.isCompleted ? new Date().toISOString() : null;
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const { mutate: deleteTask } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  return {
    tasks,
    isLoading,
    error,
    createTask,
    isCreating,
    updateTask,
    isUpdating,
    deleteTask
  };
}
