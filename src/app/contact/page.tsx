"use client";

import Link from "next/link";
import { useState, FormEvent, useEffect } from "react";

export default function ContactPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [showHeader, setShowHeader] = useState(true);
    const [showFooter, setShowFooter] = useState(false);

    useEffect(() => {
        const topSentinel = document.getElementById("top-sentinel");
        const bottomSentinel = document.getElementById("bottom-sentinel");

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.target.id === "top-sentinel") {
                        setShowHeader(entry.isIntersecting);
                    }
                    if (entry.target.id === "bottom-sentinel") {
                        setShowFooter(entry.isIntersecting);
                    }
                });
            },
            { threshold: 0.1 }
        );

        if (topSentinel) observer.observe(topSentinel);
        if (bottomSentinel) observer.observe(bottomSentinel);

        return () => observer.disconnect();
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API
        await new Promise(r => setTimeout(r, 1500));
        setLoading(false);
        setSent(true);
    };

    return (
        <div className="page">
            <header className={`site-header ${showHeader ? "" : "hidden"}`}>
                <div className="container header-row">
                    <div className="brand">
                        <Link href="/" aria-label="Linkdr homepage">
                            <span className="brand-mark">L</span>
                            <span className="brand-text">Linkdr</span>
                        </Link>
                    </div>
                    <nav className="nav">
                        <Link className="nav-link" href="/enterprise">Enterprise</Link>
                        <Link className="nav-link" href="/login">Sign in</Link>
                    </nav>
                </div>
            </header>

            <main className="panel" style={{ alignItems: 'flex-start', justifyContent: 'center', paddingTop: 120, paddingBottom: 100 }}>
                <div id="top-sentinel" style={{ position: 'absolute', top: 0, height: 10, width: '100%', pointerEvents: 'none' }} />
                <div className="container" style={{ maxWidth: 600 }}>
                    <div className="glass-card reveal show reveal-delay-0" style={{ padding: 40 }}>
                        <div style={{ textAlign: 'center', marginBottom: 32 }}>
                            <p className="eyebrow" style={{ color: '#9a6bff' }}>Get in touch</p>
                            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '16px 0' }}>We&apos;d love to hear from you.</h1>
                            <p className="muted">
                                Whether you&apos;re an enterprise looking for a custom plan or a candidate with a question, drop us a line.
                            </p>
                        </div>

                        {sent ? (
                            <div style={{ textAlign: 'center', padding: 40, background: 'rgba(79, 209, 197, 0.1)', borderRadius: 12, border: '1px solid rgba(79, 209, 197, 0.2)' }}>
                                <div style={{ fontSize: '2rem', marginBottom: 16 }}>✅</div>
                                <h3 style={{ margin: 0 }}>Message sent</h3>
                                <p className="muted" style={{ margin: '8px 0 0' }}>We&apos;ll get back to you shortly.</p>
                                <button onClick={() => setSent(false)} className="btn text" style={{ marginTop: 16 }}>Send another</button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label className="input-label" style={{ marginBottom: 8, display: 'block', fontSize: '0.9rem', color: 'var(--muted)' }}>Name</label>
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
                                    <label className="input-label" style={{ marginBottom: 8, display: 'block', fontSize: '0.9rem', color: 'var(--muted)' }}>Message</label>
                                    <textarea
                                        className="textarea"
                                        style={{ width: '100%', minHeight: 120 }}
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        required
                                    />
                                </div>

                                <button type="submit" className="btn primary" disabled={loading} style={{ justifyContent: 'center', height: 48, marginTop: 8 }}>
                                    {loading ? "Sending..." : "Send message"}
                                </button>
                            </form>
                        )}

                        <div style={{ marginTop: 40, borderTop: '1px solid var(--border)', paddingTop: 24, display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div className="muted" style={{ fontSize: '0.85rem' }}>Sales</div>
                                <a href="mailto:enterprise@linkdr.com" style={{ fontWeight: 600 }}>enterprise@linkdr.com</a>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div className="muted" style={{ fontSize: '0.85rem' }}>Support</div>
                                <a href="mailto:support@linkdr.com" style={{ fontWeight: 600 }}>support@linkdr.com</a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>



            <div id="bottom-sentinel" style={{ position: 'absolute', bottom: 0, height: 10, width: '100%', pointerEvents: 'none' }} />

            <footer className={`footer ${showFooter ? "visible" : ""}`}>
                <div className="container footer-row">
                    <div className="footer-brand">
                        <span className="brand-text">Linkdr</span>
                    </div>
                    <div className="footer-links">
                        <Link className="nav-link" href="/">Home</Link>
                        <Link className="nav-link" href="/privacy">Privacy & Terms</Link>
                    </div>
                </div>
            </footer>
        </div >
    );
}
