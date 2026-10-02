'use client';

import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { defaultLocale, getDictionary } from '@/lib/i18n';
import { adminApi, type MediaItem } from '@/lib/api/admin';
import { useApiError } from '@/lib/hooks/useApiError';
import { qk } from '@/lib/queryKeys';
import { useUiStore } from '@/store/ui';
import { ConfirmDialog, Modal } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Feedback';
import { PlusIcon, TrashIcon } from '@/components/ui/Icons';

/**
 * Uploads land in Cloudinary through the API; Mongo only stores the public id and
 * the public URL. The picker reuses already-uploaded files so an image is not
 * duplicated across products.
 */
export function MediaPicker({
  value,
  onChange,
  multiple,
  folder = 'products',
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  folder?: string;
}) {
  const dict = getDictionary(defaultLocale);
  const [open, setOpen] = useState(false);

  const remove = (url: string) => onChange(value.filter((item) => item !== url));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {value.map((url) => (
          <div key={url} className="group relative h-24 w-24 overflow-hidden rounded-card border border-line">
            <Image src={url} alt="" fill sizes="96px" className="object-cover" />
            <button
              type="button"
              onClick={() => remove(url)}
              aria-label={dict.common.delete}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-ink-soft opacity-0 transition-opacity group-hover:opacity-100 hover:text-danger-soft"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {(multiple || value.length === 0) && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-card border border-dashed border-line-strong text-ink-faint transition-colors duration-fast hover:border-brand hover:text-brand"
          >
            <PlusIcon className="h-5 w-5" />
            <span className="text-[10px]">{dict.admin.uploadImage}</span>
          </button>
        )}
      </div>

      <MediaLibrary
        open={open}
        folder={folder}
        onClose={() => setOpen(false)}
        onPick={(url) => {
          onChange(multiple ? [...value, url] : [url]);
          if (!multiple) setOpen(false);
        }}
      />
    </div>
  );
}

export function MediaLibrary({
  open,
  onClose,
  onPick,
  folder = 'products',
}: {
  open: boolean;
  onClose: () => void;
  onPick?: (url: string) => void;
  folder?: string;
}) {
  const dict = getDictionary(defaultLocale);
  const client = useQueryClient();
  const notify = useUiStore((s) => s.notify);
  const showApiError = useApiError();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [toDelete, setToDelete] = useState<MediaItem | null>(null);

  const params = { page: 1, folder };
  const { data, isLoading } = useQuery({
    queryKey: qk.adminMedia(params),
    queryFn: () => adminApi.media(params),
    enabled: open,
  });

  const upload = useMutation({
    mutationFn: (files: File[]) => adminApi.uploadMedia(files, folder),
    onSuccess: (result) => {
      client.invalidateQueries({ queryKey: ['admin-media'] });
      const first = Array.isArray(result) ? result[0] : result;
      if (first && onPick) onPick(first.url);
      notify(dict.common.save, 'success');
    },
    onError: (error: Error) => showApiError(error),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteMedia(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['admin-media'] });
      notify(dict.common.delete, 'success');
    },
    onError: (error: Error) => showApiError(error),
  });

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    upload.mutate(Array.from(files));
  };

  return (
    <Modal open={open} onClose={onClose} title={dict.admin.media} size="lg">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-tile border border-dashed px-6 py-8 text-center transition-colors duration-fast',
          dragging ? 'border-brand bg-brand-50/40' : 'border-line-strong hover:border-brand',
        )}
      >
        <PlusIcon className="h-6 w-6 text-ink-faint" />
        <p className="text-[12.5px] text-ink-muted">{dict.admin.dropHere}</p>
        {upload.isPending && <p className="text-[11.5px] text-brand">{dict.common.loading}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>

      <div className="mt-5">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {(data?.items ?? []).map((item: MediaItem) => (
              <li key={item.id} className="group relative aspect-square overflow-hidden rounded-card border border-line">
                <button type="button" onClick={() => onPick?.(item.url)} className="block h-full w-full">
                  <Image src={item.url} alt={item.originalName} fill sizes="160px" className="object-cover" />
                </button>
                <button
                  type="button"
                  onClick={() => setToDelete(item)}
                  aria-label={dict.common.delete}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-ink-soft opacity-0 transition-opacity group-hover:opacity-100 hover:text-danger-soft"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5 flex justify-end">
        <Button variant="outline" size="md" onClick={onClose}>
          {dict.common.close}
        </Button>
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={dict.common.delete}
        message={toDelete ? toDelete.originalName : ''}
        confirmLabel={dict.common.delete}
        cancelLabel={dict.common.cancel}
        tone="danger"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) remove.mutate(toDelete.id);
          setToDelete(null);
        }}
      />
    </Modal>
  );
}
