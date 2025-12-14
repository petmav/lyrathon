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
    quote: "I applied once and stopped using anything else. Haven't touched other platforms since.",
    name: "Joanna Chen",
    title: "Senior Frontend Engineer, Terra",
    image: "/joanna.png",
  },
  {
    quote: "Signed up and got an e-mail from a recruiter a few hours later.",
    name: "Jeremiah Steinson",
    title: "Full Stack Engineer, Nordill",
    image: "/jeremiah.png",
  },
  {
    quote: "Visa and location filters saved me from irrelevant outreach.",
    name: "Aisha Khan",
    title: "Data Engineer, Scielbank",
    image: "/aisha.png",
  },
];

export default function HomePage() {
  const [activeSection, setActiveSection] = useState("hero");
  const [heroSeen, setHeroSeen] = useState(false);
  const [optionsSeen, setOptionsSeen] = useState(false);
  const [testimonialsSeen, setTestimonialsSeen] = useState(false);
  const mainRef = useRef<HTMLElement | null>(null);
  const sectionOrder = ["hero", "options", "testimonials"] as const;
  const showHeader = activeSection === "hero";
  const showFooter = activeSection === "testimonials";
  useEffect(() => {
    const counters = Array.from(
      document.querySelectorAll<HTMLElement>(".kpi-value[data-target]")
    );
    const rafIds: number[] = [];
    const intervalIds: number[] = [];

    const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);

    counters.forEach((el, idx) => {
      const target = Number(el.dataset.target ?? 0);
      const suffix = el.dataset.suffix ?? "";
      const loop = el.dataset.loop !== "false";
      const isApplicants = target > 1000; // heuristic for applicants
      let current = 0;
      const duration = isApplicants ? 3200 : 5200 + idx * 400;
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
          if (loop) {
            const jitter = isApplicants
              ? 1800 + Math.random() * 1400
              : 7000 + Math.random() * 3000;
            const interval = window.setInterval(() => {
              current += 1;
              el.textContent = `${current}${suffix}`;
            }, jitter);
            intervalIds.push(interval);
          }
        }
      };

      rafIds.push(requestAnimationFrame(animate));
    });

    return () => {
      rafIds.forEach((id) => cancelAnimationFrame(id));
      intervalIds.forEach((id) => clearInterval(id));
    };
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
          if (entry.target.id === "options") setOptionsSeen(true);
          if (entry.target.id === "testimonials") setTestimonialsSeen(true);
        });
      },
      { threshold: 0.35 }
    );

    ["hero", "options", "testimonials"].forEach((id) => {
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
              Home
            </Link>
            <Link className="nav-link" href="/register">
              Applicants
            </Link>
            <Link className="nav-link" href="/register/recruiter">
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
            <p className={`eyebrow reveal ${heroSeen ? "show reveal-delay-0" : ""}`}>Retrieval-augmented hiring</p>
            <h1 className={`hero-title reveal ${heroSeen ? "show reveal-delay-1" : ""}`}>
              Match talent and teams with an AI co-pilot that explains every decision.
            </h1>
            <p className={`hero-subtitle reveal ${heroSeen ? "show reveal-delay-2" : ""}`}>
              One submission for candidates. One natural-language query for recruiters.
              A transparent shortlist powered by SQL filters, vector search, and LLM reasoning.
            </p>
            <div className={`hero-actions reveal ${heroSeen ? "show reveal-delay-3" : ""}`}>
              <Link className="btn primary" href="#options">
                Get started
              </Link>
              <Link className="btn ghost" href="#testimonials">
                Testimonials
              </Link>
            </div>
            <div className={`hero-kpis reveal ${heroSeen ? "show reveal-delay-4" : ""}`} aria-label="Highlights">
              <div className="kpi-card">
                <span className="kpi-value" data-target="2" data-suffix="m" data-loop="false">0m</span>
                <span className="kpi-label">Avg apply time</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-value" data-target="342">0</span>
                <span className="kpi-label">Hiring teams</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-value" data-target="2641">0</span>
                <span className="kpi-label">Active applicants</span>
              </div>
            </div>
          </div>
        </section>

        <section id="options" className="panel options">
          <div className="container split">
            <div className={`panel-header reveal ${optionsSeen ? "show reveal-delay-0" : ""}`}>
              <p className="eyebrow">Choose your path</p>
              <h2 className="section-title">Built for applicants and recruiters</h2>
              <p className="section-subtitle">
                Submit once as a candidate, query once as a recruiter. Both flows stay in sync
                with the same RAG pipeline.
              </p>
            </div>
            <div className={`card-grid reveal ${optionsSeen ? "show reveal-delay-1" : ""}`}>
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
                  <Link className="btn primary" href="/register">
                    Submit profile
                  </Link>
                  <Link className="btn text" href="/login">
                    Check profile →
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
                  <Link className="btn primary" href="/register/recruiter">
                    Find talent
                  </Link>
                  <Link className="btn text" href="/recruiter_query_page">
                    Run a query →
                  </Link>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="testimonials" className="panel testimonials">
          <div className="container">
            <div className={`panel-header reveal ${testimonialsSeen ? "show reveal-delay-0" : ""}`}>
              <p className="eyebrow">Proof in practice</p>
              <h2 className="section-title">Teams that switched to Linkdr</h2>
            </div>
            <div className="testimonial-block">
              <div className={`testimonial-grid reveal ${testimonialsSeen ? "show reveal-delay-1" : ""}`}>
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

            <div className={`panel-header testimonial-spacer reveal ${testimonialsSeen ? "show reveal-delay-2" : ""}`}>
              <h2 className="section-title">Applicants that tried Linkdr</h2>
            </div>
            <div className="testimonial-block">
              <div className={`testimonial-grid reveal ${testimonialsSeen ? "show reveal-delay-3" : ""}`}>
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
