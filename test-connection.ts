import { supabase } from './lib/supabase/client';

async function testConnection() {
  console.log('--- Supabase Client Initialization & Connection Test ---');

  // 1. Verify client initialization
  if (!supabase) {
    console.error('FAILED: Supabase client could not be initialized.');
    return;
  }
  console.log('✓ Supabase client initialized successfully from lib/supabase/client.ts');

  // 2. Test communication with the Supabase project
  console.log('Testing communication with Supabase backend...');
  try {
    // Perform a lightweight read query without modifying any tables.
    const { data, error, status } = await supabase
      .from('_connection_test_')
      .select('*')
      .limit(1);

    if (error) {
      // PGRST205 / 404 indicates the request was authenticated and processed
      // by the Supabase PostgREST service connected to the database.
      if (error.code === 'PGRST205' || status === 404) {
        console.log('✓ SUCCESS: Successfully connected and communicated with Supabase!');
        console.log(`  Response status: ${status}`);
        console.log(`  PostgREST code: ${error.code}`);
        console.log('\nNOTE: The "table not found" response is expected because no test table exists.');
        console.log('A missing table does NOT mean the connection failed; it confirms the client');
        console.log('successfully authenticated and reached the live database schema cache.');
      } else {
        console.log(`Response status: ${status} | Code: ${error.code}`);
        console.log(`Message: ${error.message}`);
      }
    } else {
      console.log(`✓ SUCCESS: Connected and query succeeded with status ${status}!`);
    }
  } catch (err: any) {
    console.error('FAILED: Unexpected network or connection error:', err?.message || err);
  }
}

testConnection();
