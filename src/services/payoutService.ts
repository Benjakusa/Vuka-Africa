import { supabase } from '@/lib/supabase';

export async function requestPayout(data: { trainerId: string; amount: number; phone: string }) {
  const { data: payout, error } = await supabase
    .from('Payout')
    .insert({
      trainerId: data.trainerId,
      amount: data.amount,
      phone: data.phone,
      status: 'PENDING',
    })
    .select()
    .single();
  if (error) throw error;
  return payout;
}

export async function getPayoutHistory(trainerId: string) {
  const { data, error } = await supabase
    .from('Payout')
    .select('*')
    .eq('trainerId', trainerId)
    .order('createdAt', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}
