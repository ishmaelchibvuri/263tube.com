"use client";

import { useState } from "react";
import { MessageCircle, Send, HelpCircle, Lightbulb, Star, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

type RequestType = "support" | "feedback";
type FeedbackCategory = "ui" | "performance" | "features" | "other";

export function SupportWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestType, setRequestType] = useState<RequestType>("support");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackCategory>("features");
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const resetFormFields = () => {
    setSubject("");
    setDescription("");
    setRating(0);
    setFeedbackCategory("features");
    setRequestType("support");
  };

  const resetAll = () => {
    resetFormFields();
    setSubmitStatus({ type: null, message: "" });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate form based on request type
    if (requestType === "support" && !subject.trim()) {
      setSubmitStatus({
        type: "error",
        message: "Please enter a subject",
      });
      return;
    }

    if (!description.trim()) {
      setSubmitStatus({
        type: "error",
        message: requestType === "support"
          ? "Please describe your issue"
          : "Please share your feedback",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      // For feedback, auto-generate a subject; for support, use user's subject
      const finalSubject = requestType === "feedback"
        ? `User Feedback - ${feedbackCategory.charAt(0).toUpperCase() + feedbackCategory.slice(1)}`
        : subject.trim();

      const response = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: finalSubject,
          description: description.trim(),
          userEmail: user?.email,
          userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : undefined,
          type: requestType,
          rating: requestType === "feedback" ? rating : undefined,
          category: requestType === "feedback" ? feedbackCategory : undefined,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('Server error. Please try again later.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit. Please try again.');
      }

      setSubmitStatus({
        type: "success",
        message: requestType === "feedback"
          ? "Thank you for your feedback!"
          : "Message sent successfully!",
      });

      // Reset form fields (but keep success status visible)
      resetFormFields();

      // Close dialog after 3 seconds
      setTimeout(() => {
        setIsOpen(false);
        setSubmitStatus({ type: null, message: "" });
      }, 3000);
    } catch (error: any) {
      setSubmitStatus({
        type: "error",
        message: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const feedbackCategories: { value: FeedbackCategory; label: string; icon: string }[] = [
    { value: "ui", label: "Design/UI", icon: "🎨" },
    { value: "performance", label: "Speed", icon: "⚡" },
    { value: "features", label: "Features", icon: "✨" },
    { value: "other", label: "Other", icon: "💬" },
  ];

  const isFormValid = requestType === "feedback"
    ? description.trim().length > 0
    : subject.trim().length > 0 && description.trim().length > 0;

  return (
    <>
      {/* Floating Support Button - Mobile-friendly, positioned above bottom nav on mobile */}
      <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 group">
        {/* Pulse Ring Animation */}
        <div className="absolute inset-0 rounded-full bg-blue-500 opacity-60 animate-ping"></div>

        {/* Main Button - Icon only on mobile, with text on larger screens */}
        <Button
          onClick={() => setIsOpen(true)}
          className="relative flex items-center justify-center gap-2 p-3 md:px-4 md:py-3 h-auto rounded-full shadow-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          title="Need help or have feedback?"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="hidden md:inline font-semibold text-sm whitespace-nowrap">Ask Us</span>
        </Button>

        {/* Tooltip on Hover - hidden on mobile/touch */}
        <div className="hidden md:block absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg">
          Support & Feedback
          <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>

      {/* Support/Feedback Modal */}
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetAll();
      }}>
        <DialogContent className="sm:max-w-[440px] max-h-[90vh] overflow-y-auto">
          {/* Success State */}
          {submitStatus.type === "success" ? (
            <div className="py-8 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {submitStatus.message}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                We'll get back to you as soon as possible.
              </p>
              <Button
                onClick={() => {
                  setIsOpen(false);
                  resetAll();
                }}
                className="mt-6"
                variant="outline"
              >
                Close
              </Button>
            </div>
          ) : (
            <>
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-xl">
              {requestType === "support" ? (
                <>
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                  Need Help?
                </>
              ) : (
                <>
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Share Feedback
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {requestType === "support"
                ? "We're here to help you with any questions or issues."
                : "Help us improve QuickBudget with your thoughts."}
            </DialogDescription>
          </DialogHeader>

          {/* Request Type Toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button
              type="button"
              onClick={() => setRequestType("support")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
                requestType === "support"
                  ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              )}
            >
              <HelpCircle className="h-4 w-4" />
              Support
            </button>
            <button
              type="button"
              onClick={() => setRequestType("feedback")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
                requestType === "feedback"
                  ? "bg-white dark:bg-gray-700 text-amber-600 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              )}
            >
              <Lightbulb className="h-4 w-4" />
              Feedback
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Subject - Only for support */}
            {requestType === "support" && (
              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-sm">Subject</Label>
                <Input
                  id="subject"
                  type="text"
                  placeholder="What do you need help with?"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={200}
                  disabled={isSubmitting}
                  className="h-10"
                />
              </div>
            )}

            {/* Feedback-specific fields */}
            {requestType === "feedback" && (
              <>
                {/* Rating */}
                <div className="space-y-1.5">
                  <Label className="text-sm">How would you rate QuickBudget?</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={cn(
                          "p-1 rounded transition-all hover:scale-110",
                          rating >= star ? "text-amber-400" : "text-gray-300 dark:text-gray-600"
                        )}
                      >
                        <Star
                          className="h-7 w-7"
                          fill={rating >= star ? "currentColor" : "none"}
                        />
                      </button>
                    ))}
                    {rating > 0 && (
                      <span className="ml-2 text-sm text-gray-500 self-center">
                        {rating === 5 ? "Amazing!" : rating === 4 ? "Great!" : rating === 3 ? "Good" : rating === 2 ? "Okay" : "Needs work"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label className="text-sm">What's your feedback about?</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {feedbackCategories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setFeedbackCategory(cat.value)}
                        className={cn(
                          "flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all",
                          feedbackCategory === cat.value
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        )}
                      >
                        <span className="text-base">{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm">
                {requestType === "support" ? "Describe your issue" : "Your feedback"}
              </Label>
              <Textarea
                id="description"
                placeholder={
                  requestType === "support"
                    ? "Tell us more about what you're experiencing..."
                    : "What would you like to share? Suggestions, bugs, or anything else..."
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                rows={4}
                disabled={isSubmitting}
                className="resize-none text-sm"
              />
              <p className="text-xs text-gray-400 text-right">
                {description.length}/2000
              </p>
            </div>

            {/* Error Message */}
            {submitStatus.type === "error" && (
              <div className="p-3 rounded-lg text-sm bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                {submitStatus.message}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className={cn(
                  "flex-1 shadow-md transition-all",
                  requestType === "feedback"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                )}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    {requestType === "feedback" ? "Send Feedback" : "Send"}
                  </span>
                )}
              </Button>
            </div>
          </form>

          {/* Footer */}
          <p className="text-xs text-gray-400 text-center pt-2 border-t border-gray-100 dark:border-gray-800">
            Or email{" "}
            <a
              href="mailto:support@quickbudget.co.za"
              className="text-blue-600 hover:underline"
            >
              support@quickbudget.co.za
            </a>
          </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
