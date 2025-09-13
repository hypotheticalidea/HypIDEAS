import { supabase } from '../supabase/client';

export const debugAuthIssues = async () => {
  console.log('🔍 Debugging Supabase Auth Issues...');
  
  try {
    // Test 1: Check Supabase connection
    const { data: testData, error: testError } = await supabase
      .from('interest_categories')
      .select('name')
      .limit(1);
    
    if (testError) {
      console.error('❌ Supabase connection failed:', testError);
    } else {
      console.log('✅ Supabase connection works');
    }

    // Test 2: Check users table access
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Users table access failed:', usersError);
    } else {
      console.log('✅ Users table access works');
    }

    // Test 3: Check auth status
    const { data: { session } } = await supabase.auth.getSession();
    console.log('🔐 Current session:', session ? 'Logged in' : 'Not logged in');

    // Test 4: Check RLS policies
    console.log('📋 Run this SQL query in Supabase to check triggers:');
    console.log(`
      SELECT 
        schemaname, 
        tablename, 
        triggername, 
        triggerdef 
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE schemaname = 'auth' AND tablename = 'users';
    `);

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
};
