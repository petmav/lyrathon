"use client";

import { JSX, SyntheticEvent, useState, useEffect, useRef, useCallback } from "react";
import { Box } from "@mui/material";
import { apiCall } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* =======================
   Types
======================= */

interface PreviousPosition {
  title: string;
  org: string;
  start_date: string;
  end_date: string;
}

interface EducationEntry {
  degree: string;
  school: string;
  graduation_year: string;
}

interface ProjectEntry {
  title: string;
  description: string;
}

interface CandidateFormData {
  name: string;
  email: string;
  age?: number;
  current_position?: string;
  location?: string;
  visa_status?: string;
  experience_years?: number;
  salary_expectation?: number;
  availability_date?: string;
  skills_text?: string;
  awards_text?: string;
  certifications_text?: string;
  projects_text?: string;
  previous_positions: PreviousPosition[];
  education: EducationEntry[];
}

/* =======================
   Chip Input
======================= */

interface ChipInputProps {
  label: string;
  values: string[];
  setValues: React.Dispatch<React.SetStateAction<string[]>>;
  disabled?: boolean;
}

function ChipInput({ label, values, setValues, disabled }: ChipInputProps) {
  const [input, setInput] = useState("");

  const addValue = () => {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) {
      setValues([...values, trimmed]);
      setInput("");
    }
  };

  return (
    <div>
      <div className="modal-row">
        <div className="modal-label">{label}</div>
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addValue();
            }
          }}
          disabled={disabled}
        />
        <button type="button" className="btn ghost" onClick={addValue} disabled={disabled}>
          Add
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        {values.map((value, index) => (
          <span key={index} className="tag">
            {value}
            {!disabled && (
              <button type="button" style={{ marginLeft: 8, background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={() => setValues(values.filter((_, i) => i !== index))}>
                ×
              </button>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

/* =======================
   Component
======================= */

export default function ApplicantFormPage(): JSX.Element {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [currentPosition, setCurrentPosition] = useState("");
  const [isEmployed, setIsEmployed] = useState(true);
  const [location, setLocation] = useState("");
  const [visaStatus, setVisaStatus] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [salaryExpectation, setSalaryExpectation] = useState("");
  const [availabilityDate, setAvailabilityDate] = useState("");

  const [skills, setSkills] = useState<string[]>([]);
  const [awards, setAwards] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);

  const [previousPositions, setPreviousPositions] = useState<PreviousPosition[]>([]);
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [resumeLabel, setResumeLabel] = useState<string | null>(null);
  const [transcriptLabel, setTranscriptLabel] = useState<string | null>(null);
  const [resumeConfidence, setResumeConfidence] = useState<number | null>(null);
  const [transcriptConfidence, setTranscriptConfidence] = useState<number | null>(null);
  const [projectsConfidence, setProjectsConfidence] = useState<number | null>(null);
  const [aggregateConfidence, setAggregateConfidence] = useState<number | null>(null);
  const [tooltipOpen, setTooltipOpen] = useState<string | null>(null);

  // New State for Sliding Panel
  const [viewMode, setViewMode] = useState<"dashboard" | "editor">("dashboard");
  const [activePanel, setActivePanel] = useState<"core" | "projects" | "education" | "docs" | "experience" | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const pendingRefresh = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Add no-scroll class to body
    document.body.classList.add("no-scroll-app");
    return () => document.body.classList.remove("no-scroll-app");
  }, []);

  const selectLatestDoc = (docs: any[], types: string[]) => {
    const filtered = docs.filter((d) => types.includes(d.type));
    if (!filtered.length) return null;
    return filtered.reduce((latest, doc) => {
      const time = new Date(doc.updated_at ?? doc.created_at ?? 0).getTime();
      const latestTime = new Date(latest.updated_at ?? latest.created_at ?? 0).getTime();
      return time > latestTime ? doc : latest;
    }, filtered[0]);
  };

  const selectLatestRun = (runs: any[], type: string) => {
    const filtered = runs.filter((r) => r.run_type === type);
    if (!filtered.length) return null;
    return filtered.reduce((latest, run) => {
      const time = new Date(run.updated_at ?? run.finished_at ?? 0).getTime();
      const latestTime = new Date(latest.updated_at ?? latest.finished_at ?? 0).getTime();
      return time > latestTime ? run : latest;
    }, filtered[0]);
  };

  const fetchCandidate = useCallback(async () => {
    try {
      const candidateId = localStorage.getItem("candidate_id");
      if (!candidateId) return;

      const res: any = await apiCall("/api/candidates", "GET", { candidate_id: candidateId });
      const candidate = res.data;
      if (!candidate) return;

      if (candidate.name) setName(candidate.name);
      if (candidate.email) setEmail(candidate.email);
      if (candidate.age !== undefined && candidate.age !== null) setAge(String(candidate.age));
      setCurrentPosition(candidate.current_position || "");
      setIsEmployed(
        Boolean(candidate.current_position) &&
        candidate.current_position !== "Not employed",
      );
      setLocation(candidate.location || "");
      setVisaStatus(candidate.visa_status || "");
      setExperienceYears(candidate.experience_years ? String(candidate.experience_years) : "");
      setSalaryExpectation(candidate.salary_expectation ? String(candidate.salary_expectation) : "");
      setAvailabilityDate(candidate.availability_date || "");

      if (candidate.skills_text) {
        setSkills(String(candidate.skills_text).split(",").map((s: string) => s.trim()).filter(Boolean));
      }
      if (candidate.awards_text) {
        setAwards(String(candidate.awards_text).split(",").map((s: string) => s.trim()).filter(Boolean));
      }
      if (candidate.certifications_text) {
        setCertifications(String(candidate.certifications_text).split(",").map((s: string) => s.trim()).filter(Boolean));
      }

      if (candidate.projects_text) {
        const projectsArr = String(candidate.projects_text)
          .split("|")
          .map((p) => p.trim())
          .filter(Boolean)
          .map((p) => {
            const titleMatch = p.match(/Project title:\s*([^,]+)/i);
            const descMatch = p.match(/Project Description:\s*(.*)/i);
            const title = titleMatch ? titleMatch[1].trim() : p;
            const description = descMatch ? descMatch[1].trim() : "";
            return { title, description };
          });
        setProjects(projectsArr);
      }

      if (candidate.previous_positions && Array.isArray(candidate.previous_positions)) {
        setPreviousPositions(candidate.previous_positions);
      }

      if (candidate.education && Array.isArray(candidate.education)) {
        setEducation(candidate.education);
      }

      const docs = (candidate as any).documents ?? [];
      const resumeDoc = selectLatestDoc(docs, ['resume']);
      if (resumeDoc) {
        const parts = String(resumeDoc.file_url ?? '').split('/');
        setResumeLabel(parts[parts.length - 1] || 'Resume');
      }
      const transcriptDoc = selectLatestDoc(docs, ['transcript', 'other']);
      if (transcriptDoc) {
        const parts = String(transcriptDoc.file_url ?? '').split('/');
        setTranscriptLabel(parts[parts.length - 1] || 'Transcript');
      }
      const verifications = (candidate as any).verifications ?? [];
      const resumeRun = selectLatestRun(verifications, 'resume');
      const transcriptRun = selectLatestRun(verifications, 'transcript');
      const projectRun = selectLatestRun(verifications, 'project_links');
      const fullRun = selectLatestRun(verifications, 'full_profile');
      setResumeConfidence(resumeRun?.confidence ?? null);
      setTranscriptConfidence(transcriptRun?.confidence ?? null);
      setProjectsConfidence(projectRun?.confidence ?? null);
      setAggregateConfidence(fullRun?.confidence ?? null);

      const hasPending = verifications.some(
        (v: any) => v.status === 'queued' || v.status === 'processing',
      );
      if (pendingRefresh.current) {
        clearTimeout(pendingRefresh.current);
        pendingRefresh.current = null;
      }
      if (hasPending) {
        pendingRefresh.current = setTimeout(() => {
          fetchCandidate();
        }, 3500);
      }
    } catch (err) {
      console.error("Failed to fetch candidate data:", err);
    }
  }, []);

  useEffect(() => {
    fetchCandidate();
    return () => {
      if (pendingRefresh.current) {
        clearTimeout(pendingRefresh.current);
      }
    };
  }, [fetchCandidate]);

  const router = useRouter();
  const uploadDocument = async (candidateId: string, file: File | null, type: string) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("candidate_id", candidateId);
    formData.append("type", type);
    formData.append("file", file);

    await fetch("/api/candidates/documents", {
      method: "POST",
      body: formData,
    }).catch((err) => {
      console.error("Document upload failed", err);
    });
  };
  const handleLogout = (): void => {
    router.push('/');
    localStorage.removeItem("candidate_id");
    console.log("Logged out");
  };

  const openEditPanel = (panel: "core" | "projects" | "education" | "docs" | "experience") => {
    setActivePanel(panel);
    setViewMode("editor");
  };

  const closeEditPanel = () => {
    setViewMode("dashboard");
    // Delay clearing active panel to allow transition
    setTimeout(() => setActivePanel(null), 500);
  };

  /* =======================
     Submit
  ======================= */

  const handleSubmit = async (e: SyntheticEvent): Promise<void> => {
    e.preventDefault();
    setIsSaving(true);

    const formData: CandidateFormData = {
      name,
      email,
      age: age ? Number(age) : undefined,
      current_position: isEmployed ? currentPosition || undefined : "Not employed",
      location: location || undefined,
      visa_status: visaStatus || undefined,
      experience_years: isEmployed && experienceYears ? Number(experienceYears) : undefined,
      salary_expectation: isEmployed && salaryExpectation ? Number(salaryExpectation) : undefined,
      availability_date: availabilityDate || undefined,

      skills_text: skills.join(", "),
      awards_text: awards.join(", "),
      certifications_text: certifications.join(", "),
      projects_text: projects
        .map(
          (p) =>
            `Project title: ${p.title}, Project Description: ${p.description}`
        )
        .join(" | "),

      previous_positions: previousPositions,
      education,
    };

    const existingCandidateId = localStorage.getItem("candidate_id") || "";
    let candidateId = existingCandidateId;

    // If the user is only updating docs and we already have a candidate_id, skip the profile re-save to avoid duplicate inserts.
    const docsOnlyUpdate = activePanel === "docs" && !!existingCandidateId;

    if (!docsOnlyUpdate) {
      try {
        const res = await apiCall("/api/candidates/register", "POST", formData);
        candidateId =
          (res as any)?.data?.candidate_id ||
          localStorage.getItem("candidate_id") ||
          existingCandidateId;
        if (candidateId) {
          localStorage.setItem("candidate_id", candidateId);
        }
      } catch (err) {
        if (!existingCandidateId) {
          console.log(err);
          setIsSaving(false);
          return;
        }
        console.warn("Profile save failed, continuing with doc upload using existing candidate_id:", err);
      }
    }

    try {
      if (candidateId) {
        await uploadDocument(candidateId, resumeFile, "resume");
        await uploadDocument(candidateId, transcriptFile, "other");
        await fetchCandidate();
        setResumeFile(null);
        setTranscriptFile(null);
        // schedule a follow-up refresh to capture async verification completions
        if (pendingRefresh.current) clearTimeout(pendingRefresh.current);
        pendingRefresh.current = setTimeout(() => {
          fetchCandidate();
        }, 4000);
      }
      closeEditPanel();
    } catch (err) {
      console.log("Document upload failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  /* =======================
     Previous Positions
  ======================= */

  const addPreviousPosition = () =>
    setPreviousPositions((prev) => [
      ...prev,
      { title: "", org: "", start_date: "", end_date: "" },
    ]);

  const updatePreviousPosition = <
    K extends keyof PreviousPosition
  >(
    index: number,
    key: K,
    value: PreviousPosition[K]
  ) =>
    setPreviousPositions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });

  const removePreviousPosition = (index: number) =>
    setPreviousPositions((prev) => prev.filter((_, i) => i !== index));

  /* =======================
     Education
  ======================= */

  const addEducation = () =>
    setEducation((prev) => [
      ...prev,
      { degree: "", school: "", graduation_year: "" },
    ]);

  const updateEducation = <
    K extends keyof EducationEntry
  >(
    index: number,
    key: K,
    value: EducationEntry[K]
  ) =>
    setEducation((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });

  const removeEducation = (index: number) =>
    setEducation((prev) => prev.filter((_, i) => i !== index));

  /* =======================
     Projects
  ======================= */

  const addProject = () =>
    setProjects((prev) => [...prev, { title: "", description: "" }]);

  const updateProject = <
    K extends keyof ProjectEntry
  >(
    index: number,
    key: K,
    value: ProjectEntry[K]
  ) =>
    setProjects((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });

  const removeProject = (index: number) =>
    setProjects((prev) => prev.filter((_, i) => i !== index));

  const getVerificationStatus = (confidence: number | null, hasDoc: boolean) => {
    if (!hasDoc) return 'notapplicable';
    if (confidence === null || confidence === undefined) return 'notapplicable';
    if (confidence >= 0.66) return 'verified';
    if (confidence >= 0.33) return 'partial';
    return 'notapplicable';
  };

  const statusLabel = (status: string) => {
    if (status === 'verified') return 'Verified';
    if (status === 'partial') return 'Partially verified';
    if (status === 'notapplicable') return 'Not applicable';
    return 'Not applicable';
  };

  const statusTooltip = (status: string) => {
    switch (status) {
      case 'verified':
        return 'High confidence: recruiters see you prominently. Keep docs up to date.';
      case 'partial':
        return 'Medium confidence: add more evidence (skills, roles, links) to boost visibility.';
      case 'notapplicable':
        return 'No document or very low confidence: upload clearer evidence to turn this green.';
      default:
        return 'No document or very low confidence: upload clearer evidence to turn this green.';
    }
  };

  const confidenceBadge = (() => {
    const status = getVerificationStatus(aggregateConfidence, aggregateConfidence !== null);
    const value =
      aggregateConfidence === null || aggregateConfidence === undefined
        ? '—'
        : `${(aggregateConfidence * 100).toFixed(0)}%`;
    const tooltip =
      statusTooltip(status);
    return { status, value, tooltip, label: statusLabel(status) };
  })();

  /* =======================
     Render
  ======================= */

  return (
    <div className="viewport-container">
      {/* Fixed Header */}
      <header className="site-header" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50 }}>
        <div className="container header-row">
          <div className="brand">
            <Link href="/" aria-label="Linkdr homepage">
              <span className="brand-mark">L</span>
              <span className="brand-text">Linkdr</span>
            </Link>
          </div>
          <nav className="nav" aria-label="Primary">
            <Link className="nav-link" href="/">Home</Link>
            <Link className="nav-link" href="/register">Applicants</Link>
            <Link className="nav-link" href="/recruiter_query_page">Recruiters</Link>
          </nav>
          <div className="nav-actions">
            <button className="btn ghost" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      <div className={`sliding-stage view-${viewMode}`}>

        {/* PANEL 1: DASHBOARD VIEW */}
        <div className="panel-section">
          <div className="dashboard-grid">

            {/* LEFT COLUMN: SNAPSHOT */}
            <div className="scroll-col">
              <section className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <h1 className="hero-title" style={{ fontSize: '1.8rem' }}>
                    {name || 'Your Profile'}
                  </h1>
                  <p className="hero-subtitle" style={{ fontSize: '1rem' }}>
                    Ready to be seen.
                  </p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <div className="tooltip-trigger">
                      <div className={`status-badge ${confidenceBadge.status}`}>
                        <span>{confidenceBadge.label}: {confidenceBadge.value}</span>
                      </div>
                      {tooltipOpen === 'badge' && (
                        <div className="tooltip-content">
                          {confidenceBadge.tooltip}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="glass-card" style={{ padding: 16, background: 'rgba(255,255,255,0.03)' }}>
                  <div className="panel-header" style={{ marginBottom: 12 }}>
                    <p className="eyebrow" style={{ color: 'var(--text)' }}>Snapshot</p>
                    <button className="btn ghost" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => openEditPanel('core')}>Edit</button>
                  </div>
                  <div style={{ display: 'grid', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Current role</div>
                      <div style={{ fontWeight: 600 }}>{isEmployed ? currentPosition || '—' : 'Not employed'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Location</div>
                      <div style={{ fontWeight: 600 }}>{location || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Experience</div>
                      <div style={{ fontWeight: 600 }}>{isEmployed ? experienceYears || '—' : '—'}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                  <p className="eyebrow" style={{ color: 'var(--text)' }}>Verifications</p>
                  {[
                    {
                      label: 'Resume',
                      hasDoc: Boolean(resumeFile || resumeLabel),
                      confidence: resumeConfidence,
                      panel: 'docs' as const
                    },
                    {
                      label: 'Transcript',
                      hasDoc: Boolean(transcriptFile || transcriptLabel),
                      confidence: transcriptConfidence,
                      panel: 'education' as const
                    },
                    {
                      label: 'Projects',
                      hasDoc: Boolean(projects.length),
                      confidence: projectsConfidence,
                      panel: 'projects' as const
                    },
                  ].map((item) => {
                    const status = getVerificationStatus(item.confidence, item.hasDoc);
                    return (
                      <div key={item.label} className="glass-card" style={{ padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.label}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{item.hasDoc ? statusLabel(status) : 'Pending'}</div>
                        </div>
                        <button className="btn ghost" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => openEditPanel(item.panel)}>Upload</button>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN: CONTENT GRID */}
            <div className="scroll-col">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, paddingBottom: 60 }}>
                {/* Skills & Core */}
                <section className="glass-card">
                  <div className="dual-header" style={{ marginBottom: 16 }}>
                    <h3 style={{ margin: 0 }}>Skills & Awards</h3>
                    <button className="btn ghost" onClick={() => openEditPanel("core")}>Edit</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    {skills.length ? skills.map((s, i) => <span key={i} className="tag">{s}</span>) : <div className="muted">Add skills</div>}
                  </div>
                  <div style={{ display: 'grid', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>Awards</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {awards.length ? awards.map((a, i) => <span key={i} className="tag">{a}</span>) : <div className="muted">Add awards</div>}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Projects */}
                <section className="glass-card">
                  <div className="dual-header" style={{ marginBottom: 16 }}>
                    <h3 style={{ margin: 0 }}>Portfolio</h3>
                    <button className="btn ghost" onClick={() => openEditPanel("projects")}>Add</button>
                  </div>
                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {projects.length ? projects.map((p, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10, marginBottom: 8, border: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 800, marginBottom: 4 }}>{p.title || 'Untitled'}</div>
                        <div className="muted" style={{ fontSize: '0.9rem' }}>{p.description}</div>
                      </div>
                    )) : <div className="muted">Share what you’ve built</div>}
                  </div>
                </section>

                {/* Education */}
                <section className="glass-card">
                  <div className="dual-header" style={{ marginBottom: 16 }}>
                    <h3 style={{ margin: 0 }}>Education</h3>
                    <button className="btn ghost" onClick={() => openEditPanel("education")}>Add</button>
                  </div>
                  {education.length ? education.map((edu, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10, marginBottom: 8, border: '1px solid var(--border)' }}>
                      <div style={{ fontWeight: 800, marginBottom: 4 }}>{edu.degree}, {edu.school}</div>
                      <div className="muted" style={{ fontSize: '0.9rem' }}>Graduation: {edu.graduation_year}</div>
                    </div>
                  )) : <div className="muted">Add your schools</div>}
                </section>

                {/* Experience */}
                <section className="glass-card">
                  <div className="dual-header" style={{ marginBottom: 16 }}>
                    <h3 style={{ margin: 0 }}>Experience</h3>
                    <button className="btn ghost" onClick={() => openEditPanel("experience")}>Add</button>
                  </div>
                  {previousPositions.length ? previousPositions.map((pos, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10, marginBottom: 8, border: '1px solid var(--border)' }}>
                      <div style={{ fontWeight: 800, marginBottom: 4 }}>{pos.title} at {pos.org}</div>
                      <div className="muted" style={{ fontSize: '0.9rem' }}>{pos.start_date} — {pos.end_date}</div>
                    </div>
                  )) : <div className="muted">Add your past roles</div>}
                </section>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL 2: EDITOR VIEW */}
        <div className="panel-section">
          <div className="editor-panel-inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
              <button className="btn ghost" onClick={closeEditPanel}>← Back to Dashboard</button>
              <h2 style={{ margin: 0 }}>
                {activePanel === 'core' && 'Edit Core Profile'}
                {activePanel === 'projects' && 'Manage Projects'}
                {activePanel === 'education' && 'Education & Transcripts'}
                {activePanel === 'experience' && 'Work Experience'}
                {activePanel === 'docs' && 'Resume Upload'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="glass-card" style={{ padding: 32, display: 'grid', gap: 24, animation: 'none', border: 'none', background: 'transparent', boxShadow: 'none' }}>

              {activePanel === 'core' && (
                <>
                  <div className="modal-row">
                    <div className="modal-label">Full Name</div>
                    <input className="input" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div className="modal-row">
                    <div className="modal-label">Email</div>
                    <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="modal-row">
                    <div className="modal-label">Age</div>
                    <input className="input" type="number" value={age} onChange={e => setAge(e.target.value)} />
                  </div>

                  <div className="modal-row">
                    <div className="modal-label">Employment</div>
                    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input type="radio" checked={isEmployed} onChange={() => setIsEmployed(true)} />
                        Employed
                      </label>
                      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input type="radio" checked={!isEmployed} onChange={() => setIsEmployed(false)} />
                        Not employed
                      </label>
                    </div>
                  </div>

                  {isEmployed && (
                    <>
                      <div className="modal-row">
                        <div className="modal-label">Current Position</div>
                        <input className="input" value={currentPosition} onChange={e => setCurrentPosition(e.target.value)} />
                      </div>
                      <div className="modal-row">
                        <div className="modal-label">Yrs Experience</div>
                        <input className="input" type="number" value={experienceYears} onChange={e => setExperienceYears(e.target.value)} />
                      </div>
                      <div className="modal-row">
                        <div className="modal-label">Salary Exp.</div>
                        <input className="input" type="number" value={salaryExpectation} onChange={e => setSalaryExpectation(e.target.value)} placeholder="e.g. 120000" />
                      </div>
                    </>
                  )}

                  <div className="modal-row">
                    <div className="modal-label">Location</div>
                    <input className="input" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Sydney, Australia" />
                  </div>
                  <div className="modal-row">
                    <div className="modal-label">Visa Status</div>
                    <input className="input" value={visaStatus} onChange={e => setVisaStatus(e.target.value)} placeholder="e.g. Citizen, PR, 482 Visa" />
                  </div>
                  <div className="modal-row">
                    <div className="modal-label">Availability</div>
                    <input className="input" value={availabilityDate} onChange={e => setAvailabilityDate(e.target.value)} placeholder="e.g. Immediate, 4 weeks" />
                  </div>

                  <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />

                  <ChipInput label="Skills" values={skills} setValues={setSkills} />
                  <ChipInput label="Awards" values={awards} setValues={setAwards} />
                  <ChipInput label="Certifications" values={certifications} setValues={setCertifications} />
                </>
              )}

              {activePanel === 'projects' && (
                <>
                  {projects.map((p, i) => (
                    <div key={i} className="glass-card" style={{ padding: 20, marginBottom: 12 }}>
                      <div className="modal-row">
                        <div className="modal-label">Project Title</div>
                        <input
                          className="input"
                          value={p.title}
                          onChange={(e) => updateProject(i, "title", e.target.value)}
                        />
                      </div>
                      <div className="modal-row">
                        <div className="modal-label">Description</div>
                        <textarea
                          className="textarea"
                          value={p.description}
                          onChange={(e) => updateProject(i, "description", e.target.value)}
                        />
                      </div>
                      <button type="button" className="btn ghost" onClick={() => removeProject(i)} style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                        Remove Project
                      </button>
                    </div>
                  ))}
                  <button type="button" className="btn ghost" onClick={addProject}>
                    + Add Another Project
                  </button>
                </>
              )}

              {activePanel === 'education' && (
                <>
                  <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
                    <div style={{ marginBottom: 12, fontWeight: 700 }}>Upload Transcript</div>
                    <input
                      type="file"
                      onChange={(e) => setTranscriptFile(e.target.files?.[0] || null)}
                      style={{ color: 'var(--muted)' }}
                    />
                    {transcriptLabel && <div style={{ marginTop: 8, fontSize: '0.9rem' }}>Current: {transcriptLabel}</div>}
                  </div>

                  {education.map((edu, i) => (
                    <div key={i} className="glass-card" style={{ padding: 20, marginBottom: 12 }}>
                      <div className="modal-row">
                        <div className="modal-label">Degree</div>
                        <input
                          className="input"
                          value={edu.degree}
                          onChange={(e) => updateEducation(i, "degree", e.target.value)}
                          placeholder="e.g. BSc Computer Science"
                        />
                      </div>
                      <div className="modal-row">
                        <div className="modal-label">School</div>
                        <input
                          className="input"
                          value={edu.school}
                          onChange={(e) => updateEducation(i, "school", e.target.value)}
                        />
                      </div>
                      <div className="modal-row">
                        <div className="modal-label">Grad Year</div>
                        <input
                          className="input"
                          value={edu.graduation_year}
                          onChange={(e) => updateEducation(i, "graduation_year", e.target.value)}
                        />
                      </div>
                      <button type="button" className="btn ghost" onClick={() => removeEducation(i)} style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                        Remove
                      </button>
                    </div>
                  ))}
                  <button type="button" className="btn ghost" onClick={addEducation}>
                    + Add Education
                  </button>
                </>
              )}

              {activePanel === 'experience' && (
                <>
                  {previousPositions.map((pos, i) => (
                    <div key={i} className="glass-card" style={{ padding: 20, marginBottom: 12 }}>
                      <div className="modal-row">
                        <div className="modal-label">Title</div>
                        <input
                          className="input"
                          value={pos.title}
                          onChange={(e) => updatePreviousPosition(i, "title", e.target.value)}
                        />
                      </div>
                      <div className="modal-row">
                        <div className="modal-label">Organization</div>
                        <input
                          className="input"
                          value={pos.org}
                          onChange={(e) => updatePreviousPosition(i, "org", e.target.value)}
                        />
                      </div>
                      <div className="modal-row">
                        <div className="modal-label">Start Date</div>
                        <input
                          className="input"
                          type="month"
                          value={pos.start_date}
                          onChange={(e) => updatePreviousPosition(i, "start_date", e.target.value)}
                        />
                      </div>
                      <div className="modal-row">
                        <div className="modal-label">End Date</div>
                        <input
                          className="input"
                          type="month"
                          value={pos.end_date}
                          onChange={(e) => updatePreviousPosition(i, "end_date", e.target.value)}
                        />
                      </div>
                      <button type="button" className="btn ghost" onClick={() => removePreviousPosition(i)} style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                        Remove
                      </button>
                    </div>
                  ))}
                  <button type="button" className="btn ghost" onClick={addPreviousPosition}>
                    + Add Position
                  </button>
                </>
              )}

              {activePanel === 'docs' && (
                <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
                  <h3 style={{ marginTop: 0 }}>Upload Resume</h3>
                  <p className="muted" style={{ marginBottom: 32 }}>Upload your latest PDF or DOCX resume. We will parse it to verify your profile.</p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    style={{ display: 'block', width: '100%', padding: 40, border: '2px dashed var(--border)', borderRadius: 12, textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}
                  />
                  {resumeFile && <div style={{ marginTop: 24, fontWeight: 700, fontSize: '1.2rem' }}>Selected: {resumeFile.name}</div>}
                  {resumeLabel && !resumeFile && <div style={{ marginTop: 24 }}>Current: {resumeLabel}</div>}
                </div>
              )}

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn ghost" onClick={closeEditPanel} disabled={isSaving}>Cancel</button>
                <button type="submit" className="btn primary" disabled={isSaving} style={{ minWidth: 160 }}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
