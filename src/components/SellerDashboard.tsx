"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  createProductAction,
  deleteProductAction,
  type SellerState,
} from "@/lib/domain/seller-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert, Card } from "@/components/ui";
import { formatRupiah, type Product } from "@/lib/market-shared";

// Downscale a photo to a small JPEG data URL so rows stay light.
function resizeToDataUrl(file: File, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no-canvas"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("load-failed"));
    };
    img.src = url;
  });
}

function ProductForm() {
  const [state, action] = useActionState<SellerState, FormData>(
    createProductAction,
    {},
  );
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [imgErr, setImgErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const handled = useRef<SellerState | null>(null);

  // Clear the form after a product is added. Guard on the state OBJECT identity (a fresh
  // object per submission), since the "ok" text is a constant.
  useEffect(() => {
    if (state.ok && state !== handled.current) {
      handled.current = state;
      formRef.current?.reset();
      setImage(null);
    }
  }, [state]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImgErr(null);
    if (!file.type.startsWith("image/")) {
      setImgErr("Please choose an image.");
      return;
    }
    setBusy(true);
    try {
      // Catalog shows many products at once, so downscale harder than the borrow list.
      setImage(await resizeToDataUrl(file, 640));
    } catch {
      setImgErr("Couldn't read that image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} action={action} className="space-y-3">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.ok}</Alert>}

      <input type="hidden" name="imageUrl" value={image ?? ""} readOnly />

      {/* Photo */}
      <div>
        <label className="label">
          Photo <span className="font-normal text-navy-400">(optional)</span>
        </label>
        <div className="flex items-center gap-4">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt="Product preview"
              className="h-20 w-20 rounded-xl border border-navy-100 object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-navy-200 text-2xl text-navy-300">
              📦
            </div>
          )}
          <div className="flex flex-col gap-1.5 text-sm">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="btn-outline"
            >
              {busy ? "Processing…" : image ? "Change photo" : "Upload photo"}
            </button>
            {image && (
              <button
                type="button"
                onClick={() => setImage(null)}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Remove
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFile}
          />
        </div>
        {imgErr && <p className="mt-1 text-xs text-red-600">{imgErr}</p>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">
            Product name
          </label>
          <input id="name" name="name" className="input" placeholder="e.g. Study Lamp" />
        </div>
        <div>
          <label className="label" htmlFor="category">
            Category
          </label>
          <input
            id="category"
            name="category"
            className="input"
            placeholder="e.g. Makanan, Elektronik, Baju"
          />
        </div>
        <div>
          <label className="label" htmlFor="price">
            Price (Rp)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            className="input"
            placeholder="45000"
          />
        </div>
        <div>
          <label className="label" htmlFor="emoji">
            Emoji <span className="font-normal text-navy-400">(fallback)</span>
          </label>
          <input id="emoji" name="emoji" className="input" placeholder="💡" maxLength={8} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="input"
          placeholder="Short description buyers will see…"
        />
      </div>
      <SubmitButton className="btn-primary" pendingText="Adding…">
        Add product
      </SubmitButton>
    </form>
  );
}

function ProductRow({ p }: { p: Product }) {
  const [state, action] = useActionState<SellerState, FormData>(
    deleteProductAction,
    {},
  );
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-navy-50 text-xl">
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          p.emoji || "📦"
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-navy-800">{p.name}</p>
        <p className="text-xs text-navy-400">
          {p.category} · {formatRupiah(p.price)}
        </p>
        {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      </div>
      <form action={action}>
        <input type="hidden" name="productId" value={p.id} />
        <SubmitButton
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
          pendingText="…"
        >
          Delete
        </SubmitButton>
      </form>
    </li>
  );
}

export function SellerDashboard({ products }: { products: Product[] }) {
  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-3 font-semibold text-navy-800">Add a product</h2>
        <ProductForm />
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-navy-800">
          Your listings ({products.length})
        </h2>
        {products.length === 0 ? (
          <p className="py-2 text-sm text-navy-400">
            No products yet — add your first one above.
          </p>
        ) : (
          <ul className="divide-y divide-navy-50">
            {products.map((p) => (
              <ProductRow key={p.id} p={p} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
