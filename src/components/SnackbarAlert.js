// SnackbarAlert: Displays a dismissible Material-UI snackbar with alert styling
import React from 'react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

// Wrapper for MUI Alert with elevation and filled variant
const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function SnackbarAlert({ open, onClose, severity = 'success', message }) {
  return (
    <Snackbar open={open} autoHideDuration={2500} onClose={onClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
