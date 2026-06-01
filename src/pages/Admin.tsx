import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Container, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tabs, Tab, Select, MenuItem,
  Chip, Alert, Tooltip, IconButton, LinearProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, TextField, Stack, Checkbox,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import EventIcon from '@mui/icons-material/Event';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import TopicIcon from '@mui/icons-material/Lightbulb';
import { useAuth } from '@/context/AuthContext';
import { fetchWithCsrf } from '@/services/api';

type SiteOption = {
  id: string;
  slug: string;
  domain: string | null;
  config: Record<string, unknown>;
  member_role?: string;
};

type AdminEvent = {
  id: string;
  title: string;
  description: string;
  template: string;
  start_at: string;
  end_at: string;
  location: string;
  location_url: string;
  rrule: string;
  cta_label: string;
  cta_url: string;
  status: string;
  max_capacity: number | null;
  registered_count: number;
  topic_count: number;
};

type AdminTopic = {
  id: string;
  title: string;
  description: string;
  text: string;
  image: string;
  display_order: number;
  status: string;
  up_votes: number;
};

type Contact = {
  id: string;
  email: string;
  interest: string;
  notes: string;
  created_at: string;
};

type Registration = {
  id: string;
  email: string;
  name: string;
  notes: string;
  created_at: string;
  events: { title: string; start_at: string } | null;
};

type TabId = 'events' | 'contacts' | 'registrations';

// ── Edit Event Dialog ────────────────────────────────────────────────────────
const EditEventDialog: React.FC<{
  event: AdminEvent | null;
  slug: string;
  onClose: () => void;
  onSaved: () => void;
}> = ({ event, slug, onClose, onSaved }) => {
  const [form, setForm] = useState<Partial<AdminEvent>>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (event) setForm({ ...event });
  }, [event]);

  const set = (k: keyof AdminEvent) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!event) return;
    setSaving(true); setErr(null);
    try {
      const res = await fetchWithCsrf(`/api/admin/sites/${slug}/events/${event.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Save failed');
      onSaved(); onClose();
    } catch { setErr('Failed to save event'); }
    finally { setSaving(false); }
  };

  const tf = { size: 'small' as const, fullWidth: true,
    InputLabelProps: { shrink: true, sx: { color: 'rgba(255,255,255,0.7)' } },
    InputProps: { sx: { color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } } },
    sx: { '& .MuiOutlinedInput-root': { background: 'rgba(255,255,255,0.05)' } } };

  return (
    <Dialog open={!!event} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { background: 'rgba(15,15,25,0.97)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 2, color: '#fff' } }}>
      <DialogTitle sx={{ pb: 1, color: '#fff' }}>Edit Event</DialogTitle>
      <DialogContent>
        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField {...tf} label="Title" value={form.title || ''} onChange={set('title')} />
          <TextField {...tf} label="Description" value={form.description || ''} onChange={set('description')} multiline rows={2} />
          <TextField {...tf} label="Location" value={form.location || ''} onChange={set('location')} />
          <TextField {...tf} label="Location URL" value={form.location_url || ''} onChange={set('location_url')} />
          <TextField {...tf} label="Start At" type="datetime-local" value={form.start_at ? form.start_at.slice(0, 16) : ''} onChange={set('start_at')} />
          <TextField {...tf} label="Max Capacity" type="number" value={form.max_capacity ?? ''} onChange={set('max_capacity')} />
          <TextField {...tf} label="RRULE" value={form.rrule || ''} onChange={set('rrule')} placeholder="FREQ=WEEKLY;BYDAY=TH" />
          <TextField {...tf} label="CTA Label" value={form.cta_label || ''} onChange={set('cta_label')} />
          <TextField {...tf} label="CTA URL" value={form.cta_url || ''} onChange={set('cta_url')} />
          <Select size="small" value={form.status || 'active'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            sx={{ color: '#fff', background: 'rgba(255,255,255,0.05)', '& .MuiSvgIcon-root': { color: '#fff' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}>
            {['draft', 'active', 'cancelled'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small">Cancel</Button>
        <Button onClick={save} variant="contained" size="small" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Topics Dialog (site library + event assignment) ───────────────────────────
const TopicsDialog: React.FC<{
  event: AdminEvent | null;
  slug: string;
  onClose: () => void;
}> = ({ event, slug, onClose }) => {
  const [siteTopics, setSiteTopics] = useState<AdminTopic[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<AdminTopic | null>(null);
  const [form, setForm] = useState<Partial<AdminTopic>>({});
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!event) return;
    const [libRes, asnRes] = await Promise.all([
      fetchWithCsrf(`/api/admin/sites/${slug}/topics`),
      fetchWithCsrf(`/api/admin/sites/${slug}/events/${event.id}/assignments`),
    ]);
    const [lib, asn] = await Promise.all([libRes.json(), asnRes.json()]);
    setSiteTopics(lib.topics || []);
    setAssignedIds(new Set((asn.assignments || []).map((a: { topic_id: string }) => a.topic_id)));
  }, [event, slug]);

  useEffect(() => { load(); }, [load]);

  const set = (k: keyof AdminTopic) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const saveTopic = async () => {
    setSaving(true);
    try {
      if (editing) {
        await fetchWithCsrf(`/api/admin/sites/${slug}/topics/${editing.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        });
      } else {
        await fetchWithCsrf(`/api/admin/sites/${slug}/topics`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        });
      }
      setEditing(null); setAdding(false); setForm({});
      load();
    } finally { setSaving(false); }
  };

  const toggleAssignment = async (topicId: string) => {
    if (!event || toggling) return;
    setToggling(topicId);
    try {
      if (assignedIds.has(topicId)) {
        await fetchWithCsrf(`/api/admin/sites/${slug}/events/${event.id}/assignments/${topicId}`, { method: 'DELETE' });
        setAssignedIds(s => { const n = new Set(s); n.delete(topicId); return n; });
      } else {
        await fetchWithCsrf(`/api/admin/sites/${slug}/events/${event.id}/assignments`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic_id: topicId, display_order: siteTopics.findIndex(t => t.id === topicId) }),
        });
        setAssignedIds(s => new Set([...s, topicId]));
      }
    } finally { setToggling(null); }
  };

  const tf = { size: 'small' as const, fullWidth: true,
    InputLabelProps: { shrink: true, sx: { color: 'rgba(255,255,255,0.7)' } },
    InputProps: { sx: { color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } } },
    sx: { '& .MuiOutlinedInput-root': { background: 'rgba(255,255,255,0.05)' } } };

  return (
    <Dialog open={!!event} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { background: 'rgba(15,15,25,0.97)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 2, color: '#fff' } }}>
      <DialogTitle sx={{ pb: 1, color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
        <TopicIcon fontSize="small" /> Topic Library — {event?.title}
        <IconButton size="small" sx={{ ml: 'auto', color: '#fff' }} onClick={() => { setAdding(true); setEditing(null); setForm({}); }}>
          <AddIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {(adding || editing) && (
          <Paper sx={{ p: 2, mb: 2, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Stack spacing={1.5}>
              <TextField {...tf} label="Title" value={form.title || ''} onChange={set('title')} />
              <TextField {...tf} label="Description" value={form.description || ''} onChange={set('description')} multiline rows={2} />
              <TextField {...tf} label="Extended Text" value={form.text || ''} onChange={set('text')} multiline rows={2} />
              <TextField {...tf} label="Image URL" value={form.image || ''} onChange={set('image')} />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button onClick={() => { setEditing(null); setAdding(false); setForm({}); }} size="small" sx={{ color: 'rgba(255,255,255,0.6)' }}>Cancel</Button>
                <Button onClick={saveTopic} variant="contained" size="small" disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Save' : 'Add to Library'}
                </Button>
              </Box>
            </Stack>
          </Paper>
        )}
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mb: 1 }}>
          Check topics to assign to this event. Topics in the library can be reused across events.
        </Typography>
        <Stack spacing={1}>
          {siteTopics.map(t => {
            const assigned = assignedIds.has(t.id);
            return (
              <Paper key={t.id} sx={{ p: 1.5, background: assigned ? 'rgba(116,229,255,0.07)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${assigned ? 'rgba(116,229,255,0.25)' : 'rgba(255,255,255,0.06)'}`,
                display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Checkbox
                  checked={assigned}
                  disabled={toggling === t.id}
                  onChange={() => toggleAssignment(t.id)}
                  size="small"
                  sx={{ color: 'rgba(255,255,255,0.3)', '&.Mui-checked': { color: '#74e5ff' }, mt: -0.5 }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={500} sx={{ color: '#fff' }}>{t.title}</Typography>
                  {t.description && <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>{t.description}</Typography>}
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', display: 'block' }}>
                    ▲ {t.up_votes} votes
                  </Typography>
                </Box>
                <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.4)' }}
                  onClick={() => { setEditing(t); setAdding(false); setForm({ ...t }); }}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Paper>
            );
          })}
          {siteTopics.length === 0 && !adding && (
            <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 2 }}>
              No topics in library yet — click + to add one
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small" sx={{ color: 'rgba(255,255,255,0.6)' }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

const TABS: { id: TabId; label: string }[] = [
  { id: 'events', label: 'Events' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'registrations', label: 'Registrations' },
];

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const [tab, setTab] = useState<TabId>('events');
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPlatformAdmin = user?.role?.toLowerCase() === 'admin';
  const [editEvent, setEditEvent] = useState<AdminEvent | null>(null);
  const [topicsEvent, setTopicsEvent] = useState<AdminEvent | null>(null);

  useEffect(() => {
    fetchWithCsrf('/api/admin/sites')
      .then(r => r.json())
      .then(d => {
        setSites(d.sites || []);
        if (d.sites?.length) setSelectedSlug(d.sites[0].slug);
      })
      .catch(() => setError('Failed to load sites'));
  }, []);

  const loadTab = useCallback(async (slug: string, t: TabId) => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithCsrf(`/api/admin/sites/${slug}/${t}`);
      const data = await res.json();
      if (t === 'events') setEvents(data.events || []);
      if (t === 'contacts') setContacts(data.contacts || []);
      if (t === 'registrations') setRegistrations(data.registrations || []);
    } catch {
      setError(`Failed to load ${t}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSlug) loadTab(selectedSlug, tab);
  }, [selectedSlug, tab, loadTab]);

  if (!isPlatformAdmin && !user) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="error">Access denied.</Alert>
      </Box>
    );
  }

  const tabIndex = TABS.findIndex(t => t.id === tab);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <AdminPanelSettingsIcon sx={{ color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h5" fontWeight={600}>Admin</Typography>

        {sites.length > 1 && (
          <Select
            size="small"
            value={selectedSlug}
            onChange={e => setSelectedSlug(e.target.value)}
            sx={{ ml: 1, minWidth: 180, background: 'rgba(255,255,255,0.04)', color: 'white',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' } }}
          >
            {sites.map(s => (
              <MenuItem key={s.slug} value={s.slug}>
                {s.slug}{s.domain ? ` — ${s.domain}` : ''}
                {s.member_role ? ` (${s.member_role})` : ''}
              </MenuItem>
            ))}
          </Select>
        )}
        {sites.length === 1 && (
          <Chip label={`${sites[0].slug}${sites[0].domain ? ` — ${sites[0].domain}` : ''}`}
            size="small" variant="outlined" sx={{ color: 'text.secondary' }} />
        )}

        <Tooltip title="Refresh">
          <IconButton size="small" onClick={() => loadTab(selectedSlug, tab)} sx={{ ml: 'auto' }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Tabs */}
      <Paper sx={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
        <Tabs
          value={tabIndex}
          onChange={(_, i) => setTab(TABS[i].id)}
          sx={{ borderBottom: '1px solid rgba(255,255,255,0.07)',
            '& .MuiTab-root': { color: 'text.secondary', minHeight: 48 },
            '& .Mui-selected': { color: 'primary.light' },
            '& .MuiTabs-indicator': { backgroundColor: 'primary.light' } }}
        >
          <Tab icon={<EventIcon fontSize="small" />} iconPosition="start" label="Events" />
          <Tab icon={<ContactMailIcon fontSize="small" />} iconPosition="start" label="Contacts" />
          <Tab icon={<HowToRegIcon fontSize="small" />} iconPosition="start" label="Registrations" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

          {!loading && tab === 'events' && (
            <EventsTable events={events}
              onEdit={e => setEditEvent(e)}
              onTopics={e => setTopicsEvent(e)} />
          )}
          {!loading && tab === 'contacts' && <ContactsTable contacts={contacts} />}
          {!loading && tab === 'registrations' && <RegistrationsTable registrations={registrations} />}
        </Box>
      </Paper>

      <EditEventDialog event={editEvent} slug={selectedSlug}
        onClose={() => setEditEvent(null)} onSaved={() => loadTab(selectedSlug, 'events')} />
      <TopicsDialog event={topicsEvent} slug={selectedSlug}
        onClose={() => setTopicsEvent(null)} />
    </Container>
  );
};

const cellSx = { color: 'text.secondary', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 };
const headSx = { color: 'text.disabled', borderColor: 'rgba(255,255,255,0.06)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' as const, letterSpacing: 1 };
const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const EventsTable: React.FC<{ events: AdminEvent[]; onEdit: (e: AdminEvent) => void; onTopics: (e: AdminEvent) => void }> = ({ events, onEdit, onTopics }) => (
  <TableContainer>
    <Table size="small">
      <TableHead>
        <TableRow>
          {['Event', 'Template', 'Date', 'Status', 'RSVPs', 'Topics', ''].map(h => (
            <TableCell key={h} sx={headSx}>{h}</TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {events.length === 0 && (
          <TableRow><TableCell colSpan={6} sx={{ ...cellSx, textAlign: 'center', py: 4 }}>No events</TableCell></TableRow>
        )}
        {events.map(e => (
          <TableRow key={e.id} hover sx={{ '&:hover': { background: 'rgba(255,255,255,0.03)' } }}>
            <TableCell sx={{ ...cellSx, color: 'text.primary' }}>
              <Typography variant="body2" fontWeight={500}>{e.title}</Typography>
              {e.description && <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>{e.description}</Typography>}
            </TableCell>
            <TableCell sx={cellSx}>{e.template}</TableCell>
            <TableCell sx={cellSx}>{e.start_at ? fmt(e.start_at) : '—'}</TableCell>
            <TableCell sx={cellSx}>
              <Chip label={e.status} size="small"
                color={e.status === 'active' ? 'success' : e.status === 'draft' ? 'default' : 'error'}
                variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />
            </TableCell>
            <TableCell sx={cellSx}>
              {e.max_capacity ? (
                <Box sx={{ minWidth: 80 }}>
                  <Typography variant="caption">{e.registered_count}/{e.max_capacity}</Typography>
                  <LinearProgress variant="determinate" value={(e.registered_count / e.max_capacity) * 100}
                    sx={{ mt: 0.5, height: 3, borderRadius: 1 }} />
                </Box>
              ) : e.registered_count}
            </TableCell>
            <TableCell sx={cellSx}>{e.topic_count}</TableCell>
            <TableCell sx={{ ...cellSx, whiteSpace: 'nowrap' }}>
              <Tooltip title="Edit Event">
                <IconButton size="small" onClick={() => onEdit(e)}><EditIcon sx={{ fontSize: 15 }} /></IconButton>
              </Tooltip>
              <Tooltip title="Manage Topics">
                <IconButton size="small" onClick={() => onTopics(e)}><TopicIcon sx={{ fontSize: 15 }} /></IconButton>
              </Tooltip>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

const ContactsTable: React.FC<{ contacts: Contact[] }> = ({ contacts }) => (
  <TableContainer>
    <Table size="small">
      <TableHead>
        <TableRow>
          {['Email', 'Interest', 'Notes', 'Date'].map(h => (
            <TableCell key={h} sx={headSx}>{h}</TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {contacts.length === 0 && (
          <TableRow><TableCell colSpan={4} sx={{ ...cellSx, textAlign: 'center', py: 4 }}>No contacts yet</TableCell></TableRow>
        )}
        {contacts.map(c => (
          <TableRow key={c.id} hover sx={{ '&:hover': { background: 'rgba(255,255,255,0.03)' } }}>
            <TableCell sx={{ ...cellSx, color: 'text.primary' }}>{c.email}</TableCell>
            <TableCell sx={cellSx}>{c.interest || '—'}</TableCell>
            <TableCell sx={{ ...cellSx, maxWidth: 300 }}>
              <Typography variant="body2" noWrap color="text.secondary">{c.notes || '—'}</Typography>
            </TableCell>
            <TableCell sx={cellSx}>{fmt(c.created_at)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

const RegistrationsTable: React.FC<{ registrations: Registration[] }> = ({ registrations }) => (
  <TableContainer>
    <Table size="small">
      <TableHead>
        <TableRow>
          {['Name', 'Email', 'Event', 'Notes', 'Date'].map(h => (
            <TableCell key={h} sx={headSx}>{h}</TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {registrations.length === 0 && (
          <TableRow><TableCell colSpan={5} sx={{ ...cellSx, textAlign: 'center', py: 4 }}>No registrations yet</TableCell></TableRow>
        )}
        {registrations.map(r => (
          <TableRow key={r.id} hover sx={{ '&:hover': { background: 'rgba(255,255,255,0.03)' } }}>
            <TableCell sx={{ ...cellSx, color: 'text.primary' }}>{r.name || '—'}</TableCell>
            <TableCell sx={cellSx}>{r.email}</TableCell>
            <TableCell sx={cellSx}>{r.events?.title || '—'}</TableCell>
            <TableCell sx={{ ...cellSx, maxWidth: 260 }}>
              <Typography variant="body2" noWrap color="text.secondary">{r.notes || '—'}</Typography>
            </TableCell>
            <TableCell sx={cellSx}>{fmt(r.created_at)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

export default Admin;
