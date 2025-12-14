"use client";

import { JSX, SyntheticEvent, useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  AppBar,
  Toolbar,
  Stack,
  IconButton,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { apiCall } from "@/lib/utils";
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
}

function ChipInput({ label, values, setValues }: ChipInputProps) {
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
      />
      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
        {values.map((value, index) => (
          <Chip
            key={index}
            label={value}
            onDelete={() =>
              setValues(values.filter((_, i) => i !== index))
            }
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

  /* =======================
     Submit
  ======================= */

  const handleSubmit = (e: SyntheticEvent): void => {
    e.preventDefault();

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

    apiCall("/api/candidates/register", "POST", formData)
      .then((res) => {
        router.push('/applicant/details');
        console.log(res)
        })
      .catch((err) => console.log(err));
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
    <Box sx={{ minHeight: "100vh", bgcolor: "grey.100" }}>
      <AppBar position="static" elevation={1} color="default">
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6" fontWeight={600}>
            Applicant Profile
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
        <Paper sx={{ width: "100%", maxWidth: 900, p: 4, borderRadius: 3 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Submit your details
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
            <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <TextField label="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
            <TextField label="Current Position" value={currentPosition} onChange={(e) => setCurrentPosition(e.target.value)} />
            <TextField label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
            <TextField label="Visa / Work Status" value={visaStatus} onChange={(e) => setVisaStatus(e.target.value)} />
            <TextField label="Years of Experience" type="number" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} />
            <TextField label="Salary Expectation" type="number" value={salaryExpectation} onChange={(e) => setSalaryExpectation(e.target.value)} />
            <TextField label="Availability Date" type="date" value={availabilityDate} onChange={(e) => setAvailabilityDate(e.target.value)} InputLabelProps={{ shrink: true }} />

            <ChipInput label="Skills" values={skills} setValues={setSkills} />
            <ChipInput label="Awards" values={awards} setValues={setAwards} />
            <ChipInput label="Certifications" values={certifications} setValues={setCertifications} />

            {/* Projects */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">Projects</Typography>
              {projects.map((p, i) => (
                <Stack key={i} spacing={1} sx={{ mt: 1 }}>
                  <TextField label="Project Title" value={p.title} onChange={(e) => updateProject(i, "title", e.target.value)} />
                  <TextField label="Project Description" value={p.description} onChange={(e) => updateProject(i, "description", e.target.value)} multiline minRows={2} />
                  <Button color="error" onClick={() => removeProject(i)}>
                    Remove Project
                  </Button>
                </Stack>
              ))}
              <Button onClick={addProject} sx={{ mt: 1 }}>
                Add Project
              </Button>
            </Box>

            {/* Previous Positions */}
            <Box>
              <Typography variant="subtitle1">Previous Positions</Typography>
              {previousPositions.map((pos, index) => (
                <Stack key={index} direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                  <TextField label="Title" value={pos.title} onChange={(e) => updatePreviousPosition(index, "title", e.target.value)} />
                  <TextField label="Organization" value={pos.org} onChange={(e) => updatePreviousPosition(index, "org", e.target.value)} />
                  <TextField label="Start Date" type="date" value={pos.start_date} onChange={(e) => updatePreviousPosition(index, "start_date", e.target.value)} InputLabelProps={{ shrink: true }} />
                  <TextField label="End Date" type="date" value={pos.end_date} onChange={(e) => updatePreviousPosition(index, "end_date", e.target.value)} InputLabelProps={{ shrink: true }} />
                  <IconButton color="error" onClick={() => removePreviousPosition(index)}>
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              ))}
              <Button onClick={addPreviousPosition} sx={{ mt: 1 }}>
                Add Previous Position
              </Button>
            </Box>

            {/* Education */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">Education</Typography>
              {education.map((edu, index) => (
                <Stack key={index} direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                  <TextField label="Degree" value={edu.degree} onChange={(e) => updateEducation(index, "degree", e.target.value)} />
                  <TextField label="School" value={edu.school} onChange={(e) => updateEducation(index, "school", e.target.value)} />
                  <TextField label="Graduation Year" type="number" value={edu.graduation_year} onChange={(e) => updateEducation(index, "graduation_year", e.target.value)} />
                  <IconButton color="error" onClick={() => removeEducation(index)}>
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              ))}
              <Button onClick={addEducation} sx={{ mt: 1 }}>
                Add Education Entry
              </Button>
            </Box>

            <Button type="submit" variant="contained" size="large" sx={{ mt: 3 }}>
              Submit Application
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
