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

/**
 * Pilot toggle. While true (the current default), any visitor who has no
 * session is silently signed in as a new anonymous Supabase user — no
 * login screen, RLS still enforced, magic-link flow still wired at
 * /signin. Set to false to require explicit sign-in again.
 */
const PILOT_AUTO_ANON = true;

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
    // a magic-link redirect). If nothing is there, we auto-sign-in
    // anonymously for the pilot — see PILOT_AUTO_ANON below.
    let active = true;
    (async () => {
      const { data } = await supabase!.auth.getSession();
      if (!active) return;

      if (data.session) {
        setSession(data.session);
        setLoading(false);
        return;
      }

      if (PILOT_AUTO_ANON) {
        // Pilot bypass: skip the magic-link screen, drop a fresh anonymous
        // user. RLS keeps doing the user-scoping; the magic-link flow is
        // still wired (visit /signin manually) for whenever we flip this
        // off. Requires Supabase → Authentication → Providers → Anonymous
        // Sign-Ins to be enabled in the dashboard.
        const { data: anon, error } = await supabase!.auth.signInAnonymously();
        if (!active) return;
        if (error) {
          // Most common reason: anon sign-ins aren't enabled. We let
          // ProtectedRoute fall through to /signin so the user still has a
          // way in via magic link, and surface a helpful note there.
          console.warn(
            "Pilot anonymous sign-in failed:",
            error.message,
            "— enable Anonymous Sign-Ins in Supabase to skip the login screen."
          );
        } else if (anon.session) {
          setSession(anon.session);
        }
      }

      setLoading(false);
    })();

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
