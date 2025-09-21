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
  User
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
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useLeads } from "@/hooks/useLeads";
import { formatCurrency } from "@/components/payments/utils/formatUtils";
import { formatDate } from "@/utils/formatters";
import { Lead, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, LeadStatus } from "@/types/lead";
import { EditLeadDialog } from "./EditLeadDialog";

interface LeadsKanbanProps {
  searchTerm: string;
}

const statusOrder: LeadStatus[] = [
  "Income",
  "Contact Made",
  "Proposal Sent",
  "Won",
  "Lost"
];

// Draggable Lead Card Component
function DraggableLeadCard({
  lead,
  onEdit,
  onDelete,
  onStatusChange
}: {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onDelete: (id: number) => void;
  onStatusChange: (leadId: number, newStatus: LeadStatus) => void;
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
      className="hover:shadow-md transition-shadow cursor-move group"
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
                onEdit(lead);
              }}
              className="h-6 w-6 p-0"
            >
              <EditIcon className="h-3 w-3" />
            </Button>
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
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span className="truncate">{lead.Email}</span>
          </div>
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {getStatusBadge(lead.Status)}

          <span className="text-xs text-muted-foreground">
            {formatDate(lead.created_at)}
          </span>
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

// Droppable Area Component
function DroppableArea({
  id,
  status,
  leads,
  onEdit,
  onDelete,
  onStatusChange
}: {
  id: string;
  status: LeadStatus;
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onDelete: (id: number) => void;
  onStatusChange: (leadId: number, newStatus: LeadStatus) => void;
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
          />
        ))}
      </SortableContext>
    </div>
  );
}

export function LeadsKanban({ searchTerm }: LeadsKanbanProps) {
  const { leads, isLoading, deleteLead, updateLead } = useLeads();
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

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
    const validStatuses: LeadStatus[] = ["Income", "Contact Made", "Proposal Sent", "Won", "Lost"];
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

  const statusColors = {
    "Income": "from-slate-800/50 to-slate-900/50 border-slate-700",
    "Contact Made": "from-yellow-800/50 to-yellow-900/50 border-yellow-700",
    "Proposal Sent": "from-purple-800/50 to-purple-900/50 border-purple-700",
    "Won": "from-green-800/50 to-green-900/50 border-green-700",
    "Lost": "from-red-800/50 to-red-900/50 border-red-700"
  };

  const statusTextColors = {
    "Income": "text-slate-100",
    "Contact Made": "text-yellow-100",
    "Proposal Sent": "text-purple-100",
    "Won": "text-green-100",
    "Lost": "text-red-100"
  };

  const statusBadgeColors = {
    "Income": "border-slate-400 text-slate-100",
    "Contact Made": "border-yellow-400 text-yellow-100",
    "Proposal Sent": "border-purple-400 text-purple-100",
    "Won": "border-green-400 text-green-100",
    "Lost": "border-red-400 text-red-100"
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {statusOrder.map((status) => {
            const statusLeads = leadsByStatus[status];

            return (
              <div key={status} className="space-y-3">
                {/* Column Header with Dark Theme */}
                <Card className={`bg-gradient-to-r ${statusColors[status]}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className={`text-sm font-medium ${statusTextColors[status]}`}>
                        {LEAD_STATUS_LABELS[status]}
                      </CardTitle>
                      <Badge variant="outline" className={`text-xs ${statusBadgeColors[status]}`}>
                        {statusLeads.length}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>

                {/* Droppable Area */}
                <DroppableArea
                  id={`status-${status}`}
                  status={status}
                  leads={statusLeads}
                  onEdit={setEditingLead}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              </div>
            );
          })}
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