"use client";

import React, { JSX, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./index_page.module.css";

type Role = "applicant" | "recruiter";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: "Full-time" | "Part-time" | "Contract" | "Internship";
  salary?: string;
  tags: string[];
};

type Applicant = {
  id: string;
  name: string;
  role: string;
  stage: "New" | "Shortlisted" | "Interview" | "Offer";
};

export default function HomePage(): JSX.Element {
  const [role, setRole] = useState<Role>("recruiter");

  const featuredJobs: Job[] = useMemo(
    () => [
      {
        id: "se-1",
        title: "Software Engineer",
        company: "LyraLabs",
        location: "Sydney (Hybrid)",
        type: "Full-time",
        salary: "$120k–$160k",
        tags: ["TypeScript", "React", "Node"],
      },
      {
        id: "da-1",
        title: "Data Analyst",
        company: "Orbit Finance",
        location: "Remote (AU)",
        type: "Full-time",
        salary: "$95k–$125k",
        tags: ["SQL", "Python", "BI"],
      },
      {
        id: "ux-1",
        title: "Product Designer",
        company: "Bright Studio",
        location: "Melbourne",
        type: "Contract",
        salary: "$800/day",
        tags: ["Figma", "UX", "Design Systems"],
      },
    ],
    []
  );

  const sampleApplicants: Applicant[] = useMemo(
    () => [
      { id: "a1", name: "Alex Chen", role: "Frontend Engineer", stage: "New" },
      { id: "a2", name: "Sam Patel", role: "Data Analyst", stage: "Shortlisted" },
      { id: "a3", name: "Jordan Lee", role: "Backend Engineer", stage: "Interview" },
    ],
    []
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.headerRow}>
            <Link className={styles.brand} href="/" aria-label="Go to homepage">
              Linkdr
            </Link>

            <nav className={styles.nav} aria-label="Primary">
              <Link className={styles.navLink} href="/jobs">
                Jobs
              </Link>
              <Link className={styles.navLink} href="/applications">
                Applications
              </Link>
              <Link className={styles.navLink} href="/companies">
                Companies
              </Link>
              <Link className={styles.navLinkStrong} href="/login">
                Sign in
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className={styles.container}>
        {/* 1) Shared “connect applicants + recruiters” block */}
        <section className={styles.landing} aria-labelledby="landing-title">
          <div className={styles.landingInner}>
            <div>
              <h1 id="landing-title" className={styles.landingTitle}>
                {/*applicants ↔ recruiters, we find talent tailored to your needs*/}
                AI designed to connect, powered by talent
              </h1>
              <h1 id="landing-title" className={styles.landingTitle}>
                cut the noise, simply <span className={styles.accent}> linkdr</span>.
              </h1>

              <p className={styles.landingSubtitle}>
                {/*where AI and talent meet.*/}
                The future of recruitment screens credibility, skip the resume and stay ahead.
              </p>

            </div>

            <aside className={styles.landingCard} aria-label="At a glance">
              <div className={styles.kpi}>
                <div className={styles.kpiNum}>2 min</div>
                <div className={styles.kpiLabel}>Average apply time</div>
              </div>
              <div className={styles.kpi}>
                <div className={styles.kpiNum}>1,200+</div>
                <div className={styles.kpiLabel}>Active roles</div>
              </div>
              <div className={styles.kpi}>
                <div className={styles.kpiNum}>300+</div>
                <div className={styles.kpiLabel}>Hiring companies</div>
              </div>
            </aside>
          </div>
          <div className={styles.heroImage} aria-hidden="true" />
        </section>



        {/* 2) Toggle AFTER the shared block */}
        <section className={styles.toggleSection} aria-label="Choose view">
          <h2 className={styles.sectionTitle}>Explore as…</h2>
          <RoleToggle role={role} setRole={setRole} />
        </section>

        {/* 3) Role-specific content */}
        {role === "applicant" ? (
          <ApplicantHome />
        ) : (
          <RecruiterHome />
        )}
      </main>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerRow}>
            <div>
              <div className={styles.footerBrand}>ApplyHub</div>
              <p className={styles.muted}>Job search + application tracking + hiring dashboard.</p>
            </div>
            <div className={styles.footerLinks} aria-label="Footer links">
              <a className={styles.footerLink} href="/privacy">
                Privacy
              </a>
              <a className={styles.footerLink} href="/terms">
                Terms
              </a>
              <a className={styles.footerLink} href="/support">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function RoleToggle({
  role,
  setRole,
}: {
  role: Role;
  setRole: (r: Role) => void;
}): JSX.Element {
  return (
    <div className={styles.roleToggle} role="group" aria-label="Switch view">
      <button
        type="button"
        className={`${styles.roleBtn} ${role === "recruiter" ? `${styles.roleBtnActive} ${styles.roleBtnGlow}`:""}`}
        aria-pressed={role === "recruiter"}
        onClick={() => setRole("recruiter")}
      >
        Recruiter
      </button>
      <button
        type="button"
        className={`${styles.roleBtn} ${role === "applicant" ? `${styles.roleBtnActive} ${styles.roleBtnGlow}`:""}`}
        aria-pressed={role === "applicant"}
        onClick={() => setRole("applicant")}
      >
        Applicant
      </button>
    </div>
  );
}

function ApplicantHome(): JSX.Element {
  return (
    <section className={styles.section} aria-labelledby="applicant-title">
      <div className={styles.sectionHeader}>
        <h2 id="applicant-title" className={styles.sectionTitle}>Applicant</h2>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Create your candidate profile</h3>
        <p className={styles.cardSub}>
          Submit your details once. Recruiters match you based on capability signals (skills, projects, tests), not just credentials.
        </p>

        <div className={styles.cardActions}>
          <a className={styles.primaryBtn} href="/applicant/apply">
            Submit my profile
          </a>
          <a className={styles.ghostBtn} href="/applicant/status">
            Check status
          </a>
        </div>
      </div>
    </section>
  );
}


function RecruiterHome(): JSX.Element {
  return (
    <>
      {/* Recruiter hero */}
      <section className={styles.recruiterHero} aria-labelledby="recruiter-hero-title">
        <div className={styles.recruiterHeroInner}>
          <div>
            <h2 id="recruiter-hero-title" className={styles.heroTitle}>
              Find the best talent by capability, not just credentials.
            </h2>
            <p>
              Describe the role in plain English. We match thousands of candidates using real indicators: skills, projects, tests, and proven outcomes.
            </p>

            <div className={styles.recruiterCtas}>
              <a className={styles.button} href="/register">
                Query candidates
              </a> 
            </div>

          <aside className={styles.landingCard} aria-label="How matching works">
            <h3 className={styles.landingCardTitle}>How matching works</h3>
          <div className={styles.kpiGrid}>
            <div className={styles.kpi}>
              <div className={styles.kpiNum}>1. </div>
              <div className={styles.kpiLabel}>Describe the skills, credentials and qualifications you are looking for</div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.kpiNum}>2.</div>
              <div className={styles.kpiLabel}>We streamline potential applicants and rank them</div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.kpiNum}>3.</div>
              <div className={styles.kpiLabel}>Search through customised profiles and instantly connect</div>
            </div>
          </div>
          </aside>
            <div className={styles.pills} aria-label="Recruiter highlights">
              <span className={styles.pill}>Capability matching</span>
              <span className={styles.pill}>Explainable results</span>
              <span className={styles.pill}>Pipeline-ready</span>
              <span className={styles.pill}>Bias-aware signals</span>
            </div>
          </div>

          {/* Right card: “How the matching works” */}
        </div>
      </section>

      {/* Main recruiter section */}
      <section className={styles.section} aria-labelledby="recruiter-tools">
        <div className={styles.sectionHeader}>
          <h2 id="recruiter-tools" className={styles.sectionTitle}>
            Recruiter tools
          </h2>
          <a className={styles.sectionLink} href="/recruiter/dashboard">
            Open dashboard →
          </a>
        </div>

        <div className={styles.grid}>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Chat query</h3>
            <p className={styles.cardSub}>
              “Frontend engineer, Sydney, React + TS, 2–4 years, available ASAP.”
            </p>
            <a className={styles.primaryBtn} href="/recruiter/query">
              Start querying
            </a>
          </article>

          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Pipeline</h3>
            <p className={styles.cardSub}>
              Move candidates through stages with notes, tags, and decisions.
            </p>
            <a className={styles.primaryBtn} href="/recruiter/dashboard">
              View pipeline
            </a>
          </article>

          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Role templates</h3>
            <p className={styles.cardSub}>
              Save must-haves, nice-to-haves, and evaluation criteria per role.
            </p>
            <a className={styles.primaryBtn} href="/recruiter/templates">
              Create template
            </a>
          </article>
        </div>
      </section>

      {/* Capability signals section */}
      <section className={styles.section} aria-labelledby="signals-title">
        <h2 id="signals-title" className={styles.sectionTitle}>Signals we care about</h2>

        <div className={styles.signalGrid}>
          <div className={styles.signalCard}>
            <h3 className={styles.cardTitle}>Skills that show up in work</h3>
            <p className={styles.cardSub}>Code, projects, contributions, and impact — not keyword stuffing.</p>
          </div>
          <div className={styles.signalCard}>
            <h3 className={styles.cardTitle}>Role-fit evidence</h3>
            <p className={styles.cardSub}>Similar tasks, tools, environments, and outcomes.</p>
          </div>
          <div className={styles.signalCard}>
            <h3 className={styles.cardTitle}>Assessment-ready</h3>
            <p className={styles.cardSub}>Optional tests and structured evaluation criteria per role.</p>
          </div>
        </div>
      </section>
    </>
  );
}


function Stat({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className={styles.stat}>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}
