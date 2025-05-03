
import { type LucideIcon } from "lucide-react"
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Circle,
  Copy,
  CreditCard,
  File,
  FileText,
  Github,
  Loader2,
  LucideProps,
  Moon,
  MoreVertical,
  Pizza,
  Plus,
  Settings,
  SunMedium,
  Trash,
  User,
  X,
} from "lucide-react"

export type Icon = LucideIcon

export const Icons = {
  // Lucide icons
  arrowRight: ArrowRight,
  chevronRight: ChevronRight,
  circle: Circle,
  check: CheckCircle2,
  copy: Copy,
  close: X,
  ellipsis: MoreVertical,
  file: File,
  fileText: FileText,
  gitHub: Github,
  loader: Loader2,
  moon: Moon,
  payment: CreditCard,
  pizza: Pizza,
  plus: Plus,
  settings: Settings,
  sun: SunMedium,
  trash: Trash,
  user: User,
  
  // Customize additional icons here
  custom: ({ ...props }: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      stroke="currentColor"
      fill="none"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 5v14M5 12h14"
      />
    </svg>
  ),
}
