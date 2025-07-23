"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { 
  Plus, 
  X, 
  Edit3, 
  Check, 
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  FolderOpen,
  Settings,
  Target,
  Package
} from "lucide-react"
import { UseFormRegister, UseFieldArrayReturn, UseFormSetValue } from "react-hook-form"
import { FormData, ConstraintCategory, Constraint } from "@/types/project-proposal.types"
import { useState, useCallback, useMemo } from "react"
import { v4 as uuidv4 } from 'uuid'

interface ConstraintsManagementCardProps {
  isEditing: boolean
  register: UseFormRegister<FormData>
  constraints: UseFieldArrayReturn<FormData, "constraints">
  watchedData: FormData
  setValue: UseFormSetValue<FormData>
}

// Enhanced constraint item component
interface ConstraintItemProps {
  constraint: Constraint
  categoryId: string
  categoryIndex: number
  constraintIndex: number
  isEditing: boolean
  onUpdate: (updates: Partial<Constraint>) => void
  onRemove: () => void
}

function ConstraintItem({
  constraint,
  categoryId,
  categoryIndex,
  constraintIndex,
  isEditing,
  onUpdate,
  onRemove
}: ConstraintItemProps) {
  const [isEditingText, setIsEditingText] = useState(false)
  const [editValue, setEditValue] = useState(constraint.text)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleStartEdit = () => {
    setIsEditingText(true)
    setEditValue(constraint.text)
    setValidationError(null)
  }

  const handleSaveEdit = () => {
    if (!editValue.trim()) {
      setValidationError('Constraint text cannot be empty')
      return
    }
    if (editValue.length > 300) {
      setValidationError('Constraint text must be less than 300 characters')
      return
    }
    
    onUpdate({ text: editValue.trim() })
    setIsEditingText(false)
    setValidationError(null)
  }

  const handleCancelEdit = () => {
    setIsEditingText(false)
    setEditValue(constraint.text)
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
    <div className="group bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-all duration-200">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2 opacity-60" />
        
        <div className="flex-1 min-w-0">
          {isEditingText ? (
            <div className="space-y-2">
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter constraint details..."
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
                  className="h-7"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="h-7"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="group/text relative">
              <p className="text-sm text-gray-700 leading-relaxed pr-8">
                {constraint.text || 'Click to add constraint details...'}
              </p>
              {isEditing && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleStartEdit}
                  className="absolute right-0 top-0 opacity-0 group-hover/text:opacity-100
                           transition-opacity duration-200 h-6 w-6 p-0"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Remove button */}
        {isEditing && !isEditingText && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50
                     opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}

// Enhanced category component
interface CategorySectionProps {
  category: ConstraintCategory
  categoryIndex: number
  isEditing: boolean
  isExpanded: boolean
  onToggleExpanded: () => void
  onUpdateCategory: (updates: Partial<ConstraintCategory>) => void
  onRemoveCategory: () => void
  onAddConstraint: () => void
  onUpdateConstraint: (constraintIndex: number, updates: Partial<Constraint>) => void
  onRemoveConstraint: (constraintIndex: number) => void
  searchTerm: string
}

function CategorySection({
  category,
  categoryIndex,
  isEditing,
  isExpanded,
  onToggleExpanded,
  onUpdateCategory,
  onRemoveCategory,
  onAddConstraint,
  onUpdateConstraint,
  onRemoveConstraint,
  searchTerm
}: CategorySectionProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [categoryName, setCategoryName] = useState(category.name)

  const filteredConstraints = useMemo(() => {
    if (!searchTerm) return category.constraints
    return category.constraints.filter(constraint =>
      constraint.text.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [category.constraints, searchTerm])

  const constraintCount = category.constraints.length
  const visibleCount = filteredConstraints.length

  const handleSaveCategoryName = () => {
    if (categoryName.trim() && categoryName !== category.name) {
      onUpdateCategory({ name: categoryName.trim() })
    }
    setIsEditingName(false)
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-gray-50">
      <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 hover:bg-gray-100 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
              
              {isEditingName ? (
                <Input
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  onBlur={handleSaveCategoryName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveCategoryName()
                    if (e.key === 'Escape') setIsEditingName(false)
                  }}
                  className="h-8 w-48"
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                  <h3 className="font-medium text-gray-900">{category.name}</h3>
                  {isEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsEditingName(true)
                      }}
                      className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs">
                {searchTerm && visibleCount !== constraintCount 
                  ? `${visibleCount} of ${constraintCount}`
                  : `${constraintCount} constraint${constraintCount !== 1 ? 's' : ''}`
                }
              </Badge>
              
              {isEditing && (
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddConstraint()
                    }}
                    className="h-8 text-blue-600 hover:bg-blue-50"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                  
                  {constraintCount === 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveCategory()
                      }}
                      className="h-8 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-4 pb-4">
            {category.description && (
              <p className="text-sm text-gray-600 mb-3 ml-7">
                {category.description}
              </p>
            )}
            
            <div className="ml-7 space-y-2">
              {filteredConstraints.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  {searchTerm ? (
                    <p className="text-sm">No constraints match "{searchTerm}"</p>
                  ) : (
                    <div className="space-y-2">
                      <Package className="h-8 w-8 mx-auto text-gray-400" />
                      <p className="text-sm">No constraints in this category</p>
                      {isEditing && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={onAddConstraint}
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add First Constraint
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                filteredConstraints.map((constraint, constraintIndex) => {
                  const actualIndex = category.constraints.findIndex(c => c.id === constraint.id)
                  return (
                    <ConstraintItem
                      key={constraint.id}
                      constraint={constraint}
                      categoryId={category.id}
                      categoryIndex={categoryIndex}
                      constraintIndex={actualIndex}
                      isEditing={isEditing}
                      onUpdate={(updates) => onUpdateConstraint(actualIndex, updates)}
                      onRemove={() => onRemoveConstraint(actualIndex)}
                    />
                  )
                })
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export function ConstraintsManagementCard({
  isEditing,
  register,
  constraints,
  watchedData,
  setValue
}: ConstraintsManagementCardProps) {
  const { fields, append, remove, update } = constraints
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [newCategoryName, setNewCategoryName] = useState("")
  const [showAddCategory, setShowAddCategory] = useState(false)

  // Get current constraints data
  const constraintsData = watchedData.constraints || []
  
  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return constraintsData
    return constraintsData.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.constraints.some(constraint =>
        constraint.text.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }, [constraintsData, searchTerm])

  const totalConstraints = constraintsData.reduce((acc, cat) => acc + cat.constraints.length, 0)
  const visibleConstraints = filteredCategories.reduce((acc, cat) => {
    if (!searchTerm) return acc + cat.constraints.length
    return acc + cat.constraints.filter(c => 
      c.text.toLowerCase().includes(searchTerm.toLowerCase())
    ).length
  }, 0)

  // Toggle category expansion
  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }, [])

  // Add new category
  const handleAddCategory = useCallback(() => {
    if (!newCategoryName.trim()) return
    
    const newCategory: ConstraintCategory = {
      id: uuidv4(),
      name: newCategoryName.trim(),
      description: "",
      constraints: []
    }
    
    append(newCategory)
    setExpandedCategories(prev => new Set(prev).add(newCategory.id))
    setNewCategoryName("")
    setShowAddCategory(false)
  }, [append, newCategoryName])

  // Update category
  const handleUpdateCategory = useCallback((categoryIndex: number, updates: Partial<ConstraintCategory>) => {
    const currentCategory = constraintsData[categoryIndex]
    if (currentCategory) {
      update(categoryIndex, { ...currentCategory, ...updates })
    }
  }, [update, constraintsData])

  // Remove category
  const handleRemoveCategory = useCallback((categoryIndex: number) => {
    const categoryId = constraintsData[categoryIndex]?.id
    if (categoryId) {
      setExpandedCategories(prev => {
        const newSet = new Set(prev)
        newSet.delete(categoryId)
        return newSet
      })
    }
    remove(categoryIndex)
  }, [remove, constraintsData])

  // Add constraint to category
  const handleAddConstraint = useCallback((categoryIndex: number) => {
    const currentCategory = constraintsData[categoryIndex]
    if (currentCategory) {
      const newConstraint: Constraint = {
        id: uuidv4(),
        text: "",
        category: currentCategory.name
      }
      
      const updatedCategory = {
        ...currentCategory,
        constraints: [...currentCategory.constraints, newConstraint]
      }
      
      update(categoryIndex, updatedCategory)
    }
  }, [update, constraintsData])

  // Update constraint
  const handleUpdateConstraint = useCallback((categoryIndex: number, constraintIndex: number, updates: Partial<Constraint>) => {
    const currentCategory = constraintsData[categoryIndex]
    if (currentCategory && currentCategory.constraints[constraintIndex]) {
      const updatedConstraints = [...currentCategory.constraints]
      updatedConstraints[constraintIndex] = {
        ...updatedConstraints[constraintIndex],
        ...updates
      }
      
      update(categoryIndex, {
        ...currentCategory,
        constraints: updatedConstraints
      })
    }
  }, [update, constraintsData])

  // Remove constraint
  const handleRemoveConstraint = useCallback((categoryIndex: number, constraintIndex: number) => {
    const currentCategory = constraintsData[categoryIndex]
    if (currentCategory) {
      const updatedConstraints = currentCategory.constraints.filter((_, idx) => idx !== constraintIndex)
      
      update(categoryIndex, {
        ...currentCategory,
        constraints: updatedConstraints
      })
    }
  }, [update, constraintsData])

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-600" />
              <span>Project Constraints</span>
            </div>
            {totalConstraints > 0 && (
              <Badge variant="secondary" className="text-xs">
                {searchTerm && visibleConstraints !== totalConstraints 
                  ? `${visibleConstraints} of ${totalConstraints} constraints`
                  : `${totalConstraints} constraint${totalConstraints !== 1 ? 's' : ''}`
                }
              </Badge>
            )}
          </div>
          {isEditing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddCategory(true)}
              className="hover:bg-purple-50 hover:border-purple-300"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Category
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Search and filters */}
        {(constraintsData.length > 0 || searchTerm) && (
          <div className="mb-6 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search constraints and categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {isEditing && constraintsData.length > 1 && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allIds = new Set(constraintsData.map(c => c.id))
                    setExpandedCategories(allIds)
                  }}
                  className="h-8"
                >
                  Expand All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setExpandedCategories(new Set())}
                  className="h-8"
                >
                  Collapse All
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Add category form */}
        {showAddCategory && (
          <div className="mb-6 p-4 border border-purple-200 rounded-lg bg-purple-50">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Category Name
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Technical Requirements, Business Rules..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCategory()
                    if (e.key === 'Escape') setShowAddCategory(false)
                  }}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={!newCategoryName.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Category
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddCategory(false)
                    setNewCategoryName("")
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Categories and constraints */}
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Target className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No matching constraints' : 'No constraints defined'}
            </h3>
            <p className="text-gray-500 mb-4 max-w-sm mx-auto">
              {searchTerm ? (
                `No constraints or categories match "${searchTerm}". Try adjusting your search.`
              ) : isEditing ? (
                "Start by adding constraint categories to organize and manage your project requirements."
              ) : (
                "No project constraints have been defined yet."
              )}
            </p>
            {isEditing && !searchTerm && (
              <Button
                type="button"
                onClick={() => setShowAddCategory(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Category
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCategories.map((category, categoryIndex) => {
              const actualIndex = constraintsData.findIndex(c => c.id === category.id)
              return (
                <CategorySection
                  key={category.id}
                  category={category}
                  categoryIndex={actualIndex}
                  isEditing={isEditing}
                  isExpanded={expandedCategories.has(category.id)}
                  onToggleExpanded={() => toggleCategory(category.id)}
                  onUpdateCategory={(updates) => handleUpdateCategory(actualIndex, updates)}
                  onRemoveCategory={() => handleRemoveCategory(actualIndex)}
                  onAddConstraint={() => handleAddConstraint(actualIndex)}
                  onUpdateConstraint={(constraintIndex, updates) => 
                    handleUpdateConstraint(actualIndex, constraintIndex, updates)
                  }
                  onRemoveConstraint={(constraintIndex) => 
                    handleRemoveConstraint(actualIndex, constraintIndex)
                  }
                  searchTerm={searchTerm}
                />
              )
            })}
          </div>
        )}

        {/* Instructions */}
        {isEditing && filteredCategories.length > 0 && (
          <div className="mt-6 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-800 flex items-center">
              <Target className="h-4 w-4 mr-1" />
              Organize constraints by category, click to expand/collapse sections, and use search to quickly find specific requirements.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}