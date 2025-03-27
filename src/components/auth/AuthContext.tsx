
import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode 
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

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
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && session) {
          // Use setTimeout to avoid potential deadlocks with Supabase client
          setTimeout(async () => {
            try {
              // Fetch user profile
              const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (error) {
                console.error('Error fetching profile:', error);
              } else {
                console.log('Profile fetched successfully:', data);
                setProfile(data);
              }
            } catch (error) {
              console.error('Error processing profile:', error);
            } finally {
              setLoading(false);
            }
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setLoading(false);
          console.log('User signed out');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Existing session check:', session ? 'Found session' : 'No session');
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Fetch user profile if already logged in
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }) => {
            if (error) {
              console.error('Error fetching initial profile:', error);
            } else {
              console.log('Initial profile fetch successful:', data);
              setProfile(data);
            }
            setLoading(false);
          })
          .catch(error => {
            console.error('Unexpected error during profile fetch:', error);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    }).catch(error => {
      console.error('Error checking session:', error);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

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
        navigate('/auth/login');
        toast({
          title: 'Logout realizado',
          description: 'Você foi desconectado com sucesso.',
        });
      }
      
      setLoading(false);
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
