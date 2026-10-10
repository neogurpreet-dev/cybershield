import React, { useRef, useState } from 'react';
import { Download, Upload, KeyRound } from 'lucide-react';
import { Button, Card, CardHeader, Field, Modal, inputCls } from '../../ui/ui';
import { deriveKey, checkVerifier, open, type Sealed } from '../../lib/vaultCrypto';
import { passwordStrength } from '../../lib/hibp';
import { downloadFile } from '../../lib/format';
import { toast } from '../../lib/toast';
import type { useVault, VaultEntry } from './useVault';

type Vault = ReturnType<typeof useVault>;

export const VaultTools: React.FC<{ v: Vault }> = ({ v }) => {
  const [changing, setChanging] = useState(false);
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [busy, setBusy] = useState(false);
  const [importFile, setImportFile] = useState<any>(null);
  const [importPass, setImportPass] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const exportBackup = () => {
    if (!v.meta) return;
    const data = { format: 'cybershield-vault-v1', exportedAt: new Date().toISOString(), salt: v.meta.salt, iterations: v.meta.iterations, verifier: v.meta.verifier, items: v.stored.map(({ iv, ct }) => ({ iv, ct })) };
    downloadFile(`cybershield-vault-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2));
    toast('Encrypted backup downloaded', 'It can only be opened with your current passphrase.', 'success');
  };

  const doImport = async () => {
    setBusy(true);
    try {
      const k = await deriveKey(importPass, importFile.salt, importFile.iterations);
      if (!(await checkVerifier(k, importFile.verifier))) return toast('Wrong passphrase for this backup', undefined, 'danger');
      let n = 0;
      for (const item of importFile.items as Sealed[]) {
        await v.save(await open<VaultEntry>(k, item));
        n++;
      }
      toast(`Imported ${n} item(s)`, 'They were re-encrypted with your current passphrase.', 'success');
      setImportFile(null);
      setImportPass('');
    } catch (e: any) {
      toast('Import failed', e.message, 'danger');
    } finally {
      setBusy(false);
    }
  };

  const change = async () => {
    setBusy(true);
    try {
      await v.changePassphrase(p1);
      toast('Passphrase changed', 'All items were re-encrypted.', 'success');
      setChanging(false);
      setP1('');
      setP2('');
    } catch (e: any) {
      toast('Could not change passphrase', e.message, 'danger');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-3">
      <CardHeader title="Vault tools" subtitle="Backups stay encrypted. To download all your other data, open Profile → Your data." />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" icon={<Download className="w-3.5 h-3.5" />} onClick={exportBackup}>Download encrypted backup</Button>
        <Button size="sm" variant="secondary" icon={<Upload className="w-3.5 h-3.5" />} onClick={() => fileRef.current?.click()}>Import backup</Button>
        <Button size="sm" variant="secondary" icon={<KeyRound className="w-3.5 h-3.5" />} onClick={() => setChanging(true)}>Change passphrase</Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            try {
              const data = JSON.parse(await f.text());
              if (data.format !== 'cybershield-vault-v1' || !Array.isArray(data.items)) throw new Error('Not a CyberShield vault backup.');
              setImportFile(data);
            } catch (err: any) {
              toast('Cannot read that file', err.message, 'danger');
            }
          }}
        />
      </div>

      <Modal open={changing} onClose={() => setChanging(false)} title="Change vault passphrase">
        <div className="space-y-3">
          <Field label="New passphrase" hint={p1 ? `Strength: ${passwordStrength(p1).label}` : 'At least 10 characters'}>
            <input type="password" className={inputCls} value={p1} onChange={(e) => setP1(e.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="Repeat new passphrase">
            <input type="password" className={inputCls} value={p2} onChange={(e) => setP2(e.target.value)} autoComplete="new-password" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setChanging(false)}>Cancel</Button>
            <Button onClick={change} loading={busy} disabled={p1.length < 10 || p1 !== p2 || passwordStrength(p1).score < 2}>Re-encrypt vault</Button>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(importFile)} onClose={() => setImportFile(null)} title="Import vault backup">
        <div className="space-y-3">
          <p className="text-xs text-slate-600 dark:text-slate-400">This backup has {importFile?.items?.length || 0} item(s). Enter the passphrase that was used when it was made.</p>
          <input type="password" className={inputCls} value={importPass} onChange={(e) => setImportPass(e.target.value)} placeholder="Backup passphrase" />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setImportFile(null)}>Cancel</Button>
            <Button onClick={doImport} loading={busy} disabled={!importPass}>Import</Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
};
