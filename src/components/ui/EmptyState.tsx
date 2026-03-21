interface Props {
  icon?: string
  title: string
  description?: string
}
export function EmptyState({ icon = '📭', title, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="font-medium text-gray-700">{title}</p>
      {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
    </div>
  )
}
