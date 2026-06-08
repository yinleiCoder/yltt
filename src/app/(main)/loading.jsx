export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-32">
      <div className="animate-pulse space-y-12">
        {/* Hero skeleton */}
        <div className="max-w-2xl space-y-4 mx-auto text-center">
          <div className="h-6 w-24 bg-stone-200 rounded-lg mx-auto" />
          <div className="h-10 w-48 bg-stone-200 rounded-lg mx-auto" />
          <div className="h-5 w-64 bg-stone-100 rounded-lg mx-auto" />
          <div className="flex gap-3 justify-center pt-2">
            <div className="h-12 w-32 bg-stone-200 rounded-xl" />
            <div className="h-12 w-32 bg-stone-100 rounded-xl" />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-3xl mx-auto">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-stone-100 rounded-xl p-4 space-y-2">
              <div className="h-3 w-12 bg-stone-200 rounded" />
              <div className="h-7 w-16 bg-stone-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
