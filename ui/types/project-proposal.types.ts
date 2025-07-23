import * as z from "zod"

export const businessObjectiveSchema = z.object({
  text: z.string().min(1, "Objective is required"),
  checked: z.boolean().default(true)
})

export const stakeholderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  status: z.enum(["approved", "pending", "changes-requested"])
})

export const constraintSchema = z.object({
  id: z.string(),
  text: z.string().min(1, "Constraint text is required"),
  category: z.string().min(1, "Category is required")
})

export const constraintCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  constraints: z.array(constraintSchema).default([])
})

export const formSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  currentCost: z.string().min(1, "Current cost is required"),
  category: z.string().min(1, "Category is required"),
  formulation: z.string().min(1, "Formulation is required"),
  businessObjectives: z.array(businessObjectiveSchema),
  constraints: z.array(constraintCategorySchema).default([]),
  acceptableChanges: z.array(z.string()),
  notAcceptableChanges: z.array(z.string()),
  feasibilityLimits: z.array(z.string()),
  stakeholders: z.array(stakeholderSchema)
})

export type FormData = z.infer<typeof formSchema>
export type BusinessObjective = z.infer<typeof businessObjectiveSchema>
export type Stakeholder = z.infer<typeof stakeholderSchema>
export type Constraint = z.infer<typeof constraintSchema>
export type ConstraintCategory = z.infer<typeof constraintCategorySchema>
export type StakeholderStatus = "approved" | "pending" | "changes-requested"