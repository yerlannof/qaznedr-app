export const SERVICE_TOPICS = [
  'licensing',
  'geology',
  'due-diligence',
  'analytics',
] as const;
export type ServiceTopic = (typeof SERVICE_TOPICS)[number];

/** Query strings can choose a known topic, never inject a message or offer. */
export function getServiceTopic(
  value: string | string[] | undefined
): ServiceTopic | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return SERVICE_TOPICS.find((topic) => topic === first);
}
