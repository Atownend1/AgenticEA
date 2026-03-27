import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertTriangle, User, Calendar } from "lucide-react";
import { type ActionItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

function formatDate(date: string | Date | null) {
  if (!date) return 'No due date';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />;
    case 'overdue': return <AlertTriangle className="h-4 w-4 text-red-600" />;
    default: return <Clock className="h-4 w-4 text-gray-600" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'status-completed';
    case 'in_progress': return 'status-pending';
    case 'overdue': return 'status-overdue';
    default: return 'bg-gray-500';
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'completed': return 'Completed';
    case 'in_progress': return 'In Progress';
    case 'overdue': return 'Overdue';
    case 'pending': return 'Not Started';
    default: return status;
  }
}

export default function ActionItems() {
  const { toast } = useToast();
  
  const { data: actionItems = [], isLoading } = useQuery<ActionItem[]>({
    queryKey: ["/api/action-items"],
  });

  const updateActionItemMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData = { 
        status,
        ...(status === 'completed' && { completedAt: new Date().toISOString() })
      };
      return apiRequest('PATCH', `/api/action-items/${id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/action-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/action-items/due-today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Action Item Updated",
        description: "The action item status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update action item status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (id: string, newStatus: string) => {
    updateActionItemMutation.mutate({ id, status: newStatus });
  };

  // Group action items by status
  const groupedItems = actionItems.reduce((acc, item) => {
    const status = item.status;
    if (!acc[status]) acc[status] = [];
    acc[status].push(item);
    return acc;
  }, {} as Record<string, ActionItem[]>);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Action Items</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage all action items from your meetings
          </p>
        </div>

        {actionItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No action items yet</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Action items will be automatically extracted from your meeting transcripts and appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Overdue Items */}
            {groupedItems.overdue && groupedItems.overdue.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-red-600 mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Overdue ({groupedItems.overdue.length})
                </h2>
                <div className="grid gap-4">
                  {groupedItems.overdue.map((item) => (
                    <ActionItemCard 
                      key={item.id} 
                      item={item} 
                      onStatusUpdate={handleStatusUpdate}
                      isUpdating={updateActionItemMutation.isPending}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Pending Items */}
            {groupedItems.pending && groupedItems.pending.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Pending ({groupedItems.pending.length})
                </h2>
                <div className="grid gap-4">
                  {groupedItems.pending.map((item) => (
                    <ActionItemCard 
                      key={item.id} 
                      item={item} 
                      onStatusUpdate={handleStatusUpdate}
                      isUpdating={updateActionItemMutation.isPending}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* In Progress Items */}
            {groupedItems.in_progress && groupedItems.in_progress.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-blue-600 mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  In Progress ({groupedItems.in_progress.length})
                </h2>
                <div className="grid gap-4">
                  {groupedItems.in_progress.map((item) => (
                    <ActionItemCard 
                      key={item.id} 
                      item={item} 
                      onStatusUpdate={handleStatusUpdate}
                      isUpdating={updateActionItemMutation.isPending}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Items */}
            {groupedItems.completed && groupedItems.completed.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-green-600 mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Completed ({groupedItems.completed.length})
                </h2>
                <div className="grid gap-4">
                  {groupedItems.completed.map((item) => (
                    <ActionItemCard 
                      key={item.id} 
                      item={item} 
                      onStatusUpdate={handleStatusUpdate}
                      isUpdating={updateActionItemMutation.isPending}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ActionItemCardProps {
  item: ActionItem;
  onStatusUpdate: (id: string, status: string) => void;
  isUpdating: boolean;
}

function ActionItemCard({ item, onStatusUpdate, isUpdating }: ActionItemCardProps) {
  return (
    <Card data-testid={`card-action-item-${item.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-medium text-foreground" data-testid={`text-action-title-${item.id}`}>
                {item.title}
              </h3>
              <span className={`${getStatusColor(item.status)} text-white text-xs px-2 py-1 rounded-full`}>
                {getStatusText(item.status)}
              </span>
            </div>
            {item.description && (
              <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
            )}
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <span className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                {item.assignee}
              </span>
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Due: {formatDate(item.dueDate)}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(item.status)}
          </div>
        </div>

        {item.deliverable && (
          <div className="bg-muted rounded-lg p-3 mb-4">
            <h4 className="text-sm font-medium text-foreground mb-1">Deliverable</h4>
            <p className="text-sm text-muted-foreground">{item.deliverable}</p>
          </div>
        )}

        {item.status !== 'completed' && (
          <div className="flex items-center space-x-2">
            {item.status === 'pending' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusUpdate(item.id, 'in_progress')}
                disabled={isUpdating}
                data-testid={`button-start-${item.id}`}
              >
                Start Progress
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => onStatusUpdate(item.id, 'completed')}
              disabled={isUpdating}
              data-testid={`button-complete-${item.id}`}
            >
              {isUpdating ? 'Updating...' : 'Mark Complete'}
            </Button>
          </div>
        )}

        {item.completedAt && (
          <div className="mt-3 text-xs text-muted-foreground">
            Completed on {formatDate(item.completedAt)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
