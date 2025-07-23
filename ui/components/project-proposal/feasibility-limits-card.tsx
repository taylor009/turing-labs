import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Plus, X } from "lucide-react"
import { UseFormRegister, UseFieldArrayReturn } from "react-hook-form"
import { FormData } from "@/types/project-proposal.types"

interface FeasibilityLimitsCardProps {
  isEditing: boolean
  register: UseFormRegister<FormData>
  feasibilityLimits: UseFieldArrayReturn<FormData, "feasibilityLimits">
  watchedData: string[]
}

export function FeasibilityLimitsCard({
  isEditing,
  register,
  feasibilityLimits,
  watchedData
}: FeasibilityLimitsCardProps) {
  const { fields, append, remove } = feasibilityLimits

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Feasibility Limits
          {isEditing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append("")}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Limit
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center space-x-3">
              <Checkbox checked readOnly />
              {isEditing ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    {...register(`feasibilityLimits.${index}`)}
                    placeholder="Enter feasibility limit"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <span className="text-gray-700">{watchedData[index] || ""}</span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}