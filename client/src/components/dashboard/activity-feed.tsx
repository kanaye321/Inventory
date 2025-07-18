import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { getTimeSince } from "@/lib/utils";
import { Activity, User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HistoryIcon, BoxIcon, CheckIcon, PlusIcon, PencilIcon, AlertTriangleIcon } from "lucide-react";

interface ActivityFeedProps {
  activities?: Activity[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function ActivityFeed({ 
  activities, 
  isLoading = false,
  emptyMessage = "No recent activities"
}: ActivityFeedProps) {
  // Load all users to map IDs to names
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const getUserName = (userId?: number) => {
    if (!userId || !users) return "System";
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "Unknown User";
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'checkout':
        return (
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center ring-8 ring-white">
            <BoxIcon className="h-5 w-5 text-primary" />
          </div>
        );
      case 'checkin':
        return (
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center ring-8 ring-white">
            <CheckIcon className="h-5 w-5 text-green-600" />
          </div>
        );
      case 'create':
        return (
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center ring-8 ring-white">
            <PlusIcon className="h-5 w-5 text-purple-600" />
          </div>
        );
      case 'update':
        return (
          <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center ring-8 ring-white">
            <PencilIcon className="h-5 w-5 text-yellow-600" />
          </div>
        );
      case 'delete':
        return (
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center ring-8 ring-white">
            <AlertTriangleIcon className="h-5 w-5 text-red-600" />
          </div>
        );
      default:
        return (
          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
            <HistoryIcon className="h-5 w-5 text-gray-600" />
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-8">
            {[...Array(5)].map((_, i) => (
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
                        {getActivityIcon(activity.action)}
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
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 text-center">
              <Link href="/activities" className="text-sm font-medium text-primary hover:underline">
                View all activity
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <HistoryIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ActivityFeed;
