import { supabase } from './supabase';

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  phone: string | null;
  role: string;
  client_id: string | null;
  needs_password_change: boolean;
};

export async function getMyProfile(): Promise<Profile> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,display_name,phone,role,client_id,needs_password_change')
    .eq('id', auth.user.id)
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function setNeedsPasswordChange(value: boolean) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('profiles')
    .update({ needs_password_change: value })
    .eq('id', auth.user.id);

  if (error) throw error;
}
