export const DEFAULT_THANK_YOU_BG = "#ffffff";

export const THANK_YOU_BG_PRESETS = [
  { value: "#ffffff", label: "White" },
  { value: "#ecfdf5", label: "Mint" },
  { value: "#fffbef", label: "Cream" },
  { value: "#f0fdf4", label: "Sage" },
  { value: "#eff6ff", label: "Sky" },
  { value: "#faf5ff", label: "Lavender" },
  { value: "#fff7ed", label: "Peach" },
] as const;

function expandHex(color: string) {
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(color)) {
    const h = color.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
  }
  return null;
}

export function normalizeThankYouBg(color: string | null | undefined) {
  const trimmed = color?.trim();
  if (!trimmed) return DEFAULT_THANK_YOU_BG;
  const expanded = expandHex(trimmed);
  if (expanded) return expanded;
  const preset = THANK_YOU_BG_PRESETS.find(
    (item) => item.value.toLowerCase() === trimmed.toLowerCase()
  );
  return preset?.value ?? DEFAULT_THANK_YOU_BG;
}
