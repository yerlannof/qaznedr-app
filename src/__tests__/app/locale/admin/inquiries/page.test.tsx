import { render, screen } from '@testing-library/react';
import AdminInquiriesPage from '@/app/[locale]/admin/inquiries/page';

jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...props
  }: React.PropsWithChildren<{ href: string }>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({ locale: 'ru' }),
}));

const base = {
  lead_code: null,
  company: null,
  country: null,
  channel: 'whatsapp',
  contact: '+77000000000',
  message: null,
  locale: 'ru',
  source_path: '/ru/contact',
  status: 'NEW',
  created_at: '2026-09-29T09:00:00.000Z',
};

beforeEach(() => {
  jest.resetAllMocks();
});

it('shows only safe saved attribution and distinguishes entry from form page', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    status: 200,
    json: async () => ({
      success: true,
      data: [
        {
          ...base,
          id: 'tagged',
          name: 'Tagged inquiry',
          utm: {
            source: 'baidu',
            medium: 'paid',
            campaign: 'gold_kz',
            term: 'gold mine',
            content: 'ad_a',
            landing_path: '/zh/minerals/gold',
            referrer_host: 'www.baidu.com',
            unknown: 'SHOULD_NOT_RENDER',
          },
        },
        { ...base, id: 'legacy', name: 'Legacy inquiry', utm: null },
        {
          ...base,
          id: 'bad',
          name: 'Malformed inquiry',
          utm: {
            source: '<script>bad</script>',
            campaign: 'x'.repeat(201),
            medium: 42,
            content: '   ',
            landing_path: '//evil.example',
            referrer_host: 'bad host',
            unexpected: 'LEAKED_FIELD',
          },
        },
      ],
    }),
  }) as jest.Mock;
  render(<AdminInquiriesPage />);
  expect(await screen.findByText('Tagged inquiry')).toBeInTheDocument();
  expect(screen.getByText('Источник UTM: baidu')).toBeInTheDocument();
  expect(screen.getByText('Канал UTM: paid')).toBeInTheDocument();
  expect(screen.getByText('Кампания UTM: gold_kz')).toBeInTheDocument();
  expect(screen.getByText('Термин UTM: gold mine')).toBeInTheDocument();
  expect(screen.getByText('Вариант UTM: ad_a')).toBeInTheDocument();
  expect(
    screen.getByText('Первый вход: /zh/minerals/gold')
  ).toBeInTheDocument();
  expect(screen.getByText('Реферер: www.baidu.com')).toBeInTheDocument();
  expect(
    screen.getByText('Источник UTM: <script>bad</script>')
  ).toBeInTheDocument();
  expect(document.querySelector('script')).toBeNull();
  expect(screen.getAllByText('Страница формы: /ru/contact')).toHaveLength(3);
  expect(
    screen.queryByText(
      /SHOULD_NOT_RENDER|LEAKED_FIELD|bad host|x{201}|Вариант UTM:\s*$/
    )
  ).not.toBeInTheDocument();
  expect(
    screen.getByText(
      'Последние 200 заявок выбранного статуса; не отчёт за всё время.'
    )
  ).toBeInTheDocument();
});

it('shows no inquiry data after a 403 response', async () => {
  global.fetch = jest.fn().mockResolvedValue({ status: 403 }) as jest.Mock;
  render(<AdminInquiriesPage />);
  expect(
    await screen.findByText('Доступ только для администраторов')
  ).toBeInTheDocument();
  expect(screen.queryByText('Tagged inquiry')).not.toBeInTheDocument();
  expect(screen.queryByText(/Источник UTM/)).not.toBeInTheDocument();
});
