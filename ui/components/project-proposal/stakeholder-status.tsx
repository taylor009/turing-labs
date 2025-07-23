import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, XCircle } from "lucide-react"
import { StakeholderStatus as StakeholderStatusType } from "@/types/project-proposal.types"

interface StakeholderStatusProps {
  status: StakeholderStatusType
  showIcon?: boolean
}

export function StakeholderStatus({ status, showIcon = true }: StakeholderStatusProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "changes-requested":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusBadge = () => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending Review
          </Badge>
        )
      case "changes-requested":
        return <Badge variant="destructive">Changes Requested</Badge>
      default:
        return null
    }
  }

  return (
    <div className="flex items-center gap-2">
      {showIcon && getStatusIcon()}
      {getStatusBadge()}
    </div>
  )
}