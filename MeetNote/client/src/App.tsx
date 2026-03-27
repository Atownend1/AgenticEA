import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Meetings from "@/pages/meetings";
import ActionItems from "@/pages/action-items";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import SaveReminderTimer from "@/components/save-reminder-timer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/meetings" component={Meetings} />
      <Route path="/action-items" component={ActionItems} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <SaveReminderTimer />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
