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

  if (error) {
    throw new Error(error.message || 'Payment initiation failed');
  }
  if (!result || !result.CheckoutRequestID) {
    throw new Error(result?.ResponseDescription || 'Failed to initiate payment');
  }

  return result;
}

export async function getTransactionHistory(userId: string, page?: number, perPage = 50) {
  let query = supabase
    .from('TransactionLedger')
    .select('*', page !== undefined ? { count: 'exact' } : undefined)
    .eq('userId', userId)
    .order('createdAt', { ascending: false });

  if (page !== undefined) {
    const from = (page - 1) * perPage;
    query = query.range(from, from + perPage - 1);
    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data || [], total: count || 0, page, perPage };
  }

  // Default: return the most recent 50 entries (prevents unbounded downloads)
  query = query.limit(perPage);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
