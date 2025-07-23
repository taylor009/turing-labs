import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { FormData, formSchema } from "@/types/project-proposal.types"
import { useAuthContext } from "@/components/auth"
import { useToast } from "@/hooks/use-toast"
import { proposalsApi } from "@/lib/api"
import { proposals } from "@/lib/supabase-client"

const DEFAULT_VALUES: FormData = {
  productName: "Premium Dark Chocolate Bar",
  currentCost: "$2.45",
  category: "Premium Confectionery",
  formulation: "70% cocoa, organic cane sugar, cocoa butter, vanilla extract, lecithin",
  businessObjectives: [
    { text: "Reduce manufacturing cost by 10-15%", checked: true },
    { text: "Maintain premium taste profile", checked: true },
    { text: "Preserve brand positioning", checked: true },
    { text: "Ensure regulatory compliance", checked: true },
    { text: "Maintain shelf stability", checked: true }
  ],
  constraints: [
    {
      id: "tech-req",
      name: "Technical Requirements",
      description: "Technical and production constraints",
      constraints: [
        {
          id: "temp-range",
          text: "Storage temperature must remain between 15-20°C",
          category: "Technical Requirements"
        },
        {
          id: "shelf-life",
          text: "Minimum 12-month shelf life required",
          category: "Technical Requirements"
        },
        {
          id: "equipment",
          text: "Must be compatible with existing production equipment",
          category: "Technical Requirements"
        }
      ]
    },
    {
      id: "regulatory",
      name: "Regulatory Compliance",
      description: "Legal and regulatory requirements",
      constraints: [
        {
          id: "fda-approval",
          text: "All ingredients must be FDA approved for food use",
          category: "Regulatory Compliance"
        },
        {
          id: "labeling",
          text: "Product labeling must comply with current regulations",
          category: "Regulatory Compliance"
        }
      ]
    },
    {
      id: "business",
      name: "Business Constraints",
      description: "Commercial and operational limitations",
      constraints: [
        {
          id: "budget",
          text: "Development budget cannot exceed $50,000",
          category: "Business Constraints"
        },
        {
          id: "timeline",
          text: "Project must be completed within 6 months",
          category: "Business Constraints"
        }
      ]
    }
  ],
  acceptableChanges: [
    "Cocoa content adjustment within 5%",
    "Alternative natural sweeteners", 
    "Packaging optimization",
    "Supply chain modifications"
  ],
  notAcceptableChanges: [
    "Artificial preservatives",
    "Non-organic ingredients",
    "Significant texture changes",
    "Brand name modifications"
  ],
  feasibilityLimits: [
    "Maximum 20% cost reduction realistic",
    "Minimum 6-month shelf life required",
    "Current production capacity constraints",
    "Seasonal ingredient availability"
  ],
  stakeholders: [
    {
      name: "sarah.johnson@company.com",
      role: "R&D Manager",
      status: "approved"
    },
    {
      name: "mike.chen@company.com", 
      role: "Marketing Director",
      status: "pending"
    },
    {
      name: "lisa.rodriguez@company.com",
      role: "Quality Assurance",
      status: "changes-requested"
    }
  ]
}

export function useProjectProposalForm() {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user, getAuthToken } = useAuthContext()
  const { toast } = useToast()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_VALUES
  })

  const businessObjectives = useFieldArray({
    control: form.control,
    name: "businessObjectives"
  })

  const constraints = useFieldArray({
    control: form.control,
    name: "constraints"
  })

  const acceptableChanges = useFieldArray({
    control: form.control,
    name: "acceptableChanges"
  })

  const notAcceptableChanges = useFieldArray({
    control: form.control,
    name: "notAcceptableChanges"
  })

  const feasibilityLimits = useFieldArray({
    control: form.control,
    name: "feasibilityLimits"
  })

  const stakeholders = useFieldArray({
    control: form.control,
    name: "stakeholders"
  })

  const watchedData = form.watch()

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to submit your proposal.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      // Validate required fields
      if (!data.productName?.trim()) {
        throw new Error("Product name is required");
      }
      if (!data.category?.trim()) {
        throw new Error("Category is required");
      }
      if (!data.formulation?.trim()) {
        throw new Error("Formulation is required");
      }
      
      // Validate current cost
      const cost = typeof data.currentCost === 'string' 
        ? parseFloat(data.currentCost.replace('$', '').replace(',', ''))
        : parseFloat(String(data.currentCost));
        
      if (isNaN(cost) || cost <= 0) {
        throw new Error("Valid current cost is required");
      }
      
      // Validate business objectives
      const checkedObjectives = data.businessObjectives?.filter(obj => obj.checked) || [];
      if (checkedObjectives.length === 0) {
        throw new Error("At least one business objective must be selected");
      }
      
      // Debug: Check user authentication and session
      console.log("Current user:", {
        id: user.id,
        email: user.email,
        role: user.role
      })
      
      // Get auth token for API calls
      const token = getAuthToken();
      console.log("Auth token status:", {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'None'
      })
      
      if (!token) {
        throw new Error("No authentication token available. Please sign in again.");
      }
      // Transform form data to match API schema (camelCase)
      const proposalData = {
        productName: data.productName,
        currentCost: typeof data.currentCost === 'string' 
          ? parseFloat(data.currentCost.replace('$', '').replace(',', '')) || 0
          : parseFloat(String(data.currentCost)) || 0,
        category: data.category,
        formulation: data.formulation,
        businessObjectives: data.businessObjectives
          .filter(obj => obj.checked)
          .map(obj => obj.text),
        priorityObjectives: data.businessObjectives
          .filter(obj => obj.checked)
          .map(obj => ({
            objective: obj.text,
            priority: 'HIGH' // You can add priority selection to the form
          })),
        constraints: data.constraints.reduce((acc, category) => {
          acc[category.name] = category.constraints.map(c => c.text)
          return acc
        }, {} as Record<string, string[]>),
        acceptableChanges: Array.isArray(data.acceptableChanges) 
          ? data.acceptableChanges
          : data.acceptableChanges?.map?.(change => typeof change === 'string' ? change : change.text) || [],
        notAcceptableChanges: Array.isArray(data.notAcceptableChanges) 
          ? data.notAcceptableChanges
          : data.notAcceptableChanges?.map?.(change => typeof change === 'string' ? change : change.text) || [],
        feasibilityLimits: Array.isArray(data.feasibilityLimits) 
          ? data.feasibilityLimits
          : data.feasibilityLimits?.map?.(limit => typeof limit === 'string' ? limit : limit.text) || []
      }

      console.log("Submitting proposal:", proposalData)
      
      // Test API connection first (skip for now due to server issues)
      console.log("Skipping API connection test - will attempt direct creation");
      
      // Try API first, fallback to Supabase if API fails
      let savedProposal;
      let useApiSuccess = false;
      
      try {
        console.log("Trying API first...");
        savedProposal = await proposalsApi.create(proposalData, token);
        console.log("API success:", savedProposal);
        useApiSuccess = true;
      } catch (apiError: any) {
        console.error("API failed, falling back to Supabase:", {
          error: apiError,
          message: apiError?.message,
          status: apiError?.status
        });
        
        // Fallback to direct Supabase (needs snake_case format)
        try {
          console.log("Attempting Supabase direct...");
          const supabaseData = {
            product_name: proposalData.productName,
            current_cost: proposalData.currentCost,
            category: proposalData.category,
            formulation: proposalData.formulation,
            status: 'DRAFT' as const,
            created_by: user.id,
            business_objectives: proposalData.businessObjectives,
            priority_objectives: proposalData.priorityObjectives,
            constraints: proposalData.constraints,
            acceptable_changes: proposalData.acceptableChanges,
            not_acceptable_changes: proposalData.notAcceptableChanges,
            feasibility_limits: proposalData.feasibilityLimits
          };
          savedProposal = await proposals.create(supabaseData);
          console.log("Supabase success:", savedProposal);
        } catch (supabaseError: any) {
          console.error("Both API and Supabase failed:", supabaseError);
          throw supabaseError;
        }
      }
      
      // Add stakeholders if any (this can be implemented later)
      if (data.stakeholders && data.stakeholders.length > 0) {
        console.log("Stakeholders to add:", data.stakeholders)
        // Future enhancement: Add stakeholders to the proposal
      }
      
      setIsEditing(false)
      
      toast({
        title: "Proposal created successfully!",
        description: `Your proposal "${data.productName}" has been saved as a draft.`,
      })
      
      // Navigate to the created proposal
      setTimeout(() => {
        router.push(`/proposals/${savedProposal.id}`)
      }, 1000)

    } catch (error: any) {
      console.error("Submission error:", error)
      console.error("Error details:", {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        cause: error?.cause,
        toString: error?.toString?.(),
        valueOf: error?.valueOf?.(),
        keys: Object.keys(error || {}),
        values: Object.values(error || {}),
        fullError: JSON.stringify(error, null, 2)
      })
      
      let errorMessage = "There was an error submitting your proposal. Please try again.";
      
      // Handle specific Supabase errors
      if (error?.message) {
        if (error.message.includes('violates row-level security policy')) {
          errorMessage = "You don't have permission to create proposals. Please check your authentication.";
        } else if (error.message.includes('duplicate key')) {
          errorMessage = "A proposal with similar information already exists.";
        } else if (error.message.includes('foreign key')) {
          errorMessage = "Invalid reference data. Please refresh the page and try again.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      } else {
        // If no message, try to extract any meaningful info
        const errorStr = error?.toString?.() || String(error);
        errorMessage = `Submission error: ${errorStr}`;
      }
      
      toast({
        title: "Submission failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleEditing = () => setIsEditing(!isEditing)

  return {
    form,
    isEditing,
    isSubmitting,
    watchedData,
    onSubmit,
    toggleEditing,
    fieldArrays: {
      businessObjectives,
      constraints,
      acceptableChanges,
      notAcceptableChanges,
      feasibilityLimits,
      stakeholders
    }
  }
}