export default function CatalogLoading() {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="h-12 w-64 animate-pulse rounded bg-muted mx-auto" />
          <div className="mt-6 h-6 w-96 animate-pulse rounded bg-muted mx-auto" />
        </div>
        <div className="mt-12">
          <div className="mb-8 flex flex-wrap items-center justify-center gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 w-20 animate-pulse rounded bg-muted" />
            ))}
          </div>
          <div className="mb-8">
            <div className="mx-auto h-10 w-full max-w-md animate-pulse rounded bg-muted" />
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-96 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

