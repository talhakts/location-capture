/**
 * UK Postcode and Outcode Normalization Utilities
 */

// Official UK Government regex pattern for full postcodes
const FULL_POSTCODE_REGEX =
  /^([Gg][Ii][Rr]\s?0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9][A-Za-z]?))))\s?[0-9][A-Za-z]{2})$/;

// Regex for outcodes only (the outward code before the space, e.g. LA4, HU19, SW1A, EC1)
const OUTCODE_REGEX =
  /^([A-Za-z][0-9]{1,2}|[A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2}|[A-Za-z][0-9][A-Za-z]|[A-Za-z][A-Ha-hJ-Yj-y][0-9][A-Za-z])$/;

export type LocationInputType = 'full_postcode' | 'outcode' | 'placename_or_address';

export interface AnalyzedInput {
  raw: string;
  normalized: string;
  type: LocationInputType;
}

export function normalizeInput(input: string): string {
  if (!input) return '';
  return input.trim().replace(/\s+/g, ' ');
}

export function analyzeLocationInput(input: string): AnalyzedInput {
  const normalized = normalizeInput(input);
  const compact = normalized.replace(/\s+/g, '').toUpperCase();

  // Test full postcode
  if (FULL_POSTCODE_REGEX.test(normalized) || FULL_POSTCODE_REGEX.test(compact)) {
    // Format nicely e.g. "LA4 5AA"
    const outLength = compact.length - 3;
    const formatted = `${compact.slice(0, outLength)} ${compact.slice(outLength)}`;
    return {
      raw: input,
      normalized: formatted,
      type: 'full_postcode',
    };
  }

  // Test outcode
  if (OUTCODE_REGEX.test(compact)) {
    return {
      raw: input,
      normalized: compact,
      type: 'outcode',
    };
  }

  return {
    raw: input,
    normalized,
    type: 'placename_or_address',
  };
}
