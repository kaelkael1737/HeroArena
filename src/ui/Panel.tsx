import type { ReactNode } from 'react'

export function Panel({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-neutral-800 bg-neutral-900/50 p-4 ${className}`}>
      {title && <h2 className="mb-3 text-lg font-semibold text-neutral-100">{title}</h2>}
      {children}
    </div>
  )
}

export function Button({
  children,
  onClick,
  disabled,
  variant = 'primary',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
}) {
  const styles = {
    primary: 'bg-amber-500 text-neutral-950 hover:bg-amber-400',
    secondary: 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700',
    danger: 'bg-red-600 text-white hover:bg-red-500',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]}`}
    >
      {children}
    </button>
  )
}
