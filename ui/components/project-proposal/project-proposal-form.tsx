"use client"

import { useProjectProposalForm } from "@/hooks/use-project-proposal-form"
import { ProjectProposalHeader } from "./project-proposal-header"
import { ProductInformationCard } from "./product-information-card"
import { BusinessObjectivesCard } from "./business-objectives-card"
import { ConstraintsManagementCard } from "./constraints-management-card"
import { ChangeListCard } from "./change-list-card"
import { FeasibilityLimitsCard } from "./feasibility-limits-card"
import { StakeholderApprovalCard } from "./stakeholder-approval-card"
import { ProjectProposalFooter } from "./project-proposal-footer"

export function ProjectProposalForm() {
  const {
    form,
    isEditing,
    isSubmitting,
    watchedData,
    onSubmit,
    toggleEditing,
    fieldArrays
  } = useProjectProposalForm()

  const { register, handleSubmit, setValue, formState: { errors } } = form
  const {
    businessObjectives,
    constraints,
    acceptableChanges,
    notAcceptableChanges,
    feasibilityLimits,
    stakeholders
  } = fieldArrays

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        <ProjectProposalHeader 
          isEditing={isEditing} 
          onToggleEdit={toggleEditing} 
        />

        <ProductInformationCard
          isEditing={isEditing}
          register={register}
          errors={errors}
          watchedData={watchedData}
        />

        <BusinessObjectivesCard
          isEditing={isEditing}
          register={register}
          businessObjectives={businessObjectives}
          watchedData={watchedData}
          setValue={setValue}
        />

        <ConstraintsManagementCard
          isEditing={isEditing}
          register={register}
          constraints={constraints}
          watchedData={watchedData}
          setValue={setValue}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChangeListCard
            title="Acceptable Changes"
            type="acceptable"
            isEditing={isEditing}
            register={register}
            fieldArray={acceptableChanges}
            watchedData={watchedData.acceptableChanges || []}
          />

          <ChangeListCard
            title="Not Acceptable Changes"
            type="notAcceptable"
            isEditing={isEditing}
            register={register}
            fieldArray={notAcceptableChanges}
            watchedData={watchedData.notAcceptableChanges || []}
          />
        </div>

        <FeasibilityLimitsCard
          isEditing={isEditing}
          register={register}
          feasibilityLimits={feasibilityLimits}
          watchedData={watchedData.feasibilityLimits || []}
        />

        <StakeholderApprovalCard
          isEditing={isEditing}
          register={register}
          stakeholders={stakeholders}
          watchedData={watchedData.stakeholders || []}
        />

        <ProjectProposalFooter
          isEditing={isEditing}
          isSubmitting={isSubmitting}
          onCancel={() => toggleEditing()}
        />
      </div>
    </form>
  )
}