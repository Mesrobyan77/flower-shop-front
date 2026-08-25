import { API_URL } from '@/lib/api/client';

/**
 * Shown when the storefront renders but the API returned nothing.
 *
 * Every server fetch degrades to null/empty so one dead endpoint cannot take the
 * page down - but that also means an unreachable API looks identical to an empty
 * catalogue: a blank page with no explanation. This says which one it is.
 *
 * In development it names the exact commands; in production it stays generic.
 */
export function ApiOffline({ message }: { message?: string }) {
  const isDev = process.env.NODE_ENV !== 'production';

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 pb-20 pt-[170px] lg:pt-[210px]">
      <div className="w-full max-w-[560px] rounded-tile border border-line bg-surface-soft p-8 text-center">
        <p className="text-[15px] font-semibold text-ink-strong">
          {message ?? 'Store data is unavailable right now.'}
        </p>

        {isDev ? (
          <>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
              The storefront reached <code className="text-ink">{API_URL}</code> but got no data back.
              The API is probably not running, or it is running with an empty database.
            </p>

            <div className="mt-5 rounded-card border border-line bg-white p-4 text-left">
              <p className="mb-2 text-[12px] font-semibold text-ink-strong">Start the API first:</p>
              <pre className="overflow-x-auto text-[12px] leading-relaxed text-ink-muted">
{`cd backend
npm run dev:memory`}
              </pre>
              <p className="mb-2 mt-4 text-[12px] font-semibold text-ink-strong">
                Then the storefront, in a second terminal:
              </p>
              <pre className="overflow-x-auto text-[12px] leading-relaxed text-ink-muted">
{`cd frontend
npm run dev`}
              </pre>
            </div>

            <p className="mt-4 text-[12px] leading-relaxed text-ink-soft">
              Already running and still empty? The API may be holding the port with a dead
              database - stop it and start it again so it reseeds.
            </p>
          </>
        ) : (
          <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
            Please try again in a moment.
          </p>
        )}
      </div>
    </div>
  );
}
