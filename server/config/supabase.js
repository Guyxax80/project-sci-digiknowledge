// config/supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
console.log('[supabase] url =', process.env.SUPABASE_URL);
console.log('[supabase] has service key =', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

module.exports = supabase;