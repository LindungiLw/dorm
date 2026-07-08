"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updatePhotoAction, type ProfileState } from "@/lib/domain/profile-actions";
import { Alert } from "@/components/ui";

// Load, downscale (max 256px) and JPEG-encode an image to a small data URL, so the
// avatar stays tiny (~tens of KB) and can live directly in the database.
function resizeToDataUrl(file: File, max = 256, quality = 0.85): Promise<string> {
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
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("load-failed"));
    };
    img.src = url;
  });
}

export function ProfileAvatar({
  initials,
  photoUrl,
}: {
  initials: string;
  photoUrl: string | null;
}) {
  const [state, action] = useActionState<ProfileState, FormData>(updatePhotoAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [payload, setPayload] = useState(""); // what gets submitted: data URL or "__REMOVE__"
  const [busy, setBusy] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);

  const shown = preview ?? photoUrl;

  // Submit the hidden form whenever we stage a new payload (photo or removal).
  useEffect(() => {
    if (payload) formRef.current?.requestSubmit();
  }, [payload]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setLocalErr(null);
    if (!file.type.startsWith("image/")) {
      setLocalErr("Please choose an image file.");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await resizeToDataUrl(file);
      setPreview(dataUrl);
      setPayload(dataUrl);
    } catch {
      setLocalErr("Couldn't read that image — try another.");
    } finally {
      setBusy(false);
    }
  }

  function removePhoto() {
    setPreview(null);
    setPayload("__REMOVE__");
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shown}
            alt="Profile photo"
            className="h-20 w-20 rounded-full object-cover ring-2 ring-navy-100"
          />
        ) : (
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-navy-600 text-2xl font-bold text-white">
            {initials}
          </span>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          aria-label="Change profile photo"
          title="Change profile photo"
          className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-navy-700 text-white shadow transition hover:bg-navy-800 disabled:opacity-60"
        >
          <CameraIcon />
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="font-medium text-navy-600 hover:underline disabled:opacity-60"
        >
          {busy ? "Processing…" : shown ? "Change photo" : "Add photo"}
        </button>
        {shown && (
          <button
            type="button"
            onClick={removePhoto}
            className="font-medium text-red-600 hover:underline"
          >
            Remove
          </button>
        )}
      </div>

      {(localErr || state.error) && (
        <div className="w-full max-w-xs">
          <Alert tone="error">{localErr ?? state.error}</Alert>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />
      <form ref={formRef} action={action} className="hidden">
        <input type="hidden" name="photo" value={payload} readOnly />
      </form>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
