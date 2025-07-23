import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UseFormRegister, FieldErrors } from "react-hook-form"
import { FormData } from "@/types/project-proposal.types"

interface ProductInformationCardProps {
  isEditing: boolean
  register: UseFormRegister<FormData>
  errors: FieldErrors<FormData>
  watchedData: FormData
}

export function ProductInformationCard({
  isEditing,
  register,
  errors,
  watchedData
}: ProductInformationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-lg">💰</span>
          Product Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-gray-500">Product Name</Label>
              {isEditing ? (
                <Input
                  {...register("productName")}
                  className="mt-1"
                  placeholder="Enter product name"
                />
              ) : (
                <p className="text-gray-900 mt-1">{watchedData.productName}</p>
              )}
              {errors.productName && (
                <p className="text-red-500 text-sm mt-1">{errors.productName.message}</p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Current Cost</Label>
              {isEditing ? (
                <Input
                  {...register("currentCost")}
                  className="mt-1"
                  placeholder="Enter current cost"
                />
              ) : (
                <p className="text-gray-900 font-semibold mt-1">{watchedData.currentCost}</p>
              )}
              {errors.currentCost && (
                <p className="text-red-500 text-sm mt-1">{errors.currentCost.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-gray-500">Category</Label>
              {isEditing ? (
                <Input
                  {...register("category")}
                  className="mt-1"
                  placeholder="Enter category"
                />
              ) : (
                <p className="text-gray-900 mt-1">{watchedData.category}</p>
              )}
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
              )}
            </div>
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-500">Existing Formulation</Label>
          {isEditing ? (
            <Textarea
              {...register("formulation")}
              className="mt-1"
              placeholder="Enter formulation details"
              rows={3}
            />
          ) : (
            <p className="text-gray-900 mt-1">{watchedData.formulation}</p>
          )}
          {errors.formulation && (
            <p className="text-red-500 text-sm mt-1">{errors.formulation.message}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}