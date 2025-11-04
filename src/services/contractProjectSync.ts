import { supabase } from "@/integrations/supabase/client";

export interface Contract {
  id: number;
  scope: string;
  projeto_relacionado?: string;
  client_id?: string;
  status?: string;
  clients?: {
    name: string;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  client_id?: string;
  contract_id?: number;
  status: 'active' | 'paused' | 'completed';
}

/**
 * Sincroniza contratos com projetos, criando projetos automaticamente para contratos que não possuem um
 */
export const syncContractsToProjects = async (): Promise<void> => {
  try {
    console.log("🔄 Starting contract-to-project sync...");

    // 1. Buscar todos os contratos
    const { data: contracts, error: contractsError } = await supabase
      .from('contratos')
      .select(`
        id,
        scope,
        projeto_relacionado,
        client_id,
        status,
        clients!fk_contratos_client (
          name
        )
      `);

    if (contractsError) {
      console.error("❌ Error fetching contracts:", contractsError);
      throw contractsError;
    }

    console.log(`📄 Found ${contracts?.length || 0} contracts in database`);

    if (!contracts || contracts.length === 0) {
      console.log("⚠️ No contracts found to sync");
      return;
    }

    // 2. Buscar projetos existentes
    const { data: existingProjects, error: projectsError } = await supabase
      .from('projetos')
      .select('id, contract_id');

    if (projectsError) {
      console.error("❌ Error fetching existing projects:", projectsError);
      throw projectsError;
    }

    console.log(`🗂️ Found ${existingProjects?.length || 0} existing projects in database`);

    // 3. Identificar contratos que não possuem projetos
    const existingContractIds = new Set(
      existingProjects?.map(p => p.contract_id).filter(id => id !== null) || []
    );

    console.log(`🔗 Existing contract IDs with projects: [${Array.from(existingContractIds).join(', ')}]`);

    const contractsNeedingProjects = contracts.filter(
      contract => !existingContractIds.has(contract.id)
    );

    console.log(`📝 Found ${contractsNeedingProjects.length} contracts that need projects:`,
      contractsNeedingProjects.map(c => `#${c.id} (${c.scope})`).join(', '));

    if (contractsNeedingProjects.length === 0) {
      console.log("✅ All contracts already have associated projects");
      return;
    }

    // 4. Criar projetos para contratos sem projetos
    const projectsToCreate = contractsNeedingProjects.map(contract => {
      // Usar projeto_relacionado como nome se existir, senão usar scope ou nome padrão
      const projectName = (
        contract.projeto_relacionado ||
        contract.scope ||
        `Projeto - Contrato #${contract.id}`
      ).slice(0, 250);

      // Limitar a descrição a 250 caracteres
      const projectDescription = `Projeto gerado automaticamente a partir do contrato #${contract.id}${contract.clients ? ` (${contract.clients.name})` : ''}`.slice(0, 250);

      return {
        name: projectName,
        description: projectDescription,
        client_id: contract.client_id || null,
        contract_id: contract.id,
        status: mapContractStatusToProjectStatus(contract.status)
      };
    });

    console.log(`📋 Creating ${projectsToCreate.length} new projects:`,
      projectsToCreate.map(p => `"${p.name}" (contract #${p.contract_id})`).join(', '));

    // 5. Inserir os novos projetos
    const { data: newProjects, error: insertError } = await supabase
      .from('projetos')
      .insert(projectsToCreate)
      .select();

    if (insertError) {
      console.error("❌ Error creating projects:", insertError);
      throw insertError;
    }

    console.log(`✅ Successfully created ${newProjects?.length || 0} projects from contracts`);

    return;
  } catch (error) {
    console.error("Error in contract-to-project sync:", error);
    throw error;
  }
};

/**
 * Mapeia o status do contrato para o status do projeto
 */
const mapContractStatusToProjectStatus = (contractStatus?: string): 'active' | 'paused' | 'completed' => {
  switch (contractStatus?.toLowerCase()) {
    case 'ativo':
    case 'active':
    case 'assinado':
    case 'signed':
      return 'active';
    case 'pausado':
    case 'paused':
    case 'suspenso':
      return 'paused';
    case 'finalizado':
    case 'completed':
    case 'encerrado':
    case 'concluido':
      return 'completed';
    default:
      return 'active'; // Status padrão
  }
};

/**
 * Cria um projeto automaticamente quando um novo contrato é adicionado
 */
export const createProjectFromContract = async (contract: Contract): Promise<void> => {
  try {
    // Usar projeto_relacionado como nome se existir, senão usar scope ou nome padrão
    const projectName = (
      contract.projeto_relacionado ||
      contract.scope ||
      `Projeto - Contrato #${contract.id}`
    ).slice(0, 250);

    const projectDescription = `Projeto gerado automaticamente a partir do contrato #${contract.id}${contract.clients ? ` (${contract.clients.name})` : ''}`.slice(0, 250);

    const projectData = {
      name: projectName,
      description: projectDescription,
      client_id: contract.client_id || null,
      contract_id: contract.id,
      status: mapContractStatusToProjectStatus(contract.status)
    };

    const { error } = await supabase
      .from('projetos')
      .insert([projectData]);

    if (error) {
      console.error("Error creating project from contract:", error);
      throw error;
    }

    console.log(`Successfully created project for contract #${contract.id}`);
  } catch (error) {
    console.error("Error in createProjectFromContract:", error);
    throw error;
  }
};