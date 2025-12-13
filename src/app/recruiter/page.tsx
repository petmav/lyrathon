"use client"
import { useState, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
  AppBar,
  Toolbar,
  Button,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

export default function ChatbotPage() {
  const [messages, setMessages] = useState([
    { role: "bot", content: "What kind of candidates are you looking for?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Simulate bot response
    await new Promise((res) => setTimeout(res, 1000));

    const botMessage = {
      role: "bot",
      content: "This is a placeholder response from the chatbot.",
    };

    setMessages((prev) => [...prev, botMessage]);
    setLoading(false);
  };

  const handleLogout = () => {
    // Replace with real logout logic
    console.log("Logged out");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "grey.100" }}>
      <AppBar position="static" elevation={1} color="default">
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6" fontWeight={600}>
            Lemon recruits
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          flexDirection: 'column',
          alignItems: 'center',
          p: 2,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            width: "100%",
            maxWidth: 720,
            height: "80vh",
            display: "flex",
            flexDirection: "column",
            borderRadius: 3,
          }}
        >
          <Box
            sx={{
              flex: 1,
              p: 2,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            {messages.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  bgcolor: msg.role === "user" ? "primary.main" : "grey.200",
                  color:
                    msg.role === "user"
                      ? "primary.contrastText"
                      : "text.primary",
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  maxWidth: "75%",
                }}
              >
                <Typography variant="body2">{msg.content}</Typography>
              </Box>
            ))}

            {loading && (
              <Box sx={{ alignSelf: "flex-start", px: 2 }}>
                <CircularProgress size={18} />
              </Box>
            )}
            <div ref={bottomRef} />
          </Box>

          <Box
            sx={{
              p: 2,
              borderTop: 1,
              borderColor: "divider",
              display: "flex",
              gap: 1,
            }}
          >
            <TextField
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              fullWidth
              size="small"
            />
            <IconButton
              color="primary"
              onClick={sendMessage}
              disabled={loading}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
