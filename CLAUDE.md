# 🤖 Claude Development Context

This file contains essential context for AI-assisted development with Claude Code.

## 🎯 Project Overview

**FlowCode Financial** is a comprehensive Brazilian financial management platform built with:
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Key Features**: Billing management, cash flow tracking, contract management, payment processing

## 🏗️ Key Architecture Concepts

### 1. **Two-Scope Billing System**
- **Open Scope**: Recurring billing (ongoing services)
- **Closed Scope**: Fixed payments (project-based)
- **Unified in "Todos" tab**: Combined view of both scopes

### 2. **Payment-CashFlow Sync**
- Payments marked as "paid" automatically sync to cash flow
- Client relationships (client_id) are preserved in sync
- Implemented via `syncPaymentToCashFlow` service

### 3. **Independent Search States**
Each tab maintains separate search functionality:
- `allSearch` - "Todos" tab
- `billingSearch` - "Escopo Aberto" tab  
- `paymentSearch` - "Escopo Fechado" tab

## 🔧 Development Commands

```bash
# Development
npm run dev                 # Start dev server (port 8080)
npm run build              # Production build
npm run preview            # Preview build

# Code Quality  
npm run lint               # Run ESLint
npm run lint:fix           # Fix ESLint issues
npm run check:all          # Complete code check

# Database
# Supabase dashboard: https://itlpvpdwgiwbdpqheemw.supabase.co
```

## 📂 Project Structure

```
src/
├── components/           # Feature components by domain
│   ├── ui/              # shadcn/ui base components
│   ├── auth/            # Authentication
│   ├── billing/         # Billing management  
│   ├── payments/        # Payment processing
│   ├── cash-flow/       # Cash flow tracking
│   └── contracts/       # Contract management
├── hooks/               # Custom React hooks
├── services/            # Business logic & API calls
├── types/               # TypeScript definitions
└── pages/               # Route components
```

## 🎨 Code Conventions

### 1. **Component Patterns**
- Feature-based organization by domain
- Custom hooks for data management (`useFeatureData`)
- Service layer for business logic
- Consistent error handling with toast notifications

### 2. **TypeScript Usage**
- Strict typing with interfaces
- Avoid `any` type usage
- Enum-based status management
- Type-safe API responses

### 3. **State Management**
- **React Query**: Server state caching
- **useState/useReducer**: Local component state  
- **Context API**: Global state (auth, theme)

## 🔄 Common Workflows

### Adding a New Feature
1. Create domain-specific folder in `src/components/`
2. Define TypeScript interfaces in `types/`
3. Create custom hook for data management
4. Build components with error handling
5. Add to routing if needed

### Debugging Payment Issues
1. Check filter states for tab visibility
2. Verify search state for correct tab
3. Confirm data source (grouped vs expanded)
4. Test payment-to-cashflow sync

### Database Schema Access
- Use Supabase dashboard for schema reference
- Edge Functions in `supabase/functions/`
- RLS policies protect data access

## 🐛 Common Issues & Solutions

### "Payments disappearing after status change"
**Check**: Status filters and payment-to-cashflow sync

### "Search not working in specific tabs"  
**Check**: Independent search states (`allSearch`, `billingSearch`, `paymentSearch`)

### "Date showing as 'Dia XX' instead of full date"
**Check**: Using processed data sources (`finalOpenScopeBillings`, `finalClosedScopeBillings`)

### "Status display inconsistency"
**Check**: Billing type detection (`isExpandedPayment`, `isVirtualBilling`)

## 📚 Key Files Reference

### Core Components
- `src/components/RecurringBilling.tsx` - Main billing interface
- `src/components/recurring-billing/BillingTable.tsx` - Table rendering
- `src/components/recurring-billing/RecurringBillingRow.tsx` - Row logic

### Data Management  
- `src/hooks/useBillingData.ts` - Billing data fetching
- `src/hooks/useCashFlow.ts` - Cash flow management
- `src/services/paymentCashFlowSync.ts` - Payment sync logic

### Types
- `src/types/billing.ts` - Billing interfaces
- `src/types/payment.ts` - Payment interfaces
- `src/types/cashflow.ts` - Cash flow interfaces

## 🚀 Recent Improvements

### Last Changes Made
- Fixed date display in "Todos" tab to show dd/mm/yyyy format
- Enhanced payment-to-cashflow sync with client_id integration
- Added independent search functionality for each tab
- Improved status display consistency across all tabs

### Latest Commit
- Enhanced billing tab functionality and payment sync improvements
- Optimized data source selection for proper formatting when expanded

## 💡 Development Tips

### For AI Assistance
1. **Context Awareness**: This system has complex data relationships - always consider the two-scope architecture
2. **Error Handling**: Always include proper error handling with toast notifications
3. **TypeScript**: Maintain strict typing - avoid `any` types
4. **Testing**: Test changes across all three tabs (Todos, Escopo Aberto, Escopo Fechado)
5. **Data Flow**: Understand the data transformation pipeline from raw DB data to UI models

### Performance Considerations
- React Query handles caching and background updates
- Use `useMemo` for expensive calculations
- Implement optimistic updates for better UX

### Security
- All data access protected by Supabase RLS
- Client-side validation backed by server-side checks
- Sensitive operations require authentication

---

This context file helps maintain consistency and accelerates development with Claude Code assistance.