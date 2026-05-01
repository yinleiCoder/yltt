import { cn } from '@/lib/utils'

function Progress({ value, className, ...props }) {
  return (
    <div
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-accent', className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      {...props}
    >
      <div
        className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
        style={{ width: `${Math.min(Math.max(value || 0, 0), 100)}%` }}
      />
    </div>
  )
}

export { Progress }
