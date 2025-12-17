"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Feature = {
    title: string;
    description: string;
    icon: string;
};

const features: Feature[] = [
    {
        title: "ATS Integration",
        description: "Two-way sync with Greenhouse, Ashby, Lever, and Workday. Keep your pipeline distinct but your data unified.",
        icon: "🔄",
    },
    {
        title: "SSO & Security",
        description: "SAML 2.0 support (Okta, OneLogin). SOC2 Type II ready infrastructure with role-based access control.",
        icon: "🔒",
    },
    {
        title: "Custom LLM Models",
        description: "Fine-tune ranking logic on your organization's historical hiring data for maximum relevance.",
        icon: "🧠",
    },
];

const SECTION_ORDER = ["hero", "features"] as const;

export default function EnterprisePage() {
    const [activeSection, setActiveSection] = useState("hero");
    const [heroSeen, setHeroSeen] = useState(false);
    const [featuresSeen, setFeaturesSeen] = useState(false);
    const mainRef = useRef<HTMLElement | null>(null);
    const sectionOrder = useMemo(() => SECTION_ORDER, []);
    const showHeader = activeSection === "hero";
    const showFooter = activeSection === "features";

    useEffect(() => {
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
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            { root: mainRef.current, threshold: 0.6 }
        );

        sectionOrder.forEach((id) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [sectionOrder]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    if (entry.target.id === "hero") setHeroSeen(true);
                    if (entry.target.id === "features") setFeaturesSeen(true);
                });
            },
            { threshold: 0.35 }
        );

        ["hero", "features"].forEach((id) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

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
                    <nav className="nav" aria-label="Primary">
                        <Link className="nav-link" href="#hero">
                            Enterprise
                        </Link>
                        <Link className="nav-link" href="#features">
                            Platform
                        </Link>
                        <Link className="nav-link" href="/contact">
                            Contact Sales
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="page-main" ref={mainRef}>
                <section id="hero" className="panel hero">
                    <div className="container hero-content">
                        <p className={`eyebrow reveal ${heroSeen ? "show reveal-delay-0" : ""}`}>Linkdr Enterprise</p>
                        <h1 className={`hero-title reveal ${heroSeen ? "show reveal-delay-1" : ""}`}>
                            Hiring intelligence <br /> at global scale.
                        </h1>
                        <p className={`hero-subtitle reveal ${heroSeen ? "show reveal-delay-2" : ""}`}>
                            For organizations processing 10k+ applications a month. Automate relevance scoring with
                            audit-ready explainability and banking-grade security.
                        </p>
                        <div className={`hero-actions reveal ${heroSeen ? "show reveal-delay-3" : ""}`}>
                            <Link className="btn primary" href="/contact">
                                Book a demo
                            </Link>
                            <Link className="btn ghost" href="#features">
                                View platform
                            </Link>
                        </div>
                        <div className={`hero-kpis reveal ${heroSeen ? "show reveal-delay-4" : ""}`} aria-label="Highlights">
                            <div className="kpi-card">
                                <span className="kpi-value" data-target="99" data-suffix=".9%">0%</span>
                                <span className="kpi-label">Uptime SLA</span>
                            </div>
                            <div className="kpi-card">
                                <span className="kpi-value" data-target="200" data-suffix="ms">0ms</span>
                                <span className="kpi-label">Avg Query Latency</span>
                            </div>
                            <div className="kpi-card">
                                <span className="kpi-value" data-target="150" data-suffix="+">0+</span>
                                <span className="kpi-label">Countries supported</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="features" className="panel options">
                    <div className="container split">
                        <div className={`panel-header reveal ${featuresSeen ? "show reveal-delay-0" : ""}`}>
                            <p className="eyebrow">The Platform</p>
                            <h2 className="section-title">Built for the Fortune 500</h2>
                            <p className="section-subtitle">
                                Linkdr integrates deeply into your existing workflow without displacing your system of record.
                            </p>
                        </div>
                        <div className={`card-grid reveal ${featuresSeen ? "show reveal-delay-1" : ""}`} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                            {features.map(f => (
                                <article key={f.title} className="glass-card">
                                    <div style={{ fontSize: '2rem', marginBottom: 16 }}>{f.icon}</div>
                                    <h3>{f.title}</h3>
                                    <p className="muted">
                                        {f.description}
                                    </p>
                                </article>
                            ))}
                        </div>
                        <div className={`reveal ${featuresSeen ? "show reveal-delay-2" : ""}`} style={{ marginTop: 40, textAlign: 'center' }}>
                            <Link className="btn primary" href="/contact">
                                Contact our sales team
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <nav className="scroll-dots" aria-label="Page sections">
                {sectionOrder.map((id) => (
                    <a
                        key={id}
                        href={`#${id}`}
                        className={`scroll-dot ${activeSection === id ? "active" : ""}`}
                        aria-label={id}
                    />
                ))}
            </nav>

            <footer className={`footer ${showFooter ? "visible" : ""}`}>
                <div className="container footer-row">
                    <div className="footer-brand">
                        <span className="brand-text">Linkdr for Enterprise</span>
                    </div>
                    <div className="footer-links">
                        <Link className="nav-link" href="/">Home</Link>
                        <Link className="nav-link" href="/privacy">Privacy & Terms</Link>
                        <Link className="nav-link" href="/contact">Contact</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
