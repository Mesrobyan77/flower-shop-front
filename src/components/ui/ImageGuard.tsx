'use client';

import { useEffect } from 'react';

/**
 * Makes catalogue photography awkward to lift: no right-click menu over an
 * image, no drag-to-desktop, no long-press "save image" sheet on touch.
 *
 * This is a deterrent against casual copying, not real protection - anything the
 * browser renders can still be pulled from devtools, the network tab or a
 * screenshot. Watermarking is the only thing that survives that.
 */
export function ImageGuard() {
  useEffect(() => {
    const isProtected = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      return Boolean(target.closest('img, picture, [data-protected-image]'));
    };

    const onContextMenu = (event: MouseEvent) => {
      if (isProtected(event.target)) event.preventDefault();
    };

    const onDragStart = (event: DragEvent) => {
      if (isProtected(event.target)) event.preventDefault();
    };

    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('dragstart', onDragStart);

    return () => {
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('dragstart', onDragStart);
    };
  }, []);

  return null;
}
