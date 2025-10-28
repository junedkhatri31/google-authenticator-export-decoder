import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'

type InfoTooltipProps = {
  label: string
  content: ReactNode
  className?: string
}

export function InfoTooltip({ label, content, className }: InfoTooltipProps) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const handlePointer = (event: Event) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointer)
    window.addEventListener('touchstart', handlePointer)
    window.addEventListener('keydown', handleKey)

    return () => {
      window.removeEventListener('mousedown', handlePointer)
      window.removeEventListener('touchstart', handlePointer)
      window.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div ref={containerRef} className={`relative inline-flex ${className ?? ''}`}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={`${id}-tooltip`}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0ea5b9]/20 text-sm font-semibold text-[#055b72] shadow-[0_6px_18px_rgba(6,75,95,0.2)] transition hover:bg-[#0ea5b9]/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c95a1]"
        onClick={() => setOpen((prev) => !prev)}
      >
        ℹ️
      </button>
      {open && (
        <div
          id={`${id}-tooltip`}
          role="tooltip"
          className="absolute left-1/2 z-30 mt-3 w-72 -translate-x-1/2 rounded-2xl bg-white p-4 text-xs font-medium leading-relaxed text-[#053546] shadow-[0_20px_35px_rgba(6,60,78,0.2)]"
        >
          {content}
        </div>
      )}
    </div>
  )
}
