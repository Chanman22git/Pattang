import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function SignInPage() {
  const { configured, user, loading, signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return null;
  if (user) return <Navigate to="/cases" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await signInWithMagicLink(email.trim());
    setSubmitting(false);
    if (res.error) setError(res.error);
    else setSent(true);
  }

  return (
    <div className="min-h-full flex items-center justify-center px-6 py-16 bg-paper">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="font-serif text-4xl font-semibold text-accent">
            Pattang
          </div>
          <div className="mt-2 text-sm text-ink-muted">Advocate workspace</div>
        </div>

        <div className="bg-white border border-black/10 rounded-lg p-8 shadow-sm">
          {!configured ? (
            <ConfigMissing />
          ) : sent ? (
            <CheckEmail email={email} />
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-1.5"
                >
                  Sign in with email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@chambers.in"
                  className="w-full px-3 py-2 border border-black/15 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                />
                <p className="mt-2 text-xs text-ink-muted leading-relaxed">
                  We&rsquo;ll send a one-time sign-in link. No password to
                  remember.
                </p>
              </div>

              {error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !email}
                className="w-full px-4 py-2 rounded-md text-sm font-medium bg-accent text-white disabled:bg-black/10 disabled:text-ink-muted disabled:cursor-not-allowed"
              >
                {submitting ? "Sending..." : "Send sign-in link"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-ink-muted leading-relaxed">
          Pattang v0 is a single-user workspace.
          <br />
          Your data stays under your account; nothing is shared.
        </p>
      </div>
    </div>
  );
}

function ConfigMissing() {
  return (
    <div className="space-y-3">
      <div className="font-serif text-lg font-semibold">
        Supabase isn&rsquo;t configured
      </div>
      <p className="text-sm text-ink-muted leading-relaxed">
        Pattang stores cases, templates and documents in Supabase. To sign in,
        spin up a project, apply{" "}
        <code className="px-1 py-0.5 bg-black/5 rounded text-xs">
          supabase/migrations/0001_init.sql
        </code>
        , then set:
      </p>
      <pre className="text-xs bg-black/5 rounded p-3 overflow-x-auto">
{`VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...`}
      </pre>
      <p className="text-xs text-ink-muted">
        in <code className="px-1 bg-black/5 rounded">.env.local</code> for dev,
        or as repo variables for the GitHub Pages build.
      </p>
    </div>
  );
}

function CheckEmail({ email }: { email: string }) {
  return (
    <div className="text-center space-y-3">
      <div className="font-serif text-lg font-semibold">Check your inbox</div>
      <p className="text-sm text-ink-muted leading-relaxed">
        We sent a sign-in link to{" "}
        <span className="font-medium text-ink">{email}</span>. Click the link
        from the same browser and you&rsquo;ll land back here, signed in.
      </p>
      <p className="text-xs text-ink-muted">
        Link expires in 1 hour. Didn&rsquo;t arrive? Check spam, then resend.
      </p>
    </div>
  );
}
