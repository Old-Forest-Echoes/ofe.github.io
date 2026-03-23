export const countryMeta = {
  Finland: { code: 'FI', currency: 'EUR' },
  Czechia: { code: 'CZ', currency: 'CZK' },
  Germany: { code: 'DE', currency: 'EUR' },
} as const satisfies Record<string, { code: string; currency: string }>;

export type Country = keyof typeof countryMeta;
