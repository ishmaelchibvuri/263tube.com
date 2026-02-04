"use client";

import { useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Calendar,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { trackAdminAnalyticsViewed } from "@/lib/analytics";

export default function AnalyticsPage() {
  useEffect(() => {
    trackAdminAnalyticsViewed();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600 mt-2">
            Track platform performance and user engagement
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Revenue"
            value="R 45,231"
            change="+12.5%"
            trend="up"
            icon={DollarSign}
            color="bg-green-600"
          />
          <MetricCard
            title="Active Users"
            value="1,247"
            change="+8.2%"
            trend="up"
            icon={Users}
            color="bg-primary"
          />
          <MetricCard
            title="Exam Completions"
            value="3,456"
            change="+15.3%"
            trend="up"
            icon={Activity}
            color="bg-purple-600"
          />
          <MetricCard
            title="Conversion Rate"
            value="4.2%"
            change="-0.5%"
            trend="down"
            icon={TrendingUp}
            color="bg-orange-600"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-around gap-2">
                {[65, 78, 82, 91, 73, 88, 95].map((value, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg"
                      style={{ height: `${value}%` }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-2">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">This Week</span>
                  <span className="font-semibold text-green-600">+15.3%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-around gap-2">
                {[55, 62, 68, 71, 76, 82, 89].map((value, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg"
                      style={{ height: `${value}%` }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-2">
                      W{i + 1}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Last 7 Weeks</span>
                  <span className="font-semibold text-green-600">+8.2%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <SubscriptionBar label="Free" count={905} percentage={72.6} color="bg-gray-500" />
              <SubscriptionBar label="Premium" count={234} percentage={18.8} color="bg-blue-500" />
              <SubscriptionBar label="Pro" count={108} percentage={8.6} color="bg-purple-500" />
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Exams */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Exams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <ExamPerformanceRow
                name="Regulatory Compliance Basics"
                attempts={456}
                avgScore={84.5}
                passRate={89}
              />
              <ExamPerformanceRow
                name="Financial Regulations"
                attempts={392}
                avgScore={78.2}
                passRate={76}
              />
              <ExamPerformanceRow
                name="Data Protection & Privacy"
                attempts={345}
                avgScore={81.7}
                passRate={82}
              />
              <ExamPerformanceRow
                name="Anti-Money Laundering"
                attempts={298}
                avgScore={79.3}
                passRate={79}
              />
            </div>
          </CardContent>
        </Card>

        {/* User Engagement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>User Engagement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <EngagementMetric label="Daily Active Users" value="342" percentage={73} />
              <EngagementMetric label="Weekly Active Users" value="876" percentage={85} />
              <EngagementMetric label="Monthly Active Users" value="1,156" percentage={93} />
              <EngagementMetric label="Avg. Session Duration" value="24 min" percentage={68} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RevenueItem label="Premium Subscriptions" amount="R 23,450" percentage={52} />
              <RevenueItem label="Pro Subscriptions" amount="R 19,440" percentage={43} />
              <RevenueItem label="Other" amount="R 2,341" percentage={5} />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

function MetricCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: any;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">{title}</p>
          <div className={`${color} rounded-full p-2`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>
        <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
        <div className="flex items-center gap-1">
          {trend === "up" ? (
            <ArrowUp className="h-4 w-4 text-green-600" />
          ) : (
            <ArrowDown className="h-4 w-4 text-red-600" />
          )}
          <span
            className={`text-sm font-medium ${
              trend === "up" ? "text-green-600" : "text-red-600"
            }`}
          >
            {change}
          </span>
          <span className="text-sm text-gray-500">vs last period</span>
        </div>
      </CardContent>
    </Card>
  );
}

function SubscriptionBar({
  label,
  count,
  percentage,
  color,
}: {
  label: string;
  count: number;
  percentage: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900">{label}</span>
        <span className="text-sm text-gray-600">
          {count} users ({percentage}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`${color} h-3 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

function ExamPerformanceRow({
  name,
  attempts,
  avgScore,
  passRate,
}: {
  name: string;
  attempts: number;
  avgScore: number;
  passRate: number;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{name}</h4>
        <p className="text-sm text-gray-600">{attempts} attempts</p>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-center">
          <p className="text-sm text-gray-600">Avg Score</p>
          <p className="font-semibold text-gray-900">{avgScore}%</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Pass Rate</p>
          <p className="font-semibold text-green-600">{passRate}%</p>
        </div>
      </div>
    </div>
  );
}

function EngagementMetric({
  label,
  value,
  percentage,
}: {
  label: string;
  value: string;
  percentage: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="font-semibold text-gray-900">{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

function RevenueItem({
  label,
  amount,
  percentage,
}: {
  label: string;
  amount: string;
  percentage: number;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="text-sm font-medium text-gray-900">{label}</span>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-gray-900">{amount}</span>
        <span className="text-sm text-gray-600">({percentage}%)</span>
      </div>
    </div>
  );
}
