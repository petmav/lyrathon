"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function PrivacyPage() {
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
                        <Link className="nav-link" href="/">Back to Home</Link>
                    </nav>
                </div>
            </header>

            <main className="panel" style={{ alignItems: 'flex-start', paddingTop: 120, paddingBottom: 100 }}>
                <div id="top-sentinel" style={{ position: 'absolute', top: 0, height: 10, width: '100%', pointerEvents: 'none' }} />
                <div className="container" style={{ maxWidth: 800 }}>
                    <div className="glass-card reveal show reveal-delay-0" style={{ padding: 48 }}>
                        <h1 className="hero-title" style={{ fontSize: '2.5rem', marginBottom: 8 }}>Privacy Policy</h1>
                        <p className="muted">Last updated: December 17, 2025</p>

                        <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <section>
                                <h3 style={{ fontSize: '1.4rem', marginBottom: 16 }}>1. Introduction</h3>
                                <p className="muted">
                                    Welcome to Linkdr. We respect your privacy and are committed to protecting your personal data.
                                    This privacy policy will inform you as to how we look after your personal data when you visit our
                                    website (regardless of where you visit it from) and tell you about your privacy rights and how
                                    the law protects you.
                                </p>
                            </section>

                            <section>
                                <h3 style={{ fontSize: '1.4rem', marginBottom: 16 }}>2. Data We Collect</h3>
                                <p className="muted">
                                    We may collect, use, store and transfer different kinds of personal data about you which we have
                                    grouped together follows:
                                </p>
                                <ul className="list" style={{ marginTop: 12, paddingLeft: 24 }}>
                                    <li className="muted">Identity Data includes first name, last name, username or similar identifier.</li>
                                    <li className="muted">Contact Data includes email address and telephone numbers.</li>
                                    <li className="muted">Technical Data includes internet protocol (IP) address, your login data, browser type and version.</li>
                                    <li className="muted">Profile Data includes your username and password, purchases or orders made by you.</li>
                                </ul>
                            </section>

                            <section>
                                <h3 style={{ fontSize: '1.4rem', marginBottom: 16 }}>3. How We Use Your Data</h3>
                                <p className="muted">
                                    We will only use your personal data when the law allows us to. Most commonly, we will use your
                                    personal data in the following circumstances:
                                </p>
                                <ul className="list" style={{ marginTop: 12, paddingLeft: 24 }}>
                                    <li className="muted">Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                                    <li className="muted">Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                                    <li className="muted">Where we need to comply with a legal or regulatory obligation.</li>
                                </ul>
                            </section>

                            <section>
                                <h3 style={{ fontSize: '1.4rem', marginBottom: 16 }}>4. Data Security</h3>
                                <p className="muted">
                                    We have put in place appropriate security measures to prevent your personal data from being accidently
                                    lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access
                                    to your personal data to those employees, agents, contractors and other third parties who have a
                                    business need to know.
                                </p>
                            </section>

                            <section>
                                <h3 style={{ fontSize: '1.4rem', marginBottom: 16 }}>5. Contact Us</h3>
                                <p className="muted">
                                    If you have any questions about this privacy policy or our privacy practices, please contact us at:
                                    <a href="mailto:privacy@linkdr.com" style={{ color: 'var(--accent-2)', textDecoration: 'none', marginLeft: 6 }}>privacy@linkdr.com</a>.
                                </p>
                            </section>

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
                        <Link className="nav-link" href="/contact">Contact</Link>
                    </div>
                </div>
            </footer>
        </div >
    );
}
