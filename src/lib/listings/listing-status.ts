/**
 * Single source of truth for listing status + type presentation.
 * Replaces the 4+ duplicated getStatusText/getStatusVariant/getTypeLabel copies
 * scattered across cards and the detail page (each carried its own hardcoded RU
 * strings and an off-palette blue ACTIVE badge).
 *
 * Labels are RU for now; i18n wiring (Wave 3) will swap `label` for a translation
 * key while keeping `variant` here.
 */
import type { BadgeProps } from '@/components/ui/badge';

type BadgeVariant = NonNullable<BadgeProps['variant']>;

export interface StatusMeta {
  label: string;
  variant: BadgeVariant;
}

const STATUS_MAP: Record<string, StatusMeta> = {
  ACTIVE: { label: 'Активно', variant: 'success' },
  PENDING: { label: 'На модерации', variant: 'warning' },
  PENDING_MODERATION: { label: 'На модерации', variant: 'warning' },
  DRAFT: { label: 'Черновик', variant: 'default' },
  SOLD: { label: 'Продано', variant: 'default' },
  EXPIRED: { label: 'Истекло', variant: 'default' },
  REJECTED: { label: 'Отклонено', variant: 'error' },
  DELETED: { label: 'Удалено', variant: 'error' },
};

export function getStatusMeta(status: string): StatusMeta {
  return STATUS_MAP[status] ?? { label: status, variant: 'default' };
}

const TYPE_LABELS: Record<string, string> = {
  MINING_LICENSE: 'Лицензия на добычу',
  EXPLORATION_LICENSE: 'Лицензия на разведку',
  MINERAL_OCCURRENCE: 'Рудопроявление',
};

export function getTypeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}
