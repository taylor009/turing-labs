import { Button } from "@/components/ui/button"
import { Edit2, Save } from "lucide-react"

interface ProjectProposalHeaderProps {
  isEditing: boolean
  onToggleEdit: () => void
}

export function ProjectProposalHeader({ isEditing, onToggleEdit }: ProjectProposalHeaderProps) {
  return (
    <div className="text-center space-y-2">
      <div className="flex items-center justify-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Project Proposal</h1>
        <Button
          type="button"
          variant={isEditing ? "default" : "outline"}
          onClick={onToggleEdit}
          className="flex items-center gap-2"
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          ) : (
            <>
              <Edit2 className="h-4 w-4" />
              Edit Proposal
            </>
          )}
        </Button>
      </div>
      <p className="text-gray-600">Review and edit your comprehensive project proposal.</p>
    </div>
  )
}