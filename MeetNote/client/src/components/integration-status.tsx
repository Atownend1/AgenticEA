import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Settings } from "lucide-react";
import { type IntegrationStatus as IntegrationStatusType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface IntegrationStatusProps {
  showSettings?: boolean;
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'connected':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'disconnected':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-gray-500" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'connected':
      return 'bg-green-100 text-green-800';
    case 'error':
      return 'bg-red-100 text-red-800';
    case 'disconnected':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getServiceIcon(service: string) {
  switch (service) {
    case 'fireflies':
      return '🔥';
    case 'notion':
      return '📝';
    case 'openai':
      return '🤖';
    case 'email':
      return '📧';
    default:
      return '⚙️';
  }
}

function getServiceName(service: string) {
  switch (service) {
    case 'fireflies':
      return 'Fireflies.ai';
    case 'notion':
      return 'Notion';
    case 'openai':
      return 'OpenAI';
    case 'email':
      return 'Email Service';
    default:
      return service;
  }
}

function getServiceDescription(service: string) {
  switch (service) {
    case 'fireflies':
      return 'Meeting transcription';
    case 'notion':
      return 'Database management';
    case 'openai':
      return 'AI processing';
    case 'email':
      return 'Reminder notifications';
    default:
      return 'External service';
  }
}

export default function IntegrationStatus({ showSettings = false }: IntegrationStatusProps) {
  const { toast } = useToast();

  const { data: integrations = [], isLoading } = useQuery<IntegrationStatusType[]>({
    queryKey: ["/api/integrations/status"],
  });

  const testIntegrationsMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/integrations/test'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/status"] });
      toast({
        title: "Integration Test Complete",
        description: "All integrations have been tested and statuses updated.",
      });
    },
    onError: () => {
      toast({
        title: "Test Failed",
        description: "Failed to test integrations. Please check your configuration.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
                <div className="space-y-1">
                  <div className="h-4 w-20 bg-gray-300 rounded"></div>
                  <div className="h-3 w-32 bg-gray-300 rounded"></div>
                </div>
              </div>
              <div className="w-16 h-6 bg-gray-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {integrations.map((integration) => (
        <div 
          key={integration.service} 
          className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
          data-testid={`integration-${integration.service}`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-lg">
              {getServiceIcon(integration.service)}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {getServiceName(integration.service)}
              </p>
              <p className="text-xs text-muted-foreground">
                {getServiceDescription(integration.service)}
              </p>
              {integration.errorMessage && (
                <p className="text-xs text-red-600 mt-1" title={integration.errorMessage}>
                  {integration.errorMessage.length > 40 
                    ? `${integration.errorMessage.substring(0, 40)}...` 
                    : integration.errorMessage}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(integration.status)}
            <Badge variant="outline" className={getStatusColor(integration.status)}>
              {integration.status === 'connected' ? 'Connected' : 
               integration.status === 'error' ? 'Error' : 'Disconnected'}
            </Badge>
          </div>
        </div>
      ))}

      {showSettings && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Last checked: {integrations.length > 0 ? 
              new Date(integrations[0].lastChecked).toLocaleTimeString() : 
              'Never'}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => testIntegrationsMutation.mutate()}
              disabled={testIntegrationsMutation.isPending}
              data-testid="button-test-integrations"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${testIntegrationsMutation.isPending ? 'animate-spin' : ''}`} />
              Test All
            </Button>
            <Button
              variant="secondary"
              size="sm"
              data-testid="button-manage-integrations"
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
