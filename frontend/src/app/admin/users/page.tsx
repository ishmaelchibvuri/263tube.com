"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Search,
  Filter,
  Crown,
  Zap,
  Star,
  MoreVertical,
  Edit,
  Ban,
  CheckCircle,
  Mail,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { trackAdminUsersViewed, trackAdminUserAction } from "@/lib/analytics";

interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  subscriptionTier: "free" | "premium" | "pro";
  subscriptionStatus: "active" | "expired" | "cancelled";
  subscriptionExpiresAt?: string;
  createdAt: string;
  lastActive?: string;
  totalExams: number;
  averageScore: number;
  isActive: boolean;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [newTier, setNewTier] = useState<string>("");
  const [newDuration, setNewDuration] = useState<number>(30);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/users');
      // const data = await response.json();

      // Mock data
      const mockUsers: User[] = [
        {
          userId: "1",
          email: "john.doe@example.com",
          firstName: "John",
          lastName: "Doe",
          subscriptionTier: "premium",
          subscriptionStatus: "active",
          subscriptionExpiresAt: "2025-11-15",
          createdAt: "2025-01-15",
          lastActive: "2025-10-16",
          totalExams: 45,
          averageScore: 82,
          isActive: true,
        },
        {
          userId: "2",
          email: "jane.smith@example.com",
          firstName: "Jane",
          lastName: "Smith",
          subscriptionTier: "pro",
          subscriptionStatus: "active",
          subscriptionExpiresAt: "2026-01-10",
          createdAt: "2024-12-01",
          lastActive: "2025-10-16",
          totalExams: 78,
          averageScore: 91,
          isActive: true,
        },
        {
          userId: "3",
          email: "bob.wilson@example.com",
          firstName: "Bob",
          lastName: "Wilson",
          subscriptionTier: "free",
          subscriptionStatus: "active",
          createdAt: "2025-10-10",
          lastActive: "2025-10-15",
          totalExams: 5,
          averageScore: 68,
          isActive: true,
        },
      ];

      setUsers(mockUsers);
      trackAdminUsersViewed(mockUsers.length, {
        tierFilter,
        statusFilter
      });
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTier = tierFilter === "all" || user.subscriptionTier === tierFilter;
    const matchesStatus =
      statusFilter === "all" || user.subscriptionStatus === statusFilter;

    return matchesSearch && matchesTier && matchesStatus;
  });

  const handleUpdateSubscription = async () => {
    if (!selectedUser || !newTier) return;

    try {
      // TODO: Call API to update subscription
      // await fetch(`/api/admin/users/${selectedUser.userId}/subscription`, {
      //   method: 'PUT',
      //   body: JSON.stringify({ tier: newTier, durationDays: newDuration }),
      // });

      toast.success(
        `Updated ${selectedUser.firstName}'s subscription to ${newTier}`
      );

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.userId === selectedUser.userId
            ? {
                ...u,
                subscriptionTier: newTier as any,
                subscriptionStatus: "active",
                subscriptionExpiresAt: new Date(
                  Date.now() + newDuration * 24 * 60 * 60 * 1000
                ).toISOString(),
              }
            : u
        )
      );

      setShowSubscriptionDialog(false);
      setSelectedUser(null);
    } catch (error) {
      toast.error("Failed to update subscription");
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "pro":
        return <Zap className="h-4 w-4" />;
      case "premium":
        return <Crown className="h-4 w-4" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      pro: "bg-purple-100 text-purple-800 border-purple-300",
      premium: "bg-blue-100 text-blue-800 border-blue-300",
      free: "bg-gray-100 text-gray-800 border-gray-300",
    };

    return (
      <Badge className={`${colors[tier as keyof typeof colors]} border`}>
        <span className="flex items-center gap-1">
          {getTierIcon(tier)}
          <span className="capitalize">{tier}</span>
        </span>
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      expired: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status === "active" && <CheckCircle className="h-3 w-3 mr-1" />}
        <span className="capitalize">{status}</span>
      </Badge>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-2">
              Manage users, subscriptions, and access control
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <Users className="h-5 w-5 text-primary" />
            <span className="font-semibold text-blue-900">
              {users.length} Total Users
            </span>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subscription
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.userId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {user.firstName[0]}
                              {user.lastName[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTierBadge(user.subscriptionTier)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.subscriptionStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-gray-900">
                            {user.totalExams} exams
                          </div>
                          <div className="text-gray-500">
                            {user.averageScore}% avg
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.subscriptionExpiresAt ? (
                          <div className="text-sm flex items-center gap-1 text-gray-600">
                            <Calendar className="h-3 w-3" />
                            {new Date(user.subscriptionExpiresAt).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setNewTier(user.subscriptionTier);
                            setShowSubscriptionDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Manage
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No users found matching your filters
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Management Dialog */}
      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Subscription</DialogTitle>
            <DialogDescription>
              Update subscription plan for {selectedUser?.firstName}{" "}
              {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Subscription Tier
              </label>
              <Select value={newTier} onValueChange={setNewTier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newTier !== "free" && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Duration (Days)
                </label>
                <Input
                  type="number"
                  value={newDuration}
                  onChange={(e) => setNewDuration(parseInt(e.target.value))}
                  min={1}
                  max={365}
                />
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                This will grant the user {newTier} access
                {newTier !== "free" && ` for ${newDuration} days`}.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSubscriptionDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateSubscription}>Update Subscription</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
