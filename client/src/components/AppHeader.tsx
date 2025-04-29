import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function AppHeader() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logout successful",
        description: "You have been logged out successfully.",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "An error occurred during logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <header className="bg-white  shadow-sm p-4 sticky top-0 z-50">
  <div className="container mx-auto relative flex items-center justify-center">
    
    {/* Left side - logo + title */}
    <div className="absolute left-4 flex items-center space-x-2">
      <img src="../public/images/mathmaster.jpg" alt="Logo" className="h-10" />
      <h1 className="text-xl font-bold text-primary-900">
        NSBM MathMaster
      </h1>
    </div>
    
    {/* Center - 2 logos */}
    <div className="flex items-center space-x-2">
      <img src="../public/images/NSBM Logo.png" alt="Logo" className="h-10" />
      <img src="../public/images/Maths Logo.png" alt="Logo" className="h-10" />
    </div>
    
    {/* Right side - user welcome and signout */}
    <div className="absolute right-4 flex items-center gap-4">
      {user && (
        <div className="text-sm text-primary-700">
          Welcome, <span className="font-semibold">{user.username}</span>&ensp;
          {user.role === 'admin' || user.role === 'superadmin' ? ( 
            <span className="ml-2 px-2 py-1 bg-primary-200 rounded-full text-xs">
              You are signed in as:&nbsp;
              {user.role == "admin"
                ? "Admin"
                : user.role == "superadmin"
                ? "Superadmin"
                : user.role == "student"
                ? "Student"
                : user.role}
            </span> 
          ) : null}
        </div>
      )}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleLogout}
        className="hover:bg-primary-200"
      >
        Sign Out
      </Button>
    </div>

  </div>
    </header>

  );
}