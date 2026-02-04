"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Upload,
  Download,
  FileJson,
  FileText,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { trackAdminQuestionsViewed } from "@/lib/analytics";

export default function QuestionBankPage() {
  const [importType, setImportType] = useState<"json" | "csv" | "manual">(
    "json"
  );

  useEffect(() => {
    trackAdminQuestionsViewed(5432); // Using the mock total from the page
  }, []);
  const [jsonInput, setJsonInput] = useState("");
  const [csvInput, setCsvInput] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: boolean;
    imported: number;
    errors: string[];
  } | null>(null);

  const handleImportJSON = async () => {
    setImporting(true);
    try {
      const questions = JSON.parse(jsonInput);

      // Validate structure
      if (!Array.isArray(questions)) {
        throw new Error("JSON must be an array of questions");
      }

      // TODO: Call API to import questions
      // await fetch('/api/admin/questions/import', {
      //   method: 'POST',
      //   body: JSON.stringify({ questions }),
      // });

      setImportResults({
        success: true,
        imported: questions.length,
        errors: [],
      });

      toast.success(`Successfully imported ${questions.length} questions`);
      setJsonInput("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to import questions";
      toast.error(errorMessage);
      setImportResults({
        success: false,
        imported: 0,
        errors: [errorMessage],
      });
    } finally {
      setImporting(false);
    }
  };

  const handleImportCSV = async () => {
    setImporting(true);
    try {
      // Parse CSV
      const lines = csvInput.split("\n");
      const firstLine = lines[0];

      if (!firstLine) {
        throw new Error("CSV is empty");
      }

      const headers = firstLine.split(",");

      const questions = lines.slice(1).map((line) => {
        const values = line.split(",");
        const question: Record<string, string> = {};
        headers.forEach((header, index) => {
          const value = values[index];
          question[header.trim()] = value?.trim() ?? "";
        });
        return question;
      });

      // TODO: Call API to import questions

      setImportResults({
        success: true,
        imported: questions.length,
        errors: [],
      });

      toast.success(`Successfully imported ${questions.length} questions`);
      setCsvInput("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to import questions";
      toast.error(errorMessage);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = {
      questions: [
        {
          questionId: "Q001",
          questionText: "What is the primary purpose of regulatory compliance?",
          options: [
            "To increase profits",
            "To ensure legal and ethical standards",
            "To reduce workforce",
            "To expand market share",
          ],
          correctAnswers: ["To ensure legal and ethical standards"],
          explanation:
            "Regulatory compliance ensures organizations meet legal and ethical requirements.",
          category: "Compliance Basics",
          difficulty: "easy",
          points: 10,
        },
      ],
    };

    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "question-template.json";
    a.click();
  };

  const downloadCSVTemplate = () => {
    const csv = `questionId,questionText,option1,option2,option3,option4,correctAnswer,explanation,category,difficulty,points
Q001,"What is regulatory compliance?","Option A","Option B","Option C","Option D","Option B","Explanation here","Compliance","easy",10`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "question-template.csv";
    a.click();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Question Bank Management
          </h1>
          <p className="text-gray-600 mt-2">
            Import, edit, and manage your question database
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Questions</p>
                  <h3 className="text-3xl font-bold text-gray-900">5,432</h3>
                </div>
                <BookOpen className="h-10 w-10 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Categories</p>
                  <h3 className="text-3xl font-bold text-gray-900">24</h3>
                </div>
                <FileText className="h-10 w-10 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Exams</p>
                  <h3 className="text-3xl font-bold text-gray-900">18</h3>
                </div>
                <CheckCircle className="h-10 w-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending Review</p>
                  <h3 className="text-3xl font-bold text-gray-900">12</h3>
                </div>
                <AlertCircle className="h-10 w-10 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Import Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Method Selection */}
            <div className="flex gap-4">
              <Button
                variant={importType === "json" ? "default" : "outline"}
                onClick={() => setImportType("json")}
                className="flex-1"
              >
                <FileJson className="h-4 w-4 mr-2" />
                JSON Import
              </Button>
              <Button
                variant={importType === "csv" ? "default" : "outline"}
                onClick={() => setImportType("csv")}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                CSV Import
              </Button>
              <Button
                variant={importType === "manual" ? "default" : "outline"}
                onClick={() => setImportType("manual")}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Manual Entry
              </Button>
            </div>

            {/* JSON Import */}
            {importType === "json" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Paste your questions in JSON format below
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadTemplate}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>

                <Textarea
                  placeholder={`[\n  {\n    "questionId": "Q001",\n    "questionText": "Your question here",\n    "options": ["Option A", "Option B", "Option C", "Option D"],\n    "correctAnswers": ["Option B"],\n    "explanation": "Explanation here",\n    "category": "Category",\n    "difficulty": "easy",\n    "points": 10\n  }\n]`}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                />

                <Button
                  onClick={handleImportJSON}
                  disabled={!jsonInput || importing}
                  className="w-full"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import JSON Questions
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* CSV Import */}
            {importType === "csv" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Paste your CSV data below
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadCSVTemplate}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>

                <Textarea
                  placeholder="questionId,questionText,option1,option2,option3,option4,correctAnswer,explanation,category,difficulty,points"
                  value={csvInput}
                  onChange={(e) => setCsvInput(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                />

                <Button
                  onClick={handleImportCSV}
                  disabled={!csvInput || importing}
                  className="w-full"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import CSV Questions
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Manual Entry */}
            {importType === "manual" && (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Plus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Manual Question Entry
                </h3>
                <p className="text-gray-600 mb-6">
                  Create questions one at a time with our form builder
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Question
                </Button>
              </div>
            )}

            {/* Import Results */}
            {importResults && (
              <div
                className={`p-4 rounded-lg border-2 ${
                  importResults.success
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  {importResults.success ? (
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">
                      {importResults.success
                        ? "Import Successful"
                        : "Import Failed"}
                    </h4>
                    <p className="text-sm mb-2">
                      Imported: {importResults.imported} questions
                    </p>
                    {importResults.errors.length > 0 && (
                      <div className="text-sm">
                        <p className="font-medium mb-1">Errors:</p>
                        <ul className="list-disc list-inside">
                          {importResults.errors.map(
                            (error: string, i: number) => (
                              <li key={i}>{error}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Format Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Format Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  JSON Format Requirements
                </h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Must be a valid JSON array</li>
                  <li>
                    Each question must have: questionId, questionText, options,
                    correctAnswers
                  </li>
                  <li>Options must be an array of strings</li>
                  <li>
                    correctAnswers must be an array (even for single correct
                    answer)
                  </li>
                  <li>
                    Optional fields: explanation, category, difficulty, points
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  CSV Format Requirements
                </h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>First row must be headers</li>
                  <li>
                    Required columns: questionId, questionText, correctAnswer
                  </li>
                  <li>Use comma as delimiter</li>
                  <li>Enclose text with commas in quotes</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Tip:</strong> Download the template files to see the
                  exact format required for importing questions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
