import { AdminTab } from "@/pages/admin-panel";

interface AdminTabsProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

export default function AdminTabs({ activeTab, onTabChange }: AdminTabsProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex -mb-px">
        <button
          onClick={() => onTabChange("questions")}
          className={`px-6 py-4 border-b-2 font-medium ${
            activeTab === "questions"
              ? "border-primary-500 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Questions
        </button>
        <button
          onClick={() => onTabChange("students")}
          className={`px-6 py-4 border-b-2 font-medium ${
            activeTab === "students"
              ? "border-primary-500 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Students
        </button>
        <button
          onClick={() => onTabChange("progress")}
          className={`px-6 py-4 border-b-2 font-medium ${
            activeTab === "progress"
              ? "border-primary-500 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Progress
        </button>
      </nav>
    </div>
  );
}
