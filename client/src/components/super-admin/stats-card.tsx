import {
  UserGraduate,
  Users,
  Tasks,
  UserCheck,
  FileText,
  Award
} from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  subtext: string;
  icon: string;
  color: "blue" | "green" | "red" | "yellow" | "purple";
  isLoading?: boolean;
}

export default function StatsCard({
  title,
  value,
  subtext,
  icon,
  color,
  isLoading = false
}: StatsCardProps) {
  const getIcon = () => {
    switch (icon) {
      case "user-graduate":
        return <UserGraduate className={`text-${color}-600`} />;
      case "users":
        return <Users className={`text-${color}-600`} />;
      case "tasks":
        return <Tasks className={`text-${color}-600`} />;
      case "user-check":
        return <UserCheck className={`text-${color}-600`} />;
      case "file-text":
        return <FileText className={`text-${color}-600`} />;
      case "award":
        return <Award className={`text-${color}-600`} />;
      default:
        return <UserGraduate className={`text-${color}-600`} />;
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case "blue":
        return { bg: "bg-blue-100", text: "text-blue-600" };
      case "green":
        return { bg: "bg-green-100", text: "text-green-600" };
      case "red":
        return { bg: "bg-red-100", text: "text-red-600" };
      case "yellow":
        return { bg: "bg-yellow-100", text: "text-yellow-600" };
      case "purple":
        return { bg: "bg-purple-100", text: "text-purple-600" };
      default:
        return { bg: "bg-blue-100", text: "text-blue-600" };
    }
  };

  const colors = getColorClasses();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className={`h-10 w-10 ${colors.bg} rounded-full flex items-center justify-center`}>
          {getIcon()}
        </div>
      </div>
      
      {isLoading ? (
        <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
      ) : (
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      )}
      
      {isLoading ? (
        <div className="h-4 w-32 bg-gray-200 animate-pulse rounded mt-1"></div>
      ) : (
        <p className="text-sm text-gray-500">{subtext}</p>
      )}
    </div>
  );
}
