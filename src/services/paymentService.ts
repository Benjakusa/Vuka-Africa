import { supabase } from '@/lib/supabase';

export async function initiateMpesaPayment(data: {
  phone: string;
  amount: number;
  reference: string;
  description: string;
  enrolmentId?: string;
  trainerId?: string;
}) {
  const { data: result, error } = await supabase.functions.invoke('mpesa-stkpush', {
    body: data,
  });
  if (error) throw error;
  return result;
}

export async function getTransactionHistory(userId: string) {
  const { data, error } = await supabase
    .from('TransactionLedger')
    .select('*')
    .eq('userId', userId)
    .order('createdAt', { ascending: false });
  if (error) throw error;
  return data || [];
}
