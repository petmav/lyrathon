"use client"
import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const highlights = [
  {
    title: "Deterministic filters",
    body: "Visa, location, salary, availability handled in SQL before LLM spend.",
  },
  {
    title: "Evidence-first shortlists",
    body: "Every match comes with rationale, risks, and next actions.",
  },
  {
    title: "Shareable outputs",
    body: "Export-ready cards to drop into hiring funnels or send to teams.",
  },
];

export default function RecruiterRegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!passwordsMatch) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      router.push("/recruiter_query_page");
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="no-scroll-app">
      <div className="viewport-container" style={{
        display: 'grid',
        placeItems: 'center',
        background: 'radial-gradient(circle at 10% 50%, rgba(30, 20, 60, 0.4) 0%, rgba(5, 8, 20, 1) 100%)'
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
              <div style={{
                width: 42, height: 42, borderRadius: 8,
                background: 'linear-gradient(135deg, #9a6bff 0%, #4fd1c5 100%)',
                display: 'grid', placeItems: 'center',
                fontWeight: 900, color: '#050712'
              }}>L</div>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Linkdr</h2>
                <p className="muted">Recruiter Console</p>
              </div>
            </div>

            <div>
              <h1 className="hero-title" style={{ fontSize: '2.5rem', lineHeight: 1.1 }}>
                Spin up a recruiter workspace in seconds.
              </h1>
              <p className="hero-subtitle" style={{ marginTop: 16 }}>
                One login to parse natural-language briefs, enforce hard filters, and deliver
                ranked, explainable shortlists you can share with hiring managers.
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
              <p className="eyebrow" style={{ color: '#9a6bff' }}>For recruiters</p>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Create a recruiter account</h2>
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
                <label className="input-label">Full name</label>
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
                <label className="input-label">Email</label>
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
                <label className="input-label">Password</label>
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
                <label className="input-label">Confirm password</label>
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
              Already registered? <Link href="/login" style={{ color: '#9a6bff', fontWeight: 700 }}>Sign in</Link>
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
