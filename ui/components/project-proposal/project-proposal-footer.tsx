import { Button } from "@/components/ui/button"
import { ArrowLeft, MessageSquare, CheckSquare, Save, Loader2 } from "lucide-react"

interface ProjectProposalFooterProps {
  isEditing: boolean
  isSubmitting?: boolean
  onCancel: () => void
}

export function ProjectProposalFooter({ isEditing, isSubmitting = false, onCancel }: ProjectProposalFooterProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-200">
      <Button variant="ghost" className="flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Edge Cases
      </Button>

      <div className="flex gap-3">
        {isEditing ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <MessageSquare className="h-4 w-4" />
              Edit with Agent
            </Button>
            <Button type="submit" className="flex items-center gap-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4" />
                  Submit Proposal
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}