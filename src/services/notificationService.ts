import { supabase } from '@/lib/supabase';

export async function getNotifications(userId: string) {
  const { data, error } = await supabase
    .from('Notification')
    .select('*')
    .eq('userId', userId)
    .order('createdAt', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data || [];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from('Notification').update({ status: 'SENT' }).eq('id', id);
  if (error) throw error;
}
