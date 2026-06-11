import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fywdidvnxaqrckuxwwhj.supabase.co";
const SUPABASE_KEY = "sb_publishable_taiZ4Qm1yr2Jy9GBWIsPXA_jsF48Qs-"; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);