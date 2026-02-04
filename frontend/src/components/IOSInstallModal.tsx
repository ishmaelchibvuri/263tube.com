"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Share, Plus, Home } from "lucide-react";

interface IOSInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IOSInstallModal({ isOpen, onClose }: IOSInstallModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Install on iPhone</DialogTitle>
          <DialogDescription>
            Follow these simple steps to install our app on your iPhone
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 rounded-full p-2 mt-1">
                <span className="text-blue-700 font-bold text-lg">1</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Open Safari</h3>
                <p className="text-sm text-gray-600">
                  Make sure you're using Safari browser on your iPhone
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-100 rounded-full p-2 mt-1">
                <span className="text-blue-700 font-bold text-lg">2</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Tap Share Button</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <p>Tap the</p>
                  <div className="inline-flex items-center bg-gray-100 rounded px-2 py-1">
                    <Share className="h-4 w-4 text-blue-600" />
                  </div>
                  <p>button at the bottom of your screen</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-100 rounded-full p-2 mt-1">
                <span className="text-blue-700 font-bold text-lg">3</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Add to Home Screen</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Scroll down and tap</p>
                  <div className="inline-flex items-center bg-gray-100 rounded px-3 py-2 gap-2">
                    <Plus className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Add to Home Screen</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-100 rounded-full p-2 mt-1">
                <span className="text-blue-700 font-bold text-lg">4</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Launch the App</h3>
                <p className="text-sm text-gray-600">
                  The app icon will appear on your home screen. Tap it to launch the app anytime!
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Home className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-900 mb-1">
                  Why install as a web app?
                </p>
                <p className="text-xs text-green-800">
                  Get a full-screen experience, faster loading times, and easy access from your home screen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
