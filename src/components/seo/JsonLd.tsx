import type { ReactElement } from 'react';

/** JSON-LD block with `<` escaped so content strings can never close the script tag. */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }): ReactElement {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
