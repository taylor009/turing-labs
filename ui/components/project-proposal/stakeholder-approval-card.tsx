import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Users, Plus, X, Clock } from "lucide-react"
import { UseFormRegister, UseFieldArrayReturn } from "react-hook-form"
import { FormData, Stakeholder } from "@/types/project-proposal.types"
import { StakeholderStatus } from "./stakeholder-status"

interface StakeholderApprovalCardProps {
  isEditing: boolean
  register: UseFormRegister<FormData>
  stakeholders: UseFieldArrayReturn<FormData, "stakeholders">
  watchedData: Stakeholder[]
}

export function StakeholderApprovalCard({
  isEditing,
  register,
  stakeholders,
  watchedData
}: StakeholderApprovalCardProps) {
  const { fields, append, remove } = stakeholders

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Stakeholder Approval
          </div>
          {isEditing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: "", role: "", status: "pending" })}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Stakeholder
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3 flex-1">
              {isEditing ? (
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <Input
                    {...register(`stakeholders.${index}.name`)}
                    placeholder="Email address"
                  />
                  <Input
                    {...register(`stakeholders.${index}.role`)}
                    placeholder="Role"
                  />
                </div>
              ) : (
                <div>
                  <p className="font-medium text-gray-900">{watchedData[index]?.name || ""}</p>
                  <p className="text-sm text-gray-500">{watchedData[index]?.role || ""}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <StakeholderStatus 
                status={watchedData[index]?.status || "pending"} 
                showIcon={!isEditing}
              />
              {isEditing && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {!isEditing && (
          <>
            <Separator />
            <Button variant="outline" className="w-full bg-transparent">
              <Users className="h-4 w-4 mr-2" />
              Add Stakeholder for Approval
            </Button>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Waiting for stakeholder approvals. You can proceed with project setup or wait for all approvals.
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}