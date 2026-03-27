import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings as SettingsIcon, 
  Database, 
  Webhook, 
  Mail, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import IntegrationStatus from "@/components/integration-status";

export default function Settings() {
  const { toast } = useToast();
  const [testEmail, setTestEmail] = useState("");

  const { data: integrationStatuses = [] } = useQuery({
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

  const setupNotionMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/setup/notion'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/status"] });
      toast({
        title: "Notion Setup Complete",
        description: "Notion databases have been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Setup Failed",
        description: "Failed to setup Notion databases. Please check your configuration.",
        variant: "destructive",
      });
    },
  });

  const sendTestEmailMutation = useMutation({
    mutationFn: (email: string) => apiRequest('POST', '/api/test/email', { email }),
    onSuccess: () => {
      toast({
        title: "Test Email Sent",
        description: `Test email has been sent to ${testEmail}`,
      });
      setTestEmail("");
    },
    onError: () => {
      toast({
        title: "Email Failed",
        description: "Failed to send test email. Please check your SMTP configuration.",
        variant: "destructive",
      });
    },
  });

  const triggerRemindersMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/reminders/trigger'),
    onSuccess: () => {
      toast({
        title: "Reminders Triggered",
        description: "Morning reminders have been sent manually.",
      });
    },
    onError: () => {
      toast({
        title: "Trigger Failed",
        description: "Failed to trigger reminders. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTestEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (testEmail) {
      sendTestEmailMutation.mutate(testEmail);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <SettingsIcon className="h-8 w-8 mr-3" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your integrations and system configuration
          </p>
        </div>

        <div className="space-y-8">
          {/* Integration Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Integration Status</span>
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
              </CardTitle>
            </CardHeader>
            <CardContent>
              <IntegrationStatus />
            </CardContent>
          </Card>

          {/* Notion Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Notion Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Setup Notion databases to store meeting data and action items.</p>
                <p className="mt-2">Required environment variables:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><code className="bg-muted px-1 rounded">NOTION_INTEGRATION_SECRET</code></li>
                  <li><code className="bg-muted px-1 rounded">NOTION_PAGE_URL</code></li>
                </ul>
              </div>
              <Button
                onClick={() => setupNotionMutation.mutate()}
                disabled={setupNotionMutation.isPending}
                data-testid="button-setup-notion"
              >
                {setupNotionMutation.isPending ? 'Setting up...' : 'Setup Notion Databases'}
              </Button>
            </CardContent>
          </Card>

          {/* Email Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Email Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Configure SMTP settings for sending morning reminders.</p>
                <p className="mt-2">Required environment variables:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><code className="bg-muted px-1 rounded">SMTP_HOST</code></li>
                  <li><code className="bg-muted px-1 rounded">SMTP_PORT</code></li>
                  <li><code className="bg-muted px-1 rounded">SMTP_USER</code></li>
                  <li><code className="bg-muted px-1 rounded">SMTP_PASS</code></li>
                </ul>
              </div>
              
              <form onSubmit={handleTestEmail} className="flex space-x-2">
                <div className="flex-1">
                  <Label htmlFor="testEmail">Test Email Address</Label>
                  <Input
                    id="testEmail"
                    type="email"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    data-testid="input-test-email"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="submit"
                    disabled={sendTestEmailMutation.isPending || !testEmail}
                    data-testid="button-send-test-email"
                  >
                    {sendTestEmailMutation.isPending ? 'Sending...' : 'Send Test'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Webhook Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Webhook className="h-5 w-5 mr-2" />
                Webhook Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Configure Fireflies webhook to receive meeting notifications.</p>
                <p className="mt-2">Webhook URL:</p>
                <code className="block bg-muted p-2 rounded mt-1">
                  {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000'}/api/webhooks/fireflies
                </code>
                <p className="mt-2">Required environment variables:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><code className="bg-muted px-1 rounded">FIREFLIES_API_KEY</code></li>
                  <li><code className="bg-muted px-1 rounded">FIREFLIES_WEBHOOK_SECRET</code> (optional)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Scheduler Management */}
          <Card>
            <CardHeader>
              <CardTitle>Scheduler Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Manage scheduled tasks like morning reminders.</p>
                <p className="mt-2">Morning reminders are sent daily at 8:00 AM for action items due that day.</p>
              </div>
              
              <Button
                variant="outline"
                onClick={() => triggerRemindersMutation.mutate()}
                disabled={triggerRemindersMutation.isPending}
                data-testid="button-trigger-reminders"
              >
                {triggerRemindersMutation.isPending ? 'Sending...' : 'Send Morning Reminders Now'}
              </Button>
            </CardContent>
          </Card>

          {/* API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground space-y-3">
                <p>Additional environment variables for full functionality:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">OpenAI (for enhanced processing)</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li><code className="bg-muted px-1 rounded">OPENAI_API_KEY</code></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Application</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li><code className="bg-muted px-1 rounded">APP_URL</code> (for email links)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
