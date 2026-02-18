import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  BookOpen, 
  Home, 
  Users, 
  CreditCard, 
  BarChart3, 
  Settings, 
  ArrowRight,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  FileText
} from "lucide-react";

export default function Guideline() {
  const steps = [
    {
      title: "Step 1: Add Your Properties",
      icon: <Home className="w-6 h-6 text-blue-600" />,
      description: "Start by listing the properties you manage.",
      details: [
        "Go to the Admin section to add new property addresses.",
        "Include details like apartment numbers or specific building names.",
        "You can edit or deactivate properties at any time."
      ]
    },
    {
      title: "Step 2: Assign Tenants",
      icon: <Users className="w-6 h-6 text-emerald-600" />,
      description: "Link a tenant to their new home.",
      details: [
        "Choose a property and enter the tenant's name and contact information.",
        "Set the monthly rent amount and the lease start date.",
        "Record the security deposit (advance amount) for your records."
      ]
    },
    {
      title: "Step 3: Track Rent Collections",
      icon: <CreditCard className="w-6 h-6 text-amber-600" />,
      description: "Keep track of payments month by month.",
      details: [
        "The system automatically creates a rent record for every month.",
        "When a tenant pays, simply mark the record as 'Paid'.",
        "Record partial payments or add notes for late collections."
      ]
    },
    {
      title: "Step 4: Monitor Performance",
      icon: <BarChart3 className="w-6 h-6 text-purple-600" />,
      description: "Review your rental business at a glance.",
      details: [
        "Use the Dashboard to see total properties and occupancy rates.",
        "Quickly identify which tenants have overdue payments.",
        "Keep track of total earnings and pending collections."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <BookOpen className="w-5 h-5 md:w-8 md:h-8 text-blue-600 flex-shrink-0" />
              <h1 className="text-lg md:text-2xl font-bold text-slate-900 truncate">App Guide</h1>
            </div>
            <Link to="/">
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome Section */}
        <div className="bg-blue-600 rounded-2xl p-8 mb-10 text-white shadow-xl shadow-blue-100">
          <h2 className="text-3xl font-bold mb-4">Master Your Property Management</h2>
          <p className="text-blue-100 text-lg max-w-2xl leading-relaxed">
            Welcome! This guide will help you get started with managing your properties, 
            tracking tenants, and collecting rent efficiently.
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" /> Easy to Use
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm font-medium">
              <Smartphone className="w-4 h-4" /> Accessible Anywhere
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm font-medium">
              <ShieldCheck className="w-4 h-4" /> Data Secured
            </div>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {steps.map((step, idx) => (
            <div key={idx} className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-50 rounded-lg">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900">{step.title}</h3>
              </div>
              <p className="text-slate-600 mb-6 font-medium">{step.description}</p>
              <ul className="space-y-3">
                {step.details.map((detail, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-700 leading-relaxed">
                    <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Quick Tips Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-500" />
            Helpful Tips
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Document Storage</h4>
                <p className="text-sm text-slate-600">You can upload rental agreements and tenant IDs directly to each property for easy access.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Stay Updated</h4>
                <p className="text-sm text-slate-600">The home page summary automatically updates as you mark rent as paid or add new properties.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Summary */}
        <div className="bg-slate-900 rounded-xl p-8 text-slate-300 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Ready to manage your properties?</h3>
          <p className="mb-8 text-slate-400 max-w-xl mx-auto">
            Start by adding your first property and then assign a tenant to begin tracking rent payments effortlessly.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/admin/properties">
              <Button className="bg-blue-600 hover:bg-blue-700">Add a Property</Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="text-white border-white/20 hover:bg-white/10">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
