import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, ExternalLink, FileText, ListTodo } from "lucide-react";
import { type Meeting } from "@shared/schema";

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'completed': return 'default';
    case 'processing': return 'secondary';
    case 'failed': return 'destructive';
    default: return 'outline';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'status-completed';
    case 'processing': return 'status-processing';
    case 'failed': return 'status-overdue';
    default: return 'bg-gray-500';
  }
}

export default function Meetings() {
  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-lg"></div>
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Meetings</h1>
            <p className="text-muted-foreground mt-2">
              View and manage all your processed meetings
            </p>
          </div>
          <Button data-testid="button-manual-upload">
            Manual Upload
          </Button>
        </div>

        {meetings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No meetings yet</h3>
              <p className="text-muted-foreground text-center max-w-md">
                When you have meetings processed through Fireflies, they will appear here with extracted action items and summaries.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {meetings.map((meeting) => (
              <Card key={meeting.id} className="hover:shadow-md transition-shadow" data-testid={`card-meeting-${meeting.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-foreground" data-testid={`text-meeting-title-${meeting.id}`}>
                          {meeting.title}
                        </h3>
                        <span className={`${getStatusColor(meeting.status)} text-white text-xs px-2 py-1 rounded-full`}>
                          {meeting.status === 'completed' ? 'Processed' : 
                           meeting.status === 'processing' ? 'Processing' : 
                           'Failed'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(meeting.date)}
                        </span>
                        {meeting.duration && (
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            {meeting.duration} minutes
                          </span>
                        )}
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          {meeting.attendees.length} attendees
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" data-testid={`button-external-link-${meeting.id}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {meeting.status === 'completed' && (
                    <>
                      {meeting.summary && (
                        <div className="bg-muted rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-medium text-foreground mb-2">Summary</h4>
                          <p className="text-sm text-muted-foreground">{meeting.summary}</p>
                        </div>
                      )}
                      
                      {meeting.keyTopics.length > 0 && (
                        <div className="bg-muted rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-medium text-foreground mb-2">Key Topics Discussed</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {meeting.keyTopics.map((topic, index) => (
                              <li key={index}>• {topic}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                  
                  {meeting.status === 'processing' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center">
                        <div className="animate-spin h-4 w-4 border-2 border-yellow-600 border-t-transparent rounded-full mr-3"></div>
                        <div>
                          <h4 className="text-sm font-medium text-yellow-800">Processing Meeting Content</h4>
                          <p className="text-sm text-yellow-700">Extracting action items and key points. This usually takes 2-3 minutes.</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="bg-yellow-200 rounded-full h-2">
                          <div className="bg-yellow-600 h-2 rounded-full w-3/4"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-muted-foreground flex items-center">
                          <ListTodo className="h-4 w-4 mr-1" />
                          Actions Generated
                        </span>
                        {meeting.notionPageId && (
                          <span className="text-muted-foreground flex items-center">
                            <FileText className="h-4 w-4 mr-1" />
                            Notion Page Created
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" data-testid={`button-view-details-${meeting.id}`}>
                          View Details
                        </Button>
                        {meeting.notionUrl && (
                          <Button variant="ghost" size="sm" data-testid={`button-open-notion-${meeting.id}`}>
                            Open in Notion
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
