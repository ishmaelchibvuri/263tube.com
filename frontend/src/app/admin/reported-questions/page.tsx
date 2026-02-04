"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Flag,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
// NOTE: This page is specific to exam platform question management
// Not applicable to debt payoff app - consider removing this page
// import { api } from "@/lib/api-client-debts";

interface ReportedQuestion {
  questionId: string;
  questionText: string;
  questionNumber: number;
  reportCount: number;
  status: "pending" | "reviewed" | "dismissed" | "fixed";
  firstReportedAt: string;
  lastReportedAt: string;
  reasons: Array<{
    userId: string;
    reason: string;
    comment?: string;
    reportedAt: string;
  }>;
}

export default function ReportedQuestionsPage() {
  const [questions, setQuestions] = useState<ReportedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("count");
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  useEffect(() => {
    loadReportedQuestions();
  }, [statusFilter, sortBy]);

  const loadReportedQuestions = async () => {
    setLoading(true);
    try {
      // TODO: This functionality is specific to exam platform
      // Not applicable to debt payoff app
      // const params: any = {
      //   sortBy,
      //   limit: 100,
      // };
      // if (statusFilter !== "all") {
      //   params.status = statusFilter;
      // }
      // const response = await api.getReportedQuestions(params);
      setQuestions([]);
    } catch (error: any) {
      console.error("Error loading reported questions:", error);
      toast.error("Failed to load reported questions");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "reviewed":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <Search className="w-3 h-3 mr-1" />
            Reviewed
          </Badge>
        );
      case "dismissed":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            <XCircle className="w-3 h-3 mr-1" />
            Dismissed
          </Badge>
        );
      case "fixed":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Fixed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReportCountColor = (count: number) => {
    if (count >= 10) return "text-red-600 bg-red-50";
    if (count >= 5) return "text-orange-600 bg-orange-50";
    if (count >= 3) return "text-yellow-600 bg-yellow-50";
    return "text-gray-600 bg-gray-50";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Flag className="w-8 h-8 text-orange-600" />
              Reported Questions
            </h1>
            <p className="text-gray-600 mt-1">
              Review questions that users have reported as potentially incorrect
            </p>
          </div>
          <Button onClick={loadReportedQuestions} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Flag className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Reports</p>
                  <p className="text-2xl font-bold">{questions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">
                    {questions.filter((q) => q.status === "pending").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">High Priority</p>
                  <p className="text-2xl font-bold">
                    {questions.filter((q) => q.reportCount >= 5).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fixed</p>
                  <p className="text-2xl font-bold">
                    {questions.filter((q) => q.status === "fixed").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="count">Most Reports</SelectItem>
                  <SelectItem value="date">Most Recent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Questions List */}
        <Card>
          <CardHeader>
            <CardTitle>Reported Questions</CardTitle>
            <CardDescription>
              Click on a question to view report details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12">
                <Flag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No reported questions found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((question) => (
                  <div
                    key={question.questionId}
                    className="border rounded-lg hover:border-orange-200 transition-colors"
                  >
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() =>
                        setExpandedQuestion(
                          expandedQuestion === question.questionId
                            ? null
                            : question.questionId
                        )
                      }
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-gray-900">
                              Q#{question.questionNumber}
                            </span>
                            {getStatusBadge(question.status)}
                            <span
                              className={`px-2 py-1 rounded text-sm font-medium ${getReportCountColor(
                                question.reportCount
                              )}`}
                            >
                              {question.reportCount} report
                              {question.reportCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {question.questionText}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Last reported: {formatDate(question.lastReportedAt)}
                          </p>
                        </div>
                        <div>
                          {expandedQuestion === question.questionId ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedQuestion === question.questionId && (
                      <div className="border-t bg-gray-50 p-4">
                        <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Report History (Last 10)
                        </h4>
                        <div className="space-y-2">
                          {question.reasons.map((report, idx) => (
                            <div
                              key={idx}
                              className="bg-white p-3 rounded border text-sm"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-700">
                                  {report.reason.replace(/_/g, " ")}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(report.reportedAt)}
                                </span>
                              </div>
                              {report.comment && (
                                <p className="text-gray-600 text-xs">
                                  {report.comment}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button size="sm" variant="outline">
                            Mark as Reviewed
                          </Button>
                          <Button size="sm" variant="outline">
                            Dismiss
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            Mark as Fixed
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
