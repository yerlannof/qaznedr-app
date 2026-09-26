-- Login-free inquiries from the QAZNEDR HOLDING site (spec §5.2).
-- Written and read only by the service role on the server.
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  lead_code text,
  name text not null check (char_length(name) between 1 and 120),
  company text check (company is null or char_length(company) <= 160),
  country text check (country is null or char_length(country) <= 80),
  channel text not null
    check (channel in ('wechat', 'whatsapp', 'email', 'phone', 'telegram')),
  contact text not null check (char_length(contact) between 3 and 160),
  message text check (message is null or char_length(message) <= 2000),
  locale text not null check (locale in ('ru', 'kz', 'en', 'zh')),
  source_path text,
  utm jsonb,
  status text not null default 'NEW'
    check (status in ('NEW', 'CONTACTED', 'MEETING', 'DEAL', 'REJECTED')),
  created_at timestamptz not null default now()
);

create index if not exists inquiries_status_created_idx
  on public.inquiries (status, created_at desc);

-- RLS on with no policies: anon/authenticated get nothing; service role bypasses RLS.
alter table public.inquiries enable row level security;
revoke all on public.inquiries from anon, authenticated;
