import { Users, FileText } from "lucide-react";

export function ColaboradorContractsTab() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-6 p-4 bg-blue-50 rounded-full">
        <Users className="h-12 w-12 text-blue-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Contratos com Colaboradores
      </h3>
      <p className="text-gray-600 mb-6 max-w-md line-clamp-2 text-sm leading-5 max-h-10 overflow-hidden">
        Sistema de contratos com colaboradores em desenvolvimento. Em breve você poderá criar, gerenciar e assinar contratos com funcionários, freelancers e parceiros.
      </p>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <FileText className="h-4 w-4" />
        <span>Funcionalidade disponível em breve</span>
      </div>
    </div>
  );
}