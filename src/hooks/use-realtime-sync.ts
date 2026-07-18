import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { enrolmentKeys, trainerKeys, adminKeys, courseKeys, messageKeys } from '@/lib/query-keys';

export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('dashboard-realtime-sync');

    // 1. Enrolment changes → update enrolment lists and trainer stats
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'Enrolment' }, (_payload) => {
      queryClient.invalidateQueries({ queryKey: enrolmentKeys.all });
      if (user.trainer?.id) {
        queryClient.invalidateQueries({ queryKey: trainerKeys.stats(user.trainer.id) });
      }
    });

    // 2. Trainer changes → update trainer lists and stats (e.g. verification fee paid)
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'Trainer' }, (_payload) => {
      queryClient.invalidateQueries({ queryKey: trainerKeys.all });
    });

    // 3. TransactionLedger changes → update admin earnings and trainer earnings
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'TransactionLedger' }, (_payload) => {
      // adminKeys.earnings is a const array, not a factory function
      queryClient.invalidateQueries({ queryKey: adminKeys.earnings });
      queryClient.invalidateQueries({ queryKey: adminKeys.transactions() });
      if (user.trainer?.id) {
        queryClient.invalidateQueries({ queryKey: trainerKeys.stats(user.trainer.id) });
      }
    });

    // 4. Payout changes → update admin payout dashboard
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'Payout' }, (_payload) => {
      // adminKeys.earnings is a const array, not a factory function
      queryClient.invalidateQueries({ queryKey: adminKeys.earnings });
      queryClient.invalidateQueries({ queryKey: adminKeys.payouts() });
    });

    // 5. Course changes → update course lists
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'Course' }, (_payload) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
    });

    // 6. Message changes → update chats and unread counts
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'Message' }, (_payload) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.all });
    });

    channel.subscribe((status) => {
      if (import.meta.env.DEV) {
        console.log('[Realtime] channel status:', status);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
}
