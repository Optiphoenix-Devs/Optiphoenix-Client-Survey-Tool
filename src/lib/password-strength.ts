export type PasswordStrength = "empty" | "weak" | "medium" | "strong";

export type PasswordRequirement = {
  id: "length" | "lower" | "upper" | "number" | "symbol";
  label: string;
  met: boolean;
};

export function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    {
      id: "length",
      label: "At least 8 characters",
      met: password.length >= 8,
    },
    {
      id: "lower",
      label: "One lowercase letter",
      met: /[a-z]/.test(password),
    },
    {
      id: "upper",
      label: "One uppercase letter",
      met: /[A-Z]/.test(password),
    },
    {
      id: "number",
      label: "One number",
      met: /\d/.test(password),
    },
    {
      id: "symbol",
      label: "One symbol (!@#$…)",
      met: /[^a-zA-Z0-9]/.test(password),
    },
  ];
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return "empty";

  const requirements = getPasswordRequirements(password);
  const met = requirements.filter((item) => item.met).length;
  let score = met;
  if (password.length >= 12) score += 1;

  if (met < 3 || score <= 2) return "weak";
  if (met < 5 || score <= 4) return "medium";
  return "strong";
}

/** True when every listed pattern is satisfied. */
export function isPasswordStrongEnough(password: string) {
  return getPasswordRequirements(password).every((item) => item.met);
}

export const PASSWORD_STRENGTH_LABEL: Record<
  Exclude<PasswordStrength, "empty">,
  string
> = {
  weak: "Weak",
  medium: "Medium",
  strong: "Strong",
};

export const PASSWORD_HINT =
  "Use 8+ characters with upper & lowercase letters, a number, and a symbol.";
