import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import logo from "@/../../public/images/mathmaster.jpg";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { logout, user } = useAuth();
  
  const handleLogout = async () => {
    await logout();
  };
  
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img src={logo} alt="Logo" className="h-8" /> {/* Add your logo here */}
          <h1 className="text-xl font-semibold text-primary">
            {title || "NSBM MathMaster"}
          </h1>
          {user && (
            <span className="text-sm text-gray-500">
              ({user.role})
            </span>
          )}
        </div>
        
        {user && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="flex items-center gap-1 text-gray-700"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </Button>
        )}
      </div>
    </header>
  );
}