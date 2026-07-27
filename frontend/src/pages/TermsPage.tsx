
interface TermsPageProps {
  onNavigateBack: () => void
}

const sections = [
  {
    num: '1',
    title: 'Agreement to Terms',
    content: `These Terms and Conditions ("Terms") form a legally binding agreement between you ("you" or "User") and Astro Sutra ("Astro Sutra," "we," "us," or "our") governing your access to and use of the Astro Sutra website, mobile application, and related services (collectively, the "Service").

By creating an account, accessing, or using the Service, you agree to be bound by these Terms and our Privacy Policy. If you do not agree, you must not access or use the Service.`,
  },
  {
    num: '2',
    title: 'Eligibility',
    content: `You must be at least 18 years old to create an account and use the Service. If you are under 18, you may use the Service only under the supervision of, and with an account created by, a parent or legal guardian who agrees to these Terms on your behalf. By creating a profile for a minor (e.g., a child's birth chart), you represent that you are their parent or legal guardian.`,
  },
  {
    num: '3',
    title: 'Description of Service',
    content: `Astro Sutra provides Vedic astrology-based birth chart (Kundli) generation, AI-powered interpretations, Dasha timelines, personality classifications, talent (64 Kala) analysis, remedies, and related features, delivered through automated calculations and artificial intelligence tools ("AI Features"). Certain features may be limited to paid subscription tiers as described in Section 6.`,
  },
  {
    num: '4',
    title: 'Account Registration',
    content: `To use certain features, you must create an account, which may be done via Google Sign-In or other supported authentication methods. You agree to:\n• Provide accurate and complete information, including accurate birth details for chart calculations\n• Keep your login credentials confidential\n• Notify us promptly of any unauthorized use of your account\n• Be responsible for all activity that occurs under your account\n\nWe are not liable for any loss or damage arising from your failure to safeguard your account credentials.`,
  },
  {
    num: '5',
    title: 'User Content and Profiles',
    content: `"User Content" includes birth details, questions, chat messages, and any other information you submit to the Service, including profiles you create for family members or others.\n\nBy submitting User Content, you represent that:\n• You have the right to submit it, and, for profiles created on behalf of another person, that you have their consent (or, for a minor, are their parent/legal guardian) to do so\n• The information is accurate to the best of your knowledge\n\nYou retain ownership of your User Content. By submitting it, you grant Astro Sutra a limited, non-exclusive license to use, process, and store it solely to provide and improve the Service.`,
  },
  {
    num: '6',
    title: 'Subscriptions, Billing, and Cancellation',
    subsections: [
      {
        sub: '6.1',
        title: 'Subscription Tiers',
        content: `Astro Sutra offers free and paid subscription tiers. Paid tiers may unlock additional features, such as extended chat access, additional profiles, or specialized readings (e.g., relationship or career analysis), as described on our Pricing page at the time of purchase.`,
      },
      {
        sub: '6.2',
        title: 'Billing',
        content: `Paid subscriptions are billed in advance on a recurring basis (monthly or annually, as selected) through our third-party payment processor. By subscribing, you authorize us (via our payment processor) to charge your chosen payment method on a recurring basis until you cancel.`,
      },
      {
        sub: '6.3',
        title: 'Auto-Renewal',
        content: `Subscriptions automatically renew at the end of each billing cycle unless cancelled before the renewal date. You are responsible for cancelling before renewal if you do not wish to continue.`,
      },
      {
        sub: '6.4',
        title: 'No Refund Policy',
        content: `ALL PAYMENTS MADE TO ASTRO SUTRA ARE FINAL AND NON-REFUNDABLE. Once a subscription or any other purchase is made, no refunds, credits, or exchanges will be issued under any circumstances, including but not limited to: dissatisfaction with the Service, partial use of a billing period, accidental purchases, or account termination.\n\nYou may cancel your subscription at any time through your account settings. Cancellation will take effect at the end of the current billing period, and you will continue to have access to paid features until then. However, no refund will be provided for the remaining period or any prior payments.\n\nBy subscribing or making any purchase, you acknowledge and agree to this strict no-refund policy. This policy applies to all payment methods, including payments made through the Astro Sutra website, Razorpay, or any other payment processor.`,
      },
      {
        sub: '6.5',
        title: 'Price Changes',
        content: `We may change subscription prices from time to time. We will provide reasonable advance notice of any price increase affecting your existing subscription, and such changes will take effect at your next renewal unless you cancel beforehand.`,
      },
    ],
  },
  {
    num: '7',
    title: 'Acceptable Use',
    content: `You agree not to:\n• Use the Service for any unlawful purpose or in violation of any applicable law\n• Submit false, misleading, or another person's birth data without appropriate authorization\n• Attempt to reverse-engineer, decompile, or extract the underlying models, source code, or algorithms of the Service\n• Use automated means (bots, scrapers) to access the Service without our prior written consent\n• Interfere with or disrupt the integrity or performance of the Service\n• Harass, abuse, or attempt to harm other users or Astro Sutra staff through the Service\n• Use the AI Features to generate content that is unlawful, defamatory, or infringes on third-party rights\n\nWe reserve the right to suspend or terminate accounts that violate this section.`,
  },
  {
    num: '8',
    title: 'Intellectual Property',
    content: `The Service, including its design, text, graphics, logos, software, AI models, and the specific compilation and presentation of astrological content (such as the 64 Kala analysis framework and Dasha Timeline visualizations), is owned by or licensed to Astro Sutra and is protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of the Service without our prior written permission.`,
  },
  {
    num: '9',
    title: 'Astrology Disclaimer and No Professional Advice',
    content: `Astro Sutra provides astrological interpretations, predictions, and AI-generated content for entertainment, spiritual guidance, and informational purposes only. Our content:\n• Is not a substitute for professional medical, legal, financial, psychological, or other professional advice\n• Should not be used as the sole basis for major life, health, financial, or legal decisions\n• Reflects traditional Vedic astrological methodology and AI-generated interpretation, not scientifically validated predictions\n\nYou are solely responsible for any decisions or actions you take based on content provided through the Service.`,
  },
  {
    num: '10',
    title: 'AI Features Disclaimer',
    content: `Our AI Features generate responses using third-party language models. While we strive for accuracy and relevance, AI-generated content may occasionally be incomplete, inaccurate, or unrepresentative of your specific circumstances. We do not guarantee the accuracy, completeness, or reliability of any AI-generated reading, interpretation, or response.`,
  },
  {
    num: '11',
    title: 'Disclaimer of Warranties',
    content: `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE, OR THAT ANY PREDICTIONS OR INTERPRETATIONS PROVIDED WILL BE ACCURATE.`,
    highlight: true,
  },
  {
    num: '12',
    title: 'Limitation of Liability',
    content: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, ASTRO SUTRA AND ITS OFFICERS, EMPLOYEES, AND SERVICE PROVIDERS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY FOR ANY CLAIM ARISING FROM THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.\n\nSome jurisdictions do not allow certain limitations of liability, so some of the above limitations may not apply to you.`,
    highlight: true,
  },
  {
    num: '13',
    title: 'Indemnification',
    content: `You agree to indemnify and hold harmless Astro Sutra, its affiliates, officers, and employees from any claims, damages, losses, or expenses (including reasonable legal fees) arising from your violation of these Terms, your misuse of the Service, or your violation of any third party's rights (including submitting another person's birth data without authorization).`,
  },
  {
    num: '14',
    title: 'Termination',
    content: `We may suspend or terminate your account and access to the Service, with or without notice, if we believe you have violated these Terms, misused the Service, or engaged in conduct harmful to Astro Sutra or other users. You may terminate your account at any time by contacting us or using the account deletion option in the app. Upon termination, your right to use the Service will immediately cease, though certain provisions of these Terms (including Sections 8–13) will survive termination.`,
  },
  {
    num: '15',
    title: 'Changes to the Service',
    content: `We may modify, suspend, or discontinue the Service (or any part of it), including specific features or tabs, at any time, with or without notice. We are not liable to you or any third party for any such modification, suspension, or discontinuation.`,
  },
  {
    num: '16',
    title: 'Changes to These Terms',
    content: `We may update these Terms from time to time. If we make material changes, we will notify you via the app or by email, and update the "Last Updated" date above. Your continued use of the Service after changes take effect constitutes acceptance of the revised Terms.`,
  },
  {
    num: '17',
    title: 'Governing Law and Dispute Resolution',
    content: `These Terms are governed by the laws of India, without regard to its conflict of law principles. Any disputes arising out of or relating to these Terms or the Service shall be subject to the exclusive jurisdiction of the courts located in New Delhi, India, unless otherwise required by applicable local consumer protection law in your jurisdiction.`,
  },
  {
    num: '18',
    title: 'Severability',
    content: `If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.`,
  },
  {
    num: '19',
    title: 'Entire Agreement',
    content: `These Terms, together with our Privacy Policy, constitute the entire agreement between you and Astro Sutra regarding the Service and supersede any prior agreements.`,
  },
  {
    num: '20',
    title: 'Contact Us',
    content: `If you have questions about these Terms, please contact us at:\n\nEmail: contact@issdelhi.org\nAlternate: astrosutraai@gmail.com\nAddress: 386, Sant Nagar, New Delhi – 110065`,
  },
]

export default function TermsPage({ onNavigateBack }: TermsPageProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">

      {/* ── Page header ── */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-primary-fixed/60 border border-outline-variant rounded-full px-4 py-1.5 mb-6">
          <span className="material-symbols-outlined text-primary text-sm">gavel</span>
          <span className="text-xs font-semibold tracking-[0.15em] uppercase text-primary">Terms &amp; Conditions</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-primary italic tracking-tight mb-4">
          Terms of Service
        </h1>
        <p className="text-on-surface-variant text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Astro Sutra &nbsp;·&nbsp; Last Updated: <strong>July 27, 2026</strong>
        </p>
      </div>

      {/* ── Intro callout ── */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 sm:p-7 mb-10 flex gap-4 items-start">
        <span className="material-symbols-outlined text-amber-600 text-2xl shrink-0 mt-0.5">warning</span>
        <p className="text-sm text-amber-900 leading-relaxed">
          Please read these Terms carefully before using the Service. By using Astro Sutra, you agree to
          be legally bound by these Terms. If you do not agree, please discontinue use of the Service.
        </p>
      </div>

      {/* ── Sections ── */}
      <div className="space-y-6">
        {sections.map((sec) => (
          <div
            key={sec.num}
            className={`border rounded-2xl overflow-hidden ${
              'highlight' in sec && sec.highlight
                ? 'bg-amber-50/60 border-amber-200'
                : 'bg-white/70 border-outline-variant/70'
            }`}
          >
            {/* Section header */}
            <div className={`flex items-center gap-3 px-6 py-4 border-b ${
              'highlight' in sec && sec.highlight
                ? 'bg-amber-100/70 border-amber-200'
                : 'bg-primary-fixed/40 border-outline-variant/60'
            }`}>
              <span className={`w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 ${
                'highlight' in sec && sec.highlight ? 'bg-amber-600' : 'bg-primary'
              }`}>
                {sec.num}
              </span>
              <h2 className={`font-semibold text-base sm:text-lg ${
                'highlight' in sec && sec.highlight ? 'text-amber-800' : 'text-primary'
              }`}>
                {sec.title}
              </h2>
            </div>

            <div className="px-6 py-5">
              {'subsections' in sec && sec.subsections ? (
                <div className="space-y-5">
                  {sec.subsections.map((sub) => (
                    <div key={sub.sub}>
                      <h3 className="text-sm font-bold text-on-background mb-1.5">
                        {sub.sub} &nbsp;{sub.title}
                      </h3>
                      <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
                        {sub.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                'content' in sec && (
                  <p className={`text-sm leading-relaxed whitespace-pre-line ${
                    'highlight' in sec && sec.highlight
                      ? 'text-amber-900 font-medium'
                      : 'text-on-surface-variant'
                  }`}>
                    {sec.content}
                  </p>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom note ── */}
      <div className="mt-14 pt-8 border-t border-outline-variant text-center">
        <p className="text-xs text-on-surface-variant mb-5 italic">
          This document was last reviewed on July 27, 2026. It is a general-purpose template and is not a
          substitute for legal advice. Please have it reviewed by a qualified lawyer before relying on it
          for specific compliance requirements.
        </p>
        <button
          onClick={onNavigateBack}
          className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-full text-sm font-semibold tracking-wider uppercase hover:bg-primary-container transition-all shadow-md cursor-pointer border-none"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Home
        </button>
      </div>
    </div>
  )
}
