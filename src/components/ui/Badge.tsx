import { cn } from '@/lib/utils'
interface Props {
  children: React.ReactNode
  variant?: 'green' | 'red' | 'amber' | 'blue' | 'gray'
}
const variants = {
  green: 'badge-green',
  red:   'badge-red',
  amber: 'badge-amber',
  blue:  'badge-blue',
  gray:  'badge-gray',
}
export function Badge({ children, variant = 'gray' }: Props) {
  return <span className={cn('badge', variants[variant])}>{children}</span>
}
