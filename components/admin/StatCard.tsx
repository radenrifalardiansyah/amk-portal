import { theme } from '@/lib/admin-theme'

interface StatCardProps {
  title: string
  value: number | string
  icon: string
  change?: string
  changeType?: 'up' | 'down' | 'neutral'
  delay?: string
}

export default function StatCard({ title, value, icon, change, changeType = 'neutral', delay }: StatCardProps) {
  return (
    <div
      className="rounded-2xl admin-fade-up"
      style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        boxShadow: theme.shadowCard,
        padding: '18px 20px',
        animationDelay: delay,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* top accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${theme.accent}, transparent 70%)`,
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: theme.textMuted }}>{title}</p>
          <p style={{ fontSize: 30, fontWeight: 700, color: theme.text, marginTop: 6, lineHeight: 1, fontFamily: theme.fontHeadline }}>
            {value}
          </p>
          {change && (
            <p style={{
              fontSize: 11, marginTop: 8, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 4,
              color: changeType === 'up' ? '#16803D' : changeType === 'down' ? theme.danger : theme.textSecondary,
            }}>
              {changeType === 'up' && <span className="material-symbols-outlined" style={{ fontSize: 13 }}>trending_up</span>}
              {changeType === 'down' && <span className="material-symbols-outlined" style={{ fontSize: 13 }}>trending_down</span>}
              {change}
            </p>
          )}
        </div>
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: theme.accentSoft,
          border: `1px solid ${theme.accentSoftBorder}`,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 21, color: theme.accent, fontVariationSettings: `'FILL' 1, 'wght' 400` }}>
            {icon}
          </span>
        </div>
      </div>
    </div>
  )
}
