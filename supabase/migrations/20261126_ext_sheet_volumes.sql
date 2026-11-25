-- Qaznedr block extension (T-0220, Erlan 26.11 "not empty"): per 1:100 000 sheet, how many of our reports cover it.
-- volumes      = reports that name this 1:100 000 sheet (or its 1:50 000 parts), or have a registry point on it;
-- volumes_wide = reports tied only through the enclosing 1:200 000 sheet. Counts only, no report numbers.
alter table public.ext_sheet_reports add column if not exists volumes integer not null default 0;
alter table public.ext_sheet_reports add column if not exists volumes_wide integer not null default 0;
