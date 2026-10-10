import tls from 'node:tls';

export interface TlsReport {
  reachable: boolean;
  error?: string;
  authorized?: boolean;
  authorizationError?: string | null;
  protocol?: string | null;
  cipher?: string;
  subject?: string;
  issuer?: string;
  issuerOrg?: string;
  validFrom?: string;
  validTo?: string;
  daysRemaining?: number;
  fingerprint256?: string;
  serialNumber?: string;
  altNames?: string[];
  keyBits?: number;
}

/** Opens a real TLS connection to host:443 and reads the certificate it presents. */
export function inspectTls(host: string, timeoutMs = 8000): Promise<TlsReport> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (report: TlsReport) => {
      if (settled) return;
      settled = true;
      resolve(report);
    };

    const socket = tls.connect({ host, port: 443, servername: host, rejectUnauthorized: false, timeout: timeoutMs }, () => {
      const cert = socket.getPeerCertificate(false);
      const cipher = socket.getCipher();
      if (!cert || Object.keys(cert).length === 0) {
        socket.end();
        return done({ reachable: true, error: 'Server did not present a certificate.' });
      }
      const validTo = new Date(cert.valid_to);
      const daysRemaining = Math.floor((validTo.getTime() - Date.now()) / 86_400_000);
      const altNames = (cert.subjectaltname || '')
        .split(',')
        .map((s) => s.trim().replace(/^DNS:/, ''))
        .filter(Boolean);
      const report: TlsReport = {
        reachable: true,
        authorized: socket.authorized,
        authorizationError: socket.authorizationError ? String(socket.authorizationError) : null,
        protocol: socket.getProtocol(),
        cipher: cipher?.name,
        subject: (cert.subject as any)?.CN,
        issuer: (cert.issuer as any)?.CN,
        issuerOrg: (cert.issuer as any)?.O,
        validFrom: new Date(cert.valid_from).toISOString(),
        validTo: validTo.toISOString(),
        daysRemaining,
        fingerprint256: cert.fingerprint256,
        serialNumber: cert.serialNumber,
        altNames: altNames.slice(0, 50),
        keyBits: (cert as any).bits,
      };
      socket.end();
      done(report);
    });

    socket.on('timeout', () => {
      socket.destroy();
      done({ reachable: false, error: 'Timed out connecting on port 443 (HTTPS).' });
    });
    socket.on('error', (err) => done({ reachable: false, error: err.message }));
  });
}
