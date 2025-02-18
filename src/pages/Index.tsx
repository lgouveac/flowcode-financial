
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon, UserIcon, FileTextIcon, CreditCardIcon, BarChartIcon, WalletIcon, ReceiptIcon, UsersIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { EmployeeTable } from "@/components/EmployeeTable";
import { RecurringBilling } from "@/components/RecurringBilling";
import { ClientTable } from "@/components/ClientTable";
import { CashFlow } from "@/components/CashFlow";

const Index = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const stats = [
    { title: "Receita Total", value: "R$ 24.500", change: "+12.5%" },
    { title: "Em Aberto", value: "R$ 4.320", change: "-2.3%" },
    { title: "Clientes Ativos", value: "45", change: "+5" },
    { title: "Faturas Pendentes", value: "12", change: "-3" },
  ];

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <h1 className="font-display text-2xl font-bold tracking-tight">Sistema Financeiro</h1>
          <Button className="ml-auto" size="sm">
            <PlusIcon className="mr-2 h-4 w-4" />
            Nova Fatura
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container pt-8 animate-fade-in">
        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Card key={stat.title} className="p-6 transition-shadow hover:shadow-card-hover">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
                <div className="mt-2 flex items-baseline">
                  <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                  <span className={`ml-2 text-sm ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                    {stat.change}
                  </span>
                </div>
              </motion.div>
            </Card>
          ))}
        </div>

        {/* Navigation Tabs */}
        <nav className="mt-8 flex space-x-4 border-b border-border/40">
          {[
            { id: "overview", icon: BarChartIcon, label: "Visão Geral" },
            { id: "clients", icon: UserIcon, label: "Clientes" },
            { id: "employees", icon: UsersIcon, label: "Funcionários" },
            { id: "receivables", icon: ReceiptIcon, label: "Recebimentos" },
            { id: "cashflow", icon: WalletIcon, label: "Fluxo de Caixa" },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center px-4 py-2 text-sm font-medium transition-colors 
                ${activeTab === id 
                  ? 'border-b-2 border-primary text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-8 space-y-6"
          >
            {activeTab === "overview" && (
              <>
                <CashFlow />
                <EmployeeTable />
                <RecurringBilling />
              </>
            )}
            {activeTab === "clients" && <ClientTable />}
            {activeTab === "employees" && <EmployeeTable />}
            {activeTab === "receivables" && (
              <>
                <RecurringBilling />
                <Card className="mt-6">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl font-display">Cobranças Pontuais</CardTitle>
                    <Button size="sm">
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Nova Cobrança
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {/* Implementação da tabela de cobranças pontuais virá aqui */}
                  </CardContent>
                </Card>
              </>
            )}
            {activeTab === "cashflow" && <CashFlow />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Index;
