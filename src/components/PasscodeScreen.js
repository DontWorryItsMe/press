// PasscodeScreen: Authenticates user with a 4-digit code and derives encryption key
import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper } from '@mui/material';
import { supabase } from '../supabaseClient';
import bcrypt from 'bcryptjs';
import { deriveKey } from '../utils/crypto';
import { validatePasscode } from '../security/validation';
import { logAudit } from '../security/logger';
import { getDeviceId } from '../security/session';
import { clearSensitive } from '../security/memory';
import { setSecurityHeaders } from '../security/headers';

export default function PasscodeScreen({ onAuthenticated }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Enforce HTTPS everywhere (production-ready)
    if (window.location.protocol !== 'https:') {
      alert('This app requires HTTPS for security.');
      window.location.href = 'https://' + window.location.host + window.location.pathname;
    }
    setSecurityHeaders();
  }, []);

  const handleChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCode(val);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate passcode
    if (!validatePasscode(code)) {
      setError('Invalid passcode format');
      logAudit('login_failed', { reason: 'invalid_format', device: getDeviceId() });
      return;
    }
    setLoading(true);
    try {
      const { data, error: dbError } = await supabase
        .from('app_user')
        .select('passcode_hash')
        .limit(1)
        .single();
      setLoading(false);
      if (dbError || !data) {
        setError('Server error');
        logAudit('login_failed', { reason: 'server_error', device: getDeviceId() });
        return;
      }
      // Compare entered code with stored hash
      const valid = await bcrypt.compare(code, data.passcode_hash);
      if (valid) {
        // Derive AES key from passcode (never stored, just in memory)
        const key = await deriveKey(code, 'press-app-v1');
        logAudit('login_success', { device: getDeviceId() });
        onAuthenticated(key);
        clearSensitive({ code });
      } else {
        setError('Invalid Password');
        logAudit('login_failed', { reason: 'invalid_password', device: getDeviceId() });
      }
    } catch (err) {
      setError('Unexpected error');
      logAudit('login_failed', { reason: 'exception', error: err?.message, device: getDeviceId() });
    }
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" sx={{ bgcolor: 'linear-gradient(135deg, #232526 0%, #414345 100%)', fontFamily: `'SF Pro Display', 'IBM Plex Mono', 'Roboto', sans-serif` }}>
      <Paper elevation={8} sx={{
        p: 4,
        width: 340,
        borderRadius: 5,
        bgcolor: 'rgba(30,30,32,0.7)',
        boxShadow: '0 8px 32px 0 rgba(31,38,135,0.25)',
        backdropFilter: 'blur(16px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.08)',
        fontFamily: `'SF Pro Display', 'IBM Plex Mono', 'Roboto', sans-serif`,
      }}>
        <Typography variant="h4" fontWeight={700} gutterBottom align="center" sx={{ letterSpacing: 2, fontFamily: `'SF Pro Display', 'IBM Plex Mono', 'Roboto', sans-serif` }}>
          PRESS
        </Typography>
        <Typography variant="body2" align="center" mb={2} sx={{ color: '#cfd8dc', fontWeight: 500 }}>
          Enter your password
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            type="password"
            inputProps={{
              maxLength: 4,
              inputMode: 'numeric',
              pattern: '[0-9]*',
              style: {
                letterSpacing: 12,
                fontSize: 32,
                textAlign: 'center',
                fontFamily: 'IBM Plex Mono',
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(31,38,135,0.08)',
                padding: 8,
              }
            }}
            value={code}
            onChange={handleChange}
            autoFocus
            fullWidth
            error={!!error}
            helperText={error}
            disabled={loading}
            sx={{ mb: 2, input: { color: '#fff' } }}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth size="large" disabled={loading} sx={{ fontWeight: 700 }}>
            {loading ? 'Checking...' : 'Unlock'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
