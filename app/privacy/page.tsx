import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | Kortex Klassroom',
  description: 'Privacy Policy for Kortex Klassroom - Foundational Literacy and Numeracy (FLN) platform.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Navigation / Back Link */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Kortex Klassroom
          </Link>
          <Link
            href="/terms"
            className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-wider"
          >
            Terms of Service →
          </Link>
        </div>

        {/* Document Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-12 text-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Privacy Policy for Kortex Klassroom
            </h1>
          </div>
          <p className="text-sm font-semibold text-slate-500 pb-6 mb-8 border-b border-slate-200">
            Effective Date: October 17, 2026
          </p>

          <div className="space-y-8 text-slate-700 leading-relaxed">
            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-2">1. Introduction</h2>
              <p>
                Welcome to Kortex Klassroom (<strong>&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;</strong>). We are deeply
                committed to protecting the privacy and personal data of all users, including school
                administrators, teachers, parents, and specifically the young learners utilizing our
                Foundational Literacy and Numeracy (FLN) platform. This Privacy Policy outlines our
                rigorous standards for collecting, processing, storing, and safeguarding personal data
                in compliance with applicable data protection laws, including the Indian Digital
                Personal Data Protection Act, 2023 (DPDP Act) and the Information Technology Act, 2000.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-2">2. Information We Collect</h2>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>
                  <strong className="font-semibold text-slate-900">Account &amp; Profile Information:</strong>{' '}
                  When an educational organization, educator, or parent signs up, we collect verified
                  contact information (such as full name, email address, phone number, and location details
                  including City, State, and Country) via Firebase Authentication and Google OAuth.
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">Student &amp; Classroom Data:</strong> We
                  process student roster details (student name, internal student ID, roll number, grade,
                  and section) solely as provisioned by the student&apos;s authorized school or parent. We
                  record learning progress, chapter completions, and assessment metrics strictly for
                  pedagogical progression.
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">Assessment Media &amp; Worksheets:</strong>{' '}
                  When using our Multimodal Visual Assessment features, teachers or parents may submit
                  photographs of handwritten student worksheets or notebooks. These images are securely
                  processed to deliver immediate diagnostic feedback and formative learning insights.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-2">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>
                  To deliver, maintain, and personalize the Kortex Klassroom interactive curriculum,
                  gamified maps, conceptualisers, and animated phonics modules.
                </li>
                <li>
                  To generate classroom mastery overviews, diagnostic progress reports, and formative
                  recommendations for teachers and parents using our secure assessment engines.
                </li>
                <li>
                  To enforce strict Role-Based Access Control (RBAC), guaranteeing that student
                  learning data is accessible exclusively to authorized school personnel and verified
                  parents.
                </li>
                <li>
                  To ensure account security, authenticate logins, detect unauthorized access, and
                  prevent platform abuse.
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-2">4. Children&apos;s Privacy &amp; Parental Consent</h2>
              <p>
                Kortex Klassroom is specially designed for early childhood foundational learning. We do
                not knowingly collect personal information directly from children under the age of 18
                without verifiable parental or school authorization. Student profiles are established
                exclusively through institutional provisioning or verified parent linking. We maintain a
                strict commitment to student safety:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>We never display third-party advertisements to students.</li>
                <li>We never profile children for behavioral advertising or commercial marketing.</li>
                <li>We do not sell, rent, or lease student information to third-party data brokers.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-2">5. Cookies, Local Storage &amp; Telemetry</h2>
              <p>
                To provide seamless and secure platform functionality, we utilize limited technical
                storage mechanisms:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>
                  <strong className="font-semibold text-slate-900">Essential Local Storage:</strong> We
                  store session tokens and user preference states in the browser&apos;s local storage to
                  manage single-device session integrity and prevent concurrent unauthorized logins.
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">Security Verification:</strong> We
                  employ Firebase App Check and Google reCAPTCHA Enterprise to detect automated abuse
                  and safeguard our APIs.
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">Aggregated Analytics:</strong> We use
                  Google Analytics to gather anonymous, aggregated usage statistics (such as page load
                  latencies and error frequencies) to continuously optimize platform reliability. No
                  student assessment artifacts or identifying student records are sent to Google
                  Analytics.
                </li>
              </ul>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-2">6. Infrastructure, Third-Party Processors &amp; AI</h2>
              <p>
                Your data is securely hosted on Google Cloud Platform and Firebase infrastructure
                featuring enterprise-grade encryption in transit (HTTPS/TLS) and at rest (AES-256).
                When visual assessments are evaluated by our AI engines (such as Google Gemini APIs),
                inputs are processed via secure enterprise API endpoints and are not utilized to train
                public consumer AI foundation models.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                7. Data Retention, Soft-Delete &amp; Erasure Rights
              </h2>
              <p>
                When a student profile or account is removed by an organization or parent, our platform
                implements a <strong>soft-delete (tombstoning)</strong> procedure. This immediately
                revokes access and unbinds the record from active rosters while preserving historical
                academic continuity for the school. Parents and educational institutions retain the
                right to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Request a comprehensive export of all stored student learning records.</li>
                <li>Request immediate and permanent cryptographic deletion (hard delete) of personal data.</li>
                <li>Revoke consent for institutional data sharing at any time.</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                8. Grievance Officer &amp; Contact Information
              </h2>
              <p>
                In accordance with the Information Technology Act, 2000 and the Digital Personal Data
                Protection Act, 2023, if you have any questions, feedback, or grievance regarding this
                Privacy Policy or data handling practices, please contact our designated Grievance
                Officer:
              </p>
              <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-sm space-y-1">
                <p>
                  <strong className="font-semibold text-slate-900">Platform Administration / Grievance Officer</strong>
                </p>
                <p>Kortex Klassroom, New Delhi, India</p>
                <p>
                  Email:{' '}
                  <a
                    href="mailto:kortexklassroom@gmail.com"
                    className="font-semibold text-indigo-600 underline hover:text-indigo-700"
                  >
                    kortexklassroom@gmail.com
                  </a>
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  We acknowledge all formal privacy inquiries within 48 hours and resolve verified
                  requests within 30 days.
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Kortex Klassroom. All rights reserved.
        </div>
      </div>
    </div>
  );
}
