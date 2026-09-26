import fs from 'fs';
import path from 'path';
import robots from '@/app/robots';
import { TEASER_COLUMNS } from '@/lib/leads/types';

const readJson = (file: string) =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', file), 'utf8'));
const api = readJson('api/openapi.json');
const manifest = readJson('.well-known/ai-plugin.json');

describe('public API discovery contract', () => {
  it('advertises only existing read-only area endpoints', () => {
    expect(Object.keys(api.paths).sort()).toEqual([
      '/api/leads',
      '/api/leads/{code}',
    ]);
    for (const route of Object.values(api.paths)) {
      expect(Object.keys(route as object)).toEqual(['get']);
    }
    expect(api.info.title).toBe('QAZNEDR HOLDING public areas API');
  });

  it('documents the real collection filter and pagination contract', () => {
    const parameters = api.paths['/api/leads'].get.parameters;
    expect(parameters.map((p: { name: string }) => p.name).sort()).toEqual(
      [
        'region',
        'tier',
        'type',
        'mineral',
        'exclusivity',
        'free',
        'sort',
        'page',
        'limit',
      ].sort()
    );
    const parameter = (name: string) =>
      parameters.find((p: { name: string }) => p.name === name);
    expect(parameter('limit').schema).toMatchObject({
      default: 24,
      maximum: 50,
    });
    expect(parameter('type').schema.enum).toEqual([
      'placer',
      'bedrock',
      'other',
    ]);
    expect(parameter('free').schema.enum).toEqual(['1']);
    expect(parameter('sort').schema.enum).toEqual([
      'newest',
      'value_desc',
      'confidence_desc',
    ]);
    expect(api.components.schemas.AreaPage.required.sort()).toEqual(
      ['leads', 'total', 'page', 'limit', 'totalPages'].sort()
    );
    expect(api.paths['/api/leads'].get.responses).toHaveProperty('503');
  });

  it('documents the code path parameter and missing-area response', () => {
    const operation = api.paths['/api/leads/{code}'].get;
    expect(operation.parameters).toEqual([
      { name: 'code', in: 'path', required: true, schema: { type: 'string' } },
    ]);
    expect(operation.responses).toHaveProperty('404');
    for (const route of Object.values(api.paths) as {
      get: { responses: object };
    }[]) {
      expect(route.get.responses).toHaveProperty('429');
    }
  });

  it('documents public teaser fields only, including source date and categories', () => {
    const properties = api.components.schemas.AreaTeaser.properties;
    expect(Object.keys(properties)).toEqual(
      expect.arrayContaining([
        'code',
        'mineral',
        'region',
        'license_status',
        'last_verified',
        'reserve_categories',
      ])
    );
    for (const field of Object.keys(properties)) {
      expect(TEASER_COLUMNS.split(',')).toContain(field);
    }
    expect(properties.last_verified).toMatchObject({
      nullable: true,
      format: 'date',
    });
    expect(properties.reserve_categories).toMatchObject({
      type: 'array',
      nullable: true,
    });
    const serialized = JSON.stringify(api);
    for (const privateField of [
      'registry_ref',
      'grade_full',
      'reserves_full',
      'source_books',
      'our_files',
      'methodology',
      'ssot_doc',
    ]) {
      expect(serialized).not.toContain(`"${privateField}"`);
    }
  });

  it('allows crawling the static schema while keeping API routes disallowed', () => {
    const rules = robots().rules;
    expect(Array.isArray(rules)).toBe(true);
    for (const rule of Array.isArray(rules) ? rules : [rules]) {
      expect(rule.allow).toEqual(['/', '/api/openapi.json$']);
      expect(rule.disallow).toContain('/api/');
      expect(rule.disallow).toContain('/*/leads/*/full');
    }
  });

  it('keeps discovery URLs canonical and uses the approved areas-first summary', () => {
    expect(api.servers).toEqual([{ url: 'https://qaznedr.kz' }]);
    expect(manifest.api.url).toBe('https://qaznedr.kz/api/openapi.json');
    expect(manifest.description_for_human).toBe(
      'We present areas selected by our geologists based on their review of geological materials.'
    );
    expect(JSON.stringify(api)).not.toMatch(
      /\/api\/(listings|services)|marketplace|equipment/i
    );
  });
});
