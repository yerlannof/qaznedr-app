import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ContactChannels from '@/components/features/ContactChannels';
import { track } from '@vercel/analytics';

jest.mock('@vercel/analytics', () => ({ track: jest.fn() }));

const full = {
  whatsappNumber: '77001234567',
  wechatId: 'qaznedr_holding',
  wechatQrSrc: '/contacts/wechat-qr.png',
  email: 'info@qaznedr.kz',
};

const order = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-channel]')).map((n) =>
    n.getAttribute('data-channel')
  );

describe('ContactChannels', () => {
  beforeEach(() => (track as jest.Mock).mockReset());
  it('puts WeChat first for Chinese visitors', () => {
    const { container } = render(
      <ContactChannels config={full} locale="zh" leadCode="AU-1" />
    );
    expect(order(container)).toEqual(['wechat', 'whatsapp', 'email']);
    expect(
      screen.getByAltText('QAZNEDR HOLDING 微信二维码')
    ).toBeInTheDocument();
  });

  it('puts WhatsApp first elsewhere with the area code prefilled', () => {
    const { container } = render(
      <ContactChannels config={full} locale="en" leadCode="AU-1" />
    );
    expect(order(container)[0]).toBe('whatsapp');
    expect(
      screen.getByRole('link', { name: /WhatsApp/ }).getAttribute('href')
    ).toBe(
      `https://wa.me/77001234567?text=${encodeURIComponent(
        'Hello! I am interested in area AU-1 on qaznedr.kz.'
      )}`
    );
  });

  it('renders nothing for channels that are not configured', () => {
    const { container } = render(
      <ContactChannels
        config={{
          whatsappNumber: null,
          wechatId: null,
          wechatQrSrc: null,
          email: null,
        }}
        locale="ru"
      />
    );
    expect(order(container)).toEqual([]);
  });

  it('keeps the WeChat ID visible when the clipboard API is missing', () => {
    const original = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });
    render(<ContactChannels config={full} locale="zh" />);
    fireEvent.click(screen.getByRole('button', { name: '复制' }));
    expect(screen.getByText('qaznedr_holding')).toBeInTheDocument();
    Object.defineProperty(navigator, 'clipboard', {
      value: original,
      configurable: true,
    });
  });

  it('shows the copied state after a successful copy', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    render(<ContactChannels config={full} locale="zh" />);
    fireEvent.click(screen.getByRole('button', { name: '复制' }));
    expect(await screen.findByText('已复制')).toBeInTheDocument();
    expect(track).toHaveBeenCalledWith(
      'wechat_copy',
      expect.objectContaining({ locale: 'zh', lead: '' })
    );
  });

  it('tracks only successful copies and tracks email context without contact content', async () => {
    const writeText = jest.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    render(
      <ContactChannels
        config={full}
        locale="en"
        leadCode="AU-1"
        serviceTopic="licensing"
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(track).not.toHaveBeenCalledWith('wechat_copy', expect.anything());
    writeText.mockResolvedValue(undefined);
    fireEvent.click(
      screen.getByRole('button', { name: 'Copy AU-1 · Licensing' })
    );
    await waitFor(() =>
      expect(track).toHaveBeenCalledWith('contact_context_copy', {
        locale: 'en',
        lead: 'AU-1',
        topic: 'licensing',
      })
    );
    const email = screen.getByRole('link', { name: 'info@qaznedr.kz' });
    email.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(email);
    expect(track).toHaveBeenCalledWith('click_email', {
      locale: 'en',
      lead: 'AU-1',
      topic: 'licensing',
    });
  });

  it('keeps the area code visible by WeChat and copies it separately from the WeChat ID', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const { container } = render(
      <ContactChannels config={full} locale="zh" leadCode="AU-1" />
    );
    const wechat = container.querySelector(
      '[data-channel="wechat"]'
    ) as HTMLElement;
    expect(wechat).toHaveTextContent('AU-1');
    fireEvent.click(screen.getByRole('button', { name: '复制 AU-1' }));
    expect(writeText).toHaveBeenCalledWith('AU-1');
    expect(
      await screen.findByRole('button', { name: '已复制 AU-1' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '复制' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '复制' }));
    expect(writeText).toHaveBeenCalledWith('qaznedr_holding');
    expect(
      await screen.findByRole('button', { name: '已复制' })
    ).toBeInTheDocument();
  });

  it('includes the area code in email but keeps general email unchanged', () => {
    const { rerender } = render(
      <ContactChannels config={full} locale="en" leadCode="CU-42" />
    );
    const href = screen
      .getByRole('link', { name: 'info@qaznedr.kz' })
      .getAttribute('href')!;
    expect(href).toMatch(/^mailto:info@qaznedr\.kz\?body=/);
    expect(href).toContain('%20');
    expect(href).not.toContain('+');
    expect(new URL(href).searchParams.get('body')).toBe(
      'Hello! I am interested in area CU-42 on qaznedr.kz.'
    );
    rerender(<ContactChannels config={full} locale="en" />);
    expect(
      screen.getByRole('link', { name: 'info@qaznedr.kz' })
    ).toHaveAttribute('href', 'mailto:info@qaznedr.kz');
  });
});

it('preserves the approved service topic in WhatsApp, WeChat copy and email', async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
  render(
    <ContactChannels config={full} locale="en" serviceTopic="licensing" />
  );
  expect(
    decodeURIComponent(
      screen.getByRole('link', { name: /WhatsApp/ }).getAttribute('href')!
    )
  ).toContain('Licensing');
  expect(
    decodeURIComponent(
      screen
        .getByRole('link', { name: 'info@qaznedr.kz' })
        .getAttribute('href')!
    )
  ).toContain('Licensing');
  fireEvent.click(screen.getByRole('button', { name: 'Copy Licensing' }));
  expect(writeText).toHaveBeenCalledWith('Licensing');
  expect(
    await screen.findByRole('button', { name: 'Copied Licensing' })
  ).toBeInTheDocument();
});

it.each([
  ['ru', 'Отсканируйте QR-код в WeChat и укажите тему обращения.'],
  ['kz', 'WeChat-та QR-кодты сканерлеп, өтініш тақырыбын көрсетіңіз.'],
  ['en', 'Scan the QR code in WeChat and mention the inquiry topic.'],
  ['zh', '请用微信扫描二维码添加，并注明咨询主题。'],
])(
  'uses the service instruction in %s instead of requesting an absent area code',
  (locale, hint) => {
    render(
      <ContactChannels config={full} locale={locale} serviceTopic="analytics" />
    );
    expect(screen.getByText(hint)).toBeInTheDocument();
  }
);
