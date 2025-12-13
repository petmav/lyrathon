"use client";

import React, { JSX, useMemo, useState } from "react";
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
  const [role, setRole] = useState<Role>("applicant");

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
            <a className={styles.brand} href="/" aria-label="Go to homepage">
              Linkdr
            </a>

            <nav className={styles.nav} aria-label="Primary">
              <a className={styles.navLink} href="/jobs">
                Jobs
              </a>
              <a className={styles.navLink} href="/applications">
                Applications
              </a>
              <a className={styles.navLink} href="/companies">
                Companies
              </a>
              <a className={styles.navLinkStrong} href="/login">
                Sign in
              </a>
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
                  applicants ↔ recruiters {" "}
                   <span className={styles.accent}>without the noise.</span>
              </h1>
              <p className={styles.landingSubtitle}>
                where AI and talent meet.
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
          <div className={styles.pills}>
            <span className={styles.pill}>One profile </span>
            <span className={styles.pill}>Fast apply</span>
            <span className={styles.pill}>Verified companies</span>
          </div>
        </section>

        

        {/* 2) Toggle AFTER the shared block */}
        <section className={styles.toggleSection} aria-label="Choose view">
          <h2 className={styles.sectionTitle}>Explore as…</h2>
          <RoleToggle role={role} setRole={setRole} />
        </section>

        {/* 3) Role-specific content */}
        {role === "applicant" ? (
          <ApplicantHome featuredJobs={featuredJobs} />
        ) : (
          <RecruiterHome applicants={sampleApplicants} />
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
        className={`${styles.roleBtn} ${role === "applicant" ? styles.roleBtnActive : ""}`}
        aria-pressed={role === "applicant"}
        onClick={() => setRole("applicant")}
      >
        Applicant
      </button>
      <button
        type="button"
        className={`${styles.roleBtn} ${role === "recruiter" ? styles.roleBtnActive : ""}`}
        aria-pressed={role === "recruiter"}
        onClick={() => setRole("recruiter")}
      >
        Recruiter
      </button>
    </div>
  );
}

function ApplicantHome({ featuredJobs }: { featuredJobs: Job[] }): JSX.Element {
  return (
    <>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroInner}>
          <div>
            <h1 id="hero-title" className={styles.heroTitle}>
              Find jobs. Apply fast. Track everything.
            </h1>
            <p className={styles.heroSubtitle}>
              One profile. One dashboard. Less copying and pasting.
            </p>

            <form className={styles.search} action="/jobs" method="GET">
              <label className={styles.srOnly} htmlFor="q">
                Job title or keyword
              </label>
              <input
                id="q"
                name="q"
                className={styles.input}
                placeholder="Role or keyword (e.g. frontend, analyst)"
                autoComplete="off"
              />

              <label className={styles.srOnly} htmlFor="loc">
                Location
              </label>
              <input
                id="loc"
                name="loc"
                className={styles.input}
                placeholder="Location (optional)"
                autoComplete="off"
              />

              <button className={styles.button} type="submit">
                Search jobs
              </button>
            </form>

            <div className={styles.pills} aria-label="Highlights">
              <span className={styles.pill}>One-click apply</span>
              <span className={styles.pill}>Saved jobs</span>
              <span className={styles.pill}>Application tracker</span>
            </div>
          </div>

          <aside className={styles.sideCard} aria-label="Tracker preview">
            <h2 className={styles.sideTitle}>Your tracker</h2>
            <div className={styles.stats}>
              <Stat label="Drafts" value="2" />
              <Stat label="Applied" value="7" />
              <Stat label="Interview" value="1" />
              <Stat label="Offer" value="0" />
            </div>
            <a className={styles.secondaryLink} href="/applications">
              Open tracker →
            </a>
          </aside>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="featured-title">
        <div className={styles.sectionHeader}>
          <h2 id="featured-title" className={styles.sectionTitle}>
            Featured jobs
          </h2>
          <a className={styles.sectionLink} href="/jobs">
            View all →
          </a>
        </div>

        <div className={styles.grid}>
          {featuredJobs.map((job) => (
            <article key={job.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div>
                  <h3 className={styles.cardTitle}>{job.title}</h3>
                  <p className={styles.cardSub}>
                    {job.company} • {job.location}
                  </p>
                </div>
                <span className={styles.badge}>{job.type}</span>
              </div>

              <p className={styles.cardMeta}>
                {job.salary ? <span>{job.salary}</span> : <span>&nbsp;</span>}
              </p>

              <ul className={styles.tags} aria-label="Tags">
                {job.tags.map((t) => (
                  <li key={t} className={styles.tag}>
                    {t}
                  </li>
                ))}
              </ul>

              <div className={styles.cardActions}>
                <a className={styles.primaryBtn} href={`/jobs/${job.id}`}>
                  View role
                </a>
                <a className={styles.ghostBtn} href={`/jobs/${job.id}?save=1`}>
                  Save
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function RecruiterHome({ applicants }: { applicants: Applicant[] }): JSX.Element {
  return (
    <>
      <section className={styles.hero} aria-labelledby="recruiter-title">
        <div className={styles.heroInner}>
          <div>
            <h1 id="recruiter-title" className={styles.heroTitle}>
              Post roles and manage applicants in one place.
            </h1>
            <p className={styles.heroSubtitle}>
              Create listings, review candidates, and move them through your pipeline.
            </p>

            <div className={styles.ctaRow}>
              <a className={styles.button} href="/recruiter/post">
                Post a job
              </a>
              <a className={styles.ghostBtnWide} href="/recruiter/dashboard">
                Open dashboard
              </a>
            </div>

            <div className={styles.pills} aria-label="Recruiter features">
              <span className={styles.pill}>Pipeline stages</span>
              <span className={styles.pill}>Candidate notes</span>
              <span className={styles.pill}>Messaging</span>
            </div>
          </div>

          <aside className={styles.sideCard} aria-label="Applicants preview">
            <h2 className={styles.sideTitle}>Recent applicants</h2>
            <ul className={styles.appList}>
              {applicants.map((a) => (
                <li key={a.id} className={styles.appRow}>
                  <div>
                    <div className={styles.appName}>{a.name}</div>
                    <div className={styles.appRole}>{a.role}</div>
                  </div>
                  <span className={styles.stage}>{a.stage}</span>
                </li>
              ))}
            </ul>
            <a className={styles.secondaryLink} href="/recruiter/applicants">
              View all applicants →
            </a>
          </aside>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="quick-title">
        <h2 id="quick-title" className={styles.sectionTitle}>
          Quick actions
        </h2>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Create a job post</h3>
            <p className={styles.cardSub}>Role title, location, pay range, and requirements.</p>
            <a className={styles.primaryBtn} href="/recruiter/post">
              Start posting
            </a>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Review pipeline</h3>
            <p className={styles.cardSub}>Move candidates: New → Shortlisted → Interview → Offer.</p>
            <a className={styles.primaryBtn} href="/recruiter/dashboard">
              Open pipeline
            </a>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Company profile</h3>
            <p className={styles.cardSub}>Add your logo, description, and hiring links.</p>
            <a className={styles.primaryBtn} href="/recruiter/company">
              Edit profile
            </a>
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
