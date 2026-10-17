import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | Kortex Klassroom',
  description: 'Terms of Service for Kortex Klassroom - Foundational Literacy and Numeracy (FLN) platform.',
};

export default function TermsOfServicePage() {
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
            href="/privacy"
            className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-wider"
          >
            Privacy Policy →
          </Link>
        </div>

        {/* Document Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-12 text-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <FileText className="w-6 h-6" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Terms of Service for Kortex Klassroom
            </h1>
          </div>
          <p className="text-sm font-semibold text-slate-500 pb-6 mb-8 border-b border-slate-200">
            Effective Date: October 17, 2026
          </p>

          <div className="space-y-8 text-slate-700 leading-relaxed">
            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-2">1. Acceptance of Terms</h2>
              <p>
                By accessing, browsing, or using the Kortex Klassroom web platform (
                <strong>kortexklassroom.com</strong>), you acknowledge that you have read, understood, and
                agree to be bound by these Terms of Service. If you are accepting these terms on behalf
                of an educational institution, school, or organization, you represent and warrant that
                you possess the legal authority to bind that entity to these provisions.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                2. User Accounts, Eligibility &amp; Single-Device Policy
              </h2>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>
                  <strong className="font-semibold text-slate-900">Multi-Tenant Roles:</strong> The
                  platform provides distinct access levels: Platform Admin, Organization/School Admin,
                  Teacher, Parent, and Student. Users must maintain accurate account information and
                  protect their login credentials.
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">Student Supervision:</strong> Minors
                  and young learners may access Kortex Klassroom solely under the supervision of a
                  verified educational institution or parent/guardian who has authorized their profile.
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">Single-Device Session Concurrency:</strong>{' '}
                  To ensure account security and protect student records, user sessions are subject to
                  single-device enforcement. Concurrently logging in from a new device or browser will
                  automatically invalidate previous active sessions.
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">Prohibited Conduct:</strong> Users
                  agree not to attempt unauthorized access to other classrooms, reverse-engineer or
                  decompile platform assets, scrape learning data, or submit malicious payloads to our AI
                  and Firestore APIs.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-2">3. Intellectual Property Rights</h2>
              <p>
                All materials, proprietary software, design systems, HTML5 Canvas interactive maps, 3D
                animated video modules, Hindi and English phonics audio assets, conceptualiser learning
                tools, and pedagogical curriculum frameworks available on Kortex Klassroom are the
                exclusive intellectual property of Kortex Klassroom. Users are granted a limited,
                revocable, non-exclusive, non-transferable license to access and use the platform solely
                for non-commercial educational purposes. Reproducing, republishing, distributing, or
                creating derivative works without prior written authorization is strictly prohibited.
              </p>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                4. AI-Assisted Assessments &amp; Educational Disclaimer
              </h2>
              <p>
                Kortex Klassroom incorporates artificial intelligence and computer vision to analyze
                worksheet submissions, evaluate phonics accuracy, and compute mastery scores. While these
                models provide advanced pedagogical diagnostics:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>
                  Automated feedback serves as a formative diagnostic aid and does not constitute formal
                  psychological, clinical, or statutory academic certification.
                </li>
                <li>
                  The evaluating educator or parent retains ultimate responsibility for reviewing
                  student work, assigning official grades, and guiding instructional decisions.
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-2">5. Service Availability &amp; Modifications</h2>
              <p>
                We strive for continuous, uninterrupted platform uptime. However, we do not warrant
                that the service will be entirely error-free or uninterrupted due to periodic maintenance,
                telecommunication outages, or cloud infrastructure updates. We reserve the right to
                enhance, update, or modify curriculum tools to reflect evolving educational benchmarks,
                providing reasonable advance notification for major structural modifications.
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-2">6. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by applicable Indian law, Kortex Klassroom, its directors,
                and affiliates shall not be liable for any indirect, punitive, incidental, special, or
                consequential damages resulting from the use or inability to use the platform, including
                data transmission delays, temporary service interruptions, or reliance on automated AI
                diagnostic feedback.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                7. Governing Law &amp; Dispute Resolution
              </h2>
              <p>
                These Terms of Service shall be governed by, interpreted, and construed in accordance
                with the laws of the Republic of India. Any legal dispute, action, or proceeding arising
                out of or in connection with these terms shall be subject to the exclusive jurisdiction of
                the competent courts situated in <strong>New Delhi, India</strong>.
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-2">8. Contact &amp; Legal Notices</h2>
              <p>
                For any formal legal notices, questions regarding these Terms of Service, or licensing
                inquiries, please contact our administration at:
              </p>
              <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-sm space-y-1">
                <p>
                  <strong className="font-semibold text-slate-900">Kortex Klassroom Legal Administration</strong>
                </p>
                <p>New Delhi, India</p>
                <p>
                  Email:{' '}
                  <a
                    href="mailto:kortexklassroom@gmail.com"
                    className="font-semibold text-indigo-600 underline hover:text-indigo-700"
                  >
                    kortexklassroom@gmail.com
                  </a>
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
