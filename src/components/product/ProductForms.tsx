'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { catalogApi } from '@/lib/api/catalog';
import { useSession } from '@/lib/hooks/useAuth';
import { useUiStore } from '@/store/ui';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Input';
import { StarIcon } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/lib/i18n';

/** Inline review composer shown above the review list. */
export function ReviewForm({ productId, dict }: { productId: string; dict: Dictionary }) {
  const { isAuthenticated } = useSession();
  const client = useQueryClient();
  const notify = useUiStore((s) => s.notify);

  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');

  const mutation = useMutation({
    mutationFn: () => catalogApi.createReview({ product: productId, rating, body }),
    onSuccess: () => {
      setOpen(false);
      setBody('');
      notify(dict.common.save, 'success');
      client.invalidateQueries({ queryKey: ['product-reviews'] });
      client.invalidateQueries({ queryKey: ['product'] });
    },
    onError: (error: Error) => notify(error.message, 'error'),
  });

  if (!isAuthenticated) {
    return <p className="text-[12.5px] text-ink-soft">{dict.auth.loginTitle} &rarr; {dict.product.writeReview}</p>;
  }

  if (!open) {
    return (
      <Button variant="outline" size="md" onClick={() => setOpen(true)}>
        {dict.product.writeReview}
      </Button>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (body.trim().length < 5) {
          notify(dict.validation.minLength, 'error');
          return;
        }
        mutation.mutate();
      }}
      className="flex flex-col gap-3"
    >
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            aria-label={`${star}`}
            className={cn('transition-colors duration-fast', star <= rating ? 'text-gold' : 'text-line')}
          >
            <StarIcon className="h-5 w-5" />
          </button>
        ))}
      </div>

      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={3}
        maxLength={3000}
        className="w-full resize-y rounded-card border border-line bg-white px-3 py-2.5 text-[13px] leading-relaxed outline-none transition-colors duration-fast focus:border-brand"
      />

      <div className="flex gap-2">
        <Button type="submit" size="md" loading={mutation.isPending}>
          {dict.common.save}
        </Button>
        <Button type="button" variant="ghost" size="md" onClick={() => setOpen(false)}>
          {dict.common.cancel}
        </Button>
      </div>
    </form>
  );
}

/** Product Q&A composer, including the reference's "secret question" toggle. */
export function InquiryForm({ productId, dict }: { productId: string; dict: Dictionary }) {
  const { isAuthenticated } = useSession();
  const client = useQueryClient();
  const notify = useUiStore((s) => s.notify);

  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSecret, setIsSecret] = useState(false);

  const mutation = useMutation({
    mutationFn: () => catalogApi.createInquiry({ product: productId, topic: 'product', subject, body, isSecret }),
    onSuccess: () => {
      setOpen(false);
      setSubject('');
      setBody('');
      notify(dict.common.save, 'success');
      client.invalidateQueries({ queryKey: ['product-inquiries'] });
    },
    onError: (error: Error) => notify(error.message, 'error'),
  });

  if (!isAuthenticated) {
    return <p className="text-[12.5px] text-ink-soft">{dict.auth.loginTitle} &rarr; {dict.product.askQuestion}</p>;
  }

  if (!open) {
    return (
      <Button variant="outline" size="md" className="self-start" onClick={() => setOpen(true)}>
        {dict.product.askQuestion}
      </Button>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
      className="flex flex-col gap-3 rounded-tile border border-line p-5"
    >
      <input
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
        placeholder={dict.product.askQuestion}
        maxLength={160}
        className="h-11 w-full rounded-card border border-line px-3 text-[13px] outline-none transition-colors duration-fast focus:border-brand"
      />
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={3}
        maxLength={3000}
        className="w-full resize-y rounded-card border border-line px-3 py-2.5 text-[13px] leading-relaxed outline-none transition-colors duration-fast focus:border-brand"
      />
      <Checkbox
        checked={isSecret}
        onChange={(event) => setIsSecret(event.target.checked)}
        label={dict.product.secretInquiry}
      />
      <div className="flex gap-2">
        <Button type="submit" size="md" loading={mutation.isPending}>
          {dict.common.save}
        </Button>
        <Button type="button" variant="ghost" size="md" onClick={() => setOpen(false)}>
          {dict.common.cancel}
        </Button>
      </div>
    </form>
  );
}
