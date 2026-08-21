'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { cn, formatDate, formatPrice } from '@/lib/utils';
import { defaultLocale, getDictionary, pickLocalized } from '@/lib/i18n';
import { adminApi } from '@/lib/api/admin';
import { qk } from '@/lib/queryKeys';
import { useUiStore } from '@/store/ui';
import { Button } from '@/components/ui/Button';
import { Checkbox, Input, Select, Textarea } from '@/components/ui/Input';
import { ConfirmDialog, Modal } from '@/components/ui/Overlay';
import { EmptyState, Pagination, Rating, Skeleton } from '@/components/ui/Feedback';
import { TrashIcon } from '@/components/ui/Icons';
import { AdminCard, AdminPageHeader, AdminTable } from './AdminShell';
import { LocalizedField } from './ProductsAdmin';
import { MediaPicker } from './MediaPicker';
import type { Category, Collection, Localized, Post, PostType } from '@/types';

const empty = (): Localized => ({ hy: '', en: '', ru: '' });

/* ------------------------------- categories ------------------------------- */

export function CategoriesAdmin() {
  const dict = getDictionary(defaultLocale);
  const client = useQueryClient();
  const notify = useUiStore((s) => s.notify);

  const { data, isLoading } = useQuery({ queryKey: qk.adminCategories, queryFn: adminApi.categories });
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Category | null>(null);

  const [form, setForm] = useState({
    code: '',
    name: empty(),
    description: empty(),
    parent: '',
    image: [] as string[],
    order: 0,
    isActive: true,
    showInNav: true,
  });

  const openNew = () => {
    setEditing(null);
    setForm({ code: '', name: empty(), description: empty(), parent: '', image: [], order: 0, isActive: true, showInNav: true });
    setOpen(true);
  };

  const openEdit = (category: Category & { parent?: string; isActive?: boolean; showInNav?: boolean }) => {
    setEditing(category);
    setForm({
      code: category.code,
      name: { ...empty(), ...category.name },
      description: { ...empty(), ...category.description },
      parent: (category.parent as string) ?? '',
      image: category.image ? [category.image] : [],
      order: category.order,
      isActive: category.isActive ?? true,
      showInNav: category.showInNav ?? true,
    });
    setOpen(true);
  };

  const save = useMutation({
    mutationFn: () => {
      const body = {
        code: form.code,
        name: form.name,
        description: form.description,
        parent: form.parent || null,
        image: form.image[0],
        order: form.order,
        isActive: form.isActive,
        showInNav: form.showInNav,
      };
      return editing ? adminApi.updateCategory(editing.id, body) : adminApi.createCategory(body);
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: qk.adminCategories });
      setOpen(false);
      notify(dict.common.save, 'success');
    },
    onError: (error: Error) => notify(error.message, 'error'),
  });

  const remove = useMutation({
    mutationFn: (categoryId: string) => adminApi.deleteCategory(categoryId),
    onSuccess: () => client.invalidateQueries({ queryKey: qk.adminCategories }),
    onError: (error: Error) => notify(error.message, 'error'),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader
        title={dict.admin.categories}
        action={
          <Button size="md" onClick={openNew}>
            {dict.common.create}
          </Button>
        }
      />

      <AdminTable head={['code', dict.cart.item, dict.admin.products, '']}>
        {(data ?? []).map((category) => (
          <tr key={category.id} className="text-[12.5px]">
            <td className="px-4 py-3 font-mono text-[11px] text-ink-faint">{category.code}</td>
            <td className="px-4 py-3">
              <button type="button" onClick={() => openEdit(category)} className="font-medium text-brand hover:underline">
                {' '.repeat(Math.max(0, (category.code.length - 4) / 4 * 4))}
                {pickLocalized(category.name, defaultLocale)}
              </button>
            </td>
            <td className="px-4 py-3">{category.productCount}</td>
            <td className="px-4 py-3">
              <button
                type="button"
                onClick={() => setToDelete(category)}
                aria-label={dict.common.delete}
                className="text-ink-faint hover:text-danger-soft"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </td>
          </tr>
        ))}
      </AdminTable>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? dict.common.edit : dict.common.create}
        footer={
          <Button size="lg" fullWidth loading={save.isPending} onClick={() => save.mutate()}>
            {dict.common.save}
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            id="cat-code"
            label="code"
            required
            value={form.code}
            onChange={(event) => setForm((s) => ({ ...s, code: event.target.value }))}
          />
          <LocalizedField
            label={dict.cart.item}
            required
            value={form.name}
            onChange={(name) => setForm((s) => ({ ...s, name }))}
          />
          <LocalizedField
            label={dict.product.tabDescription}
            value={form.description}
            onChange={(description) => setForm((s) => ({ ...s, description }))}
            multiline
          />
          <Select
            id="cat-parent"
            label={dict.catalog.subcategories}
            value={form.parent}
            onChange={(event) => setForm((s) => ({ ...s, parent: event.target.value }))}
          >
            <option value="">-</option>
            {(data ?? [])
              .filter((category) => category.id !== editing?.id)
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {pickLocalized(category.name, defaultLocale)}
                </option>
              ))}
          </Select>
          <MediaPicker value={form.image} onChange={(image) => setForm((s) => ({ ...s, image }))} folder="categories" />
          <Input
            id="cat-order"
            type="number"
            label="order"
            value={form.order}
            onChange={(event) => setForm((s) => ({ ...s, order: Number(event.target.value) }))}
          />
          <Checkbox
            checked={form.showInNav}
            onChange={(event) => setForm((s) => ({ ...s, showInNav: event.target.checked }))}
            label={dict.nav.allMenu}
          />
          <Checkbox
            checked={form.isActive}
            onChange={(event) => setForm((s) => ({ ...s, isActive: event.target.checked }))}
            label={dict.common.yes}
          />
        </div>
      </Modal>

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

/* ------------------------------- collections ------------------------------ */

export function CollectionsAdmin() {
  const dict = getDictionary(defaultLocale);
  const client = useQueryClient();
  const notify = useUiStore((s) => s.notify);

  const { data, isLoading } = useQuery({ queryKey: qk.adminCollections, queryFn: adminApi.collections });
  const { data: products } = useQuery({
    queryKey: qk.adminProducts({ limit: 60 }),
    queryFn: () => adminApi.products({ limit: 60 }),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [form, setForm] = useState({
    title: empty(),
    subtitle: empty(),
    cover: [] as string[],
    products: [] as string[],
    showOnHome: false,
    order: 0,
    isActive: true,
  });

  const openEdit = (collection: Collection) => {
    setEditing(collection);
    setForm({
      title: { ...empty(), ...collection.title },
      subtitle: { ...empty(), ...collection.subtitle },
      cover: collection.coverImage ? [collection.coverImage] : [],
      products: (collection.products ?? []).map((product) =>
        typeof product === 'string' ? product : product.id,
      ),
      showOnHome: collection.showOnHome,
      order: collection.order,
      isActive: true,
    });
    setOpen(true);
  };

  const save = useMutation({
    mutationFn: () => {
      const body = {
        title: form.title,
        subtitle: form.subtitle,
        coverImage: form.cover[0],
        products: form.products,
        showOnHome: form.showOnHome,
        order: form.order,
        isActive: form.isActive,
      };
      return editing ? adminApi.updateCollection(editing.id, body) : adminApi.createCollection(body);
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: qk.adminCollections });
      setOpen(false);
      notify(dict.common.save, 'success');
    },
    onError: (error: Error) => notify(error.message, 'error'),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader
        title={dict.admin.collections}
        action={
          <Button
            size="md"
            onClick={() => {
              setEditing(null);
              setForm({ title: empty(), subtitle: empty(), cover: [], products: [], showOnHome: false, order: 0, isActive: true });
              setOpen(true);
            }}
          >
            {dict.common.create}
          </Button>
        }
      />

      <AdminTable head={[dict.cart.item, dict.admin.products, dict.home.themeTitle, '']}>
        {(data ?? []).map((collection) => (
          <tr key={collection.id} className="text-[12.5px]">
            <td className="px-4 py-3">
              <button type="button" onClick={() => openEdit(collection)} className="font-medium text-brand hover:underline">
                {pickLocalized(collection.title, defaultLocale)}
              </button>
            </td>
            <td className="px-4 py-3">{collection.products?.length ?? 0}</td>
            <td className="px-4 py-3">{collection.showOnHome ? dict.common.yes : dict.common.no}</td>
            <td className="px-4 py-3">
              <button
                type="button"
                onClick={() => adminApi.deleteCollection(collection.id).then(() => client.invalidateQueries({ queryKey: qk.adminCollections }))}
                aria-label={dict.common.delete}
                className="text-ink-faint hover:text-danger-soft"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </td>
          </tr>
        ))}
      </AdminTable>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? dict.common.edit : dict.common.create}
        size="lg"
        footer={
          <Button size="lg" fullWidth loading={save.isPending} onClick={() => save.mutate()}>
            {dict.common.save}
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <LocalizedField
            label={dict.cart.item}
            required
            value={form.title}
            onChange={(title) => setForm((s) => ({ ...s, title }))}
          />
          <LocalizedField
            label={dict.product.tabDescription}
            value={form.subtitle}
            onChange={(subtitle) => setForm((s) => ({ ...s, subtitle }))}
          />
          <MediaPicker value={form.cover} onChange={(cover) => setForm((s) => ({ ...s, cover }))} folder="collections" />

          <div>
            <p className="mb-2 text-[12px] font-medium text-ink-muted">{dict.admin.products}</p>
            <div className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-card border border-line p-3">
              {(products?.items ?? []).map((product) => (
                <Checkbox
                  key={product.id}
                  checked={form.products.includes(product.id)}
                  onChange={(event) =>
                    setForm((s) => ({
                      ...s,
                      products: event.target.checked
                        ? [...s.products, product.id]
                        : s.products.filter((item) => item !== product.id),
                    }))
                  }
                  label={pickLocalized(product.name, defaultLocale)}
                />
              ))}
            </div>
          </div>

          <Checkbox
            checked={form.showOnHome}
            onChange={(event) => setForm((s) => ({ ...s, showOnHome: event.target.checked }))}
            label={dict.home.themeTitle}
          />
          <Input
            id="collection-order"
            type="number"
            label="order"
            value={form.order}
            onChange={(event) => setForm((s) => ({ ...s, order: Number(event.target.value) }))}
          />
        </div>
      </Modal>
    </div>
  );
}

/* ---------------------------------- users --------------------------------- */

export function UsersAdmin() {
  const dict = getDictionary(defaultLocale);
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const params = { page, limit: 20, q: search || undefined };
  const { data, isLoading } = useQuery({ queryKey: qk.adminUsers(params), queryFn: () => adminApi.users(params) });

  const setRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'user' | 'admin' }) => adminApi.setUserRole(id, role),
    onSuccess: () => client.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader title={dict.admin.users} />

      <Input
        id="user-search"
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
          <AdminTable
            head={[dict.checkout.name, dict.checkout.email, dict.account.grade, dict.account.points, dict.account.totalSpend, 'role']}
          >
            {data.items.map((user) => (
              <tr key={user.id} className="text-[12.5px]">
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3 text-ink-soft">{user.email}</td>
                <td className="px-4 py-3">{dict.grades[user.grade as keyof typeof dict.grades] ?? user.grade}</td>
                <td className="px-4 py-3">{formatPrice(user.points)}</td>
                <td className="px-4 py-3">{formatPrice(user.totalSpend)}</td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(event) => setRole.mutate({ id: user.id, role: event.target.value as 'user' | 'admin' })}
                    className="h-8 rounded-card border border-line bg-white px-2 text-[11.5px] outline-none focus:border-brand"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </AdminTable>

          <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

/* --------------------------------- reviews -------------------------------- */

export function ReviewsAdmin() {
  const dict = getDictionary(defaultLocale);
  const client = useQueryClient();
  const [page, setPage] = useState(1);

  const params = { page };
  const { data, isLoading } = useQuery({ queryKey: qk.adminReviews(params), queryFn: () => adminApi.reviews(params) });

  const approve = useMutation({
    mutationFn: ({ id, isApproved }: { id: string; isApproved: boolean }) => adminApi.setReviewApproval(id, isApproved),
    onSuccess: () => client.invalidateQueries({ queryKey: ['admin-reviews'] }),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader title={dict.admin.reviews} />

      {!data || data.items.length === 0 ? (
        <EmptyState title={dict.common.empty} />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {data.items.map((review) => (
              <AdminCard key={review.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Rating value={review.rating} size={12} />
                    <span className="text-[12.5px] font-medium">
                      {typeof review.user === 'object' ? review.user.name : ''}
                    </span>
                    <span className="text-[11px] text-ink-faint">{formatDate(review.createdAt, defaultLocale)}</span>
                  </div>
                  <Button
                    size="sm"
                    variant={review.isApproved ? 'outline' : 'primary'}
                    onClick={() => approve.mutate({ id: review.id, isApproved: !review.isApproved })}
                  >
                    {review.isApproved ? dict.common.no : dict.common.yes}
                  </Button>
                </div>
                <p className="mt-2 text-[12.5px] text-ink-soft">
                  {typeof review.product === 'object' ? pickLocalized(review.product.name, defaultLocale) : ''}
                </p>
                <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-ink-muted">{review.body}</p>
              </AdminCard>
            ))}
          </ul>
          <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

/* -------------------------------- inquiries ------------------------------- */

export function InquiriesAdmin() {
  const dict = getDictionary(defaultLocale);
  const client = useQueryClient();
  const notify = useUiStore((s) => s.notify);

  const [page, setPage] = useState(1);
  const [answering, setAnswering] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');

  const params = { page };
  const { data, isLoading } = useQuery({
    queryKey: qk.adminInquiries(params),
    queryFn: () => adminApi.inquiries(params),
  });

  const reply = useMutation({
    mutationFn: (id: string) => adminApi.answerInquiry(id, answer),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['admin-inquiries'] });
      setAnswering(null);
      setAnswer('');
      notify(dict.common.save, 'success');
    },
    onError: (error: Error) => notify(error.message, 'error'),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader title={dict.admin.inquiries} />

      {!data || data.items.length === 0 ? (
        <EmptyState title={dict.common.empty} />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {data.items.map((inquiry) => (
              <AdminCard key={inquiry.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'rounded-pill px-2 py-0.5 text-[10px]',
                        inquiry.status === 'answered' ? 'bg-brand-50 text-brand-700' : 'bg-gold-wash text-ink',
                      )}
                    >
                      {inquiry.status === 'answered' ? dict.product.answered : dict.product.open}
                    </span>
                    <span className="text-[12.5px] font-medium">
                      {typeof inquiry.user === 'object' ? inquiry.user.name : ''}
                    </span>
                    <span className="text-[11px] text-ink-faint">{formatDate(inquiry.createdAt, defaultLocale)}</span>
                  </div>
                  {inquiry.status !== 'answered' && (
                    <Button size="sm" variant="outline" onClick={() => setAnswering(inquiry.id)}>
                      {dict.common.create}
                    </Button>
                  )}
                </div>

                <p className="mt-2 text-[13px] font-medium text-ink">{inquiry.subject}</p>
                <p className="mt-1 whitespace-pre-line text-[12.5px] leading-relaxed text-ink-muted">{inquiry.body}</p>

                {inquiry.answer && (
                  <div className="mt-3 rounded-card border-l-2 border-brand bg-surface-soft px-4 py-3 text-[12.5px] text-ink-muted">
                    {inquiry.answer.body}
                  </div>
                )}

                {answering === inquiry.id && (
                  <div className="mt-3 flex flex-col gap-2">
                    <Textarea
                      id={`answer-${inquiry.id}`}
                      value={answer}
                      onChange={(event) => setAnswer(event.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" loading={reply.isPending} onClick={() => reply.mutate(inquiry.id)}>
                        {dict.common.save}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setAnswering(null)}>
                        {dict.common.cancel}
                      </Button>
                    </div>
                  </div>
                )}
              </AdminCard>
            ))}
          </ul>
          <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

/* ---------------------------------- posts --------------------------------- */

const POST_TYPES: PostType[] = ['magazine', 'notice', 'faq', 'event'];

export function PostsAdmin() {
  const dict = getDictionary(defaultLocale);
  const client = useQueryClient();
  const notify = useUiStore((s) => s.notify);

  const [page, setPage] = useState(1);
  const [type, setType] = useState<PostType | ''>('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);

  const params = { page, type: type || undefined };
  const { data, isLoading } = useQuery({ queryKey: qk.adminPosts(params), queryFn: () => adminApi.posts(params) });

  const [form, setForm] = useState({
    type: 'magazine' as PostType,
    title: empty(),
    excerpt: empty(),
    body: empty(),
    cover: [] as string[],
    isPublished: true,
    isPinned: false,
  });

  useEffect(() => {
    if (!editing) return;
    setForm({
      type: editing.type,
      title: { ...empty(), ...editing.title },
      excerpt: { ...empty(), ...editing.excerpt },
      body: { ...empty(), ...editing.body },
      cover: editing.coverImage ? [editing.coverImage] : [],
      isPublished: true,
      isPinned: editing.isPinned,
    });
  }, [editing]);

  const save = useMutation({
    mutationFn: () => {
      const body = {
        type: form.type,
        title: form.title,
        excerpt: form.excerpt,
        body: form.body,
        coverImage: form.cover[0],
        isPublished: form.isPublished,
        isPinned: form.isPinned,
      };
      return editing ? adminApi.updatePost(editing.id, body) : adminApi.createPost(body);
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['admin-posts'] });
      setOpen(false);
      setEditing(null);
      notify(dict.common.save, 'success');
    },
    onError: (error: Error) => notify(error.message, 'error'),
  });

  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader
        title={dict.admin.posts}
        action={
          <Button
            size="md"
            onClick={() => {
              setEditing(null);
              setForm({ type: 'magazine', title: empty(), excerpt: empty(), body: empty(), cover: [], isPublished: true, isPinned: false });
              setOpen(true);
            }}
          >
            {dict.common.create}
          </Button>
        }
      />

      <Select
        id="post-type"
        value={type}
        onChange={(event) => {
          setType(event.target.value as PostType | '');
          setPage(1);
        }}
        wrapperClassName="w-full sm:w-52"
      >
        <option value="">{dict.common.all}</option>
        {POST_TYPES.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </Select>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title={dict.common.empty} />
      ) : (
        <>
          <AdminTable head={['type', dict.cart.item, dict.account.orderDate, '']}>
            {data.items.map((post) => (
              <tr key={post.id} className="text-[12.5px]">
                <td className="px-4 py-3 text-ink-faint">{post.type}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(post);
                      setOpen(true);
                    }}
                    className="font-medium text-brand hover:underline"
                  >
                    {pickLocalized(post.title, defaultLocale)}
                  </button>
                </td>
                <td className="px-4 py-3 text-ink-soft">{formatDate(post.publishedAt, defaultLocale)}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      adminApi.deletePost(post.id).then(() => client.invalidateQueries({ queryKey: ['admin-posts'] }))
                    }
                    aria-label={dict.common.delete}
                    className="text-ink-faint hover:text-danger-soft"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </AdminTable>
          <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={setPage} />
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? dict.common.edit : dict.common.create}
        size="lg"
        footer={
          <Button size="lg" fullWidth loading={save.isPending} onClick={() => save.mutate()}>
            {dict.common.save}
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <Select
            id="post-form-type"
            label="type"
            value={form.type}
            onChange={(event) => setForm((s) => ({ ...s, type: event.target.value as PostType }))}
          >
            {POST_TYPES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
          <LocalizedField
            label={dict.cart.item}
            required
            value={form.title}
            onChange={(title) => setForm((s) => ({ ...s, title }))}
          />
          <LocalizedField
            label={dict.product.tabDescription}
            value={form.excerpt}
            onChange={(excerpt) => setForm((s) => ({ ...s, excerpt }))}
          />
          <LocalizedField
            label={dict.product.tabDescription}
            required
            multiline
            value={form.body}
            onChange={(body) => setForm((s) => ({ ...s, body }))}
          />
          <MediaPicker value={form.cover} onChange={(cover) => setForm((s) => ({ ...s, cover }))} folder="posts" />
          <Checkbox
            checked={form.isPinned}
            onChange={(event) => setForm((s) => ({ ...s, isPinned: event.target.checked }))}
            label="pin"
          />
          <Checkbox
            checked={form.isPublished}
            onChange={(event) => setForm((s) => ({ ...s, isPublished: event.target.checked }))}
            label={dict.common.yes}
          />
        </div>
      </Modal>
    </div>
  );
}
