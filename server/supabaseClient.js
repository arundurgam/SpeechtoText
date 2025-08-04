require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log("Supabase URL:", process.env.SUPABASE_URL);
console.log("Supabase Key:", process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 5)); // partial exposure

module.exports = supabase;
