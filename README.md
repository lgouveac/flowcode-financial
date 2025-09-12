# FlowCode Financial - Comprehensive Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Installation & Setup](#installation--setup)
4. [Project Structure](#project-structure)
5. [Core Features](#core-features)
6. [Database Schema](#database-schema)
7. [API Integrations](#api-integrations)
8. [Component Architecture](#component-architecture)
9. [Development Workflow](#development-workflow)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)

## Project Overview

**FlowCode Financial** is a comprehensive business financial management platform designed for Brazilian companies and freelancers. The system provides complete financial lifecycle management including client management, recurring billing, contract handling, cash flow tracking, and payment processing.

### Key Purpose
- Streamline financial operations for service-based businesses
- Automate recurring billing and payment tracking
- Provide comprehensive financial analytics and reporting
- Facilitate contract management and digital signing
- Enable automated email notifications and reminders

### Target Users
- Small to medium businesses in Brazil
- Freelancers and consultants
- Service providers with recurring billing needs
- Financial administrators and accountants

## Technology Stack

### Frontend
- **React 18.3.1** - Modern component-based UI framework
- **TypeScript** - Type-safe JavaScript development
- **Vite** - Fast build tool and development server
- **Tailwind CSS 3.4.11** - Utility-first CSS framework
- **shadcn/ui** - Component library built on Radix UI primitives
- **Framer Motion 12.4.4** - Animation and transitions
- **React Hook Form 7.53.0** - Form state management
- **React Router DOM 6.26.2** - Client-side routing
- **TanStack Query 5.56.2** - Server state management
- **Recharts 2.12.7** - Data visualization and charts
- **Date-fns 4.1.0** - Date manipulation library

### Backend & Database
- **Supabase** - Backend-as-a-Service platform
  - PostgreSQL database
  - Authentication & authorization
  - Real-time subscriptions
  - Row Level Security (RLS)
  - Edge Functions for serverless computing

### External Services
- **Resend** - Email delivery service
- **OpenRouter API** - AI chat integration
- **Custom Webhook System** - Contract management integration

### Development Tools
- **ESLint** - Code linting and formatting
- **Husky** - Git hooks for code quality
- **PostCSS** - CSS processing
- **Lovable** - Development platform integration

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm (install with [nvm](https://github.com/nvm-sh/nvm))
- Git
- Supabase account

### Quick Start

1. **Clone the repository**
```bash
git clone <YOUR_GIT_URL>
cd flowcode-financial
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env.local` file with the following variables:
```env
VITE_SUPABASE_URL=https://itlpvpdwgiwbdpqheemw.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
RESEND_API_KEY=your_resend_api_key
```

4. **Start development server**
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

### Database Setup

The Supabase project is pre-configured with all necessary tables and functions. Database migrations are located in `supabase/migrations/`.

## Project Structure

```
flowcode-financial/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (shadcn/ui)
│   │   ├── auth/           # Authentication components
│   │   ├── cash-flow/      # Cash flow management
│   │   ├── client/         # Client management
│   │   ├── contracts/      # Contract handling
│   │   ├── emails/         # Email templates & notifications
│   │   ├── employees/      # Employee management
│   │   ├── payments/       # Payment processing
│   │   └── recurring-billing/ # Recurring billing system
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components & routing
│   ├── services/           # Business logic & API calls
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── integrations/       # External service integrations
├── supabase/
│   ├── functions/          # Edge functions
│   └── migrations/         # Database migrations
└── public/                 # Static assets
```

## Core Features

### 1. Authentication & User Management
- **Secure Authentication**: Email/password with Supabase Auth
- **User Registration**: Multi-step registration with email verification
- **Password Recovery**: Secure password reset flow
- **Profile Management**: User profile data with role-based access

**Key Components:**
- `src/components/auth/AuthContext.tsx` - Authentication context
- `src/components/auth/ProtectedRoute.tsx` - Route protection

### 2. Client Management
- **Client Registration**: Support for both individual (PF) and corporate (PJ) clients
- **Contact Information**: Complete contact details with address management
- **Status Tracking**: Active, inactive, and overdue status management
- **Payment Methods**: PIX, Boleto, and Credit Card support

**Key Components:**
- `src/components/ClientTable.tsx` - Main client listing
- `src/components/client/NewClientForm.tsx` - Client creation
- `src/pages/PublicClientForm.tsx` - Public registration form

### 3. Employee Management
- **Employee Registration**: Complete employee onboarding
- **Monthly Values**: Salary and benefit tracking
- **Payment Settings**: Preferred payment methods and templates
- **Notification Preferences**: Email template selection

**Key Components:**
- `src/components/EmployeeTable.tsx` - Employee listing
- `src/components/employees/EmployeePaymentSettings.tsx` - Payment configuration

### 4. Recurring Billing System
- **Automated Billing**: Configurable recurring payment schedules
- **Installment Management**: Multi-installment payment tracking
- **Status Management**: Pending, billed, paid, overdue status tracking
- **Email Integration**: Automated billing notifications

**Key Components:**
- `src/components/RecurringBilling.tsx` - Main billing interface
- `src/components/recurring-billing/NewRecurringBillingForm.tsx` - Billing creation

### 5. Payment Management
- **Payment Tracking**: Complete payment lifecycle management
- **Multiple Payment Methods**: PIX, Boleto, Credit Card support
- **Partial Payments**: Support for partial payment tracking
- **Payment History**: Comprehensive payment audit trail

**Key Components:**
- `src/components/payments/PaymentTable.tsx` - Payment listing
- `src/components/payments/NewPaymentForm.tsx` - Payment creation

### 6. Contract Management
- **Digital Contracts**: Multiple contract types (Service, NDA, Professional)
- **Contract Generation**: Automated contract creation with templates
- **Digital Signing**: Integration with signing platforms
- **Webhook Integration**: Real-time contract status updates

**Key Components:**
- `src/pages/Contracts.tsx` - Contract management interface
- `src/components/contracts/ContractTable.tsx` - Contract listing
- `src/pages/ContractSigning.tsx` - Signing interface

### 7. Cash Flow Management
- **Income/Expense Tracking**: Comprehensive financial flow monitoring
- **Category Management**: Organized expense categorization
- **Visual Analytics**: Charts and graphs for financial insights
- **Estimated Expenses**: Future expense planning and tracking

**Key Components:**
- `src/components/CashFlow.tsx` - Main cash flow interface
- `src/components/cash-flow/CashFlowChart.tsx` - Data visualization

### 8. Email System
- **Template Management**: Customizable email templates
- **Variable Substitution**: Dynamic content insertion
- **Automated Notifications**: Scheduled billing and payment reminders
- **Email History**: Complete email audit trail

**Key Components:**
- `src/pages/Emails.tsx` - Email management interface
- `src/components/emails/TemplateEditor.tsx` - Template creation

### 9. Financial Analytics
- **Real-time Metrics**: Revenue, expenses, and profit tracking
- **Period Comparisons**: Month-over-month and year-over-year analysis
- **Future Projections**: 12-month financial forecasting
- **Top Client Analysis**: Client revenue ranking and insights

**Key Components:**
- `src/pages/Overview.tsx` - Financial dashboard
- `src/hooks/useMetrics.ts` - Analytics data management

### 10. AI Chat Integration
- **Smart Assistant**: AI-powered financial assistance
- **Natural Language Queries**: Conversational interface for data insights
- **Context-Aware Responses**: Understanding of financial data and operations

**Key Components:**
- `src/components/ai-chat/SimpleChatWidget.tsx` - Chat interface
- `src/services/aiService.ts` - AI service integration

## Database Schema

### Core Tables

#### clients
- Stores client information (both PF and PJ)
- Tracks payment methods, billing cycles, and status
- Supports Brazilian tax documents (CPF/CNPJ)

#### employees
- Employee records with payment preferences
- Notification settings and template preferences
- Position and compensation tracking

#### payments
- Individual payment records
- Installment tracking with partial payment support
- Payment method and status management

#### recurring_billing
- Automated billing configuration
- Installment and cycle management
- Client association and payment tracking

#### contracts (Contratos)
- Contract lifecycle management
- Multiple contract types (Service, NDA, Professional)
- Digital signing integration

#### email_templates
- Customizable email templates
- Variable substitution support
- Category-based organization

#### cash_flow
- Financial transaction recording
- Category-based expense tracking
- Employee and payment associations

### Key Enums
- `billing_status`: pending, billed, awaiting_invoice, paid, overdue, cancelled, partially_paid
- `client_status`: active, inactive, overdue
- `client_type`: pf (individual), pj (corporate)
- `payment_method`: pix, boleto, credit_card
- `contract_type`: open_scope, closed_scope
- `contractor_type`: individual, legal_entity

### Database Functions
- `trigger_billing_notifications()`: Automated billing reminders
- `check_billing_notifications()`: Notification scheduling
- `update_payment_reminder_settings()`: Reminder configuration

## API Integrations

### Supabase Edge Functions

#### Email Services
- `supabase/functions/send-email/index.ts` - Email sending with Resend
- `supabase/functions/send-billing-email/index.ts` - Billing notifications
- `supabase/functions/send-reminder-email/index.ts` - Payment reminders

#### Notification System
- `supabase/functions/trigger-billing-notifications/index.ts` - Billing automation
- `supabase/functions/trigger-employee-notifications/index.ts` - Employee notifications
- `supabase/functions/trigger-reminder-emails/index.ts` - Payment reminders

#### Contract Management
- `supabase/functions/generate-contract-webhook/index.ts` - Contract generation
- `supabase/functions/send-contract-webhook/index.ts` - Contract webhooks
- `supabase/functions/send-signing-webhook/index.ts` - Signing webhooks

### External API Integrations

#### Resend Email Service
- Professional email delivery
- Template-based email system
- Delivery tracking and analytics

#### OpenRouter AI
- GPT-powered chat assistance
- Financial data analysis
- Natural language processing

#### Webhook System
- Contract management integration
- Real-time status updates
- Multi-endpoint webhook support

## Component Architecture

### Design Patterns

#### 1. Context Pattern
- **AuthContext**: Global authentication state
- **ThemeProvider**: Dark/light theme management
- **QueryClient**: Server state management

#### 2. Custom Hooks Pattern
- **useMetrics**: Financial analytics
- **useBillingData**: Billing information
- **useContracts**: Contract management
- **useWebhooks**: Webhook configuration

#### 3. Compound Component Pattern
- **Table Components**: Reusable data tables
- **Form Components**: Consistent form interfaces
- **Dialog Components**: Modal interactions

#### 4. Provider Pattern
- **React Query**: Server state caching
- **Toast Notifications**: User feedback
- **Tooltip System**: Enhanced UX

### Component Organization

#### UI Components (`src/components/ui/`)
- Based on shadcn/ui design system
- Fully customizable with Tailwind CSS
- Accessible components with Radix UI primitives

#### Feature Components
- **Modular Design**: Each feature has its own component directory
- **Separation of Concerns**: Logic separated from presentation
- **Reusability**: Shared components across features

#### Page Components (`src/pages/`)
- Route-based organization
- Layout consistency
- Data fetching at page level

### State Management Strategy

#### Client State
- **React Hook Form**: Form state management
- **useState/useEffect**: Local component state
- **Context API**: Global state (auth, theme)

#### Server State
- **TanStack Query**: API data caching and synchronization
- **Optimistic Updates**: Immediate UI feedback
- **Background Refetching**: Data freshness

## Development Workflow

### Code Quality
```bash
# Linting
npm run lint
npm run lint:fix

# Security audit
npm run security:audit
npm run security:fix

# Complete check
npm run check:all
```

### Git Workflow
- **Husky**: Pre-commit hooks for code quality
- **Conventional Commits**: Structured commit messages
- **Branch Protection**: Main branch protection rules

### Testing Strategy
- **Type Safety**: TypeScript for compile-time error detection
- **ESLint Rules**: Code quality enforcement
- **Manual Testing**: Comprehensive user journey testing

### Development Scripts
```bash
npm run dev          # Development server
npm run build        # Production build
npm run build:dev    # Development build
npm run preview      # Preview production build
```

## Deployment

### Lovable Platform Integration
The project is integrated with [Lovable](https://lovable.dev) for streamlined deployment:

1. **Automatic Deployment**: Changes via Lovable are automatically deployed
2. **Git Integration**: Local changes are synced with the platform
3. **Environment Management**: Production environment configuration

### Manual Deployment Options

#### Netlify (Recommended for Custom Domains)
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Configure environment variables

#### Vercel
1. Import project from GitHub
2. Configure build settings
3. Set environment variables
4. Deploy

### Environment Variables
Ensure the following environment variables are configured in production:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_OPENROUTER_API_KEY`
- `RESEND_API_KEY` (for Edge Functions)

## Troubleshooting

### Common Issues

#### 1. Authentication Problems
**Symptoms**: Login failures, session issues
**Solutions**:
- Check Supabase configuration
- Verify environment variables
- Clear browser storage
- Check network connectivity

#### 2. Database Connection Issues
**Symptoms**: Data not loading, API errors
**Solutions**:
- Verify Supabase project status
- Check RLS policies
- Validate API keys
- Review network requests in browser dev tools

#### 3. Email Delivery Problems
**Symptoms**: Emails not sent, delivery failures
**Solutions**:
- Verify Resend API key
- Check email template configuration
- Review Edge Function logs
- Validate recipient addresses

#### 4. Build Failures
**Symptoms**: Build errors, deployment failures
**Solutions**:
- Run `npm run lint` to check for code issues
- Verify all dependencies are installed
- Check TypeScript compilation errors
- Review build logs for specific errors

#### 5. Performance Issues
**Symptoms**: Slow loading, UI lag
**Solutions**:
- Optimize React Query cache settings
- Review component re-rendering
- Check network request efficiency
- Monitor Supabase performance

### Debugging Tools

#### Browser Developer Tools
- **Network Tab**: Monitor API requests and responses
- **Console**: Check for JavaScript errors
- **Application Tab**: Inspect localStorage and sessionStorage

#### React Developer Tools
- **Components**: Inspect component hierarchy and props
- **Profiler**: Analyze performance and re-renders

#### Database Debugging
- **Supabase Dashboard**: Monitor database queries and performance
- **Query Logs**: Review SQL execution and errors

### Support Resources

#### Documentation
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

#### Community
- [Supabase Discord](https://discord.supabase.com)
- [React Community](https://react.dev/community)

### Maintenance Tasks

#### Regular Updates
- **Dependencies**: Keep npm packages up to date
- **Security**: Run security audits regularly
- **Database**: Monitor and optimize queries
- **Backups**: Ensure Supabase backups are configured

#### Performance Monitoring
- **Query Performance**: Monitor slow database queries
- **Bundle Size**: Keep JavaScript bundle optimized
- **Core Web Vitals**: Monitor user experience metrics

---

This comprehensive documentation provides a complete overview of the FlowCode Financial system, from initial setup to advanced troubleshooting. The modular architecture and well-defined patterns make it suitable for both new developers joining the project and experienced team members needing reference material.

## Contributing

When contributing to this project, please follow these guidelines:

1. **Code Style**: Follow the existing code patterns and ESLint rules
2. **Commits**: Use conventional commit messages
3. **Testing**: Test your changes thoroughly before submitting
4. **Documentation**: Update this README when adding new features

## License

This project is proprietary software developed for FlowCode Financial.