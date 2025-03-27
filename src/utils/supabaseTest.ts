
import { supabase } from '@/integrations/supabase/client';

/**
 * Utility to test Supabase connection and authentication
 * Use this for debugging data fetch issues
 */
export const testSupabaseConnection = async () => {
  try {
    // Test authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Supabase auth error:', authError);
      return { success: false, error: authError, message: 'Authentication error' };
    }
    
    // If we're authenticated, test a simple query
    if (session) {
      // Try to fetch user profile
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (profileError) {
        console.error('Supabase profile query error:', profileError);
        return { 
          success: false, 
          error: profileError, 
          message: 'Error fetching profile data',
          isAuthenticated: true 
        };
      }
      
      // Test another table (e.g., clients)
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name')
        .limit(1);
        
      if (clientsError) {
        console.error('Supabase clients query error:', clientsError);
        return { 
          success: false, 
          error: clientsError, 
          message: 'Error fetching clients data',
          isAuthenticated: true,
          profile: data
        };
      }
      
      return { 
        success: true, 
        isAuthenticated: true, 
        profile: data,
        clients: clientsData 
      };
    }
    
    return { 
      success: false, 
      isAuthenticated: false, 
      message: 'Not authenticated - cannot fetch data' 
    };
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return { success: false, error, message: 'Connection test failed' };
  }
};
