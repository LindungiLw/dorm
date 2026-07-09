"use client";

import { useActionState, useEffect, useState } from "react";
import {
  addAllergenAction,
  updateAllergenAction,
  deleteAllergenAction,
  type AllergyState,
} from "@/lib/domain/allergy-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";
import type { AllergenRow } from "@/lib/domain/allergy";

// ── Admin: add a food name ───────────────────────────────────────────────────────────
function AddAllergenForm() {
  const [state, action] = useActionState<AllergyState, FormData>(addAllergenAction, {});
  return (
    <form
      action={action}
      className="rounded-xl border border-dashed border-navy-200 bg-navy-50/40 p-3"
    >
      <p className="mb-2 text-sm font-semibold text-navy-800">Add a food</p>
      {state.error && (
        <div className="mb-2">
          <Alert tone="error">{state.error}</Alert>
        </div>
      )}
      {state.ok && (
        <div className="mb-2">
          <Alert tone="success">{state.ok}</Alert>
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          name="food"
          placeholder="Food name (e.g. Nasi Goreng)"
          className="input sm:flex-1"
          required
        />
        <SubmitButton
          className="btn-primary w-full sm:w-auto sm:px-8"
          pendingText="Adding…"
        >
          Add
        </SubmitButton>
      </div>
    </form>
  );
}

// ── Admin: edit / delete a food ──────────────────────────────────────────────────────
function AllergenRowEditor({ entry }: { entry: AllergenRow }) {
  const [updState, update] = useActionState<AllergyState, FormData>(
    updateAllergenAction,
    {},
  );
  const [delState, del] = useActionState<AllergyState, FormData>(
    deleteAllergenAction,
    {},
  );
  const err = updState.error || delState.error;

  return (
    <div className="rounded-xl border border-navy-100 p-3">
      {err && (
        <div className="mb-2">
          <Alert tone="error">{err}</Alert>
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <form
          action={update}
          className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center"
        >
          <input type="hidden" name="id" value={entry.id} />
          <input
            name="food"
            defaultValue={entry.food}
            className="input sm:flex-1"
            required
          />
          <SubmitButton className="btn-outline shrink-0 text-sm" pendingText="Saving…">
            Save
          </SubmitButton>
        </form>
        <form action={del} className="shrink-0">
          <input type="hidden" name="id" value={entry.id} />
          <SubmitButton
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
            pendingText="Removing…"
          >
            Delete
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}

// ── Student: mark each listed food as Safe or Avoid (saved on this device) ────────────
type Choice = "safe" | "avoid";

function StudentAllergyList({ entries }: { entries: AllergenRow[] }) {
  const [choices, setChoices] = useState<Record<string, Choice>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem("jiunity-food-choices");
      if (s) setChoices(JSON.parse(s));
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) {
      try {
        localStorage.setItem("jiunity-food-choices", JSON.stringify(choices));
      } catch {
        /* ignore */
      }
    }
  }, [choices, loaded]);

  // Tap a choice to set it; tap the same one again to clear it.
  const pick = (id: string, c: Choice) =>
    setChoices((prev) => {
      const next = { ...prev };
      if (next[id] === c) delete next[id];
      else next[id] = c;
      return next;
    });

  return (
    <div className="space-y-2">
      {entries.map((e) => {
        const choice = choices[e.id];
        return (
          <div
            key={e.id}
            className="flex flex-col gap-2 rounded-xl border border-navy-100 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <p
              className={`font-medium ${
                choice === "avoid"
                  ? "text-navy-400 line-through"
                  : "text-navy-800"
              }`}
            >
              {e.food}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => pick(e.id, "safe")}
                aria-pressed={choice === "safe"}
                className={`flex-1 rounded-lg border px-3 py-1.5 text-sm font-semibold transition sm:flex-none ${
                  choice === "safe"
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-navy-200 text-navy-600 hover:bg-navy-50"
                }`}
              >
                ✓ Safe
              </button>
              <button
                type="button"
                onClick={() => pick(e.id, "avoid")}
                aria-pressed={choice === "avoid"}
                className={`flex-1 rounded-lg border px-3 py-1.5 text-sm font-semibold transition sm:flex-none ${
                  choice === "avoid"
                    ? "border-red-600 bg-red-600 text-white"
                    : "border-navy-200 text-navy-600 hover:bg-navy-50"
                }`}
              >
                ✕ Avoid
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AllergyBoard({
  entries,
  canEdit,
}: {
  entries: AllergenRow[];
  canEdit: boolean;
}) {
  if (canEdit) {
    return (
      <div className="space-y-4">
        <AddAllergenForm />
        <div className="space-y-2">
          <p className="text-sm font-semibold text-navy-800">
            {entries.length} {entries.length === 1 ? "food" : "foods"} listed
          </p>
          {entries.length === 0 ? (
            <p className="text-sm text-navy-400">
              No foods yet. Add the first one above.
            </p>
          ) : (
            entries.map((e) => <AllergenRowEditor key={e.id} entry={e} />)
          )}
        </div>
      </div>
    );
  }

  // Student / faculty view.
  if (entries.length === 0) {
    return (
      <p className="text-sm text-navy-400">No foods have been listed yet.</p>
    );
  }
  return <StudentAllergyList entries={entries} />;
}
