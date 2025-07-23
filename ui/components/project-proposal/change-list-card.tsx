import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle, XCircle, Plus, X } from "lucide-react"
import { UseFormRegister, UseFieldArrayReturn } from "react-hook-form"
import { FormData } from "@/types/project-proposal.types"

interface ChangeListCardProps {
  title: string
  type: "acceptable" | "notAcceptable"
  isEditing: boolean
  register: UseFormRegister<FormData>
  fieldArray: UseFieldArrayReturn<FormData, "acceptableChanges" | "notAcceptableChanges">
  watchedData: string[]
}

export function ChangeListCard({
  title,
  type,
  isEditing,
  register,
  fieldArray,
  watchedData
}: ChangeListCardProps) {
  const { fields, append, remove } = fieldArray
  const isAcceptable = type === "acceptable"
  const fieldName = isAcceptable ? "acceptableChanges" : "notAcceptableChanges"
  const Icon = isAcceptable ? CheckCircle : XCircle
  const iconColor = isAcceptable ? "text-green-600" : "text-red-600"
  const titleColor = isAcceptable ? "text-green-700" : "text-red-700"

  return (
    <Card>
      <CardHeader>
        <CardTitle className={`${titleColor} flex items-center justify-between`}>
          {title}
          {isEditing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append("")}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
              <Icon className={`h-4 w-4 ${iconColor} mt-0.5 flex-shrink-0`} />
              {isEditing ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    {...register(`${fieldName}.${index}` as any)}
                    placeholder={`Enter ${isAcceptable ? 'acceptable' : 'not acceptable'} change`}
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