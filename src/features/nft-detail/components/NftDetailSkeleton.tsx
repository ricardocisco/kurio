import { Skeleton } from '@/shared/ui/skeleton';

export function NftDetailSkeleton() {
  return (
    <div className="container-content flex flex-col gap-8 py-4 md:py-6" aria-busy="true">
      <p className="sr-only" role="status">
        Carregando NFT…
      </p>
      <Skeleton className="hidden h-4 w-48 md:block" />
      <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
        <div className="grid gap-4 md:grid-cols-[4.5rem_1fr] lg:grid-cols-[6.25rem_1fr] lg:gap-6">
          <div className="hidden flex-col gap-4 md:flex">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="aspect-square w-full rounded-sm" />
            ))}
          </div>
          <div className="rounded-2xl bg-card md:rounded-sm md:p-6">
            <Skeleton className="aspect-square w-full rounded-2xl md:rounded-xl" />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-1/2" />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-full max-w-md" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-28 w-2/3" />
      </div>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton
              key={index}
              className="aspect-[4/5] shrink-0 basis-[45%] sm:basis-[30%] md:basis-[calc((100%-4rem)/5)]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
