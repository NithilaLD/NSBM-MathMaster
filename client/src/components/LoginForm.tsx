import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { LoginCredentials } from "@shared/schema";

interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"student" | "admin" | "superadmin">("student");
  const [formData, setFormData] = useState<LoginCredentials>({
    username: "",
    password: "",
    school: "",
    role: "student"
  });
  const [error, setError] = useState("");

  const handleTabChange = (value: string) => {
    setActiveTab(value as "student" | "admin" | "superadmin");
    setFormData(prev => ({
      ...prev,
      role: value as "student" | "admin" | "superadmin",
      // Clear school when switching to admin/superadmin
      school: value === "student" ? prev.school : ""
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSchoolChange = (value: string) => {
    setFormData(prev => ({ ...prev, school: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validate form
    if (!formData.username) {
      setError("Username is required");
      return;
    }
    
    if (!formData.password) {
      setError("Password is required");
      return;
    }
    
    if (activeTab === "student" && !formData.school) {
      setError("Please select your school");
      return;
    }
    
    try {
      const user = await login(formData);
      if (user && onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    }
  };

  return (
    <div>
      <Tabs defaultValue="student" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="student">Student</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
          <TabsTrigger value="superadmin">Super Admin</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {activeTab === "student" && (
              <div className="space-y-2">
                <Label htmlFor="school">School</Label>
                <Select value={formData.school || ""} onValueChange={handleSchoolChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Enter your school name" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Royal College">Royal College</SelectItem>
                    <SelectItem value="Visakha Vidyalaya">Visakha Vidyalaya</SelectItem>
                    <SelectItem value="Ananda College">Ananda College</SelectItem>
                    <SelectItem value="Devi Balika Vidyalaya">Devi Balika Vidyalaya</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleInputChange}
                autoComplete="username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                autoComplete="current-password"
              />
            </div>
            
            {error && (
              <div className="text-sm text-red-500 font-medium">
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login >"
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
