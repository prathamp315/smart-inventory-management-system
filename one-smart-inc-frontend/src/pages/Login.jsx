import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Avatar, InputAdornment, IconButton, alpha } from "@mui/material";
import { Store as StoreIcon, Visibility, VisibilityOff, Email as EmailIcon, Lock as LockIcon } from "@mui/icons-material";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

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
      background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative elements */}
      <Box sx={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)', top: '-10%', right: '-5%' }} />
      <Box sx={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)', bottom: '-5%', left: '-5%' }} />

      <Card sx={{
        width: "100%",
        maxWidth: 420,
        borderRadius: 4,
        border: '1px solid rgba(255,255,255,0.08)',
        bgcolor: alpha('#1E293B', 0.8),
        backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }}>
        <CardContent sx={{ p: 4.5 }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4 }}>
            <Avatar sx={{
              width: 56, height: 56, mb: 2,
              background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
              boxShadow: "0 8px 24px rgba(79,70,229,0.4)",
            }}>
              <StoreIcon fontSize="large" />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.02em' }}>One Smart Inc</Typography>
            <Typography variant="body2" sx={{ color: '#94A3B8', mt: 0.5 }}>Smart Inventory Management System</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2.5, bgcolor: alpha('#EF4444', 0.1), color: '#FCA5A5', border: `1px solid ${alpha('#EF4444', 0.2)}`, '& .MuiAlert-icon': { color: '#F87171' } }}>{error}</Alert>}

          <Box component="form" onSubmit={handleLogin}>
            <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { bgcolor: alpha('#FFFFFF', 0.04), '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused fieldset': { borderColor: '#4F46E5' } }, '& .MuiInputLabel-root': { color: '#94A3B8' }, '& input': { color: '#F1F5F9' } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: '#64748B' }} /></InputAdornment> }} />
            <TextField fullWidth label="Password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
              sx={{ mb: 3.5, '& .MuiOutlinedInput-root': { bgcolor: alpha('#FFFFFF', 0.04), '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused fieldset': { borderColor: '#4F46E5' } }, '& .MuiInputLabel-root': { color: '#94A3B8' }, '& input': { color: '#F1F5F9' } }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: '#64748B' }} /></InputAdornment>,
                endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#64748B' }}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>
              }} />
            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}
              sx={{ py: 1.5, fontSize: '0.9375rem', fontWeight: 600, borderRadius: 2.5, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', boxShadow: '0 4px 16px rgba(79,70,229,0.4)', '&:hover': { background: 'linear-gradient(135deg, #4338CA, #6D28D9)', boxShadow: '0 6px 20px rgba(79,70,229,0.5)', transform: 'translateY(-1px)' }, '&:disabled': { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' } }}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
