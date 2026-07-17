export default function MediaPlaceholder({
  icon = 'image_not_supported',
  label,
  className = '',
}: {
  icon?: string
  label?: string
  className?: string
}) {
  return (
    <div className={`w-full h-full flex flex-col items-center justify-center gap-1.5 bg-surface-container ${className}`}>
      <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">{icon}</span>
      {label && <span className="text-xs font-medium text-on-surface-variant/50">{label}</span>}
    </div>
  )
}
