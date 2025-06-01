// Notes component: Handles secure CRUD, real-time sync, and UI for encrypted notes
import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { Box, Typography, IconButton, Button, List, ListItem, ListItemText, TextField, Dialog, AppBar, Toolbar, Slide, Tooltip, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import { Add, Logout } from '@mui/icons-material';
import { supabase } from '../supabaseClient';
import MarkdownModal from './MarkdownModal';
import SnackbarAlert from './SnackbarAlert';
import { encryptString, decryptString } from '../utils/crypto';

// Transition for dialogs
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const Notes = ({ onLogout, encryptionKey }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // note object or null for new
  const [dialogOpen, setDialogOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewNote, setPreviewNote] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [userId, setUserId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [search, setSearch] = useState('');
  const titleRef = useRef();

  // Fetch user_id (on mount)
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      // fallback: fetch the single app_user id
      if (!user) {
        const { data } = await supabase.from('app_user').select('id').limit(1).single();
        if (data) setUserId(data.id);
      } else {
        setUserId(user.id);
      }
    })();
  }, []);

  // Fetch and decrypt notes, subscribe to real-time changes
  useEffect(() => {
    if (!userId || !encryptionKey) return;
    setLoading(true);
    const fetchNotes = async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        // Decrypt all notes in memory (client-side)
        const decrypted = await Promise.all(data.map(async (note) => {
          try {
            const title = await decryptString({ ciphertext: note.title, iv: note.title_iv }, encryptionKey);
            const content = await decryptString({ ciphertext: note.content, iv: note.content_iv }, encryptionKey);
            return { ...note, title, content };
          } catch (e) {
            return { ...note, title: '[Decryption Failed]', content: '' };
          }
        }));
        setNotes(decrypted);
      }
      setLoading(false);
    };
    fetchNotes();
    // Real-time sync with Supabase
    const sub = supabase
      .channel('notes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, fetchNotes)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [userId, encryptionKey]);

  // Optimistic add/edit
  // Optimistic add/edit with encryption
  const handleSave = async () => {
    if (!title.trim() || !encryptionKey) return;
    // Encrypt title/content (client-side)
    const encryptedTitle = await encryptString(title, encryptionKey);
    const encryptedContent = await encryptString(content, encryptionKey);
    if (editing) {
      const { id } = editing;
      setNotes((prev) => prev.map(n => n.id === id ? { ...n, title, content, updated_at: new Date().toISOString() } : n));
      await supabase.from('notes').update({
        title: encryptedTitle.ciphertext,
        title_iv: encryptedTitle.iv,
        content: encryptedContent.ciphertext,
        content_iv: encryptedContent.iv
      }).eq('id', id);
      setSnackbar({ open: true, message: 'Note updated!', severity: 'success' });
    } else {
      const newNote = {
        title: encryptedTitle.ciphertext,
        title_iv: encryptedTitle.iv,
        content: encryptedContent.ciphertext,
        content_iv: encryptedContent.iv,
        user_id: userId
      };
      const { data } = await supabase.from('notes').insert([newNote]).select('*').single();
      // Decrypt for UI
      if (data) {
        setNotes((prev) => [{
          ...data,
          title,
          content
        }, ...prev]);
      }
      setSnackbar({ open: true, message: 'Note created!', severity: 'success' });
    }
    setEditing(null);
    setDialogOpen(false);
    setTitle('');
    setContent('');
  };



  const handleEdit = (note) => {
    setEditing(note);
    setTitle(note.title);
    setContent(note.content);
    setDialogOpen(true);
  };


  const handleDelete = async (id) => {
    setNotes((prev) => prev.filter(n => n.id !== id));
    await supabase.from('notes').delete().eq('id', id);
    setSnackbar({ open: true, message: 'Note deleted!', severity: 'info' });
    setDeleteConfirm({ open: false, id: null });
  };

  const handlePreview = (note) => {
    setPreviewNote(note);
    setModalOpen(true);
  };

  const handleNew = () => {
    setEditing(null); // null means new note
    setTitle('');
    setContent('');
    setDialogOpen(true);
  };



  return (
    <Box sx={{
      maxWidth: 600,
      mx: 'auto',
      pt: 2,
      minHeight: '80vh',
      px: { xs: 1, sm: 0 },
      fontFamily: `'SF Pro Display', 'IBM Plex Mono', 'Roboto', sans-serif`,
      bgcolor: 'transparent',
    }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ mb: 2, bgcolor: 'rgba(0,0,0,0.85)', borderRadius: 3, boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)', fontFamily: `'SF Pro Display', 'IBM Plex Mono', 'Roboto', sans-serif` }}>
        <Toolbar variant="dense" sx={{ p: 0 }}>
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
            Notes
          </Typography>
          <Tooltip title="Logout"><IconButton onClick={onLogout}><Logout /></IconButton></Tooltip>
        </Toolbar>
      </AppBar>
      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
        <Button variant="contained" color="primary" startIcon={<Add />} onClick={handleNew} sx={{ fontWeight: 700, flexShrink: 0 }}>
          New
        </Button>
        <TextField
          placeholder="Search notes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ ml: { sm: 2 }, flexGrow: 1, bgcolor: '#111', borderRadius: 1, mt: { xs: 1, sm: 0 } }}
          InputProps={{ style: { fontFamily: 'IBM Plex Mono', color: '#fff' } }}
        />
      </Box>
      <Dialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        fullScreen={window.innerWidth < 600}
        fullWidth
        maxWidth="sm"
        TransitionComponent={Transition}
        PaperProps={{ sx: {
          bgcolor: 'rgba(0,0,0,0.85)',
          color: '#fff',
          fontFamily: `'SF Pro Display', 'IBM Plex Mono', 'Roboto', sans-serif`,
          borderRadius: 4,
          boxShadow: '0 8px 32px 0 rgba(0,0,0,0.25)',
          backdropFilter: 'blur(24px) saturate(180%)',
        } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontFamily: `'SF Pro Display', 'IBM Plex Mono', 'Roboto', sans-serif`, pb: 0 }}>{editing ? 'Edit Note' : 'New Note'}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            label="Title"
            value={title}
            inputRef={titleRef}
            onChange={e => setTitle(e.target.value)}
            fullWidth
            autoFocus
            sx={{ mb: 2, input: { fontFamily: 'IBM Plex Mono', fontWeight: 700, fontSize: 20 } }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('note-content')?.focus();
              }
            }}
          />
          <TextareaAutosize
            id="note-content"
            minRows={8}
            maxRows={24}
            style={{ width: '100%', fontFamily: 'IBM Plex Mono', fontSize: 16, background: 'rgba(255,255,255,0.04)', color: '#fff', border: '1.5px solid #222', borderRadius: 10, padding: 12, resize: 'vertical', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            placeholder="Content (Markdown)"
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSave();
            }}
          />

        </DialogContent>
        <DialogActions sx={{ position: 'sticky', bottom: 0, bgcolor: '#111', p: 2, borderTop: '1px solid #222' }}>
          <Button onClick={() => { setDialogOpen(false); setEditing(null); }} color="inherit" sx={{ fontWeight: 700 }}>
            Cancel
          </Button>
          <Button onClick={handleSave} color="primary" variant="contained" sx={{ fontWeight: 700, px: 4 }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })}>
        <DialogTitle>Delete this note?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, id: null })} color="inherit">Cancel</Button>
          <Button onClick={() => handleDelete(deleteConfirm.id)} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
      <MarkdownModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setPreviewNote(null); }}
        note={previewNote || { title, content }}
      />
      <SnackbarAlert
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        severity={snackbar.severity}
        message={snackbar.message}
      />
      <List>
        {loading ? (
          <Typography variant="body2" color="text.secondary" align="center">Loading...</Typography>
        ) : notes.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center">No notes yet.</Typography>
        ) : (
          notes
            .filter(note =>
              (note.title || '').toLowerCase().includes(search.toLowerCase()) ||
              (note.content || '').toLowerCase().includes(search.toLowerCase())
            )
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
            .map(note => (
              <ListItem
                key={note.id}
                divider
                alignItems="flex-start"
                sx={{
                  px: { xs: 0.5, sm: 2 },
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  bgcolor: 'rgba(0,0,0,0.70)',
                  borderRadius: 3,
                  boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)',
                  mb: 2,
                  position: 'relative',
                  border: '1px solid rgba(255,255,255,0.06)',
                  '&:hover, &:focus': { bgcolor: 'rgba(0,0,0,0.92)' },
                }}
                onClick={e => {
                  // Only open preview if not clicking on an action button
                  if (!e.target.closest('.note-action')) handlePreview(note);
                }}
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') handlePreview(note);
                }}
                aria-label={`Open note preview: ${note.title}`}
              >
                <ListItemText
                  primary={<Typography fontWeight={700} fontSize={18}>{note.title}</Typography>}
                  secondary={<>
                    <Typography fontSize={12} color="text.secondary" sx={{ display: 'inline-block', mr: 1 }}>
                      {(note.content || '').slice(0, 60)}{((note.content || '').length > 60 ? '...' : '')}
                    </Typography>
                    <Typography fontSize={11} color="#888" sx={{ display: 'inline-block' }}>
                      {note.updated_at ? ` • ${new Date(note.updated_at).toLocaleString()}` : ''}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 1.5 }}>
                      <Button
                        className="note-action"
                        size="small"
                        variant="text"
                        sx={{
                          color: '#1976d2',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          fontSize: 12,
                          letterSpacing: 1,
                          minWidth: 0,
                          px: 1,
                          '&:hover, &:focus': { color: '#1565c0', textDecoration: 'underline' },
                        }}
                        onClick={e => { e.stopPropagation(); handleEdit(note); }}
                      >
                        Edit
                      </Button>
                      <Button
                        className="note-action"
                        size="small"
                        variant="text"
                        sx={{
                          color: '#e53935',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          fontSize: 12,
                          letterSpacing: 1,
                          minWidth: 0,
                          px: 1,
                          '&:hover, &:focus': { color: '#b71c1c', textDecoration: 'underline' },
                        }}
                        onClick={e => { e.stopPropagation(); setDeleteConfirm({ open: true, id: note.id }); }}
                      >
                        Delete
                      </Button>
                    </Box>
                  </>}
                />
              </ListItem>
            ))
        )}
      </List>
    </Box>
  );
};

export default Notes;
