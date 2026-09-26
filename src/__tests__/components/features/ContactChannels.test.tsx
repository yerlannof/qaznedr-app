import { fireEvent, render, screen } from '@testing-library/react';
import ContactChannels from '@/components/features/ContactChannels';

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
  });
});
