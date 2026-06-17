import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mrendrlypujkuxgmdtzs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_A6oVVhEFjNMjKxP4797K5g_Gqa0BRrA";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testRecovery() {
  console.log("Attempting to send recovery email...");
  
  const testEmail = "rajacofficial369@gmail.com";

  const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail);

  if (error) {
    console.error("❌ Supabase Auth Error:");
    console.error(error);
  } else {
    console.log("✅ Success! Recovery email triggered. Response:");
    console.log(data);
  }
}

testRecovery();
