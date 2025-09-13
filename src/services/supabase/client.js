import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../../constants/config';

export const supabase = createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey
);

// Test connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('interest_categories')
      .select('name')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
};
