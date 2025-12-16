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
    title: "Advanced Candidate Search",
    body: "Leverage powerful filters and AI-driven insights to find the perfect match for your roles.",
  },
  {
    title: "Streamlined Shortlisting",
    body: "Easily manage and organize shortlisted candidates for efficient decision-making.",
  },
  {
    title: "Real-Time Collaboration",
    body: "Work seamlessly with your team to evaluate and track candidates in one unified platform.",
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Login failed");
        setLoading(false);
        return;
      }
      localStorage.setItem("recruiter_id", data.recruiter_id);
      console.log(data);

      // on success redirect to home (or wherever you want)
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
            opacity: 0,
            animation: "authFade 0.7s ease forwards 0.05s",
            "@keyframes authFade": {
              from: { opacity: 0, transform: "translateY(12px)" },
              to: { opacity: 1, transform: "translateY(0)" },
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Link
              href="/"
              style={{ textDecoration: "none" }}
              aria-label="Back to landing"
            >
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
            </Link>
            <Box>
              <Typography fontWeight={800} letterSpacing={-0.3}>
                Linkdr
              </Typography>
              <Typography variant="body2" sx={{ color: "#b7c2d9" }}>
                Secure sign-in
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "grid", gap: 1 }}>
            <Typography
              variant="h4"
              fontWeight={800}
              sx={{ letterSpacing: -0.4, lineHeight: 1.1 }}
            >
              Welcome back, Recruiter.
            </Typography>
            <Typography variant="body1" sx={{ color: "#b7c2d9", maxWidth: 520 }}>
              Log in to access your recruiter dashboard, search candidates with ease, and streamline your hiring process.
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
                  minHeight: 120,
                  display: "grid",
                  alignContent: "space-between",
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
            opacity: 0,
            animation: "authFade 0.75s ease forwards 0.15s",
            "@keyframes authFade": {
              from: { opacity: 0, transform: "translateY(12px)" },
              to: { opacity: 1, transform: "translateY(0)" },
            },
          }}
        >
          <Box sx={{ display: "grid", gap: 0.5, mb: 3 }}>
            <Typography variant="overline" sx={{ letterSpacing: 1.2, color: "#9a6bff" }}>
              Welcome back
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              Sign in to Linkdr
            </Typography>
            <Typography variant="body2" sx={{ color: "#b7c2d9" }}>
              Keep momentum on applications and recruiter conversations.
            </Typography>
          </Box>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ gap: 2, display: "flex", flexDirection: "column" }}
          >
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

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
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
              {loading ? <CircularProgress size={22} sx={{ color: "#050712" }} /> : "Sign in"}
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
            Don’t have an account?{" "}
            <Link href={"/register/recruiter"} style={{ color: "#9a6bff", fontWeight: 700 }}>
              Sign up
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
