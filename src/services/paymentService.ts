import { supabaseData as supabase } from '@/lib/supabase';

export async function initiateMpesaPayment(data: {
  phone: string;
  amount: number;
  reference: string;
  description: string;
}) {
  const { data: result, error } = await supabase.functions.invoke('mpesa-stkpush', {
    body: data,
  });
  if (error) throw error;
  return result;
}

export async function getTransactionHistory(userId: string, role: 'trainee' | 'trainer') {
  const field = role === 'trainee' ? 'traineeId' : 'trainerId';
  const { data, error } = await supabase
    .from('TransactionLedger')
    .select('*')
    .eq(field, userId)
    .order('createdAt', { ascending: false });
  if (error) throw error;
  return data || [];
}
