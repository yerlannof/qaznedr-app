'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  Compass,
  Drill,
  Droplets,
  FileText,
  FlaskConical,
  Gauge,
  KeyRound,
  Layers,
  Map as MapIcon,
  MessageCircle,
  Microscope,
  Phone,
  Plus,
  Search,
  Shield,
  Tag,
  Tent,
  Tractor,
  Truck,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import { whatsappLink } from '@/lib/config/contacts';
import { translate } from '@/lib/i18n/translations';
import {
  ownerDraftSchema,
  type EquipmentListing,
} from '@/lib/equipment-listings/domain';
import {
  EquipmentDraftClient,
  type IntakeImage,
  type IntakeClientError,
} from '@/lib/equipment-listings/intake-client';
import {
  emptyIntake,
  fromDraft,
  normalizeIntake,
  validateIntakeStep,
  type IntakeValue,
} from '@/lib/equipment-listings/intake-form';
import {
  CAPABILITY_SOURCES,
  CHASSIS_TYPES,
  CORE_SIZES,
  DRILLING_METHODS,
  DRILLING_PURPOSES,
  DRILLING_SITES,
  DRILLING_TRAJECTORIES,
  MACHINE_CONDITIONS,
  CATEGORY_GROUPS,
  REGION_IDS,
  WORK_FORMATS,
  groupOf,
  isPeopleCategory,
  kindsFor,
  offerTypesFor,
  priceUnitsFor,
  serviceMethodsFor,
  type CategoryGroup,
  type OfferType,
} from '@/lib/equipment-listings/taxonomy';
import { regionLabel } from '@/lib/data/filter-config';
import MarketplaceSignIn from './MarketplaceSignIn';
import { prepareListingPhoto } from '@/lib/equipment-listings/photo-prepare';

type Props = {
  locale: string;
  googleEnabled: boolean;
  emailEnabled?: boolean;
  whatsappNumber?: string | null;
};
type FieldProps = {
  name: string;
  type?: string;
  multiline?: boolean;
  required?: boolean;
};
const stepKey = 'qaznedr:equipment-intake:step';
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  drill: Drill,
  excavator: Tractor,
  compressor: Gauge,
  transport: Truck,
  camp: Tent,
  tools: Wrench,
  instruments: Compass,
  drillService: ArrowDownToLine,
  geochemService: FlaskConical,
  geophysService: Activity,
  labService: Microscope,
  surveyService: MapIcon,
  hydroService: Droplets,
  designService: FileText,
  geoService: Layers,
  staff: Users,
};
const CHOICE_ICONS: Record<string, LucideIcon> = {
  RENT: KeyRound,
  SALE: Tag,
  SERVICE: Briefcase,
  WANTED: Search,
  PUBLIC: Phone,
  PRIVATE: Shield,
};
const errorClass = 'block text-sm text-brand-bad';
const subheadClass = 'text-xl font-medium tracking-[-0.01em]';
const summaryClass =
  'flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 font-medium [&::-webkit-details-marker]:hidden';
const photoTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxPhotoBytes = 3 * 1024 * 1024;
const storageKey = 'qaznedr:equipment-intake:v2';
const identityKey = 'qaznedr:equipment-intake:owner';
const uncertainKey = (ownerId: string) =>
  `qaznedr:equipment-intake:uncertain:${ownerId}`;
const draftKey = (ownerId: string) => `qaznedr:equipment-draft:${ownerId}`;
const storeFor = (key: string): Storage =>
  key.startsWith('qaznedr:equipment-draft:') ||
  key.startsWith('qaznedr:equipment-intake:uncertain:')
    ? localStorage
    : sessionStorage;
const storage = {
  get: (key: string) => {
    try {
      return storeFor(key).getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string) => {
    try {
      storeFor(key).setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  remove: (key: string) => {
    try {
      storeFor(key).removeItem(key);
    } catch {
      /* unavailable */
    }
  },
  available: () => {
    try {
      const key = 'qaznedr:equipment-intake:storage-check';
      sessionStorage.setItem(key, '1');
      sessionStorage.removeItem(key);
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
};
function restoreSafe(value: unknown): IntakeValue | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const blank = emptyIntake();
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(blank)) {
    if (
      [
        'contactName',
        'company',
        'phone',
        'contactVisibility',
        'capabilities',
        'purposes',
      ].includes(key)
    )
      continue;
    if (typeof record[key] === 'string')
      blank[key] = (record[key] as string).slice(0, 5000);
  }
  if (Array.isArray(record.purposes))
    blank.purposes = record.purposes
      .filter((item): item is string => typeof item === 'string')
      .slice(0, 7);
  // Lists picked before the sign-in redirect must survive it too.
  for (const key of ['serviceMethods', 'serviceArea'] as const)
    if (Array.isArray(record[key]))
      blank[key] = [
        ...new Set(
          (record[key] as unknown[]).filter(
            (item): item is string => typeof item === 'string'
          )
        ),
      ].slice(0, 20);
  if (Array.isArray(record.capabilities))
    blank.capabilities = record.capabilities
      .filter((item) => item && typeof item === 'object')
      .slice(0, 12)
      .map((item) => {
        const row = item as Record<string, unknown>;
        return {
          method: typeof row.method === 'string' ? row.method : '',
          depth: typeof row.depth === 'string' ? row.depth : '',
          diameter: typeof row.diameter === 'string' ? row.diameter : '',
          coreSize: typeof row.coreSize === 'string' ? row.coreSize : '',
          source: typeof row.source === 'string' ? row.source : '',
        };
      });
  return blank;
}

export function EquipmentIntake({
  locale,
  googleEnabled,
  emailEnabled = false,
  whatsappNumber = null,
}: Props) {
  const t = useCallback(
    (key: string, params?: Record<string, unknown>) =>
      translate(locale, `equipmentIntake.${key}`, params),
    [locale]
  );
  const { data: session, status: authStatus } = useSession();
  const ownerId = session?.user?.id ?? null;
  const [value, setValue] = useState<IntakeValue>(emptyIntake);
  const [step, setStep] = useState(1);
  const offerRef = useRef<HTMLFieldSetElement>(null);
  const scrollToOfferRef = useRef(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // Editing a published listing: no autosave; one explicit resubmit to moderation.
  const [editingActive, setEditingActive] = useState(false);
  const [listingStatus, setListingStatus] = useState<
    EquipmentListing['status'] | null
  >(null);
  const [recoveryListings, setRecoveryListings] = useState<EquipmentListing[]>(
    []
  );
  const [images, setImages] = useState<IntakeImage[]>([]);
  const [conflict, setConflict] = useState(false);
  const [savedRevision, setSavedRevision] = useState(0);
  const [storageReady, setStorageReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(false);
  const clientRef = useRef<EquipmentDraftClient | null>(null);
  const ownerRef = useRef<string | null>(null);
  const pendingRef = useRef(false);
  const writeInFlightRef = useRef(false);
  const switchedValueRef = useRef<IntakeValue | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const apply = (fn: (old: IntakeValue) => object) =>
    setValue((old) => fn(old) as IntakeValue);
  const beginWrite = (client: EquipmentDraftClient, owner: string): boolean => {
    if (!storageAvailable) {
      setNotice(t('storageUnavailable'));
      return false;
    }
    if (writeInFlightRef.current) {
      setNotice(t('saving'));
      return false;
    }
    const knownId = client.listing?.id;
    const boundId = storage.get(draftKey(owner));
    if (storage.get(uncertainKey(owner)) || (boundId && boundId !== knownId)) {
      setConflict(true);
      setNotice(t('uncertain'));
      return false;
    }
    const stored = knownId
      ? storage.set(draftKey(owner), knownId)
      : storage.set(uncertainKey(owner), '1');
    if (!stored) {
      setConflict(true);
      setNotice(t('storageUnavailable'));
      return false;
    }
    writeInFlightRef.current = true;
    return true;
  };
  const acknowledgeWrite = (
    owner: string,
    listing: EquipmentListing
  ): boolean => {
    if (!storage.set(draftKey(owner), listing.id)) {
      setConflict(true);
      setNotice(t('storageUnavailable'));
      return false;
    }
    storage.remove(uncertainKey(owner));
    setSavedRevision(listing.revision);
    return true;
  };

  const change = (name: string, next: string) => {
    setValue((old) => ({ ...old, [name]: next }));
    setErrors((old) => old.filter((key) => key !== name));
  };
  const changeOffer = (offerType: string) => {
    setValue(
      (old) =>
        ({
          ...old,
          offerType,
          priceUnit: '',
        }) as unknown as IntakeValue
    );
    setErrors([]);
  };
  const changeCategory = (category: string) => {
    scrollToOfferRef.current = true;
    setValue(
      (old) =>
        ({
          ...old,
          category,
          // Keep the chosen action when the new section allows it.
          offerType: offerTypesFor(category).includes(
            old.offerType as OfferType
          )
            ? old.offerType
            : '',
          priceUnit: '',
          kind: '',
          accredited: '',
          accreditationNumber: '',
          // Drilling shows one method row straight away.
          capabilities:
            category === 'drill' || category === 'drillService'
              ? [
                  {
                    method: '',
                    depth: '',
                    diameter: '',
                    coreSize: '',
                    source: '',
                  },
                ]
              : [],
          purposes: [],
          serviceMethods: [],
        }) as unknown as IntakeValue
    );
    setErrors([]);
  };

  useEffect(() => {
    if (authStatus === 'loading') return;
    // A refreshed session/locale replaces the client, including for the same owner.
    // Durable uncertainty/IDs remain authoritative; abandoned UI locks do not.
    pendingRef.current = false;
    writeInFlightRef.current = false;
    setBusy(false);
    const canStore = storage.available();
    setStorageAvailable(canStore);
    if (!canStore) setNotice(t('storageUnavailable'));
    let active = true;
    const priorOwner = storage.get(identityKey);
    if (priorOwner && priorOwner !== ownerId) {
      storage.remove(storageKey);
      storage.remove(stepKey);
      const blank = emptyIntake();
      switchedValueRef.current = blank;
      setValue(blank);
      setImages([]);
      setStep(1);
      setConflict(false);
      setSubmitted(false);
      setListingStatus(null);
      setRecoveryListings([]);
      setSavedRevision(0);
      setBusy(false);
      pendingRef.current = false;
      writeInFlightRef.current = false;
      setNotice(t('authChanged'));
    } else if (
      !ownerRef.current &&
      (!priorOwner || (ownerId && priorOwner === ownerId))
    ) {
      try {
        const raw = storage.get(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw) as {
            ownerId?: string | null;
            value?: Partial<IntakeValue>;
          };
          if ((!parsed.ownerId || parsed.ownerId === ownerId) && parsed.value) {
            const restored = restoreSafe(parsed.value);
            if (restored) {
              setValue(restored);
              // Return to the step the visitor left for the sign-in page.
              const saved = Number(storage.get(stepKey));
              if (
                Number.isInteger(saved) &&
                saved > 1 &&
                saved <= 4 &&
                !validateIntakeStep(restored, saved - 1).length
              )
                setStep(saved);
            }
          }
        }
      } catch {
        storage.remove(storageKey);
      }
    }
    if (ownerId) storage.set(identityKey, ownerId);
    else storage.remove(identityKey);
    ownerRef.current = ownerId;
    const client = ownerId ? new EquipmentDraftClient(ownerId) : null;
    clientRef.current = client;
    setStorageReady(true);
    if (ownerId && storage.get(uncertainKey(ownerId!))) {
      setConflict(true);
      setNotice(t('uncertain'));
    }
    if (ownerId) {
      const id = storage.get(draftKey(ownerId!));
      if (id) {
        setConflict(true);
        client
          ?.load(id)
          .then((listing) => {
            if (!active) return [];
            setValue(fromDraft(listing.data));
            setSavedRevision(listing.revision);
            setListingStatus(listing.status);
            const editRequested =
              new URLSearchParams(window.location.search).get('edit') === '1';
            const editable = listing.status === 'ACTIVE' && editRequested;
            setEditingActive(editable);
            setSubmitted(
              !editable && !['DRAFT', 'REJECTED'].includes(listing.status)
            );
            storage.remove(uncertainKey(ownerId!));
            setConflict(false);
            return client.images();
          })
          .then((loaded) => {
            if (active && loaded) setImages(loaded);
          })
          .catch(() => {
            if (active) {
              setConflict(true);
              setNotice(t('saveError'));
            }
          });
      }
    }
    return () => {
      active = false;
      client?.dispose();
      if (clientRef.current === client) clientRef.current = null;
    };
  }, [authStatus, ownerId, t]);

  useEffect(() => {
    if (!storageReady || authStatus === 'loading') return;
    if (switchedValueRef.current && switchedValueRef.current !== value) return;
    switchedValueRef.current = null;
    // The browser draft contains only non-contact fields. The account-bound ID is a separate key.
    const {
      contactName: _name,
      company: _company,
      phone: _phone,
      contactVisibility: _visibility,
      ...safe
    } = value;
    try {
      storage.set(storageKey, JSON.stringify({ ownerId, value: safe }));
      storage.set(stepKey, String(step));
    } catch {
      /* storage may be unavailable */
    }
  }, [value, ownerId, storageReady, authStatus, step]);

  useEffect(() => {
    const client = clientRef.current;
    if (
      !client ||
      !storageAvailable ||
      pendingRef.current ||
      submitted ||
      editingActive ||
      conflict ||
      busy ||
      (ownerId && storage.get(uncertainKey(ownerId!)))
    )
      return;
    const data = normalizeIntake(value);
    if (
      validateIntakeStep(value, 2, { draft: true }).length ||
      !ownerDraftSchema.safeParse(data).success
    )
      return;
    // Contact remains memory-only until an explicit submit, so background writes never persist it.
    const {
      contactName: _name,
      company: _company,
      phone: _phone,
      contactVisibility: _visibility,
      ...safeData
    } = data;
    const timer = window.setTimeout(() => {
      if (
        pendingRef.current ||
        clientRef.current !== client ||
        ownerRef.current !== ownerId
      )
        return;
      if (!beginWrite(client, ownerId!)) return;
      client
        .save(safeData)
        .then((listing) => {
          if (clientRef.current !== client || ownerRef.current !== ownerId)
            return;
          if (acknowledgeWrite(ownerId!, listing)) setNotice(t('saved'));
        })
        .catch((error: IntakeClientError) => {
          if (clientRef.current !== client || ownerRef.current !== ownerId)
            return;
          if (
            error.code === 'CONFLICT' ||
            error.code === 'UNCERTAIN' ||
            storage.get(uncertainKey(ownerId!))
          )
            setConflict(true);
          setNotice(
            t(
              error.code === 'CONFLICT'
                ? 'conflict'
                : error.code === 'UNCERTAIN'
                  ? 'uncertain'
                  : error.code === 'LIMIT'
                    ? 'limitReached'
                    : 'saveError'
            )
          );
        })
        .finally(() => {
          if (clientRef.current === client && ownerRef.current === ownerId)
            writeInFlightRef.current = false;
        });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [
    value,
    ownerId,
    submitted,
    conflict,
    busy,
    storageAvailable,
    savedRevision,
    editingActive,
    t,
  ]);

  // The section list is long on phones: bring the next question into view.
  useEffect(() => {
    if (!scrollToOfferRef.current || !offerRef.current) return;
    scrollToOfferRef.current = false;
    const reduce = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)'
    )?.matches;
    offerRef.current.scrollIntoView?.({
      behavior: reduce ? 'auto' : 'smooth',
      block: 'center',
    });
  }, [value.category]);
  const group = groupOf(value.category);
  const people = isPeopleCategory(value.category);
  const wanted = value.offerType === 'WANTED';
  const choiceGroup =
    value.category === 'tools'
      ? 'tools'
      : group === 'toolsInstruments'
        ? 'machinery'
        : group;
  const labelFor = (name: string) => {
    if (name === 'title') return t('listingTitle');
    if (name === 'kind' && people) return t('profession');
    if (name === 'price')
      return t(
        people
          ? wanted
            ? 'salaryOffered'
            : 'salaryWanted'
          : wanted
            ? 'budget'
            : 'price'
      );
    if (name === 'availability') return t(wanted ? 'neededWhen' : name);
    return t(name);
  };
  const placeholderFor = (name: string): string | undefined => {
    if (name === 'title')
      return t(
        'titleExample.' +
          (people
            ? wanted
              ? 'vacancy'
              : 'cv'
            : wanted
              ? 'wanted'
              : (group ?? 'machinery'))
      );
    if (name === 'city') return t('cityExample');
    if (name === 'availability')
      return t(wanted ? 'neededExample' : 'availabilityExample');
    if (name === 'phone') return t('phoneExample');
    return undefined;
  };
  const kinds = kindsFor(value.category);
  const serviceMethods = serviceMethodsFor(value.category);
  const toggleList = (
    name: 'serviceMethods' | 'serviceArea',
    item: string,
    checked: boolean
  ) => {
    setValue((old) => {
      let next = checked
        ? [...old[name], item]
        : old[name].filter((entry) => entry !== item);
      // The whole country replaces single regions and the other way round.
      if (name === 'serviceArea' && checked)
        next =
          item === 'ALL_KZ'
            ? ['ALL_KZ']
            : next.filter((entry) => entry !== 'ALL_KZ');
      return { ...old, [name]: next } as IntakeValue;
    });
    setErrors((old) => old.filter((key) => key !== name));
  };
  const checklist = (
    name: 'serviceMethods' | 'serviceArea',
    items: readonly string[],
    label: (item: string) => string,
    required = false
  ) => (
    <fieldset>
      <legend className="mb-2 text-[13px] font-medium">
        {t(name)}
        {required ? ' *' : ''}
      </legend>
      {name === 'serviceArea' && (
        <p className="mb-2 text-sm text-brand-muted">{t('serviceAreaHint')}</p>
      )}
      {(() => {
        const box = (item: string) => (
          <label key={item} className="flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              className="h-5 w-5 shrink-0 accent-brand-accent"
              checked={value[name].includes(item)}
              onChange={(event) => toggleList(name, item, event.target.checked)}
            />
            {label(item)}
          </label>
        );
        if (name !== 'serviceArea')
          return (
            <div className="grid gap-2 sm:grid-cols-2">{items.map(box)}</div>
          );
        // Seventeen regions are a full phone screen: keep them one tap away.
        const regions = items.filter((item) => item !== 'ALL_KZ');
        return (
          <>
            {box('ALL_KZ')}
            <details
              className="mt-1"
              open={value.serviceArea.some((item) => item !== 'ALL_KZ')}
            >
              <summary className={summaryClass}>
                {t('chooseRegions')}
                <ChevronDown aria-hidden size={18} />
              </summary>
              <div className="grid grid-cols-2 gap-x-3 text-sm">
                {regions.map(box)}
              </div>
            </details>
          </>
        );
      })()}
      {errors.includes(name) && (
        <p role="alert" className={`mt-2 ${errorClass}`}>
          {t('required')}
        </p>
      )}
    </fieldset>
  );
  const drilling =
    value.category === 'drill' || value.category === 'drillService';
  const inputClass =
    'mt-1.5 min-h-12 w-full rounded-none border border-brand-line bg-brand-bg px-3.5 py-2.5 text-base font-normal text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent';
  const buttonClass =
    'inline-flex min-h-12 items-center justify-center gap-2.5 border border-brand-line px-5 text-[15px] font-medium text-brand-ink transition-colors hover:border-brand-ink disabled:opacity-50';
  const primaryClass =
    'inline-flex min-h-12 items-center justify-center gap-2.5 bg-brand-accent px-6 text-[15px] font-medium text-brand-slate transition-colors hover:bg-brand-accent-hi disabled:opacity-50';
  const labelClass = 'block text-[13px] font-medium text-brand-ink';
  const factRow =
    'grid grid-cols-[minmax(120px,40%)_1fr] gap-3 border-b border-brand-hair py-3 text-[15px]';
  // A choice row (action, phone visibility): 64 px, round check on the right.
  const choiceRow = (
    name: string,
    choice: string,
    label: string,
    checked: boolean,
    onChange: () => void
  ) => {
    const Icon = CHOICE_ICONS[choice];
    return (
      <label
        key={choice}
        className={`flex min-h-16 cursor-pointer items-center gap-3.5 border bg-brand-surface px-[18px] py-3 text-[17px] leading-snug transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-accent ${
          checked
            ? 'border-brand-ink'
            : 'border-transparent hover:border-brand-line'
        }`}
      >
        <input
          type="radio"
          className="sr-only"
          name={name}
          value={choice}
          checked={checked}
          onChange={onChange}
        />
        {Icon && (
          <Icon
            aria-hidden
            size={22}
            strokeWidth={1.5}
            className="shrink-0 text-brand-muted"
          />
        )}
        <span>{label}</span>
        <span
          aria-hidden
          className={`ml-auto grid h-6 w-6 shrink-0 place-items-center rounded-full border ${
            checked
              ? 'border-brand-accent bg-brand-accent'
              : 'border-brand-line'
          }`}
        >
          {checked && <span className="h-2 w-2 rounded-full bg-brand-deep" />}
        </span>
      </label>
    );
  };

  const field = ({
    name,
    type = 'text',
    multiline = false,
    required = false,
  }: FieldProps) => (
    <label className={labelClass}>
      <span>
        {labelFor(name)}
        {required ? ' *' : ''}
      </span>
      {multiline ? (
        <textarea
          className={inputClass}
          value={value[name] ?? ''}
          onChange={(event) => change(name, event.target.value)}
          placeholder={placeholderFor(name)}
          rows={3}
        />
      ) : (
        <input
          className={inputClass}
          type={type}
          inputMode={name === 'phone' ? 'tel' : undefined}
          value={value[name] ?? ''}
          onChange={(event) => change(name, event.target.value)}
          placeholder={placeholderFor(name)}
          min={type === 'number' ? '0' : undefined}
          step={type === 'number' ? 'any' : undefined}
        />
      )}
      {errors.includes(name) && (
        <span role="alert" className={errorClass}>
          {t(value[name] ? 'invalid' : 'required')}
        </span>
      )}
    </label>
  );
  const select = ({
    name,
    values,
    required = false,
  }: {
    name: string;
    values: readonly string[];
    required?: boolean;
  }) => (
    <label className={labelClass}>
      <span>
        {labelFor(name)}
        {required ? ' *' : ''}
      </span>
      <select
        className={inputClass}
        value={value[name] ?? ''}
        onChange={(event) => change(name, event.target.value)}
      >
        <option value="">{t(required ? 'choose' : 'optional')}</option>
        {values.map((item) => (
          <option key={item} value={item}>
            {t('codes.' + item) === `equipmentIntake.codes.${item}`
              ? item
              : t('codes.' + item)}
          </option>
        ))}
      </select>
      {errors.includes(name) && (
        <span role="alert" className={errorClass}>
          {t('required')}
        </span>
      )}
    </label>
  );

  const updateCapability = (
    index: number,
    key: keyof IntakeValue['capabilities'][number],
    next: string
  ) => {
    setValue(
      (old) =>
        ({
          ...old,
          capabilities: old.capabilities.map((row, position) =>
            position === index
              ? {
                  ...row,
                  [key]: next,
                  ...(key === 'method' && next !== 'CORE'
                    ? { coreSize: '' }
                    : {}),
                }
              : row
          ),
        }) as unknown as IntakeValue
    );
  };
  const nextStep = async () => {
    const found = validateIntakeStep(value, step);
    if (found.length) {
      setErrors(found);
      setNotice(t('invalid'));
      return;
    }
    setErrors([]);
    setNotice('');
    if (step < 4) {
      setStep(step + 1);
      return;
    }
    const client = clientRef.current;
    if (!ownerId || !client || pendingRef.current) {
      setNotice(t('loginRequired'));
      return;
    }
    if (!beginWrite(client, ownerId)) return;
    pendingRef.current = true;
    setBusy(true);
    try {
      const listing = editingActive
        ? await client.resubmit(normalizeIntake(value))
        : await client.submit(normalizeIntake(value));
      setEditingActive(false);
      if (clientRef.current !== client || ownerRef.current !== ownerId) return;
      if (!acknowledgeWrite(ownerId, listing)) return;
      storage.remove(storageKey);
      setSubmitted(true);
      setListingStatus(listing.status);
      setNotice(t('pending'));
    } catch (error) {
      if (clientRef.current !== client || ownerRef.current !== ownerId) return;
      const code = (error as IntakeClientError).code;
      const bound =
        !client.listing || storage.set(draftKey(ownerId), client.listing.id);
      setConflict(true);
      setNotice(
        t(
          !bound
            ? 'storageUnavailable'
            : code === 'CONFLICT'
              ? 'conflict'
              : code === 'UNCERTAIN'
                ? 'uncertain'
                : 'saveError'
        )
      );
    } finally {
      if (clientRef.current === client && ownerRef.current === ownerId)
        writeInFlightRef.current = false;
      if (clientRef.current === client && ownerRef.current === ownerId) {
        pendingRef.current = false;
        setBusy(false);
      }
    }
  };
  const upload = async (files: FileList | null) => {
    const client = clientRef.current;
    if (!files || !client || !ownerId) {
      setNotice(t('loginRequired'));
      return;
    }
    if (files.length + images.length > 8) {
      setNotice(t('photoError'));
      return;
    }
    // Phone photos are usually larger than the limit: shrink them here first.
    let prepared: File[];
    try {
      setNotice(t('photoPreparing'));
      prepared = await Promise.all(
        Array.from(files).map((file) => prepareListingPhoto(file))
      );
    } catch {
      setNotice(t('photoError'));
      return;
    }
    if (
      prepared.some(
        (file) =>
          !photoTypes.has(file.type) ||
          file.size < 1 ||
          file.size > maxPhotoBytes
      )
    ) {
      setNotice(t('photoError'));
      return;
    }
    if (validateIntakeStep(value, 2, { draft: true }).length) {
      setNotice(t('invalid'));
      return;
    }
    if (!beginWrite(client, ownerId)) return;
    const {
      contactName: _contactName,
      company: _company,
      phone: _phone,
      contactVisibility: _visibility,
      ...safeData
    } = normalizeIntake(value);
    setBusy(true);
    try {
      for (const file of prepared) {
        await client.upload(file, safeData);
        if (clientRef.current !== client || ownerRef.current !== ownerId)
          return;
        if (client.listing) {
          if (!acknowledgeWrite(ownerId, client.listing)) return;
        }
      }
      const loaded = await client.images();
      if (clientRef.current !== client || ownerRef.current !== ownerId) return;
      setImages(loaded);
      setNotice('');
    } catch (error) {
      if (clientRef.current !== client || ownerRef.current !== ownerId) return;
      const code = (error as IntakeClientError).code;
      const bound =
        !client.listing || storage.set(draftKey(ownerId), client.listing.id);
      if (
        code === 'CONFLICT' ||
        code === 'UNCERTAIN' ||
        storage.get(uncertainKey(ownerId))
      ) {
        setConflict(true);
      }
      if (!bound) setConflict(true);
      setNotice(
        t(
          !bound
            ? 'storageUnavailable'
            : code === 'UNCERTAIN'
              ? 'uncertain'
              : 'photoError'
        )
      );
    } finally {
      if (clientRef.current === client && ownerRef.current === ownerId)
        writeInFlightRef.current = false;
      if (clientRef.current === client && ownerRef.current === ownerId)
        setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };
  const removeImage = async (id: string) => {
    const client = clientRef.current;
    const owner = ownerId;
    if (!client || !owner) return;
    if (!beginWrite(client, owner)) return;
    setBusy(true);
    try {
      await client.remove(id);
      const loaded = await client.images();
      if (clientRef.current !== client || ownerRef.current !== owner) return;
      setImages(loaded);
      if (client.listing) acknowledgeWrite(owner, client.listing);
    } catch (error) {
      if (clientRef.current !== client || ownerRef.current !== owner) return;
      const code = (error as IntakeClientError).code;
      if (code === 'CONFLICT' || code === 'UNCERTAIN') {
        setConflict(true);
        if (code === 'UNCERTAIN') storage.set(uncertainKey(owner), '1');
      }
      setNotice(t(code === 'UNCERTAIN' ? 'uncertain' : 'saveError'));
    } finally {
      if (clientRef.current === client && ownerRef.current === owner)
        writeInFlightRef.current = false;
      if (clientRef.current === client && ownerRef.current === owner)
        setBusy(false);
    }
  };
  const reload = async () => {
    const id = ownerId && storage.get(draftKey(ownerId!));
    const client = clientRef.current;
    if (!id || !client || !ownerId) return;
    setBusy(true);
    try {
      const listing = await client.load(id);
      if (clientRef.current !== client || ownerRef.current !== ownerId) return;
      setValue(fromDraft(listing.data));
      setSavedRevision(listing.revision);
      setSubmitted(!['DRAFT', 'REJECTED'].includes(listing.status));
      setListingStatus(listing.status);
      const loaded = await client.images();
      if (clientRef.current !== client || ownerRef.current !== ownerId) return;
      setImages(loaded);
      setConflict(false);
      storage.remove(uncertainKey(ownerId!));
      setNotice('');
    } catch {
      if (clientRef.current === client && ownerRef.current === ownerId)
        setNotice(t('saveError'));
    } finally {
      if (clientRef.current === client && ownerRef.current === ownerId)
        setBusy(false);
    }
  };
  const recover = async () => {
    const client = clientRef.current;
    if (!client || !ownerId) return;
    setBusy(true);
    try {
      const listings = await client.recover();
      if (clientRef.current === client && ownerRef.current === ownerId)
        setRecoveryListings(
          listings.filter((listing) =>
            ['DRAFT', 'REJECTED', 'PENDING_MODERATION'].includes(listing.status)
          )
        );
    } catch {
      if (clientRef.current === client && ownerRef.current === ownerId)
        setNotice(t('saveError'));
    } finally {
      if (clientRef.current === client && ownerRef.current === ownerId)
        setBusy(false);
    }
  };
  const chooseRecovered = async (id: string) => {
    if (!ownerId || !clientRef.current) return;
    if (!storage.set(draftKey(ownerId!), id)) {
      setNotice(t('storageUnavailable'));
      return;
    }
    await reload();
    setRecoveryListings([]);
  };

  const priceUnits = priceUnitsFor(
    value.category,
    (value.offerType || undefined) as 'RENT' | 'SALE' | 'SERVICE' | undefined
  );
  const imageBase = clientRef.current?.listing?.id;
  const imageList = useMemo(
    () => [...images].sort((a, b) => a.position - b.position),
    [images]
  );
  const previewData = normalizeIntake(value);
  const labelCode = (code: string) => {
    const translated = t('codes.' + code);
    return translated === `equipmentIntake.codes.${code}` ? code : translated;
  };
  const previewValue = (key: string, content: unknown): string => {
    const code = String(content);
    if (['offerType', 'category', 'contactVisibility'].includes(key))
      return t(code);
    if (
      [
        'priceUnit',
        'chassis',
        'machineCondition',
        'trajectory',
        'site',
        'operator',
        'delivery',
        'kind',
        'accredited',
        'ownCrew',
      ].includes(key)
    )
      return labelCode(code);
    if (key === 'region') return regionLabel(code, locale);
    if (key === 'serviceMethods' && Array.isArray(content))
      return content.map((item) => labelCode(String(item))).join(', ');
    if (key === 'serviceArea' && Array.isArray(content))
      return content
        .map((item) =>
          item === 'ALL_KZ'
            ? labelCode(item)
            : regionLabel(String(item), locale)
        )
        .join(', ');
    return code;
  };

  // Preview reads like the listing: what, price, where, details, then contact.
  const previewOrder = [
    'category',
    'offerType',
    'kind',
    'title',
    'price',
    'region',
    'city',
    'serviceArea',
    'availability',
  ];
  const contactKeys = ['contactName', 'company', 'phone', 'contactVisibility'];
  const priceText = () => {
    if (previewData.price === undefined) return t('priceOnRequest');
    const amount = new Intl.NumberFormat(
      { ru: 'ru-RU', kz: 'kk-KZ', en: 'en-US', zh: 'zh-CN' }[locale] ?? 'ru-RU'
    ).format(previewData.price);
    const unit = previewData.priceUnit ? labelCode(previewData.priceUnit) : '';
    const shift =
      previewData.priceUnit === 'SHIFT' && previewData.shiftHours
        ? ` (${previewData.shiftHours} ${t('hoursShort')})`
        : '';
    return `${amount} ${previewData.currency ?? ''} · ${unit}${shift}`.trim();
  };
  const previewRows: [string, string][] = (() => {
    const entries = Object.entries(previewData).filter(
      ([key]) =>
        ![
          'schemaVersion',
          'capabilities',
          'purposes',
          'currency',
          'priceUnit',
          'shiftHours',
          'price',
        ].includes(key)
    );
    const rank = (key: string) => {
      const main = previewOrder.indexOf(key);
      if (main >= 0) return main;
      const contact = contactKeys.indexOf(key);
      return contact >= 0 ? 100 + contact : 50;
    };
    const rows: [string, string][] = entries.map(([key, content]) => [
      key,
      key === 'offerType' && choiceGroup
        ? t(`offerChoice.${choiceGroup}.${String(content)}`)
        : previewValue(key, content),
    ]);
    rows.push(['price', priceText()]);
    return rows.sort(([a], [b]) => rank(a) - rank(b));
  })();

  return (
    <section
      className={`brand-container text-brand-ink ${
        submitted ? 'pb-16' : 'pb-40 lg:pb-20'
      }`}
      aria-label={t('offers')}
    >
      <div className="grid gap-3.5 pb-7 pt-6 md:pb-9 md:pt-10">
        <p className="holding-eyebrow">{t('eyebrow')}</p>
        <h1 className="font-serif text-[34px] font-light leading-[1.04] tracking-[-0.025em] sm:text-[44px] lg:text-[52px]">
          {t('title')}
        </h1>
        <p className="max-w-[58ch] text-[17px] text-brand-muted">
          {t('intro')}
        </p>
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
        <div className="grid min-w-0 content-start gap-7">
          {whatsappNumber && !submitted && !editingActive && step === 1 && (
            <a
              href={whatsappLink(whatsappNumber, t('assistedMessage'))}
              target="_blank"
              rel="noopener noreferrer"
              className="brand-focus flex items-center gap-3 bg-brand-surface px-4 py-3.5 text-[15px] lg:hidden"
            >
              <MessageCircle
                aria-hidden
                size={22}
                strokeWidth={1.5}
                className="shrink-0 text-brand-accent"
              />
              <span className="flex-1">{t('assistedText')}</span>
              <ChevronRight
                aria-hidden
                size={18}
                className="shrink-0 text-brand-muted"
              />
            </a>
          )}
          {editingActive && (
            <div
              role="note"
              className="border-l-2 border-brand-warn bg-brand-surface p-4 text-sm"
            >
              <p className="font-semibold">{t('editingActive')}</p>
              <p>{t('photosLocked')}</p>
            </div>
          )}
          {submitted ? (
            <div
              role="status"
              className="grid justify-items-start gap-4 bg-brand-surface px-6 py-8"
            >
              <span
                aria-hidden
                className="grid h-14 w-14 place-items-center rounded-full bg-brand-accent text-brand-deep"
              >
                <Check size={28} strokeWidth={2} />
              </span>
              <h2 className="font-serif text-[28px] font-light leading-[1.1] tracking-[-0.025em] md:text-[40px]">
                {t(
                  listingStatus === 'ACTIVE'
                    ? 'active'
                    : listingStatus === 'ARCHIVED'
                      ? 'archived'
                      : 'pending'
                )}
              </h2>
              <p>
                {t(
                  listingStatus === 'ACTIVE'
                    ? 'activeHint'
                    : listingStatus === 'ARCHIVED'
                      ? 'archivedHint'
                      : 'pendingHint'
                )}
              </p>
              <a href={`/${locale}/equipment/my`} className={buttonClass}>
                {t('myListings')}
              </a>
            </div>
          ) : (
            <>
              <div className="grid gap-2.5">
                <p className="text-[13px] font-medium text-brand-muted">
                  {t('step', { current: step })}
                </p>
                <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
                  {[1, 2, 3, 4].map((number) => (
                    <div
                      key={number}
                      className={`grid gap-2 text-[13px] ${
                        number === step
                          ? 'font-medium text-brand-ink'
                          : 'text-brand-muted'
                      }`}
                    >
                      <span
                        className={`h-[3px] ${
                          number === step
                            ? 'bg-brand-accent'
                            : number < step
                              ? 'bg-brand-ink'
                              : 'bg-brand-hair'
                        }`}
                      />
                      <span className="truncate">
                        {t(`stepNames.${number}`)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-7">
                <h2 className="font-serif text-[28px] font-light leading-[1.1] tracking-[-0.025em] md:text-[44px]">
                  {t(['', 'offers', 'details', 'contact', 'preview'][step])}
                </h2>
                {step === 1 && (
                  <div className="grid gap-8">
                    <fieldset>
                      <legend className="sr-only">{t('whatYouHave')}</legend>
                      <div className="grid gap-5">
                        {(Object.keys(CATEGORY_GROUPS) as CategoryGroup[]).map(
                          (groupKey) => (
                            <div key={groupKey}>
                              <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-brand-muted">
                                {t(`groups.${groupKey}`)}
                              </p>
                              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
                                {CATEGORY_GROUPS[groupKey].map((category) => {
                                  const Icon =
                                    CATEGORY_ICONS[category] ?? Layers;
                                  const checked = value.category === category;
                                  return (
                                    <label
                                      key={category}
                                      className={`flex min-h-24 cursor-pointer flex-col items-start justify-between gap-3.5 border p-3.5 text-[15px] leading-tight transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-accent ${
                                        checked
                                          ? 'border-brand-ink bg-brand-ink text-brand-bg'
                                          : 'border-transparent bg-brand-surface hover:border-brand-line'
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        className="sr-only"
                                        name="category"
                                        value={category}
                                        checked={checked}
                                        onChange={() =>
                                          changeCategory(category)
                                        }
                                      />
                                      <Icon
                                        aria-hidden
                                        size={24}
                                        strokeWidth={1.4}
                                        className={
                                          checked
                                            ? 'text-brand-accent'
                                            : 'text-brand-muted'
                                        }
                                      />
                                      <span>{t(category)}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                      {errors.includes('category') && !value.category && (
                        <p role="alert" className={`mt-2 ${errorClass}`}>
                          {t('chooseCategory')}
                        </p>
                      )}
                    </fieldset>
                    {value.category && (
                      <fieldset ref={offerRef}>
                        <legend className={`mb-3.5 ${subheadClass}`}>
                          {t('whatYouWant')}
                        </legend>
                        <div className="grid gap-2">
                          {offerTypesFor(value.category).map((offer) =>
                            choiceRow(
                              'offerType',
                              offer,
                              t(`offerChoice.${choiceGroup}.${offer}`),
                              value.offerType === offer,
                              () => changeOffer(offer)
                            )
                          )}
                        </div>
                        {errors.includes('category') && !value.offerType && (
                          <p role="alert" className={`mt-2 ${errorClass}`}>
                            {t('chooseOffer')}
                          </p>
                        )}
                      </fieldset>
                    )}
                  </div>
                )}
                {step === 2 && (
                  <div className="space-y-5">
                    {kinds.length > 0 &&
                      select({ name: 'kind', values: kinds, required: true })}
                    {field({ name: 'title', required: true })}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className={labelClass}>
                        <span>{t('region')} *</span>
                        <select
                          className={inputClass}
                          value={value.region ?? ''}
                          onChange={(event) =>
                            change('region', event.target.value)
                          }
                        >
                          <option value="">{t('chooseRegion')}</option>
                          {REGION_IDS.map((region) => (
                            <option key={region} value={region}>
                              {regionLabel(region, locale)}
                            </option>
                          ))}
                        </select>
                        {errors.includes('region') && (
                          <span role="alert" className={errorClass}>
                            {t('required')}
                          </span>
                        )}
                      </label>
                      {field({ name: 'city' })}
                    </div>
                    {people && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {field({ name: 'experienceYears', type: 'number' })}
                        {select({ name: 'workFormat', values: WORK_FORMATS })}
                      </div>
                    )}
                    {field({ name: 'availability' })}
                    <div className="grid gap-4 sm:grid-cols-3">
                      {field({ name: 'price', type: 'number' })}
                      {value.price.trim() && (
                        <>
                          {select({
                            name: 'currency',
                            values: ['KZT', 'USD', 'CNY'],
                            required: true,
                          })}
                          {select({
                            name: 'priceUnit',
                            values: priceUnits,
                            required: true,
                          })}
                        </>
                      )}
                    </div>
                    <p className="text-sm text-brand-muted">{t('priceHint')}</p>
                    {value.price.trim() &&
                      value.priceUnit === 'SHIFT' &&
                      field({
                        name: 'shiftHours',
                        type: 'number',
                        required: true,
                      })}
                    {value.price.trim() && field({ name: 'priceIncludes' })}
                    {serviceMethods.length > 0 &&
                      checklist(
                        'serviceMethods',
                        serviceMethods,
                        labelCode,
                        true
                      )}
                    {value.category === 'labService' && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {select({
                          name: 'accredited',
                          values: ['true', 'false'],
                        })}
                        {value.accredited === 'true' &&
                          field({ name: 'accreditationNumber' })}
                      </div>
                    )}
                    {value.offerType === 'SERVICE' &&
                      !people &&
                      select({ name: 'ownCrew', values: ['true', 'false'] })}
                    {(value.offerType === 'RENT' ||
                      value.offerType === 'SERVICE') &&
                      checklist(
                        'serviceArea',
                        ['ALL_KZ', ...REGION_IDS],
                        (item) =>
                          item === 'ALL_KZ'
                            ? labelCode(item)
                            : regionLabel(item, locale)
                      )}
                    {drilling && (
                      <div className="grid gap-3.5">
                        <h3 className={subheadClass}>{t('capabilities')}</h3>
                        {errors.includes('capabilities') && (
                          <span role="alert" className={errorClass}>
                            {t('capabilityRequired')}
                          </span>
                        )}
                        {value.capabilities.map((row, index) => (
                          <div
                            key={index}
                            className="grid gap-4 border border-brand-hair bg-brand-surface p-[18px]"
                          >
                            <p className="font-medium">
                              {t('capabilityN', { n: index + 1 })}
                            </p>
                            <label className={labelClass}>
                              {t('method')}
                              <select
                                className={inputClass}
                                value={row.method}
                                onChange={(event) =>
                                  updateCapability(
                                    index,
                                    'method',
                                    event.target.value
                                  )
                                }
                              >
                                <option value="">{t('optional')}</option>
                                {DRILLING_METHODS.map((method) => (
                                  <option key={method} value={method}>
                                    {t('codes.' + method)}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {(['depth', 'diameter'] as const).map((key) => (
                                <label key={key} className={labelClass}>
                                  {t(key)}
                                  <input
                                    className={inputClass}
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={row[key]}
                                    onChange={(event) =>
                                      updateCapability(
                                        index,
                                        key,
                                        event.target.value
                                      )
                                    }
                                  />
                                </label>
                              ))}
                            </div>
                            {row.method === 'CORE' && (
                              <label className={labelClass}>
                                {t('coreSize')}
                                <select
                                  className={inputClass}
                                  value={row.coreSize}
                                  onChange={(event) =>
                                    updateCapability(
                                      index,
                                      'coreSize',
                                      event.target.value
                                    )
                                  }
                                >
                                  <option value="">{t('optional')}</option>
                                  {CORE_SIZES.map((code) => (
                                    <option key={code} value={code}>
                                      {t('codes.' + code) ===
                                      `equipmentIntake.codes.${code}`
                                        ? code
                                        : t('codes.' + code)}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            )}
                            <label className={labelClass}>
                              {t('source')}
                              <select
                                className={inputClass}
                                value={row.source}
                                onChange={(event) =>
                                  updateCapability(
                                    index,
                                    'source',
                                    event.target.value
                                  )
                                }
                              >
                                <option value="">{t('optional')}</option>
                                {CAPABILITY_SOURCES.map((code) => (
                                  <option key={code} value={code}>
                                    {t('codes.' + code) ===
                                    `equipmentIntake.codes.${code}`
                                      ? code
                                      : t('codes.' + code)}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <button
                              type="button"
                              className="inline-flex min-h-11 items-center gap-2 justify-self-start text-sm text-brand-muted underline decoration-brand-line underline-offset-4 hover:text-brand-ink"
                              onClick={() =>
                                apply((old) => ({
                                  ...old,
                                  capabilities: old.capabilities.filter(
                                    (_, position) => position !== index
                                  ),
                                }))
                              }
                            >
                              <X aria-hidden size={16} />
                              {t('removeCapability')}
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className={`${buttonClass} justify-self-start`}
                          disabled={value.capabilities.length >= 12}
                          onClick={() =>
                            apply((old) => ({
                              ...old,
                              capabilities: [
                                ...old.capabilities,
                                {
                                  method: '',
                                  depth: '',
                                  diameter: '',
                                  coreSize: '',
                                  source: '',
                                },
                              ],
                            }))
                          }
                        >
                          <Plus aria-hidden size={18} />
                          {t('addCapability')}
                        </button>
                        <details className="border-y border-brand-hair">
                          <summary className={summaryClass}>
                            {t('drillingExtra')}
                            <ChevronDown aria-hidden size={18} />
                          </summary>
                          <div className="space-y-4 pb-5">
                            <fieldset>
                              <legend className="mb-2 text-[13px] font-medium">
                                {t('purposes')}
                              </legend>
                              <div className="grid gap-2 sm:grid-cols-2">
                                {DRILLING_PURPOSES.map((purpose) => (
                                  <label
                                    key={purpose}
                                    className="flex min-h-11 items-center gap-2"
                                  >
                                    <input
                                      type="checkbox"
                                      className="h-5 w-5 shrink-0 accent-brand-accent"
                                      checked={value.purposes.includes(purpose)}
                                      onChange={(event) =>
                                        apply((old) => ({
                                          ...old,
                                          purposes: event.target.checked
                                            ? [...old.purposes, purpose]
                                            : old.purposes.filter(
                                                (item) => item !== purpose
                                              ),
                                        }))
                                      }
                                    />
                                    {t('codes.' + purpose)}
                                  </label>
                                ))}
                              </div>
                            </fieldset>
                            <div className="grid gap-4 sm:grid-cols-2">
                              {select({
                                name: 'trajectory',
                                values: DRILLING_TRAJECTORIES,
                              })}
                              {select({ name: 'site', values: DRILLING_SITES })}
                            </div>
                          </div>
                        </details>
                      </div>
                    )}
                    {!people && (
                      <details className="border-y border-brand-hair">
                        <summary className={summaryClass}>
                          {t('technicalExtra')}
                          <ChevronDown aria-hidden size={18} />
                        </summary>
                        <div className="space-y-4 pb-5">
                          {value.category === 'excavator' && (
                            <div className="grid gap-4 sm:grid-cols-2">
                              {field({ name: 'bucket', type: 'number' })}
                              {field({ name: 'mass', type: 'number' })}
                            </div>
                          )}
                          {value.category === 'compressor' && (
                            <div className="grid gap-4 sm:grid-cols-2">
                              {field({ name: 'pressure', type: 'number' })}
                              {field({ name: 'flow', type: 'number' })}
                            </div>
                          )}
                          {value.category === 'transport' &&
                            field({ name: 'payload', type: 'number' })}
                          {value.category === 'camp' &&
                            field({ name: 'powerKw', type: 'number' })}
                          {value.offerType !== 'SERVICE' && (
                            <>
                              <div className="grid gap-4 sm:grid-cols-2">
                                {field({ name: 'brand' })}
                                {field({ name: 'model' })}
                              </div>
                              {['drill', 'excavator'].includes(
                                value.category
                              ) &&
                                select({
                                  name: 'chassis',
                                  values: CHASSIS_TYPES,
                                })}
                              <div className="grid gap-4 sm:grid-cols-2">
                                {select({
                                  name: 'operator',
                                  values: ['true', 'false'],
                                })}
                                {select({
                                  name: 'delivery',
                                  values: ['true', 'false'],
                                })}
                              </div>
                            </>
                          )}
                          {value.offerType === 'SALE' && (
                            <div className="grid gap-4 sm:grid-cols-2">
                              {field({ name: 'machineYear', type: 'number' })}
                              {select({
                                name: 'machineCondition',
                                values: MACHINE_CONDITIONS,
                              })}
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                    <div className="grid gap-3.5">
                      <h3 className={subheadClass}>{t('photos')}</h3>
                      <input
                        ref={fileRef}
                        className="sr-only"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={(event) => void upload(event.target.files)}
                      />
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {imageList.map((image, index) => (
                          <div
                            key={image.id}
                            className="relative aspect-square overflow-hidden bg-brand-surface"
                          >
                            {imageBase && (
                              <img
                                alt={`${t('photos')} ${image.position + 1}`}
                                className="h-full w-full object-cover"
                                src={`/api/equipment-listings/${imageBase}/images/${image.id}`}
                              />
                            )}
                            {index === 0 && (
                              <span className="absolute bottom-1.5 left-1.5 bg-brand-chalk px-1.5 py-0.5 text-[11px] text-brand-deep">
                                {t('cover')}
                              </span>
                            )}
                            <button
                              type="button"
                              aria-label={`${t('remove')} ${image.position + 1}`}
                              className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center bg-brand-deep/70 text-brand-chalk disabled:opacity-50"
                              disabled={busy || editingActive}
                              onClick={() => void removeImage(image.id)}
                            >
                              <X aria-hidden size={16} />
                            </button>
                          </div>
                        ))}
                        {images.length < 8 && (
                          <button
                            type="button"
                            className="flex aspect-square flex-col items-center justify-center gap-1.5 border border-dashed border-brand-line p-2 text-center text-sm transition-colors hover:border-brand-ink disabled:opacity-50"
                            disabled={!ownerId || busy || editingActive}
                            onClick={() => fileRef.current?.click()}
                          >
                            <Camera
                              aria-hidden
                              size={26}
                              strokeWidth={1.3}
                              className="text-brand-accent"
                            />
                            {t('upload')}
                          </button>
                        )}
                      </div>
                      <p className="text-[13px] text-brand-muted">
                        {t('photoHint')}
                      </p>
                      {!ownerId && (
                        <p className="text-sm">{t('loginRequired')}</p>
                      )}
                    </div>
                    <details className="border-y border-brand-hair">
                      <summary className={summaryClass}>
                        {t('extra')}
                        <ChevronDown aria-hidden size={18} />
                      </summary>
                      <div className="space-y-4 pb-5">
                        {field({ name: 'description', multiline: true })}
                        {field({ name: 'conditions', multiline: true })}
                      </div>
                    </details>
                  </div>
                )}
                {step === 3 && (
                  <div className="space-y-5">
                    {!ownerId && (
                      <div className="grid gap-3.5 bg-brand-surface p-[22px]">
                        <p className="text-[13px] text-brand-muted">
                          {t('loginRequired')}
                        </p>
                        <MarketplaceSignIn
                          locale={locale}
                          googleEnabled={googleEnabled}
                          emailEnabled={emailEnabled}
                          callbackUrl={
                            typeof window === 'undefined'
                              ? `/${locale}/equipment/new`
                              : window.location.pathname +
                                window.location.search
                          }
                        />
                      </div>
                    )}
                    {field({ name: 'contactName', required: true })}
                    {field({ name: 'company' })}
                    {field({ name: 'phone', type: 'tel', required: true })}
                    <fieldset>
                      <legend className={`mb-3.5 ${subheadClass}`}>
                        {t('contactVisibility')} *
                      </legend>
                      <div className="grid gap-2">
                        {['PUBLIC', 'PRIVATE'].map((choice) =>
                          choiceRow(
                            'contactVisibility',
                            choice,
                            t(choice),
                            value.contactVisibility === choice,
                            () => change('contactVisibility', choice)
                          )
                        )}
                      </div>
                      {errors.includes('contactVisibility') && (
                        <p role="alert" className={errorClass}>
                          {t('required')}
                        </p>
                      )}
                    </fieldset>
                  </div>
                )}
                {step === 4 && (
                  <div className="space-y-5">
                    <dl className="border-t border-brand-hair">
                      {previewRows.map(([key, content]) => (
                        <div key={key} className={factRow}>
                          <dt className="text-brand-muted">{labelFor(key)}</dt>
                          <dd className="min-w-0 break-words">{content}</dd>
                        </div>
                      ))}
                      {previewData.purposes?.length ? (
                        <div className={factRow}>
                          <dt className="text-brand-muted">{t('purposes')}</dt>
                          <dd>
                            {previewData.purposes.map(labelCode).join(', ')}
                          </dd>
                        </div>
                      ) : null}
                      <div className={factRow}>
                        <dt className="text-brand-muted">{t('photos')}</dt>
                        <dd>{images.length || t('noPhotos')}</dd>
                      </div>
                    </dl>
                    {previewData.capabilities?.length ? (
                      <div className="space-y-2">
                        <h3 className={subheadClass}>{t('capabilities')}</h3>
                        {previewData.capabilities.map((row, index) => (
                          <dl
                            key={index}
                            className="grid grid-cols-2 gap-x-3 gap-y-1.5 bg-brand-surface px-3.5 py-3 text-[15px]"
                          >
                            <dt>{t('method')}</dt>
                            <dd>{labelCode(row.method)}</dd>
                            {row.depth && (
                              <>
                                <dt>{t('depth')}</dt>
                                <dd>{row.depth}</dd>
                              </>
                            )}
                            {row.diameter && (
                              <>
                                <dt>{t('diameter')}</dt>
                                <dd>{row.diameter}</dd>
                              </>
                            )}
                            {row.coreSize && (
                              <>
                                <dt>{t('coreSize')}</dt>
                                <dd>{row.coreSize}</dd>
                              </>
                            )}
                            {row.source && (
                              <>
                                <dt>{t('source')}</dt>
                                <dd>{labelCode(row.source)}</dd>
                              </>
                            )}
                          </dl>
                        ))}
                      </div>
                    ) : null}
                    {!ownerId && (
                      <div className="grid gap-3.5 bg-brand-surface p-[22px]">
                        <p className="font-medium">{t('signInToSend')}</p>
                        <MarketplaceSignIn
                          locale={locale}
                          googleEnabled={googleEnabled}
                          emailEnabled={emailEnabled}
                          callbackUrl={
                            typeof window === 'undefined'
                              ? `/${locale}/equipment/new`
                              : window.location.pathname +
                                window.location.search
                          }
                        />
                      </div>
                    )}
                  </div>
                )}
                {notice && (
                  <p
                    role="status"
                    className="border-l-2 border-brand-accent bg-brand-surface px-4 py-3 text-sm"
                  >
                    {notice}
                  </p>
                )}
                {conflict && ownerId && storage.get(draftKey(ownerId!)) && (
                  <button
                    type="button"
                    className={buttonClass}
                    disabled={busy}
                    onClick={() => void reload()}
                  >
                    {t('reload')}
                  </button>
                )}
                {conflict && ownerId && (
                  <button
                    type="button"
                    className={buttonClass}
                    disabled={busy}
                    onClick={() => void recover()}
                  >
                    {t('findDraft')}
                  </button>
                )}
                {conflict && recoveryListings.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">{t('chooseDraft')}</h3>
                    {recoveryListings.map((listing) => (
                      <button
                        key={listing.id}
                        type="button"
                        className={`${buttonClass} w-full justify-start text-left`}
                        onClick={() => void chooseRecovered(listing.id)}
                      >
                        {listing.data.title || listing.id} · {listing.id}
                      </button>
                    ))}
                  </div>
                )}
                <div className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-[auto_1fr] gap-2.5 border-t border-brand-hair bg-brand-bg px-4 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-3 lg:static lg:z-auto lg:flex lg:items-center lg:gap-3 lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-6">
                  {step > 1 ? (
                    <button
                      type="button"
                      className={buttonClass}
                      onClick={() => {
                        setStep(step - 1);
                        setErrors([]);
                      }}
                    >
                      <ArrowLeft aria-hidden size={18} />
                      {t('back')}
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    className={primaryClass}
                    disabled={busy || conflict || (step === 4 && !ownerId)}
                    onClick={() => void nextStep()}
                  >
                    {step === 4
                      ? t(editingActive ? 'resubmit' : 'submit')
                      : t('next')}
                    {step < 4 && <ArrowRight aria-hidden size={18} />}
                  </button>
                  {ownerId && savedRevision > 0 && (
                    <p className="col-span-2 text-center text-xs text-brand-muted lg:ml-auto lg:text-right">
                      {t('saved')}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        {!submitted && (
          <aside className="hidden content-start gap-3.5 lg:grid">
            {whatsappNumber && !editingActive && (
              <div className="grid gap-3 bg-brand-surface p-[22px]">
                <h3 className="text-[17px] font-medium">{t('helpTitle')}</h3>
                <p className="text-sm text-brand-muted">{t('helpText')}</p>
                <a
                  href={whatsappLink(whatsappNumber, t('assistedMessage'))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${buttonClass} min-h-11 justify-self-start px-4 text-sm`}
                >
                  <MessageCircle aria-hidden size={18} />
                  {t('assistedButton')}
                </a>
              </div>
            )}
            <div className="grid gap-3 bg-brand-surface p-[22px]">
              <h3 className="text-[17px] font-medium">{t('reviewTitle')}</h3>
              <p className="text-sm text-brand-muted">{t('reviewText')}</p>
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}

export default EquipmentIntake;
