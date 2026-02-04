"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trackAdminEmailTemplatesViewed, trackAdminEmailTemplateAction } from "@/lib/analytics";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Mail,
  Edit,
  Trash2,
  Plus,
  Eye,
  Code,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface EmailTemplate {
  templateId: string;
  templateName: string;
  description: string;
  subject: string;
  htmlBody?: string;
  textBody?: string;
  variables: string[];
  isActive: boolean;
  lastModifiedBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newVariable, setNewVariable] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    templateId: "",
    templateName: "",
    description: "",
    subject: "",
    htmlBody: "",
    textBody: "",
    variables: [] as string[],
    isActive: true,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/email-templates`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("idToken")}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`Failed to fetch templates: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Templates loaded:", data);
      setTemplates(data.templates || []);
      trackAdminEmailTemplatesViewed(data.templates?.length || 0);
    } catch (err) {
      console.error("❌ Error fetching templates:", err);
      setError("Failed to load email templates. Please ensure you are logged in as an admin.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (templateId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/email-templates/${templateId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("idToken")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch template");

      const data = await response.json();
      const template = data.template;

      setFormData({
        templateId: template.templateId,
        templateName: template.templateName,
        description: template.description || "",
        subject: template.subject,
        htmlBody: template.htmlBody,
        textBody: template.textBody,
        variables: template.variables,
        isActive: template.isActive,
      });

      setSelectedTemplate(template);
      setIsEditDialogOpen(true);
    } catch (err) {
      setError("Failed to load template details");
      console.error(err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/email-templates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("idToken")}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save template");

      setSuccess("Template saved successfully!");
      setIsEditDialogOpen(false);
      fetchTemplates();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save template");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewDialogOpen(true);
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/email-templates/${templateId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("idToken")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to delete template");

      setSuccess("Template deleted successfully!");
      fetchTemplates();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to delete template");
      console.error(err);
    }
  };

  const handleCreateNew = () => {
    setFormData({
      templateId: `template-${Date.now()}`,
      templateName: "",
      description: "",
      subject: "",
      htmlBody: "",
      textBody: "",
      variables: [],
      isActive: true,
    });
    setSelectedTemplate(null);
    setIsEditDialogOpen(true);
  };

  const handleAddVariable = () => {
    if (newVariable && !formData.variables.includes(newVariable)) {
      setFormData({
        ...formData,
        variables: [...formData.variables, newVariable],
      });
      setNewVariable("");
    }
  };

  const handleRemoveVariable = (variable: string) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter((v) => v !== variable),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Email Templates
          </h1>
          <p className="text-gray-600">
            Manage and customize email templates sent to users
          </p>
        </div>
        <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Create New Template
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-500 text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.templateId} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    {template.templateName}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {template.description || template.subject}
                  </CardDescription>
                </div>
                {template.isActive ? (
                  <Badge className="bg-green-100 text-green-700">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Template ID</p>
                  <p className="text-sm font-mono">{template.templateId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Variables</p>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map((v) => (
                      <Badge key={v} variant="outline" className="text-xs">
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(template.templateId)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePreview(template)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(template.templateId)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? "Edit Email Template" : "Create New Email Template"}
            </DialogTitle>
            <DialogDescription>
              Customize the email template. Use {`{{variableName}}`} for dynamic content.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="templateId">Template ID</Label>
                <Input
                  id="templateId"
                  value={formData.templateId}
                  onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                  disabled={!!selectedTemplate}
                  className={selectedTemplate ? "bg-gray-50" : ""}
                  placeholder="e.g., welcome-email, password-reset"
                />
              </div>
              <div>
                <Label htmlFor="isActive">Status</Label>
                <select
                  id="isActive"
                  value={formData.isActive ? "active" : "inactive"}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.value === "active" })
                  }
                  className="w-full h-10 px-3 rounded-md border border-gray-300"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="templateName">Template Name</Label>
              <Input
                id="templateName"
                value={formData.templateName}
                onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Use {{variables}} for dynamic content"
              />
            </div>

            <div>
              <Label htmlFor="htmlBody" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                HTML Body
              </Label>
              <Textarea
                id="htmlBody"
                value={formData.htmlBody}
                onChange={(e) => setFormData({ ...formData, htmlBody: e.target.value })}
                rows={15}
                className="font-mono text-sm"
                placeholder="HTML email template..."
              />
            </div>

            <div>
              <Label htmlFor="textBody">Plain Text Body</Label>
              <Textarea
                id="textBody"
                value={formData.textBody}
                onChange={(e) => setFormData({ ...formData, textBody: e.target.value })}
                rows={10}
                placeholder="Plain text version..."
              />
            </div>

            <div>
              <Label>Available Variables</Label>
              <p className="text-sm text-gray-500 mb-2">
                Add variables that can be used in the template (e.g., firstName, verificationCode)
              </p>
              <div className="flex gap-2 mb-3">
                <Input
                  value={newVariable}
                  onChange={(e) => setNewVariable(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddVariable()}
                  placeholder="Variable name (e.g., firstName)"
                  className="flex-1"
                />
                <Button type="button" onClick={handleAddVariable} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md min-h-[60px]">
                {formData.variables.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No variables added yet</p>
                ) : (
                  formData.variables.map((v) => (
                    <Badge
                      key={v}
                      variant="secondary"
                      className="gap-1 pr-1 cursor-pointer hover:bg-red-100"
                    >
                      {`{{${v}}}`}
                      <X
                        className="h-3 w-3 hover:text-red-600"
                        onClick={() => handleRemoveVariable(v)}
                      />
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview: {selectedTemplate?.templateName}</DialogTitle>
            <DialogDescription>
              This is how the email will appear to recipients
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <Label>Subject</Label>
                <div className="p-3 bg-gray-50 rounded-md font-medium">
                  {selectedTemplate.subject}
                </div>
              </div>

              <div>
                <Label>HTML Preview</Label>
                <div
                  className="p-4 border rounded-md bg-white"
                  dangerouslySetInnerHTML={{
                    __html: selectedTemplate.htmlBody || "",
                  }}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsPreviewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
