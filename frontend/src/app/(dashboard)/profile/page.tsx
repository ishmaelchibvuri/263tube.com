"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User,
  Mail,
  Shield,
  LogOut,
  Trash2,
  AlertCircle,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, signOut, getAccessToken } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
  });
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
      });
    }
  }, [user]);

  const getInitials = () => {
    if (!user) return "U";
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = await getAccessToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      window.location.href = "/";
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm account deletion");
      return;
    }

    setIsDeleting(true);
    try {
      const token = await getAccessToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete account");
      }

      toast.success("Account deleted successfully. Goodbye!");

      // Sign out and redirect to home
      await signOut();
      window.location.href = "/";
    } catch (error: any) {
      console.error("Account deletion error:", error);
      toast.error(error.message || "Failed to delete account");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmText("");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="animate-pulse">
              <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-48 mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center pt-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 mt-1">Manage your account settings</p>
        </div>

        {/* Profile Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-center">
            <Avatar className="h-24 w-24 mx-auto ring-4 ring-white/30 shadow-xl">
              <AvatarFallback className="bg-white text-blue-600 text-2xl font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold text-white mt-4">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-blue-100 text-sm mt-1">{user.email}</p>
            <Badge className="mt-3 bg-white/20 text-white border-0">
              {user.emailVerified ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Verified Account
                </>
              ) : (
                <>
                  <Shield className="w-3 h-3 mr-1" />
                  Unverified
                </>
              )}
            </Badge>
          </div>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-500" />
                  Personal Information
                </CardTitle>
                <CardDescription>Your account details</CardDescription>
              </div>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-gray-600">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-gray-600">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-gray-600 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="mt-1 bg-gray-50"
              />
              <p className="text-xs text-gray-400 mt-1">
                Email cannot be changed
              </p>
            </div>

            {isEditing && (
              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      firstName: user.firstName || "",
                      lastName: user.lastName || "",
                    });
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card>
          <CardContent className="p-4">
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-600 text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-gray-600 mb-4">
              Permanently delete your account and all your data. This action cannot be undone.
            </p>
            <AlertDialog onOpenChange={(open) => !open && setDeleteConfirmText("")}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? "Deleting..." : "Delete Account"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-red-600">
                    Delete your account?
                  </AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-4">
                      <p>
                        This will permanently delete your account and all associated data including:
                      </p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>Your profile information</li>
                        <li>All budget entries and categories</li>
                        <li>Income and expense history</li>
                        <li>All saved preferences</li>
                      </ul>
                      <p className="font-semibold text-red-600">
                        This action cannot be undone.
                      </p>
                      <div className="pt-2">
                        <Label htmlFor="deleteConfirm" className="text-sm font-medium">
                          Type <span className="font-bold text-red-600">DELETE</span> to confirm:
                        </Label>
                        <Input
                          id="deleteConfirm"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="Type DELETE here"
                          className="mt-2"
                          autoComplete="off"
                        />
                      </div>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== "DELETE" || isDeleting}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? "Deleting..." : "Delete Account"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
