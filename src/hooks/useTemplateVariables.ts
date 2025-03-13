
import { variablesList } from "@/types/email";

type TemplateData = {
  [key: string]: string | number;
};

export const useTemplateVariables = () => {
  const renderTemplate = (
    content: string,
    type: 'clients' | 'employees',
    subtype: 'recurring' | 'oneTime' | 'invoice' | 'hours',
    data: TemplateData
  ) => {
    let renderedContent = content;
    
    const variables = variablesList[type]?.[subtype] || [];
    
    variables.forEach(variable => {
      const variableName = variable.name.replace(/[{}]/g, '');
      if (data[variableName] !== undefined) {
        const regex = new RegExp(variable.name.replace(/[{}]/g, '\\$&'), 'g');
        renderedContent = renderedContent.replace(regex, String(data[variableName]));
      }
    });
    
    return renderedContent;
  };

  return { renderTemplate };
};
