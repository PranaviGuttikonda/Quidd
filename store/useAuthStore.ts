import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { UserProfile } from '@/types';
import { supabase, fetchProfile } from '@/lib/supabase';

interface AuthState {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  loadProfile: (userId: string) => Promise<void>;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  loading: false,

  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),

  loadProfile: async (userId) => {
    set({ loading: true });
    const profile = await fetchProfile(userId);
    set({ profile, loading: false });
  },

  reset: () => set({ session: null, profile: null, loading: false }),
}));

// Bootstrap — call once in root _layout.tsx
export const bootstrapAuth = () => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    useAuthStore.getState().setSession(session);
    if (session?.user.id) {
      useAuthStore.getState().loadProfile(session.user.id);
    }
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.getState().setSession(session);
    if (session?.user.id) {
      useAuthStore.getState().loadProfile(session.user.id);
    } else {
      useAuthStore.getState().reset();
    }
  });
};