import { supabaseData as supabase } from '@/lib/supabase';

export async function forgotPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
  return { message: 'If an account with that email exists, a reset link has been sent.' };
}

export async function resetPassword(token: string, newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return { message: 'Password reset successfully. Please login with your new password.' };
}
