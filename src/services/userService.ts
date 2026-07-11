import { supabase } from '@/lib/supabase';

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('User')
    .select('id, email, fullName, phone, role, avatarUrl, createdAt')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateProfile(
  userId: string,
  updates: Partial<{ fullName: string; phone: string; avatarUrl: string }>,
) {
  const { data, error } = await supabase.from('User').update(updates).eq('id', userId).select().single();
  if (error) throw error;
  return data;
}
