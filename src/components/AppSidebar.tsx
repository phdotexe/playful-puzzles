
import { Clock, Home, Library, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import QBankDropdown from "@/components/sidebar/QBankDropdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const items = [{
  title: "Dashboard",
  url: "/",
  icon: Home
}, {
  title: "Previous Quizzes",
  url: "/history",
  icon: Clock
}];

export function AppSidebar() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  return (
    <>
      <div
        className={cn(
          "fixed left-0 top-0 h-full bg-background border-r border-border transition-transform duration-300 z-40",
          sidebarCollapsed ? "-translate-x-[200px]" : "translate-x-0",
          "w-[200px]"
        )}
      >
        <Sidebar>
          <SidebarContent className="px-4">
            <SidebarGroup>
              <SidebarGroupLabel>Quiz App</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map(item => 
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link to={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  <QBankDropdown />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "fixed top-4 z-50 transition-all duration-300 bg-background border",
          sidebarCollapsed ? "left-4" : "left-[180px]"
        )}
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        aria-label="Toggle sidebar"
      >
        {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      <div
        className={cn(
          "flex-1 transition-all duration-300",
          sidebarCollapsed ? "ml-0" : "ml-[200px]"
        )}
      >
        {/* Main content container */}
      </div>
    </>
  );
}
