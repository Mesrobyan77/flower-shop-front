'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { defaultLocale, getDictionary } from '@/lib/i18n';
import { adminApi } from '@/lib/api/admin';
import { useApiError } from '@/lib/hooks/useApiError';
import { qk } from '@/lib/queryKeys';
import { useUiStore } from '@/store/ui';
import { Button } from '@/components/ui/Button';
import { Checkbox, Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Feedback';
import { TrashIcon, PlusIcon } from '@/components/ui/Icons';
import { AdminCard, AdminPageHeader } from './AdminShell';
import { LocalizedField } from './ProductsAdmin';
import { MediaPicker } from './MediaPicker';
import type { HeroSlide, Localized, StoreSettings, ThemeTile } from '@/types';

const empty = (): Localized => ({ hy: '', en: '', ru: '' });

/** Everything the storefront chrome reads: promo strip, hero, tiles, counters, contacts. */
export function SettingsAdmin() {
  const dict = getDictionary(defaultLocale);
  const client = useQueryClient();
  const notify = useUiStore((s) => s.notify);
  const showApiError = useApiError();

  const { data, isLoading } = useQuery({ queryKey: qk.adminSettings, queryFn: adminApi.settings });
  const [form, setForm] = useState<StoreSettings>({});

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: () => adminApi.updateSettings(form),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: qk.adminSettings });
      client.invalidateQueries({ queryKey: qk.settings });
      notify(dict.common.save, 'success');
    },
    onError: (error: Error) => showApiError(error),
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  const slides = form.heroSlides ?? [];
  const tiles = form.themeTiles ?? [];

  const updateSlide = (index: number, patch: Partial<HeroSlide>) =>
    setForm((s) => ({
      ...s,
      heroSlides: (s.heroSlides ?? []).map((slide, i) => (i === index ? { ...slide, ...patch } : slide)),
    }));

  const updateTile = (index: number, patch: Partial<ThemeTile>) =>
    setForm((s) => ({
      ...s,
      themeTiles: (s.themeTiles ?? []).map((tile, i) => (i === index ? { ...tile, ...patch } : tile)),
    }));

  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader
        title={dict.admin.settings}
        action={
          <Button size="md" loading={save.isPending} onClick={() => save.mutate()}>
            {dict.common.save}
          </Button>
        }
      />

      <AdminCard>
        <p className="mb-4 text-[13px] font-semibold text-ink-strong">Promo bar</p>
        <Checkbox
          checked={form.promoBar?.enabled ?? false}
          onChange={(event) =>
            setForm((s) => ({ ...s, promoBar: { ...(s.promoBar ?? {}), enabled: event.target.checked } }))
          }
          label={dict.common.yes}
        />
        <LocalizedField
          className="mt-4"
          label={dict.cart.item}
          value={{ ...empty(), ...form.promoBar?.text }}
          onChange={(text) => setForm((s) => ({ ...s, promoBar: { ...(s.promoBar ?? { enabled: false }), text } }))}
        />
        <Input
          id="promo-href"
          wrapperClassName="mt-4"
          label="href"
          value={form.promoBar?.href ?? ''}
          onChange={(event) =>
            setForm((s) => ({ ...s, promoBar: { ...(s.promoBar ?? { enabled: false }), href: event.target.value } }))
          }
        />
      </AdminCard>

      <AdminCard>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-ink-strong">Hero slides</p>
          <Button
            size="sm"
            variant="outline"
            icon={<PlusIcon className="h-3.5 w-3.5" />}
            onClick={() =>
              setForm((s) => ({
                ...s,
                heroSlides: [
                  ...(s.heroSlides ?? []),
                  { image: '', theme: 'dark', order: (s.heroSlides?.length ?? 0) + 1 },
                ],
              }))
            }
          >
            {dict.common.create}
          </Button>
        </div>

        <div className="flex flex-col gap-5">
          {slides.map((slide, index) => (
            <div key={index} className="rounded-card border border-line p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[12px] text-ink-soft">#{index + 1}</span>
                <button
                  type="button"
                  onClick={() =>
                    setForm((s) => ({ ...s, heroSlides: (s.heroSlides ?? []).filter((_, i) => i !== index) }))
                  }
                  aria-label={dict.common.delete}
                  className="text-ink-faint hover:text-danger-soft"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              <MediaPicker
                value={slide.image ? [slide.image] : []}
                onChange={(urls) => updateSlide(index, { image: urls[0] ?? '' })}
                folder="hero"
              />

              <LocalizedField
                className="mt-4"
                label={dict.cart.item}
                value={{ ...empty(), ...slide.title }}
                onChange={(title) => updateSlide(index, { title })}
              />
              <LocalizedField
                className="mt-4"
                label={dict.product.tabDescription}
                value={{ ...empty(), ...slide.subtitle }}
                onChange={(subtitle) => updateSlide(index, { subtitle })}
              />
              <LocalizedField
                className="mt-4"
                label="CTA"
                value={{ ...empty(), ...slide.ctaLabel }}
                onChange={(ctaLabel) => updateSlide(index, { ctaLabel })}
              />
              <Input
                id={`slide-href-${index}`}
                wrapperClassName="mt-4"
                label="href"
                value={slide.href ?? ''}
                onChange={(event) => updateSlide(index, { href: event.target.value })}
              />
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-ink-strong">Theme tiles</p>
          <Button
            size="sm"
            variant="outline"
            icon={<PlusIcon className="h-3.5 w-3.5" />}
            onClick={() =>
              setForm((s) => ({
                ...s,
                themeTiles: [
                  ...(s.themeTiles ?? []),
                  { title: empty(), href: '/catalog/flower-gifts', animated: false, order: (s.themeTiles?.length ?? 0) + 1 },
                ],
              }))
            }
          >
            {dict.common.create}
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {tiles.map((tile, index) => (
            <div key={index} className="rounded-card border border-line p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[12px] text-ink-soft">#{index + 1}</span>
                <button
                  type="button"
                  onClick={() =>
                    setForm((s) => ({ ...s, themeTiles: (s.themeTiles ?? []).filter((_, i) => i !== index) }))
                  }
                  aria-label={dict.common.delete}
                  className="text-ink-faint hover:text-danger-soft"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              <MediaPicker
                value={tile.image ? [tile.image] : []}
                onChange={(urls) => updateTile(index, { image: urls[0] ?? '' })}
                folder="tiles"
              />
              <LocalizedField
                className="mt-4"
                label={dict.cart.item}
                value={{ ...empty(), ...tile.title }}
                onChange={(title) => updateTile(index, { title })}
              />
              <Input
                id={`tile-href-${index}`}
                wrapperClassName="mt-4"
                label="href"
                value={tile.href}
                onChange={(event) => updateTile(index, { href: event.target.value })}
              />
              <Checkbox
                className="mt-3"
                checked={tile.animated}
                onChange={(event) => updateTile(index, { animated: event.target.checked })}
                label="animate"
              />
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard>
        <p className="mb-4 text-[13px] font-semibold text-ink-strong">Counters &amp; contact</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            id="counter-reviews"
            type="number"
            label={dict.product.tabReviews}
            value={form.counters?.reviews ?? 0}
            onChange={(event) =>
              setForm((s) => ({
                ...s,
                counters: { ...(s.counters ?? { reviews: 0, deliveries: 0, awardYears: 0 }), reviews: Number(event.target.value) },
              }))
            }
          />
          <Input
            id="counter-deliveries"
            type="number"
            label={dict.delivery.title}
            value={form.counters?.deliveries ?? 0}
            onChange={(event) =>
              setForm((s) => ({
                ...s,
                counters: { ...(s.counters ?? { reviews: 0, deliveries: 0, awardYears: 0 }), deliveries: Number(event.target.value) },
              }))
            }
          />
          <Input
            id="counter-years"
            type="number"
            label="years"
            value={form.counters?.awardYears ?? 0}
            onChange={(event) =>
              setForm((s) => ({
                ...s,
                counters: { ...(s.counters ?? { reviews: 0, deliveries: 0, awardYears: 0 }), awardYears: Number(event.target.value) },
              }))
            }
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input
            id="contact-phone"
            label={dict.checkout.phone}
            value={form.contact?.phone ?? ''}
            onChange={(event) =>
              setForm((s) => ({
                ...s,
                contact: { ...(s.contact ?? { phone: '', email: '' }), phone: event.target.value },
              }))
            }
          />
          <Input
            id="contact-email"
            label={dict.checkout.email}
            value={form.contact?.email ?? ''}
            onChange={(event) =>
              setForm((s) => ({
                ...s,
                contact: { ...(s.contact ?? { phone: '', email: '' }), email: event.target.value },
              }))
            }
          />
        </div>

        <LocalizedField
          className="mt-4"
          label={dict.support.hours}
          value={{ ...empty(), ...form.contact?.hours }}
          onChange={(hours) =>
            setForm((s) => ({ ...s, contact: { ...(s.contact ?? { phone: '', email: '' }), hours } }))
          }
        />
        <LocalizedField
          className="mt-4"
          label={dict.checkout.street}
          value={{ ...empty(), ...form.contact?.address }}
          onChange={(address) =>
            setForm((s) => ({ ...s, contact: { ...(s.contact ?? { phone: '', email: '' }), address } }))
          }
        />
      </AdminCard>

      <Button size="xl" fullWidth loading={save.isPending} onClick={() => save.mutate()}>
        {dict.common.save}
      </Button>
    </div>
  );
}
