import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export interface UserStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  updatedAt: string;
}

export function useStreaks() {
  const queryClient = useQueryClient();
  const queryKey = ['user_streaks'];

  const { data: streak, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return null;

      return {
        userId: data.user_id,
        currentStreak: data.current_streak,
        longestStreak: data.longest_streak,
        lastActivityDate: data.last_activity_date,
        updatedAt: data.updated_at,
      } as UserStreak;
    }
  });

  const { mutate: updateActivity } = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      // Fetch current streak to calculate logic
      const { data: currentRecord } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!currentRecord) {
        // First ever activity
        await supabase.from('user_streaks').insert([{
          user_id: user.id,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: today
        }]);
        return;
      }

      if (currentRecord.last_activity_date === today) {
        // Already logged activity today, do nothing
        return;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newCurrent = currentRecord.current_streak;
      let newLongest = currentRecord.longest_streak;

      if (currentRecord.last_activity_date === yesterdayStr) {
        // Continuous streak
        newCurrent += 1;
      } else {
        // Streak broken
        newCurrent = 1;
      }

      if (newCurrent > newLongest) {
        newLongest = newCurrent;
      }

      await supabase.from('user_streaks').update({
        current_streak: newCurrent,
        longest_streak: newLongest,
        last_activity_date: today,
        updated_at: new Date().toISOString()
      }).eq('user_id', user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  return {
    streak,
    isLoading,
    error,
    updateActivity
  };
}
