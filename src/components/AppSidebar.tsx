
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { 
  FileText, 
  Plus, 
  BarChart3, 
  Settings, 
  Home,
  CalendarIcon
} from "lucide-react";
import kcbLogo from "@/assets/kcb-logo-official.svg";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Contracts", url: "/contracts", icon: FileText },
  { title: "Create Contract", url: "/create-contract", icon: Plus },
  { title: "Schedule Review", url: "/schedule-review", icon: CalendarIcon },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Admin", url: "/admin", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-background border-r border-border">
        {/* KCB Bank Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <img 
              src={kcbLogo} 
              alt="KCB Bank Logo" 
              className={isCollapsed ? "w-8 h-8" : "w-12 h-8"}
            />
            {!isCollapsed && (
              <div>
                <div className="text-xs text-muted-foreground">Contract Management</div>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider px-4">
            {!isCollapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span className="ml-3">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
