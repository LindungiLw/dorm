"use client";

import { useActionState } from "react";
import {
  createProductAction,
  deleteProductAction,
  type SellerState,
} from "@/lib/domain/seller-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert, Card } from "@/components/ui";
import { CATEGORIES, CATEGORY_LABEL, formatRupiah, type Product } from "@/lib/market-shared";

function ProductForm() {
  const [state, action] = useActionState<SellerState, FormData>(
    createProductAction,
    {},
  );
  return (
    <form action={action} className="space-y-3">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.ok}</Alert>}

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
          <select id="category" name="category" className="input" defaultValue="ELECTRONICS">
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
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
            Emoji <span className="font-normal text-navy-400">(optional)</span>
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
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50 text-xl">
        {p.emoji || "📦"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-navy-800">{p.name}</p>
        <p className="text-xs text-navy-400">
          {CATEGORY_LABEL[p.category] ?? p.category} · {formatRupiah(p.price)}
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
