import { getCategoryColor } from '@/lib/utils'

interface CategoryTagProps {
  category: string
}

export default function CategoryTag({ category }: CategoryTagProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-sm border ${getCategoryColor(category)}`}
    >
      {category}
    </span>
  )
}
