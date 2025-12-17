"use client"
import { useState, FormEvent, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiCall } from "@/lib/utils";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [heroSeen, setHeroSeen] = useState(false);
  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);

  const passwordsMatch = password === confirmPassword;

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

  useEffect(() => {
    if (!heroSeen) return;

    const counters = Array.from(
      document.querySelectorAll<HTMLElement>(".kpi-value[data-target]")
    );
    const rafIds: number[] = [];

    const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);

    counters.forEach((el, idx) => {
      const target = Number(el.dataset.target ?? 0);
      const suffix = el.dataset.suffix ?? "";
      let current = 0;
      const duration = 2000 + idx * 200;
      const start = performance.now();

      const animate = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = easeOutQuad(progress);
        current = Math.min(target, Math.floor(eased * target));
        el.textContent = `${current}${suffix}`;
        if (progress < 1) {
          rafIds.push(requestAnimationFrame(animate));
        } else {
          el.textContent = `${target}${suffix}`;
        }
      };

      rafIds.push(requestAnimationFrame(animate));
    });

    return () => rafIds.forEach((id) => cancelAnimationFrame(id));
  }, [heroSeen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!passwordsMatch) return;

    setLoading(true);
    try {
      const data: any = await apiCall("/api/register", "POST", { name, email, password });

      if (data.error) throw new Error(data.error);

      localStorage.setItem("candidate_id", data.candidate_id);
      router.push("/applicant");
    } catch (err: any) {
      setError(err.message || "Registration failed");
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
            <Link className="nav-link" href="/login">Sign in</Link>
          </nav>
        </div>
      </header>

      {/* We use panel class to enforce snap alignment if wanted, but main page is single view here */}
      <main className="panel" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div ref={heroRef} className="container" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "center" }}>

          {/* Left Column: Hero Content */}
          <div className="hero-content" style={{ padding: 0 }}>
            <p className={`eyebrow reveal ${heroSeen ? "show reveal-delay-0" : ""}`}>Applicant Portal</p>
            <h1 className={`hero-title reveal ${heroSeen ? "show reveal-delay-1" : ""}`}>
              One profile. <br /> Infinite reach.
            </h1>
            <p className={`hero-subtitle reveal ${heroSeen ? "show reveal-delay-2" : ""}`}>
              Join a live network where your skills strictly define your visibility.
              No noise, just signal-based matching powered by vector search.
            </p>

            {/* KPIs */}
            <div className={`hero-kpis reveal ${heroSeen ? "show reveal-delay-3" : ""}`} style={{ marginTop: 32 }}>
              <div className="kpi-card">
                <span className="kpi-value" data-target="86" data-suffix="%">0%</span>
                <span className="kpi-label">Response rate</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-value" data-target="1200" data-suffix="+">0+</span>
                <span className="kpi-label">Active roles matched</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-value" data-target="15" data-suffix="d">0d</span>
                <span className="kpi-label">Avg to offer</span>
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className={`glass-card reveal ${heroSeen ? "show reveal-delay-2" : ""}`} style={{ padding: 40, width: '100%', maxWidth: 480, margin: '0 auto' }}>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Create account</h2>
              <p className="muted">Join thousands of engineers today.</p>
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

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="input-label" style={{ marginBottom: 8, display: 'block', fontSize: '0.9rem', color: 'var(--muted)' }}>Full Name</label>
                <input
                  type="text"
                  className="textarea"
                  style={{ width: '100%', minHeight: 48, resize: 'none' }}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

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
                <label className="input-label" style={{ marginBottom: 8, display: 'block', fontSize: '0.9rem', color: 'var(--muted)' }}>Password</label>
                <input
                  type="password"
                  className="textarea"
                  style={{ width: '100%', minHeight: 48, resize: 'none' }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="input-label" style={{ marginBottom: 8, display: 'block', fontSize: '0.9rem', color: 'var(--muted)' }}>Confirm Password</label>
                <input
                  type="password"
                  className="textarea"
                  style={{ width: '100%', minHeight: 48, resize: 'none', borderColor: !passwordsMatch && confirmPassword ? '#ff6b6b' : undefined }}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
                {!passwordsMatch && confirmPassword && (
                  <div style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: 4 }}>Passwords do not match</div>
                )}
              </div>

              <button type="submit" className="btn primary" disabled={loading || !passwordsMatch} style={{ justifyContent: 'center', height: 48, marginTop: 8 }}>
                {loading ? "Creating..." : "Create account"}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.9rem', color: 'var(--muted)' }}>
              Already have an account? <Link href="/login" style={{ color: '#9a6bff', fontWeight: 700 }}>Sign in</Link>
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
