'use client';

import { useState } from 'react';
import { defaultLocale, getDictionary } from '@/lib/i18n';
import { AdminPageHeader } from '@/components/admin/AdminShell';
import { MediaLibrary } from '@/components/admin/MediaPicker';
import { Button } from '@/components/ui/Button';

export default function AdminMediaPage() {
  const dict = getDictionary(defaultLocale);
  const [open, setOpen] = useState(true);

  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader
        title={dict.admin.media}
        description={dict.admin.dropHere}
        action={
          <Button size="md" onClick={() => setOpen(true)}>
            {dict.admin.uploadImage}
          </Button>
        }
      />

      <MediaLibrary open={open} onClose={() => setOpen(false)} folder="products" />
    </div>
  );
}
