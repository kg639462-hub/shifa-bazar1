import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Supabase Auth listener
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        if (isSupabaseConfigured() && supabase) {
          // Get current Supabase session
          const { data: { session: currentSession }, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('Supabase getSession error:', error.message);
          }

          if (mounted) {
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            if (currentSession?.access_token) {
              localStorage.setItem('ash_shifa_token', currentSession.access_token);
            } else {
              localStorage.removeItem('ash_shifa_token');
            }
          }

          // Listen for Supabase auth state changes (SIGN_IN, SIGN_OUT, TOKEN_REFRESHED)
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, updatedSession) => {
              if (mounted) {
                setSession(updatedSession);
                setUser(updatedSession?.user ?? null);
                if (updatedSession?.access_token) {
                  localStorage.setItem('ash_shifa_token', updatedSession.access_token);
                } else {
                  localStorage.removeItem('ash_shifa_token');
                }
              }
            }
          );

          return () => {
            subscription.unsubscribe();
          };
        } else {
          // No active Supabase configured
          if (mounted) {
            setUser(null);
            setSession(null);
            localStorage.removeItem('ash_shifa_token');
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // Real Supabase Sign In function
  const signIn = async (email, password) => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured() || !supabase) {
        throw new Error('Supabase is not configured. Please check your .env credentials.');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        // Handle common Supabase auth errors with clear actionable guidance
        if (error.message.toLowerCase().includes('email not confirmed')) {
          throw new Error(
            'Your email address has not been confirmed yet. Please click the confirmation link sent to your inbox, or disable "Confirm email" in your Supabase Auth settings for instant login.'
          );
        }
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          throw new Error('Invalid email or password. Please verify your credentials or register a new account.');
        }
        throw error;
      }

      setUser(data.user);
      setSession(data.session);
      if (data.session?.access_token) {
        localStorage.setItem('ash_shifa_token', data.session.access_token);
      }
      return { success: true, user: data.user, session: data.session };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Real Supabase Sign Up / Patient Enrollment function
  const signUp = async ({ email, password, fullName, phone }) => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured() || !supabase) {
        throw new Error('Supabase is not configured. Please check your .env credentials.');
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
          },
        },
      });

      if (error) throw error;

      // In Supabase, if email confirmation is enabled, data.user is created but data.session is null!
      const requiresConfirmation = !data.session && data.user && !data.user.confirmed_at;

      if (data.session) {
        setUser(data.user);
        setSession(data.session);
        localStorage.setItem('ash_shifa_token', data.session.access_token);
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
        requiresConfirmation,
        message: requiresConfirmation
          ? `Patient account created in Supabase! A verification dispatch has been sent to ${email}. Please check your inbox to verify, or disable "Confirm email" in Supabase to login immediately.`
          : 'Patient registration completed successfully!',
      };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Real Supabase Sign Out function
  const signOut = async () => {
    try {
      if (isSupabaseConfigured() && supabase) {
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('Error signing out of Supabase:', error);
    } finally {
      setUser(null);
      setSession(null);
      localStorage.removeItem('ash_shifa_token');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
