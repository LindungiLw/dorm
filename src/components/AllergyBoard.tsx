"use client";

import { useActionState, useState, useTransition } from "react";
import {
  addAllergenAction,
  updateAllergenAction,
  deleteAllergenAction,
  saveFoodChoicesAction,
  type AllergyState,
} from "@/lib/domain/allergy-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";
import type { AllergenRow, FoodChoice, FoodChoiceMap } from "@/lib/domain/allergy";

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

// ── Student: mark each listed food as Safe or Avoid (saved to their account) ──────────
function sameChoices(a: FoodChoiceMap, b: FoodChoiceMap): boolean {
  const ak = Object.keys(a);
  if (ak.length !== Object.keys(b).length) return false;
  return ak.every((k) => a[k] === b[k]);
}

function StudentAllergyList({
  entries,
  initialChoices,
}: {
  entries: AllergenRow[];
  initialChoices: FoodChoiceMap;
}) {
  const [choices, setChoices] = useState<FoodChoiceMap>(initialChoices);
  // What's currently persisted on the server — the baseline for "unsaved changes".
  const [saved, setSaved] = useState<FoodChoiceMap>(initialChoices);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<AllergyState>({});

  const dirty = !sameChoices(choices, saved);
  // Count only foods still on the list, so a stale choice for a removed food never shows.
  const avoidCount = entries.filter((e) => choices[e.id] === "avoid").length;

  // Tap a choice to set it; tap the same one again to clear it.
  const pick = (id: string, c: FoodChoice) => {
    setResult({});
    setChoices((prev) => {
      const next = { ...prev };
      if (next[id] === c) delete next[id];
      else next[id] = c;
      return next;
    });
  };

  const save = () => {
    setResult({});
    startTransition(async () => {
      const res = await saveFoodChoicesAction(JSON.stringify(choices));
      setResult(res);
      if (res.ok) setSaved(choices);
    });
  };

  return (
    <div className="space-y-4">
      {/* Summary + feedback */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
          Avoiding {avoidCount} {avoidCount === 1 ? "food" : "foods"}
        </span>
        <span className="text-xs text-navy-400">
          Tap Safe or Avoid, then save.
        </span>
      </div>

      <div className="space-y-2">
        {entries.map((e) => {
          const choice = choices[e.id];
          return (
            <div
              key={e.id}
              className={`flex flex-col gap-2 rounded-xl border p-3 transition sm:flex-row sm:items-center sm:justify-between ${
                choice === "avoid"
                  ? "border-red-200 bg-red-50/40"
                  : choice === "safe"
                    ? "border-emerald-200 bg-emerald-50/40"
                    : "border-navy-100"
              }`}
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

      {/* Save bar */}
      <div className="flex flex-col gap-2 border-t border-navy-50 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-navy-400" aria-live="polite">
          {result.error ? (
            <span className="text-red-600">{result.error}</span>
          ) : result.ok ? (
            <span className="text-emerald-600">✓ {result.ok}</span>
          ) : dirty ? (
            "You have unsaved changes."
          ) : (
            "All changes saved."
          )}
        </p>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || pending}
          className="btn-primary w-full sm:w-auto sm:px-8 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save my choices"}
        </button>
      </div>
    </div>
  );
}

export function AllergyBoard({
  entries,
  canEdit,
  initialChoices,
}: {
  entries: AllergenRow[];
  canEdit: boolean;
  initialChoices: FoodChoiceMap;
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
  return <StudentAllergyList entries={entries} initialChoices={initialChoices} />;
}
