import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useServices = () => {
  const [services, setServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        console.log('🔍 Fetching services enum from Supabase...');
        
        // Query para descobrir os valores da enum services
        const { data, error } = await supabase
          .rpc('get_enum_values', {
            schema_name: 'public',
            type_name: 'services'
          });

        if (error) {
          console.log('RPC failed, trying alternative method:', error);
          
          // Método alternativo: query SQL direta
          const { data: enumData, error: enumError } = await supabase
            .rpc('execute_sql', {
              sql: `
                SELECT unnest(enum_range(NULL::services)) as service_value;
              `
            });

          if (enumError) {
            console.log('SQL method failed, trying schema query:', enumError);
            
            // Último método: consultar o information_schema
            const { data: schemaData, error: schemaError } = await supabase
              .from('information_schema.enum_values')
              .select('enumlabel')
              .eq('enumtypid', 'services');
              
            if (schemaError) {
              throw new Error('Could not fetch enum values: ' + schemaError.message);
            }
            
            const services = schemaData?.map(row => row.enumlabel) || [];
            console.log('✅ Got services from schema:', services);
            setServices(services);
            return;
          }
          
          const services = enumData?.map(row => row.service_value) || [];
          console.log('✅ Got services from SQL:', services);
          setServices(services);
          return;
        }

        console.log('✅ Got services from RPC:', data);
        setServices(data || []);
      } catch (error) {
        console.error('❌ All methods failed, error:', error);
        // Como último recurso, usar valores padrão
        setServices(['desenvolvimento', 'consultoria', 'design', 'marketing', 'suporte']);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return { services, loading };
};