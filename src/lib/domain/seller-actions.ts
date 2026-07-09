"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentActor } from "@/lib/auth/session";
import { can } from "@/lib/authz/policy";
import { writeAudit } from "@/lib/audit";
import { CATEGORIES } from "@/lib/market-shared";

export type SellerState = { error?: string; ok?: string };

const IMG_MAX_CHARS = 700_000; // ~520 KB base64 — enough for a scannable QRIS at 512px.
const CATEGORY_VALUES = CATEGORIES.map((c) => c.value) as [string, ...string[]];

// ---- Member: request to become a seller (personal data + QRIS) --------------------
const requestSchema = z.object({
  storeName: z.string().trim().min(2, "Enter your store name.").max(80),
  phone: z.string().trim().min(5, "Enter a contact number.").max(30),
  qrisNumber: z.string().trim().max(60).optional(),
  qrisImage: z.string().optional(),
});

export async function requestSellerAction(
  _prev: SellerState,
  formData: FormData,
): Promise<SellerState> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Your session has expired. Please sign in again." };

  const parsed = requestSchema.safeParse({
    storeName: formData.get("storeName"),
    phone: formData.get("phone"),
    qrisNumber: formData.get("qrisNumber") ?? undefined,
    qrisImage: formData.get("qrisImage") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  let qrisImage: string | null = null;
  const raw = parsed.data.qrisImage;
  if (raw && raw.startsWith("data:image/")) {
    if (raw.length > IMG_MAX_CHARS) {
      return { error: "QRIS image is too large — try a smaller one." };
    }
    qrisImage = raw;
  }

  const data = {
    storeName: parsed.data.storeName,
    phone: parsed.data.phone,
    qrisNumber: parsed.data.qrisNumber?.trim() || null,
    qrisImage,
  };

  // Upsert so a rejected member can re-apply (resets the request to PENDING).
  await prisma.sellerProfile.upsert({
    where: { memberId: actor.id },
    create: { memberId: actor.id, ...data, status: "PENDING" },
    update: {
      ...data,
      status: "PENDING",
      decidedById: null,
      decidedAt: null,
      note: null,
    },
  });

  await writeAudit(actor, "market.seller.request", "SellerProfile", actor.id, {
    storeName: data.storeName,
  });
  revalidatePath("/dashboard/market/sell");
  return { ok: "Request submitted — waiting for a market admin to approve it." };
}

// ---- Market admin: approve / reject a seller request ------------------------------
const decideSchema = z.object({
  memberId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
});

export async function decideSellerAction(
  _prev: SellerState,
  formData: FormData,
): Promise<SellerState> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Your session has expired. Please sign in again." };
  if (!can(actor, "market:manage")) {
    return { error: "Only market admins can review seller requests." };
  }

  const parsed = decideSchema.safeParse({
    memberId: formData.get("memberId"),
    decision: formData.get("decision"),
  });
  if (!parsed.success) return { error: "Invalid request." };

  // Guarded transition: only a PENDING request can be decided.
  const upd = await prisma.sellerProfile.updateMany({
    where: { memberId: parsed.data.memberId, status: "PENDING" },
    data: {
      status: parsed.data.decision,
      decidedById: actor.id,
      decidedAt: new Date(),
    },
  });
  if (upd.count !== 1) return { error: "This request was already decided." };

  await writeAudit(actor, "market.seller.decide", "SellerProfile", parsed.data.memberId, {
    decision: parsed.data.decision,
  });
  revalidatePath("/dashboard/market/admin");
  return { ok: `Request ${parsed.data.decision.toLowerCase()}.` };
}

// ---- Market admin: revoke an approved seller's access -----------------------------
const revokeSchema = z.object({ memberId: z.string().min(1) });

export async function revokeSellerAction(
  _prev: SellerState,
  formData: FormData,
): Promise<SellerState> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Your session has expired. Please sign in again." };
  if (!can(actor, "market:manage")) {
    return { error: "Only market admins can revoke seller access." };
  }

  const parsed = revokeSchema.safeParse({ memberId: formData.get("memberId") });
  if (!parsed.success) return { error: "Invalid request." };

  // Guarded transition: only an APPROVED seller can be revoked. Their listings drop out of
  // the catalog (getProducts shows approved sellers only) and they can re-apply later.
  const upd = await prisma.sellerProfile.updateMany({
    where: { memberId: parsed.data.memberId, status: "APPROVED" },
    data: {
      status: "REJECTED",
      decidedById: actor.id,
      decidedAt: new Date(),
      note: "Access revoked by admin.",
    },
  });
  if (upd.count !== 1) return { error: "This seller is not active." };

  await writeAudit(actor, "market.seller.revoke", "SellerProfile", parsed.data.memberId, {});
  revalidatePath("/dashboard/market/admin");
  revalidatePath("/dashboard/market/catalog");
  revalidatePath("/dashboard/market/sell");
  return { ok: "Seller access revoked." };
}

// ---- Seller: create / delete product listings ------------------------------------
const productSchema = z.object({
  name: z.string().trim().min(2, "Enter a product name.").max(80),
  category: z.enum(CATEGORY_VALUES),
  price: z.coerce.number().int("Price must be a whole number.").min(0).max(1_000_000_000),
  description: z.string().trim().min(3, "Add a short description.").max(500),
  emoji: z.string().trim().max(8).optional(),
});

async function requireApprovedSeller(memberId: string): Promise<boolean> {
  const s = await prisma.sellerProfile.findUnique({
    where: { memberId },
    select: { status: true },
  });
  return s?.status === "APPROVED";
}

export async function createProductAction(
  _prev: SellerState,
  formData: FormData,
): Promise<SellerState> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Your session has expired. Please sign in again." };
  if (!(await requireApprovedSeller(actor.id))) {
    return { error: "Only approved sellers can add products." };
  }

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    price: formData.get("price"),
    description: formData.get("description"),
    emoji: formData.get("emoji") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  await prisma.product.create({
    data: {
      name: parsed.data.name,
      category: parsed.data.category,
      price: parsed.data.price,
      description: parsed.data.description,
      emoji: parsed.data.emoji || null,
      sellerId: actor.id,
    },
  });

  await writeAudit(actor, "market.product.create", "Product", actor.id, {
    name: parsed.data.name,
  });
  revalidatePath("/dashboard/market/sell");
  revalidatePath("/dashboard/market/catalog");
  return { ok: `"${parsed.data.name}" is now live in the catalog.` };
}

export async function deleteProductAction(
  _prev: SellerState,
  formData: FormData,
): Promise<SellerState> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Your session has expired. Please sign in again." };

  const id = String(formData.get("productId") ?? "");
  if (!id) return { error: "Missing product." };

  // Ownership enforced in the query: a seller can only delete their own listing.
  await prisma.product.deleteMany({ where: { id, sellerId: actor.id } });

  revalidatePath("/dashboard/market/sell");
  revalidatePath("/dashboard/market/catalog");
  return { ok: "Product removed." };
}
