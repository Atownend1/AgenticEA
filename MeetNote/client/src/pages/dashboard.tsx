import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import StatsOverview from "@/components/stats-overview";
import RecentMeetings from "@/components/recent-meetings";
import ActionItemsSidebar from "@/components/action-items-sidebar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: actionItemsDueToday = [] } = useQuery({
    queryKey: ["/api/action-items/due-today"],
  });

  const dueTodayCount = actionItemsDueToday.length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StatsOverview />

        {/* Action Items Alert */}
        {dueTodayCount > 0 && (
          <Alert className="mb-8 bg-yellow-50 border-yellow-200" data-testid="alert-action-items-due">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  {dueTodayCount} Action Item{dueTodayCount > 1 ? 's' : ''} Due Today
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  You have action items that need attention today. Click to review and complete them.
                </p>
              </div>
              <Button
                className="bg-yellow-600 text-white hover:bg-yellow-700"
                data-testid="button-review-actions"
              >
                Review Actions
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <RecentMeetings />
          </div>
          <div>
            <ActionItemsSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
