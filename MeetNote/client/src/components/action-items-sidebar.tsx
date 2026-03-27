import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, ArrowRight } from "lucide-react";
import { type ActionItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import IntegrationStatus from "./integration-status";
import RecentActivity from "./recent-activity";

function formatDate(date: string | Date | null) {
  if (!date) return 'No due date';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
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

function getDueDateColor(dueDate: string | Date | null, status: string) {
  if (!dueDate || status === 'completed') return 'text-muted-foreground';
  
  const due = new Date(dueDate);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  if (due < today) return 'text-red-600 font-medium';
  if (due.toDateString() === today.toDateString()) return 'text-yellow-600 font-medium';
  return 'text-blue-600 font-medium';
}

export default function ActionItemsSidebar() {
  const { toast } = useToast();
  
  const { data: actionItemsDueToday = [] } = useQuery<ActionItem[]>({
    queryKey: ["/api/action-items/due-today"],
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
        title: "Action Item Completed",
        description: "The action item has been marked as completed.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update action item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCompleteAction = (id: string) => {
    updateActionItemMutation.mutate({ id, status: 'completed' });
  };

  return (
    <div className="space-y-6">
      {/* Today's Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Today's Action Items</CardTitle>
        </CardHeader>
        <CardContent>
          {actionItemsDueToday.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No action items due today</p>
              <p className="text-xs text-muted-foreground mt-1">Great job staying on top of things!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {actionItemsDueToday.slice(0, 3).map((item) => (
                <div 
                  key={item.id} 
                  className="border border-border rounded-lg p-4"
                  data-testid={`card-action-item-due-${item.id}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium text-foreground line-clamp-2" data-testid={`text-action-title-${item.id}`}>
                      {item.title}
                    </h4>
                    <span className={`${getStatusColor(item.status)} text-white text-xs px-2 py-1 rounded-full flex-shrink-0 ml-2`}>
                      {getStatusText(item.status)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="text-muted-foreground flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      {item.assignee}
                    </span>
                    <span className={getDueDateColor(item.dueDate, item.status)}>
                      Due: {formatDate(item.dueDate)}
                    </span>
                  </div>

                  {item.status !== 'completed' && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleCompleteAction(item.id)}
                      disabled={updateActionItemMutation.isPending}
                      data-testid={`button-complete-${item.id}`}
                    >
                      {updateActionItemMutation.isPending ? 'Updating...' : 'Mark Complete'}
                    </Button>
                  )}
                </div>
              ))}

              {actionItemsDueToday.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-primary hover:text-primary/80"
                  data-testid="button-view-all-due-today"
                >
                  View All {actionItemsDueToday.length} Items
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <IntegrationStatus />
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentActivity limit={5} />
        </CardContent>
      </Card>
    </div>
  );
}
