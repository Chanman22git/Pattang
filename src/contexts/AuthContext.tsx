import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { ensureProfile } from "../lib/profile";

type AuthState = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  signInWithMagicLink: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Read whatever session is already in localStorage (or just landed from
    // a magic-link redirect). Then subscribe to future auth events.
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      // First time we have a session in this browser, make sure a profile
      // row exists. Idempotent — safe to fire on every SIGNED_IN.
      if (event === "SIGNED_IN" && s) {
        ensureProfile().catch((err) => {
          // Non-fatal — log and let the user proceed; the profile screen
          // will surface the issue when they get to it.
          console.warn("ensureProfile failed:", err);
        });
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      configured: supabaseConfigured,
      loading,
      session,
      user: session?.user ?? null,
      async signInWithMagicLink(email: string) {
        if (!supabase) {
          return {
            error:
              "Supabase isn't configured yet. Add VITE_SUPABASE_URL and " +
              "VITE_SUPABASE_ANON_KEY to .env.local.",
          };
        }
        // The redirect needs the full origin + the SPA's base path so the
        // magic-link bounce lands back at the running app (dev or Pages).
        const emailRedirectTo =
          window.location.origin + import.meta.env.BASE_URL;
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo },
        });
        return { error: error?.message };
      },
      async signOut() {
        if (!supabase) return;
        await supabase.auth.signOut();
      },
    }),
    [loading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
