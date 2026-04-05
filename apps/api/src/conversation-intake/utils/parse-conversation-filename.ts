export function parseConversationFilename(filename: string) {
  const base = filename.replace(/\.txt$/i, '');
  const parts = base.split('-');

  const [dateRaw, phoneRaw, channelRaw] = parts;

  let dateFromFile: Date | null = null;
  if (/^\d{8}$/.test(dateRaw || '')) {
    const year = Number(dateRaw.slice(0, 4));
    const month = Number(dateRaw.slice(4, 6)) - 1;
    const day = Number(dateRaw.slice(6, 8));
    dateFromFile = new Date(Date.UTC(year, month, day));
  }

  return {
    originalFilename: filename,
    dateFromFile,
    phoneFromFile: phoneRaw || null,
    sourceChannel:
      channelRaw === 'wha' ? 'WHATSAPP'
      : channelRaw === 'sms' ? 'SMS'
      : channelRaw === 'eml' ? 'EMAIL'
      : channelRaw || 'OTHER',
  };
}
