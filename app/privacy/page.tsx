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
                Welcome to Kortex Klassroom (<strong>&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;</strong>). We are committed
                to protecting the privacy and personal data of all users, including school administrators,
                teachers, parents, and specifically the young learners utilizing our Foundational Literacy
                and Numeracy (FLN) platform. This Privacy Policy outlines our rigorous standards for
                collecting, processing, storing, and safeguarding personal data in compliance with the
                Indian Digital Personal Data Protection Act, 2023 (DPDP Act) and the Information
                Technology Act, 2000.
              </p>
            </section>

            {/* Section 2: NEW GOOGLE MANDATED SECTION */}
            <section className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
              <h2 className="text-xl font-bold text-indigo-950 mb-3">
                2. Google API Services &amp; User Data Policy
              </h2>
              <p className="mb-4 text-sm text-indigo-900/80">
                Kortex Klassroom uses Google OAuth 2.0 to securely authenticate users. Our use of
                information received from Google APIs strictly complies with the following practices:
              </p>
              <ul className="list-disc pl-6 space-y-3 mt-2 text-sm text-indigo-950">
                <li>
                  <strong className="font-bold">Access &amp; Collection:</strong> When you sign in using
                  Google, we request and access only your primary Google account email address, your name,
                  and your profile picture.
                </li>
                <li>
                  <strong className="font-bold">Use of Data:</strong> This specific Google user data is used
                  exclusively to create your Kortex Klassroom account, authenticate your login sessions,
                  and display your name/profile picture within your personalized educational dashboard.
                </li>
                <li>
                  <strong className="font-bold">Storage:</strong> Your authenticated email and profile data
                  are stored securely within our Google Cloud Platform and Firebase Authentication
                  infrastructure using industry-standard AES-256 encryption.
                </li>
                <li>
                  <strong className="font-bold">Sharing &amp; Disclosure:</strong>{' '}
                  <strong>
                    We do not share, sell, rent, or transfer your Google user data to any third-party data
                    brokers, advertising networks, or external marketing entities.
                  </strong>{' '}
                  Your data remains strictly within the Kortex Klassroom platform.
                </li>
                <li>
                  <strong className="font-bold">Limited Use Disclosure:</strong> Kortex Klassroom&apos;s use
                  and transfer to any other app of information received from Google APIs will adhere to the{' '}
                  <a
                    href="https://developers.google.com/terms/api-services-user-data-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-indigo-600 font-semibold hover:text-indigo-800"
                  >
                    Google API Services User Data Policy
                  </a>
                  , including the Limited Use requirements.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                3. Educational Data We Collect &amp; Use
              </h2>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>
                  <strong className="font-semibold text-slate-900">Student &amp; Classroom Data:</strong>{' '}
                  We process student roster details (name, internal ID, grade) solely as provisioned by an
                  authorized school or parent. We record learning progress and assessment metrics strictly
                  for pedagogical progression.
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">Assessment Media:</strong> Photographs
                  of student worksheets processed via our AI diagnostic tools are evaluated securely. These
                  images are not utilized to train public consumer AI foundation models.
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                4. Children&apos;s Privacy &amp; Parental Consent
              </h2>
              <p>
                Kortex Klassroom is specially designed for early childhood foundational learning. We do not
                knowingly collect personal information directly from children under the age of 18 without
                verifiable parental or school authorization. We maintain a strict commitment to student
                safety:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>We never display third-party advertisements to students.</li>
                <li>We never profile children for behavioral advertising or commercial marketing.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-2">5. Cookies &amp; Local Storage</h2>
              <p>
                We store essential session tokens in the browser&apos;s local storage to manage
                single-device session integrity and prevent concurrent unauthorized logins. We use Google
                Analytics to gather anonymous, aggregated usage statistics to optimize platform
                reliability.
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                6. Data Retention, Soft-Delete &amp; Erasure Rights
              </h2>
              <p>
                When a profile is removed by a school or parent, we implement a soft-delete (tombstoning)
                procedure, immediately revoking access while preserving historical academic continuity for
                the school. Parents and educational institutions retain the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Request a comprehensive export of all stored student learning records.</li>
                <li>
                  Request immediate and permanent cryptographic deletion (hard delete) of all personal
                  data, including data obtained via Google OAuth.
                </li>
                <li>Revoke consent for data sharing at any time.</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                7. Grievance Officer &amp; Contact Information
              </h2>
              <p>
                If you have any questions, wish to request data deletion, or have a grievance regarding this
                Privacy Policy, please contact our designated Grievance Officer:
              </p>
              <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-sm space-y-1">
                <p>
                  <strong className="font-semibold text-slate-900">
                    Platform Administration / Grievance Officer
                  </strong>
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
                  We resolve verified deletion and privacy requests within 30 days.
                </p>
              </div>
            </section>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Kortex Klassroom. All rights reserved.
        </div>
      </div>
    </div>
  );
}
