"use client";

import { JSX, SyntheticEvent, useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  IconButton,
  Chip,
  CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import { apiCall } from "@/lib/utils";
import Link from "next/link";
import styles from "../recruiter_query_page/recruiter_query_page.module.css";
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
    <Box>
      <TextField
        label={label}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addValue();
          }
        }}
        fullWidth
        variant="filled"
        disabled={disabled}
        sx={{
          '& .MuiFilledInput-root': { background: 'rgba(255,255,255,0.04)', color: 'white' },
          '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
        }}
      />
      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
        {values.map((value, index) => (
          <Chip
            key={index}
            label={value}
            onDelete={() =>
              setValues(values.filter((_, i) => i !== index))
            }
            sx={{ background: 'rgba(255,255,255,0.06)', color: 'inherit' }}
            disabled={disabled}
          />
        ))}
      </Stack>
    </Box>
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
    <Box sx={{ minHeight: "100vh", bgcolor: "#07090b", color: 'text.primary' }}>
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
              <Button color="inherit" onClick={handleLogout} sx={{ color: 'white' }}>
                Logout
              </Button>
            </div>
          </div>
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
                  <div><strong>Name:</strong> {name || '—'}</div>
                  <div><strong>Email:</strong> {email || '—'}</div>
                  <div><strong>Age:</strong> {age || '—'}</div>
                  <div><strong>Current Position:</strong> {currentPosition || '—'}</div>
                  <div><strong>Location:</strong> {location || '—'}</div>
                  <div><strong>Visa / Work Status:</strong> {visaStatus || '—'}</div>
                  <div><strong>Years of Experience:</strong> {experienceYears || '—'}</div>
                  <div><strong>Salary Expectation:</strong> {salaryExpectation || '—'}</div>
                  <div><strong>Availability Date:</strong> {availabilityDate || '—'}</div>
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
                    <div key={i} style={{ marginTop: 8 }}>
                      <div style={{ fontWeight: 700, color: 'white' }}>{p.title}</div>
                      <div style={{ color: 'rgba(255,255,255,0.8)' }}>{p.description}</div>
                    </div>
                  )) : <div style={{ marginTop: 8 }}>—</div>}
                </div>

                <div style={{ marginTop: 16 }}>
                  <div className={styles.sectionTitle}>Previous Positions</div>
                  {previousPositions.length ? previousPositions.map((pos, i) => (
                    <div key={i} style={{ marginTop: 8 }}>
                      <div style={{ fontWeight: 700, color: 'white' }}>{pos.title} at {pos.org}</div>
                      <div style={{ color: 'rgba(255,255,255,0.8)' }}>{pos.start_date} — {pos.end_date}</div>
                    </div>
                  )) : <div style={{ marginTop: 8 }}>—</div>}
                </div>

                <div style={{ marginTop: 16 }}>
                  <div className={styles.sectionTitle}>Education</div>
                  {education.length ? education.map((edu, i) => (
                    <div key={i} style={{ marginTop: 8 }}>
                      <div style={{ fontWeight: 700, color: 'white' }}>{edu.degree}, {edu.school}</div>
                      <div style={{ color: 'rgba(255,255,255,0.8)' }}>Graduation: {edu.graduation_year}</div>
                    </div>
                  )) : <div style={{ marginTop: 8 }}>—</div>}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

        <Dialog open={openEdit} onClose={closeEditModal} fullWidth maxWidth="md" PaperProps={{ sx: { background: 'rgba(16,16,16,0.95)', color: 'white' } }}>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
            Edit Applicant
            <IconButton onClick={closeEditModal} size="small" disabled={isSaving}><CloseIcon sx={{ color: 'white' }} /></IconButton>
          </DialogTitle>
          <DialogContent>
            <Box id="applicant-form" component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} required variant="filled" sx={filledInputSx} disabled={isSaving} />
              <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} required variant="filled" sx={filledInputSx} disabled={isSaving} />
              <TextField label="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} variant="filled" sx={filledInputSx} disabled={isSaving} />
              <TextField label="Current Position" value={currentPosition} onChange={(e) => setCurrentPosition(e.target.value)} variant="filled" sx={filledInputSx} disabled={isSaving} />
              <TextField label="Location" value={location} onChange={(e) => setLocation(e.target.value)} variant="filled" sx={filledInputSx} disabled={isSaving} />
              <TextField label="Visa / Work Status" value={visaStatus} onChange={(e) => setVisaStatus(e.target.value)} variant="filled" sx={filledInputSx} disabled={isSaving} />
              <TextField label="Years of Experience" type="number" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} variant="filled" sx={filledInputSx} disabled={isSaving} />
              <TextField label="Salary Expectation" type="number" value={salaryExpectation} onChange={(e) => setSalaryExpectation(e.target.value)} variant="filled" sx={filledInputSx} disabled={isSaving} />
              <TextField label="Availability Date" type="date" value={availabilityDate} onChange={(e) => setAvailabilityDate(e.target.value)} InputLabelProps={{ shrink: true }} variant="filled" sx={filledInputSx} disabled={isSaving} />

              <ChipInput label="Skills" values={skills} setValues={setSkills} disabled={isSaving} />
              <ChipInput label="Awards" values={awards} setValues={setAwards} disabled={isSaving} />
              <ChipInput label="Certifications" values={certifications} setValues={setCertifications} disabled={isSaving} />

              {/* Projects */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Projects</Typography>
                {projects.map((p, i) => (
                  <Stack key={i} spacing={1} sx={{ mt: 1 }}>
                    <TextField label="Project Title" value={p.title} onChange={(e) => updateProject(i, "title", e.target.value)} disabled={isSaving} />
                    <TextField label="Project Description" value={p.description} onChange={(e) => updateProject(i, "description", e.target.value)} multiline minRows={2} disabled={isSaving} />
                    <Button color="error" onClick={() => removeProject(i)} disabled={isSaving}>
                      Remove Project
                    </Button>
                  </Stack>
                ))}
                <Button onClick={addProject} sx={{ mt: 1 }} disabled={isSaving}>
                  Add Project
                </Button>
              </Box>

              {/* Previous Positions */}
              <Box>
                <Typography variant="subtitle1">Previous Positions</Typography>
                {previousPositions.map((pos, index) => (
                  <Stack key={index} direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                    <TextField label="Title" value={pos.title} onChange={(e) => updatePreviousPosition(index, "title", e.target.value)} disabled={isSaving} />
                    <TextField label="Organization" value={pos.org} onChange={(e) => updatePreviousPosition(index, "org", e.target.value)} disabled={isSaving} />
                    <TextField label="Start Date" type="date" value={pos.start_date} onChange={(e) => updatePreviousPosition(index, "start_date", e.target.value)} InputLabelProps={{ shrink: true }} disabled={isSaving} />
                    <TextField label="End Date" type="date" value={pos.end_date} onChange={(e) => updatePreviousPosition(index, "end_date", e.target.value)} InputLabelProps={{ shrink: true }} disabled={isSaving} />
                    <IconButton color="error" onClick={() => removePreviousPosition(index)} disabled={isSaving}>
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                ))}
                <Button onClick={addPreviousPosition} sx={{ mt: 1 }} disabled={isSaving}>
                  Add Previous Position
                </Button>
              </Box>

              {/* Education */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Education</Typography>
                {education.map((edu, index) => (
                  <Stack key={index} direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                    <TextField label="Degree" value={edu.degree} onChange={(e) => updateEducation(index, "degree", e.target.value)} disabled={isSaving} />
                    <TextField label="School" value={edu.school} onChange={(e) => updateEducation(index, "school", e.target.value)} disabled={isSaving} />
                    <TextField label="Graduation Year" type="number" value={edu.graduation_year} onChange={(e) => updateEducation(index, "graduation_year", e.target.value)} disabled={isSaving} />
                    <IconButton color="error" onClick={() => removeEducation(index)} disabled={isSaving}>
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                ))}
                <Button onClick={addEducation} sx={{ mt: 1 }} disabled={isSaving}>
                  Add Education Entry
                </Button>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeEditModal} disabled={isSaving}>Cancel</Button>
            <Button
              type="submit"
              form="applicant-form"
              variant="contained"
              disabled={isSaving}
              startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : undefined}
              sx={{
                background: 'linear-gradient(90deg,#7c3aed,#06b6d4)',
                color: 'white',
                '&:hover': { opacity: 0.95 },
              }}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
}
