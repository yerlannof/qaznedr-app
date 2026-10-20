'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import MarketplaceSignIn from './MarketplaceSignIn';
import CompanyProfileEditor from './CompanyProfileEditor';
import {
  Archive,
  Copy,
  LayoutGrid,
  List,
  Loader2,
  LogOut,
  MessageCircle,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { translate } from '@/lib/i18n/translations';
import { regionLabel } from '@/lib/data/filter-config';
import { whatsappLink } from '@/lib/config/contacts';
import type { EquipmentListing } from '@/lib/equipment-listings/domain';
import { EQUIPMENT_STATUSES } from '@/lib/equipment-listings/domain';
import { isServiceCategory } from '@/lib/equipment-listings/taxonomy';

type Status = EquipmentListing['status'];
type Filter = Status | 'ALL';
type Mark = { mark: string; setAt: string };
type Profile = {
  full_name: string;
  email: string;
  company_name: string | null;
  phone: string | null;
};

// Same keys as EquipmentIntake: the intake opens whichever draft id is bound here.
const draftKey = (ownerId: string) => `qaznedr:equipment-draft:${ownerId}`;
const viewKey = 'qaznedr:equipment-cabinet:view';
// Status differs by colour and by form: a dot in a 1 px frame, dashed for drafts.
const STATUS_CLASS: Record<Status, string> = {
  DRAFT: 'border-dashed text-brand-muted',
  PENDING_MODERATION: 'text-brand-warn',
  ACTIVE: 'text-brand-ok',
  REJECTED: 'text-brand-bad',
  ARCHIVED: 'text-brand-muted',
};
const primary = 'brand-button brand-focus min-h-11 px-3.5 text-sm';
const ghost = 'brand-button-secondary brand-focus min-h-11 px-3.5 text-sm';

function Thumb({
  listing,
  label,
}: {
  listing: EquipmentListing;
  /** Shown on the dark strip when the listing has no photo. */
  label: string;
}) {
  const [state, setState] = useState<{ cover: string | null; count: number }>();
  useEffect(() => {
    let live = true;
    fetch(`/api/equipment-listings/${listing.id}/images`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const rows: { id: string; position: number }[] = json?.data ?? [];
        const first = [...rows].sort((a, b) => a.position - b.position)[0];
        if (live) setState({ cover: first?.id ?? null, count: rows.length });
      })
      .catch(() => live && setState({ cover: null, count: 0 }));
    return () => {
      live = false;
    };
  }, [listing.id, listing.revision]);
  if (!state?.cover)
    return (
      <div className="flex h-full items-end bg-brand-deep p-4 text-[13px] text-brand-chalk/75">
        {label}
      </div>
    );
  return (
    // Private owner photo served by an authenticated route; not for next/image caching.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/equipment-listings/${listing.id}/images/${state.cover}`}
      alt=""
      className="h-full w-full object-cover"
    />
  );
}

export default function OwnerCabinet({
  locale,
  googleEnabled,
  emailEnabled = false,
  whatsappNumber,
  navigate = (url: string) => window.location.assign(url),
}: {
  locale: string;
  googleEnabled: boolean;
  emailEnabled?: boolean;
  whatsappNumber: string | null;
  /** Full page load so the intake re-reads the bound draft; replaceable in tests. */
  navigate?: (url: string) => void;
}) {
  const t = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      translate(locale, `equipmentCabinet.${key}`, params),
    [locale]
  );
  const intake = (key: string) => translate(locale, `equipmentIntake.${key}`);
  const { data: session, status: authStatus } = useSession();
  const ownerId = (session?.user as { id?: string } | undefined)?.id ?? null;
  const [listings, setListings] = useState<EquipmentListing[] | null>(null);
  const [marks, setMarks] = useState<Record<string, Mark[]>>({});
  const [stats, setStats] = useState<
    Record<string, { views: number; contacts: number }>
  >({});
  const [responses, setResponses] = useState<
    Record<
      string,
      {
        id: string;
        name: string;
        phone: string;
        message: string;
        createdAt: string;
      }[]
    >
  >({});
  const [profile, setProfile] = useState<Profile | null>(null);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [view, setView] = useState<'cards' | 'list'>('cards');
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [contact, setContact] = useState({
    full_name: '',
    company_name: '',
    phone: '',
  });

  useEffect(() => {
    try {
      if (localStorage.getItem(viewKey) === 'list') setView('list');
    } catch {
      /* storage unavailable: cards */
    }
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/equipment-listings');
      const json = res.ok ? await res.json() : null;
      if (!json?.success) throw new Error('load');
      setListings(json.data);
      setMarks(json.trustMarks ?? {});
      setStats(json.stats ?? {});
      setResponses(json.responses ?? {});
    } catch {
      setListings([]);
      setError(t('loadError'));
    }
    fetch('/api/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => json?.profile && setProfile(json.profile))
      .catch(() => undefined);
  }, [t]);

  useEffect(() => {
    if (authStatus === 'authenticated') void load();
  }, [authStatus, load]);

  const counts = useMemo(() => {
    const result: Record<Filter, number> = {
      ALL: listings?.length ?? 0,
      DRAFT: 0,
      PENDING_MODERATION: 0,
      ACTIVE: 0,
      REJECTED: 0,
      ARCHIVED: 0,
    };
    for (const listing of listings ?? []) result[listing.status]++;
    return result;
  }, [listings]);
  const shown = (listings ?? []).filter(
    (listing) => filter === 'ALL' || listing.status === filter
  );

  const switchView = (next: 'cards' | 'list') => {
    setView(next);
    try {
      localStorage.setItem(viewKey, next);
    } catch {
      /* ignore */
    }
  };
  const openInIntake = (id: string | null, edit = false) => {
    if (!ownerId) return;
    try {
      if (id) localStorage.setItem(draftKey(ownerId), id);
      else localStorage.removeItem(draftKey(ownerId));
    } catch {
      /* the intake reports unavailable storage itself */
    }
    navigate(`/${locale}/equipment/new${edit ? '?edit=1' : ''}`);
  };
  // A company with several similar rigs fills one form and copies it.
  const duplicate = async (listing: EquipmentListing) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/equipment-listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listing.data),
      });
      const json = res.ok ? await res.json() : null;
      const id = json?.data?.id;
      if (typeof id === 'string') {
        openInIntake(id);
        return;
      }
      setError(t(res.status === 429 ? 'limitReached' : 'actionError'));
    } catch {
      setError(t('actionError'));
    } finally {
      setBusy(false);
    }
  };
  const archive = async (listing: EquipmentListing) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/equipment-listings/${listing.id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expectedRevision: listing.revision }),
      });
      if (!res.ok) setError(t('actionError'));
      setConfirming(null);
      await load();
    } finally {
      setBusy(false);
    }
  };
  const saveContact = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: contact.full_name.trim(),
          company_name: contact.company_name.trim() || null,
          phone: contact.phone.trim(),
        }),
      });
      const json = res.ok ? await res.json() : null;
      if (json?.profile) {
        setProfile(json.profile);
        setEditing(false);
      } else setError(t('actionError'));
    } finally {
      setBusy(false);
    }
  };

  const formatDate = (iso?: string) =>
    iso
      ? new Intl.DateTimeFormat(locale === 'kz' ? 'kk-KZ' : locale, {
          day: 'numeric',
          month: 'long',
        }).format(new Date(iso))
      : '';

  if (authStatus === 'loading')
    return (
      <p className="brand-container flex items-center gap-2 py-16 text-brand-muted">
        <Loader2 aria-hidden className="animate-spin" size={18} />
      </p>
    );

  if (authStatus !== 'authenticated')
    return (
      <section className="brand-container grid max-w-2xl gap-4 pb-16 pt-10 md:pt-14">
        <p className="holding-eyebrow text-brand-muted">{t('eyebrow')}</p>
        <h1 className="text-[34px] font-light leading-[1.04] tracking-[-0.025em] sm:text-[44px] lg:text-[52px]">
          {t('signInTitle')}
        </h1>
        <p className="max-w-[58ch] text-[17px] text-brand-muted">
          {t('signInText')}
        </p>
        <div className="mt-4">
          <MarketplaceSignIn
            locale={locale}
            googleEnabled={googleEnabled}
            emailEnabled={emailEnabled}
            callbackUrl={`/${locale}/equipment/my`}
          />
        </div>
      </section>
    );

  const tagline = (listing: EquipmentListing) =>
    [
      listing.data.category ? intake(listing.data.category) : null,
      listing.data.offerType && !isServiceCategory(listing.data.category)
        ? intake(listing.data.offerType)
        : null,
      [
        listing.data.city,
        listing.data.region && regionLabel(listing.data.region, locale),
      ]
        .filter(Boolean)
        .join(', ') || null,
    ]
      .filter(Boolean)
      .join(' · ');

  const stripLabel = (listing: EquipmentListing) =>
    listing.status === 'DRAFT'
      ? t('status_DRAFT')
      : [
          listing.data.category ? intake(listing.data.category) : null,
          listing.data.offerType ? intake(listing.data.offerType) : null,
        ]
          .filter(Boolean)
          .join(' · ');

  return (
    <div className="brand-container pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-7 pt-10 md:pb-9 md:pt-14">
        <div className="grid min-w-0 gap-3">
          <p className="holding-eyebrow text-brand-muted">{t('eyebrow')}</p>
          <h1 className="text-[34px] font-light leading-[1.04] tracking-[-0.025em] sm:text-[44px] lg:text-[52px]">
            {t('title')}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => openInIntake(null)}
          className="brand-button brand-focus"
        >
          <Plus aria-hidden className="size-[18px]" strokeWidth={1.6} />
          {t('new').replace(/^\+\s*/, '')}
        </button>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-14">
        <section aria-label={t('title')} className="grid min-w-0 gap-5">
          <div
            role="group"
            aria-label={t('title')}
            className="-mx-1 flex gap-2 overflow-x-auto px-1 [scrollbar-width:none]"
          >
            {(['ALL', ...EQUIPMENT_STATUSES] as Filter[]).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
                className={`brand-focus inline-flex min-h-11 flex-none items-center gap-2 border px-[18px] text-[15px] ${filter === item ? 'border-brand-ink bg-brand-ink text-brand-bg' : 'border-brand-hair bg-transparent'}`}
              >
                {item === 'ALL' ? t('all') : t(item)}{' '}
                <small className="text-xs opacity-65">{counts[item]}</small>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[13px] text-brand-muted">
              {t('shown', { count: shown.length })}
            </span>
            <div
              role="group"
              aria-label={t('view')}
              className="inline-flex border border-brand-hair"
            >
              {(['cards', 'list'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={view === item}
                  onClick={() => switchView(item)}
                  className={`brand-focus inline-flex min-h-11 items-center gap-2 px-3.5 text-[13px] ${view === item ? 'bg-brand-ink text-brand-bg' : 'bg-transparent'}`}
                >
                  {item === 'cards' ? (
                    <LayoutGrid aria-hidden size={16} strokeWidth={1.6} />
                  ) : (
                    <List aria-hidden size={16} strokeWidth={1.6} />
                  )}
                  {item === 'cards' ? t('viewCards') : t('viewList')}
                </button>
              ))}
            </div>
          </div>
          {error && (
            <p role="alert" className="text-sm font-medium text-brand-bad">
              {error}
            </p>
          )}
          {listings === null ? (
            <p className="flex items-center gap-2 text-brand-muted">
              <Loader2 aria-hidden className="animate-spin" size={18} />
            </p>
          ) : shown.length === 0 ? (
            <div className="grid justify-items-start gap-4 bg-brand-surface p-6 md:p-8">
              <p className="text-[17px]">
                {listings.length ? t('empty') : t('emptyAll')}
              </p>
              <button
                type="button"
                onClick={() => openInIntake(null)}
                className="brand-button brand-focus"
              >
                <Plus aria-hidden className="size-[18px]" strokeWidth={1.6} />
                {t('new').replace(/^\+\s*/, '')}
              </button>
            </div>
          ) : (
            <ul
              className={`grid gap-5 ${view === 'cards' ? 'md:grid-cols-2' : ''}`}
            >
              {shown.map((listing) => {
                const listingMarks = marks[listing.id] ?? [];
                const listingStats = stats[listing.id];
                return (
                  <li
                    key={listing.id}
                    className={`flex min-w-0 bg-brand-surface ${view === 'list' ? 'flex-col sm:grid sm:grid-cols-[8.5rem_minmax(0,1fr)]' : 'flex-col'}`}
                  >
                    <div
                      className={`overflow-hidden ${view === 'cards' ? 'aspect-[16/7]' : 'aspect-[16/7] sm:aspect-auto sm:min-h-28'}`}
                    >
                      <Thumb listing={listing} label={stripLabel(listing)} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-3 p-[18px]">
                      <span
                        className={`inline-flex items-center gap-1.5 self-start border border-current px-[9px] py-1 text-xs font-medium ${STATUS_CLASS[listing.status]}`}
                      >
                        <span
                          aria-hidden
                          className="size-[7px] rounded-full bg-current"
                        />
                        {t(`status_${listing.status}`)}
                      </span>
                      <h2 className="text-[19px] font-normal leading-[1.3] tracking-[-0.01em]">
                        {listing.data.title || t('untitled')}
                      </h2>
                      <p className="text-[13px] text-brand-muted">
                        {tagline(listing)}
                      </p>
                      {listing.status === 'REJECTED' &&
                        listing.moderationNotes && (
                          <div className="border-l-2 border-brand-bad pl-3 text-sm">
                            <strong className="block text-[13px] font-medium text-brand-bad">
                              {t('reasonTitle')}
                            </strong>
                            {listing.moderationNotes}
                          </div>
                        )}
                      {listing.status === 'PENDING_MODERATION' && (
                        <div className="border-l-2 border-brand-warn pl-3 text-sm text-brand-muted">
                          <strong className="block text-[13px] font-medium text-brand-warn">
                            {t('pendingTitle')}
                          </strong>
                          {t('pendingText')}
                        </div>
                      )}
                      {listing.status === 'ACTIVE' && (
                        <div className="grid grid-cols-2 gap-px bg-brand-hair">
                          <div className="grid bg-brand-surface py-3">
                            <b className="text-[26px] font-light leading-[1.1] tabular-nums">
                              {listingStats?.views ?? 0}
                            </b>
                            <span className="text-xs text-brand-muted">
                              {t('statViews')}
                            </span>
                          </div>
                          <div className="grid bg-brand-surface py-3 pl-3.5">
                            <b className="text-[26px] font-light leading-[1.1] tabular-nums">
                              {listingStats?.contacts ?? 0}
                            </b>
                            <span className="text-xs text-brand-muted">
                              {t('statContacts')}
                            </span>
                          </div>
                        </div>
                      )}
                      {listing.status === 'ACTIVE' &&
                        listingMarks.length > 0 && (
                          <ul className="grid gap-2.5">
                            {listingMarks.map((row) => (
                              <li
                                key={row.mark}
                                className="flex items-center gap-2.5 text-sm"
                              >
                                <ShieldCheck
                                  aria-hidden
                                  className="size-[18px] flex-none text-brand-ok"
                                  strokeWidth={1.6}
                                />
                                {t(`trust_${row.mark}`)}
                                <time
                                  dateTime={row.setAt}
                                  className="ml-auto whitespace-nowrap text-[13px] text-brand-muted"
                                >
                                  {formatDate(row.setAt)}
                                </time>
                              </li>
                            ))}
                          </ul>
                        )}
                      {listing.data.offerType === 'WANTED' &&
                        listing.status === 'ACTIVE' && (
                          <details
                            className="border-t border-brand-hair pt-1"
                            open={(responses[listing.id]?.length ?? 0) > 0}
                          >
                            <summary className="brand-focus flex min-h-11 cursor-pointer items-center text-xs font-medium uppercase tracking-[0.14em] text-brand-muted">
                              {t('responses', {
                                count: responses[listing.id]?.length ?? 0,
                              })}
                            </summary>
                            {responses[listing.id]?.length ? (
                              <ul className="grid gap-2">
                                {responses[listing.id].map((row) => (
                                  <li
                                    key={row.id}
                                    className="grid gap-0.5 bg-brand-bg px-3.5 py-3 text-sm"
                                  >
                                    <p className="font-medium">
                                      {row.name} ·{' '}
                                      <a
                                        href={`tel:${row.phone}`}
                                        className="brand-focus underline underline-offset-4"
                                      >
                                        {row.phone}
                                      </a>
                                    </p>
                                    <p className="whitespace-pre-line">
                                      {row.message}
                                    </p>
                                    <small className="text-brand-muted">
                                      {formatDate(row.createdAt)}
                                    </small>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-brand-muted">
                                {t('noResponses')}
                              </p>
                            )}
                          </details>
                        )}
                      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                        {listing.status === 'DRAFT' && (
                          <button
                            type="button"
                            onClick={() => openInIntake(listing.id)}
                            className={primary}
                          >
                            {t('continue')}
                          </button>
                        )}
                        {listing.status === 'REJECTED' && (
                          <button
                            type="button"
                            onClick={() => openInIntake(listing.id)}
                            className={primary}
                          >
                            {t('fix')}
                          </button>
                        )}
                        {listing.status === 'PENDING_MODERATION' && (
                          <button
                            type="button"
                            onClick={() => openInIntake(listing.id)}
                            className={ghost}
                          >
                            {t('view_listing')}
                          </button>
                        )}
                        {listing.status === 'ACTIVE' && (
                          <>
                            <Link
                              href={`/${locale}/equipment/${listing.id}`}
                              className={ghost}
                            >
                              {t('open')}
                            </Link>
                            <button
                              type="button"
                              onClick={() => openInIntake(listing.id, true)}
                              className={ghost}
                            >
                              {t('edit')}
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void duplicate(listing)}
                          className={ghost}
                        >
                          <Copy
                            aria-hidden
                            className="size-4"
                            strokeWidth={1.6}
                          />
                          {t('duplicate')}
                        </button>
                        {listing.status !== 'ARCHIVED' &&
                          (confirming === listing.id ? (
                            <span className="flex w-full flex-wrap items-center gap-2 text-sm">
                              {t('confirmArchive')}
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void archive(listing)}
                                className={ghost}
                              >
                                {t('confirmYes')}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirming(null)}
                                className="brand-focus min-h-11 px-2 underline underline-offset-4"
                              >
                                {t('confirmNo')}
                              </button>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirming(listing.id)}
                              className={ghost}
                            >
                              {listing.status !== 'ACTIVE' && (
                                <Archive
                                  aria-hidden
                                  className="size-4"
                                  strokeWidth={1.6}
                                />
                              )}
                              {listing.status === 'ACTIVE'
                                ? t('unpublish')
                                : t('archive')}
                            </button>
                          ))}
                      </div>
                      {listing.status === 'ACTIVE' && (
                        <p className="text-[13px] text-brand-muted">
                          {t('editNote')}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="grid content-start gap-3.5">
          <div className="grid gap-3 bg-brand-surface p-[22px]">
            <h2 className="text-[17px] font-medium">{t('contactTitle')}</h2>
            {editing ? (
              <div className="grid gap-3">
                {(['full_name', 'company_name', 'phone'] as const).map(
                  (field) => (
                    <label
                      key={field}
                      className="grid gap-1.5 text-[13px] font-medium"
                    >
                      {t(
                        field === 'full_name'
                          ? 'name'
                          : field === 'company_name'
                            ? 'company'
                            : 'phone'
                      )}
                      <input
                        className="brand-focus min-h-12 w-full rounded-none border border-brand-line bg-brand-bg px-3.5 text-base font-normal"
                        value={contact[field]}
                        onChange={(event) =>
                          setContact((old) => ({
                            ...old,
                            [field]: event.target.value,
                          }))
                        }
                      />
                    </label>
                  )
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy || !contact.full_name.trim()}
                    onClick={() => void saveContact()}
                    className={primary}
                  >
                    {t('save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className={ghost}
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <dl className="grid">
                  {[
                    [t('name'), profile?.full_name || '—'],
                    [t('company'), profile?.company_name || '—'],
                    [t('phone'), profile?.phone || '—'],
                    [
                      t('login'),
                      `Google · ${profile?.email || session?.user?.email || ''}`,
                    ],
                  ].map(([term, value]) => (
                    <div
                      key={term}
                      className="grid grid-cols-[minmax(5.5rem,40%)_minmax(0,1fr)] gap-3 border-b border-brand-hair py-3 text-[15px]"
                    >
                      <dt className="text-brand-muted">{term}</dt>
                      <dd className="break-words tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
                <button
                  type="button"
                  onClick={() => {
                    setContact({
                      full_name: profile?.full_name ?? '',
                      company_name: profile?.company_name ?? '',
                      phone: profile?.phone ?? '',
                    });
                    setEditing(true);
                  }}
                  className={`${ghost} justify-self-start`}
                >
                  {t('editContact')}
                </button>
                <p className="text-sm text-brand-muted">{t('contactHint')}</p>
              </>
            )}
          </div>
          <CompanyProfileEditor locale={locale} />
          {whatsappNumber && (
            <div className="grid gap-3 bg-brand-surface p-[22px]">
              <h2 className="text-[17px] font-medium">{t('helpTitle')}</h2>
              <p className="text-sm text-brand-muted">{t('helpText')}</p>
              <a
                href={whatsappLink(whatsappNumber, t('helpMessage'))}
                target="_blank"
                rel="noopener noreferrer"
                className={`${ghost} justify-self-start`}
              >
                <MessageCircle
                  aria-hidden
                  className="size-[18px]"
                  strokeWidth={1.6}
                />
                {t('helpButton')}
              </a>
            </div>
          )}
          <button
            type="button"
            onClick={() =>
              void signOut({ callbackUrl: `/${locale}/equipment` })
            }
            className="brand-focus inline-flex min-h-11 items-center gap-1.5 justify-self-start text-[15px] underline decoration-brand-line underline-offset-4"
          >
            <LogOut aria-hidden className="size-4" strokeWidth={1.6} />
            {t('signOut')}
          </button>
        </aside>
      </div>
    </div>
  );
}
