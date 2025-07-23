import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Clock, XCircle, Users, ArrowLeft, MessageSquare, CheckSquare } from "lucide-react"

export default function ProjectProposal() {
  const businessObjectives = [
    "Reduce manufacturing cost by 10-15%",
    "Maintain premium taste profile",
    "Preserve brand positioning",
    "Ensure regulatory compliance",
    "Maintain shelf stability",
  ]

  const priorityObjectives = [
    { objective: "Cost reduction", priority: "Priority 1" },
    { objective: "Taste maintenance", priority: "Priority 2" },
    { objective: "Brand consistency", priority: "Priority 3" },
    { objective: "Regulatory compliance", priority: "Priority 4" },
    { objective: "Shelf stability", priority: "Priority 5" },
  ]

  const constraints = {
    Product: ["Minimum 60% cocoa content", "No artificial colors", "Gluten-free requirement"],
    Category: ["Premium market positioning", "Organic certification preferred"],
    Manufacturing: ["Current equipment compatibility", "Batch size limitations"],
    Safety: ["Allergen management", "HACCP compliance"],
    Regulatory: ["FDA approval for new ingredients", "Organic certification maintenance"],
  }

  const acceptableChanges = [
    "Cocoa content adjustment within 5%",
    "Alternative natural sweeteners",
    "Packaging optimization",
    "Supply chain modifications",
  ]

  const notAcceptableChanges = [
    "Artificial preservatives",
    "Non-organic ingredients",
    "Significant texture changes",
    "Brand name modifications",
  ]

  const feasibilityLimits = [
    "Maximum 20% cost reduction realistic",
    "Minimum 6-month shelf life required",
    "Current production capacity constraints",
    "Seasonal ingredient availability",
  ]

  const stakeholders = [
    {
      name: "sarah.johnson@company.com",
      role: "R&D Manager",
      status: "approved",
    },
    {
      name: "mike.chen@company.com",
      role: "Marketing Director",
      status: "pending",
    },
    {
      name: "lisa.rodriguez@company.com",
      role: "Quality Assurance",
      status: "changes-requested",
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "changes-requested":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending Review
          </Badge>
        )
      case "changes-requested":
        return <Badge variant="destructive">Changes Requested</Badge>
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Project Proposal</h1>
          <p className="text-gray-600">Review your comprehensive project proposal based on our interaction.</p>
        </div>

        {/* Product Information */}
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
                  <label className="text-sm font-medium text-gray-500">Product Name</label>
                  <p className="text-gray-900">Premium Dark Chocolate Bar</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Current Cost</label>
                  <p className="text-gray-900 font-semibold">$2.45</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-gray-900">Premium Confectionery</p>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Existing Formulation</label>
              <p className="text-gray-900">70% cocoa, organic cane sugar, cocoa butter, vanilla extract, lecithin</p>
            </div>
          </CardContent>
        </Card>

        {/* Business Objectives */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              Business Objectives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {businessObjectives.map((objective, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Checkbox checked readOnly />
                  <span className="text-gray-700">{objective}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Objectives Priority */}
        <Card>
          <CardHeader>
            <CardTitle>Objectives Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {priorityObjectives.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                >
                  <span className="text-gray-700">{item.objective}</span>
                  <Badge variant="outline">{item.priority}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Constraints */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              Constraints
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(constraints).map(([category, items]) => (
              <div key={category}>
                <h4 className="font-semibold text-gray-900 mb-2">{category}</h4>
                <ul className="space-y-1">
                  {items.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <span className="text-red-500 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Acceptable vs Not Acceptable Changes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-700">Acceptable Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {acceptableChanges.map((change, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-700">Not Acceptable Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {notAcceptableChanges.map((change, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Feasibility Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Feasibility Limits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {feasibilityLimits.map((limit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Checkbox checked readOnly />
                  <span className="text-gray-700">{limit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stakeholder Approval */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Stakeholder Approval
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stakeholders.map((stakeholder, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(stakeholder.status)}
                  <div>
                    <p className="font-medium text-gray-900">{stakeholder.name}</p>
                    <p className="text-sm text-gray-500">{stakeholder.role}</p>
                  </div>
                </div>
                {getStatusBadge(stakeholder.status)}
              </div>
            ))}

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
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-200">
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Edge Cases
          </Button>

          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <MessageSquare className="h-4 w-4" />
              Edit with Agent
            </Button>
            <Button className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Approve & Setup
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
