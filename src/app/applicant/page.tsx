"use client";

import { JSX, SyntheticEvent, useState, useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { apiCall } from "@/lib/utils";
import Link from "next/link";
import styles from "./applicant.module.css";
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
      <div className={styles.modalRow}>
        <div className={styles.modalLabel}>{label}</div>
        <input
          className={styles.modalInput}
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
        <button type="button" className={`${styles.modalBtn} ${styles.ghost}`} onClick={addValue} disabled={disabled}>
          Add
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        {values.map((value, index) => (
          <span key={index} className={styles.tag}>
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
  const [activePanel, setActivePanel] = useState<"core" | "projects" | "education" | "docs" | "experience" | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [heroPulse, setHeroPulse] = useState(false);
  const coreRef = useRef<HTMLDivElement | null>(null);
  const projectsRef = useRef<HTMLDivElement | null>(null);
  const educationRef = useRef<HTMLDivElement | null>(null);
  const experienceRef = useRef<HTMLDivElement | null>(null);
  const filledInputSx = {
    '& .MuiFilledInput-root': { background: 'rgba(255,255,255,0.04)', color: 'white' },
    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
    '& .MuiFilledInput-root:before': { borderBottomColor: 'rgba(255,255,255,0.06)' },
  };
  useEffect(() => {
    try {
      const candidateId = localStorage.getItem("candidate_id");
      if (!candidateId) return; // nothing to fetch

      apiCall("/api/candidates", "GET", { candidate_id: candidateId })
        .then((res: any) => {
            console.log(res.data)
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
          setHeroPulse(true);

          const docs = (candidate as any).documents ?? [];
          const resumeDoc = docs.find((d: any) => d.type === 'resume');
          if (resumeDoc) {
            const parts = String(resumeDoc.file_url ?? '').split('/');
            setResumeLabel(parts[parts.length - 1] || 'Resume');
          }
          const transcriptDoc = docs.find((d: any) => d.type === 'transcript' || d.type === 'other');
          if (transcriptDoc) {
            const parts = String(transcriptDoc.file_url ?? '').split('/');
            setTranscriptLabel(parts[parts.length - 1] || 'Transcript');
          }
          const verifications = (candidate as any).verifications ?? [];
          const resumeRun = verifications.find((v: any) => v.run_type === 'resume');
          const transcriptRun = verifications.find((v: any) => v.run_type === 'transcript');
          const projectRun = verifications.find((v: any) => v.run_type === 'project_links');
          const fullRun = verifications.find((v: any) => v.run_type === 'full_profile');
          setResumeConfidence(resumeRun?.confidence ?? null);
          setTranscriptConfidence(transcriptRun?.confidence ?? null);
          setProjectsConfidence(projectRun?.confidence ?? null);
          setAggregateConfidence(fullRun?.confidence ?? null);
        })
        .catch((err: any) => {
          console.error("Failed to fetch candidate data:", err);
        });
    } catch (err) {
      console.error("Error reading candidate_id from localStorage:", err);
    }
  }, []);

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

  const openEditModal = () => setActivePanel("core");
  const closeEditModal = () => setActivePanel(null);

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

    try {
      const res = await apiCall("/api/candidates/register", "POST", formData);
      const candidateId =
        (res as any)?.data?.candidate_id ||
        localStorage.getItem("candidate_id") ||
        "";

      if (candidateId) {
        localStorage.setItem("candidate_id", candidateId);
        // Upload resume + transcript/testamur if provided
        await uploadDocument(candidateId, resumeFile, "resume");
        await uploadDocument(candidateId, transcriptFile, "other");
      }
      setActivePanel(null);
      console.log(res);
    } catch (err) {
      console.log(err);
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

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

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
    <Box className={styles.page} sx={{ minHeight: "100vh" }}>
      <header className="site-header">
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

      <main className={styles.main}>
        <div className={styles.container}>
          <section className={styles.hero}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>
                {name || 'Your profile'}, ready to shine.
              </h1>
              <p className={styles.heroSubtitle}>
                Finish your profile, drop in your resume and transcript, and keep your projects discoverable. We’ll verify in the background and surface you to the right recruiters.
              </p>
              <div className={styles.badgeRow} style={{ marginTop: 8 }}>
                <div className={styles.badgeWrapper}>
                  <div
                    className={`${styles.badgeGhost} ${styles[`badge-${confidenceBadge.status}`]}`}
                    onMouseEnter={() => setTooltipOpen('badge')}
                    onMouseLeave={() => setTooltipOpen(null)}
                  >
                    <span>{confidenceBadge.label}: {confidenceBadge.value}</span>
                    <span className={styles.infoDot}>?</span>
                    {tooltipOpen === 'badge' && (
                      <div className={`${styles.tooltip} ${styles.badgeTooltip}`}>
                        {confidenceBadge.tooltip}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.progressGrid}>
                {[
                  {
                    label: 'Resume',
                    hasDoc: Boolean(resumeFile || resumeLabel),
                    confidence: resumeConfidence,
                  },
                  {
                    label: 'Transcript',
                    hasDoc: Boolean(transcriptFile || transcriptLabel),
                    confidence: transcriptConfidence,
                  },
                  {
                    label: 'Projects',
                    hasDoc: Boolean(projects.length),
                    confidence: projectsConfidence,
                  },
                ].map((item) => {
                  const status = getVerificationStatus(item.confidence, item.hasDoc);
                  const key = `card-${item.label}`;
                  return (
                    <div className={`${styles.progressCard} ${styles[`card-${status}`]}`} key={item.label}>
                      <div className={styles.progressLabelRow}>
                        <div className={styles.progressLabel}>{item.label}</div>
                        <div
                          className={styles.infoWrap}
                          onMouseEnter={() => setTooltipOpen(key)}
                          onMouseLeave={() => setTooltipOpen(null)}
                        >
                          <span className={styles.infoDot}>?</span>
                          {tooltipOpen === key && (
                            <div className={styles.tooltip}>{statusTooltip(status)}</div>
                          )}
                        </div>
                      </div>
                      <div className={`${styles.progressBar} ${styles[`bar-${status}`]}`}>
                        <span className={`${styles.progressFill} ${item.hasDoc ? styles.progressOn : ''}`} />
                      </div>
                      <div className={styles.progressMeta}>
                        {item.hasDoc ? statusLabel(status) : 'Pending'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className={styles.heroPanel}>
              <div className={styles.panelSection}>
                <div className={styles.panelLabel}>Snapshot</div>
                <div className={styles.snapshotGrid}>
                  <div>
                    <div className={styles.snapshotLabel}>Name</div>
                    <div className={styles.snapshotValue}>{name || '—'}</div>
                  </div>
                  <div>
                    <div className={styles.snapshotLabel}>Email</div>
                    <div className={styles.snapshotValue}>{email || '—'}</div>
                  </div>
                  <div>
                    <div className={styles.snapshotLabel}>Current role</div>
                    <div className={styles.snapshotValue}>{isEmployed ? currentPosition || '—' : 'Not employed'}</div>
                  </div>
                  <div>
                    <div className={styles.snapshotLabel}>Location</div>
                    <div className={styles.snapshotValue}>{location || '—'}</div>
                  </div>
                  <div>
                    <div className={styles.snapshotLabel}>Visa</div>
                    <div className={styles.snapshotValue}>{visaStatus || '—'}</div>
                  </div>
                  <div>
                    <div className={styles.snapshotLabel}>Availability</div>
                    <div className={styles.snapshotValue}>{availabilityDate || '—'}</div>
                  </div>
                  <div>
                    <div className={styles.snapshotLabel}>Experience</div>
                    <div className={styles.snapshotValue}>
                      {isEmployed ? experienceYears || '—' : 'Not employed'}
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.panelSection}>
                <div className={styles.panelLabel}>Uploads</div>
                <div className={styles.uploadList}>
                  <div className={styles.uploadItem}>
                    <div>
                      <div className={styles.snapshotLabel}>Resume</div>
                      <div className={styles.snapshotValue}>{resumeFile?.name || resumeLabel || 'Attach PDF/DOC'}</div>
                    </div>
                    <button
                      className={styles.miniGhost}
                      onClick={() => {
                        setActivePanel("docs");
                        scrollToSection(coreRef);
                      }}
                    >
                      {resumeFile?.name || resumeLabel ? 'Update' : 'Add'}
                    </button>
                  </div>
                  <div className={styles.uploadItem}>
                    <div>
                      <div className={styles.snapshotLabel}>Transcript</div>
                      <div className={styles.snapshotValue}>{transcriptFile?.name || transcriptLabel || 'Attach transcript'}</div>
                    </div>
                    <button
                      className={styles.miniGhost}
                      onClick={() => {
                        setActivePanel("education");
                        scrollToSection(educationRef);
                      }}
                    >
                      {transcriptFile?.name || transcriptLabel ? 'Update' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.deck}>
            <div className={`${styles.card} ${styles.cardCore}`} ref={coreRef}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardEyebrow}>Core Profile</div>
                  <h3 className={styles.cardTitle}>Story & Skills</h3>
                </div>
                <button
                  className={styles.quick}
                  onClick={() => {
                    setActivePanel("core");
                    scrollToSection(coreRef);
                  }}
                >
                  Edit
                </button>
              </div>
              <div className={styles.chipGroup}>
                {skills.length ? skills.map((s, i) => <span key={i} className={styles.tag}>{s}</span>) : <div className={styles.empty}>Add your skills</div>}
              </div>
              <div className={styles.twoCol}>
                <div>
                  <div className={styles.fieldLabel}>Awards</div>
                  <div className={styles.chipGroup}>
                    {awards.length ? awards.map((a, i) => <span key={i} className={styles.tag}>{a}</span>) : <div className={styles.empty}>Add awards</div>}
                  </div>
                </div>
                <div>
                  <div className={styles.fieldLabel}>Certifications</div>
                  <div className={styles.chipGroup}>
                    {certifications.length ? certifications.map((c, i) => <span key={i} className={styles.tag}>{c}</span>) : <div className={styles.empty}>Add certifications</div>}
                  </div>
                </div>
              </div>
            </div>

            <div className={`${styles.card} ${styles.cardProjects}`} ref={projectsRef}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardEyebrow}>Projects</div>
                  <h3 className={styles.cardTitle}>Portfolio</h3>
                </div>
                <button
                  className={styles.quick}
                  onClick={() => {
                    setActivePanel("projects");
                    scrollToSection(projectsRef);
                  }}
                >
                  Add project
                </button>
              </div>
              {projects.length ? projects.map((p, i) => (
                <div key={i} className={styles.profileCard}>
                  <div className={styles.profileCardTitle}>{p.title || 'Untitled project'}</div>
                  <div className={styles.profileCardMeta}>{p.description || ''}</div>
                </div>
              )) : <div className={styles.empty}>Share what you’ve built — links encouraged.</div>}
            </div>

            <div className={`${styles.card} ${styles.cardEducation}`} ref={educationRef}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardEyebrow}>Education</div>
                  <h3 className={styles.cardTitle}>Degrees & transcript</h3>
                </div>
                <button
                  className={styles.quick}
                  onClick={() => {
                    setActivePanel("education");
                    scrollToSection(educationRef);
                  }}
                >
                  Add education
                </button>
              </div>
              {education.length ? education.map((edu, i) => (
                <div key={i} className={styles.profileCard}>
                  <div className={styles.profileCardTitle}>{edu.degree || 'Degree'}, {edu.school || ''}</div>
                  <div className={styles.profileCardMeta}>Graduation: {edu.graduation_year || '—'}</div>
                </div>
              )) : <div className={styles.empty}>Add your schools and upload a transcript.</div>}
            </div>

            <div className={`${styles.card} ${styles.cardExperience}`} ref={experienceRef}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardEyebrow}>Experience</div>
                  <h3 className={styles.cardTitle}>Previous positions</h3>
                </div>
                <button
                  className={styles.quick}
                  onClick={() => {
                    setActivePanel("experience");
                    scrollToSection(experienceRef);
                  }}
                >
                  Add experience
                </button>
              </div>
              {previousPositions.length ? previousPositions.map((pos, i) => (
                <div key={i} className={styles.profileCard}>
                  <div className={styles.profileCardTitle}>{pos.title || 'Title'} at {pos.org || 'Organization'}</div>
                  <div className={styles.profileCardMeta}>{pos.start_date || ''} — {pos.end_date || ''}</div>
                </div>
              )) : <div className={styles.empty}>Add your past roles.</div>}
            </div>
          </section>
        </div>
      </main>

        {activePanel && (
          <div className={styles.modalOverlay} role="dialog" aria-modal="true">
            <div className={`${styles.modalContent} ${styles.panelContent}`}>
              <div className={styles.modalHeader}>
                <div className={styles.modalTitle}>
                  {activePanel === 'core' && 'Core profile'}
                  {activePanel === 'projects' && 'Projects'}
                  {activePanel === 'education' && 'Education & transcript'}
                  {activePanel === 'experience' && 'Previous positions'}
                  {activePanel === 'docs' && 'Upload resume'}
                </div>
                <button className={`${styles.modalClose}`} onClick={closeEditModal} disabled={isSaving} aria-label="Close">×</button>
              </div>

              <form id="applicant-form" onSubmit={handleSubmit} className={styles.modalBody}>
                {activePanel === 'core' && (
                  <>
                    <div className={styles.modalRow}>
                      <div className={styles.modalLabel}>Full name</div>
                      <input className={styles.modalInput} value={name} onChange={(e) => setName(e.target.value)} required disabled={isSaving} />
                    </div>
                    <div className={styles.modalRow}>
                      <div className={styles.modalLabel}>Email</div>
                      <input className={styles.modalInput} value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isSaving} />
                    </div>
                    <div className={styles.modalRow}>
                      <div className={styles.modalLabel}>Age</div>
                      <input type="number" className={styles.modalInput} value={age} onChange={(e) => setAge(e.target.value)} disabled={isSaving} />
                    </div>
                    <div className={styles.modalRow} style={{ alignItems: 'center' }}>
                      <div className={styles.modalLabel}>Employment</div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={isEmployed}
                          onChange={(e) => {
                            const next = e.target.checked;
                            setIsEmployed(next);
                            if (!next) {
                              setExperienceYears("");
                              setSalaryExpectation("");
                              setCurrentPosition("Not employed");
                            }
                          }}
                          disabled={isSaving}
                        />
                        <span>Currently employed</span>
                      </label>
                    </div>
                    <div className={styles.modalRow}>
                      <div className={styles.modalLabel}>Current Position</div>
                      <input className={styles.modalInput} value={currentPosition} onChange={(e) => setCurrentPosition(e.target.value)} disabled={isSaving || !isEmployed} placeholder={isEmployed ? '' : 'Not employed'} />
                    </div>
                    <div className={styles.modalRow}>
                      <div className={styles.modalLabel}>Location</div>
                      <input className={styles.modalInput} value={location} onChange={(e) => setLocation(e.target.value)} disabled={isSaving} />
                    </div>
                    <div className={styles.modalRow}>
                      <div className={styles.modalLabel}>Visa / Work Status</div>
                      <input className={styles.modalInput} value={visaStatus} onChange={(e) => setVisaStatus(e.target.value)} disabled={isSaving} />
                    </div>
                    <div className={styles.modalRow}>
                      <div className={styles.modalLabel}>Years of Experience</div>
                      <input type="number" className={styles.modalInput} value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} disabled={isSaving || !isEmployed} placeholder={isEmployed ? '' : 'Not applicable'} />
                    </div>
                    <div className={styles.modalRow}>
                      <div className={styles.modalLabel}>Salary Expectation</div>
                      <input type="number" className={styles.modalInput} value={salaryExpectation} onChange={(e) => setSalaryExpectation(e.target.value)} disabled={isSaving || !isEmployed} placeholder={isEmployed ? '' : 'Not applicable'} />
                    </div>
                    <div className={styles.modalRow}>
                      <div className={styles.modalLabel}>Availability Date</div>
                      <input type="date" className={styles.modalInput} value={availabilityDate} onChange={(e) => setAvailabilityDate(e.target.value)} disabled={isSaving} />
                    </div>
                    <ChipInput label="Skills" values={skills} setValues={setSkills} disabled={isSaving} />
                    <ChipInput label="Awards" values={awards} setValues={setAwards} disabled={isSaving} />
                    <ChipInput label="Certifications" values={certifications} setValues={setCertifications} disabled={isSaving} />
                  </>
                )}

                {activePanel === 'projects' && (
                  <>
                    <div className={styles.modalLabel} style={{ marginBottom: 8 }}>Projects</div>
                    {projects.map((p, i) => (
                      <div key={i} className={styles.profileCard}>
                        <div className={styles.modalRow}>
                          <input className={styles.modalInput} placeholder="Project Title" value={p.title} onChange={(e) => updateProject(i, 'title', e.target.value)} disabled={isSaving} />
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <textarea className={styles.modalTextarea} placeholder="Project Description" value={p.description} onChange={(e) => updateProject(i, 'description', e.target.value)} disabled={isSaving} />
                        </div>
                        <div className={styles.cardControls}>
                          <button type="button" className={`${styles.modalBtn} ${styles.ghost}`} onClick={() => removeProject(i)} disabled={isSaving}>Remove</button>
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop: 8 }}>
                      <button type="button" className={`${styles.modalBtn} ${styles.ghost}`} onClick={addProject} disabled={isSaving}>Add Project</button>
                    </div>
                  </>
                )}

                {activePanel === 'experience' && (
                  <>
                    <div className={styles.modalLabel} style={{ marginBottom: 8 }}>Previous Positions</div>
                    {previousPositions.map((pos, index) => (
                      <div key={index} className={styles.profileCard}>
                        <div className={styles.modalRow}>
                          <input className={styles.modalInput} placeholder="Title" value={pos.title} onChange={(e) => updatePreviousPosition(index, 'title', e.target.value)} disabled={isSaving} />
                          <input className={styles.modalInput} placeholder="Organization" value={pos.org} onChange={(e) => updatePreviousPosition(index, 'org', e.target.value)} disabled={isSaving} />
                        </div>
                        <div className={styles.modalRow} style={{ marginTop: 8 }}>
                          <input type="date" className={styles.modalInput} value={pos.start_date} onChange={(e) => updatePreviousPosition(index, 'start_date', e.target.value)} disabled={isSaving} />
                          <input type="date" className={styles.modalInput} value={pos.end_date} onChange={(e) => updatePreviousPosition(index, 'end_date', e.target.value)} disabled={isSaving} />
                        </div>
                        <div className={styles.cardControls}>
                          <button type="button" className={`${styles.modalBtn} ${styles.ghost}`} onClick={() => removePreviousPosition(index)} disabled={isSaving}>Remove</button>
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop: 8 }}>
                      <button type="button" className={`${styles.modalBtn} ${styles.ghost}`} onClick={addPreviousPosition} disabled={isSaving}>Add Previous Position</button>
                    </div>
                  </>
                )}

                {activePanel === 'education' && (
                  <>
                    <div className={styles.modalLabel} style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Education</span>
                      <label style={{ fontSize: 12, opacity: 0.85 }}>
                        Upload transcript
                        <input
                          type="file"
                          accept=".pdf,.txt,.doc,.docx"
                          onChange={(e) => setTranscriptFile(e.target.files?.[0] ?? null)}
                          disabled={isSaving}
                          style={{ display: 'block', marginTop: 4 }}
                        />
                      </label>
                      {transcriptFile ? <div style={{ fontSize: 12, opacity: 0.8 }}>Selected: {transcriptFile.name}</div> : null}
                    </div>
                    {education.map((edu, index) => (
                      <div key={index} className={styles.profileCard}>
                        <div className={styles.modalRow}>
                          <input className={styles.modalInput} placeholder="Degree" value={edu.degree} onChange={(e) => updateEducation(index, 'degree', e.target.value)} disabled={isSaving} />
                          <input className={styles.modalInput} placeholder="School" value={edu.school} onChange={(e) => updateEducation(index, 'school', e.target.value)} disabled={isSaving} />
                        </div>
                        <div className={styles.modalRow} style={{ marginTop: 8 }}>
                          <input type="number" className={styles.modalInput} placeholder="Graduation Year" value={edu.graduation_year} onChange={(e) => updateEducation(index, 'graduation_year', e.target.value)} disabled={isSaving} />
                        </div>
                        <div className={styles.cardControls}>
                          <button type="button" className={`${styles.modalBtn} ${styles.ghost}`} onClick={() => removeEducation(index)} disabled={isSaving}>Remove</button>
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop: 8 }}>
                      <button type="button" className={`${styles.modalBtn} ${styles.ghost}`} onClick={addEducation} disabled={isSaving}>Add Education Entry</button>
                    </div>
                  </>
                )}

                {activePanel === 'docs' && (
                  <div className={styles.modalRow} style={{ marginTop: 8 }}>
                    <div className={styles.modalLabel}>Resume</div>
                    <input
                      type="file"
                      className={styles.modalInput}
                      accept=".pdf,.txt,.doc,.docx"
                      onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                      disabled={isSaving}
                    />
                    {resumeFile ? <div style={{ fontSize: 12, opacity: 0.8 }}>Selected: {resumeFile.name}</div> : null}
                  </div>
                )}

                <div className={styles.modalActions}>
                  <button type="button" className={`${styles.modalBtn} ${styles.ghost}`} onClick={closeEditModal} disabled={isSaving}>Cancel</button>
                  <button type="submit" className={`${styles.modalBtn} primary`} disabled={isSaving}>
                    {isSaving ? (<span className="spinner" />) : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Box>
  );
}
