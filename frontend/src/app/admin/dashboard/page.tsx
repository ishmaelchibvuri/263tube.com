"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  CreditCard,
  BookOpen,
  TrendingUp,
  Activity,
  DollarSign,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { trackAdminDashboardViewed } from "@/lib/analytics";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalQuestions: 0,
    monthlyRevenue: 0,
    newUsersToday: 0,
    activeUsers: 0,
    pendingIssues: 0,
    systemHealth: 100,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackAdminDashboardViewed();
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/stats');
      // const data = await response.json();

      // Mock data for now
      setStats({
        totalUsers: 1247,
        activeSubscriptions: 342,
        totalQuestions: 5432,
        monthlyRevenue: 34890,
        newUsersToday: 23,
        activeUsers: 156,
        pendingIssues: 3,
        systemHealth: 98,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    change,
  }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    change?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
            {change && (
              <p className="text-sm text-green-600 mt-1 font-medium">
                {change}
              </p>
            )}
          </div>
          <div className={`${color} rounded-full p-4`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-2">
            Welcome back! Here's what's happening with your platform.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={Users}
            color="bg-primary"
            change="+12% from last month"
          />
          <StatCard
            title="Active Subscriptions"
            value={stats.activeSubscriptions}
            icon={CreditCard}
            color="bg-green-600"
            change="+8% from last month"
          />
          <StatCard
            title="Question Bank"
            value={stats.totalQuestions.toLocaleString()}
            icon={BookOpen}
            color="bg-purple-600"
          />
          <StatCard
            title="Monthly Revenue"
            value={`R${(stats.monthlyRevenue / 1000).toFixed(1)}k`}
            icon={DollarSign}
            color="bg-orange-600"
            change="+15% from last month"
          />
        </div>

        {/* Real-time Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">New Users Today</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {stats.newUsersToday}
                  </h3>
                </div>
                <UserCheck className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Now</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {stats.activeUsers}
                  </h3>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending Issues</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {stats.pendingIssues}
                  </h3>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">System Health</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {stats.systemHealth}%
                  </h3>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ActivityItem
                  type="user"
                  message="New user registered: john.doe@example.com"
                  time="2 minutes ago"
                />
                <ActivityItem
                  type="subscription"
                  message="Premium subscription purchased"
                  time="15 minutes ago"
                />
                <ActivityItem
                  type="exam"
                  message="New exam completed by user #1234"
                  time="1 hour ago"
                />
                <ActivityItem
                  type="question"
                  message="25 questions added to bank"
                  time="2 hours ago"
                />
                <ActivityItem
                  type="support"
                  message="Support ticket #789 resolved"
                  time="3 hours ago"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <QuickActionButton
                  href="/admin/users"
                  icon={Users}
                  label="Manage Users"
                  color="bg-primary"
                />
                <QuickActionButton
                  href="/admin/analytics"
                  icon={TrendingUp}
                  label="View Analytics"
                  color="bg-orange-600"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SystemStatusItem
                label="API Server"
                status="operational"
                uptime="99.9%"
              />
              <SystemStatusItem
                label="Database"
                status="operational"
                uptime="99.8%"
              />
              <SystemStatusItem
                label="Payment Gateway"
                status="operational"
                uptime="100%"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function ActivityItem({
  type,
  message,
  time,
}: {
  type: string;
  message: string;
  time: string;
}) {
  const getIcon = () => {
    switch (type) {
      case "user":
        return <Users className="h-4 w-4" />;
      case "subscription":
        return <CreditCard className="h-4 w-4" />;
      case "exam":
        return <BookOpen className="h-4 w-4" />;
      case "question":
        return <BookOpen className="h-4 w-4" />;
      case "support":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="bg-blue-100 rounded-full p-2 text-primary">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">{message}</p>
        <p className="text-xs text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  );
}

function QuickActionButton({
  href,
  icon: Icon,
  label,
  color,
}: {
  href: string;
  icon: any;
  label: string;
  color: string;
}) {
  return (
    <a
      href={href}
      className={`${color} hover:opacity-90 transition-all p-6 rounded-xl text-white flex flex-col items-center justify-center gap-2 group`}
    >
      <Icon className="h-8 w-8 group-hover:scale-110 transition-transform" />
      <span className="font-semibold text-sm text-center">{label}</span>
    </a>
  );
}

function SystemStatusItem({
  label,
  status,
  uptime,
}: {
  label: string;
  status: string;
  uptime: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-600">Uptime: {uptime}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium text-green-600 capitalize">
          {status}
        </span>
      </div>
    </div>
  );
}
