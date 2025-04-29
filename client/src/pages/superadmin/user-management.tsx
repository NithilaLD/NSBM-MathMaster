import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Upload } from "lucide-react";
import { motion } from "framer-motion";
import UserForm from "@/components/UserForm";
import UserList from "@/components/UserList";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function UserManagement() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showImportForm, setShowImportForm] = useState(false);
  const [csvContent, setCsvContent] = useState("");

  // Redirect to login if not authenticated or not a super admin
  useEffect(() => {
    if (!user) {
      navigate("/");
    } else if (user.role !== "superadmin") {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch all users
  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!user && user.role === 'superadmin',
  });

  // Bulk import users mutation
  const importUsersMutation = useMutation({
    mutationFn: async (usersData: any[]) => {
      const results = [];
      for (const userData of usersData) {
        try {
          const res = await apiRequest('POST', '/api/users', userData);
          results.push(await res.json());
        } catch (error) {
          console.error("Failed to import user:", userData, error);
          throw error;
        }
      }
      return results;
    },
    onSuccess: (data) => {
      toast({
        title: "Users imported",
        description: `Successfully imported ${data.length} users.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setShowImportForm(false);
      setCsvContent("");
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import users. Please check the CSV format.",
        variant: "destructive",
      });
    },
  });

  const handleBack = () => {
    navigate("/superadmin");
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleImportUsers = () => {
    if (!csvContent) {
      toast({
        title: "No data",
        description: "Please upload a CSV file first.",
        variant: "destructive",
      });
      return;
    }

    // Simple CSV parser (in a real app, you'd use a proper CSV parser library)
    const lines = csvContent.split('\n');
    const header = lines[0].split(',');
    
    // Expecting: username,password,school,role
    const usersData = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',');
      const userData: any = {};
      
      for (let j = 0; j < header.length; j++) {
        const key = header[j].trim();
        const value = values[j]?.trim();
        if (value) userData[key] = value;
      }
      
      // Set default role to student if not specified
      if (!userData.role) userData.role = 'student';
      
      usersData.push(userData);
    }
    
    if (usersData.length === 0) {
      toast({
        title: "No users found",
        description: "No valid user data was found in the CSV file.",
        variant: "destructive",
      });
      return;
    }
    
    importUsersMutation.mutate(usersData);
  };

  // Filter users based on selected role and search query
  const filteredUsers = users ? users.filter((u: any) => {
    const roleMatch = selectedRole === 'all' || u.role === selectedRole;
    const searchMatch = u.username.toLowerCase().includes(searchQuery.toLowerCase());
    return roleMatch && searchMatch;
  }) : [];

  if (!user) return null;

  return (
    <motion.div 
      className="min-h-screen flex flex-col p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center text-primary-600 hover:text-primary-800"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back
        </Button>
        {/* <div>
          <span className="text-gray-700 font-medium">Super Admin:</span>
          <span className="text-primary-700 font-medium ml-1">{user.username}</span>
        </div> */}
      </div>
      
      <div className="max-w-6xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">User Management</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Add New User</h2>
              <UserForm onSuccess={() => queryClient.invalidateQueries({ queryKey: ['/api/users'] })} />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Bulk Import Students</h2>
              
              {showImportForm ? (
                <div className="space-y-4">
                  <div className="mb-4">
                    <Label htmlFor="csv-upload">Upload CSV File</Label>
                    <Input 
                      id="csv-upload" 
                      type="file" 
                      accept=".csv" 
                      onChange={handleCsvFileUpload} 
                      className="mt-1"
                    />
                  </div>
                  
                  {csvContent && (
                    <div className="p-4 bg-gray-50 rounded-md">
                      <pre className="text-xs overflow-x-auto max-h-40">
                        {csvContent}
                      </pre>
                    </div>
                  )}
                  
                  <div className="p-4 bg-primary-50 rounded-lg mb-6">
                    <h3 className="font-medium text-primary-800 mb-2">CSV Format Requirements</h3>
                    <p className="text-sm text-primary-700">
                      The CSV file should include columns for username, password, school, and role (optional) in that order.
                      The first row should be the header row.
                    </p>
                  </div>
                  
                  <div className="flex space-x-2 justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowImportForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleImportUsers}
                      disabled={!csvContent || importUsersMutation.isPending}
                    >
                      {importUsersMutation.isPending ? "Importing..." : "Import Users"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-6 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setShowImportForm(true)}>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">Drag and drop your CSV file here, or</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Browse Files
                    </Button>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button onClick={() => setShowImportForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Upload and Import
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">User List</h2>
              
              <div className="flex space-x-2">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                    <SelectItem value="superadmin">Super Admins</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <UserList 
              users={filteredUsers} 
              isLoading={isLoading} 
              onDelete={() => queryClient.invalidateQueries({ queryKey: ['/api/users'] })}
            />
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
