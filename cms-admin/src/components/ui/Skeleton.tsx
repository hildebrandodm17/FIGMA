import { cn } from '../../utils/cn'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('bg-[#2A2A2A] animate-pulse rounded', className)}
      aria-hidden="true"
    />
  )
}
