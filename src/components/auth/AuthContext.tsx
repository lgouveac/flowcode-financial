import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode 
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Helper to check if we're on an auth page
  const isAuthPage = () => {
    return location.pathname.startsWith('/auth/');
  };

  useEffect(() => {
    console.log('AuthProvider initialized');
    
    // Add a safety timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.log('Auth loading timeout reached. Forcing loading state to false.');
        setLoading(false);
      }
    }, 5000); // 5 seconds timeout

    // Configure the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, newSession) => {
        console.log('Auth state changed:', event, newSession?.user?.email);
        
        // Update session and user state
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_IN' && newSession) {
          // Use setTimeout to avoid potential deadlocks with Supabase client
          setTimeout(() => {
            // Fetch user profile
            supabase
              .from('profiles')
              .select('*')
              .eq('id', newSession.user.id)
              .single()
              .then(({ data, error }) => {
                if (error) {
                  console.error('Error fetching profile:', error);
                } else {
                  console.log('Profile fetched successfully:', data);
                  setProfile(data);
                }
                setLoading(false);
                
                // Only navigate if we're on an auth page
                if (isAuthPage()) {
                  navigate('/', { replace: true });
                }
              });
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setLoading(false);
          console.log('User signed out - explicit sign out');
          
          // Only navigate to login if we're not already on an auth page
          if (!isAuthPage()) {
            navigate('/auth/login');
          }
        } else if (event === 'USER_UPDATED') {
          console.log(`Auth event: ${event} - user info updated, no navigation needed`);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log(`Auth event: ${event} - token refreshed, no navigation needed`);
          setLoading(false);
        } else {
          // For other events, be more conservative about navigation
          console.log(`Auth event: ${event} - checking session validity`);
          
          if (!newSession) {
            // Only navigate if this looks like an actual logout/session expiry
            // Don't navigate on transient events during database operations
            console.log('No session found, but checking if this is a real logout...');
            
            // Check if we actually lost authentication by trying to get session again
            setTimeout(() => {
              supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
                if (!currentSession) {
                  console.log('Confirmed: No valid session, redirecting to login');
                  setSession(null);
                  setUser(null);
                  setProfile(null);
                  setLoading(false);
                  
                  // Only navigate to login if we're not on an auth page and not on public routes
                  if (!isAuthPage() && 
                      !location.pathname.startsWith('/register-client') && 
                      !location.pathname.startsWith('/register-employee') && 
                      !location.pathname.startsWith('/thank-you') &&
                      !location.pathname.startsWith('/contract-signing')) {
                    navigate('/auth/login');
                  }
                } else {
                  console.log('Session recovered, no navigation needed');
                  setLoading(false);
                }
              });
            }, 500); // Small delay to avoid navigating on transient events
          } else {
            console.log(`Auth event: ${event} - session exists, no navigation needed`);
            setLoading(false);
          }
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log('Existing session check:', initialSession ? 'Found session' : 'No session');
      
      if (!initialSession) {
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }
      
      // Check if token is still valid
      const expiresAt = initialSession.expires_at;
      const isExpired = expiresAt ? (expiresAt * 1000 < Date.now()) : false;
      
      if (isExpired) {
        console.log('Session has expired, signing out');
        supabase.auth.signOut().then(() => {
          setSession(null);
          setUser(null);
          setLoading(false);
          if (!isAuthPage()) {
            navigate('/auth/login');
          }
        });
        return;
      }
      
      // Valid session
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      
      if (initialSession?.user) {
        // Fetch user profile if already logged in
        supabase
          .from('profiles')
          .select('*')
          .eq('id', initialSession.user.id)
          .single()
          .then(({ data, error }) => {
            if (error) {
              console.error('Error fetching initial profile:', error);
            } else {
              console.log('Initial profile fetch successful:', data);
              setProfile(data);
            }
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    // Set up session expiry check
    const sessionCheckInterval = setInterval(() => {
      if (session) {
        const expiresAt = session.expires_at;
        if (expiresAt && expiresAt * 1000 < Date.now()) {
          console.log('Session has expired during runtime, attempting refresh');
          supabase.auth.refreshSession().then(({ data, error }) => {
            if (error || !data.session) {
              console.log('Failed to refresh session, signing out', error);
              supabase.auth.signOut().then(() => {
                setSession(null);
                setUser(null);
                setProfile(null);
                if (!isAuthPage()) {
                  navigate('/auth/login');
                }
              });
            } else {
              console.log('Session refreshed successfully');
              setSession(data.session);
              setUser(data.session.user);
            }
          });
        }
      }
    }, 60000); // Check every minute

    return () => {
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
      clearInterval(sessionCheckInterval);
    };
  }, [navigate, location.pathname]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in with:', email);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error.message);
        toast({
          title: 'Erro ao fazer login',
          description: error.message,
          variant: 'destructive',
        });
        setLoading(false);
        return { error };
      }

      console.log('Sign in successful:', data.user?.email);
      toast({
        title: 'Login realizado com sucesso',
        description: 'Bem-vindo de volta!',
      });
      
      // No need to manually navigate - the auth state change will trigger a redirect
      return { error: null };
    } catch (error: any) {
      console.error('Unexpected sign in error:', error.message);
      toast({
        title: 'Erro ao fazer login',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/email-confirmed`,
        },
      });

      if (error) {
        toast({
          title: 'Erro ao criar conta',
          description: error.message,
          variant: 'destructive',
        });
        setLoading(false);
        return { error };
      }

      toast({
        title: 'Conta criada com sucesso',
        description: 'Verifique seu e-mail para confirmar sua conta.',
      });
      
      setLoading(false);
      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao criar conta',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out user');
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error.message);
        toast({
          title: 'Erro ao fazer logout',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        console.log('Sign out successful');
        toast({
          title: 'Logout realizado',
          description: 'Você foi desconectado com sucesso.',
        });
      }
      
      setLoading(false);
      
      // Navigate only after state updates are complete
      if (!error) {
        navigate('/auth/login');
      }
    } catch (error: any) {
      console.error('Unexpected error during sign out:', error.message);
      toast({
        title: 'Erro ao fazer logout',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        toast({
          title: 'Erro ao enviar e-mail de recuperação',
          description: error.message,
          variant: 'destructive',
        });
        setLoading(false);
        return { error };
      }

      toast({
        title: 'E-mail enviado',
        description: 'Verifique seu e-mail para redefinir sua senha.',
      });
      
      setLoading(false);
      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar e-mail de recuperação',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return { error };
    }
  };

  const value = {
    session,
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
