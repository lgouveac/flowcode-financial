
import { variablesList } from "@/types/email";

type TemplateData = {
  [key: string]: string | number;
};

export const useTemplateVariables = () => {
  const renderTemplate = (
    content: string,
    type: 'clients' | 'employees',
    subtype: 'recurring' | 'oneTime' | 'invoice' | 'hours' | 'reminder' | 'contract' | 'novo_subtipo',
    data: TemplateData
  ) => {
    let renderedContent = content;
    
    // Get the applicable variables list for this type/subtype
    const variables = variablesList[type]?.[subtype] || [];
    
    // Replace each variable in the template
    variables.forEach(variable => {
      // Get the variable name without the braces
      const variableName = variable.name.replace(/[{}]/g, '');
      
      // Check if we have a value for this variable
      if (data[variableName] !== undefined) {
        // Create a regex to find all instances of the variable in the template
        const regex = new RegExp(`{${variableName}}`, 'g');
        
        // Replace all occurrences with the actual value
        renderedContent = renderedContent.replace(regex, String(data[variableName]));
      }
    });
    
    // Double check for any remaining variables and use fallback values
    const remainingVariables = content.match(/{[^{}]+}/g) || [];
    
    remainingVariables.forEach(variable => {
      const variableName = variable.replace(/[{}]/g, '');
      if (!data[variableName]) {
        const fallbackValue = getFallbackValue(variableName);
        const regex = new RegExp(`{${variableName}}`, 'g');
        renderedContent = renderedContent.replace(regex, fallbackValue);
      }
    });
    
    return renderedContent;
  };

  // Helper function to provide fallback values for common variables
  const getFallbackValue = (variableName: string): string => {
    switch (variableName) {
      case 'nome_cliente':
        return 'Cliente';
      case 'nome_responsavel':
        return 'Responsável';
      case 'valor_cobranca':
        return 'R$ 0,00';
      case 'data_vencimento':
        return new Date().toLocaleDateString('pt-BR');
      case 'numero_parcela':
        return '1';
      case 'total_parcelas':
        return '1';
      case 'forma_pagamento':
        return 'PIX';
      case 'dias_atraso':
        return '0';
      case 'cnpj':
        return '[CNPJ do cliente]';
      case 'cpf':
        return '[CPF do cliente]';
      case 'endereco':
        return '[Endereço do cliente]';
      case 'valor_mensal':
        return 'R$ 0,00';
      case 'data_inicio':
        return new Date().toLocaleDateString('pt-BR');
      case 'nome_funcionario':
        return 'Funcionário';
      case 'email_funcionario':
        return 'email@exemplo.com';
      default:
        return `[${variableName}]`;
    }
  };

  return { renderTemplate };
};
