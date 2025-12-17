"use client"

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiCall } from "@/lib/utils";

const highlights = [
  {
    title: "Unified access",
    body: "One sign-in for profile updates, queries, and shortlist tracking.",
  },
  {
    title: "Secure by design",
    body: "PII is encrypted at rest; revoke data with a single click.",
  },
  {
    title: "Fast visibility",
    body: "Updated profiles are instantly searchable in SQL + vector space.",
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data: any = await apiCall("/api/login", "POST", { email, password });

      if (data.error) {
        throw new Error(data.error);
      }

      localStorage.setItem("candidate_id", data.candidate_id);
      router.push("/applicant");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="no-scroll-app">
      <div className="viewport-container" style={{
        display: 'grid',
        placeItems: 'center',
        background: 'radial-gradient(circle at 50% 10%, rgba(25, 30, 60, 0.4) 0%, rgba(5, 8, 20, 1) 100%)'
      }}>

        <div style={{
          width: 'min(1100px, 100%)',
          display: 'grid',
          gridTemplateColumns: '1.1fr 0.9fr',
          gap: 40,
          padding: 24
        }}>

          {/* Left Column: Info */}
          <div className="glass-card" style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link href="/" style={{ textDecoration: 'none' }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 8,
                  background: 'linear-gradient(135deg, #9a6bff 0%, #4fd1c5 100%)',
                  display: 'grid', placeItems: 'center',
                  fontWeight: 900, color: '#050712'
                }}>L</div>
              </Link>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Linkdr</h2>
                <p className="muted">Secure sign-in</p>
              </div>
            </div>

            <div>
              <h1 className="hero-title" style={{ fontSize: '2.5rem', lineHeight: 1.1 }}>
                Jump back into your pipeline.
              </h1>
              <p className="hero-subtitle" style={{ marginTop: 16 }}>
                Continue tracking recruiter queries, shortlist decisions, and keep your profile synced across the stack.
              </p>
            </div>

            <div style={{ display: 'grid', gap: 12, marginTop: 'auto' }}>
              {highlights.map((item) => (
                <div key={item.title} style={{
                  padding: 16, borderRadius: 8,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{item.title}</div>
                  <div className="muted" style={{ fontSize: '0.9rem' }}>{item.body}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="glass-card" style={{ padding: 40 }}>
            <div style={{ marginBottom: 32 }}>
              <p className="eyebrow" style={{ color: '#9a6bff' }}>Welcome back</p>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Sign in to Linkdr</h2>
            </div>

            {error && (
              <div style={{
                padding: 12, borderRadius: 8,
                background: 'rgba(255, 50, 50, 0.1)', border: '1px solid rgba(255, 50, 50, 0.2)',
                color: '#ff6b6b', fontSize: '0.9rem', marginBottom: 24
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: 8, color: 'var(--muted)' }}>Email</label>
                <input
                  type="email"
                  className="textarea"
                  style={{ width: '100%', minHeight: 48, resize: 'none' }}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: 8, color: 'var(--muted)' }}>Password</label>
                <input
                  type="password"
                  className="textarea"
                  style={{ width: '100%', minHeight: 48, resize: 'none' }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn primary" disabled={loading} style={{ justifyContent: 'center', height: 48 }}>
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.9rem', color: 'var(--muted)' }}>
              Don’t have an account? <Link href="/register" style={{ color: '#9a6bff', fontWeight: 700 }}>Sign up</Link>
            </p>
          </div>

        </div>

        <div style={{ position: 'absolute', bottom: 24, right: 24, display: 'flex', gap: 24, fontSize: '0.85rem' }}>
          <Link href="/" className="muted">Landing</Link>
          <Link href="/privacy" className="muted">Privacy</Link>
        </div>
      </div>
    </div>
  );
}
