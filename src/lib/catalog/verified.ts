// Objects the QAZNEDR team has verified (object and documents), by public
// code → ISO date. Every other card shows «Не верифицировано» (approved
// design 19). Add a code only on the owner's explicit word.
export const VERIFIED: Readonly<Record<string, string>> = {};

export function verifiedOn(code: string): string | null {
  return VERIFIED[code] ?? null;
}
