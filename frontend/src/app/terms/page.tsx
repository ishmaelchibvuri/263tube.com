"use client";

import Link from "next/link";
import { ChevronLeft, FileText, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfServicePage() {
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
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Terms of Service
          </h1>
          <p className="text-lg text-gray-600">
            <strong>Last updated:</strong> January 2025
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8 prose prose-blue max-w-none">
          <p className="text-gray-700 leading-relaxed mb-6">
            Please read these Terms of Service ("Terms") carefully before using
            the QuickBudget SA application (the "Service") operated by Active Wave
            Group (Pty) Ltd ("us", "we", or "our").
          </p>

          <p className="text-gray-700 leading-relaxed mb-6">
            Your access to and use of the Service is conditioned on your
            acceptance of and compliance with these Terms. These Terms apply to
            all visitors, users and others who access or use the Service.
          </p>

          <p className="text-gray-700 leading-relaxed mb-6 font-semibold">
            By accessing or using the Service you agree to be bound by these
            Terms. If you disagree with any part of the terms then you may not
            access the Service.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-200 pb-3 mb-4 mt-8">
            1. Description of Service
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            QuickBudget SA is a personal budgeting tool designed to help users manage
            their finances using the 50/30/20 budgeting rule. The Service allows
            users to track income, categorize expenses, and receive insights about
            their spending habits.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-200 pb-3 mb-4 mt-8">
            2. Accounts
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            When you create an account with us, you must provide information
            that is accurate, complete, and current at all times. Failure to do
            so constitutes a breach of the Terms, which may result in immediate
            termination of your account on our Service.
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">
            You are responsible for safeguarding the password that you use to
            access the Service and for any activities or actions under your
            password. You agree not to disclose your password to any third party.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-200 pb-3 mb-4 mt-8">
            3. Not Financial Advice
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            QuickBudget SA is a budgeting tool, <strong>not a financial advisor</strong>.
            The calculations, insights, and suggestions provided are for informational
            purposes only. We do not provide financial advice as defined by the
            Financial Advisory and Intermediary Services (FAIS) Act. If you require
            financial advice, please consult a registered Financial Services Provider.
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">
            The 50/30/20 rule and other budgeting guidelines presented in the app
            are general recommendations and may not be suitable for everyone's
            individual financial circumstances.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-200 pb-3 mb-4 mt-8">
            4. User Responsibilities
          </h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            You agree to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-6">
            <li>Provide accurate financial information when using the Service</li>
            <li>Keep your account credentials secure and confidential</li>
            <li>Use the Service only for personal, non-commercial budgeting purposes</li>
            <li>Not attempt to access other users' accounts or data</li>
            <li>Not use the Service for any unlawful purpose</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-200 pb-3 mb-4 mt-8">
            5. Intellectual Property
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            The Service and its original content, features and functionality are
            and will remain the exclusive property of QuickBudget SA and its licensors.
            The Service is protected by copyright, trademark, and other laws of
            South Africa and foreign countries.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-200 pb-3 mb-4 mt-8">
            6. Termination
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            We may terminate or suspend your account immediately, without prior
            notice or liability, for any reason whatsoever, including without
            limitation if you breach the Terms. Upon termination, your right to
            use the Service will immediately cease.
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">
            If you wish to terminate your account, you may do so through the
            Profile settings or by contacting us.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-200 pb-3 mb-4 mt-8">
            7. Limitation of Liability
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            In no event shall Active Wave Group (Pty) Ltd, nor its directors, employees,
            partners, agents, suppliers, or affiliates, be liable for any indirect, incidental,
            special, consequential or punitive damages, including without limitation,
            loss of profits, data, use, goodwill, or other intangible losses,
            resulting from your use of the Service.
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">
            We are not responsible for any financial decisions you make based on
            information provided by the Service.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-200 pb-3 mb-4 mt-8">
            8. Disclaimer
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            Your use of the Service is at your sole risk. The Service is provided
            on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without
            warranties of any kind, whether express or implied, including, but not
            limited to, implied warranties of merchantability, fitness for a
            particular purpose, non-infringement or course of performance.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-200 pb-3 mb-4 mt-8">
            9. Governing Law
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            These Terms shall be governed and construed in accordance with the
            laws of South Africa, without regard to its conflict of law provisions.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-200 pb-3 mb-4 mt-8">
            10. Changes to Terms
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            We reserve the right, at our sole discretion, to modify or replace
            these Terms at any time. If a revision is material, we will try to
            provide at least 30 days' notice prior to any new terms taking effect.
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">
            By continuing to access or use our Service after those revisions
            become effective, you agree to be bound by the revised terms.
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
            If you have any questions about these Terms of Service, you can
            contact us:
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
