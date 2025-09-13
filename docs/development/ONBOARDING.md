# 🚀 Developer Onboarding Guide

Welcome to FlowCode Financial! This guide will help you get up to speed quickly and understand our development patterns.

## 🎯 Quick Start Checklist

### Day 1: Setup & Familiarization
- [ ] Clone repository and run `npm install`
- [ ] Set up environment variables (`.env.local`)
- [ ] Run `npm run dev` and explore the application
- [ ] Read the main README.md
- [ ] Review this onboarding guide
- [ ] Join team communication channels

### Day 2-3: Core Understanding
- [ ] Study the project architecture (see `docs/architecture/`)
- [ ] Understand the database schema via Supabase dashboard
- [ ] Review key components and their relationships
- [ ] Practice with development workflow
- [ ] Complete your first small task

### Week 1: Deep Dive
- [ ] Understand the billing system workflow
- [ ] Learn the payment processing flow
- [ ] Study the contract management system
- [ ] Practice debugging common issues
- [ ] Complete a medium-complexity feature

## 🏗️ Project Architecture Overview

### Frontend Architecture
```
React + TypeScript
├── UI Layer (shadcn/ui components)
├── Feature Components (organized by domain)
├── Custom Hooks (data fetching & logic)
├── Services (API calls & business logic)
└── Types (TypeScript definitions)
```

### Key Concepts to Understand

#### 1. **Two-Scope Billing System**
- **Open Scope**: Recurring billing for ongoing services
- **Closed Scope**: Fixed payments with defined installments
- Both types can be viewed together in the "Todos" tab

#### 2. **Payment-CashFlow Sync**
- When payments are marked as "paid", they automatically sync to cash flow
- This maintains financial accuracy across the system
- Client relationships are preserved in the sync

#### 3. **Search & Filtering**
- Each tab has independent search functionality
- Status filters adapt based on expand/collapse state
- Data sources change based on user preferences

## 🎨 Code Patterns & Conventions

### 1. Component Organization
```typescript
// ✅ Good: Feature-based organization
src/components/payments/
├── PaymentTable.tsx
├── PaymentDetailsDialog.tsx
└── NewPaymentForm.tsx

// ❌ Avoid: Generic component names
src/components/
├── Table.tsx
├── Dialog.tsx
└── Form.tsx
```

### 2. Custom Hooks Pattern
```typescript
// ✅ Good: Domain-specific hooks
export const useBillingData = () => {
  // Fetch billing data
  // Transform data for UI
  // Return organized data with actions
};

// ❌ Avoid: Generic data hooks
export const useData = (type: string) => {
  // Generic data fetching
};
```

### 3. TypeScript Usage
```typescript
// ✅ Good: Strict typing with interfaces
interface RecurringBilling {
  id: string;
  client_id: string;
  amount: number;
  status: BillingStatus;
}

// ❌ Avoid: Using 'any' type
const billing: any = getData();
```

### 4. Error Handling
```typescript
// ✅ Good: Proper error handling with user feedback
try {
  await updatePayment(data);
  toast({
    title: "Sucesso",
    description: "Pagamento atualizado com sucesso."
  });
} catch (error) {
  console.error("Error:", error);
  toast({
    title: "Erro",
    description: "Não foi possível atualizar o pagamento.",
    variant: "destructive"
  });
}
```

## 📊 Understanding the Data Flow

### 1. Client Management Flow
```
Client Registration → Client Table → Billing Setup → Payment Tracking
```

### 2. Billing System Flow
```
Recurring Billing Setup → Payment Generation → Status Tracking → Cash Flow Sync
```

### 3. Contract Management Flow
```
Contract Creation → Client Signing → Webhook Processing → Status Updates
```

## 🔧 Development Workflow

### 1. Starting a New Feature
1. Create a new branch: `git checkout -b feature/your-feature-name`
2. Plan the feature (identify components, hooks, types needed)
3. Start with TypeScript interfaces/types
4. Build components incrementally
5. Add error handling and loading states
6. Test thoroughly before PR

### 2. Code Review Checklist
- [ ] TypeScript types are properly defined
- [ ] Error handling is implemented
- [ ] Loading states are handled
- [ ] User feedback (toasts) are included
- [ ] Code follows existing patterns
- [ ] No console.log statements in production code

### 3. Testing Your Changes
```bash
# Run linting
npm run lint

# Check TypeScript
npx tsc --noEmit

# Test the application
npm run dev
```

## 🐛 Common Debugging Scenarios

### 1. "Payments disappearing after marking as paid"
**Issue**: Payments seem to disappear from listings after status change
**Solution**: Check if the payment is correctly synced to cash flow and verify filter states

### 2. "Search not working in specific tabs"
**Issue**: Search functionality doesn't work in some tabs
**Solution**: Each tab has independent search state. Check the correct search variable is being used

### 3. "Date formatting issues"
**Issue**: Dates showing as "Dia XX" instead of full dates
**Solution**: Ensure the component is using the processed data source with formatted dates

### 4. "Status not showing correctly"
**Issue**: Payment statuses not displaying properly
**Solution**: Verify if the billing is expanded (individual payments) or grouped (virtual billing)

## 🎯 Key Areas to Focus On

### For Frontend Developers
1. **React Patterns**: Hooks, Context, Component composition
2. **TypeScript**: Type safety, interfaces, enums
3. **UI/UX**: shadcn/ui components, Tailwind CSS patterns
4. **State Management**: React Query, form handling

### For Full-Stack Developers
5. **Supabase**: Database queries, RLS policies, Edge Functions
6. **API Design**: RESTful patterns, error handling
7. **Data Synchronization**: Payment-CashFlow sync patterns
8. **Email System**: Template management, notification flows

### For DevOps/Infrastructure
9. **Deployment**: Lovable platform, environment variables
10. **Monitoring**: Error tracking, performance monitoring
11. **Security**: Authentication flows, data protection

## 📚 Learning Resources

### Internal Documentation
- `README.md` - Complete project overview
- `docs/architecture/` - System architecture details
- `docs/workflows/` - Common development workflows
- `src/types/` - TypeScript type definitions

### External Resources
- [Supabase Documentation](https://supabase.com/docs)
- [React Query (TanStack Query)](https://tanstack.com/query)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🤝 Team Communication

### Daily Standups
- Share what you worked on yesterday
- Discuss any blockers or challenges
- Plan today's tasks

### Code Reviews
- Be constructive and respectful
- Focus on code quality and patterns
- Ask questions if something is unclear
- Suggest improvements when possible

### Knowledge Sharing
- Document new patterns you discover
- Share interesting solutions with the team
- Update documentation when you add features

## 🎉 Your First Contributions

### Easy First Tasks
1. Fix a small UI inconsistency
2. Add a new validation rule
3. Improve error messages
4. Update documentation

### Medium Tasks
1. Add a new field to an existing form
2. Implement a new filter option
3. Create a new component variant
4. Add a new email template

### Advanced Tasks
1. Implement a new feature module
2. Optimize a complex data flow
3. Add a new integration
4. Improve system performance

Remember: Don't hesitate to ask questions! The team is here to help you succeed. 🚀