export type ParsedDocumentFilename = {
  raw: string;
  phone?: string;
  nameParts: string[];
  documentTypeHint?: string;
  versionHint?: number;
  extension?: string;
};

const knownDocumentTypeHints = [
  'paszport',
  'passport',
  'visa',
  'karta',
  'kp',
  'pesel',
  'payment',
  'proof',
  'contract',
  'cv',
  'photo',
];

export function parseDocumentFilename(filename: string): ParsedDocumentFilename {
  const lastDot = filename.lastIndexOf('.');
  const extension = lastDot >= 0 ? filename.slice(lastDot + 1).toLowerCase() : undefined;
  const base = lastDot >= 0 ? filename.slice(0, lastDot) : filename;

  const parts = base.split('-').filter(Boolean);

  let phone: string | undefined;
  let versionHint: number | undefined;
  let documentTypeHint: string | undefined;

  const nameParts: string[] = [];

  for (const part of parts) {
    const lower = part.toLowerCase();

    if (!phone && /^\d{8,15}$/.test(lower)) {
      phone = lower;
      continue;
    }

    const versionMatch = lower.match(/^(\d+)$/);
    if (versionMatch) {
      versionHint = Number(versionMatch[1]);
      continue;
    }

    if (!documentTypeHint && knownDocumentTypeHints.includes(lower)) {
      documentTypeHint = lower;
      continue;
    }

    nameParts.push(part);
  }

  return {
    raw: filename,
    phone,
    nameParts,
    documentTypeHint,
    versionHint,
    extension,
  };
}
