"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Testimonial = {
  quote: string;
  name: string;
  title: string;
  image: string;
};

const testimonials: Testimonial[] = [
  {
    quote:
      "Linkdr surfaces signal, not noise. Our hiring loops are faster and far more confident.",
    name: "Priya Menon",
    title: "Head of Talent, Aurora Labs",
    image: "/priya.png",
  },
  {
    quote:
      "The shortlist reasoning reads like a seasoned recruiter whispering in your ear.",
    name: "Marco Ruiz",
    title: "Engineering Manager, Northwind",
    image: "/marco.png",
  },
  {
    quote:
      "One query found me multiple interviews that actually matched my company stack.",
    name: "Hannah Lee",
    title: "Senior Recruiter, Liora",
    image: "/hannah.png",
  },
];

const applicantTestimonials: Testimonial[] = [
  {
    quote: "I applied once and stopped writing cover letters. The shortlist matches my stack.",
    name: "Hannah Lee",
    title: "Senior Frontend Engineer, Terra",
    image: "/hannah.png",
  },
  {
    quote: "The rationale shows why I’m a fit. I can prep faster and steer the conversation.",
    name: "Marco Ruiz",
    title: "Full Stack Engineer, Nordill",
    image: "/marco.png",
  },
  {
    quote: "Visa and location filters saved me from irrelevant outreach.",
    name: "Priya Menon",
    title: "Data Engineer, Scielbank",
    image: "/priya.png",
  },
];

export default function HomePage() {
  const [activeSection, setActiveSection] = useState("hero");
  const mainRef = useRef<HTMLElement | null>(null);
  const sectionOrder = ["hero", "options", "testimonials"] as const;
  const showHeader = activeSection === "hero";
  const showFooter = activeSection === "testimonials";

  useEffect(() => {
    const root = mainRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { root, threshold: 0.6 }
    );

    sectionOrder.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sectionOrder]);

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
              Home
            </Link>
            <Link className="nav-link" href="#options">
              Applicants
            </Link>
            <Link className="nav-link" href="#options">
              Recruiters
            </Link>
            <Link className="nav-link" href="#testimonials">
              Stories
            </Link>
          </nav>
        </div>
      </header>

      <main className="page-main" ref={mainRef}>
        <section id="hero" className="panel hero">
          <div className="container hero-content">
            <p className="eyebrow">Retrieval-augmented hiring</p>
            <h1 className="hero-title">
              Match talent and teams with an AI co-pilot that explains every decision.
            </h1>
            <p className="hero-subtitle">
              One submission for candidates. One natural-language query for recruiters.
              A transparent shortlist powered by SQL filters, vector search, and LLM reasoning.
            </p>
            <div className="hero-actions">
              <Link className="btn primary" href="/register">
                Get started
              </Link>
              <Link className="btn ghost" href="#options">
                See how it works
              </Link>
            </div>
            <div className="hero-kpis" aria-label="Highlights">
              <div className="kpi-card">
                <span className="kpi-value">2 min</span>
                <span className="kpi-label">Avg apply time</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-value">300+</span>
                <span className="kpi-label">Hiring teams</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-value">200+</span>
                <span className="kpi-label">Companies hiring</span>
              </div>
            </div>
          </div>
        </section>

        <section id="options" className="panel options">
          <div className="container split">
            <div className="panel-header">
              <p className="eyebrow">Choose your path</p>
              <h2 className="section-title">Built for applicants and recruiters</h2>
              <p className="section-subtitle">
                Submit once as a candidate, query once as a recruiter. Both flows stay in sync
                with the same RAG pipeline.
              </p>
            </div>
            <div className="card-grid">
              <article className="glass-card">
                <p className="badge">Applicants</p>
                <h3>Create your profile</h3>
                <p className="muted">
                  Drop your experience, skills, certifications, and projects. We normalize the data,
                  embed the text, and keep you visible across relevant roles.
                </p>
                <ul className="list">
                  <li>Single submission for multiple roles</li>
                  <li>Prioritisation on critical criteria</li>
                  <li>Privacy-first: revoke or update anytime</li>
                </ul>
                <div className="card-actions">
                  <Link className="btn primary" href="/applicant/apply">
                    Submit profile
                  </Link>
                  <Link className="btn text" href="/applicant/status">
                    Check status →
                  </Link>
                </div>
              </article>

              <article className="glass-card">
                <p className="badge">Recruiters</p>
                <h3>Query in plain language</h3>
                <p className="muted">
                  Hard filters run in SQL; semantic matches from embeddings; re-ranked by an LLM
                  that returns rationale, risks, and next steps.
                </p>
                <ul className="list">
                  <li>Visa, location, salary, availability filters</li>
                  <li>Hybrid BM25 + vector search for relevance</li>
                  <li>Transparent shortlist with contact details</li>
                </ul>
                <div className="card-actions">
                  <Link className="btn primary" href="/recruiter_query_page">
                    Run a query
                  </Link>
                  <Link className="btn text" href="/api/query/shortlist">
                    API docs →
                  </Link>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="testimonials" className="panel testimonials">
          <div className="container">
            <div className="panel-header">
              <p className="eyebrow">Proof in practice</p>
              <h2 className="section-title">Teams that switched to Linkdr</h2>
            </div>
            <div className="testimonial-block">
              <div className="testimonial-grid">
                {testimonials.map((t) => (
                  <article key={t.name} className="testimonial-card">
                    <p className="testimonial-quote">“{t.quote}”</p>
                    <div className="testimonial-meta">
                      <img
                        className="testimonial-portrait"
                        src={t.image}
                        alt={`${t.name} portrait`}
                      />
                      <div className="testimonial-meta-text">
                        <span className="testimonial-name">{t.name}</span>
                        <span className="testimonial-title">{t.title}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="panel-header testimonial-spacer">
              <h2 className="section-title">Applicants that tried Linkdr</h2>
            </div>
            <div className="testimonial-block">
              <div className="testimonial-grid">
                {applicantTestimonials.map((t) => (
                  <article key={`${t.name}-applicant`} className="testimonial-card">
                    <p className="testimonial-quote">“{t.quote}”</p>
                    <div className="testimonial-meta">
                      <img
                        className="testimonial-portrait"
                        src={t.image}
                        alt={`${t.name} portrait`}
                      />
                      <div className="testimonial-meta-text">
                        <span className="testimonial-name">{t.name}</span>
                        <span className="testimonial-title">{t.title}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
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

      <footer id="contact" className={`footer ${showFooter ? "visible" : ""}`}>
        <div className="container footer-row">
          <div className="footer-brand">
            <span className="brand-text">Let's find your talent.</span>
          </div>
          <div className="footer-links">
            <Link className="nav-link" href="/privacy">
              Privacy & Terms
            </Link>
            <Link className="nav-link" href="/contact">
              Contact
            </Link>
            <Link className="nav-link" href="/enterprise">
              Enterprise
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
