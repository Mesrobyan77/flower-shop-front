'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn, formatPrice } from '@/lib/utils';
import { defaultLocale, getDictionary, locales, pickLocalized, type Locale } from '@/lib/i18n';
import { adminApi } from '@/lib/api/admin';
import { qk } from '@/lib/queryKeys';
import { useUiStore } from '@/store/ui';
import { Button } from '@/components/ui/Button';
import { Checkbox, Input, Select, Textarea } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/Overlay';
import { EmptyState, Pagination, Skeleton } from '@/components/ui/Feedback';
import { TrashIcon } from '@/components/ui/Icons';
import { AdminCard, AdminPageHeader, AdminTable } from './AdminShell';
import { MediaPicker } from './MediaPicker';
import type { Category, DeliveryMethod, Localized, Product, ProductBadge } from '@/types';

const DELIVERY_METHODS: DeliveryMethod[] = ['quick', 'parcel', 'pickup'];
const BADGES: ProductBadge[] = ['new', 'best', 'sale', 'today'];

const emptyLocalized = (): Localized => ({ hy: '', en: '', ru: '' });

/* --------------------------------- list ---------------------------------- */

export function ProductsAdmin() {
  const dict = getDictionary(defaultLocale);
  const client = useQueryClient();
  const notify = useUiStore((s) => s.notify);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const params = { page, limit: 20, q: search || undefined };
  const { data, isLoading } = useQuery({
    queryKey: qk.adminProducts(params),
    queryFn: () => adminApi.products(params),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['admin-products'] });
      notify(dict.common.delete, 'success');
    },
    onError: (error: Error) => notify(error.message, 'error'),
  });

  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader
        title={dict.admin.products}
        action={
          <Link
            href="/admin/products/new"
            className="inline-flex h-10 items-center rounded-card bg-brand px-4 text-[13px] font-medium text-white transition-colors duration-fast hover:bg-brand-600"
          >
            {dict.common.create}
          </Link>
        }
      />

      <Input
        id="product-search"
        placeholder={dict.common.search}
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
        wrapperClassName="w-full sm:w-72"
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title={dict.common.empty} />
      ) : (
        <>
          <AdminTable head={['', dict.cart.item, dict.product.price, dict.catalog.title, dict.home.bestSellers, '']}>
            {data.items.map((product) => (
              <tr key={product.id} className="text-[12.5px]">
                <td className="px-4 py-3">
                  <span className="relative block h-12 w-12 overflow-hidden rounded-card bg-surface-soft">
                    {product.thumbnail && (
                      <Image src={product.thumbnail} alt="" fill sizes="48px" className="object-cover" />
                    )}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/products/${product.id}`} className="font-medium text-brand hover:underline">
                    {pickLocalized(product.name, defaultLocale)}
                  </Link>
                  <span className="mt-0.5 block text-[11px] text-ink-faint">{product.sku}</span>
                </td>
                <td className="px-4 py-3">{formatPrice(product.price)}</td>
                <td className="px-4 py-3 text-ink-soft">
                  {typeof product.category === 'object' ? pickLocalized(product.category.name, defaultLocale) : '-'}
                </td>
                <td className="px-4 py-3">{product.soldCount}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'rounded-pill px-2 py-0.5 text-[10px]',
                        product.isActive ? 'bg-brand-50 text-brand-700' : 'bg-surface-soft text-ink-faint',
                      )}
                    >
                      {product.isActive ? dict.common.yes : dict.common.no}
                    </span>
                    <button
                      type="button"
                      onClick={() => setToDelete(product)}
                      aria-label={dict.common.delete}
                      className="text-ink-faint hover:text-danger-soft"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </AdminTable>

          <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={dict.common.delete}
        message={toDelete ? pickLocalized(toDelete.name, defaultLocale) : ''}
        confirmLabel={dict.common.delete}
        cancelLabel={dict.common.cancel}
        tone="danger"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) remove.mutate(toDelete.id);
          setToDelete(null);
        }}
      />
    </div>
  );
}

/* --------------------------------- form ---------------------------------- */

interface FormState {
  name: Localized;
  shortDescription: Localized;
  description: Localized;
  careGuide: Localized;
  origin: Localized;
  category: string;
  price: number;
  compareAtPrice: number;
  images: string[];
  deliveryMethods: DeliveryMethod[];
  badges: ProductBadge[];
  stock: number;
  trackStock: boolean;
  isActive: boolean;
  isFeatured: boolean;
  sameDayAvailable: boolean;
  minOrderQty: number;
  maxOrderQty: number;
}

const EMPTY_FORM: FormState = {
  name: emptyLocalized(),
  shortDescription: emptyLocalized(),
  description: emptyLocalized(),
  careGuide: emptyLocalized(),
  origin: emptyLocalized(),
  category: '',
  price: 0,
  compareAtPrice: 0,
  images: [],
  deliveryMethods: ['quick', 'parcel'],
  badges: [],
  stock: 0,
  trackStock: false,
  isActive: true,
  isFeatured: false,
  sameDayAvailable: true,
  minOrderQty: 1,
  maxOrderQty: 20,
};

export function ProductForm({ id }: { id?: string }) {
  const dict = getDictionary(defaultLocale);
  const router = useRouter();
  const client = useQueryClient();
  const notify = useUiStore((s) => s.notify);

  const isEdit = Boolean(id && id !== 'new');

  const { data: categories } = useQuery({ queryKey: qk.adminCategories, queryFn: adminApi.categories });
  const { data: existing, isLoading } = useQuery({
    queryKey: qk.adminProduct(id ?? ''),
    queryFn: () => adminApi.product(id!),
    enabled: isEdit,
  });

  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    if (!existing) return;
    setForm({
      name: { ...emptyLocalized(), ...existing.name },
      shortDescription: { ...emptyLocalized(), ...existing.shortDescription },
      description: { ...emptyLocalized(), ...existing.description },
      careGuide: { ...emptyLocalized(), ...existing.careGuide },
      origin: { ...emptyLocalized(), ...existing.origin },
      category: typeof existing.category === 'object' ? existing.category.id : String(existing.category),
      price: existing.price,
      compareAtPrice: existing.compareAtPrice ?? 0,
      images: existing.images.map((image) => image.url),
      deliveryMethods: existing.deliveryMethods,
      badges: existing.badges,
      stock: existing.stock,
      trackStock: existing.trackStock,
      isActive: existing.isActive,
      isFeatured: existing.isFeatured,
      sameDayAvailable: existing.sameDayAvailable,
      minOrderQty: existing.minOrderQty,
      maxOrderQty: existing.maxOrderQty,
    });
  }, [existing]);

  const payload = () => ({
    name: form.name,
    shortDescription: form.shortDescription,
    description: form.description,
    careGuide: form.careGuide,
    origin: form.origin,
    category: form.category,
    price: Math.round(form.price),
    compareAtPrice: form.compareAtPrice > 0 ? Math.round(form.compareAtPrice) : undefined,
    images: form.images.map((url, index) => ({ url, order: index + 1 })),
    thumbnail: form.images[0],
    deliveryMethods: form.deliveryMethods,
    badges: form.badges,
    stock: Math.round(form.stock),
    trackStock: form.trackStock,
    isActive: form.isActive,
    isFeatured: form.isFeatured,
    sameDayAvailable: form.sameDayAvailable,
    minOrderQty: form.minOrderQty,
    maxOrderQty: form.maxOrderQty,
  });

  const save = useMutation({
    mutationFn: () => (isEdit ? adminApi.updateProduct(id!, payload()) : adminApi.createProduct(payload())),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['admin-products'] });
      notify(dict.common.save, 'success');
      router.push('/admin/products');
    },
    onError: (error: Error) => notify(error.message, 'error'),
  });

  if (isEdit && isLoading) return <Skeleton className="h-96 w-full" />;

  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader title={isEdit ? dict.common.edit : dict.common.create} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <AdminCard>
            <p className="mb-4 text-[13px] font-semibold text-ink-strong">{dict.cart.item}</p>
            <LocalizedField
              label={dict.cart.item}
              value={form.name}
              onChange={(name) => setForm((s) => ({ ...s, name }))}
              required
            />
            <LocalizedField
              className="mt-4"
              label={dict.product.tabDescription}
              value={form.shortDescription}
              onChange={(shortDescription) => setForm((s) => ({ ...s, shortDescription }))}
            />
            <LocalizedField
              className="mt-4"
              label={dict.product.tabDescription}
              value={form.description}
              onChange={(description) => setForm((s) => ({ ...s, description }))}
              multiline
            />
            <LocalizedField
              className="mt-4"
              label={dict.product.careGuide}
              value={form.careGuide}
              onChange={(careGuide) => setForm((s) => ({ ...s, careGuide }))}
              multiline
            />
            <LocalizedField
              className="mt-4"
              label={dict.product.origin}
              value={form.origin}
              onChange={(origin) => setForm((s) => ({ ...s, origin }))}
            />
          </AdminCard>

          <AdminCard>
            <p className="mb-4 text-[13px] font-semibold text-ink-strong">{dict.admin.media}</p>
            <MediaPicker
              multiple
              value={form.images}
              onChange={(images) => setForm((s) => ({ ...s, images }))}
              folder="products"
            />
          </AdminCard>
        </div>

        <div className="flex flex-col gap-4">
          <AdminCard>
            <div className="grid gap-4">
              <Select
                id="product-category"
                label={dict.catalog.title}
                required
                value={form.category}
                onChange={(event) => setForm((s) => ({ ...s, category: event.target.value }))}
              >
                <option value="">-</option>
                {(categories ?? []).map((category: Category) => (
                  <option key={category.id} value={category.id}>
                    {'- '.repeat(category.children ? 0 : 0)}
                    {pickLocalized(category.name, defaultLocale)}
                  </option>
                ))}
              </Select>

              <Input
                id="product-price"
                type="number"
                label={dict.product.price}
                required
                value={form.price || ''}
                onChange={(event) => setForm((s) => ({ ...s, price: Number(event.target.value) }))}
              />
              <Input
                id="product-compare"
                type="number"
                label={dict.catalog.sortPriceDesc}
                value={form.compareAtPrice || ''}
                onChange={(event) => setForm((s) => ({ ...s, compareAtPrice: Number(event.target.value) }))}
              />
            </div>
          </AdminCard>

          <AdminCard>
            <p className="mb-3 text-[13px] font-semibold text-ink-strong">{dict.checkout.method}</p>
            <div className="flex flex-wrap gap-2">
              {DELIVERY_METHODS.map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setForm((s) => ({ ...s, deliveryMethods: toggle(s.deliveryMethods, method) }))}
                  className={cn(
                    'rounded-pill border px-3 py-1.5 text-[12px] transition-colors duration-fast',
                    form.deliveryMethods.includes(method)
                      ? 'border-brand bg-brand text-white'
                      : 'border-line text-ink-muted hover:border-brand',
                  )}
                >
                  {dict.delivery[method]}
                </button>
              ))}
            </div>

            <p className="mb-3 mt-5 text-[13px] font-semibold text-ink-strong">Badges</p>
            <div className="flex flex-wrap gap-2">
              {BADGES.map((badge) => (
                <button
                  key={badge}
                  type="button"
                  onClick={() => setForm((s) => ({ ...s, badges: toggle(s.badges, badge) }))}
                  className={cn(
                    'rounded-pill border px-3 py-1.5 text-[12px] uppercase transition-colors duration-fast',
                    form.badges.includes(badge)
                      ? 'border-ink-strong bg-ink-strong text-white'
                      : 'border-line text-ink-muted hover:border-ink',
                  )}
                >
                  {badge}
                </button>
              ))}
            </div>
          </AdminCard>

          <AdminCard>
            <div className="flex flex-col gap-3">
              <Checkbox
                checked={form.isActive}
                onChange={(event) => setForm((s) => ({ ...s, isActive: event.target.checked }))}
                label={dict.common.yes}
              />
              <Checkbox
                checked={form.isFeatured}
                onChange={(event) => setForm((s) => ({ ...s, isFeatured: event.target.checked }))}
                label={dict.home.floristPicks}
              />
              <Checkbox
                checked={form.sameDayAvailable}
                onChange={(event) => setForm((s) => ({ ...s, sameDayAvailable: event.target.checked }))}
                label={dict.catalog.sameDay}
              />
              <Checkbox
                checked={form.trackStock}
                onChange={(event) => setForm((s) => ({ ...s, trackStock: event.target.checked }))}
                label={dict.product.availability}
              />
              {form.trackStock && (
                <Input
                  id="product-stock"
                  type="number"
                  label={dict.product.availability}
                  value={form.stock}
                  onChange={(event) => setForm((s) => ({ ...s, stock: Number(event.target.value) }))}
                />
              )}
            </div>
          </AdminCard>

          <Button size="xl" fullWidth loading={save.isPending} onClick={() => save.mutate()}>
            {dict.common.save}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Three tabs, one per locale: the DB stores every string per language. */
export function LocalizedField({
  label,
  value,
  onChange,
  multiline,
  required,
  className,
}: {
  label: string;
  value: Localized;
  onChange: (value: Localized) => void;
  multiline?: boolean;
  required?: boolean;
  className?: string;
}) {
  const [active, setActive] = useState<Locale>(defaultLocale);

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[12px] font-medium text-ink-muted">
          {label}
          {required && <span className="ml-1 text-danger">*</span>}
        </span>
        <div className="flex gap-1">
          {locales.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setActive(code)}
              className={cn(
                'rounded-card px-2 py-0.5 text-[10px] uppercase transition-colors duration-fast',
                active === code ? 'bg-ink-strong text-white' : 'bg-surface-soft text-ink-soft hover:text-ink',
              )}
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {multiline ? (
        <Textarea
          id={`${label}-${active}`}
          rows={4}
          value={value[active] ?? ''}
          onChange={(event) => onChange({ ...value, [active]: event.target.value })}
        />
      ) : (
        <Input
          id={`${label}-${active}`}
          value={value[active] ?? ''}
          onChange={(event) => onChange({ ...value, [active]: event.target.value })}
        />
      )}
    </div>
  );
}
