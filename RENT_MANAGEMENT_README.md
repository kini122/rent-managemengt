# Rent Management System

A modern, production-ready rent management system built with React, TypeScript, Supabase, and Tailwind CSS.

## 🎯 Features

### Property Management
- View all properties in an organized grid layout
- Property cards with tenant information and rent status indicators
- Color-coded rent payment status (Green: paid, Yellow: partial, Red: pending)
- Quick access to property details

### Tenant & Tenancy Management
- Manage tenant information (name, phone, ID proof, notes)
- Create and manage tenancies (rental agreements)
- Track multiple properties and assignments
- Support for active/completed/terminated tenancies

### Rent Tracking
- Monthly rent payment tracking
- Multiple payment statuses: Paid, Pending, Partial
- Mark payments as paid with automatic date recording
- Detailed payment history with remarks

### Admin Dashboard
- Real-time metrics: Total properties, occupied, vacant, tenants, pending rent amount
- Pending rent payments overview with property and tenant details
- Quick access to property management
- Load sample data for testing

## 📋 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS 3 + Radix UI
- **Backend**: Supabase (PostgreSQL + Auth)
- **Build**: Vite
- **Package Manager**: pnpm
- **Data Fetching**: Supabase JS Client
- **State Management**: React Hooks + Supabase Real-time

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and pnpm
- Supabase account and project

### Installation

1. **Environment Setup**
   ```bash
   # The system comes with Supabase credentials already configured:
   VITE_SUPABASE_URL=https://qnrchjgrhrknczaxmxna.supabase.co
   VITE_SUPABASE_KEY=sb_publishable_i5mvQ5t9X7mVmRrAEW6ooQ_RKgQHzQU
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Start Development Server**
   ```bash
   pnpm dev
   ```
   The app will be available at `http://localhost:8080`

4. **Build for Production**
   ```bash
   pnpm build
   ```

## 📊 Database Schema

### Properties Table
```
- property_id (PK)
- address (text)
- details (text)
- is_active (boolean)
- created_at (timestamp)
```

### Tenants Table
```
- tenant_id (PK)
- name (text)
- phone (text)
- id_proof (text)
- notes (text)
- created_at (timestamp)
```

### Tenancies Table
```
- tenancy_id (PK)
- property_id (FK)
- tenant_id (FK)
- start_date (date)
- end_date (date, nullable)
- monthly_rent (decimal)
- advance_amount (decimal)
- status (enum: active, completed, terminated)
- created_at (timestamp)
```

### Rent Payments Table
```
- rent_id (PK)
- tenancy_id (FK)
- rent_month (date)
- rent_amount (decimal)
- payment_status (enum: paid, pending, partial)
- paid_date (date, nullable)
- remarks (text)
- created_at (timestamp)
```

## 🗂️ Project Structure

```
client/
├── pages/                 # Route components
│   ├── Home.tsx          # Property listing dashboard
│   ├── PropertyDetail.tsx # Property details and rent tracking
│   ├── AdminDashboard.tsx # Admin metrics and pending rents
│   ├── AdminProperties.tsx # Properties management
│   └── NotFound.tsx       # 404 page
├── components/
│   ├── ui/               # Pre-built Radix UI components
│   ├── PropertyCard.tsx   # Property card component
│   ├── TenantSummary.tsx  # Tenant information display
│   └── RentTable.tsx      # Rent payments table
├── hooks/
│   └── useSupabase.ts    # Custom hooks for data fetching
├── services/
│   ├── supabaseAdmin.ts  # Admin operations (CRUD)
│   └── sampleData.ts     # Sample data generator
├── lib/
│   ├── supabaseClient.ts # Supabase client initialization
│   └── utils.ts          # Utility functions
├── types/
│   └── index.ts          # TypeScript type definitions
└── App.tsx               # App routing setup
```

## 🎨 UI Components

The system uses several custom components:

### PropertyCard
Displays a property with:
- Address and details
- Current tenant information
- Rent pending status badge
- Color-coded status indicator

### TenantSummary
Shows comprehensive tenancy information:
- Property details
- Tenant information
- Tenancy duration and terms
- Rent and advance amounts
- Editable fields (admin only)

### RentTable
Displays rent payment history:
- Monthly breakdown
- Payment amounts
- Current status
- Paid dates
- Remarks
- Action buttons (mark as paid)

## 🔐 Security & Authorization

The system implements Row Level Security (RLS) in Supabase:
- Admin users have full read/write access
- Regular users have read-only access
- All data operations are controlled at the database level

See `RLS_SETUP.md` for detailed setup instructions.

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

All components use Tailwind CSS responsive classes.

## 🔄 Data Flow

1. **Home Page**: Fetches all active properties with tenant and rent status
2. **Property Detail**: Shows specific property with active tenancy and rent history
3. **Admin Dashboard**: Aggregates metrics and pending rents across all properties
4. **Admin Operations**: Create/update/delete properties, tenants, and tenancies

## 🧪 Testing with Sample Data

1. Navigate to Admin Dashboard (`/admin`)
2. Click "Load Sample Data" button
3. Sample properties, tenants, and tenancies will be created
4. Explore the system with realistic data

## 💾 Features in Detail

### Automatic Rent Generation
When a new tenancy is created:
- Rent payments are automatically generated for all months from start_date to current date
- Each month's first day is used as the rent_month
- Payment status defaults to "pending"

### Real-time Updates
- Use Supabase subscriptions for real-time data sync (optional)
- Manual refresh available on all pages
- Toast notifications for all operations

### Admin Operations
- **Create Properties**: Add new properties with address and details
- **Manage Tenants**: Add tenant information for leasing
- **Create Tenancies**: Assign tenants to properties with rent terms
- **Mark Payments**: Update payment status to paid/pending/partial
- **End Tenancies**: Mark tenancies as completed

## 🐛 Troubleshooting

### No data showing on Home page
1. Check Supabase connection: Verify VITE_SUPABASE_URL and VITE_SUPABASE_KEY are set
2. Ensure database tables exist
3. Check browser console for error messages
4. Load sample data from Admin Dashboard

### Cannot mark rent as paid
- Ensure you have admin privileges
- Check that the rent payment record exists
- Verify Supabase RLS policies allow the operation

### App not loading
- Clear browser cache
- Restart dev server: `pnpm dev`
- Check dev server logs for errors

## 📚 File Reference

### Pages
- `client/pages/Home.tsx` - Main property listing
- `client/pages/PropertyDetail.tsx` - Property details and rent tracker
- `client/pages/AdminDashboard.tsx` - Admin overview and metrics
- `client/pages/AdminProperties.tsx` - Property management interface

### Services
- `client/services/supabaseAdmin.ts` - All database mutations and admin operations
- `client/services/sampleData.ts` - Sample data generator for testing

### Hooks
- `client/hooks/useSupabase.ts` - Custom hooks for properties and property details

### Configuration
- `.env` - Environment variables (Supabase connection)
- `tailwind.config.ts` - Tailwind CSS configuration
- `client/global.css` - Global styles and CSS variables
- `tsconfig.json` - TypeScript configuration

## 🚀 Deployment

The application can be deployed to:
- **Netlify**: `pnpm build` then deploy `dist` folder
- **Vercel**: Push to GitHub and connect Vercel
- **Self-hosted**: Build and serve with any Node.js server

See `deploy-app` in custom rules for detailed deployment instructions.

## 📝 License

This project is provided as-is for the specified purpose.

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the `RLS_SETUP.md` for security setup
3. Examine browser console and dev server logs
4. Verify Supabase configuration and table schemas

## 🎓 Learning Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs)

## 📈 Future Enhancements

Potential features to add:
- Authentication UI (login/signup)
- Export to CSV/PDF reports
- Email notifications for pending rents
- Payment reminders
- Tenant communication history
- Maintenance request tracking
- Document upload and storage
- Multi-language support
- Dark mode toggle
- Advanced filtering and search
