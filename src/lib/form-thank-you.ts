export const DEFAULT_THANK_YOU_BG = "#ffffff";
export const DEFAULT_THANK_YOU_TEXT = "#14261c";

export const THANK_YOU_BG_PRESETS = [
  { value: "#ffffff", label: "White" },
  { value: "#ecfdf5", label: "Mint" },
  { value: "#fffbef", label: "Cream" },
  { value: "#f0fdf4", label: "Sage" },
  { value: "#eff6ff", label: "Sky" },
  { value: "#faf5ff", label: "Lavender" },
  { value: "#fff7ed", label: "Peach" },
] as const;

export const THANK_YOU_TEXT_PRESETS = [
  { value: "#14261c", label: "Ink" },
  { value: "#1f2937", label: "Charcoal" },
  { value: "#334155", label: "Slate" },
  { value: "#14532d", label: "Forest" },
  { value: "#1e3a5f", label: "Navy" },
  { value: "#7f1d1d", label: "Burgundy" },
  { value: "#ffffff", label: "White" },
] as const;

function expandHex(color: string) {
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(color)) {
    const h = color.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
  }
  return null;
}

function normalizeThankYouColor(
  color: string | null | undefined,
  presets: ReadonlyArray<{ value: string }>,
  fallback: string
) {
  const trimmed = color?.trim();
  if (!trimmed) return fallback;
  const expanded = expandHex(trimmed);
  if (expanded) return expanded;
  const preset = presets.find(
    (item) => item.value.toLowerCase() === trimmed.toLowerCase()
  );
  return preset?.value ?? fallback;
}

export function normalizeThankYouBg(color: string | null | undefined) {
  return normalizeThankYouColor(color, THANK_YOU_BG_PRESETS, DEFAULT_THANK_YOU_BG);
}

export function normalizeThankYouText(color: string | null | undefined) {
  return normalizeThankYouColor(
    color,
    THANK_YOU_TEXT_PRESETS,
    DEFAULT_THANK_YOU_TEXT
  );
}
