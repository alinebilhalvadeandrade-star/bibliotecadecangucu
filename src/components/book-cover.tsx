import { cn } from '@/lib/utils'

/** Capa tipográfica gerada a partir da cor de cada livro. */
export function BookCover({
  title,
  author,
  color,
  size = 'md',
  className,
}: {
  title: string
  author: string
  color: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const light = isLight(color)
  return (
    <div
      aria-hidden
      className={cn(
        'book-cover relative flex aspect-[2/3] flex-col justify-between overflow-hidden rounded-r-md rounded-l-sm shadow-[4px_6px_14px_-4px_rgb(0_0_0/0.35)]',
        size === 'sm' && 'w-12 p-1.5',
        size === 'md' && 'w-full p-3',
        size === 'lg' && 'w-full max-w-64 p-5',
        light ? 'text-[#2a2a24]' : 'text-[#f5efe0]',
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {size !== 'sm' && (
        <>
          <div className="space-y-2 pl-2">
            <div className={cn('h-px w-8 opacity-60', light ? 'bg-black' : 'bg-white')} />
            <p
              className={cn(
                'font-display leading-tight font-semibold text-balance',
                size === 'lg' ? 'text-2xl' : 'text-base',
              )}
            >
              {title}
            </p>
          </div>
          <p
            className={cn(
              'pl-2 tracking-wide uppercase opacity-80',
              size === 'lg' ? 'text-xs' : 'text-[0.6rem]',
            )}
          >
            {author}
          </p>
        </>
      )}
    </div>
  )
}

function isLight(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return (r * 299 + g * 587 + b * 114) / 1000 > 170
}
