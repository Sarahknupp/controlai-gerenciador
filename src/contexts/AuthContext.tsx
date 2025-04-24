import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError, Provider } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, options?: { data?: Record<string, any> }) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Maximum number of login attempts
const MAX_LOGIN_ATTEMPTS = 5;

// Time window for rate limiting (in milliseconds)
const RATE_LIMIT_WINDOW = 30 * 60 * 1000; // 30 minutes

// Object to track login attempts
const loginAttempts: Record<string, { count: number; timestamp: number }> = {};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const clearError = () => {
    setError(null);
  };

  const handleError = (error: AuthError | Error | null) => {
    if (!error) return;
    
    // Map Supabase error messages to more user-friendly ones
    const errorMessage = error.message;
    
    if (errorMessage.includes('Email not confirmed')) {
      setError('Por favor, confirme seu email antes de fazer login.');
    } else if (errorMessage.includes('Invalid login credentials')) {
      setError('Email ou senha incorretos. Por favor, verifique suas credenciais.');
    } else if (errorMessage.includes('Email already registered')) {
      setError('Este email já está cadastrado. Tente fazer login ou realizar a recuperação de senha.');
    } else if (errorMessage.includes('rate limit')) {
      setError('Muitas tentativas de login. Por favor, tente novamente mais tarde.');
    } else {
      setError(errorMessage);
    }
  };

  const checkRateLimit = (email: string): boolean => {
    const now = Date.now();
    const userAttempts = loginAttempts[email];

    if (!userAttempts) {
      loginAttempts[email] = { count: 1, timestamp: now };
      return false;
    }

    // Reset attempts if outside the time window
    if (now - userAttempts.timestamp > RATE_LIMIT_WINDOW) {
      loginAttempts[email] = { count: 1, timestamp: now };
      return false;
    }

    // Increment attempt count
    userAttempts.count += 1;
    loginAttempts[email] = userAttempts;

    // Check if user exceeded max attempts
    return userAttempts.count > MAX_LOGIN_ATTEMPTS;
  };

  const signIn = async (email: string, password: string) => {
    try {
      clearError();
      // Check rate limiting
      if (checkRateLimit(email)) {
        throw new Error('Muitas tentativas de login. Por favor, tente novamente mais tarde.');
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // Reset attempt count on successful login
      if (loginAttempts[email]) {
        delete loginAttempts[email];
      }
    } catch (err) {
      handleError(err as AuthError);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    try {
      clearError();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      if (error) throw error;
    } catch (err) {
      handleError(err as AuthError);
      throw err;
    }
  };

  const signUp = async (email: string, password: string, options?: { data?: Record<string, any> }) => {
    try {
      clearError();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: options?.data,
          emailRedirectTo: `${window.location.origin}/login`
        },
      });
      if (error) throw error;
    } catch (err) {
      handleError(err as AuthError);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      clearError();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      handleError(err as AuthError);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      clearError();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    } catch (err) {
      handleError(err as AuthError);
      throw err;
    }
  };

  const updatePassword = async (password: string) => {
    try {
      clearError();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    } catch (err) {
      handleError(err as AuthError);
      throw err;
    }
  };

  const resendConfirmationEmail = async (email: string) => {
    try {
      clearError();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) throw error;
    } catch (err) {
      handleError(err as AuthError);
      throw err;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        session, 
        loading, 
        signIn,
        signInWithGoogle, 
        signUp, 
        signOut, 
        resetPassword, 
        updatePassword, 
        resendConfirmationEmail,
        error,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}