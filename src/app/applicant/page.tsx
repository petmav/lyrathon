"use client";

import { JSX, SyntheticEvent, useState, useEffect } from "react";
import { Box, Button, Stack } from "@mui/material";
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
  const [openEdit, setOpenEdit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
        })
        .catch((err: any) => {
          console.error("Failed to fetch candidate data:", err);
        });
    } catch (err) {
      console.error("Error reading candidate_id from localStorage:", err);
    }
  }, []);

  const router = useRouter();
  const handleLogout = (): void => {
    router.push('/');
    localStorage.removeItem("candidate_id");
    console.log("Logged out");
  };

  const openEditModal = () => setOpenEdit(true);
  const closeEditModal = () => setOpenEdit(false);

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
      current_position: currentPosition || undefined,
      location: location || undefined,
      visa_status: visaStatus || undefined,
      experience_years: experienceYears ? Number(experienceYears) : undefined,
      salary_expectation: salaryExpectation ? Number(salaryExpectation) : undefined,
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
      // close modal if open and navigate to details
      setOpenEdit(false);
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

  /* =======================
     Render
  ======================= */

  return (
    // Use the recruiter page `page` class so the global dark background and text variables apply
    <Box className={styles.page} sx={{ minHeight: "100vh" }}>
      <header className={styles.header}>
          <div className={`${styles.container} ${styles.headerInner}`}>
            <div className={styles.brandRow}>
              <div className={styles.brand}>
                <span className={styles.brandMark}>L</span>
                <span className={styles.brandText}>Linkdr</span>
                <p className={styles.eyebrow}>Applicant Profile</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Link className={styles.back} href="/">← Back to home</Link>
              </div>
            </div>
          </div>
          {/* Logout positioned to the far-right edge of the header */}
          <div className={styles.logoutWrap}>
            <Button color="inherit" onClick={handleLogout} sx={{ color: 'white' }}>
              Logout
            </Button>
          </div>
      </header>

      <main className={styles.main}>
        <div className={styles.container}>
          <section className={styles.results}>
            <div className={styles.shortlistBlock}>
              <div className={styles.resultsHeader}>
                <h2 className={styles.sectionTitle}>Applicant Profile</h2>
                <div>
                  <button onClick={openEditModal} style={{ marginRight: 12 }} className={styles.quick}>Edit</button>
                </div>
              </div>

              <div style={{ padding: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div><span className={styles.fieldLabel}>Name:</span> {name || '—'}</div>
                  <div><span className={styles.fieldLabel}>Email:</span> {email || '—'}</div>
                  <div><span className={styles.fieldLabel}>Age:</span> {age || '—'}</div>
                  <div><span className={styles.fieldLabel}>Current Position:</span> {currentPosition || '—'}</div>
                  <div><span className={styles.fieldLabel}>Location:</span> {location || '—'}</div>
                  <div><span className={styles.fieldLabel}>Visa / Work Status:</span> {visaStatus || '—'}</div>
                  <div><span className={styles.fieldLabel}>Years of Experience:</span> {experienceYears || '—'}</div>
                  <div><span className={styles.fieldLabel}>Salary Expectation:</span> {salaryExpectation || '—'}</div>
                  <div><span className={styles.fieldLabel}>Availability Date:</span> {availabilityDate || '—'}</div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div className={styles.sectionTitle}>Skills</div>
                  <div className={styles.tags} style={{ marginTop: 8 }}>
                    {skills.length ? skills.map((s, i) => <span key={i} className={styles.tag}>{s}</span>) : <div>—</div>}
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div className={styles.sectionTitle}>Awards</div>
                  <div className={styles.tags} style={{ marginTop: 8 }}>
                    {awards.length ? awards.map((a, i) => <span key={i} className={styles.tag}>{a}</span>) : <div>—</div>}
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div className={styles.sectionTitle}>Certifications</div>
                  <div className={styles.tags} style={{ marginTop: 8 }}>
                    {certifications.length ? certifications.map((c, i) => <span key={i} className={styles.tag}>{c}</span>) : <div>—</div>}
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <div className={styles.sectionTitle}>Projects</div>
                  {projects.length ? projects.map((p, i) => (
                    <div key={i} className={styles.profileCard}>
                      <div className={styles.profileCardTitle}>{p.title || 'Untitled project'}</div>
                      <div className={styles.profileCardMeta}>{p.description || ''}</div>
                    </div>
                  )) : <div style={{ marginTop: 8 }}>—</div>}
                </div>

                <div style={{ marginTop: 16 }}>
                  <div className={styles.sectionTitle}>Previous Positions</div>
                  {previousPositions.length ? previousPositions.map((pos, i) => (
                    <div key={i} className={styles.profileCard}>
                      <div className={styles.profileCardTitle}>{pos.title || 'Title'} at {pos.org || 'Organization'}</div>
                      <div className={styles.profileCardMeta}>{pos.start_date || ''} — {pos.end_date || ''}</div>
                    </div>
                  )) : <div style={{ marginTop: 8 }}>—</div>}
                </div>

                <div style={{ marginTop: 16 }}>
                  <div className={styles.sectionTitle}>Education</div>
                  {education.length ? education.map((edu, i) => (
                    <div key={i} className={styles.profileCard}>
                      <div className={styles.profileCardTitle}>{edu.degree || 'Degree'}, {edu.school || ''}</div>
                      <div className={styles.profileCardMeta}>Graduation: {edu.graduation_year || '—'}</div>
                    </div>
                  )) : <div style={{ marginTop: 8 }}>—</div>}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

        {openEdit && (
          <div className={styles.modalOverlay} role="dialog" aria-modal="true">
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <div className={styles.modalTitle}>Edit Applicant</div>
                <button className={`${styles.modalClose}`} onClick={closeEditModal} disabled={isSaving} aria-label="Close">×</button>
              </div>

              <form id="applicant-form" onSubmit={handleSubmit} className={styles.modalBody}>
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

                <div className={styles.modalRow}>
                  <div className={styles.modalLabel}>Current Position</div>
                  <input className={styles.modalInput} value={currentPosition} onChange={(e) => setCurrentPosition(e.target.value)} disabled={isSaving} />
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
                  <input type="number" className={styles.modalInput} value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} disabled={isSaving} />
                </div>

                <div className={styles.modalRow}>
                  <div className={styles.modalLabel}>Salary Expectation</div>
                  <input type="number" className={styles.modalInput} value={salaryExpectation} onChange={(e) => setSalaryExpectation(e.target.value)} disabled={isSaving} />
                </div>

                <div className={styles.modalRow}>
                  <div className={styles.modalLabel}>Availability Date</div>
                  <input type="date" className={styles.modalInput} value={availabilityDate} onChange={(e) => setAvailabilityDate(e.target.value)} disabled={isSaving} />
                </div>

                <ChipInput label="Skills" values={skills} setValues={setSkills} disabled={isSaving} />
                <ChipInput label="Awards" values={awards} setValues={setAwards} disabled={isSaving} />
                <ChipInput label="Certifications" values={certifications} setValues={setCertifications} disabled={isSaving} />

                {/* Projects */}
                <div>
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
                </div>

                {/* Previous Positions */}
                <div>
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
                </div>

                {/* Education */}
                <div>
                  <div className={styles.modalLabel} style={{ marginBottom: 8 }}>Education</div>
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
                </div>

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
