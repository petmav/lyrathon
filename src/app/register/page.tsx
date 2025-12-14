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

export default function RegisterPage() {
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
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Registration failed");
        setLoading(false);
        return;
      }
      localStorage.setItem("candidate_id", data.data.candidate_id);
      console.log(data);

      // On success, redirect to login
      router.push("/applicant");
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `conic-gradient(from 0deg,
    rgba(124,58,237,0) 0 20%,
    rgba(124,58,237,1) 35%,
    rgba(56,189,248,1) 50%,
    rgba(34,197,94,1) 65%,
    rgba(124,58,237,0) 80% 100%
  )`,
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          maxWidth: 420,
          p: 4,
          borderRadius: 3,
        }}
      >
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography variant="h5" fontWeight={600}>
            Create an account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign up to get started
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
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
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
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading || !passwordsMatch}
            sx={{ mt: 1, borderRadius: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : "Create account"}
          </Button>
        </Box>
        {error && (
          <Typography variant="body2" color="error" align="center" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mt: 3 }}
        >
          Already have an account?{" "}
          <Link href={"/login"}>Sign in</Link>
        </Typography>
      </Paper>
    </Box>
  );
}
