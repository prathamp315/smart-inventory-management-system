import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Card, CardContent, TextField, Button, Typography, Alert, InputAdornment, IconButton, alpha } from "@mui/material";
import { Visibility, VisibilityOff, Email as EmailIcon, Lock as LockIcon } from "@mui/icons-material";
import axios from "axios";

const API_BASE_URL = "https://smart-erp-backend.vercel.app/api";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      bgcolor: "#111317",
      position: "relative",
    }}>
      {/* Subtle radial glow */}
      <Box sx={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(192,192,192,0.04) 0%, transparent 70%)', top: '10%', right: '15%', pointerEvents: 'none' }} />

      <Card sx={{
        width: "100%",
        maxWidth: 400,
        borderRadius: '4px',
        border: '1px solid rgba(192,192,192,0.1)',
        bgcolor: '#1a1c20',
        boxShadow: 'none',
      }}>
        <CardContent sx={{ p: 4 }}>
          {/* Brand */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="overline" sx={{ color: '#94a3b8', letterSpacing: '0.12em', fontSize: '0.625rem' }}>Smart ERP System</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#F1F5F9', mt: 0.5, letterSpacing: '-0.02em' }}>One Smart Inc</Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>Sign in to your account</Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{
              mb: 2.5, borderRadius: '4px',
              bgcolor: alpha('#EF4444', 0.08), color: '#FCA5A5',
              border: '1px solid rgba(239,68,68,0.15)',
              '& .MuiAlert-icon': { color: '#F87171' },
            }}>{error}</Alert>
          )}

          <Box component="form" onSubmit={handleLogin}>
            <TextField
              fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(192,192,192,0.03)',
                  '& fieldset': { borderColor: 'rgba(192,192,192,0.1)', borderWidth: 1 },
                  '&:hover fieldset': { borderColor: 'rgba(192,192,192,0.2)' },
                  '&.Mui-focused fieldset': { borderColor: '#C0C0C0', borderWidth: 1 },
                },
                '& .MuiInputLabel-root': { color: '#64748B' },
                '& input': { color: '#F1F5F9' },
              }}
              InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: '#475569', fontSize: '1.1rem' }} /></InputAdornment> }}
            />
            <TextField
              fullWidth label="Password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(192,192,192,0.03)',
                  '& fieldset': { borderColor: 'rgba(192,192,192,0.1)', borderWidth: 1 },
                  '&:hover fieldset': { borderColor: 'rgba(192,192,192,0.2)' },
                  '&.Mui-focused fieldset': { borderColor: '#C0C0C0', borderWidth: 1 },
                },
                '& .MuiInputLabel-root': { color: '#64748B' },
                '& input': { color: '#F1F5F9' },
              }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: '#475569', fontSize: '1.1rem' }} /></InputAdornment>,
                endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#475569' }}>{showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment>,
              }}
            />
            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}
              sx={{
                py: 1.25, fontWeight: 700, borderRadius: '4px', fontSize: '0.8125rem',
                bgcolor: '#C0C0C0', color: '#111317', letterSpacing: '0.02em',
                '&:hover': { bgcolor: '#D4D4D8', transform: 'translateY(-1px)' },
                '&:disabled': { bgcolor: 'rgba(192,192,192,0.15)', color: 'rgba(255,255,255,0.2)' },
                transition: 'all 200ms ease',
              }}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
