import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { syncContractsToProjects } from "@/services/contractProjectSync";

export default function TestSync() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const { toast } = useToast();

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  const testDatabaseAccess = async () => {
    setLoading(true);
    setResults([]);

    try {
      addResult("🔄 Testing database access...");

      // Test contratos table
      const { data: contracts, error: contractsError } = await supabase
        .from('contratos')
        .select('id, scope, client_id, status')
        .limit(10);

      if (contractsError) {
        addResult(`❌ Error accessing contratos: ${contractsError.message}`);
      } else {
        addResult(`📄 Found ${contracts?.length || 0} contracts`);
        contracts?.forEach(c => addResult(`  - Contract #${c.id}: ${c.scope || 'No scope'}`));
      }

      // Test projetos table
      const { data: projects, error: projectsError } = await supabase
        .from('projetos')
        .select('id, name, contract_id')
        .limit(10);

      if (projectsError) {
        addResult(`❌ Error accessing projetos: ${projectsError.message}`);
      } else {
        addResult(`🗂️ Found ${projects?.length || 0} projects`);
        projects?.forEach(p => addResult(`  - Project: ${p.name} (contract: ${p.contract_id || 'none'})`));
      }

      // Test sync function
      addResult("🔄 Testing sync function...");
      await syncContractsToProjects();
      addResult("✅ Sync completed");

      // Check projects again after sync
      const { data: newProjects, error: newProjectsError } = await supabase
        .from('projetos')
        .select('id, name, contract_id')
        .limit(10);

      if (newProjectsError) {
        addResult(`❌ Error checking projects after sync: ${newProjectsError.message}`);
      } else {
        addResult(`📋 After sync: ${newProjects?.length || 0} projects total`);
        newProjects?.forEach(p => addResult(`  - Project: ${p.name} (contract: ${p.contract_id || 'none'})`));
      }

    } catch (error: any) {
      addResult(`❌ Test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Test Contract-Project Sync</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={testDatabaseAccess}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Testing..." : "Run Sync Test"}
            </Button>

            {results.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Test Results:</h3>
                <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap">
                    {results.join('\n')}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}