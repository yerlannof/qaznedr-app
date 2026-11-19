-- Permanent links to the current buyer PDFs (T-0158, /offer/*).
-- Private bucket: files are served only through short signed URLs from the
-- /offer route handlers; the manifest with the unlisted-page keys sits here too.
insert into storage.buckets (id, name, public, file_size_limit)
values ('offer-files', 'offer-files', false, 52428800)
on conflict (id) do nothing;

-- Open counter: document and version only, no personal data.
create table if not exists public.offer_opens (
  id bigserial primary key,
  doc text not null,
  version text not null,
  at timestamptz not null default now()
);
create index if not exists offer_opens_at_idx on public.offer_opens (at desc);

-- RLS on with no policies: only the service role (route handlers) reads/writes.
alter table public.offer_opens enable row level security;
revoke all on public.offer_opens from anon, authenticated;
