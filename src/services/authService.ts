import { supabase } from '@/lib/supabase';

export async function forgotPassword(email: string) {
  const redirectTo = `${window.location.origin}/auth/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
  return { message: 'If an account with that email exists, a reset link has been sent.' };
}

export async function resetPassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return { message: 'Password reset successfully. Please login with your new password.' };
}
