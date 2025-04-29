import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Student {
  id: number;
  username: string;
  school: string;
  status: string;
  lastLogin?: Date;
  email?: string;
}

interface StudentsListProps {
  students: Student[];
}

export default function StudentsList({ students }: StudentsListProps) {
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

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>School</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Login</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id} className="hover:bg-gray-50">
              <TableCell>
                <div className="flex items-center">
                  <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-800 font-medium">
                      {student.username.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{student.username}</div>
                    <div className="text-sm text-gray-500">{student.email || 'No email'}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-900">{student.school || 'Not specified'}</div>
              </TableCell>
              <TableCell>
                <Badge 
                  className={student.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                  }
                  variant="outline"
                >
                  {student.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {formatDate(student.lastLogin)}
              </TableCell>
            </TableRow>
          ))}
          
          {students.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                No students registered yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      {students.length > 0 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{students.length}</span> of <span className="font-medium">{students.length}</span> students
          </div>
        </div>
      )}
    </div>
  );
}
