"use client"

import { useState } from "react";
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
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import { apiCall } from "@/lib/utils";

export default function ApplicantFormPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [currentPosition, setCurrentPosition] = useState("");
  const [location, setLocation] = useState("");
  const [visaStatus, setVisaStatus] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [salaryExpectation, setSalaryExpectation] = useState("");
  const [availabilityDate, setAvailabilityDate] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [awardsText, setAwardsText] = useState("");
  const [certificationsText, setCertificationsText] = useState("");
  const [projectsText, setProjectsText] = useState("");
  const [previousPositions, setPreviousPositions] = useState([]);
  const [education, setEducation] = useState([]);

  const handleLogout = () => console.log("Logged out");

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = {
      name,
      email,
      age: age ? Number(age) : undefined,
      current_position: currentPosition,
      location,
      visa_status: visaStatus,
      experience_years: experienceYears ? Number(experienceYears) : undefined,
      salary_expectation: salaryExpectation ? Number(salaryExpectation) : undefined,
      availability_date: availabilityDate,
      skills_text: skillsText,
      awards_text: awardsText,
      certifications_text: certificationsText,
      projects_text: projectsText,
      previous_positions: previousPositions,
      education,
    };
    apiCall('/api/candidates/register', 'POST', formData)
        .then((res) => {
            console.log(res);
        })
        .catch((err) => {
            console.log(err);
        });
  };

  const addPreviousPosition = () => setPreviousPositions([...previousPositions, { title: '', org: '', start_date: '', end_date: '' }]);
  const updatePreviousPosition = (index, key, value) => {
    const newPositions = [...previousPositions];
    newPositions[index][key] = value;
    setPreviousPositions(newPositions);
  };
  const removePreviousPosition = (index) => {
    const newPositions = previousPositions.filter((_, i) => i !== index);
    setPreviousPositions(newPositions);
  };

  const addEducation = () => setEducation([...education, { degree: '', school: '', graduation_year: '' }]);
  const updateEducation = (index, key, value) => {
    const newEdu = [...education];
    newEdu[index][key] = value;
    setEducation(newEdu);
  };
  const removeEducation = (index) => setEducation(education.filter((_, i) => i !== index));

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "grey.100" }}>
      <AppBar position="static" elevation={1} color="default">
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6" fontWeight={600}>Applicant Profile</Typography>
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
        <Paper sx={{ width: "100%", maxWidth: 900, p: 4, borderRadius: 3 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>Submit your details</Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 3 }}>
            <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
            <TextField label="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} fullWidth />
            <TextField label="Current Position" value={currentPosition} onChange={(e) => setCurrentPosition(e.target.value)} fullWidth />
            <TextField label="Location" value={location} onChange={(e) => setLocation(e.target.value)} fullWidth />
            <TextField label="Visa / Work Status" value={visaStatus} onChange={(e) => setVisaStatus(e.target.value)} fullWidth />
            <TextField label="Years of Experience" type="number" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} fullWidth />
            <TextField label="Salary Expectation" type="number" value={salaryExpectation} onChange={(e) => setSalaryExpectation(e.target.value)} fullWidth />
            <TextField label="Availability Date" type="date" value={availabilityDate} onChange={(e) => setAvailabilityDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="Skills" value={skillsText} onChange={(e) => setSkillsText(e.target.value)} multiline minRows={2} fullWidth />
            <TextField label="Awards" value={awardsText} onChange={(e) => setAwardsText(e.target.value)} multiline minRows={2} fullWidth />
            <TextField label="Certifications" value={certificationsText} onChange={(e) => setCertificationsText(e.target.value)} multiline minRows={2} fullWidth />
            <TextField label="Projects" value={projectsText} onChange={(e) => setProjectsText(e.target.value)} multiline minRows={2} fullWidth />

            <Box>
              <Typography variant="subtitle1">Previous Positions</Typography>
              {previousPositions.map((pos, index) => (
                <Stack key={index} direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                  <TextField label="Title" value={pos.title} onChange={(e) => updatePreviousPosition(index, 'title', e.target.value)} />
                  <TextField label="Organization" value={pos.org} onChange={(e) => updatePreviousPosition(index, 'org', e.target.value)} />
                  <TextField label="Start Date" type="date" value={pos.start_date} onChange={(e) => updatePreviousPosition(index, 'start_date', e.target.value)} InputLabelProps={{ shrink: true }} />
                  <TextField label="End Date" type="date" value={pos.end_date} onChange={(e) => updatePreviousPosition(index, 'end_date', e.target.value)} InputLabelProps={{ shrink: true }} />
                  <IconButton color="error" onClick={() => removePreviousPosition(index)}><DeleteIcon /></IconButton>
                </Stack>
              ))}
              <Button onClick={addPreviousPosition} sx={{ mt: 1 }}>Add Previous Position</Button>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">Education</Typography>
              {education.map((edu, index) => (
                <Stack key={index} direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                  <TextField label="Degree" value={edu.degree} onChange={(e) => updateEducation(index, 'degree', e.target.value)} />
                  <TextField label="School" value={edu.school} onChange={(e) => updateEducation(index, 'school', e.target.value)} />
                  <TextField label="Graduation Year" type="number" value={edu.graduation_year} onChange={(e) => updateEducation(index, 'graduation_year', e.target.value)} />
                  <IconButton color="error" onClick={() => removeEducation(index)}><DeleteIcon /></IconButton>
                </Stack>
              ))}
              <Button onClick={addEducation} sx={{ mt: 1 }}>Add Education Entry</Button>
            </Box>

            <Button type="submit" variant="contained" size="large" sx={{ mt: 3 }}>Submit Application</Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
