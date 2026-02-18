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
  Info
} from "lucide-react";

export default function Guideline() {
  const sections = [
    {
      title: "Property Management",
      icon: <Home className="w-6 h-6 text-blue-600" />,
      description: "Organize and track your real estate portfolio.",
      items: [
        "View all properties in a grid on the Home page.",
        "Add, Edit, or Delete properties from the Admin Properties section.",
        "Each property shows its current occupancy status and pending rent count."
      ]
    },
    {
      title: "Tenants & Agreements",
      icon: <Users className="w-6 h-6 text-emerald-600" />,
      description: "Manage relationships and rental contracts.",
      items: [
        "Create 'Tenancies' to link a tenant to a specific property.",
        "Track move-in dates, monthly rent, and advance security deposits.",
        "End a tenancy when a tenant moves out to mark the property as vacant."
      ]
    },
    {
      title: "Rent Tracking",
      icon: <CreditCard className="w-6 h-6 text-amber-600" />,
      description: "Never miss a payment with automated tracking.",
      items: [
        "Rent records are automatically generated based on the tenancy start date.",
        "Mark payments as 'Paid', 'Pending', or 'Partial' directly from the property details.",
        "Use the 'Pending Rent' dashboard to see exactly who owes what across all properties."
      ]
    },
    {
      title: "Dashboard & Metrics",
      icon: <BarChart3 className="w-6 h-6 text-purple-600" />,
      description: "Get a bird's-eye view of your business performance.",
      items: [
        "Monitor occupancy rates and total pending collections in real-time.",
        "Quickly identify vacant properties that need new tenants.",
        "Access deep-dive reports by clicking on any metric card."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-900">App Guidelines</h1>
            </div>
            <Link to="/">
              <Button variant="outline">Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome Section */}
        <div className="bg-blue-600 rounded-2xl p-8 mb-10 text-white shadow-xl shadow-blue-100">
          <h2 className="text-3xl font-bold mb-4">Welcome to Rent Management System</h2>
          <p className="text-blue-100 text-lg max-w-2xl leading-relaxed">
            This application is designed to simplify the complexities of property management, 
            tenant tracking, and rent collection for landlords and property managers.
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm font-medium">
              <ShieldCheck className="w-4 h-4" /> Secure with Supabase
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm font-medium">
              <Smartphone className="w-4 h-4" /> Mobile Optimized
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" /> Real-time Updates
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {sections.map((section, idx) => (
            <div key={idx} className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-50 rounded-lg">
                  {section.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900">{section.title}</h3>
              </div>
              <p className="text-slate-600 mb-6">{section.description}</p>
              <ul className="space-y-3">
                {section.items.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-700 leading-relaxed">
                    <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* How it Works / Workflow */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-500" />
            Standard Workflow
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="relative">
              <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold mb-4">1</div>
              <h4 className="font-bold text-slate-900 mb-2">Add Property</h4>
              <p className="text-sm text-slate-600">Enter your property address and description in the Admin section.</p>
              <ArrowRight className="hidden sm:block absolute top-5 -right-4 w-5 h-5 text-slate-300" />
            </div>
            <div className="relative">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold mb-4">2</div>
              <h4 className="font-bold text-slate-900 mb-2">Create Tenancy</h4>
              <p className="text-sm text-slate-600">Assign a tenant to the property and define the rent and start date.</p>
              <ArrowRight className="hidden sm:block absolute top-5 -right-4 w-5 h-5 text-slate-300" />
            </div>
            <div>
              <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold mb-4">3</div>
              <h4 className="font-bold text-slate-900 mb-2">Collect Rent</h4>
              <p className="text-sm text-slate-600">Monitor the generated rent records and mark them as paid when received.</p>
            </div>
          </div>
        </div>

        {/* Tech Note */}
        <div className="bg-slate-900 rounded-xl p-8 text-slate-300">
          <div className="flex items-center gap-2 text-white font-bold mb-4">
            <Info className="w-5 h-5 text-blue-400" />
            Technical Architecture
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm leading-relaxed">
            <div>
              <p className="mb-4">
                The application uses <span className="text-white font-medium">Supabase</span> for real-time database management and 
                authentication. All your data is stored securely in a PostgreSQL database.
              </p>
              <p>
                The frontend is built with <span className="text-white font-medium">React</span> and 
                <span className="text-white font-medium">Tailwind CSS</span>, ensuring a smooth and responsive experience across 
                mobile, tablet, and desktop devices.
              </p>
            </div>
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <h5 className="text-white font-bold mb-2">Need to Reset?</h5>
              <p className="text-slate-400 mb-4 text-xs">
                If you encounter database connection issues or need to reset your environment, you can use the built-in diagnostic tools.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link to="/debug">
                  <Button size="sm" variant="secondary" className="text-xs">Run Diagnostics</Button>
                </Link>
                <Link to="/setup">
                  <Button size="sm" variant="outline" className="text-xs text-white border-white/20 hover:bg-white/10">Database Setup</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
