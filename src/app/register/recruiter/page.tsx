"use client"
import { useState, FormEvent } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";

const highlights = [
  {
    title: "Deterministic filters",
    body: "Visa, location, salary, availability handled in SQL before LLM spend.",
  },
  {
    title: "Evidence-first shortlists",
    body: "Every match comes with rationale, risks, and next actions.",
  },
  {
    title: "Shareable outputs",
    body: "Export-ready cards to drop into hiring funnels or send to teams.",
  },
];

export default function RecruiterRegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!passwordsMatch) return;

    setLoading(true);
    try {
      // On success, redirect to login
      await new Promise(resolve => setTimeout(resolve, 2000));
      router.push("/recruiter_query_page");
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const accentGradient = "linear-gradient(135deg, #9a6bff 0%, #4fd1c5 100%)";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        position: "relative",
        padding: { xs: 3, md: 6 },
        background:
          "linear-gradient(180deg, rgba(5, 8, 20, 0.9), rgba(5, 8, 20, 0.96)), url(/bg.jpg) center/cover no-repeat",
        color: "#e8edf5",
      }}
    >
      <Box
        sx={{
          width: "min(1100px, 100%)",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" },
          gap: { xs: 3, md: 4 },
          alignItems: "start",
        }}
      >
        <Box
          sx={{
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.1)",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
            p: { xs: 3, md: 4 },
            boxShadow: "0 25px 60px rgba(0,0,0,0.45)",
            backdropFilter: "blur(16px)",
            display: "grid",
            gap: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                background: accentGradient,
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                color: "#050712",
                boxShadow: "0 15px 30px rgba(0,0,0,0.35)",
              }}
            >
              L
            </Box>
            <Box>
              <Typography fontWeight={800} letterSpacing={-0.3}>
                Linkdr
              </Typography>
              <Typography variant="body2" sx={{ color: "#b7c2d9" }}>
                Recruiter console
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "grid", gap: 1 }}>
            <Typography
              variant="h4"
              fontWeight={800}
              sx={{ letterSpacing: -0.4, lineHeight: 1.1 }}
            >
              Spin up a recruiter workspace in seconds.
            </Typography>
            <Typography variant="body1" sx={{ color: "#b7c2d9", maxWidth: 540 }}>
              One login to parse natural-language briefs, enforce hard filters, and deliver
              ranked, explainable shortlists you can share with hiring managers.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
            }}
          >
            {highlights.map((item) => (
              <Box
                key={item.title}
                sx={{
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.04)",
                  p: 2,
                  display: "grid",
                  alignContent: "start",
                  gap: 1,
                }}
              >
                <Typography fontWeight={700} sx={{ fontSize: "1rem" }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" sx={{ color: "#b7c2d9" }}>
                  {item.body}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Paper
          elevation={0}
          sx={{
            width: "100%",
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.05)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.45)",
            backdropFilter: "blur(18px)",
            color: "#e8edf5",
          }}
        >
          <Box sx={{ display: "grid", gap: 0.5, mb: 3 }}>
            <Typography variant="overline" sx={{ letterSpacing: 1.2, color: "#9a6bff" }}>
              For recruiters
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              Create a recruiter account
            </Typography>
            <Typography variant="body2" sx={{ color: "#b7c2d9" }}>
              Access the console, run semantic queries, and share shortlists with your team.
            </Typography>
          </Box>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <TextField
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              InputLabelProps={{ sx: { color: "#b7c2d9" } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 2,
                  color: "#e8edf5",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.35)" },
                  "&.Mui-focused fieldset": { borderColor: "#9a6bff" },
                },
              }}
            />

            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              InputLabelProps={{ sx: { color: "#b7c2d9" } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 2,
                  color: "#e8edf5",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.35)" },
                  "&.Mui-focused fieldset": { borderColor: "#9a6bff" },
                },
              }}
            />

            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              InputLabelProps={{ sx: { color: "#b7c2d9" } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 2,
                  color: "#e8edf5",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.35)" },
                  "&.Mui-focused fieldset": { borderColor: "#9a6bff" },
                },
              }}
            />

            <TextField
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={!passwordsMatch && confirmPassword.length > 0}
              helperText={
                !passwordsMatch && confirmPassword.length > 0
                  ? "Passwords do not match"
                  : ""
              }
              required
              fullWidth
              InputLabelProps={{ sx: { color: "#b7c2d9" } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 2,
                  color: "#e8edf5",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.35)" },
                  "&.Mui-focused fieldset": { borderColor: "#9a6bff" },
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || !passwordsMatch}
              sx={{
                mt: 1,
                borderRadius: 999,
                py: 1.3,
                fontWeight: 800,
                background: accentGradient,
                boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
                textTransform: "none",
                "&:hover": {
                  background: accentGradient,
                  filter: "brightness(1.05)",
                },
              }}
            >
              {loading ? <CircularProgress size={22} sx={{ color: "#050712" }} /> : "Create account"}
            </Button>
          </Box>
          {error && (
            <Typography variant="body2" color="error" align="center" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}

          <Typography
            variant="body2"
            sx={{ color: "#b7c2d9", mt: 3, textAlign: "center" }}
          >
            Already registered?{" "}
            <Link href={"/login"} style={{ color: "#9a6bff", fontWeight: 700 }}>
              Sign in
            </Link>
          </Typography>
        </Paper>
      </Box>

      <Box
        sx={{
          position: "absolute",
          right: 24,
          bottom: 16,
          display: "flex",
          gap: 4,
          alignItems: "center",
          color: "#b7c2d9",
          fontSize: "0.85rem",
          opacity: 0.9,
        }}
      >
        <Link href="/privacy" style={{ color: "inherit", textDecoration: "none" }}>
          Privacy &amp; Terms
        </Link>
        <Link href="/contact" style={{ color: "inherit", textDecoration: "none" }}>
          Contact
        </Link>
        <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
          Landing
        </Link>
      </Box>
    </Box>
  );
}
