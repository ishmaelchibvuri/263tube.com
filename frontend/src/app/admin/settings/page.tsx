"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Settings,
  Bell,
  Shield,
  Database,
  Mail,
  CreditCard,
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { trackAdminSettingsViewed } from "@/lib/analytics";

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    trackAdminSettingsViewed();
  }, []);

  const [settings, setSettings] = useState({
    general: {
      siteName: "QuickBudget",
      siteUrl: "https://quickbudget.co.za",
      supportEmail: "support@quickbudget.co.za",
      maintenanceMode: false,
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      adminAlerts: true,
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      passwordExpiry: 90,
    },
    payments: {
      payfastMerchantId: "",
      payfastMerchantKey: "",
      testMode: true,
      currency: "ZAR",
    },
    email: {
      smtpHost: "",
      smtpPort: 587,
      smtpUser: "",
      smtpPassword: "",
      fromName: "QuickBudget",
      fromEmail: "noreply@quickbudget.co.za",
    },
  });

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // TODO: Implement API endpoint to save settings
      // await apiClient.adminSaveSettings(settings);

      console.log("Saving settings:", settings);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess("Settings saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save settings. Please try again.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Admin Settings
        </h1>
        <p className="text-gray-600">
          Configure platform settings and preferences
        </p>
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

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Basic platform configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={settings.general.siteName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, siteName: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="siteUrl">Site URL</Label>
                <Input
                  id="siteUrl"
                  type="url"
                  value={settings.general.siteUrl}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, siteUrl: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={settings.general.supportEmail}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, supportEmail: e.target.value },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                  <p className="text-sm text-gray-500">
                    Put the site in maintenance mode
                  </p>
                </div>
                <Switch
                  id="maintenanceMode"
                  checked={settings.general.maintenanceMode}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, maintenanceMode: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure notification channels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-gray-500">
                    Enable email notifications for users
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.notifications.emailNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, emailNotifications: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="smsNotifications">SMS Notifications</Label>
                  <p className="text-sm text-gray-500">
                    Enable SMS notifications for users
                  </p>
                </div>
                <Switch
                  id="smsNotifications"
                  checked={settings.notifications.smsNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, smsNotifications: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="pushNotifications">Push Notifications</Label>
                  <p className="text-sm text-gray-500">
                    Enable push notifications for users
                  </p>
                </div>
                <Switch
                  id="pushNotifications"
                  checked={settings.notifications.pushNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, pushNotifications: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="adminAlerts">Admin Alerts</Label>
                  <p className="text-sm text-gray-500">
                    Receive alerts for critical events
                  </p>
                </div>
                <Switch
                  id="adminAlerts"
                  checked={settings.notifications.adminAlerts}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, adminAlerts: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-500">
                    Require 2FA for admin accounts
                  </p>
                </div>
                <Switch
                  id="twoFactorAuth"
                  checked={settings.security.twoFactorAuth}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      security: { ...settings.security, twoFactorAuth: checked },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: { ...settings.security, sessionTimeout: parseInt(e.target.value) },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  value={settings.security.maxLoginAttempts}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: { ...settings.security, maxLoginAttempts: parseInt(e.target.value) },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                <Input
                  id="passwordExpiry"
                  type="number"
                  value={settings.security.passwordExpiry}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: { ...settings.security, passwordExpiry: parseInt(e.target.value) },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Settings
              </CardTitle>
              <CardDescription>
                Configure PayFast integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="merchantId">PayFast Merchant ID</Label>
                <Input
                  id="merchantId"
                  value={settings.payments.payfastMerchantId}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payments: { ...settings.payments, payfastMerchantId: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="merchantKey">PayFast Merchant Key</Label>
                <Input
                  id="merchantKey"
                  type="password"
                  value={settings.payments.payfastMerchantKey}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payments: { ...settings.payments, payfastMerchantKey: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={settings.payments.currency}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payments: { ...settings.payments, currency: e.target.value },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="testMode">Test Mode</Label>
                  <p className="text-sm text-gray-500">
                    Enable test mode for payments
                  </p>
                </div>
                <Switch
                  id="testMode"
                  checked={settings.payments.testMode}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      payments: { ...settings.payments, testMode: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Settings
              </CardTitle>
              <CardDescription>
                Configure SMTP and email settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input
                  id="smtpHost"
                  value={settings.email.smtpHost}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email: { ...settings.email, smtpHost: e.target.value },
                    })
                  }
                  placeholder="smtp.gmail.com"
                />
              </div>

              <div>
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input
                  id="smtpPort"
                  type="number"
                  value={settings.email.smtpPort}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email: { ...settings.email, smtpPort: parseInt(e.target.value) },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="smtpUser">SMTP Username</Label>
                <Input
                  id="smtpUser"
                  value={settings.email.smtpUser}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email: { ...settings.email, smtpUser: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="smtpPassword">SMTP Password</Label>
                <Input
                  id="smtpPassword"
                  type="password"
                  value={settings.email.smtpPassword}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email: { ...settings.email, smtpPassword: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="fromName">From Name</Label>
                <Input
                  id="fromName"
                  value={settings.email.fromName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email: { ...settings.email, fromName: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="fromEmail">From Email</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  value={settings.email.fromEmail}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email: { ...settings.email, fromEmail: e.target.value },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
          {saving ? (
            <>
              <Save className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
