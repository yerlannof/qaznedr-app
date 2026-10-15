/**
 * @jest-environment node
 */
import { ownerEmailFor } from '@/lib/equipment-listings/moderation-repository';
import { sendEmail } from '@/lib/email/resend';
import {
  afterModeration,
  moderationEmail,
} from '@/lib/equipment-listings/submission-hooks';
import type { EquipmentListing } from '@/lib/equipment-listings/domain';

jest.mock('next/server', () => ({
  after: () => {
    throw new Error('outside request');
  },
}));
jest.mock('@/lib/inquiries/notify', () => ({ notifyTelegram: jest.fn() }));
jest.mock('@/lib/equipment-listings/precheck', () => ({
  runPrecheck: jest.fn(),
}));
jest.mock('@/lib/equipment-listings/moderation-repository', () => ({
  ownerEmailFor: jest.fn(),
  savePrecheck: jest.fn(),
}));
jest.mock('@/lib/email/resend', () => ({
  sendEmail: jest.fn(),
  emailDeliveryConfigured: () => Boolean(process.env.RESEND_API_KEY),
}));

const listing = (patch: Partial<EquipmentListing>): EquipmentListing => ({
  id: '00000000-0000-4000-8000-000000000001',
  ownerId: 'owner-1',
  status: 'ACTIVE',
  revision: 2,
  data: { title: 'Буровая УКБ-5' } as EquipmentListing['data'],
  ...patch,
});
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  jest.clearAllMocks();
  process.env.RESEND_API_KEY = 're_test';
});

it('links an approved listing to its public page', () => {
  const mail = moderationEmail(listing({}))!;
  expect(mail.subject).toBe('Объявление опубликовано: Буровая УКБ-5');
  expect(mail.text).toContain(
    'https://qaznedr.kz/ru/equipment/00000000-0000-4000-8000-000000000001'
  );
});

it('gives the rejection reason and points to the cabinet', () => {
  const mail = moderationEmail(
    listing({ status: 'REJECTED', moderationNotes: 'Нет фото техники' })
  )!;
  expect(mail.subject).toBe('Объявление не прошло проверку: Буровая УКБ-5');
  expect(mail.text).toContain('Причина: Нет фото техники');
  expect(mail.text).toContain('https://qaznedr.kz/ru/equipment/my');
  expect(mail.html).not.toContain('<script');
});

it('ignores other statuses', () => {
  expect(moderationEmail(listing({ status: 'ARCHIVED' }))).toBeNull();
});

it('mails the account address after a decision', async () => {
  (ownerEmailFor as jest.Mock).mockResolvedValue('owner@example.com');
  afterModeration(listing({}));
  await flush();
  expect(ownerEmailFor).toHaveBeenCalledWith('owner-1');
  expect(sendEmail).toHaveBeenCalledWith(
    expect.objectContaining({ to: 'owner@example.com' })
  );
});

it('stays silent until e-mail delivery is configured', async () => {
  delete process.env.RESEND_API_KEY;
  afterModeration(listing({}));
  await flush();
  expect(ownerEmailFor).not.toHaveBeenCalled();
  expect(sendEmail).not.toHaveBeenCalled();
});

it('swallows delivery failures', async () => {
  (ownerEmailFor as jest.Mock).mockRejectedValue(new Error('db down'));
  expect(() => afterModeration(listing({}))).not.toThrow();
  await flush();
  expect(sendEmail).not.toHaveBeenCalled();
});
