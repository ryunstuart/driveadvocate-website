'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

const LAST_UPDATED = 'June 24, 2026';
const COMPANY = 'DriveAdvocate';
const EMAIL = 'info@driveadvocate.com';

export default function TermsOfService() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header variant="public" />

      <div className="max-w-3xl mx-auto px-6 py-12 flex-1 w-full">

        {/* Page header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-3">Terms of Service</h1>
          <p className="text-slate-500 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="bg-white rounded-3xl shadow p-8 md:p-12 space-y-8 text-slate-700 leading-relaxed">

          {/* Intro */}
          <section>
            <p>
              These Terms of Service ("Terms") govern your use of the {COMPANY} platform and services ("Service"). By accessing or using our Service, you agree to be bound by these Terms. Please read them carefully before proceeding.
            </p>
            <p className="mt-4">
              {COMPANY} is a car buying advocacy service. We act as your representative in negotiations with automobile dealerships. We do not sell vehicles, hold dealer licenses, or guarantee any specific outcome.
            </p>
          </section>

          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">1. Services Provided</h2>
            <p>
              {COMPANY} offers the following service tiers:
            </p>
            <ul className="mt-3 space-y-2">
              <li className="flex gap-3"><span className="text-emerald-600 font-bold shrink-0">•</span><span><strong>Research Package ($149):</strong> Market analysis, pricing intelligence, and inventory identification. Delivered as a written report.</span></li>
              <li className="flex gap-3"><span className="text-emerald-600 font-bold shrink-0">•</span><span><strong>Negotiation Service ($999):</strong> Active negotiation with dealerships on your behalf to secure a locked out-the-door price.</span></li>
              <li className="flex gap-3"><span className="text-emerald-600 font-bold shrink-0">•</span><span><strong>Full Concierge ($2,250):</strong> End-to-end vehicle sourcing, negotiation, trade-in assistance, and delivery coordination.</span></li>
            </ul>
            <p className="mt-4">
              The specific scope of each service tier is described on our pricing page. Additional services beyond the scope of your selected tier may be subject to additional fees, agreed upon in writing before work begins.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">2. No Guarantee of Outcome</h2>
            <p>
              {COMPANY} provides professional advocacy and negotiation services. We do not guarantee any specific savings amount, price, availability, or outcome. Results vary based on market conditions, vehicle availability, dealership participation, and other factors outside our control.
            </p>
            <p className="mt-4">
              Any savings estimates or examples shared during our consultation or on our website are illustrative only and do not constitute a promise or guarantee of similar results for your transaction.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">3. Your Responsibilities</h2>
            <p>By using our Service, you agree to:</p>
            <ul className="mt-3 space-y-2">
              <li className="flex gap-3"><span className="text-emerald-600 font-bold shrink-0">•</span><span>Provide accurate and complete information about your vehicle preferences, budget, and location.</span></li>
              <li className="flex gap-3"><span className="text-emerald-600 font-bold shrink-0">•</span><span>Respond to communications from your advocate in a timely manner.</span></li>
              <li className="flex gap-3"><span className="text-emerald-600 font-bold shrink-0">•</span><span>Make final purchase decisions independently. {COMPANY} advises and negotiates — the final decision is always yours.</span></li>
              <li className="flex gap-3"><span className="text-emerald-600 font-bold shrink-0">•</span><span>Not use our platform for any unlawful purpose or in any way that could damage, disable, or impair the Service.</span></li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">4. Payment Terms</h2>
            <p>
              Payment is due at the time of service selection unless otherwise agreed in writing. All fees are in US dollars. Service fees are non-refundable once work has commenced, except as described in our refund policy below.
            </p>
            <p className="mt-4">
              <strong>Refund Policy:</strong> If you cancel before your advocate has begun active outreach to dealerships, you are entitled to a full refund. Once active negotiation has begun, no refunds will be issued. If {COMPANY} is unable to identify any suitable vehicle or dealership within your stated parameters after reasonable effort, we will issue a partial refund at our discretion.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">5. Privacy and Data</h2>
            <p>
              We collect personal information necessary to provide our services, including your name, contact information, vehicle preferences, and location data. We use this information solely to facilitate your car buying advocacy and will not sell or share it with third parties except as necessary to perform our services (e.g., communicating with dealerships on your behalf).
            </p>
            <p className="mt-4">
              By using the Service, you consent to our collection and use of your information as described above. We implement reasonable security measures to protect your data.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">6. Relationship with Dealerships</h2>
            <p>
              {COMPANY} is an independent third-party advocate. We have no financial relationship with, ownership interest in, or contractual obligation to any automobile dealership. We are compensated solely by our clients.
            </p>
            <p className="mt-4">
              Dealerships are independent businesses and are not obligated to negotiate with or through {COMPANY}. We cannot compel any dealership to honor a particular price or offer.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, {COMPANY} shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or goodwill, arising out of or in connection with your use of the Service.
            </p>
            <p className="mt-4">
              Our total liability to you for any claims arising from or related to these Terms or the Service shall not exceed the amount you paid us in the three months preceding the claim.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">8. Modifications to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. When we make changes, we will update the "Last updated" date at the top of this page. Your continued use of the Service after changes are posted constitutes your acceptance of the revised Terms.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">9. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the State of Missouri, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be resolved in the courts of St. Charles County, Missouri.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">10. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="mt-4 bg-slate-50 rounded-2xl p-5">
              <div className="font-semibold text-slate-800">{COMPANY}</div>
              <a href={`mailto:${EMAIL}`} className="text-emerald-600 hover:underline text-sm">{EMAIL}</a>
            </div>
          </section>

        </div>

      </div>
      <Footer />
    </div>
  );
}
