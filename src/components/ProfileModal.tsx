import React, { useEffect, useState } from 'react';
import { Download, LogOut, Trash2, Save, Bell } from 'lucide-react';
import { setDoc } from 'firebase/firestore';
import { Button, Field, Modal, inputCls } from '../ui/ui';
import { useAuth } from '../hooks/useAuth';
import { deleteAllData, exportAllData, userDoc } from '../lib/db';
import { downloadFile, formatDateTime } from '../lib/format';
import { toast } from '../lib/toast';

export const ProfileModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { user, profile, signOutUser } = useAuth();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [perm, setPerm] = useState<string>(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');

  useEffect(() => {
    if (open) {
      setName(profile?.displayName || user?.displayName || '');
      setRole(profile?.role || '');
      setConfirmText('');
    }
  }, [open, profile, user]);

  if (!user) return null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await setDoc(userDoc(user.uid), { displayName: name.trim(), role: role.trim() }, { merge: true });
      toast('Profile saved', undefined, 'success');
      onClose();
    } catch (err: any) {
      toast('Could not save profile', err.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const doExport = async () => {
    setExporting(true);
    try {
      const data = await exportAllData(user.uid);
      downloadFile(`cybershield-my-data-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2));
      toast('Export ready', 'A copy of all your CyberShield data was downloaded.', 'success');
    } catch (err: any) {
      toast('Export failed', err.message, 'danger');
    } finally {
      setExporting(false);
    }
  };

  const doDelete = async () => {
    setDeleting(true);
    try {
      await deleteAllData(user.uid);
      toast('All your data was deleted', 'Signing you out.', 'success');
      await signOutUser();
    } catch (err: any) {
      toast('Delete failed', err.message, 'danger');
      setDeleting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Your profile & account">
      <div className="flex items-center gap-3 mb-4">
        {user.photoURL && <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-11 h-11 rounded-full" />}
        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{user.email}</div>
          <div className="text-[11px] text-slate-500">Signed in with Google · member since {formatDateTime(profile?.createdAt || user.metadata.creationTime || null)}</div>
        </div>
      </div>

      <form onSubmit={save} className="space-y-3">
        <Field label="Display name" hint="Shown on SOS messages and incident reports.">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
        </Field>
        <Field label="Role (optional)" hint="e.g. Student, IT admin, Small business owner">
          <input className={inputCls} value={role} onChange={(e) => setRole(e.target.value)} maxLength={80} />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" loading={saving} icon={<Save className="w-3.5 h-3.5" />}>Save profile</Button>
        </div>
      </form>

      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Notifications on this device</div>
        <p className="text-[11px] text-slate-500">Used for task reminders while CyberShield is open in a tab.</p>
        <Button
          variant="secondary"
          size="sm"
          icon={<Bell className="w-3.5 h-3.5" />}
          disabled={perm === 'granted' || perm === 'denied' || perm === 'unsupported'}
          onClick={async () => setPerm(await Notification.requestPermission())}
        >
          {perm === 'granted' ? 'Enabled' : perm === 'denied' ? 'Blocked in browser settings' : perm === 'unsupported' ? 'Not supported' : 'Enable notifications'}
        </Button>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Your data</div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" loading={exporting} onClick={doExport} icon={<Download className="w-3.5 h-3.5" />}>Download all my data</Button>
          <Button variant="secondary" size="sm" onClick={signOutUser} icon={<LogOut className="w-3.5 h-3.5" />}>Sign out</Button>
        </div>
      </div>

      <div className="mt-5 p-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/20 space-y-2">
        <div className="text-xs font-bold text-rose-700 dark:text-rose-300">Delete everything</div>
        <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80">Permanently deletes your incidents, domains, contacts, tasks, vault and history from CyberShield. This cannot be undone. Type DELETE to confirm.</p>
        <div className="flex gap-2">
          <input className={inputCls} value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" />
          <Button variant="danger" size="sm" disabled={confirmText !== 'DELETE'} loading={deleting} onClick={doDelete} icon={<Trash2 className="w-3.5 h-3.5" />}>Delete</Button>
        </div>
      </div>
    </Modal>
  );
};
