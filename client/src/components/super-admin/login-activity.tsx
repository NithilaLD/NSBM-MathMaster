import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface User {
  id: number;
  username: string;
  role: string;
  school?: string;
  email?: string;
  status: string;
  lastLogin?: Date;
}

interface LoginActivityProps {
  users: User[];
  isLoading: boolean;
}

export default function LoginActivity({ users, isLoading }: LoginActivityProps) {
  // Sort users by lastLogin (most recent first)
  const sortedUsers = [...users].sort((a, b) => {
    if (!a.lastLogin) return 1;
    if (!b.lastLogin) return -1;
    return new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime();
  });
  
  // Get users who have logged in
  const loggedInUsers = sortedUsers.filter(user => user.lastLogin);
  
  // Format date for display
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
  
  // Generate login data for the chart
  const generateLoginData = () => {
    const roleCounts = {
      student: { active: 0, inactive: 0 },
      admin: { active: 0, inactive: 0 },
      superadmin: { active: 0, inactive: 0 }
    };
    
    users.forEach(user => {
      if (roleCounts[user.role as keyof typeof roleCounts]) {
        roleCounts[user.role as keyof typeof roleCounts][user.status === 'active' ? 'active' : 'inactive']++;
      }
    });
    
    return [
      { name: 'Students', active: roleCounts.student.active, inactive: roleCounts.student.inactive },
      { name: 'Admins', active: roleCounts.admin.active, inactive: roleCounts.admin.inactive },
      { name: 'Super Admins', active: roleCounts.superadmin.active, inactive: roleCounts.superadmin.inactive }
    ];
  };
  
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 mx-auto border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading login activity...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Login Activity</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-white rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">User Status</h3>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={generateLoginData()}
                margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="active" name="Active" fill="#10B981" />
                <Bar dataKey="inactive" name="Inactive" fill="#D1D5DB" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-center space-x-8 mt-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm text-gray-600">Active</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
              <span className="text-sm text-gray-600">Inactive</span>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 bg-white rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Login Summary</h3>
          
          <ul className="space-y-4">
            <li className="flex justify-between border-b pb-2">
              <span className="text-gray-600">Total Users:</span>
              <span className="font-medium">{users.length}</span>
            </li>
            <li className="flex justify-between border-b pb-2">
              <span className="text-gray-600">Active Users:</span>
              <span className="font-medium">{users.filter(u => u.status === 'active').length}</span>
            </li>
            <li className="flex justify-between border-b pb-2">
              <span className="text-gray-600">Users with Login Activity:</span>
              <span className="font-medium">{loggedInUsers.length}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">Login Rate:</span>
              <span className="font-medium">
                {users.length > 0 ? Math.round((loggedInUsers.length / users.length) * 100) : 0}%
              </span>
            </li>
          </ul>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Activity</h4>
            {loggedInUsers.length > 0 ? (
              <p className="text-sm text-gray-600">
                Last login: <span className="font-medium">{loggedInUsers[0].username}</span> at <span className="font-medium">{formatDate(loggedInUsers[0].lastLogin)}</span>
              </p>
            ) : (
              <p className="text-sm text-gray-600">No recent login activity</p>
            )}
          </div>
        </Card>
      </div>
      
      <Card className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Recent Login Activity</h3>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>School</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loggedInUsers.slice(0, 10).map((user) => (
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
                    <Badge 
                      className={
                        user.role === 'superadmin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : user.role === 'admin' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                      }
                      variant="outline"
                    >
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
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
                  <TableCell className="text-sm text-gray-500">
                    {user.school || (user.role !== 'student' ? 'N/A' : 'Not specified')}
                  </TableCell>
                </TableRow>
              ))}
              
              {loggedInUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No login activity recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
