import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Plus, 
  X, 
  GripVertical, 
  Edit3, 
  Check, 
  AlertCircle, 
  Undo2, 
  Target,
  ChevronRight 
} from "lucide-react"
import { UseFormRegister, UseFieldArrayReturn, UseFormSetValue } from "react-hook-form"
import { FormData, BusinessObjective } from "@/types/project-proposal.types"
import { useState, useCallback } from "react"

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface BusinessObjectivesCardProps {
  isEditing: boolean
  register: UseFormRegister<FormData>
  businessObjectives: UseFieldArrayReturn<FormData, "businessObjectives">
  watchedData: FormData
  setValue: UseFormSetValue<FormData>
}

// Types for undo functionality
type UndoAction = {
  type: 'remove'
  index: number
  objective: BusinessObjective
} | {
  type: 'reorder'
  fromIndex: number
  toIndex: number
}

// Enhanced sortable item component
interface SortableObjectiveItemProps {
  objective: BusinessObjective & { id: string }
  index: number
  isEditing: boolean
  register: UseFormRegister<FormData>
  watchedData: FormData
  onRemove: () => void
  onToggle: (checked: boolean) => void
  onUpdate: (objective: Partial<BusinessObjective>) => void
}

function SortableObjectiveItem({
  objective,
  index,
  isEditing,
  register,
  watchedData,
  onRemove,
  onToggle,
  onUpdate
}: SortableObjectiveItemProps) {
  const [isEditingText, setIsEditingText] = useState(false)
  const [editValue, setEditValue] = useState(objective.text)
  const [validationError, setValidationError] = useState<string | null>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: objective.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleStartEdit = () => {
    setIsEditingText(true)
    setEditValue(watchedData.businessObjectives?.[index]?.text || '')
    setValidationError(null)
  }

  const handleSaveEdit = () => {
    if (!editValue.trim()) {
      setValidationError('Objective cannot be empty')
      return
    }
    if (editValue.length > 200) {
      setValidationError('Objective must be less than 200 characters')
      return
    }
    
    onUpdate({ text: editValue.trim() })
    setIsEditingText(false)
    setValidationError(null)
  }

  const handleCancelEdit = () => {
    setIsEditingText(false)
    setEditValue(objective.text)
    setValidationError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSaveEdit()
    }
    if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative bg-white rounded-lg border border-gray-200 p-4 mb-3
        transition-all duration-200 ease-in-out
        ${isDragging ? 'opacity-50 shadow-lg scale-105' : 'hover:shadow-md'}
        ${!isEditing && !objective.checked ? 'opacity-60' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        {isEditing && (
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 p-1 cursor-grab active:cursor-grabbing
                     text-gray-400 hover:text-gray-600 touch-manipulation"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}

        {/* Checkbox */}
        <div className="flex-shrink-0 pt-0.5">
          <Checkbox
            checked={watchedData.businessObjectives?.[index]?.checked ?? true}
            onCheckedChange={onToggle}
            disabled={!isEditing}
            className="transition-all duration-200"
          />
        </div>

        {/* Objective Content */}
        <div className="flex-1 min-w-0">
          {isEditingText ? (
            <div className="space-y-2">
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your business objective..."
                className={`min-h-[60px] resize-none ${
                  validationError ? 'border-red-500 focus-visible:ring-red-500' : ''
                }`}
                autoFocus
              />
              {validationError && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {validationError}
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleSaveEdit}
                  className="h-8"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="h-8"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="group/text relative">
              <p className={`
                text-sm leading-relaxed
                ${!objective.checked ? 'line-through text-gray-500' : 'text-gray-900'}
                ${!objective.text ? 'text-gray-400 italic' : ''}
              `}>
                {objective.text || 'Click to add objective text...'}
              </p>
              {isEditing && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleStartEdit}
                  className="absolute -right-1 -top-1 opacity-0 group-hover/text:opacity-100
                           transition-opacity duration-200 h-6 w-6 p-0"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {isEditing && !isEditingText && (
          <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100
                         transition-opacity duration-200">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Priority Indicator */}
      {objective.checked && (
        <div className="absolute -left-1 top-4 w-2 h-2 bg-blue-500 rounded-full opacity-80" />
      )}
    </div>
  )
}

export function BusinessObjectivesCard({
  isEditing,
  register,
  businessObjectives,
  watchedData,
  setValue
}: BusinessObjectivesCardProps) {
  const { fields, append, remove, update, move } = businessObjectives
  const [undoStack, setUndoStack] = useState<UndoAction[]>([])
  const [showUndo, setShowUndo] = useState(false)

  // Configure drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Add a new objective
  const handleAddObjective = useCallback(() => {
    append({ text: "", checked: true })
  }, [append])

  // Remove objective with undo functionality
  const handleRemoveObjective = useCallback((index: number) => {
    const objective = watchedData.businessObjectives[index]
    if (objective) {
      setUndoStack(prev => [{
        type: 'remove',
        index,
        objective
      }, ...prev.slice(0, 4)]) // Keep last 5 actions
      
      remove(index)
      setShowUndo(true)
      setTimeout(() => setShowUndo(false), 5000) // Hide undo after 5 seconds
    }
  }, [remove, watchedData.businessObjectives])

  // Toggle objective completion
  const handleToggleObjective = useCallback((index: number, checked: boolean) => {
    update(index, {
      ...watchedData.businessObjectives[index],
      checked: !!checked
    })
  }, [update, watchedData.businessObjectives])

  // Update objective text
  const handleUpdateObjective = useCallback((index: number, updates: Partial<BusinessObjective>) => {
    update(index, {
      ...watchedData.businessObjectives[index],
      ...updates
    })
  }, [update, watchedData.businessObjectives])

  // Handle drag end for reordering
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex(field => field.id === active.id)
      const newIndex = fields.findIndex(field => field.id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // Add to undo stack
        setUndoStack(prev => [{
          type: 'reorder',
          fromIndex: oldIndex,
          toIndex: newIndex
        }, ...prev.slice(0, 4)])
        
        // Reorder the fields
        move(oldIndex, newIndex)
        setShowUndo(true)
        setTimeout(() => setShowUndo(false), 5000)
      }
    }
  }, [fields, move])

  // Undo last action
  const handleUndo = useCallback(() => {
    const lastAction = undoStack[0]
    if (!lastAction) return

    if (lastAction.type === 'remove') {
      // Re-insert the removed objective
      append(lastAction.objective)
      // Move it to the original position if needed
      const newIndex = fields.length
      if (lastAction.index < newIndex) {
        move(newIndex, lastAction.index)
      }
    } else if (lastAction.type === 'reorder') {
      // Reverse the reorder
      move(lastAction.toIndex, lastAction.fromIndex)
    }

    setUndoStack(prev => prev.slice(1))
    setShowUndo(false)
  }, [undoStack, append, move, fields.length])

  // Get objectives with IDs for drag and drop
  const objectivesWithIds = fields.map((field, index) => ({
    ...watchedData.businessObjectives[index],
    id: field.id
  }))

  const completedCount = watchedData.businessObjectives?.filter(obj => obj?.checked).length || 0
  const totalCount = watchedData.businessObjectives?.length || 0

  return (
    <Card className="relative overflow-hidden">
      {/* Undo notification */}
      {showUndo && undoStack.length > 0 && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-blue-50 border-b border-blue-200 p-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-800">
              {undoStack[0].type === 'remove' ? 'Objective removed' : 'Objectives reordered'}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              className="h-6 text-blue-600 hover:text-blue-800"
            >
              <Undo2 className="h-3 w-3 mr-1" />
              Undo
            </Button>
          </div>
        </div>
      )}

      <CardHeader className={showUndo ? 'pt-12' : ''}>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span>Business Objectives</span>
            </div>
            {totalCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {completedCount} of {totalCount} active
              </Badge>
            )}
          </div>
          {isEditing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddObjective}
              className="hover:bg-blue-50 hover:border-blue-300"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Objective
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {objectivesWithIds.length === 0 ? (
          // Empty state
          <div className="text-center py-12 px-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Target className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No objectives yet</h3>
            <p className="text-gray-500 mb-4 max-w-sm mx-auto">
              {isEditing 
                ? "Start by adding your first business objective to define what you want to achieve."
                : "No business objectives have been defined for this proposal."
              }
            </p>
            {isEditing && (
              <Button
                type="button"
                onClick={handleAddObjective}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Objective
              </Button>
            )}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={objectivesWithIds.map(obj => obj.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-0">
                {objectivesWithIds.map((objective, index) => (
                  <SortableObjectiveItem
                    key={objective.id}
                    objective={objective}
                    index={index}
                    isEditing={isEditing}
                    register={register}
                    watchedData={watchedData}
                    onRemove={() => handleRemoveObjective(index)}
                    onToggle={(checked) => handleToggleObjective(index, checked)}
                    onUpdate={(updates) => handleUpdateObjective(index, updates)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Instructions for drag and drop */}
        {isEditing && objectivesWithIds.length > 1 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 flex items-center">
              <ChevronRight className="h-4 w-4 mr-1" />
              Drag the grip handle to reorder objectives, or click to edit text inline.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}