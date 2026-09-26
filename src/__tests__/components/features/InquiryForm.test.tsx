import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import InquiryForm from '@/components/features/InquiryForm';

jest.mock('@vercel/analytics', () => ({ track: jest.fn() }));

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

function fill() {
  fireEvent.change(screen.getByLabelText(/^Name/), {
    target: { value: 'Li Wei' },
  });
  fireEvent.change(screen.getByLabelText(/ID \/ number \/ email/), {
    target: { value: 'liwei_88' },
  });
}

describe('InquiryForm', () => {
  it('posts the inquiry with the area code and shows success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ success: true }),
    }) as unknown as typeof fetch;
    render(<InquiryForm locale="en" leadCode="AU-508A4C" />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Send inquiry' }));
    expect(await screen.findByText('Inquiry sent')).toBeInTheDocument();
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/inquiries');
    expect(JSON.parse(init.body)).toMatchObject({
      name: 'Li Wei',
      contact: 'liwei_88',
      channel: 'whatsapp',
      leadCode: 'AU-508A4C',
      locale: 'en',
      website: '',
    });
  });

  it('defaults to WeChat for Chinese visitors', () => {
    render(<InquiryForm locale="zh" />);
    expect((screen.getByLabelText('联系方式') as HTMLSelectElement).value).toBe(
      'wechat'
    );
  });

  it('disables the button while sending', async () => {
    let resolve: (v: unknown) => void = () => {};
    global.fetch = jest.fn(
      () => new Promise((r) => (resolve = r))
    ) as unknown as typeof fetch;
    render(<InquiryForm locale="en" />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Send inquiry' }));
    expect(screen.getByRole('button', { name: 'Sending…' })).toBeDisabled();
    resolve({ status: 200, json: async () => ({ success: true }) });
    await screen.findByText('Inquiry sent');
  });

  it('explains rate limiting', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 429,
      json: async () => ({ success: false }),
    }) as unknown as typeof fetch;
    render(<InquiryForm locale="en" />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Send inquiry' }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/Too many inquiries/)
    );
  });
});

it('prefills the approved service topic but allows the visitor to edit their message', async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValue({ status: 200, json: async () => ({ success: true }) });
  render(<InquiryForm locale="en" initialMessage="Licensing" />);
  const message = screen.getByLabelText(/^Message/);
  expect(message).toHaveValue('Licensing');
  fireEvent.change(message, {
    target: { value: 'Licensing: please discuss the documents' },
  });
  fill();
  fireEvent.click(screen.getByRole('button', { name: 'Send inquiry' }));
  await screen.findByText('Inquiry sent');
  expect(
    JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body).message
  ).toBe('Licensing: please discuss the documents');
});
