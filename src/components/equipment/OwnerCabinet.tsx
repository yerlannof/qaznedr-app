'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import MarketplaceSignIn from './MarketplaceSignIn';
import { LayoutGrid, List, Loader2, MessageCircle, Plus } from 'lucide-react';
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
const STATUS_CLASS: Record<Status, string> = {
  DRAFT: 'border-brand-line text-brand-muted',
  PENDING_MODERATION:
    'border-amber-700 text-amber-800 dark:border-amber-300 dark:text-amber-200',
  ACTIVE: 'border-brand-accent bg-brand-accent text-brand-slate',
  REJECTED: 'border-red-700 text-red-700 dark:border-red-300 dark:text-red-300',
  ARCHIVED: 'border-brand-line text-brand-muted',
};

function Thumb({ listing }: { listing: EquipmentListing }) {
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
  if (!state?.cover) return <div className="h-full min-h-24 bg-brand-bg" />;
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
      <section className="brand-container max-w-2xl py-16">
        <h1 className="holding-title">{t('signInTitle')}</h1>
        <p className="mt-4 text-brand-muted">{t('signInText')}</p>
        <div className="mt-8">
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

  return (
    <div className="brand-container py-10 lg:py-14">
      <nav aria-label={t('eyebrow')} className="flex flex-wrap gap-2">
        <Link
          href={`/${locale}/equipment`}
          className="brand-button-secondary brand-focus"
        >
          {translate(locale, 'equipmentCatalog.tabCatalog')}
        </Link>
        <button
          type="button"
          onClick={() => openInIntake(null)}
          className="brand-button-secondary brand-focus"
        >
          {translate(locale, 'equipmentCatalog.tabSubmit')}
        </button>
        <span
          aria-current="page"
          className="inline-flex min-h-11 items-center rounded border border-brand-ink bg-brand-ink px-5 font-semibold text-brand-bg"
        >
          {t('tab')}
        </span>
      </nav>

      <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
            {t('eyebrow')}
          </p>
          <h1 className="holding-title mt-3">{t('title')}</h1>
        </div>
        <button
          type="button"
          onClick={() => openInIntake(null)}
          className="brand-button brand-focus"
        >
          <Plus aria-hidden className="size-4" />
          {t('new').replace(/^\+\s*/, '')}
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
        <section aria-label={t('title')}>
          <div
            role="group"
            aria-label={t('title')}
            className="flex flex-wrap gap-2 border-b border-brand-line pb-4"
          >
            {(['ALL', ...EQUIPMENT_STATUSES] as Filter[]).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
                className={`min-h-11 rounded border px-3 ${filter === item ? 'border-brand-ink bg-brand-ink text-brand-bg' : 'border-brand-line bg-brand-surface'}`}
              >
                {item === 'ALL' ? t('all') : t(item)} <b>{counts[item]}</b>
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-brand-muted">
              {t('shown', { count: shown.length })}
            </span>
            <div
              role="group"
              aria-label={t('view')}
              className="inline-flex overflow-hidden rounded border border-brand-line"
            >
              {(['cards', 'list'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={view === item}
                  onClick={() => switchView(item)}
                  className={`inline-flex min-h-11 items-center gap-2 px-3 ${view === item ? 'bg-brand-ink text-brand-bg' : 'bg-brand-surface'}`}
                >
                  {item === 'cards' ? (
                    <LayoutGrid aria-hidden size={16} />
                  ) : (
                    <List aria-hidden size={16} />
                  )}
                  {item === 'cards' ? t('viewCards') : t('viewList')}
                </button>
              ))}
            </div>
          </div>
          {error && (
            <p role="alert" className="mt-4 text-red-700 dark:text-red-300">
              {error}
            </p>
          )}
          {listings === null ? (
            <p className="mt-8 flex items-center gap-2 text-brand-muted">
              <Loader2 aria-hidden className="animate-spin" size={18} />
            </p>
          ) : shown.length === 0 ? (
            <div className="mt-6 grid justify-items-center gap-4 border border-dashed border-brand-line p-8 text-center">
              <p>{listings.length ? t('empty') : t('emptyAll')}</p>
              <button
                type="button"
                onClick={() => openInIntake(null)}
                className="brand-button brand-focus"
              >
                {t('new')}
              </button>
            </div>
          ) : (
            <ul
              className={`mt-4 grid gap-4 ${view === 'cards' ? 'sm:grid-cols-2' : ''}`}
            >
              {shown.map((listing) => {
                const listingMarks = marks[listing.id] ?? [];
                return (
                  <li
                    key={listing.id}
                    className={`grid border border-brand-line bg-brand-surface ${view === 'list' ? 'sm:grid-cols-[8.5rem_1fr]' : 'grid-rows-[auto_1fr]'}`}
                  >
                    <div
                      className={view === 'cards' ? 'aspect-[4/3]' : 'min-h-24'}
                    >
                      <Thumb listing={listing} />
                    </div>
                    <div className="flex flex-col gap-2 p-5">
                      <div
                        className={`flex gap-2 ${view === 'cards' ? 'flex-col-reverse items-start' : 'flex-wrap items-center justify-between'}`}
                      >
                        <h2 className="text-lg font-semibold">
                          {listing.data.title || t('untitled')}
                        </h2>
                        <span
                          className={`whitespace-nowrap rounded-sm border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${STATUS_CLASS[listing.status]}`}
                        >
                          {t(`status_${listing.status}`)}
                        </span>
                      </div>
                      <p className="text-sm text-brand-muted">
                        {tagline(listing)}
                      </p>
                      {listing.status === 'REJECTED' &&
                        listing.moderationNotes && (
                          <div className="border-l-4 border-red-700 bg-brand-bg p-3 text-sm dark:border-red-300">
                            <strong className="block">
                              {t('reasonTitle')}
                            </strong>
                            {listing.moderationNotes}
                          </div>
                        )}
                      {listing.status === 'PENDING_MODERATION' && (
                        <div className="border-l-4 border-amber-700 bg-brand-bg p-3 text-sm dark:border-amber-300">
                          <strong className="block">{t('pendingTitle')}</strong>
                          {t('pendingText')}
                        </div>
                      )}
                      {listing.status === 'ACTIVE' &&
                        listingMarks.length > 0 && (
                          <p className="text-sm text-brand-muted">
                            {listingMarks
                              .map(
                                (row) =>
                                  `${t(`trust_${row.mark}`)} ${formatDate(row.setAt)}`
                              )
                              .join(' · ')}
                          </p>
                        )}
                      <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                        {listing.status === 'DRAFT' && (
                          <button
                            type="button"
                            onClick={() => openInIntake(listing.id)}
                            className="brand-button brand-focus"
                          >
                            {t('continue')}
                          </button>
                        )}
                        {listing.status === 'REJECTED' && (
                          <button
                            type="button"
                            onClick={() => openInIntake(listing.id)}
                            className="brand-button brand-focus"
                          >
                            {t('fix')}
                          </button>
                        )}
                        {listing.status === 'PENDING_MODERATION' && (
                          <button
                            type="button"
                            onClick={() => openInIntake(listing.id)}
                            className="brand-button-secondary brand-focus"
                          >
                            {t('view_listing')}
                          </button>
                        )}
                        {listing.status === 'ACTIVE' && (
                          <>
                            <Link
                              href={`/${locale}/equipment/${listing.id}`}
                              className="brand-button-secondary brand-focus"
                            >
                              {t('open')}
                            </Link>
                            <button
                              type="button"
                              onClick={() => openInIntake(listing.id, true)}
                              className="brand-button-secondary brand-focus"
                            >
                              {t('edit')}
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void duplicate(listing)}
                          className="min-h-11 px-2 text-sm font-semibold underline"
                        >
                          {t('duplicate')}
                        </button>
                        {listing.status !== 'ARCHIVED' &&
                          (confirming === listing.id ? (
                            <span className="flex flex-wrap items-center gap-2 text-sm">
                              {t('confirmArchive')}
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void archive(listing)}
                                className="brand-button-secondary brand-focus"
                              >
                                {t('confirmYes')}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirming(null)}
                                className="min-h-11 px-2 underline"
                              >
                                {t('confirmNo')}
                              </button>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirming(listing.id)}
                              className="min-h-11 px-2 text-sm font-semibold underline"
                            >
                              {listing.status === 'ACTIVE'
                                ? t('unpublish')
                                : t('archive')}
                            </button>
                          ))}
                      </div>
                      {listing.status === 'ACTIVE' && (
                        <p className="text-sm text-brand-muted">
                          {t('editNote')}
                        </p>
                      )}
                      {listing.status === 'ACTIVE' && (
                        <p className="text-sm font-semibold">
                          {t('stats', {
                            views: stats[listing.id]?.views ?? 0,
                            contacts: stats[listing.id]?.contacts ?? 0,
                          })}
                        </p>
                      )}
                      {listing.data.offerType === 'WANTED' &&
                        listing.status === 'ACTIVE' && (
                          <details
                            className="border-t border-brand-line pt-2"
                            open={(responses[listing.id]?.length ?? 0) > 0}
                          >
                            <summary className="min-h-11 cursor-pointer py-2 font-semibold">
                              {t('responses', {
                                count: responses[listing.id]?.length ?? 0,
                              })}
                            </summary>
                            {responses[listing.id]?.length ? (
                              <ul className="space-y-3">
                                {responses[listing.id].map((row) => (
                                  <li
                                    key={row.id}
                                    className="border-l-4 border-brand-accent pl-3 text-sm"
                                  >
                                    <p className="font-semibold">
                                      {row.name} ·{' '}
                                      <a
                                        href={`tel:${row.phone}`}
                                        className="underline"
                                      >
                                        {row.phone}
                                      </a>
                                    </p>
                                    <p className="whitespace-pre-line">
                                      {row.message}
                                    </p>
                                    <p className="text-brand-muted">
                                      {formatDate(row.createdAt)}
                                    </p>
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
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <div className="space-y-3 border border-brand-line bg-brand-surface p-5">
            <h2 className="font-semibold">{t('contactTitle')}</h2>
            {editing ? (
              <div className="space-y-3">
                {(['full_name', 'company_name', 'phone'] as const).map(
                  (field) => (
                    <label key={field} className="block text-sm font-semibold">
                      {t(
                        field === 'full_name'
                          ? 'name'
                          : field === 'company_name'
                            ? 'company'
                            : 'phone'
                      )}
                      <input
                        className="mt-1 min-h-11 w-full rounded border border-brand-line bg-brand-bg px-3"
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
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy || !contact.full_name.trim()}
                    onClick={() => void saveContact()}
                    className="brand-button brand-focus"
                  >
                    {t('save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="brand-button-secondary brand-focus"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  <dt className="text-brand-muted">{t('name')}</dt>
                  <dd>{profile?.full_name || '—'}</dd>
                  <dt className="text-brand-muted">{t('company')}</dt>
                  <dd>{profile?.company_name || '—'}</dd>
                  <dt className="text-brand-muted">{t('phone')}</dt>
                  <dd>{profile?.phone || '—'}</dd>
                  <dt className="text-brand-muted">{t('login')}</dt>
                  <dd className="break-all">
                    Google · {profile?.email || session?.user?.email}
                  </dd>
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
                  className="brand-button-secondary brand-focus w-full justify-center"
                >
                  {t('editContact')}
                </button>
                <p className="text-sm text-brand-muted">{t('contactHint')}</p>
              </>
            )}
          </div>
          {whatsappNumber && (
            <div className="space-y-3 border border-brand-line bg-brand-surface p-5">
              <h2 className="font-semibold">{t('helpTitle')}</h2>
              <p className="text-sm text-brand-muted">{t('helpText')}</p>
              <a
                href={whatsappLink(whatsappNumber, t('helpMessage'))}
                target="_blank"
                rel="noopener noreferrer"
                className="brand-button-secondary brand-focus w-full justify-center"
              >
                <MessageCircle aria-hidden className="size-4" />
                {t('helpButton')}
              </a>
            </div>
          )}
          <div className="border border-brand-line bg-brand-surface p-5 text-center">
            <button
              type="button"
              onClick={() =>
                void signOut({ callbackUrl: `/${locale}/equipment` })
              }
              className="min-h-11 font-semibold underline"
            >
              {t('signOut')}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
