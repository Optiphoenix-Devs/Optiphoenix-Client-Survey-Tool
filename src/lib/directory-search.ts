export function searchTokens(query: string): string[] {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

/** Every token must appear somewhere in the combined searchable fields. */
export function matchesDirectorySearch(
  query: string,
  fields: Array<string | null | undefined>
): boolean {
  const tokens = searchTokens(query);
  if (tokens.length === 0) return true;

  const haystack = fields
    .filter((field): field is string => Boolean(field?.trim()))
    .join(" ")
    .toLowerCase();

  return tokens.every((token) => haystack.includes(token));
}

/** True when query appears in form title, client name, or team name (case-insensitive). */
export function matchesResponseCardSearch(
  query: string,
  fields: { formTitle: string; clientName: string; teamName: string }
) {
  const phrase = query.trim().toLowerCase();
  if (!phrase) return true;
  return [fields.formTitle, fields.clientName, fields.teamName].some((field) =>
    field.toLowerCase().includes(phrase)
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
