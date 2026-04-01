interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export function SkeletonLine({ className = '', width = '100%' }: SkeletonProps) {
  return (
    <div
      className={`h-3 bg-zinc-800 rounded-full animate-pulse ${className}`}
      style={{ width }}
    />
  );
}

export function SkeletonBox({ className = '', width, height }: SkeletonProps) {
  return (
    <div
      className={`bg-zinc-800 rounded-xl animate-pulse ${className}`}
      style={{ width, height }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
      {/* Author row */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse flex-shrink-0" />
        <div className="space-y-1.5 flex-1">
          <SkeletonLine width="40%" />
          <SkeletonLine width="25%" />
        </div>
      </div>
      {/* Subject pill */}
      <SkeletonLine width="30%" className="h-5 rounded-full" />
      {/* Question */}
      <div className="space-y-2">
        <SkeletonLine width="90%" />
        <SkeletonLine width="75%" />
      </div>
      {/* Action row */}
      <div className="flex gap-4 pt-1">
        <SkeletonLine width={48} className="h-6 rounded-lg" />
        <SkeletonLine width={48} className="h-6 rounded-lg" />
        <SkeletonLine width={48} className="h-6 rounded-lg" />
      </div>
    </div>
  );
}

export function ActivitySkeleton() {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-zinc-800 animate-pulse flex-shrink-0" />
        <div className="space-y-1.5 flex-1">
          <SkeletonLine width="60%" />
          <SkeletonLine width="40%" />
        </div>
        <SkeletonLine width={40} className="h-4 rounded-full" />
      </div>
      <div className="space-y-2 pl-13">
        <SkeletonLine width="85%" />
        <SkeletonLine width="65%" />
      </div>
    </div>
  );
}

export function ExploreCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Card face */}
      <div className="p-4 space-y-3 min-h-[140px]">
        <SkeletonLine width="35%" className="h-5 rounded-full" />
        <div className="space-y-2">
          <SkeletonLine width="90%" />
          <SkeletonLine width="80%" />
          <SkeletonLine width="60%" />
        </div>
      </div>
      {/* Footer */}
      <div className="px-4 py-3 border-t border-zinc-800 flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-zinc-800 animate-pulse flex-shrink-0" />
        <SkeletonLine width="50%" />
        <div className="ml-auto flex gap-2">
          <SkeletonLine width={28} className="h-6 rounded-lg" />
          <SkeletonLine width={28} className="h-6 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-zinc-800 animate-pulse flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <SkeletonLine width="50%" className="h-4" />
          <SkeletonLine width="35%" />
          <SkeletonLine width="70%" className="mt-1" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-1.5">
            <SkeletonLine width="50%" className="mx-auto h-5" />
            <SkeletonLine width="60%" className="mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
