import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://axaieyqtnvkbpioxawrt.supabase.co";
const supabasePublishableKey = "sb_publishable_ZmMdoUojaaGF2mJdove4Yg_aC-kIHpt";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
