"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentActor } from "@/lib/auth/session";
import { can } from "@/lib/authz/policy";
import { writeAudit } from "@/lib/audit";

export type BorrowState = { error?: string; ok?: string };

const partSchema = z.object({
  name: z.string().trim().min(1).max(80),
  qty: z.coerce.number().int().min(0).max(100_000),
});

const saveSchema = z.object({
  id: z.string().trim().optional(),
  name: z.string().trim().min(2, "Enter an item name.").max(120),
  // The admin writes their own category (free text) — no fixed list.
  category: z.string().trim().min(1, "Enter a category.").max(40),
  imageUrl: z.string().trim().optional(),
  emoji: z.string().trim().max(8).optional(),
  location: z.string().trim().max(160).optional(),
  schedule: z.string().trim().max(160).optional(),
  quantity: z.coerce.number().int().min(0).max(100_000),
  description: z.string().trim().max(1200).optional(),
  parts: z.array(partSchema).max(50).optional(),
});

// A data-URL photo is stored inline, so cap it to keep rows small.
const MAX_IMAGE_CHARS = 900_000;

function revalidate() {
  revalidatePath("/dashboard/permission/borrow");
  revalidatePath("/dashboard/permission/borrow/manage");
}

// Create or update a borrow item. Only the permission (dorm) admin may do this.
export async function saveBorrowItemAction(
  _prev: BorrowState,
  formData: FormData,
): Promise<BorrowState> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Your session has expired. Please sign in again." };
  if (!can(actor, "borrow:manage")) {
    return { error: "Only the permission admin can manage borrow items." };
  }

  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  if (imageUrl && !imageUrl.startsWith("data:image/")) {
    return { error: "The photo must be an image." };
  }
  if (imageUrl.length > MAX_IMAGE_CHARS) {
    return { error: "That photo is too large. Please use a smaller image." };
  }

  let parts: unknown = [];
  try {
    const raw = formData.get("parts");
    if (raw) parts = JSON.parse(String(raw));
  } catch {
    parts = [];
  }
  // Drop blank rows (the editor seeds empty ones) BEFORE validation so an abandoned part
  // row never blocks the whole save with a cryptic parts error.
  const partsInput = Array.isArray(parts)
    ? parts.filter((p) => String((p as { name?: unknown })?.name ?? "").trim())
    : [];

  const parsed = saveSchema.safeParse({
    id: formData.get("id")?.toString() || undefined,
    name: String(formData.get("name") ?? ""),
    category: String(formData.get("category") ?? ""),
    imageUrl: imageUrl || undefined,
    emoji: formData.get("emoji")?.toString() || undefined,
    location: formData.get("location")?.toString() || undefined,
    schedule: formData.get("schedule")?.toString() || undefined,
    quantity: formData.get("quantity") ?? 0,
    description: formData.get("description")?.toString() || undefined,
    parts: partsInput,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const d = parsed.data;

  const cleanParts = (d.parts ?? []).filter((p) => p.name.trim());
  const data = {
    name: d.name,
    category: d.category,
    imageUrl: d.imageUrl ?? null,
    emoji: d.emoji ?? null,
    location: d.location ?? "",
    schedule: d.schedule ?? "",
    quantity: d.quantity,
    description: d.description ?? "",
    parts: cleanParts.length ? JSON.stringify(cleanParts) : null,
  };

  let savedId: string;
  if (d.id) {
    const upd = await prisma.borrowItem.updateMany({ where: { id: d.id }, data });
    if (upd.count !== 1) return { error: "That item no longer exists." };
    savedId = d.id;
  } else {
    const created = await prisma.borrowItem.create({ data });
    savedId = created.id;
  }

  await writeAudit(
    actor,
    d.id ? "borrow.item.update" : "borrow.item.create",
    "BorrowItem",
    savedId,
    { name: d.name },
  );
  revalidate();
  return { ok: d.id ? "Item updated." : "Item added." };
}

export async function deleteBorrowItemAction(
  _prev: BorrowState,
  formData: FormData,
): Promise<BorrowState> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Your session has expired. Please sign in again." };
  if (!can(actor, "borrow:manage")) {
    return { error: "Only the permission admin can manage borrow items." };
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing item id." };

  await prisma.borrowItem.deleteMany({ where: { id } });
  await writeAudit(actor, "borrow.item.delete", "BorrowItem", id, {});
  revalidate();
  return { ok: "Item deleted." };
}
