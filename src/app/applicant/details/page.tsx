"use client"

import { useState, type ReactNode } from "react";
import {
  Box,
  Paper,
  Typography,
  AppBar,
  Toolbar,
  Button,
  Chip,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { useRouter } from "next/navigation";

type ApplicationForm = {
  name: string;
  email: string;
  location: string;
  visaStatus: string;
  skills: string[];
  experience: string;
  jobHistory: string;
  certifications: string;
  resumeName: string;
  status: string;
};

const initialApplication: ApplicationForm = {
  name: "Jane Doe",
  email: "jane.doe@example.com",
  location: "Sydney, Australia",
  visaStatus: "Permanent Resident",
  skills: ["JavaScript", "React", "Node.js"],
  experience:
    "3+ years experience building full-stack web applications in React and Node.js.",
  jobHistory:
    "Frontend Engineer at Acme Corp (2022–Present)\nJunior Developer at Beta Labs (2020–2022)",
  certifications: "AWS Certified Cloud Practitioner",
  resumeName: "Jane_Doe_Resume.pdf",
  status: "Submitted",
};

export default function ApplicationDetailsPage() {
  const [application, setApplication] = useState<ApplicationForm>(initialApplication);

  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<ApplicationForm>(initialApplication);
  const router = useRouter();
  const handleLogout = () => {
    router.push('/');
    console.log("Logged out");
  };

  const handleSave = () => {
    const normalizedSkills = Array.isArray(editData.skills)
      ? editData.skills
      : String(editData.skills)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

    setApplication({
      ...editData,
      skills: normalizedSkills,
    });
    setEditOpen(false);
  };

  const Section = ({ title, children }: { title: string; children: ReactNode }) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      {children}
    </Box>
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "grey.100" }}>
      <AppBar position="static" elevation={1} color="default">
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6" fontWeight={600}>
            My Application
          </Typography>
          <Button color="primary" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
        <Paper sx={{ width: "100%", maxWidth: 900, p: 4, borderRadius: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
            <Typography variant="h5" fontWeight={600}>
              Application details
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Chip label={application.status} variant="outlined" />
              <Button variant="outlined" onClick={() => setEditOpen(true)}>
                Edit
              </Button>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Section title="Personal information">
            <Typography>Name: {application.name}</Typography>
            <Typography>Email: {application.email}</Typography>
            <Typography>Location: {application.location}</Typography>
            <Typography>Visa status: {application.visaStatus}</Typography>
          </Section>

          <Section title="Skills">
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {application.skills.map((skill, idx) => (
                <Chip key={idx} label={skill} />
              ))}
            </Stack>
          </Section>

          <Section title="Professional experience">
            <Typography whiteSpace="pre-line">
              {application.experience}
            </Typography>
          </Section>

          <Section title="Job history">
            <Typography whiteSpace="pre-line">
              {application.jobHistory}
            </Typography>
          </Section>

          <Section title="Certifications">
            <Typography>{application.certifications}</Typography>
          </Section>

          <Section title="Resume">
            <Typography color="primary">{application.resumeName}</Typography>
          </Section>
        </Paper>
      </Box>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Edit application</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Full name"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          />
          <TextField
            label="Email"
            value={editData.email}
            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
          />
          <TextField
            label="Location"
            value={editData.location}
            onChange={(e) => setEditData({ ...editData, location: e.target.value })}
          />
          <TextField
            label="Visa status"
            value={editData.visaStatus}
            onChange={(e) => setEditData({ ...editData, visaStatus: e.target.value })}
          />
          <TextField
            label="Skills (comma separated)"
            value={
              Array.isArray(editData.skills)
                ? editData.skills.join(", ")
                : editData.skills
            }
            onChange={(e) =>
              setEditData({
                ...editData,
                skills: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
          <TextField
            label="Experience"
            multiline
            minRows={3}
            value={editData.experience}
            onChange={(e) => setEditData({ ...editData, experience: e.target.value })}
          />
          <TextField
            label="Job history"
            multiline
            minRows={3}
            value={editData.jobHistory}
            onChange={(e) => setEditData({ ...editData, jobHistory: e.target.value })}
          />
          <TextField
            label="Certifications"
            value={editData.certifications}
            onChange={(e) => setEditData({ ...editData, certifications: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
