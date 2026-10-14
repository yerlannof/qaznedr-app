import {
  aiPrecheck,
  localPrecheck,
  precheckPrompt,
  runPrecheck,
} from '@/lib/equipment-listings/precheck';
import type { EquipmentListing } from '@/lib/equipment-listings/domain';

const listing = (extra: Record<string, unknown> = {}): EquipmentListing => ({
  id: '00000000-0000-4000-8000-000000000001',
  ownerId: 'owner',
  status: 'PENDING_MODERATION',
  revision: 2,
  data: {
    schemaVersion: 2,
    offerType: 'RENT',
    category: 'excavator',
    kind: 'BULLDOZER',
    title: 'Бульдозер SD22',
    region: 'abai',
    city: 'Семей',
    availability: 'Сейчас',
    contactName: 'Секретное Имя',
    phone: '+77001112233',
    company: 'Секретное ТОО',
    contactVisibility: 'PRIVATE',
    ...extra,
  } as EquipmentListing['data'],
});
const reply = (text: string) =>
  jest.fn(async () => ({
    ok: true,
    json: async () => ({ content: [{ type: 'text', text }] }),
  }));

describe('listing pre-check', () => {
  it('flags contacts and links written into the public text', () => {
    expect(localPrecheck(listing())).toEqual([]);
    const codes = localPrecheck(
      listing({
        description:
          'Звоните +7 700 111 22 33 или пишите в WhatsApp, сайт www.example.kz',
      })
    ).map((flag) => flag.code);
    expect(codes).toEqual(['CONTACT_IN_TEXT', 'LINK_IN_TEXT']);
  });

  it('never sends contact fields to the model', () => {
    const prompt = precheckPrompt(listing());
    expect(prompt).toContain('Бульдозер SD22');
    expect(prompt).not.toContain('+77001112233');
    expect(prompt).not.toContain('Секретное');
  });

  it('works without an API key using the local rules', async () => {
    const fetchImpl = reply('{}');
    const result = await runPrecheck(
      listing({ description: 'тел 87001112233' }),
      undefined,
      fetchImpl
    );
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result).toMatchObject({ verdict: 'REVIEW', model: 'rules' });
    expect((await runPrecheck(listing(), undefined)).verdict).toBe('OK');
  });

  it('merges valid AI advice and ignores malformed answers', async () => {
    const good = reply(
      'Ответ: {"verdict":"REJECT_SUGGESTED","flags":[{"code":"WRONG_SECTION","note":"Это не бульдозер"}],"summary":"Похоже на спам"}'
    );
    const result = await runPrecheck(listing(), 'key', good);
    expect(result).toMatchObject({
      verdict: 'REJECT_SUGGESTED',
      flags: [{ code: 'WRONG_SECTION', note: 'Это не бульдозер' }],
      summary: 'Похоже на спам',
      model: 'claude-haiku-5-5',
    });
    expect(await aiPrecheck(listing(), 'key', reply('not json'))).toBeNull();
    expect(
      await aiPrecheck(
        listing(),
        'key',
        reply('{"verdict":"APPROVE","flags":[],"summary":""}')
      )
    ).toBeNull();
    const failing = jest.fn(async () => {
      throw new Error('network');
    });
    expect(await aiPrecheck(listing(), 'key', failing)).toBeNull();
  });
});
