import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, hasBackend } from "../lib/supabase";

interface AuthState {
  /** "supabase" = real accounts; "demo" = no backend configured, one shared demo login. */
  mode: "supabase" | "demo";
  ready: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  email: string;
  userName: string;
  userRole: string;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { email: string; password: string; fullName: string; company: string }) => Promise<{ needsConfirmation: boolean }>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  /** true after arriving from a password-reset email */
  recovering: boolean;
  setNewPassword: (password: string) => Promise<void>;
  /** demo mode only */
  login: () => void;
}

const AuthContext = createContext<AuthState | null>(null);
const DEMO_KEY = "parkgrid-demo-authenticated";

function friendly(message: string): string {
  if (/invalid login credentials/i.test(message)) return "That email and password don't match an account.";
  if (/email not confirmed/i.test(message)) return "Please confirm your email first. Check your inbox for the link.";
  if (/already registered/i.test(message)) return "There's already an account with that email. Sign in instead.";
  if (/password should be at least/i.test(message)) return "Use a password with at least 8 characters.";
  if (/rate limit/i.test(message)) return "Too many attempts. Wait a minute and try again.";
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!hasBackend);
  const [recovering, setRecovering] = useState(false);
  const [demoAuthed, setDemoAuthed] = useState(() => {
    try {
      return sessionStorage.getItem(DEMO_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const meta = (session?.user.user_metadata ?? {}) as { full_name?: string; company?: string };

  const value: AuthState = hasBackend
    ? {
        mode: "supabase",
        ready,
        isAuthenticated: !!session,
        userId: session?.user.id ?? null,
        email: session?.user.email ?? "",
        userName: meta.full_name || session?.user.email?.split("@")[0] || "",
        userRole: meta.company || "Operator",
        signIn: async (email, password) => {
          const { error } = await supabase!.auth.signInWithPassword({ email: email.trim(), password });
          if (error) throw new Error(friendly(error.message));
        },
        signUp: async ({ email, password, fullName, company }) => {
          const { data, error } = await supabase!.auth.signUp({
            email: email.trim(),
            password,
            options: { data: { full_name: fullName.trim(), company: company.trim() }, emailRedirectTo: window.location.origin },
          });
          if (error) throw new Error(friendly(error.message));
          return { needsConfirmation: !data.session };
        },
        resetPassword: async (email) => {
          const { error } = await supabase!.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
          if (error) throw new Error(friendly(error.message));
        },
        logout: async () => {
          await supabase!.auth.signOut();
        },
        recovering,
        setNewPassword: async (password) => {
          const { error } = await supabase!.auth.updateUser({ password });
          if (error) throw new Error(friendly(error.message));
          setRecovering(false);
        },
        login: () => {},
      }
    : {
        mode: "demo",
        ready: true,
        isAuthenticated: demoAuthed,
        userId: demoAuthed ? "demo" : null,
        email: "demo@getparkgrid.com",
        userName: "Demo Operator",
        userRole: "Demo account",
        signIn: async () => {
          sessionStorage.setItem(DEMO_KEY, "true");
          setDemoAuthed(true);
        },
        signUp: async () => {
          sessionStorage.setItem(DEMO_KEY, "true");
          setDemoAuthed(true);
          return { needsConfirmation: false };
        },
        resetPassword: async () => {},
        logout: async () => {
          sessionStorage.removeItem(DEMO_KEY);
          setDemoAuthed(false);
        },
        recovering: false,
        setNewPassword: async () => {},
        login: () => {
          sessionStorage.setItem(DEMO_KEY, "true");
          setDemoAuthed(true);
        },
      };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
