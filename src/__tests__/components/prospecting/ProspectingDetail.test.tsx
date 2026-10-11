/** @jest-environment node */
import { renderToStaticMarkup } from 'react-dom/server';
import ProspectingDetail from '@/components/prospecting/ProspectingDetail';
import type { ContactConfig } from '@/lib/config/contacts';
import { getPublicPlot, type Plot } from '@/lib/prospecting/plots';

const plot = getPublicPlot('QN-P07')!;
const noChannels: ContactConfig = {
  whatsappNumber: null,
  wechatId: null,
  wechatQrSrc: null,
  email: null,
};
const render = (p: Plot, contacts = noChannels, locale = 'ru' as const) =>
  renderToStaticMarkup(
    <ProspectingDetail plot={p} locale={locale} contacts={contacts} />
  );

it('pre-fills WhatsApp with the plot code and district', () => {
  const html = render(plot, { ...noChannels, whatsappNumber: '77001234567' });
  const href = html.match(/href="(https:\/\/wa\.me\/[^"]+)"/)![1];
  const text = decodeURIComponent(href.split('text=')[1]);
  expect(text).toContain('QN-P07 (Алакольский район)');
});

it('falls back to the contact page when no channel is configured', () => {
  expect(render(plot)).toContain('href="/ru/contact"');
});

it('replaces the contact block with a note once a crew is found', () => {
  const html = render({ ...plot, status: 'matched' });
  expect(html).toContain('бригада найдена');
  expect(html).not.toContain('Обсудить работу на участке');
  expect(html).toContain('id="contact"');
});
