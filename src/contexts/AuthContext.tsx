import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Profile } from '@/lib/database.types';

export type UserRole = 'admin' | 'operador';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string; user?: User }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Busca o perfil do usuário no banco
  const fetchProfile = useCallback(async (supabaseUser: SupabaseUser): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        return null;
      }

      if (!data) {
        console.log('Perfil não encontrado para:', supabaseUser.id);
        return null;
      }

      const profile = data as Profile;

      return {
        id: profile.id,
        name: profile.name,
        email: supabaseUser.email || '',
        role: profile.role as UserRole,
      };
    } catch (err) {
      console.error('Exceção ao buscar perfil:', err);
      return null;
    }
  }, []);

  // Inicializa a sessão apenas uma vez
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
          const userProfile = await fetchProfile(session.user);
          if (mounted) {
            setUser(userProfile);
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar auth:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listener simplificado - só para logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && mounted) {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const login = async (email: string, password: string): Promise<{ error?: string; user?: User }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const errorMessages: Record<string, string> = {
          'Invalid login credentials': 'E-mail ou senha inválidos. Verifique suas credenciais.',
          'Email not confirmed': 'E-mail não confirmado. Verifique sua caixa de entrada.',
          'User not found': 'Usuário não encontrado. Verifique o e-mail digitado.',
          'Invalid email': 'E-mail inválido. Digite um e-mail válido.',
          'Password is too short': 'Senha muito curta. A senha deve ter pelo menos 6 caracteres.',
        };
        return { error: errorMessages[error.message] || `Erro: ${error.message}` };
      }

      if (data.user) {
        const userProfile = await fetchProfile(data.user);
        
        if (!userProfile) {
          await supabase.auth.signOut();
          return { error: 'Usuário não cadastrado no sistema. Entre em contato com o administrador.' };
        }
        
        setUser(userProfile);
        return { user: userProfile };
      }

      return { error: 'Erro inesperado no login.' };
    } catch (error: any) {
      if (error?.message?.includes('fetch') || error?.name === 'TypeError') {
        return { error: 'Erro de conexão. Verifique sua internet e tente novamente.' };
      }
      return { error: 'Erro ao fazer login. Tente novamente.' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      isAuthenticated: !!user,
    }}>
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
