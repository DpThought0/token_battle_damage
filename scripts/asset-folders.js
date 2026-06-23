import { DEFAULT_BATTLE_DAMAGE_DIRECTORY, SETTINGS } from "./constants.js";
import { getSetting } from "./settings.js";

export const FILE_PICKER_SOURCE = "data";

export function getBattleDamageRootDirectory() {
  const configured = String(getSetting(SETTINGS.DEFAULT_IMAGE_DIRECTORY) ?? "").trim();
  return normalizeDirectoryPath(configured || DEFAULT_BATTLE_DAMAGE_DIRECTORY);
}

export function getActorImageDirectory(actor) {
  const root = getBattleDamageRootDirectory();
  return `${root}/${slugifyActorFolder(actor?.name, actor?.id)}`;
}

export async function ensureActorImageDirectory(actor) {
  const root = getBattleDamageRootDirectory();
  const actorDirectory = getActorImageDirectory(actor);

  await ensureFoundryDirectory(root);
  await ensureFoundryDirectory(actorDirectory);

  return actorDirectory;
}

export async function uploadActorImageFiles(actor, files) {
  const directory = await ensureActorImageDirectory(actor);
  const uploaded = [];

  for (const file of Array.from(files ?? [])) {
    if (!file?.type?.startsWith("image/")) continue;
    const response = await FilePicker.upload(FILE_PICKER_SOURCE, directory, file, {}, { notify: false });
    uploaded.push(getUploadedPath(response, directory, file));
  }

  return uploaded;
}

export async function ensureFoundryDirectory(path) {
  const normalized = normalizeDirectoryPath(path);
  if (!normalized) return "";

  try {
    await FilePicker.browse(FILE_PICKER_SOURCE, normalized);
    return normalized;
  } catch (_browseError) {
    // Fall through and try to create the missing directory.
  }

  try {
    await FilePicker.createDirectory(FILE_PICKER_SOURCE, normalized, {});
    return normalized;
  } catch (createError) {
    try {
      await FilePicker.browse(FILE_PICKER_SOURCE, normalized);
      return normalized;
    } catch (_secondBrowseError) {
      throw createError;
    }
  }
}

export function normalizeDirectoryPath(path) {
  return String(path ?? "")
    .replaceAll("\\", "/")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("/");
}

export function slugifyActorFolder(name, fallback = "actor") {
  const slug = String(name ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");

  return slug || String(fallback ?? "actor").replace(/[^a-zA-Z0-9._-]+/g, "-") || "actor";
}

export function getUploadedPath(response, directory, file) {
  return response?.path ?? response?.file ?? `${normalizeDirectoryPath(directory)}/${file.name}`;
}
