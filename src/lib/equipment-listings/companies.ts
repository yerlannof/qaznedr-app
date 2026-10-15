import 'server-only';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';

type Db = { from(table: string): any }; // eslint-disable-line @typescript-eslint/no-explicit-any
const db = async () => (await createServiceClient()) as unknown as Db;

export const COMPANY_STATUSES = ['PENDING', 'ACTIVE', 'HIDDEN'] as const;
export type CompanyStatus = (typeof COMPANY_STATUSES)[number];

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null)
    .nullable()
    .optional();

/** What an author may edit. A bare "bur.kz" becomes https://bur.kz. */
export const companyInputSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    description: optionalText(3000),
    city: optionalText(120),
    website: z
      .string()
      .trim()
      .max(200)
      .transform((value) =>
        value ? `https://${value.replace(/^https?:\/\//i, '')}` : null
      )
      .refine(
        (value) =>
          value === null ||
          /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i.test(value),
        'Invalid website'
      )
      .nullable()
      .optional(),
  })
  .strict();
export type CompanyInput = z.infer<typeof companyInputSchema>;

const row = z.object({
  owner_id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  website: z.string().nullable(),
  city: z.string().nullable(),
  status: z.enum(COMPANY_STATUSES),
  updated_at: z.string(),
});
export type Company = {
  ownerId: string;
  slug: string;
  name: string;
  description: string | null;
  website: string | null;
  city: string | null;
  status: CompanyStatus;
  updatedAt: string;
};
const toCompany = (value: unknown): Company => {
  const r = row.parse(value);
  return {
    ownerId: r.owner_id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    website: r.website,
    city: r.city,
    status: r.status,
    updatedAt: r.updated_at,
  };
};
const COLUMNS = 'owner_id,slug,name,description,website,city,status,updated_at';

const LATIN: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
  ә: 'a',
  ғ: 'g',
  қ: 'k',
  ң: 'n',
  ө: 'o',
  ұ: 'u',
  ү: 'u',
  һ: 'h',
  і: 'i',
};
/** "ТОО «Бур-Сервис»" -> "bur-servis"; legal-form prefixes are dropped. */
export function companySlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/^(тоо|ип|ао|too|llp|ltd|ооо)\s+/i, '')
    .split('')
    .map((char) => LATIN[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
    .replace(/-+$/g, '');
  return base.length >= 3 ? base : `company-${base || 'kz'}`;
}

export async function getOwnCompany(ownerId: string): Promise<Company | null> {
  const client = await db();
  const { data, error } = await client
    .from('marketplace_companies')
    .select(COLUMNS)
    .eq('owner_id', ownerId)
    .maybeSingle();
  if (error) throw new Error('Company unavailable');
  return data ? toCompany(data) : null;
}

/** Every change goes back to moderation; the slug is kept once assigned. */
export async function saveOwnCompany(
  ownerId: string,
  input: CompanyInput
): Promise<Company> {
  const client = await db();
  const existing = await getOwnCompany(ownerId);
  let slug = existing?.slug;
  if (!slug) {
    const base = companySlug(input.name);
    for (let n = 1; n <= 20 && !slug; n++) {
      const candidate = n === 1 ? base : `${base}-${n}`;
      const { data } = await client
        .from('marketplace_companies')
        .select('owner_id')
        .eq('slug', candidate)
        .maybeSingle();
      if (!data) slug = candidate;
    }
    if (!slug) throw new Error('Company unavailable');
  }
  const { data, error } = await client
    .from('marketplace_companies')
    .upsert(
      {
        owner_id: ownerId,
        slug,
        name: input.name,
        description: input.description ?? null,
        website: input.website ?? null,
        city: input.city ?? null,
        status: existing?.status === 'HIDDEN' ? 'HIDDEN' : 'PENDING',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'owner_id' }
    )
    .select(COLUMNS)
    .single();
  if (error) throw new Error('Company unavailable');
  return toCompany(data);
}

export async function getActiveCompanyBySlug(
  slug: string
): Promise<Company | null> {
  if (!/^[a-z0-9-]{3,60}$/.test(slug)) return null;
  const client = await db();
  const { data, error } = await client
    .from('marketplace_companies')
    .select(COLUMNS)
    .eq('slug', slug)
    .eq('status', 'ACTIVE')
    .maybeSingle();
  if (error) throw new Error('Company unavailable');
  return data ? toCompany(data) : null;
}

export async function activeCompanyOf(
  ownerId: string
): Promise<Company | null> {
  const company = await getOwnCompany(ownerId);
  return company?.status === 'ACTIVE' ? company : null;
}

export async function listCompanies(status: CompanyStatus): Promise<Company[]> {
  const client = await db();
  const { data, error } = await client
    .from('marketplace_companies')
    .select(COLUMNS)
    .eq('status', status)
    .order('updated_at', { ascending: false })
    .limit(200);
  if (error) throw new Error('Company unavailable');
  return (data ?? []).map(toCompany);
}

export async function setCompanyStatus(
  ownerId: string,
  status: CompanyStatus
): Promise<void> {
  const client = await db();
  const { error } = await client
    .from('marketplace_companies')
    .update({ status })
    .eq('owner_id', ownerId);
  if (error) throw new Error('Company unavailable');
}
