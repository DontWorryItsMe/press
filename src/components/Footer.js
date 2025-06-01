// Footer component: persistent app footer with copyright and version info
import React from 'react';
import { Box, Typography } from '@mui/material';

const year = new Date().getFullYear();
const version = 'v1.0.0';

const Footer = () => (
  <Box
    sx={{
      width: '100%',
      py: 1,
      position: 'fixed',
      bottom: 0,
      left: 0,
      bgcolor: 'transparent',
      textAlign: 'center',
      zIndex: 1000,
    }}
  >
    <Typography
      variant="caption"
      color="text.secondary"
      fontFamily="IBM Plex Mono"
    >
      © {year} PRESS &middot; {version}
    </Typography>
  </Box>
);

export default Footer;
