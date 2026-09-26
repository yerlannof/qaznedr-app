import { getServiceTopic, SERVICE_TOPICS } from '@/lib/services/topics';
it.each(['licensing', 'geology', 'due-diligence', 'analytics'])(
  'accepts only the known %s service',
  (topic) => expect(getServiceTopic(topic)).toBe(topic)
);
it.each([
  undefined,
  '',
  '<script>alert(1)</script>',
  'custom-topic',
  'GEOLOGY',
])('ignores unsupported context %s', (value) =>
  expect(getServiceTopic(value)).toBeUndefined()
);
it('takes the first query value consistently', () =>
  expect(getServiceTopic(['geology', 'analytics'])).toBe('geology'));
it('exports four stable public topics', () =>
  expect(SERVICE_TOPICS).toHaveLength(4));
