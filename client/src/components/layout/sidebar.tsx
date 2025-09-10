import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Package, 
  Tags, 
  BarChart3, 
  Settings, 
  User,
  ShoppingBag 
} from "lucide-react";

const navigation = [
  { name: "Products", href: "/products", icon: Package },
  { name: "Categories", href: "/categories", icon: Tags },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border flex-shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <ShoppingBag className="text-primary-foreground text-sm w-4 h-4" />
          </div>
          <span className="font-semibold text-lg">ProductHub</span>
        </div>
        
        <nav className="space-y-2" data-testid="sidebar-navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (location === "/" && item.href === "/products");
            
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  data-testid={`nav-link-${item.name.toLowerCase()}`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </a>
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-border">
        <div className="flex items-center gap-3" data-testid="user-profile">
          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
            <User className="text-secondary-foreground text-sm w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" data-testid="text-user-name">
              Admin User
            </p>
            <p className="text-xs text-muted-foreground truncate" data-testid="text-user-email">
              admin@example.com
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
