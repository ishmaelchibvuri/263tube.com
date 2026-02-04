"use client";

import Link from "next/link";
import { ChevronLeft, Shield, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              QuickBudget SA
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title Section */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary mb-6">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600">
            <strong>Last updated:</strong> January 2025
          </p>
        </div>

        {/* POPIA Compliance Notice */}
        <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-6 mb-8 shadow-sm">
          <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5" /> POPIA Compliant
          </h3>
          <p className="text-green-800">
            QuickBudget SA is fully compliant with the Protection of Personal Information
            Act (POPIA) of South Africa. We are committed to protecting your personal
            information and your right to privacy.
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8 prose prose-blue max-w-none">
          <p className="text-gray-700 leading-relaxed mb-6">
            This Privacy Policy describes how Active Wave Group (Pty) Ltd ("we", "us",
            or "our") collects, uses, and protects your information when you use
            our QuickBudget SA application (the "Service").
          </p>

          <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-200 pb-3 mb-4 mt-8">
            Information We Collect
          </h2>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
            Account Information
          </h3>
          <p className="text-gray-700 leading-relaxed mb-3">
            When you create an account, we collect:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mb-6">
            <li>Email address</li>
            <li>Name (optional)</li>
            <li>Password (encrypted)</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
            Budget Information
          </h3>
          <p className="text-gray-700 leading-relaxed mb-3">
            To provide our budgeting service, we collect:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mb-6">
            <li>Income amounts and sources you enter</li>
            <li>Expense categories and amounts you enter</li>
            <li>Budget goals and preferences</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mb-6">
            <strong>Important:</strong> All budget data is entered manually by you.
            We do not automatically access your bank accounts or financial institutions.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
            Usage Data
          </h3>
          <p className="text-gray-700 leading-relaxed mb-6">
            We automatically collect certain information when you use the Service,
            including your device type, browser type, IP address, and how you interact
            with the app. This helps us improve the Service.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-200 pb-3 mb-4 mt-8">
            How We Use Your Information
          </h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            We use the information we collect to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-6">
            <li>Provide, maintain, and improve the Service</li>
            <li>Calculate your budget insights and 50/30/20 analysis</li>
            <li>Send you important updates about the Service</li>
            <li>Respond to your questions and support requests</li>
            <li>Protect against fraud and unauthorized access</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-200 pb-3 mb-4 mt-8">
            Data Storage and Security
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            Your data is stored securely using industry-standard encryption (256-bit).
            We use Amazon Web Services (AWS) with servers located in South Africa
            to ensure your data remains within the country where possible.
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">
            We implement appropriate technical and organizational measures to protect
            your personal information against unauthorized access, alteration,
            disclosure, or destruction.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-200 pb-3 mb-4 mt-8">
            Data Sharing
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            <strong>We do not sell your personal information.</strong> We only share
            your information in the following limited circumstances:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-6">
            <li>With your explicit consent</li>
            <li>To comply with legal obligations or valid legal requests</li>
            <li>With service providers who help us operate the Service (under strict confidentiality agreements)</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-200 pb-3 mb-4 mt-8">
            Your Rights Under POPIA
          </h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            Under the Protection of Personal Information Act, you have the right to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-6">
            <li><strong>Access:</strong> Request a copy of your personal information</li>
            <li><strong>Correction:</strong> Request correction of inaccurate information</li>
            <li><strong>Deletion:</strong> Request deletion of your personal information</li>
            <li><strong>Object:</strong> Object to the processing of your information</li>
            <li><strong>Withdraw consent:</strong> Withdraw previously given consent</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mb-6">
            To exercise any of these rights, please contact us using the details below
            or use the account deletion feature in your Profile settings.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-200 pb-3 mb-4 mt-8">
            Data Retention
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            We retain your personal information only for as long as necessary to
            provide the Service and fulfill the purposes described in this policy.
            When you delete your account, we will delete your personal information
            within 30 days, except where we are required by law to retain it.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-200 pb-3 mb-4 mt-8">
            Children's Privacy
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            Our Service is not intended for children under 18 years of age. We do
            not knowingly collect personal information from children. If you are a
            parent or guardian and believe your child has provided us with personal
            information, please contact us.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-200 pb-3 mb-4 mt-8">
            Cookies and Tracking
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            We use essential cookies to keep you logged in and remember your preferences.
            We do not use third-party advertising cookies or tracking pixels.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-200 pb-3 mb-4 mt-8">
            Changes to This Policy
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            We may update this Privacy Policy from time to time. We will notify you
            of any changes by posting the new Privacy Policy on this page and updating
            the "Last updated" date. We encourage you to review this Privacy Policy
            periodically.
          </p>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Active Wave Group (Pty) Ltd
          </h2>
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            Contact Us
          </h3>
          <p className="text-gray-700 mb-4">
            If you have any questions about this Privacy Policy or wish to exercise
            your rights, you can contact us:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-600 text-sm">Email:</p>
                <a
                  href="mailto:support@quickbudget.co.za"
                  className="text-primary hover:underline font-medium"
                >
                  support@quickbudget.co.za
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-600 text-sm">Location:</p>
                <p className="text-gray-900 font-medium">
                  Cape Town, South Africa
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Top Button */}
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Back to Top
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400 text-sm">
            &copy; 2025 Active Wave Group (Pty) Ltd. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
