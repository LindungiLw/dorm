"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  saveBorrowItemAction,
  deleteBorrowItemAction,
  type BorrowState,
} from "@/lib/domain/borrow-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert, Card } from "@/components/ui";
import { type BorrowItemRow, type BorrowPart } from "@/lib/domain/borrow-types";

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

export function BorrowManager({ items }: { items: BorrowItemRow[] }) {
  const [editing, setEditing] = useState<BorrowItemRow | null>(null);
  const formTop = useRef<HTMLDivElement>(null);

  function startEdit(it: BorrowItemRow) {
    setEditing(it);
    formTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-6">
      <div ref={formTop}>
        <Card>
          <h2 className="mb-3 font-semibold text-navy-800">
            {editing ? "Edit item" : "Add a new item"}
          </h2>
          <BorrowItemForm
            key={editing?.id ?? "new"}
            item={editing}
            onDone={() => setEditing(null)}
          />
        </Card>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-navy-800">
          Items ({items.length})
        </p>
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-navy-200 p-6 text-center text-sm text-navy-400">
            No items yet. Add your first one above.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <ItemRow
                key={it.id}
                it={it}
                active={editing?.id === it.id}
                onEdit={() => startEdit(it)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function BorrowItemForm({
  item,
  onDone,
}: {
  item: BorrowItemRow | null;
  onDone: () => void;
}) {
  const [state, action] = useActionState<BorrowState, FormData>(
    saveBorrowItemAction,
    {},
  );
  const isEdit = !!item;

  const [name, setName] = useState(item?.name ?? "");
  const [category, setCategory] = useState(item?.category ?? "");
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 1));
  const [location, setLocation] = useState(item?.location ?? "");
  const [schedule, setSchedule] = useState(item?.schedule ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [image, setImage] = useState<string | null>(item?.imageUrl ?? null);
  const [parts, setParts] = useState<BorrowPart[]>(item?.parts ?? []);
  const [busy, setBusy] = useState(false);
  const [imgErr, setImgErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const handled = useRef<BorrowState | null>(null);

  // On a successful save: clear a new-item form, or leave edit mode. Guard on the state
  // OBJECT identity (a fresh object per submission), because the "ok" text is a constant —
  // a string guard would only fire on the very first add.
  useEffect(() => {
    if (state.ok && state !== handled.current) {
      handled.current = state;
      if (isEdit) {
        onDone();
      } else {
        setName("");
        setCategory("");
        setQuantity("1");
        setLocation("");
        setSchedule("");
        setDescription("");
        setImage(null);
        setParts([]);
      }
    }
  }, [state, isEdit, onDone]);

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
      setImage(await resizeToDataUrl(file));
    } catch {
      setImgErr("Couldn't read that image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.ok}</Alert>}

      {isEdit && <input type="hidden" name="id" value={item!.id} readOnly />}
      <input type="hidden" name="imageUrl" value={image ?? ""} readOnly />
      <input type="hidden" name="parts" value={JSON.stringify(parts)} readOnly />

      {/* Photo */}
      <div>
        <label className="label">Photo</label>
        <div className="flex items-center gap-4">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt="Item preview"
              className="h-24 w-24 rounded-xl border border-navy-100 object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-navy-200 text-3xl text-navy-300">
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

      {/* Name + category */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="bi-name">
            Item name
          </label>
          <input
            id="bi-name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input text-base sm:text-sm"
            placeholder="e.g. Badminton Set"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="bi-category">
            Category
          </label>
          <input
            id="bi-category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input text-base sm:text-sm"
            placeholder="e.g. Ruang Belajar, Alat Olahraga"
            required
          />
        </div>
      </div>

      {/* Quantity + location + schedule */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="bi-qty">
            How many available
          </label>
          <input
            id="bi-qty"
            name="quantity"
            type="number"
            min={0}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="input text-base sm:text-sm"
            required
          />
          <p className="mt-1 text-xs text-navy-400">
            0 shows as unavailable, 1 to 2 as limited.
          </p>
        </div>
        <div>
          <label className="label" htmlFor="bi-loc">
            Location
          </label>
          <input
            id="bi-loc"
            name="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="input text-base sm:text-sm"
            placeholder="e.g. Sports Hall"
          />
        </div>
        <div>
          <label className="label" htmlFor="bi-sched">
            Schedule
          </label>
          <input
            id="bi-sched"
            name="schedule"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            className="input text-base sm:text-sm"
            placeholder="e.g. Daily, 06:00 to 22:00"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="label" htmlFor="bi-desc">
          Description
        </label>
        <textarea
          id="bi-desc"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="input text-base sm:text-sm"
          placeholder="What it is, condition, any rules…"
        />
      </div>

      {/* Parts inside */}
      <PartsEditor parts={parts} onChange={setParts} />

      <div className="flex flex-wrap gap-2 pt-1">
        <SubmitButton
          className="btn-primary w-full sm:w-auto sm:px-8"
          pendingText="Saving…"
        >
          {isEdit ? "Save changes" : "Add item"}
        </SubmitButton>
        {isEdit && (
          <button
            type="button"
            onClick={onDone}
            className="btn-outline w-full sm:w-auto"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

// The list of parts that make up a set (e.g. rackets + shuttlecocks in a badminton set).
function PartsEditor({
  parts,
  onChange,
}: {
  parts: BorrowPart[];
  onChange: (p: BorrowPart[]) => void;
}) {
  function update(i: number, patch: Partial<BorrowPart>) {
    onChange(parts.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  return (
    <div className="rounded-xl border border-navy-100 p-3">
      <div className="mb-2 flex items-center justify-between">
        <label className="label mb-0">Parts inside</label>
        <button
          type="button"
          onClick={() => onChange([...parts, { name: "", qty: 1 }])}
          className="text-sm font-medium text-navy-600 hover:underline"
        >
          + Add part
        </button>
      </div>
      {parts.length === 0 ? (
        <p className="text-xs text-navy-400">
          Optional. List what is inside a set, e.g. Racket · 4, Shuttlecock · 6.
        </p>
      ) : (
        <ul className="space-y-2">
          {parts.map((p, i) => (
            <li key={i} className="flex items-center gap-2">
              <input
                value={p.name}
                onChange={(e) => update(i, { name: e.target.value })}
                className="input text-base sm:text-sm"
                placeholder="Part name"
              />
              <input
                type="number"
                min={0}
                value={String(p.qty)}
                onChange={(e) => update(i, { qty: Number(e.target.value) || 0 })}
                className="input w-20 text-base sm:text-sm"
                placeholder="Qty"
                aria-label="Quantity"
              />
              <button
                type="button"
                onClick={() => onChange(parts.filter((_, idx) => idx !== i))}
                aria-label="Remove part"
                className="shrink-0 rounded-lg border border-navy-200 px-2.5 py-2 text-navy-500 hover:bg-navy-50"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ItemRow({
  it,
  active,
  onEdit,
}: {
  it: BorrowItemRow;
  active: boolean;
  onEdit: () => void;
}) {
  const [state, del] = useActionState<BorrowState, FormData>(
    deleteBorrowItemAction,
    {},
  );
  const [confirming, setConfirming] = useState(false);
  return (
    <li
      className={`flex items-center gap-3 rounded-xl border p-2.5 ${
        active ? "border-navy-400 bg-navy-50/40" : "border-navy-100"
      }`}
    >
      {it.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={it.imageUrl}
          alt=""
          className="h-12 w-12 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-2xl">
          {it.emoji ?? "📦"}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-navy-800">{it.name}</p>
        <p className="truncate text-xs text-navy-400">
          {it.category} · {it.quantity} available
          {it.parts.length > 0 ? ` · ${it.parts.length} parts` : ""}
        </p>
        {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 rounded-lg border border-navy-200 px-3 py-1.5 text-sm font-medium text-navy-700 hover:bg-navy-50"
      >
        Edit
      </button>
      <form
        action={del}
        className="shrink-0"
        onSubmit={(e) => {
          // First tap arms the confirm; the second tap actually deletes.
          if (!confirming) {
            e.preventDefault();
            setConfirming(true);
          }
        }}
      >
        <input type="hidden" name="id" value={it.id} readOnly />
        <SubmitButton
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
            confirming
              ? "border-red-600 bg-red-600 text-white hover:bg-red-700"
              : "border-red-200 text-red-600 hover:bg-red-50"
          }`}
          pendingText="…"
        >
          {confirming ? "Confirm?" : "Delete"}
        </SubmitButton>
      </form>
    </li>
  );
}
