export function searchTokens(query: string): string[] {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

/** Split searchable text into words (letters/digits), ignoring punctuation. */
function searchWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * Every query token must be a prefix of some word across the searchable fields.
 * Avoids `"a"` matching inside `"team"` (so "Team a" only matches Team A, not Team B).
 */
export function matchesDirectorySearch(
  query: string,
  fields: Array<string | null | undefined>
): boolean {
  const tokens = searchTokens(query);
  if (tokens.length === 0) return true;

  const words = fields
    .filter((field): field is string => Boolean(field?.trim()))
    .flatMap((field) => searchWords(field));

  return tokens.every((token) =>
    words.some((word) => word.startsWith(token))
  );
}

/** True when query appears in form title, client name, or team name (case-insensitive). */
export function matchesResponseCardSearch(
  query: string,
  fields: { formTitle: string; clientName: string; teamName: string }
) {
  const tokens = searchTokens(query);
  if (tokens.length === 0) return true;

  const words = [fields.formTitle, fields.clientName, fields.teamName].flatMap(
    (field) => searchWords(field)
  );

  return tokens.every((token) =>
    words.some((word) => word.startsWith(token))
  );
}

/** Match when the query appears in form title, client name, or team name. */
export function buildResponseSearchWhere(query: string) {
  const phrase = query.trim();
  if (!phrase) return null;

  return {
    OR: [
      {
        clientSurvey: {
          form: { title: { contains: phrase, mode: "insensitive" as const } },
        },
      },
      {
        clientSurvey: {
          form: {
            client: { name: { contains: phrase, mode: "insensitive" as const } },
          },
        },
      },
      {
        clientSurvey: {
          client: { name: { contains: phrase, mode: "insensitive" as const } },
        },
      },
      {
        clientSurvey: {
          form: {
            team: { name: { contains: phrase, mode: "insensitive" as const } },
          },
        },
      },
    ],
  };
}
