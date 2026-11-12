import { useEffect, useState, useRef, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Loader2,
  ShieldCheck,
  FileSpreadsheet,
  Sparkles,
  Building2,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  login as apiLogin,
  register as apiRegister,
  googleAuth as apiGoogleAuth,
  magicLinkSend as apiMagicLinkSend,
  magicLinkVerify as apiMagicLinkVerify,
  forgotPassword as apiForgotPassword,
} from "../lib/backendApi";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: string | number;
              locale?: string;
            }
          ) => void;
          prompt: (momentListener?: (notification: {
            isNotDisplayed: () => boolean;
            isSkippedMomentum: () => boolean;
            isDismissedMomentum: () => boolean;
            getNotDisplayedReason: () => string;
            getSkippedReason: () => string;
            getDismissedReason: () => string;
          }) => void) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "516446739282-7h005b1ardvnu2hhgmjnijd92rsp836n.apps.googleusercontent.com";

const LAST_AUTH_KEY = "parkgrid_last_auth_provider";

function getResponsiveButtonWidth(): number {
  if (typeof window === "undefined") return 384;
  const available = window.innerWidth - 32;
  return Math.min(384, Math.max(240, Math.floor(available)));
}

type AuthTab = "magic" | "password";
type PasswordMode = "signin" | "signup" | "reset";

const inputClass =
  "w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-electric-500/50 focus:outline-none focus:ring-1 focus:ring-electric-500/50";

export default function Login() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [authTab, setAuthTab] = useState<AuthTab>("magic");
  const [passwordMode, setPasswordMode] = useState<PasswordMode>(
    params.get("mode") === "signup" ? "signup" : "signin"
  );

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Google GSI state
  const [googleButtonRendered, setGoogleButtonRendered] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const gsiInitialized = useRef(false);
  const [googleButtonWidth, setGoogleButtonWidth] = useState<number>(getResponsiveButtonWidth);

  useEffect(() => {
    const handleResize = () => {
      const newWidth = getResponsiveButtonWidth();
      setGoogleButtonWidth((prev) => {
        if (Math.abs(prev - newWidth) > 8) {
          if (window.google?.accounts?.id && googleBtnRef.current) {
            googleBtnRef.current.innerHTML = "";
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: "filled_black",
              size: "large",
              width: newWidth,
              text: "continue_with",
              shape: "rectangular",
              logo_alignment: "left",
            });
          }
          return newWidth;
        }
        return prev;
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Remember last used auth provider (Google, Magic Link, Password)
  const [lastAuthProvider, setLastAuthProvider] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(LAST_AUTH_KEY);
      if (saved) return saved;
      if (localStorage.getItem("parkgrid_access_token")) return "google";
      return null;
    } catch {
      return null;
    }
  });

  // Feedback states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate("/app/data", { replace: true });
    }
  }, [auth.isAuthenticated, navigate]);

  function handleSuccessfulLogin(provider: "google" | "magic" | "password" = "google") {
    try {
      localStorage.setItem(LAST_AUTH_KEY, provider);
      setLastAuthProvider(provider);
    } catch {
      // Ignore
    }
    auth.login();
    navigate("/app/data", { replace: true });
  }

  // Google Identity Services (GSI) Script & Initialization
  useEffect(() => {
    const handleCredentialResponse = async (response: { credential: string }) => {
      if (!response.credential) return;
      setError("");
      setNotice("");
      setLoading(true);
      try {
        await apiGoogleAuth(response.credential);
        handleSuccessfulLogin("google");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    const initGoogleGSI = () => {
      if (!window.google?.accounts?.id || gsiInitialized.current) return;
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        gsiInitialized.current = true;

        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = "";
          const targetWidth = getResponsiveButtonWidth();
          setGoogleButtonWidth(targetWidth);
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: "filled_black",
            size: "large",
            width: targetWidth,
            text: "continue_with",
            shape: "rectangular",
            logo_alignment: "left",
          });
          setGoogleButtonRendered(true);
        }
      } catch (err) {
        console.warn("Google Identity Services initialization warning:", err);
      }
    };

    const scriptId = "google-gsi-client";
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initGoogleGSI();
      };
      script.onerror = () => {
        console.warn("Failed to load Google Identity Services SDK");
      };
      document.body.appendChild(script);
    } else if (window.google?.accounts?.id) {
      initGoogleGSI();
    }
  }, []);

  // Fallback Google Login Handler
  async function handleGoogleFallbackClick() {
    setError("");
    setNotice("");

    // If native Google button is already rendered and working, do nothing (native click handles it)
    if (googleButtonRendered) {
      return;
    }

    if (import.meta.env.DEV) {
      // Direct local dev sign in when origin is not yet allowed in Google Cloud Console
      await triggerLocalDevMock();
      return;
    }

    setError("Google Sign-In could not load. Please allow accounts.google.com or use Magic Link / Password.");
  }

  async function triggerLocalDevMock() {
    setLoading(true);
    try {
      const targetEmail = email.trim() || "operator@getparkgrid.com";
      await apiGoogleAuth(`mock-google-${targetEmail}`);
      handleSuccessfulLogin("google");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  // Magic Link OTP Handlers
  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your work email address.");
      return;
    }
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const res = await apiMagicLinkSend(email.trim());
      setOtpSent(true);
      if (res.code) {
        setNotice(`6-digit code generated: ${res.code} (auto-filled for dev convenience)`);
        setOtpCode(res.code);
      } else {
        setNotice("A 6-digit verification code has been sent to your email.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError("Please enter the 6-digit code received.");
      return;
    }
    setError("");
    setNotice("");
    setLoading(true);
    try {
      await apiMagicLinkVerify(email.trim(), otpCode.trim());
      handleSuccessfulLogin("magic");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  // Password Handlers
  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      if (passwordMode === "signin") {
        await apiLogin(email.trim(), password);
        handleSuccessfulLogin("password");
      } else if (passwordMode === "signup") {
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters long.");
        }
        await apiRegister({
          email: email.trim(),
          full_name: fullName.trim() || email.split("@")[0],
          org_name: company.trim() || "Default Organization",
          password,
        });
        handleSuccessfulLogin("password");
      } else {
        // Forgot password with strict anti-enumeration
        const res = await apiForgotPassword(email.trim());
        setNotice(res.message);
        setPasswordMode("signin");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-navy-900 lg:grid-cols-2">
      <div className="flex flex-col justify-center px-4 py-8 sm:px-12 sm:py-12 lg:px-16 min-h-screen">
        <Link to="/" className="mb-6 sm:mb-10 flex items-center">
          <img src="/parkgrid-logo.png" alt="ParkGrid" className="h-7 w-auto" />
        </Link>

        <div className="mx-auto w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {passwordMode === "signup" && authTab === "password"
              ? "Create your account"
              : passwordMode === "reset" && authTab === "password"
              ? "Reset your password"
              : "Sign in to ParkGrid"}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {passwordMode === "signup" && authTab === "password"
              ? "Upload your exports and get dashboards, audits and monthly-parker tracking in minutes."
              : passwordMode === "reset" && authTab === "password"
              ? "Enter your email and we will send password reset instructions."
              : "Enterprise intelligence and automated audit for commercial parking operators."}
          </p>

          {notice && (
            <div className="mt-5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-200">
              {notice}
            </div>
          )}
          {error && (
            <div className="mt-5 rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          {/* Option 1: Priority Google SSO Container & Button */}
          <div className="relative mt-6 flex w-full justify-center">
            <div
              className="relative w-full flex justify-center"
              style={{ maxWidth: `${googleButtonWidth}px` }}
            >
              {lastAuthProvider === "google" && (
                <span className="absolute -top-2.5 right-2 z-10 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-950 shadow-md border border-white/20 pointer-events-none select-none">
                  Last used
                </span>
              )}

              {/* Native GSI Render Container */}
              <div
                ref={googleBtnRef}
                className={`w-full flex justify-center overflow-hidden rounded-lg ${
                  googleButtonRendered ? "mb-0" : "hidden"
                }`}
              />

              {/* Custom Styled Swiss Button (shown when native button is not yet rendered or fallback) */}
              {!googleButtonRendered && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGoogleFallbackClick}
                  className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/[0.12] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.08] disabled:opacity-70"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="truncate">Continue with Google</span>
                </button>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="w-full border-t border-white/[0.08]" />
            <span className="absolute bg-navy-900 px-3 text-xs uppercase tracking-wider text-slate-500">
              or continue with
            </span>
          </div>

          {/* Segmented Auth Tabs (Anti-Slop: structured rounded-lg, no pill buttons) */}
          <div className="mb-6 grid grid-cols-2 rounded-lg border border-white/[0.08] bg-white/[0.02] p-1">
            <button
              type="button"
              onClick={() => {
                setAuthTab("magic");
                setError("");
              }}
              className={`flex items-center justify-center gap-1.5 rounded-md py-2 px-1 text-[11px] sm:text-xs font-medium transition-colors ${
                authTab === "magic"
                  ? "bg-white/[0.10] text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <KeyRound className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Magic Link / OTP</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab("password");
                setError("");
              }}
              className={`flex items-center justify-center gap-1.5 rounded-md py-2 px-1 text-[11px] sm:text-xs font-medium transition-colors ${
                authTab === "password"
                  ? "bg-white/[0.10] text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Lock className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Email & Password</span>
            </button>
          </div>

          {/* Tab 1: Magic Link OTP View */}
          {authTab === "magic" && (
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label htmlFor="magicEmail" className="mb-1.5 block text-xs font-medium text-slate-400">
                      Work email
                    </label>
                    <input
                      id="magicEmail"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                      autoComplete="email"
                      placeholder="operator@company.com"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-electric-200 px-4 py-2.5 text-sm font-semibold text-ink shadow-glow transition-colors hover:bg-electric-100 disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Send 6-digit code
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="otpCode" className="block text-xs font-medium text-slate-400">
                        6-Digit verification code
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setError("");
                        }}
                        className="text-xs text-electric-400 hover:text-electric-300"
                      >
                        Change email
                      </button>
                    </div>
                    <input
                      id="otpCode"
                      type="text"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      className={`${inputClass} tracking-widest text-center text-lg font-mono`}
                      placeholder="123456"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-electric-200 px-4 py-2.5 text-sm font-semibold text-ink shadow-glow transition-colors hover:bg-electric-100 disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Verify and enter
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </button>
                  <p className="text-center text-xs text-slate-500">
                    Did not receive code?{" "}
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-electric-400 hover:text-electric-300"
                    >
                      Resend
                    </button>
                  </p>
                </form>
              )}
            </div>
          )}

          {/* Tab 2: Classic Password View */}
          {authTab === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {passwordMode === "signup" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="fullName" className="mb-1.5 block text-xs font-medium text-slate-400">
                      Your name
                    </label>
                    <input
                      id="fullName"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={inputClass}
                      autoComplete="name"
                      placeholder="Sarah Connor"
                    />
                  </div>
                  <div>
                    <label htmlFor="company" className="mb-1.5 block text-xs font-medium text-slate-400">
                      Company
                    </label>
                    <input
                      id="company"
                      required
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className={inputClass}
                      autoComplete="organization"
                      placeholder="Apex Parking LLC"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-400">
                  Work email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  autoComplete="email"
                  placeholder="operator@company.com"
                />
              </div>

              {passwordMode !== "reset" && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="password" className="block text-xs font-medium text-slate-400">
                      Password
                    </label>
                    {passwordMode === "signin" && (
                      <button
                        type="button"
                        onClick={() => {
                          setPasswordMode("reset");
                          setError("");
                        }}
                        className="text-xs font-medium text-electric-400 hover:text-electric-300"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputClass} pr-10`}
                      autoComplete={passwordMode === "signup" ? "new-password" : "current-password"}
                      placeholder={passwordMode === "signup" ? "At least 8 characters" : ""}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-electric-200 px-4 py-2.5 text-sm font-semibold text-ink shadow-glow transition-colors hover:bg-electric-100 disabled:opacity-70"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {passwordMode === "signin"
                  ? "Sign in"
                  : passwordMode === "signup"
                  ? "Create account"
                  : "Send reset link"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>

              <div className="pt-2 text-center text-sm text-slate-400">
                {passwordMode === "signin" ? (
                  <>
                    New to ParkGrid?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setPasswordMode("signup");
                        setError("");
                      }}
                      className="font-medium text-electric-400 hover:text-electric-300"
                    >
                      Create an account
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setPasswordMode("signin");
                        setError("");
                      }}
                      className="font-medium text-electric-400 hover:text-electric-300"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-navy-950 lg:block">
        <div className="absolute inset-0 bg-grid-glow" />
        <div className="relative flex h-full flex-col justify-center px-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-electric-400">
            Intelligence for every parking asset
          </p>
          <h2 className="mt-3 max-w-md text-3xl font-semibold leading-tight tracking-tight text-white">
            Your exports in. Dashboards, audits and monthly billing out.
          </h2>
          <div className="mt-10 space-y-3">
            {[
              {
                icon: FileSpreadsheet,
                label: "Works with what you have",
                value: "CSV, Excel or PDF from any gate, valet or LPR system",
              },
              {
                icon: ShieldCheck,
                label: "Audit on every upload",
                value: "Missing tickets, cash variance, comps, outages",
              },
              {
                icon: Building2,
                label: "Monthly parkers",
                value: "Roster, late payments and renewals, flagged by AI",
              },
              {
                icon: Sparkles,
                label: "Ask ParkGrid",
                value: "Plain-English answers from your own data",
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center gap-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-electric-500/10">
                  <row.icon className="h-4 w-4 text-electric-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{row.label}</p>
                  <p className="text-xs text-slate-500">{row.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
