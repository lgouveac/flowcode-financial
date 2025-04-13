
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
    
    // First get the applicable variables list for this type/subtype
    const variables = variablesList[type]?.[subtype] || [];
    
    // Then replace each variable in the template
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
    
    return renderedContent;
  };

  return { renderTemplate };
};
