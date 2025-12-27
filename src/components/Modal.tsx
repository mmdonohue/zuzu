import React from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  Paper,
  IconButton,
  Box,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

type ModalProps = {
  onClose: () => void;
  message: string;
}

const Modal: React.FC<ModalProps> = ({ onClose, message }) => {
  return (
    <Dialog
      open
      onClose={onClose}
      aria-labelledby="modal-dialog-title"
      aria-describedby="modal-dialog-description"
      maxWidth="sm"
      fullWidth
    >
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
      }}>
        <Typography variant="h6" id="modal-dialog-title">
          {'Messages'}
        </Typography>
        <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </Box>
      
      <DialogContent>
        <DialogContentText id="modal-dialog-description">
          {String(message)}
        </DialogContentText>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Modal;
