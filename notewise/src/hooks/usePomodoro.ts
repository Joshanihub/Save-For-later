import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { PomodoroSession } from '../types';

export function usePomodoro() {
  const queryClient = useQueryClient();
  const queryKey = ['pomodoro_sessions'];

  const { data: sessions = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(50); // Get recent sessions

      if (error) throw error;
      
      return data.map((s) => ({
        id: s.id,
        userId: s.user_id,
        durationMinutes: s.duration_minutes,
        breaksTaken: s.breaks_taken,
        completedAt: s.completed_at,
        createdAt: s.created_at,
      })) as PomodoroSession[];
    }
  });

  const { mutate: logSession } = useMutation({
    mutationFn: async (sessionData: { durationMinutes: number; breaksTaken: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .insert([{
          user_id: user.id,
          duration_minutes: sessionData.durationMinutes,
          breaks_taken: sessionData.breaksTaken,
          completed_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  return {
    sessions,
    isLoading,
    logSession,
  };
}
