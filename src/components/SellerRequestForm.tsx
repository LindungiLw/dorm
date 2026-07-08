"use client";

import { useActionState, useRef, useState } from "react";
import { requestSellerAction, type SellerState } from "@/lib/domain/seller-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";

// Downscale a QRIS image to a scannable-but-small PNG data URL (kept lossless so the
// QR code stays readable).
function resizeQrToDataUrl(file: File, max = 512): Promise<string> {
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
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("load-failed"));
    };
    img.src = url;
  });
}

export function SellerRequestForm({
  defaults,
}: {
  defaults?: {
    storeName?: string;
    phone?: string;
    qrisNumber?: string;
    qrisImage?: string | null;
  };
}) {
  const [state, action] = useActionState<SellerState, FormData>(
    requestSellerAction,
    {},
  );
  const [qris, setQris] = useState<string | null>(defaults?.qrisImage ?? null);
  const [busy, setBusy] = useState(false);
  const [imgErr, setImgErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
      setQris(await resizeQrToDataUrl(file));
    } catch {
      setImgErr("Couldn't read that image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form action={action} className="max-w-lg space-y-4">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.ok}</Alert>}

      <input type="hidden" name="qrisImage" value={qris ?? ""} readOnly />

      <div>
        <label className="label" htmlFor="storeName">
          Store name
        </label>
        <input
          id="storeName"
          name="storeName"
          className="input"
          defaultValue={defaults?.storeName ?? ""}
          placeholder="e.g. Andi's Corner"
        />
      </div>

      <div>
        <label className="label" htmlFor="phone">
          WhatsApp / contact number
        </label>
        <input
          id="phone"
          name="phone"
          className="input"
          defaultValue={defaults?.phone ?? ""}
          placeholder="e.g. 08123456789"
        />
      </div>

      <div>
        <label className="label" htmlFor="qrisNumber">
          QRIS number / merchant ID{" "}
          <span className="font-normal text-navy-400">(optional)</span>
        </label>
        <input
          id="qrisNumber"
          name="qrisNumber"
          className="input"
          defaultValue={defaults?.qrisNumber ?? ""}
          placeholder="e.g. ID1020xxxxxxxx"
        />
      </div>

      <div>
        <label className="label">
          QRIS QR image{" "}
          <span className="font-normal text-navy-400">
            (buyers scan this to pay you)
          </span>
        </label>
        <div className="flex items-center gap-4">
          {qris ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qris}
              alt="QRIS preview"
              className="h-24 w-24 rounded-lg border border-navy-100 object-contain"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-navy-200 text-2xl text-navy-300">
              QR
            </div>
          )}
          <div className="flex flex-col gap-1.5 text-sm">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="btn-outline"
            >
              {busy ? "Processing…" : qris ? "Change image" : "Upload QRIS"}
            </button>
            {qris && (
              <button
                type="button"
                onClick={() => setQris(null)}
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

      <SubmitButton className="btn-primary" pendingText="Submitting…">
        Submit request
      </SubmitButton>
    </form>
  );
}
