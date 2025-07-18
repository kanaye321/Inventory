import { Link } from "wouter";
import { 
  PlusIcon, 
  BoxesIcon, 
  UsersIcon, 
  FileTextIcon, 
  SettingsIcon 
} from "lucide-react";

export default function QuickActions() {
  const actions = [
    {
      name: "Add New Asset",
      path: "/assets?add=true",
      icon: <PlusIcon className="h-6 w-6 text-primary" />,
    },
    {
      name: "Check Out Asset",
      path: "/assets",
      icon: <BoxesIcon className="h-6 w-6 text-primary" />,
    },
    {
      name: "Add User",
      path: "/users?add=true",
      icon: <UsersIcon className="h-6 w-6 text-primary" />,
    },
    {
      name: "Generate Report",
      path: "/reports",
      icon: <FileTextIcon className="h-6 w-6 text-primary" />,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: <SettingsIcon className="h-6 w-6 text-primary" />,
    },
  ];

  return (
    <div className="mt-6">
      <h2 className="text-lg font-medium text-gray-800 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {actions.map((action, index) => (
          <Link key={index} href={action.path} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-blue-100 p-3 mb-3">
              {action.icon}
            </div>
            <span className="text-sm font-medium text-gray-800">{action.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
