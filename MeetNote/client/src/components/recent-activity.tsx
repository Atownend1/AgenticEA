import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, AlertTriangle, Clock, FileText, Mail, Webhook, Database } from "lucide-react";
import { type ActivityLog } from "@shared/schema";

interface RecentActivityProps {
  limit?: number;
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'meeting_processed':
    case 'meeting_ai_processed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'webhook_received':
      return <Webhook className="h-4 w-4 text-blue-500" />;
    case 'action_item_updated':
    case 'action_item_completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'morning_reminders_sent':
      return <Mail className="h-4 w-4 text-blue-500" />;
    case 'notion_setup_completed':
      return <Database className="h-4 w-4 text-green-500" />;
    case 'meeting_processing_failed':
    case 'morning_reminders_failed':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default:
      return <FileText className="h-4 w-4 text-gray-500" />;
  }
}

function getActivityColor(type: string) {
  if (type.includes('failed') || type.includes('error')) {
    return 'bg-red-100 text-red-800';
  }
  if (type.includes('completed') || type.includes('processed') || type.includes('sent')) {
    return 'bg-green-100 text-green-800';
  }
  if (type.includes('received') || type.includes('updated')) {
    return 'bg-blue-100 text-blue-800';
  }
  return 'bg-gray-100 text-gray-800';
}

function formatTimeAgo(timestamp: string | Date) {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}m ago`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  } else {
    return time.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      ...(time.getFullYear() !== now.getFullYear() && { year: 'numeric' })
    });
  }
}

export default function RecentActivity({ limit = 10 }: RecentActivityProps) {
  const { data: activities = [], isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity"],
    select: (data) => data.slice(0, limit)
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <Skeleton className="w-2 h-2 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No recent activity</p>
        <p className="text-xs text-muted-foreground mt-1">Activity will appear here as events occur</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div 
          key={activity.id} 
          className="flex items-start space-x-3 text-sm"
          data-testid={`activity-${activity.id}`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getActivityIcon(activity.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground break-words" data-testid={`activity-description-${activity.id}`}>
              {activity.description}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground" data-testid={`activity-time-${activity.id}`}>
                {formatTimeAgo(activity.timestamp)}
              </p>
              <Badge 
                variant="outline" 
                className={`text-xs ${getActivityColor(activity.type)}`}
                data-testid={`activity-type-${activity.id}`}
              >
                {activity.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
            
            {/* Show metadata if available */}
            {activity.metadata && Object.keys(activity.metadata).length > 0 && (
              <div className="mt-1 text-xs text-muted-foreground">
                {activity.metadata.actionItemsCount && (
                  <span className="mr-3">Items: {activity.metadata.actionItemsCount}</span>
                )}
                {activity.metadata.recipientCount && (
                  <span className="mr-3">Recipients: {activity.metadata.recipientCount}</span>
                )}
                {activity.metadata.meetingId && (
                  <span className="mr-3">Meeting ID: {activity.metadata.meetingId.slice(0, 8)}...</span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
