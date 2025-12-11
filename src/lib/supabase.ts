import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lmvymcncmmxtgfhkosmc.supabase.co';
const supabaseAnonKey = 'sb_publishable_yeiYWuyhjZBBoSPcFRRKow__58efMlK';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
