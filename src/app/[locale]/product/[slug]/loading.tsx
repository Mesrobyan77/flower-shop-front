export default function ProductLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading product"
      className="mx-auto w-full max-w-[1292px] animate-pulse px-4 py-6 lg:py-10"
    >
      <div className="h-4 w-40 rounded bg-surface-soft" />

      <header className="mt-8 text-center lg:mt-12">
        <div className="mx-auto h-8 w-64 max-w-full rounded bg-surface-soft" />
        <div className="mx-auto mt-3 h-4 w-96 max-w-full rounded bg-surface-soft" />
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="aspect-square rounded-[24px] bg-surface-soft" />
        <div className="flex flex-col gap-5">
          <div className="h-12 w-40 rounded bg-surface-soft" />
          <div className="h-20 rounded bg-surface-soft" />
          <div className="h-40 rounded bg-surface-soft" />
          <div className="h-12 rounded bg-surface-soft" />
        </div>
      </div>
    </main>
  );
}