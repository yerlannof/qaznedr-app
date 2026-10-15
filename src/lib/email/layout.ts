import 'server-only';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Plain D2-coloured transactional e-mail: paragraphs, one button, small print. */
export function renderEmailLayout(input: {
  lang: string;
  paragraphs: string[];
  button: { label: string; href: string };
  footnotes: string[];
}): { html: string; text: string } {
  const href = escapeHtml(input.button.href);
  const paragraphs = input.paragraphs
    .map(
      (line) =>
        `<tr><td style="padding-top:24px;font-size:16px;line-height:24px">${escapeHtml(line)}</td></tr>`
    )
    .join('\n');
  const html = `<!doctype html>
<html lang="${escapeHtml(input.lang)}"><body style="margin:0;background:#E9ECE6;font-family:Arial,Helvetica,sans-serif;color:#253740">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E9ECE6;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#F4F5F0;border-top:4px solid #253740;padding:32px">
<tr><td style="font-size:20px;font-weight:bold;letter-spacing:2px">QAZNEDR</td></tr>
${paragraphs}
<tr><td style="padding-top:24px"><a href="${href}" style="display:inline-block;background:#DDE55E;color:#253740;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 32px;border-radius:4px">${escapeHtml(input.button.label)}</a></td></tr>
<tr><td style="padding-top:24px;font-size:14px;line-height:20px;color:#51616A">${input.footnotes.map(escapeHtml).join('<br>')}</td></tr>
</table></td></tr></table></body></html>`;
  const text = [
    ...input.paragraphs,
    '',
    `${input.button.label}: ${input.button.href}`,
    ...(input.footnotes.length ? ['', ...input.footnotes] : []),
  ].join('\n');
  return { html, text };
}
