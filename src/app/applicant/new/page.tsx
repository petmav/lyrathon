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
  Chip,
  Stack,
} from "@mui/material";

export default function ApplicantFormPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [jobHistory, setJobHistory] = useState("");
  const [certifications, setCertifications] = useState("");
  const [location, setLocation] = useState("");
  const [visaStatus, setVisaStatus] = useState("");
  const [resume, setResume] = useState(null);

  const handleLogout = () => {
    // Replace with real logout logic
    console.log("Logged out");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = {
      name,
      email,
      location,
      visaStatus,
      skills: skills.split(",").map((s) => s.trim()),
      experience,
      jobHistory,
      certifications,
      resume,
    };

    console.log(formData);
  };

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
        <Paper
          elevation={3}
          sx={{
            width: "100%",
            maxWidth: 800,
            p: 4,
            borderRadius: 3,
          }}
        >
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Submit your details
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            This information will be used to assess your application
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 3 }}
          >
            <TextField
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
            />

            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />

            <TextField
              label="Current location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, Country"
              fullWidth
            />

            <TextField
              label="Visa / work authorization status"
              value={visaStatus}
              onChange={(e) => setVisaStatus(e.target.value)}
              placeholder="Citizen, PR, Student visa, Sponsored, etc."
              fullWidth
            />

            <TextField
              label="Skills (comma separated)"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="JavaScript, React, Python"
              fullWidth
            />

            {skills && (
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {skills.split(",").map((skill, idx) => (
                  <Chip key={idx} label={skill.trim()} />
                ))}
              </Stack>
            )}

            <TextField
              label="Professional experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              multiline
              minRows={3}
              placeholder="Summary of your experience"
              fullWidth
            />

            <TextField
              label="Job history"
              value={jobHistory}
              onChange={(e) => setJobHistory(e.target.value)}
              multiline
              minRows={4}
              placeholder="Previous roles, companies, and responsibilities"
              fullWidth
            />

            <TextField
              label="Certifications"
              value={certifications}
              onChange={(e) => setCertifications(e.target.value)}
              multiline
              minRows={2}
              placeholder="AWS, GCP, Azure, etc."
              fullWidth
            />

            <Button variant="outlined" component="label">
              Upload resume (PDF)
              <input
                type="file"
                hidden
                accept="application/pdf"
                onChange={(e) => setResume(e.target.files[0])}
              />
            </Button>

            {resume && (
              <Typography variant="body2" color="text.secondary">
                Selected file: {resume.name}
              </Typography>
            )}

            <Button type="submit" variant="contained" size="large">
              Submit application
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
