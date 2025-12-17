"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RecruiterLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [heroSeen, setHeroSeen] = useState(false);
  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setHeroSeen(true);
        });
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login/recruiter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Login failed");
      }

      localStorage.setItem("recruiter_id", data.recruiter_id);
      router.push("/recruiter_query_page");
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="site-header">
        <div className="container header-row">
          <div className="brand">
            <Link href="/" aria-label="Linkdr homepage">
              <span className="brand-mark">L</span>
              <span className="brand-text">Linkdr</span>
            </Link>
          </div>
          <nav className="nav">
            <Link className="nav-link" href="/register/recruiter">Sign up</Link>
          </nav>
        </div>
      </header>

      <main className="panel" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div ref={heroRef} className="container" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "center" }}>

          {/* Left Column: Hero Content */}
          <div className="hero-content" style={{ padding: 0 }}>
            <p className={`eyebrow reveal ${heroSeen ? "show reveal-delay-0" : ""}`}>Recruiter Console</p>
            <h1 className={`hero-title reveal ${heroSeen ? "show reveal-delay-1" : ""}`}>
              Find your next <br /> top performer.
            </h1>
            <p className={`hero-subtitle reveal ${heroSeen ? "show reveal-delay-2" : ""}`}>
              Access our advanced candidate search, AI-driven shortlisting, and seamless hiring tools to build your dream team.
            </p>

            <div className={`reveal ${heroSeen ? "show reveal-delay-3" : ""}`} style={{ marginTop: 40, display: 'flex', gap: 16 }}>
              {['AI Matching', 'Verified Talent', 'Fast Hiring'].map(tag => (
                <span key={tag} style={{
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 999,
                  fontSize: '0.9rem',
                  color: 'var(--muted)',
                  fontWeight: 500
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right Column: Form */}
          <div className={`glass-card reveal ${heroSeen ? "show reveal-delay-2" : ""}`} style={{ padding: 40, width: '100%', maxWidth: 480, margin: '0 auto' }}>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Sign in to Linkdr</h2>
              <p className="muted">Enter your recruiter credentials.</p>
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
                <label className="input-label" style={{ marginBottom: 8, display: 'block', fontSize: '0.9rem', color: 'var(--muted)' }}>Email</label>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label className="input-label" style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>Password</label>
                  <Link href="#" style={{ fontSize: '0.85rem', color: 'var(--accent-2)', textDecoration: 'none' }}>Forgot password?</Link>
                </div>
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
              New here? <Link href="/register/recruiter" style={{ color: '#9a6bff', fontWeight: 700 }}>Apply for access</Link>
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
