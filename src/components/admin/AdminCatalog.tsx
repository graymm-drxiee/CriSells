import { useState, useMemo, useRef, useEffect, type ReactNode } from "react";
import { Plus, Pencil, Trash2, AlertTriangle, X, Package, Upload } from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Modal,
  AdminSearch,
  FilterPill,
  AdminFilterSelect,
  AdminFormSelect,
  FormSection,
} from "./ui";
import { categoryOptions, formatMoney, type AdminProduct, type ProductVariant } from "./adminData";
import { api } from "../../api";
import AnimatedContent from "../React Bits Components/animation/AnimatedContent";

interface FormErrors {
  name?: string;
  sku?: string;
  pricePerDay?: string;
  stock?: string;
  imageAlt?: string;
}

export function AdminCatalog() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const load = () => {
    api<AdminProduct[]>("/api/admin/products")
      .then(setProducts)
      .catch((err) => setLoadError(err.message));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.brand.toLowerCase().includes(search.toLowerCase());
      const matchesCat = categoryFilter === "All" || p.category === categoryFilter;
      const matchesStock =
        stockFilter === "All" ||
        (stockFilter === "low" && p.stock > 0 && p.stock <= p.lowStockThreshold) ||
        (stockFilter === "out" && p.stock === 0);
      return matchesSearch && matchesCat && matchesStock;
    });
  }, [products, search, categoryFilter, stockFilter]);

  const openAdd = () => {
    setEditingProduct(null);
    setErrors({});
    setModalOpen(true);
  };

  const clearError = (field: keyof FormErrors) =>
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

  const openEdit = (product: AdminProduct) => {
    setEditingProduct(product);
    setErrors({});
    setModalOpen(true);
  };

  const validate = (data: Partial<AdminProduct>): FormErrors => {
    const e: FormErrors = {};
    if (!data.name || data.name.trim().length < 2) e.name = "Product name must be at least 2 characters.";
    if (!data.sku || data.sku.trim().length < 3) e.sku = "SKU must be at least 3 characters.";
    else {
      const dup = products.find((p) => p.sku.toLowerCase() === data.sku!.toLowerCase() && p.id !== editingProduct?.id);
      if (dup) e.sku = "SKU must be unique. This SKU already exists.";
    }
    if (data.pricePerDay === undefined || data.pricePerDay <= 0) e.pricePerDay = "Price must be a positive number.";
    if (data.stock === undefined || data.stock < 0) e.stock = "Stock must be 0 or greater.";
    if (!data.imageAlt || data.imageAlt.trim().length < 5) e.imageAlt = "Alt text must be at least 5 characters for accessibility.";
    return e;
  };

  const handleSave = async (formData: Partial<AdminProduct>) => {
    const e = validate(formData);
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoadError("");
    try {
      if (editingProduct) {
        const updated = await api<AdminProduct>(`/api/admin/products/${editingProduct.id}`, { method: "PUT", body: formData });
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const created = await api<AdminProduct>("/api/admin/products", { method: "POST", body: formData });
        setProducts((prev) => [...prev, created]);
      }
      setModalOpen(false);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not save the product.");
      setModalOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoadError("");
    try {
      await api(`/api/admin/products/${deleteTarget.id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not delete the product.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  return (
    <AnimatedContent distance={24} duration={0.6} ease="power3.out" trigger="mount">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Catalog &amp; Inventory</h1>
          <p className="mt-1 text-[13px] text-ink/55">Manage products, stock levels, variants, and pricing.</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Product
        </Button>
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-200" role="alert">
          {loadError}
        </div>
      )}

      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="flex items-center gap-3 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-2.5 backdrop-blur-sm" role="status">
          <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" aria-hidden="true" />
          <p className="text-[13px] text-amber-200">
            {outOfStockCount > 0 && <span className="font-semibold">{outOfStockCount} out of stock</span>}
            {outOfStockCount > 0 && lowStockCount > 0 && " and "}
            {lowStockCount > 0 && <span className="font-semibold">{lowStockCount} low stock</span>}
            {" — review and restock soon."}
          </p>
        </div>
      )}

      <div className="relative z-20 flex flex-col gap-3 sm:flex-row sm:items-center">
          <AdminSearch
            value={search}
            onChange={setSearch}
            placeholder="Search by name, SKU, or brand..."
            label="Search products"
          />
          <FilterPill label="Category">
            <AdminFilterSelect
              options={[{ value: "All", label: "All Categories" }, ...categoryOptions.map((c) => ({ value: c.value, label: c.label }))]}
              value={categoryFilter}
              onChange={setCategoryFilter}
              ariaLabel="Filter by category"
              menuWidth={160}
            />
          </FilterPill>
          <FilterPill label="Stock">
            <AdminFilterSelect
              options={[{ value: "All", label: "All Stock" }, { value: "low", label: "Low Stock" }, { value: "out", label: "Out of Stock" }]}
              value={stockFilter}
              onChange={setStockFilter}
              ariaLabel="Filter by stock level"
              menuWidth={140}
              align="right"
            />
          </FilterPill>
      </div>

      <Card className="overflow-hidden">
        <Table className="min-w-[1080px] table-fixed text-center [&_th]:text-center [&_td]:text-center">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[24%]">Product</TableHead>
              <TableHead className="w-[13%]">SKU</TableHead>
              <TableHead className="w-[12%]">Category</TableHead>
              <TableHead className="w-[10%]">Price/Day</TableHead>
              <TableHead className="w-[8%]">Stock</TableHead>
              <TableHead className="w-[12%]">Variants</TableHead>
              <TableHead className="w-[12%]">Status</TableHead>
              <TableHead className="w-[9%]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((product) => {
              const isLow = product.stock > 0 && product.stock <= product.lowStockThreshold;
              const isOut = product.stock === 0;
              return (
                <TableRow key={product.id}>
                  <TableCell className="text-left!">
                    <div className="flex items-center justify-start gap-3">
                      <img src={product.image} alt={product.imageAlt} className="h-12 w-16 flex-shrink-0 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink" title={product.name}>{product.name}</p>
                        <p className="truncate text-xs text-ink/45">{product.brand}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><span className="whitespace-nowrap text-[13px] tabular-nums tracking-[0.01em] text-ink/55">{product.sku}</span></TableCell>
                  <TableCell><span className="whitespace-nowrap text-ink/70">{product.category}</span></TableCell>
                  <TableCell><span className="whitespace-nowrap font-semibold text-ink">{formatMoney(product.pricePerDay)}</span></TableCell>
                  <TableCell>
                    <span className={`font-semibold ${isOut ? "text-red-400" : isLow ? "text-amber-400" : "text-ink"}`}>{product.stock}</span>
                  </TableCell>
                  <TableCell>
                    {product.variants.length > 0 ? (
                      <span className="whitespace-nowrap text-xs text-ink/55">{product.variants.length} variant{product.variants.length > 1 ? "s" : ""}</span>
                    ) : (
                      <span className="text-xs text-ink/25">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isOut ? <Badge variant="danger" dot>Out of Stock</Badge> : isLow ? <Badge variant="warning" dot>Low Stock</Badge> : <Badge variant="success" dot>Available</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEdit(product)}
                        className="rounded-lg p-1.5 text-ink/45 transition-colors hover:bg-white/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
                        aria-label={`Edit ${product.name}`}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(product)}
                        className="rounded-lg p-1.5 text-ink/45 transition-colors hover:bg-red-500/15 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
                        aria-label={`Delete ${product.name}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <Package className="mx-auto h-10 w-10 text-ink/20" aria-hidden="true" />
            <p className="mt-3 text-[13px] text-ink/45">No products found matching your filters.</p>
          </div>
        )}
      </Card>

      {modalOpen && (
        <ProductFormModal
          product={editingProduct}
          errors={errors}
          onClearError={clearError}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <Modal
          open={true}
          onClose={() => setDeleteTarget(null)}
          title="Delete Product"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete
              </Button>
            </>
          }
        >
          <p className="text-[13px] text-ink/60">
            Are you sure you want to delete <span className="font-semibold text-ink">{deleteTarget.name}</span> (SKU: {deleteTarget.sku})?
            This action cannot be undone.
          </p>
        </Modal>
      )}
      </div>
    </AnimatedContent>
  );
}

function ProductFormModal({
  product,
  errors,
  onClearError,
  onClose,
  onSave,
}: {
  product: AdminProduct | null;
  errors: FormErrors;
  onClearError: (field: keyof FormErrors) => void;
  onClose: () => void;
  onSave: (data: Partial<AdminProduct>) => void;
}) {
  const [name, setName] = useState(product?.name || "");
  const [brand, setBrand] = useState(product?.brand || "");
  const [category, setCategory] = useState(product?.category || "Mirrorless");
  const [pricePerDay, setPricePerDay] = useState(product?.pricePerDay?.toString() || "");
  const [sku, setSku] = useState(product?.sku || "");
  const [stock, setStock] = useState(product?.stock?.toString() || "0");
  const [lowStockThreshold, setLowStockThreshold] = useState(product?.lowStockThreshold?.toString() || "2");
  const [image, setImage] = useState(product?.image || "");
  const [imageAlt, setImageAlt] = useState(product?.imageAlt || "");
  const [description, setDescription] = useState(product?.description || "");
  const [variants, setVariants] = useState<ProductVariant[]>(product?.variants || []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  /* On a failed save, bring the body back to the error summary. */
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      document.getElementById("product-form")?.scrollIntoView({ block: "start" });
    }
  }, [errors]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setImageError("That file is not an image. Please choose a JPG, PNG, or WebP file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image is too large. Please choose a file 5 MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImage(typeof reader.result === "string" ? reader.result : "");
      setImageError(null);
    };
    reader.onerror = () => setImageError("Could not read that file. Please try another image.");
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // Allow re-selecting the same file later.
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      brand,
      category: category as AdminProduct["category"],
      pricePerDay: parseFloat(pricePerDay) || 0,
      sku,
      stock: parseInt(stock) || 0,
      lowStockThreshold: parseInt(lowStockThreshold) || 0,
      image: image || "https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&h=200&w=300",
      imageAlt,
      description,
      variants,
    });
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, { id: `v${Date.now()}`, name: "", value: "", stock: 0, sku: "" }]);
  };

  const updateVariant = (id: string, field: keyof ProductVariant, value: string | number) => {
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
  };

  const removeVariant = (id: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  const price = Number(pricePerDay) || 0;
  const stockValue = parseInt(stock) || 0;
  const threshold = parseInt(lowStockThreshold) || 0;
  const stockState = stockValue === 0 ? "out" : stockValue <= threshold ? "low" : "ok";
  const stockLabel = stockState === "out" ? "Out of stock" : stockState === "low" ? "Low stock" : "Available";
  const firstError = Object.values(errors).find(Boolean);

  const variantInputClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-[13px] text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-white/30 [color-scheme:dark]";

  return (
    <Modal
      open={true}
      onClose={onClose}
      size="xl"
      title={product ? "Edit product" : "Add new product"}
      description={product ? "Update this listing's details, pricing and stock." : "Create a listing for the rental catalog."}
      bodyClassName="p-0"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="product-form">{product ? "Save changes" : "Add product"}</Button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} noValidate className="grid xl:grid-cols-[320px_1fr]">
        <div className="order-1 space-y-8 p-6 xl:order-2">
          {firstError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-500/10 px-3.5 py-3 text-[13px] leading-relaxed text-red-200" role="alert">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span>{firstError}</span>
            </div>
          )}

          <FormSection title="Product details">
            <div className="space-y-4">
              <Input
                label="Product name"
                name="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  onClearError("name");
                }}
                error={errors.name}
                placeholder="e.g. Canon EOS R5"
                required
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Brand"
                  name="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Canon"
                />
                <AdminFormSelect
                  label="Category"
                  options={categoryOptions.map((c) => ({ value: c.value, label: c.label }))}
                  value={category}
                  onChange={(v) => setCategory(v as AdminProduct["category"])}
                  ariaLabel="Category"
                />
              </div>
              <Textarea
                label="Description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What makes this product worth renting?"
                rows={3}
              />
            </div>
          </FormSection>

          <FormSection
            title="Rental &amp; inventory"
            description="Low stock threshold triggers the inventory warning on the catalog table."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Price per day ($)"
                name="pricePerDay"
                type="number"
                min="0"
                step="1"
                value={pricePerDay}
                onChange={(e) => {
                  setPricePerDay(e.target.value);
                  onClearError("pricePerDay");
                }}
                error={errors.pricePerDay}
                placeholder="0"
                required
              />
              <Input
                label="SKU"
                name="sku"
                value={sku}
                onChange={(e) => {
                  setSku(e.target.value);
                  onClearError("sku");
                }}
                error={errors.sku}
                placeholder="e.g. CAN-R5-001"
                required
              />
              <Input
                label="Stock level"
                name="stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => {
                  setStock(e.target.value);
                  onClearError("stock");
                }}
                error={errors.stock}
                required
              />
              <Input
                label="Low stock threshold"
                name="lowStockThreshold"
                type="number"
                min="0"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
              />
            </div>
          </FormSection>

          <FormSection
            title="Variants"
            description="Optional kits, sizes or configurations. Leave empty to use the base stock level."
            action={
              <Button type="button" size="sm" variant="secondary" onClick={addVariant}>
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Add variant
              </Button>
            }
          >
            {variants.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-5 text-center text-[13px] text-ink/55">
                No variants yet — this product uses its base stock.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="hidden gap-2 px-2 text-[11px] text-ink/55 sm:grid sm:grid-cols-[1.1fr_1.2fr_1fr_80px_34px]">
                  <span>Name</span>
                  <span>Value</span>
                  <span>SKU</span>
                  <span>Stock</span>
                  <span className="sr-only">Remove</span>
                </div>
                {variants.map((v) => (
                  <div
                    key={v.id}
                    className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-[1.1fr_1.2fr_1fr_80px_34px] sm:items-center sm:border-0 sm:bg-transparent sm:p-0"
                  >
                    <VariantField label="Name">
                      <input
                        type="text"
                        value={v.name}
                        onChange={(e) => updateVariant(v.id, "name", e.target.value)}
                        placeholder="e.g. Kit"
                        aria-label="Variant name"
                        className={variantInputClass}
                      />
                    </VariantField>
                    <VariantField label="Value">
                      <input
                        type="text"
                        value={v.value}
                        onChange={(e) => updateVariant(v.id, "value", e.target.value)}
                        placeholder="e.g. Body only"
                        aria-label="Variant value"
                        className={variantInputClass}
                      />
                    </VariantField>
                    <VariantField label="SKU">
                      <input
                        type="text"
                        value={v.sku}
                        onChange={(e) => updateVariant(v.id, "sku", e.target.value)}
                        placeholder="Variant SKU"
                        aria-label="Variant SKU"
                        className={variantInputClass}
                      />
                    </VariantField>
                    <VariantField label="Stock">
                      <input
                        type="number"
                        min="0"
                        value={v.stock}
                        onChange={(e) => updateVariant(v.id, "stock", parseInt(e.target.value) || 0)}
                        placeholder="0"
                        aria-label="Variant stock"
                        className={variantInputClass}
                      />
                    </VariantField>
                    <button
                      type="button"
                      onClick={() => removeVariant(v.id)}
                      className="col-span-2 flex h-8 items-center justify-center rounded-lg text-ink/35 transition-colors hover:bg-red-500/15 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 sm:col-span-1"
                      aria-label={`Remove variant ${v.name || "without a name"}`}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </FormSection>
        </div>        {/* Media rail — second on phones so the form is reachable first. */}
        <aside className="order-2 border-t border-white/10 bg-white/[0.02] p-6 xl:order-1 xl:border-r xl:border-t-0">
          <h3 className="text-[13px] font-semibold text-ink">Product image</h3>
          <p id="product-image-hint" className="mt-0.5 text-xs text-ink/55">JPG, PNG or WebP &middot; max 5 MB</p>

          <button
            type="button"
            aria-describedby="product-image-hint"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`group relative mt-3 flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 ${
              dragging
                ? "border-accent/70 bg-accent/[0.06]"
                : "border-white/15 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.05]"
            }`}
          >
            {image ? (
              <>
                <img src={image} alt="Product image preview" className="h-full w-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-ground/85 px-3 py-2 text-xs font-medium text-ink opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  Replace image
                </span>
              </>
            ) : (
              <span className="flex flex-col items-center gap-2 px-4 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                  <Upload className="h-4 w-4 text-ink/60" aria-hidden="true" />
                </span>
                <span className="text-[13px] font-medium text-ink">Upload an image</span>
                <span className="text-xs text-ink/55">or drag and drop it here</span>
              </span>
            )}
            {dragging && (
              <span className="absolute inset-0 z-10 flex items-center justify-center bg-ground/85 text-[13px] font-medium text-accent">
                Drop image to upload
              </span>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            aria-hidden="true"
            tabIndex={-1}
          />

          {image && (
            <button
              type="button"
              onClick={() => setImage("")}
              className="mt-2 rounded-md px-1 py-1 text-xs text-ink/55 transition-colors hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
            >
              Remove image
            </button>
          )}
          {imageError && <p className="mt-2 text-xs font-medium text-red-300" role="alert">{imageError}</p>}

          <div className="mt-4 space-y-4">
            <Input
              label="Image URL"
              name="image"
              value={image.startsWith("data:") ? "" : image}
              onChange={(e) => {
                setImage(e.target.value);
                setImageError(null);
              }}
              placeholder="https://..."
            />
            <Input
              label="Alt text (accessibility)"
              name="imageAlt"
              value={imageAlt}
              onChange={(e) => {
                setImageAlt(e.target.value);
                onClearError("imageAlt");
              }}
              error={errors.imageAlt}
              placeholder="Describe the image for screen readers"
              required
            />
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="text-[11px] font-medium text-ink/55">Storefront preview</p>
            <div className="mt-2 rounded-xl border border-white/10 bg-ground/50 p-3">
              <div className="flex gap-3">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-white/[0.04]">
                  {image ? (
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center">
                      <Package className="h-5 w-5 text-ink/25" aria-hidden="true" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-[13px] font-semibold ${name.trim() ? "text-ink" : "text-ink/40"}`}>{name.trim() || "Product name"}</p>
                  <p className="mt-0.5 truncate text-xs text-ink/55">
                    {[brand.trim(), category].filter(Boolean).join(" · ") || "Brand · Category"}
                  </p>
                  <p className="mt-1 text-[13px] font-semibold text-accent">
                    {formatMoney(price)}
                    <span className="font-normal text-ink/55"> / day</span>
                  </p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-2 border-t border-white/[0.06] pt-2 text-[11px]">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    stockState === "out" ? "bg-red-400" : stockState === "low" ? "bg-amber-400" : "bg-emerald-400"
                  }`}
                  aria-hidden="true"
                />
                <span className="font-medium text-ink/70">{stockLabel}</span>
                <span className="text-ink/30">&middot;</span>
                <span className="text-ink/55">{stockValue} in stock</span>
              </div>
            </div>
          </div>
        </aside>


      </form>
    </Modal>
  );
}

function VariantField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[11px] text-ink/55 sm:hidden">{label}</span>
      {children}
    </label>
  );
}

