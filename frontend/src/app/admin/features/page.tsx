"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Sparkles, Settings, Grid } from "lucide-react";
import FeatureMatrix from "@/components/admin/features/FeatureMatrix";
import PromotionManager from "@/components/admin/features/PromotionManager";
import FeatureCatalog from "@/components/admin/features/FeatureCatalog";
import { trackAdminFeaturesViewed } from "@/lib/analytics";

export default function FeatureManagementPage() {
  const [activeTab, setActiveTab] = useState("matrix");

  useEffect(() => {
    trackAdminFeaturesViewed();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Feature Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage feature access across tiers and create promotional campaigns
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="matrix" className="flex items-center gap-2">
            <Grid className="h-4 w-4" />
            Feature Matrix
          </TabsTrigger>
          <TabsTrigger value="promotions" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Promotions
          </TabsTrigger>
          <TabsTrigger value="catalog" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Feature Catalog
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tier Feature Matrix</CardTitle>
              <CardDescription>
                Configure which features are available to each subscription tier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeatureMatrix />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promotions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Promotions</CardTitle>
              <CardDescription>
                Create time-limited or permanent feature access promotions for specific tiers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PromotionManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalog" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Catalog</CardTitle>
              <CardDescription>
                Manage the complete catalog of features available in the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeatureCatalog />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
