"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2, Edit, Search } from "lucide-react";

interface Feature {
  id: string;
  name: string;
  description: string;
  category: string;
  technicalKey: string;
  active: boolean;
  createdAt: string;
}

export default function FeatureCatalog() {
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "tools",
    technicalKey: "",
    active: true,
  });

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/features/catalog');
      // const data = await response.json();

      // Mock data
      const mockFeatures: Feature[] = [
        {
          id: "1",
          name: "Basic Calculator",
          description: "Access to basic debt payoff calculator",
          category: "Tools",
          technicalKey: "basic_calculator",
          active: true,
          createdAt: "2024-01-15",
        },
        {
          id: "2",
          name: "Advanced Strategies",
          description: "Avalanche and Snowball debt payoff strategies",
          category: "Tools",
          technicalKey: "advanced_strategies",
          active: true,
          createdAt: "2024-01-20",
        },
        {
          id: "3",
          name: "Export Reports",
          description: "Export debt reports to PDF and Excel formats",
          category: "Reports",
          technicalKey: "export_reports",
          active: true,
          createdAt: "2024-02-01",
        },
        {
          id: "4",
          name: "Custom Payment Plans",
          description: "Create and manage custom payment schedules",
          category: "Planning",
          technicalKey: "custom_payment_plans",
          active: true,
          createdAt: "2024-02-10",
        },
        {
          id: "5",
          name: "Priority Support",
          description: "24/7 priority customer support via chat and email",
          category: "Support",
          technicalKey: "priority_support",
          active: true,
          createdAt: "2024-02-15",
        },
        {
          id: "6",
          name: "API Access",
          description: "Full REST API access for integrations",
          category: "Integration",
          technicalKey: "api_access",
          active: true,
          createdAt: "2024-03-01",
        },
      ];

      setFeatures(mockFeatures);
    } catch (error) {
      console.error("Error loading features:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFeature = () => {
    setEditingFeature(null);
    setFormData({
      name: "",
      description: "",
      category: "tools",
      technicalKey: "",
      active: true,
    });
    setDialogOpen(true);
  };

  const handleEditFeature = (feature: Feature) => {
    setEditingFeature(feature);
    setFormData({
      name: feature.name,
      description: feature.description,
      category: feature.category.toLowerCase(),
      technicalKey: feature.technicalKey,
      active: feature.active,
    });
    setDialogOpen(true);
  };

  const handleSaveFeature = async () => {
    try {
      // TODO: Replace with actual API call
      const newFeature: Feature = {
        id: editingFeature?.id || Date.now().toString(),
        name: formData.name,
        description: formData.description,
        category: formData.category,
        technicalKey: formData.technicalKey,
        active: formData.active,
        createdAt: editingFeature?.createdAt || new Date().toISOString().split("T")[0] || new Date().toISOString(),
      };

      if (editingFeature) {
        setFeatures((prev) => prev.map((f) => (f.id === editingFeature.id ? newFeature : f)));
      } else {
        setFeatures((prev) => [...prev, newFeature]);
      }

      setDialogOpen(false);
    } catch (error) {
      console.error("Error saving feature:", error);
    }
  };

  const handleDeleteFeature = async (id: string) => {
    if (!confirm("Are you sure you want to delete this feature?")) return;

    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/admin/features/${id}`, { method: 'DELETE' });
      setFeatures((prev) => prev.filter((f) => f.id !== id));
    } catch (error) {
      console.error("Error deleting feature:", error);
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      // TODO: Replace with actual API call
      setFeatures((prev) => prev.map((f) => (f.id === id ? { ...f, active } : f)));
    } catch (error) {
      console.error("Error toggling feature:", error);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "tools":
        return "bg-blue-100 text-blue-800";
      case "reports":
        return "bg-green-100 text-green-800";
      case "planning":
        return "bg-purple-100 text-purple-800";
      case "support":
        return "bg-orange-100 text-orange-800";
      case "integration":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const generateTechnicalKey = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  };

  const filteredFeatures = features.filter(
    (feature) =>
      feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.technicalKey.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateFeature}>
              <Plus className="h-4 w-4 mr-2" />
              New Feature
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingFeature ? "Edit Feature" : "Create New Feature"}
              </DialogTitle>
              <DialogDescription>
                Add a new feature to the platform catalog
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Feature Name</Label>
                <Input
                  placeholder="e.g., Advanced Calculator"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData({
                      ...formData,
                      name,
                      technicalKey: generateTechnicalKey(name),
                    });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe what this feature does"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tools">Tools</SelectItem>
                      <SelectItem value="reports">Reports</SelectItem>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="integration">Integration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Technical Key</Label>
                  <Input
                    placeholder="feature_key"
                    value={formData.technicalKey}
                    onChange={(e) =>
                      setFormData({ ...formData, technicalKey: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, active: checked })
                  }
                />
                <Label>Active</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveFeature}>
                  {editingFeature ? "Update" : "Create"} Feature
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Feature</TableHead>
              <TableHead>Technical Key</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFeatures.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  {searchQuery
                    ? "No features found matching your search"
                    : "No features found. Create your first feature to get started."}
                </TableCell>
              </TableRow>
            ) : (
              filteredFeatures.map((feature) => (
                <TableRow key={feature.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{feature.name}</div>
                      <div className="text-sm text-gray-500">{feature.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {feature.technicalKey}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(feature.category)}>
                      {feature.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={feature.active}
                      onCheckedChange={(checked) =>
                        handleToggleActive(feature.id, checked)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditFeature(feature)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteFeature(feature.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-gray-600">
        <p>Total Features: {features.length}</p>
      </div>
    </div>
  );
}
