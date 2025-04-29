import { SuperAdminTab } from "@/pages/super-admin-panel";

interface SuperAdminTabsProps {
  activeTab: SuperAdminTab;
  onTabChange: (tab: SuperAdminTab) => void;
}

export default function SuperAdminTabs({ activeTab, onTabChange }: SuperAdminTabsProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex -mb-px">
        <button
          onClick={() => onTabChange("users")}
          className={`px-6 py-4 border-b-2 font-medium ${
            activeTab === "users"
              ? "border-primary-800 text-primary-800"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          User Management
        </button>
        <button
          onClick={() => onTabChange("quiz")}
          className={`px-6 py-4 border-b-2 font-medium ${
            activeTab === "quiz"
              ? "border-primary-800 text-primary-800"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Quiz Controls
        </button>
        <button
          onClick={() => onTabChange("activity")}
          className={`px-6 py-4 border-b-2 font-medium ${
            activeTab === "activity"
              ? "border-primary-800 text-primary-800"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Login Activity
        </button>
        <button
          onClick={() => onTabChange("settings")}
          className={`px-6 py-4 border-b-2 font-medium ${
            activeTab === "settings"
              ? "border-primary-800 text-primary-800"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          System Settings
        </button>
      </nav>
    </div>
  );
}
