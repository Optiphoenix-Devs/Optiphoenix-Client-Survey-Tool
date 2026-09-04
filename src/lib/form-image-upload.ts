import { mkdir, writeFile } from "fs/promises";
import path from "path";

export type FormImageFolder = "form-headers" | "form-thank-you";

export async function saveFormImageUpload(
  formId: string,
  file: File,
  folder: FormImageFolder
): Promise<{ url: string } | { error: string }> {
  const maxBytes = 3 * 1024 * 1024;
  const name = file.name.toLowerCase();
  const allowedType =
    file.type === "image/png" ||
    file.type === "image/jpeg" ||
    file.type === "image/jpg" ||
    file.type === "image/webp";
  const allowedExt =
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".webp");
  if (!allowedType || !allowedExt) {
    return { error: "Image must be PNG, JPG, or WebP." };
  }
  if (file.size > maxBytes) {
    return { error: "Image must be 3 MB or smaller." };
  }

  const ext = name.endsWith(".png")
    ? "png"
    : name.endsWith(".webp")
      ? "webp"
      : "jpg";
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const filename = `${formId}.${ext}`;
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  return { url: `/uploads/${folder}/${filename}?v=${Date.now()}` };
}
