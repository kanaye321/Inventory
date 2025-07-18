import { useQuery } from "@tanstack/react-query";
import { Activity, User } from "@shared/schema";
import { getTimeSince } from "@/lib/utils";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  HistoryIcon, 
  BoxIcon, 
  CheckIcon, 
  PlusIcon, 
  PencilIcon, 
  AlertTriangleIcon,
  UserIcon,
  BoxesIcon,
  ShieldIcon
} from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function Activities() {
  // Query all activities
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['/api/activities'],
    queryFn: async () => {
      const response = await fetch('/api/activities');
      if (!response.ok) throw new Error('Failed to fetch activities');
      return response.json();
    },
  });

  // Query all users to map IDs to names
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const getUserName = (userId: number | null | undefined) => {
    if (userId === null || userId === undefined || !users) return "System";
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "Unknown User";
  };

  const getActivityIcon = (action: string, itemType: string) => {
    // First determine the background color based on the action
    let bgColorClass = "bg-gray-100";
    let textColorClass = "text-gray-600";

    switch (action) {
      case 'checkout':
        bgColorClass = "bg-blue-100";
        textColorClass = "text-blue-600";
        break;
      case 'checkin':
        bgColorClass = "bg-green-100";
        textColorClass = "text-green-600";
        break;
      case 'create':
        bgColorClass = "bg-purple-100";
        textColorClass = "text-purple-600";
        break;
      case 'update':
        bgColorClass = "bg-yellow-100";
        textColorClass = "text-yellow-600";
        break;
      case 'delete':
        bgColorClass = "bg-red-100";
        textColorClass = "text-red-600";
        break;
    }

    // Then determine the icon based on the item type
    let Icon = HistoryIcon;
    switch (itemType) {
      case 'asset':
        Icon = BoxIcon;
        break;
      case 'user':
        Icon = UserIcon;
        break;
      case 'license':
        Icon = ShieldIcon;
        break;
      case 'component':
      case 'accessory':
        Icon = BoxesIcon;
        break;
    }

    return (
      <div className={`h-10 w-10 rounded-full ${bgColorClass} flex items-center justify-center ring-8 ring-white`}>
        <Icon className={`h-5 w-5 ${textColorClass}`} />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">Activities</h1>
          <Breadcrumb className="text-sm text-muted-foreground">
            <BreadcrumbItem>
              <Link href="/">Dashboard</Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              Activities
            </BreadcrumbItem>
          </Breadcrumb>
        </div>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>All Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-8">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : activities && activities.length > 0 ? (
            <div className="flow-root">
              <ul className="-mb-8">
                {activities.map((activity, idx) => (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {idx < activities.length - 1 && (
                        <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                      )}
                      <div className="relative flex items-start space-x-3">
                        <div className="relative">
                          {getActivityIcon(activity.action, activity.itemType)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div>
                            <div className="text-sm text-gray-800">
                              <Link href={`/users/${activity.userId}`} className="font-medium text-primary">
                                {getUserName(activity.userId)}
                              </Link>
                              {' '}
                              {activity.notes}
                            </div>
                            <p className="mt-0.5 text-sm text-gray-500">
                              {getTimeSince(activity.timestamp)}
                            </p>
                            <div className="mt-2 text-xs text-muted-foreground">
                              {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)} - {activity.itemType.charAt(0).toUpperCase() + activity.itemType.slice(1)} #{activity.itemId}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center py-12">
              <HistoryIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No activity has been recorded yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}