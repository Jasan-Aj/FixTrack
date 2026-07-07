export default function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-100">
            <div className="h-10 w-10 bg-surface-container rounded-lg mb-4" />
            <div className="h-3 bg-surface-container rounded w-1/2 mb-2" />
            <div className="h-8 bg-surface-container rounded w-1/3" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-slate-100 h-[400px]" />
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-slate-100 h-[400px]" />
      </div>
    </div>
  );
}
