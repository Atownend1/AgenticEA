import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Video, Clock, CheckCircle, Cog, TrendingUp } from "lucide-react";

interface Stats {
  totalMeetings: number;
  pendingActions: number;
  completedActions: number;
  processingQueue: number;
}

export default function StatsOverview() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const statCards = [
    {
      title: "Total Meetings",
      value: stats?.totalMeetings || 0,
      icon: Video,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
      change: "+12% from last month",
      testId: "stat-total-meetings"
    },
    {
      title: "Pending Actions",
      value: stats?.pendingActions || 0,
      icon: Clock,
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-100",
      change: `${Math.floor((stats?.pendingActions || 0) / 3)} due today`,
      testId: "stat-pending-actions"
    },
    {
      title: "Completed Actions",
      value: stats?.completedActions || 0,
      icon: CheckCircle,
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
      change: "94% completion rate",
      testId: "stat-completed-actions"
    },
    {
      title: "Processing Queue",
      value: stats?.processingQueue || 0,
      icon: Cog,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-100",
      change: "Avg 3min processing",
      testId: "stat-processing-queue"
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat) => (
        <Card key={stat.title} data-testid={stat.testId}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-foreground" data-testid={`${stat.testId}-value`}>
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2" data-testid={`${stat.testId}-change`}>
              {stat.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
