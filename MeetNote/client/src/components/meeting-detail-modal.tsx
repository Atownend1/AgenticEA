import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, Users, ExternalLink, User, FileText } from "lucide-react";
import { type Meeting, type ActionItem } from "@shared/schema";

interface MeetingDetailModalProps {
  meeting: Meeting;
  onClose: () => void;
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDueDate(date: string | Date | null) {
  if (!date) return 'No due date';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'overdue': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
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

export default function MeetingDetailModal({ meeting, onClose }: MeetingDetailModalProps) {
  const { data: actionItems = [] } = useQuery<ActionItem[]>({
    queryKey: ["/api/action-items"],
    select: (data) => data.filter(item => item.meetingId === meeting.id)
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden" data-testid="modal-meeting-detail">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span data-testid="text-meeting-title">{meeting.title}</span>
            <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-modal">
              ×
            </Button>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="p-6 space-y-6">
            {/* Meeting Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(meeting.date)}</span>
              </div>
              {meeting.duration && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{meeting.duration} minutes</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{meeting.attendees.length} attendees</span>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Meeting Summary */}
                {meeting.summary && (
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-3">Meeting Summary</h3>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">{meeting.summary}</p>
                    </div>
                  </div>
                )}

                {/* Key Topics */}
                {meeting.keyTopics.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-3">Key Topics Discussed</h3>
                    <div className="bg-muted rounded-lg p-4">
                      <ul className="text-sm text-muted-foreground space-y-2">
                        {meeting.keyTopics.map((topic, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-primary mr-2">•</span>
                            <span>{topic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Outcomes */}
                {meeting.outcomes.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-3">Outcomes & Decisions</h3>
                    <div className="bg-muted rounded-lg p-4">
                      <ul className="text-sm text-muted-foreground space-y-2">
                        {meeting.outcomes.map((outcome, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-600 mr-2">✓</span>
                            <span>{outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Attendees */}
                {meeting.attendees.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-3">Attendees</h3>
                    <div className="space-y-2">
                      {meeting.attendees.map((attendee, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{attendee.name}</p>
                            {attendee.email && (
                              <p className="text-xs text-muted-foreground">{attendee.email}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Action Items */}
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-3">
                    Action Items ({actionItems.length})
                  </h3>
                  {actionItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No action items extracted</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {actionItems.map((item) => (
                        <div 
                          key={item.id} 
                          className="border border-border rounded-lg p-4"
                          data-testid={`action-item-${item.id}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-sm font-medium text-foreground">{item.title}</h4>
                            <Badge variant="outline" className={getStatusColor(item.status)}>
                              {getStatusText(item.status)}
                            </Badge>
                          </div>
                          
                          {item.description && (
                            <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {item.assignee}
                            </span>
                            <span>Due: {formatDueDate(item.dueDate)}</span>
                          </div>

                          {item.deliverable && (
                            <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
                              <span className="font-medium">Deliverable:</span> {item.deliverable}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Next Steps */}
                {meeting.nextSteps.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-3">Next Steps</h3>
                    <div className="bg-muted rounded-lg p-4">
                      <ul className="text-sm text-muted-foreground space-y-2">
                        {meeting.nextSteps.map((step, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-600 mr-2">→</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Takeaways */}
                {meeting.takeaways.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-3">Key Takeaways</h3>
                    <div className="bg-muted rounded-lg p-4">
                      <ul className="text-sm text-muted-foreground space-y-2">
                        {meeting.takeaways.map((takeaway, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-yellow-600 mr-2">💡</span>
                            <span>{takeaway}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <Separator />
            <div className="flex justify-end space-x-2">
              {meeting.notionUrl && (
                <Button
                  variant="outline"
                  onClick={() => window.open(meeting.notionUrl, '_blank')}
                  data-testid="button-open-notion"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in Notion
                </Button>
              )}
              <Button onClick={onClose} data-testid="button-close">
                Close
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
