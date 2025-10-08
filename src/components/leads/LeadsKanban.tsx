import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  EditIcon,
  TrashIcon,
  Phone,
  Mail,
  Building,
  Calendar,
  DollarSign,
  User,
  Settings,
  GripVertical
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useLeads } from "@/hooks/useLeads";
import { formatCurrency } from "@/components/payments/utils/formatUtils";
import { formatDate } from "@/utils/formatters";

// Helper function to calculate closing time
const calculateClosingTime = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "1 dia";
  if (diffDays < 30) return `${diffDays} dias`;

  const months = Math.floor(diffDays / 30);
  const remainingDays = diffDays % 30;

  if (months === 1 && remainingDays === 0) return "1 mês";
  if (months === 1) return `1 mês e ${remainingDays} dias`;
  if (remainingDays === 0) return `${months} meses`;
  return `${months} meses e ${remainingDays} dias`;
};
import { Lead, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, LeadStatus } from "@/types/lead";
import { EditLeadDialog } from "./EditLeadDialog";

interface LeadsKanbanProps {
  searchTerm: string;
}

const defaultStatusOrder: LeadStatus[] = [
  "Income",
  "Contact Made",
  "Proposal Sent",
  "Contract",
  "Future",
  "Won",
  "Lost"
];

// Draggable Lead Card Component
function DraggableLeadCard({
  lead,
  onEdit,
  onDelete,
  onStatusChange,
  statusOrder
}: {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onDelete: (id: number) => void;
  onStatusChange: (leadId: number, newStatus: LeadStatus) => void;
  statusOrder: LeadStatus[];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getStatusBadge = (status: LeadStatus) => {
    const colorClass = LEAD_STATUS_COLORS[status];
    const label = LEAD_STATUS_LABELS[status];

    return (
      <Badge className={`${colorClass} border-0 text-xs`}>
        {label}
      </Badge>
    );
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onEdit(lead)}
    >
      <CardContent className="p-4">
        {/* Lead Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">{lead.Nome}</span>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(lead.id);
              }}
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            >
              <TrashIcon className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-1 mb-3">
          {lead.Email && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate">{lead.Email}</span>
            </div>
          )}
          {lead.Celular && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{lead.Celular}</span>
            </div>
          )}
          {lead.Valor && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              <span className="font-medium text-green-600">{formatCurrency(lead.Valor)}</span>
            </div>
          )}
          {/* Data de início */}
          <div className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 p-1 rounded">
            <Calendar className="h-3 w-3" />
            <span>Criado em: {lead.created_at ? formatDate(lead.created_at) : 'N/A'}</span>
          </div>
          {/* Data de fechamento para leads ganhos */}
          {lead.Status === "Won" && lead.won_at && (
            <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 p-1 rounded">
              <Calendar className="h-3 w-3" />
              <span>Ganho em: {formatDate(lead.won_at)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {getStatusBadge(lead.Status)}

          {/* Tempo de fechamento para leads ganhos */}
          {lead.Status === "Won" && lead.won_at && (
            <span className="text-xs text-green-600 font-medium">
              {calculateClosingTime(lead.created_at, lead.won_at)}
            </span>
          )}
        </div>

        {/* Quick Status Change */}
        <div className="mt-3 pt-3 border-t">
          <div className="flex gap-1 flex-wrap">
            {statusOrder
              .filter(s => s !== lead.Status)
              .slice(0, 2)
              .map((newStatus) => (
                <Button
                  key={newStatus}
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(lead.id, newStatus);
                  }}
                  className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {LEAD_STATUS_LABELS[newStatus]}
                </Button>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Sortable Column Component
function SortableColumn({
  status,
  leads,
  onEdit,
  onDelete,
  onStatusChange,
  onEditStatus,
  onDeleteStatus,
  statusOrder
}: {
  status: LeadStatus;
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onDelete: (id: number) => void;
  onStatusChange: (leadId: number, newStatus: LeadStatus) => void;
  onEditStatus: (status: LeadStatus) => void;
  onDeleteStatus: (status: LeadStatus) => void;
  statusOrder: LeadStatus[];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `column-${status}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const statusColors = {
    "Income": "from-slate-800/50 to-slate-900/50 border-slate-700",
    "Contact Made": "from-yellow-800/50 to-yellow-900/50 border-yellow-700",
    "Proposal Sent": "from-purple-800/50 to-purple-900/50 border-purple-700",
    "Contract": "from-indigo-800/50 to-indigo-900/50 border-indigo-700",
    "Future": "from-cyan-800/50 to-cyan-900/50 border-cyan-700",
    "Won": "from-green-800/50 to-green-900/50 border-green-700",
    "Lost": "from-red-800/50 to-red-900/50 border-red-700"
  };

  const statusTextColors = {
    "Income": "text-slate-100",
    "Contact Made": "text-yellow-100",
    "Proposal Sent": "text-purple-100",
    "Contract": "text-indigo-100",
    "Future": "text-cyan-100",
    "Won": "text-green-100",
    "Lost": "text-red-100"
  };

  const statusBadgeColors = {
    "Income": "border-slate-400 text-slate-100",
    "Contact Made": "border-yellow-400 text-yellow-100",
    "Proposal Sent": "border-purple-400 text-purple-100",
    "Contract": "border-indigo-400 text-indigo-100",
    "Future": "border-cyan-400 text-cyan-100",
    "Won": "border-green-400 text-green-100",
    "Lost": "border-red-400 text-red-100"
  };

  return (
    <div ref={setNodeRef} style={style} className="flex-shrink-0 w-80 space-y-3">
      {/* Column Header */}
      <div className={`bg-gradient-to-r ${statusColors[status]} rounded-lg group`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-white/60 hover:text-white" />
            </div>
            <h3 className={`text-sm font-medium ${statusTextColors[status]}`}>
              {LEAD_STATUS_LABELS[status]}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded border ${statusBadgeColors[status]}`}>
              {leads.length}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEditStatus(status)}
                className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
              >
                <EditIcon className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDeleteStatus(status)}
                className="h-6 w-6 p-0 text-white/60 hover:text-red-300 hover:bg-white/10"
              >
                <TrashIcon className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Droppable Area */}
      <DroppableArea
        id={`status-${status}`}
        status={status}
        leads={leads}
        onEdit={onEdit}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
        statusOrder={statusOrder}
      />
    </div>
  );
}

// Droppable Area Component
function DroppableArea({
  id,
  status,
  leads,
  onEdit,
  onDelete,
  onStatusChange,
  statusOrder
}: {
  id: string;
  status: LeadStatus;
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onDelete: (id: number) => void;
  onStatusChange: (leadId: number, newStatus: LeadStatus) => void;
  statusOrder: LeadStatus[];
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`space-y-2 min-h-[400px] p-2 rounded-lg border-2 border-dashed transition-all duration-200 ${
        isOver
          ? 'border-primary/50 bg-primary/5 scale-[1.02]'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50'
      }`}
      data-status={status}
    >
      <SortableContext
        items={leads.map(lead => lead.id.toString())}
        strategy={verticalListSortingStrategy}
      >
        {leads.map((lead) => (
          <DraggableLeadCard
            key={lead.id}
            lead={lead}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            statusOrder={statusOrder}
          />
        ))}
      </SortableContext>
    </div>
  );
}

export function LeadsKanban({ searchTerm }: LeadsKanbanProps) {
  const { leads, isLoading, deleteLead, updateLead } = useLeads();
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [statusOrder, setStatusOrder] = useState<LeadStatus[]>(defaultStatusOrder);

  console.log('LeadsKanban - Component state:', {
    leadsCount: leads.length,
    isLoading,
    searchTerm,
    firstLead: leads[0] ? {
      id: leads[0].id,
      Nome: leads[0].Nome,
      Status: leads[0].Status,
      idType: typeof leads[0].id
    } : null
  });


  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredLeads = useMemo(() => {
    console.log('LeadsKanban - Filtering leads:', {
      totalLeads: leads.length,
      searchTerm,
      leads: leads.slice(0, 2) // Show first 2 leads for debug
    });

    if (!searchTerm) return leads;

    const filtered = leads.filter((lead) =>
      lead.Nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.Celular?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    console.log('LeadsKanban - Filtered result:', {
      originalCount: leads.length,
      filteredCount: filtered.length,
      searchTerm
    });

    return filtered;
  }, [leads, searchTerm]);

  const leadsByStatus = useMemo(() => {
    const grouped: Record<LeadStatus, Lead[]> = {
      "Income": [],
      "Contact Made": [],
      "Proposal Sent": [],
      "Contract": [],
      "Future": [],
      "Won": [],
      "Lost": []
    };

    filteredLeads.forEach((lead) => {
      if (grouped[lead.Status]) {
        grouped[lead.Status].push(lead);
      }
    });

    return grouped;
  }, [filteredLeads]);

  const handleDelete = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este lead?")) {
      deleteLead(id);
    }
  };

  const handleStatusChange = (leadId: number, newStatus: LeadStatus) => {
    updateLead({ id: leadId, updates: { Status: newStatus } });
  };

  const handleEditStatus = (status: LeadStatus) => {
    const newName = prompt(`Editar status "${LEAD_STATUS_LABELS[status]}":`, LEAD_STATUS_LABELS[status]);
    if (newName && newName.trim()) {
      // TODO: Implementar edição de status no backend
      console.log(`Editando status ${status} para: ${newName}`);
    }
  };

  const handleDeleteStatus = (status: LeadStatus) => {
    const statusLeads = leadsByStatus[status];
    if (statusLeads.length > 0) {
      alert(`Não é possível excluir o status "${LEAD_STATUS_LABELS[status]}" pois existem ${statusLeads.length} leads neste status.`);
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir o status "${LEAD_STATUS_LABELS[status]}"?`)) {
      // TODO: Implementar exclusão de status no backend
      setStatusOrder(prev => prev.filter(s => s !== status));
      console.log(`Excluindo status: ${status}`);
    }
  };

  const handleDragEnd = (event: { active: { id: string }; over: { id: string } | null }) => {
    const { active, over } = event;

    console.log('LeadsKanban - Drag end event:', {
      active: active,
      over: over,
      activeId: active.id,
      overId: over?.id
    });

    if (!over) {
      console.log('LeadsKanban - No drop target, returning');
      return;
    }

    // Check if we're dragging a column
    if (active.id.startsWith('column-') && over.id.startsWith('column-')) {
      const activeStatus = active.id.replace('column-', '') as LeadStatus;
      const overStatus = over.id.replace('column-', '') as LeadStatus;

      if (activeStatus !== overStatus) {
        const activeIndex = statusOrder.indexOf(activeStatus);
        const overIndex = statusOrder.indexOf(overStatus);

        if (activeIndex !== -1 && overIndex !== -1) {
          const newOrder = arrayMove(statusOrder, activeIndex, overIndex);
          setStatusOrder(newOrder);
          console.log('LeadsKanban - Reordered status columns:', newOrder);
        }
      }
      return;
    }

    // Handle lead dragging (existing logic)
    // Check if dropped on a valid droppable area (must start with "status-")
    if (!over.id.startsWith('status-')) {
      console.log('LeadsKanban - Not dropped on valid status area:', over.id);
      return;
    }

    // Extract status from droppable id (format: "status-{StatusName}")
    const newStatus = over.id.replace('status-', '') as LeadStatus;
    const leadId = parseInt(active.id); // Convert back to number

    // Validate leadId is a valid number
    if (isNaN(leadId) || leadId <= 0) {
      console.log('LeadsKanban - Invalid leadId:', active.id, 'parsed as:', leadId);
      return;
    }

    // Validate that newStatus is a valid LeadStatus
    const validStatuses: LeadStatus[] = ["Income", "Contact Made", "Proposal Sent", "Contract", "Future", "Won", "Lost"];
    if (!validStatuses.includes(newStatus)) {
      console.log('LeadsKanban - Invalid status extracted:', newStatus);
      return;
    }

    console.log('LeadsKanban - Processing drag:', {
      leadId,
      newStatus,
      overId: over.id
    });

    // Find the lead being dragged
    const draggedLead = filteredLeads.find(lead => lead.id === leadId);

    if (!draggedLead) {
      console.log('LeadsKanban - Lead not found in filteredLeads:', leadId);
      return;
    }

    console.log('LeadsKanban - Dragged lead found:', {
      draggedLead: { id: draggedLead.id, status: draggedLead.Status },
      newStatus,
      willUpdate: draggedLead.Status !== newStatus
    });

    // Only update if status is actually changing
    if (draggedLead.Status !== newStatus) {
      console.log('LeadsKanban - Updating lead status from', draggedLead.Status, 'to', newStatus);
      handleStatusChange(leadId, newStatus);
    } else {
      console.log('LeadsKanban - Status unchanged, no update needed');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-muted-foreground">Carregando leads...</p>
      </div>
    );
  }

  // Show message when no filtered results
  if (filteredLeads.length === 0) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-muted-foreground">
          {searchTerm ? "Nenhum lead encontrado para a busca." : "Nenhum lead cadastrado."}
        </p>
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minWidth: 'fit-content' }}>
          <SortableContext
            items={statusOrder.map(status => `column-${status}`)}
            strategy={horizontalListSortingStrategy}
          >
            {statusOrder.map((status) => {
              const statusLeads = leadsByStatus[status];

              return (
                <SortableColumn
                  key={status}
                  status={status}
                  leads={statusLeads}
                  onEdit={setEditingLead}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onEditStatus={handleEditStatus}
                  onDeleteStatus={handleDeleteStatus}
                  statusOrder={statusOrder}
                />
              );
            })}
          </SortableContext>
        </div>
      </DndContext>

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