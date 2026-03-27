import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, ExternalLink, FileText, ListTodo, Upload } from "lucide-react";
import { type Meeting } from "@shared/schema";
import MeetingDetailModal from "./meeting-detail-modal";
import { useState } from "react";

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'status-completed';
    case 'processing': return 'status-processing';
    case 'failed': return 'status-overdue';
    default: return 'bg-gray-500';
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'completed': return 'Processed';
    case 'processing': return 'Processing';
    case 'failed': return 'Failed';
    default: return status;
  }
}

export default function RecentMeetings() {
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  
  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
  });

  // Show only the 5 most recent meetings
  const recentMeetings = meetings.slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Recent Meetings</h2>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-card rounded-lg border border-border p-6 h-48"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Recent Meetings</h2>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" data-testid="button-view-all-meetings">
            View All
          </Button>
          <Button size="sm" data-testid="button-manual-upload">
            <Upload className="h-4 w-4 mr-2" />
            Manual Upload
          </Button>
        </div>
      </div>

      {recentMeetings.length === 0 ? (
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
          {recentMeetings.map((meeting) => (
            <Card 
              key={meeting.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedMeeting(meeting)}
              data-testid={`card-meeting-${meeting.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-foreground" data-testid={`text-meeting-title-${meeting.id}`}>
                        {meeting.title}
                      </h3>
                      <span className={`${getStatusColor(meeting.status)} text-white text-xs px-2 py-1 rounded-full`}>
                        {getStatusText(meeting.status)}
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
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle external link
                    }}
                    data-testid={`button-external-link-${meeting.id}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                
                {meeting.status === 'completed' && meeting.keyTopics.length > 0 && (
                  <div className="bg-muted rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-foreground mb-2">Key Topics Discussed</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {meeting.keyTopics.slice(0, 4).map((topic, index) => (
                        <li key={index}>• {topic}</li>
                      ))}
                    </ul>
                  </div>
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
                        <div className="bg-yellow-600 h-2 rounded-full w-3/4 transition-all duration-1000"></div>
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
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMeeting(meeting);
                        }}
                        data-testid={`button-view-details-${meeting.id}`}
                      >
                        View Details
                      </Button>
                      {meeting.notionUrl && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(meeting.notionUrl, '_blank');
                          }}
                          data-testid={`button-open-notion-${meeting.id}`}
                        >
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

      {selectedMeeting && (
        <MeetingDetailModal
          meeting={selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
        />
      )}
    </div>
  );
}
