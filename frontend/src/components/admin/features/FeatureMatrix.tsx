"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save } from "lucide-react";

interface Feature {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface TierAccess {
  [featureId: string]: {
    free: boolean;
    pro: boolean;
  };
}

export default function FeatureMatrix() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [tierAccess, setTierAccess] = useState<TierAccess>({});

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/features');
      // const data = await response.json();

      // Mock data
      const mockFeatures: Feature[] = [
        { id: "1", name: "Basic Calculator", description: "Access to basic debt calculator", category: "Tools" },
        { id: "2", name: "Advanced Strategies", description: "Access to advanced payoff strategies", category: "Tools" },
        { id: "3", name: "Export Reports", description: "Export debt reports to PDF/Excel", category: "Reports" },
        { id: "4", name: "Custom Payment Plans", description: "Create custom payment schedules", category: "Planning" },
        { id: "5", name: "Priority Support", description: "24/7 priority customer support", category: "Support" },
        { id: "6", name: "API Access", description: "Access to REST API", category: "Integration" },
      ];

      const mockAccess: TierAccess = {
        "1": { free: true, pro: true },
        "2": { free: false, pro: true },
        "3": { free: false, pro: true },
        "4": { free: false, pro: true },
        "5": { free: false, pro: true },
        "6": { free: false, pro: true },
      };

      setFeatures(mockFeatures);
      setTierAccess(mockAccess);
    } catch (error) {
      console.error("Error loading features:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (featureId: string, tier: keyof TierAccess[string]) => {
    setTierAccess((prev) => ({
      ...prev,
      [featureId]: {
        free: prev[featureId]?.free ?? false,
        pro: prev[featureId]?.pro ?? false,
        [tier]: !prev[featureId]?.[tier],
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // TODO: Replace with actual API call
      // await fetch('/api/admin/features/access', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(tierAccess),
      // });

      console.log("Saving tier access:", tierAccess);
    } catch (error) {
      console.error("Error saving tier access:", error);
    } finally {
      setSaving(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "free":
        return "bg-gray-100 text-gray-800";
      case "pro":
        return "bg-blue-100 text-blue-800";
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
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Feature</TableHead>
              <TableHead className="text-center">Free</TableHead>
              <TableHead className="text-center">Pro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {features.map((feature) => (
              <TableRow key={feature.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{feature.name}</div>
                    <div className="text-sm text-gray-500">{feature.description}</div>
                    <Badge className={`mt-1 ${getTierColor(feature.category.toLowerCase())}`}>
                      {feature.category}
                    </Badge>
                  </div>
                </TableCell>
                {(["free", "pro"] as const).map((tier) => (
                  <TableCell key={tier} className="text-center">
                    <div className="flex justify-center">
                      <Switch
                        checked={tierAccess[feature.id]?.[tier] || false}
                        onCheckedChange={() => handleToggle(feature.id, tier)}
                      />
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-gray-600 space-y-1">
        <p>Tip: Enable features for each tier to control access levels.</p>
        <p>Changes are saved immediately when you click the Save button.</p>
      </div>
    </div>
  );
}
