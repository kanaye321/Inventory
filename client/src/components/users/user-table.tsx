import { useState } from "react";
import { Link } from "wouter";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import { Edit2Icon, MoreHorizontalIcon, EyeIcon } from "lucide-react";

interface UserTableProps {
  users: User[];
  isLoading: boolean;
  onView?: (user: User) => void;
}

export default function UserTable({ users, isLoading, onView, limit }: UserTableProps) {
  const [page, setPage] = useState(1);
  const pageSize = limit || 10;

  const totalPages = Math.ceil(users.length / pageSize);
  const displayedUsers = limit ? users.slice(0, limit) : users.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-800">Users</h2>
        <div className="flex space-x-2">
          <Link href="/users">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-5">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-100 w-full rounded"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-50 w-full rounded"></div>
            ))}
          </div>
        ) : displayedUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <Link href={`/users/${user.id}`} className="text-primary hover:underline">
                        {user.firstName} {user.lastName}
                      </Link>
                    </TableCell>
                    <TableCell>@{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.department || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={user.isAdmin ? "default" : "outline"}>
                        {user.isAdmin ? "Admin" : "User"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {!limit && totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, users.length)} of {users.length} users
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeftIcon className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {limit && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Showing {Math.min(limit, users.length)} of {users.length} users
                </div>
                <Link href="/users">
                  <a className="text-sm font-medium text-primary hover:underline">
                    View All Users
                  </a>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-gray-100 p-3 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first user</p>
            <Link href="/users?add=true">
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}