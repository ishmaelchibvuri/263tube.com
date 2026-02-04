"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2, Edit } from "lucide-react";

interface Promotion {
  id: string;
  name: string;
  description: string;
  tier: string;
  features: string[];
  startDate: string;
  endDate: string | null;
  active: boolean;
  permanent: boolean;
}

export default function PromotionManager() {
  const [loading, setLoading] = useState(true);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/promotions');
      // const data = await response.json();

      // Mock data
      const mockPromotions: Promotion[] = [
        {
          id: "1",
          name: "Holiday Special",
          description: "Premium features for Basic tier during holidays",
          tier: "basic",
          features: ["Advanced Strategies", "Export Reports"],
          startDate: "2024-12-15",
          endDate: "2025-01-05",
          active: true,
          permanent: false,
        },
        {
          id: "2",
          name: "Free Tier Upgrade",
          description: "Give free users access to basic calculator",
          tier: "free",
          features: ["Basic Calculator"],
          startDate: "2024-01-01",
          endDate: null,
          active: true,
          permanent: true,
        },
      ];

      setPromotions(mockPromotions);
    } catch (error) {
      console.error("Error loading promotions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePromotion = () => {
    setEditingPromotion(null);
    setDialogOpen(true);
  };

  const handleEditPromotion = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setDialogOpen(true);
  };

  const handleDeletePromotion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promotion?")) return;

    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/admin/promotions/${id}`, { method: 'DELETE' });
      setPromotions((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Error deleting promotion:", error);
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/admin/promotions/${id}`, {
      //   method: 'PATCH',
      //   body: JSON.stringify({ active }),
      // });

      setPromotions((prev) =>
        prev.map((p) => (p.id === id ? { ...p, active } : p))
      );
    } catch (error) {
      console.error("Error toggling promotion:", error);
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "free":
        return "bg-gray-100 text-gray-800";
      case "basic":
        return "bg-blue-100 text-blue-800";
      case "premium":
        return "bg-purple-100 text-purple-800";
      case "enterprise":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">
            Create promotional campaigns to grant feature access to specific tiers
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreatePromotion}>
              <Plus className="h-4 w-4 mr-2" />
              New Promotion
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPromotion ? "Edit Promotion" : "Create New Promotion"}
              </DialogTitle>
              <DialogDescription>
                Set up a promotional campaign to grant features to a specific tier
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Promotion Name</Label>
                <Input placeholder="e.g., Summer Special" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input placeholder="Brief description of the promotion" />
              </div>
              <div className="space-y-2">
                <Label>Target Tier</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" placeholder="Leave empty for permanent" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch />
                <Label>Make this promotion permanent</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setDialogOpen(false)}>
                  {editingPromotion ? "Update" : "Create"} Promotion
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
              <TableHead>Promotion</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Features</TableHead>
              <TableHead className="text-center">Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promotions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No promotions found. Create your first promotion to get started.
                </TableCell>
              </TableRow>
            ) : (
              promotions.map((promotion) => (
                <TableRow key={promotion.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{promotion.name}</div>
                      <div className="text-sm text-gray-500">{promotion.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTierBadgeColor(promotion.tier)}>
                      {promotion.tier}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {promotion.permanent ? (
                        <Badge variant="outline">Permanent</Badge>
                      ) : (
                        <div>
                          <div>{promotion.startDate}</div>
                          <div className="text-gray-500">to {promotion.endDate}</div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {promotion.features.slice(0, 2).map((feature, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {promotion.features.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{promotion.features.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={promotion.active}
                      onCheckedChange={(checked) =>
                        handleToggleActive(promotion.id, checked)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditPromotion(promotion)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePromotion(promotion.id)}
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
    </div>
  );
}
