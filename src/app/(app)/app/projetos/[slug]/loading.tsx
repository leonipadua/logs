import { Skeleton } from "@/components/ui/skeleton";

export default function ProjetoLoading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
      <Skeleton className="h-9 w-72" />
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-1.5 w-full" />
      <div className="flex flex-col gap-4 pt-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
