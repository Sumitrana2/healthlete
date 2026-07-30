/**
 * Live DB: athletes.country is varchar(2) (ISO 3166-1 alpha-2).
 * Full names belong in athletes.country_name.
 */
export type NormalizedAthleteCountry = {
  country: string | null;
  countryName: string | null;
};

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function asIsoCode(value: string | null | undefined): string | null {
  const trimmed = clean(value);
  if (!trimmed) return null;
  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  return null;
}

/** Prefer HA code for country; title/name for country_name. */
export function normalizeAthleteCountry(input: {
  code?: string | null;
  title?: string | null;
  country?: string | null;
  countryName?: string | null;
}): NormalizedAthleteCountry {
  const code = asIsoCode(input.code) ?? asIsoCode(input.country);
  const title =
    clean(input.title) ??
    clean(input.countryName) ??
    (code ? null : clean(input.country));

  return {
    country: code,
    countryName: title && title.length > 2 ? title : title ?? null,
  };
}

/** Clamp any free-form country field before writing to live varchar(2). */
export function clampCountryCode(value: string | null | undefined): string | null {
  return asIsoCode(value);
}
