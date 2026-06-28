// app/components/LoadingSpinner.tsx
// Shared loading and empty state components

export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">{message}</p>
      </div>
    </div>
  );
}

export function LoadingCard({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm">{message}</p>
      </div>
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We had trouble loading this page. Please try again.',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 text-sm mb-6">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-2xl text-sm font-medium hover:bg-emerald-700 transition"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
  onAction,
}: {
  icon: string;
  title: string;
  message: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">{icon}</div>
        <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 text-sm mb-6">{message}</p>
        {action && onAction && (
          <button
            onClick={onAction}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-2xl text-sm font-medium hover:bg-emerald-700 transition"
          >
            {action}
          </button>
        )}
      </div>
    </div>
  );
}

// Skeleton loader for deal rows
export function DealRowSkeleton() {
  return (
    <div className="px-8 py-5 flex items-center gap-5 animate-pulse">
      <div className="w-8 h-5 bg-slate-200 rounded" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-32" />
        <div className="h-3 bg-slate-100 rounded w-48" />
      </div>
      <div className="h-6 w-20 bg-slate-200 rounded-full" />
      <div className="text-right space-y-1">
        <div className="h-4 w-12 bg-slate-200 rounded" />
        <div className="h-3 w-8 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

// Skeleton for stat cards
export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl shadow p-6 animate-pulse">
      <div className="h-3 bg-slate-200 rounded w-20 mb-3" />
      <div className="h-8 bg-slate-200 rounded w-12" />
    </div>
  );
}

