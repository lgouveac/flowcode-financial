import { useState, useMemo, useRef, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  EditIcon,
  TrashIcon,
  Phone,
  Mail,
  Building,
  Calendar,
  DollarSign,
  Check,
  X
} from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { formatCurrency } from "@/components/payments/utils/formatUtils";
import { formatDate } from "@/utils/formatters";
import { Lead, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from "@/types/lead";
import { EditLeadDialog } from "./EditLeadDialog";

interface LeadsTableProps {
  searchTerm: string;
}

export function LeadsTable({ searchTerm }: LeadsTableProps) {
  const { leads, isLoading, deleteLead, updateLead } = useLeads();

  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editingCell, setEditingCell] = useState<{ leadId: number; field: keyof Lead } | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredLeads = useMemo(() => {
    if (!searchTerm) return leads;

    return leads.filter((lead) =>
      lead.Nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.Email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.Celular?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [leads, searchTerm]);

  const handleDelete = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este lead?")) {
      deleteLead(id);
    }
  };

  const startEditing = (leadId: number, field: keyof Lead, currentValue: any) => {
    setEditingCell({ leadId, field });
    setEditingValue(currentValue?.toString() || "");
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditingValue("");
  };

  const saveEdit = async () => {
    if (!editingCell) return;

    const { leadId, field } = editingCell;
    let value: any = editingValue;

    // Convert value to appropriate type
    if (field === "Valor") {
      const numValue = parseFloat(editingValue.replace(/[^\d.,]/g, '').replace(',', '.'));
      value = isNaN(numValue) ? null : numValue;
    }

    await updateLead({ id: leadId, updates: { [field]: value } });
    cancelEditing();
  };

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  // Handle clicking outside to cancel editing
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingCell && !event.target?.closest('.editing-cell')) {
        cancelEditing();
      }
    };

    if (editingCell) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [editingCell]);

  const getStatusBadge = (status: string) => {
    const colorClass = LEAD_STATUS_COLORS[status] || "bg-gray-100 text-gray-800";
    const label = LEAD_STATUS_LABELS[status] || status;

    return (
      <Badge className={`${colorClass} border-0`}>
        {label}
      </Badge>
    );
  };

  const renderEditableCell = (lead: Lead, field: keyof Lead, value: any, icon?: React.ReactNode) => {
    const isEditing = editingCell?.leadId === lead.id && editingCell?.field === field;

    if (isEditing) {
      if (field === "Status") {
        return (
          <div className="flex items-center gap-2 editing-cell">
            <Select value={editingValue} onValueChange={setEditingValue}>
              <SelectTrigger className="h-8 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={saveEdit} className="h-6 w-6 p-0 text-green-600">
                <Check className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={cancelEditing} className="h-6 w-6 p-0 text-red-600">
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        );
      } else {
        return (
          <div className="flex items-center gap-2 editing-cell">
            <Input
              ref={inputRef}
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit();
                if (e.key === "Escape") cancelEditing();
              }}
              className="h-8"
              placeholder={field === "Valor" ? "0,00" : `Digite ${field.toLowerCase()}`}
            />
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={saveEdit} className="h-6 w-6 p-0 text-green-600">
                <Check className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={cancelEditing} className="h-6 w-6 p-0 text-red-600">
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        );
      }
    }

    // Display mode
    const displayValue = field === "Valor" && value ? formatCurrency(value) : value;

    return (
      <div
        className="flex items-center gap-1 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
        onClick={() => startEditing(lead.id, field, value)}
      >
        {icon}
        <span className={!value ? "text-muted-foreground italic" : ""}>
          {displayValue || `Adicionar ${field.toLowerCase()}`}
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-muted-foreground">Carregando leads...</p>
      </div>
    );
  }

  if (filteredLeads.length === 0) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-muted-foreground">
          {searchTerm ? "Nenhum lead encontrado." : "Nenhum lead cadastrado."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Celular</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead) => (
              <TableRow key={lead.id} className="hover:bg-muted/25">
                <TableCell>
                  <div className="font-medium">
                    {renderEditableCell(lead, "Nome", lead.Nome)}
                  </div>
                </TableCell>

                <TableCell>
                  {renderEditableCell(
                    lead,
                    "Email",
                    lead.Email,
                    <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  )}
                </TableCell>

                <TableCell>
                  {renderEditableCell(
                    lead,
                    "Celular",
                    lead.Celular,
                    <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  )}
                </TableCell>

                <TableCell>
                  {renderEditableCell(
                    lead,
                    "Valor",
                    lead.Valor,
                    <DollarSign className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  )}
                </TableCell>

                <TableCell>
                  <div className="cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
                       onClick={() => startEditing(lead.id, "Status", lead.Status)}>
                    {editingCell?.leadId === lead.id && editingCell?.field === "Status" ? (
                      <div className="flex items-center gap-2 editing-cell">
                        <Select value={editingValue} onValueChange={setEditingValue}>
                          <SelectTrigger className="h-8 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={saveEdit} className="h-6 w-6 p-0 text-green-600">
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEditing} className="h-6 w-6 p-0 text-red-600">
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      getStatusBadge(lead.Status)
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(lead.created_at)}
                  </span>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingLead(lead)}
                      className="h-8 w-8 p-0"
                      title="Editar tudo"
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(lead.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      title="Excluir lead"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Lead Dialog */}
      {editingLead && (
        <EditLeadDialog
          lead={editingLead}
          open={!!editingLead}
          onClose={() => setEditingLead(null)}
        />
      )}
    </>
  );
}