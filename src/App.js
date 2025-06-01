// App: Main entry point, manages authentication, theme, and inactivity logout
import React, { useState, useEffect, useCallback } from 'react';
import PasscodeScreen from './components/PasscodeScreen';
import Notes from './components/Notes';
import Footer from './components/Footer';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import '@fontsource/ibm-plex-mono';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#000000', paper: '#000000' },
    primary: { main: '#ffffff' },
    text: { primary: '#ffffff' },
  },
  typography: {
    fontFamily: 'IBM Plex Mono, monospace',
    fontWeightLight: 100,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
  },
});

const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [lastActive, setLastActive] = useState(Date.now());

  // Inactivity auto-logout: logs out user after INACTIVITY_LIMIT ms of inactivity
  useEffect(() => {
    if (!authenticated) return;
    const handleActivity = () => setLastActive(Date.now());
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    const interval = setInterval(() => {
      if (Date.now() - lastActive > INACTIVITY_LIMIT) {
        setAuthenticated(false);
        setEncryptionKey(null);
      }
    }, 1000);
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      clearInterval(interval);
    };
  }, [authenticated, lastActive]);

  const handleAuth = useCallback((key) => {
    setEncryptionKey(key);
    setAuthenticated(true);
    setLastActive(Date.now());
  }, []);

  const handleLogout = () => {
    setAuthenticated(false);
    setEncryptionKey(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {!authenticated ? (
        <PasscodeScreen onAuthenticated={handleAuth} />
      ) : (
        <Notes onLogout={handleLogout} encryptionKey={encryptionKey} />
      )}
      <Footer />
    </ThemeProvider>
  );
}

export default App;
