import React, { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { KohlDashboard } from './components/kohl/KohlDashboard';
import { LoginForm } from './components/auth/LoginForm';
import { supabase } from './lib/supabase';
import { buildTrackingFromUrl, saveTrackingToSession, mergeTracking, getTrackingFromSession } from './services/leadTrackingService';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

function App() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const incoming = buildTrackingFromUrl(window.location.search, document.referrer || undefined);
    if (incoming) {
      const existing = getTrackingFromSession();
      const merged = mergeTracking(existing ?? undefined, incoming);
      if (merged) saveTrackingToSession(merged);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthState(data.session ? 'authenticated' : 'unauthenticated');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      setAuthState(session ? 'authenticated' : 'unauthenticated');
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setLoginLoading(true);
    setLoginError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoginLoading(false);
    if (error) {
      setLoginError('Email ou senha incorretos');
      throw error;
    }
  };

  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return (
      <LoginForm
        onLogin={handleLogin}
        isLoading={loginLoading}
        error={loginError}
      />
    );
  }

  return <KohlDashboard />;
}

export default App;
