"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { PlusIcon } from "lucide-react";

import { api } from "@_scaffold/backend/convex/_generated/api";
import { Button } from "@_scaffold/ui/components/button";
import { Input } from "@_scaffold/ui/components/input";
import { Label } from "@_scaffold/ui/components/label";
import { toast } from "sonner";

type SupplierOption = {
  _id: string;
  name: string;
  averageLeadDays: number;
  fillRate: number;
};

type SuppliersResult = readonly SupplierOption[] | undefined;

type ProductFormState = {
  sku: string;
  name: string;
  category: string;
  supplierId: string;
  unitCost: string;
  unitPrice: string;
  onHand: string;
  reorderPoint: string;
  leadDays: string;
  weeklyVelocity: string;
  shelfZone: string;
};

type SupplierFormState = {
  name: string;
  category: string;
  contactEmail: string;
  averageLeadDays: string;
  reliabilityScore: string;
  nextDelivery: string;
  fillRate: string;
  notes: string;
};

function Dialog({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-[0_30px_60px_-20px_rgba(0,0,0,0.4)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <button
            aria-label="Close"
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const emptyProduct: ProductFormState = {
  sku: "",
  name: "",
  category: "",
  supplierId: "",
  unitCost: "",
  unitPrice: "",
  onHand: "0",
  reorderPoint: "0",
  leadDays: "3",
  weeklyVelocity: "0",
  shelfZone: "",
};

const emptySupplier: SupplierFormState = {
  name: "",
  category: "",
  contactEmail: "",
  averageLeadDays: "3",
  reliabilityScore: "90",
  nextDelivery: "",
  fillRate: "95",
  notes: "",
};

export function NewProductButton({ canCreate }: { canCreate: boolean }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProductFormState>(emptyProduct);
  const [pending, setPending] = useState(false);
  const createProduct = useMutation(api.dashboard.createProduct);
  const suppliers = useQuery(api.dashboard.supplierList, canCreate ? {} : "skip") as SuppliersResult;

  if (!canCreate) return null;

  const updateField = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSupplierChange = (supplierId: string) => {
    setForm((current) => {
      const supplier = suppliers?.find((s) => s._id === supplierId);
      return {
        ...current,
        supplierId,
        leadDays: supplier ? String(supplier.averageLeadDays) : current.leadDays,
      };
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    if (!form.supplierId) {
      toast.error("Pick a supplier first");
      return;
    }
    setPending(true);
    createProduct({
      sku: form.sku,
      name: form.name,
      category: form.category,
      supplierId: form.supplierId as never,
      unitCost: Number(form.unitCost) || 0,
      unitPrice: Number(form.unitPrice) || 0,
      onHand: Number(form.onHand) || 0,
      reorderPoint: Number(form.reorderPoint) || 0,
      leadDays: Number(form.leadDays) || 0,
      weeklyVelocity: Number(form.weeklyVelocity) || 0,
      shelfZone: form.shelfZone,
    })
      .then(() => {
        toast.success("Product added to catalog");
        setForm(emptyProduct);
        setOpen(false);
      })
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Failed to add product")
      )
      .finally(() => setPending(false));
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <PlusIcon className="size-3.5" data-icon="inline-start" />
        New product
      </Button>
      <Dialog
        description="Add a SKU to the catalog. Required for sales and restocks."
        onClose={() => setOpen(false)}
        open={open}
        title="New product"
      >
        <form className="flex flex-col" onSubmit={handleSubmit}>
          <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-sku">SKU</Label>
              <Input
                id="product-sku"
                onChange={(event) => updateField("sku", event.target.value.toUpperCase())}
                placeholder="e.g. IP13P-256"
                required
                value={form.sku}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-name">Name</Label>
              <Input
                id="product-name"
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="e.g. iPhone 13 Pro 256GB"
                required
                value={form.name}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-category">Category</Label>
              <Input
                id="product-category"
                onChange={(event) => updateField("category", event.target.value)}
                placeholder="e.g. Phones"
                required
                value={form.category}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-supplier">Supplier</Label>
              <select
                id="product-supplier"
                className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                onChange={(event) => handleSupplierChange(event.target.value)}
                required
                value={form.supplierId}
              >
                <option value="">Choose a supplier</option>
                {suppliers?.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              {suppliers && suppliers.length === 0 ? (
                <span className="text-[11px] text-muted-foreground">
                  Add a supplier first.
                </span>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-cost">Unit cost (GHS)</Label>
              <Input
                id="product-cost"
                inputMode="decimal"
                min="0"
                onChange={(event) => updateField("unitCost", event.target.value)}
                required
                step="0.01"
                type="number"
                value={form.unitCost}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-price">Unit price (GHS)</Label>
              <Input
                id="product-price"
                inputMode="decimal"
                min="0"
                onChange={(event) => updateField("unitPrice", event.target.value)}
                required
                step="0.01"
                type="number"
                value={form.unitPrice}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-onhand">On hand</Label>
              <Input
                id="product-onhand"
                min="0"
                onChange={(event) => updateField("onHand", event.target.value)}
                required
                type="number"
                value={form.onHand}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-reorder">Reorder point</Label>
              <Input
                id="product-reorder"
                min="0"
                onChange={(event) => updateField("reorderPoint", event.target.value)}
                required
                type="number"
                value={form.reorderPoint}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-lead">Lead days</Label>
              <Input
                id="product-lead"
                min="0"
                onChange={(event) => updateField("leadDays", event.target.value)}
                required
                step="0.5"
                type="number"
                value={form.leadDays}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-velocity">Weekly velocity</Label>
              <Input
                id="product-velocity"
                min="0"
                onChange={(event) => updateField("weeklyVelocity", event.target.value)}
                required
                step="0.1"
                type="number"
                value={form.weeklyVelocity}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="product-shelf">Shelf zone</Label>
              <Input
                id="product-shelf"
                onChange={(event) => updateField("shelfZone", event.target.value)}
                placeholder="e.g. A-12"
                value={form.shelfZone}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3">
            <Button
              onClick={() => setOpen(false)}
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button disabled={pending} type="submit">
              {pending ? "Adding…" : "Add product"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

export function NewSupplierButton({ canCreate }: { canCreate: boolean }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SupplierFormState>(emptySupplier);
  const [pending, setPending] = useState(false);
  const createSupplier = useMutation(api.dashboard.createSupplier);

  if (!canCreate) return null;

  const updateField = <K extends keyof SupplierFormState>(key: K, value: SupplierFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    createSupplier({
      name: form.name,
      category: form.category,
      contactEmail: form.contactEmail,
      averageLeadDays: Number(form.averageLeadDays) || 0,
      reliabilityScore: Number(form.reliabilityScore) || 0,
      nextDelivery: form.nextDelivery,
      fillRate: Number(form.fillRate) || 0,
      notes: form.notes || undefined,
    })
      .then(() => {
        toast.success("Supplier added");
        setForm(emptySupplier);
        setOpen(false);
      })
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Failed to add supplier")
      )
      .finally(() => setPending(false));
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <PlusIcon className="size-3.5" data-icon="inline-start" />
        New supplier
      </Button>
      <Dialog
        description="Add a supplier to the network. Used when creating products and POs."
        onClose={() => setOpen(false)}
        open={open}
        title="New supplier"
      >
        <form className="flex flex-col" onSubmit={handleSubmit}>
          <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="supplier-name">Name</Label>
              <Input
                id="supplier-name"
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="e.g. Accra Mobile Distribution"
                required
                value={form.name}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="supplier-category">Category</Label>
              <Input
                id="supplier-category"
                onChange={(event) => updateField("category", event.target.value)}
                placeholder="e.g. Phones"
                required
                value={form.category}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="supplier-email">Contact email</Label>
              <Input
                id="supplier-email"
                onChange={(event) => updateField("contactEmail", event.target.value)}
                placeholder="orders@supplier.example"
                required
                type="email"
                value={form.contactEmail}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="supplier-lead">Average lead days</Label>
              <Input
                id="supplier-lead"
                min="0"
                onChange={(event) => updateField("averageLeadDays", event.target.value)}
                required
                step="0.5"
                type="number"
                value={form.averageLeadDays}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="supplier-reliability">Reliability (%)</Label>
              <Input
                id="supplier-reliability"
                max="100"
                min="0"
                onChange={(event) => updateField("reliabilityScore", event.target.value)}
                required
                type="number"
                value={form.reliabilityScore}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="supplier-fill">Fill rate (%)</Label>
              <Input
                id="supplier-fill"
                max="100"
                min="0"
                onChange={(event) => updateField("fillRate", event.target.value)}
                required
                type="number"
                value={form.fillRate}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="supplier-next">Next delivery</Label>
              <Input
                id="supplier-next"
                onChange={(event) => updateField("nextDelivery", event.target.value)}
                required
                type="date"
                value={form.nextDelivery}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="supplier-notes">Notes (optional)</Label>
              <Input
                id="supplier-notes"
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="e.g. payment terms, preferred contact"
                value={form.notes}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3">
            <Button
              onClick={() => setOpen(false)}
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button disabled={pending} type="submit">
              {pending ? "Adding…" : "Add supplier"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
