import { useState } from "react";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, FileImport, Plus } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UserForm from "./user-form";

interface User {
  id: number;
  username: string;
  role: string;
  school?: string;
  email?: string;
  status: string;
  lastLogin?: Date;
}

interface UserManagementProps {
  users: User[];
  isLoading: boolean;
}

export default function UserManagement({ users, isLoading }: UserManagementProps) {
  const { toast } = useToast();
  const [roleTab, setRoleTab] = useState<string>("student");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const filteredUsers = users.filter(user => user.role === roleTab);
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/users/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });
  
  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
    setDeleteId(null);
  };
  
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };
  
  const handleAddUser = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };
  
  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingUser(null);
  };
  
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Never';
    
    const d = new Date(date);
    const today = new Date();
    const isToday = 
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
    
    const timeFormat = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    
    if (isToday) {
      return `Today, ${timeFormat}`;
    } else {
      return d.toLocaleDateString() + ', ' + timeFormat;
    }
  };
  
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 mx-auto border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading users...</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800">User Management</h2>
        <div className="flex space-x-3">
          <Button 
            variant="outline"
            className="bg-primary-100 hover:bg-primary-200 text-primary-800 font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center"
          >
            <FileImport className="mr-2 h-4 w-4" /> Import Users
          </Button>
          <Button 
            onClick={handleAddUser}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" /> Add User
          </Button>
        </div>
      </div>
      
      {/* User Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit User" : "Add New User"}
            </DialogTitle>
          </DialogHeader>
          <UserForm 
            initialData={editingUser}
            userId={editingUser?.id}
            onSuccess={handleFormClose}
            defaultRole={roleTab as "student" | "admin" | "superadmin"}
          />
        </DialogContent>
      </Dialog>
      
      {/* User type tabs */}
      <div className="mb-6">
        <Tabs defaultValue="student" value={roleTab} onValueChange={setRoleTab}>
          <TabsList className="border-b border-gray-200 w-full justify-start">
            <TabsTrigger value="student" className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 text-sm font-medium">
              Students
            </TabsTrigger>
            <TabsTrigger value="admin" className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 text-sm font-medium">
              Admins
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* User Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-800 font-medium">
                        {user.username.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.username}</div>
                      <div className="text-sm text-gray-500">{user.email || 'No email'}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-900">{user.school || 'Not specified'}</div>
                </TableCell>
                <TableCell>
                  <Badge 
                    className={user.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                    }
                    variant="outline"
                  >
                    {user.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {formatDate(user.lastLogin)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(user)}
                    className="text-primary-600 hover:text-primary-900 mr-3"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog open={deleteId === user.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(user.id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={user.role === 'superadmin'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the user.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(user.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
            
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No {roleTab}s found. Use the "Add User" button to create a new user.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        {filteredUsers.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredUsers.length}</span> of <span className="font-medium">{filteredUsers.length}</span> users
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
