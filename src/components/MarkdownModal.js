// MarkdownModal: Fullscreen modal for rendering markdown notes with syntax highlighting
import React, { useEffect } from 'react';
import { Dialog, AppBar, Toolbar, Typography, IconButton, Slide, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import DOMPurify from 'dompurify';
import { logAudit } from '../security/logger';
import { validateNoteContent } from '../security/validation';
import { setSecurityHeaders } from '../security/headers';


const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const MarkdownModal = ({ open, onClose, note }) => {
  useEffect(() => {
    setSecurityHeaders();
    if (open && note) {
      logAudit('markdown_preview', { noteId: note.id });
    }
    // Do NOT clearSensitive(note) here, as it mutates the note in state and causes it to disappear from the list.
    return () => {
      // if (note) clearSensitive(note);
    };

  }, [open, note]);

  // Validate and sanitize note content
  const safeContent = note && validateNoteContent(note.content)
    ? DOMPurify.sanitize(note.content)
    : '';

  return (
    <Dialog fullScreen open={open} onClose={onClose} TransitionComponent={Transition}
      PaperProps={{ sx: {
        bgcolor: 'rgba(0,0,0,0.85)',
        color: '#fff',
        fontFamily: `'SF Pro Display', 'IBM Plex Mono', 'Roboto', sans-serif`,
        borderRadius: 4,
        boxShadow: '0 8px 32px 0 rgba(0,0,0,0.25)',
        backdropFilter: 'blur(24px) saturate(180%)',
      } }}
    >
      <AppBar sx={{ position: 'relative', bgcolor: 'rgba(0,0,0,0.92)', color: '#fff', borderRadius: 3, boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)', fontFamily: `'SF Pro Display', 'IBM Plex Mono', 'Roboto', sans-serif` }} elevation={0}>
        <Toolbar variant="dense">
          <Typography sx={{ flex: 1 }} variant="h6" fontWeight={700}>{note?.title || 'Preview'}</Typography>
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: { xs: 1, sm: 2 }, bgcolor: 'transparent', minHeight: '100vh', color: '#fff', fontFamily: `'SF Pro Display', 'IBM Plex Mono', 'Roboto', sans-serif`, fontSize: 16, overflowX: 'auto' }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Custom code block renderer: highlights fenced code blocks, styles inline code
            code({ inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{ borderRadius: 8, fontSize: 15, background: '#000', color: '#fff' }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code style={{ background: '#222', borderRadius: 4, padding: '2px 6px', fontSize: 15 }}>{children}</code>
              );
            },
          }}
        >
          {safeContent}
        </ReactMarkdown>
      </Box>
    </Dialog>
  );
};

export default MarkdownModal;
