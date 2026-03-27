import { useLocation, Link } from "wouter";
import { Bell, Settings, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

export default function Header() {
  const [location] = useLocation();
  
  const { data: actionItemsDueToday = [] } = useQuery({
    queryKey: ["/api/action-items/due-today"],
  });

  const notificationCount = actionItemsDueToday.length;

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/meetings", label: "Meetings" },
    { path: "/action-items", label: "Action Items" },
    { path: "/settings", label: "Settings" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3" data-testid="link-home">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-bold">🤖</span>
              </div>
              <h1 className="text-xl font-semibold text-foreground">
                Meeting Intelligence Hub
              </h1>
            </Link>
            
            <nav className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={`text-sm font-medium transition-colors ${
                    isActive(item.path) 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative" 
              data-testid="button-notifications"
            >
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  data-testid="badge-notification-count"
                >
                  {notificationCount > 99 ? '99+' : notificationCount}
                </Badge>
              )}
            </Button>

            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150" 
                alt="User avatar" 
                className="w-8 h-8 rounded-full"
                data-testid="img-user-avatar"
              />
              <span className="text-sm font-medium hidden sm:block text-foreground">
                John Doe
              </span>
            </div>

            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden"
              data-testid="button-mobile-menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
