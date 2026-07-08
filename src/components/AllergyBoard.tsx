"use client";

import { useActionState } from "react";
import {
  addAllergenAction,
  updateAllergenAction,
  deleteAllergenAction,
  type AllergyState,
} from "@/lib/domain/allergy-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";
import type { AllergenRow } from "@/lib/domain/allergy";

function AllergenTags({ allergens }: { allergens: string }) {
  const items = allergens
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((a, i) => (
        <span
          key={i}
          className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700"
        >
          {a}
        </span>
      ))}
    </div>
  );
}

function AddAllergenForm() {
  const [state, action] = useActionState<AllergyState, FormData>(addAllergenAction, {});
  return (
    <form
      action={action}
      className="rounded-xl border border-dashed border-navy-200 bg-navy-50/40 p-3"
    >
      <p className="mb-2 text-sm font-semibold text-navy-800">Add a dish</p>
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
          placeholder="Food / dish (e.g. Nasi Goreng)"
          className="input text-sm sm:flex-1"
        />
        <input
          name="allergens"
          placeholder="Allergens, comma-separated (e.g. Egg, Soy, Shellfish)"
          className="input text-sm sm:flex-1"
        />
        <SubmitButton className="btn-primary shrink-0" pendingText="Adding…">
          Add
        </SubmitButton>
      </div>
    </form>
  );
}

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
            className="input text-sm sm:flex-1"
          />
          <input
            name="allergens"
            defaultValue={entry.allergens}
            className="input text-sm sm:flex-1"
          />
          <SubmitButton className="btn-outline shrink-0 text-sm" pendingText="Saving…">
            Save
          </SubmitButton>
        </form>
        <form action={del} className="shrink-0">
          <input type="hidden" name="id" value={entry.id} />
          <SubmitButton
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
            pendingText="Removing…"
          >
            Delete
          </SubmitButton>
        </form>
      </div>
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
            {entries.length} {entries.length === 1 ? "dish" : "dishes"} listed
          </p>
          {entries.length === 0 ? (
            <p className="text-sm text-navy-400">
              No dishes yet — add the first one above.
            </p>
          ) : (
            entries.map((e) => <AllergenRowEditor key={e.id} entry={e} />)
          )}
        </div>
      </div>
    );
  }

  // Read-only view (students / faculty).
  if (entries.length === 0) {
    return (
      <p className="text-sm text-navy-400">
        No allergen information has been published yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((e) => (
        <div
          key={e.id}
          className="flex flex-col gap-1.5 rounded-xl border border-navy-50 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="font-medium text-navy-800">{e.food}</p>
          <AllergenTags allergens={e.allergens} />
        </div>
      ))}
    </div>
  );
}
