
interface PrivacyPageProps {
  onNavigateBack: () => void
}

const sections = [
  {
    num: '1',
    title: 'Introduction',
    content: `Astro Sutra ("Astro Sutra," "we," "us," or "our") provides an AI-powered Vedic astrology platform, including birth chart (Kundli) generation, personalized readings, interactive AI chat, and related features (the "Service"). This Privacy Policy explains what information we collect, how we use it, how we protect it, and the choices you have.

By creating an account or using the Service, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with this policy, please do not use the Service.

This policy applies to all users of Astro Sutra, including users accessing the Service from India and other countries.`,
  },
  {
    num: '2',
    title: 'Information We Collect',
    subsections: [
      {
        sub: '2.1',
        title: 'Account Information',
        content: `When you sign in (including via Google Sign-In), we collect:\n• Your name and email address\n• A unique account identifier\n• Profile picture (if provided by your authentication provider)`,
      },
      {
        sub: '2.2',
        title: 'Birth and Astrological Data',
        content: `To generate your birth chart and personalized readings, we collect:\n• Full name\n• Date of birth, time of birth, and place of birth (including latitude/longitude and timezone)\n• Gender\n• Relationship label (e.g., Self, Spouse, Child, Friend) for each profile you create\n• Specific questions or categories of interest you submit (e.g., career, health, relationships)\n\nWe recognize that birth data can be sensitive. We collect only what is necessary to calculate your astrological chart and provide readings, and we do not use this data to make inferences about protected categories such as race, religion, health conditions, or sexual orientation.`,
      },
      {
        sub: '2.3',
        title: 'Multiple Profiles',
        content: `Astro Sutra allows you to create and manage profiles for family members or others (e.g., a spouse or child) for compatibility and family-chart features. By creating a profile for another person, you represent that you have their permission (or, for a minor, are their parent or legal guardian) to submit their birth information on their behalf.`,
      },
      {
        sub: '2.4',
        title: 'Conversation and Usage Data',
        content: `When you use our AI chat features, we collect:\n• Messages you send and the AI-generated responses\n• Which sections/tabs of the app you use (e.g., career, health, marriage, remedies)\n• Session identifiers and timestamps\n• Device type, browser type, IP address, and general location (city/country level)`,
      },
      {
        sub: '2.5',
        title: 'Payment, Subscription Information, and No Refunds',
        content: `If you purchase a subscription or premium tier, payment processing is handled by our third-party payment processor. We do not store your full credit card, debit card, or bank account numbers on our servers. We retain records of your subscription tier, billing history, and transaction status for accounting and support purposes.\n\nPlease note that as detailed in our Terms & Conditions, all payments made to Astro Sutra are final and strictly non-refundable under any circumstances. Cancellation of a subscription stops future billing, but no prorated or partial refunds will be provided for past or current billing cycles.`,
      },
      {
        sub: '2.6',
        title: 'Cookies and Similar Technologies',
        content: `We use cookies and similar technologies to keep you signed in, remember your preferences, and understand how the Service is used. You can control cookies through your browser settings, though disabling them may affect Service functionality.`,
      },
    ],
  },
  {
    num: '3',
    title: 'How We Use Your Information',
    content: `We use the information we collect to:\n• Calculate and generate your Vedic birth chart, Dasha timeline, and related astrological data\n• Provide AI-generated readings and respond to your follow-up questions\n• Maintain and manage your account and saved profiles\n• Process payments and manage your subscription\n• Improve, troubleshoot, and secure the Service\n• Communicate with you about your account, updates, or support requests\n• Comply with legal obligations\n\nWe do not sell your personal data or birth details to third parties for advertising purposes.`,
  },
  {
    num: '4',
    title: 'How We Share Your Information',
    content: `We share information only in the following circumstances:\n\nService Providers — We share data with vetted third parties who help us operate the Service, including cloud hosting and database providers, authentication providers (e.g., Google/Firebase), AI/language model providers, and payment processors. These providers are contractually obligated to use your data only to provide services to us.\n\nLegal Requirements — We may disclose information if required by law, regulation, legal process, or governmental request.\n\nBusiness Transfers — If Astro Sutra is involved in a merger, acquisition, or sale of assets, your information may be transferred. We will notify you of any such change.\n\nWith Your Consent — We may share information for other purposes with your explicit consent.`,
  },
  {
    num: '5',
    title: 'Data Retention',
    content: `We retain your account, profile, and birth chart data for as long as your account is active or as needed to provide the Service. If you delete a profile or your account, we will delete or anonymize the associated data within a reasonable period, except where we are required to retain it for legal, tax, or regulatory purposes.`,
  },
  {
    num: '6',
    title: 'Your Rights and Choices',
    content: `Depending on your location, you may have the right to:\n• Access the personal data we hold about you\n• Correct inaccurate or incomplete data\n• Delete your account and associated data\n• Export your data in a portable format\n• Object to or restrict certain processing\n• Withdraw consent at any time, where processing is based on consent\n\nResidents of the European Economic Area, UK, and Switzerland have rights under GDPR. Residents of India have rights under the Digital Personal Data Protection Act (DPDPA), 2023. Residents of California and other US states may have additional rights under applicable state privacy laws (e.g., CCPA/CPRA).\n\nTo exercise any of these rights, contact us at contact@issdelhi.org.`,
  },
  {
    num: '7',
    title: 'Data Security',
    content: `We implement industry-standard technical and organizational measures to protect your information, including encryption in transit, access controls, and secure cloud infrastructure. However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.`,
  },
  {
    num: '8',
    title: 'International Data Transfers',
    content: `Astro Sutra serves users globally, including the Indian diaspora (NRI users). Your information may be transferred to, stored, and processed in countries other than your country of residence, including India and the country where our hosting and AI service providers operate. Where required, we rely on appropriate safeguards (such as standard contractual clauses) for such transfers.`,
  },
  {
    num: '9',
    title: "Children's Privacy",
    content: `The Service is not directed at children under 18. We do not knowingly collect account information directly from children. Birth data for a minor may only be submitted by a parent or legal guardian. If we learn that a child has created their own account without parental consent, we will take steps to delete it.`,
  },
  {
    num: '10',
    title: 'Third-Party Links',
    content: `The Service may include links to third-party resources. We are not responsible for the privacy practices of these third-party sites and encourage you to review their privacy policies before providing any information.`,
  },
  {
    num: '11',
    title: 'Astrology Disclaimer',
    content: `Astro Sutra provides astrological information and AI-generated interpretations for entertainment, self-reflection, and informational purposes. Our readings are not a substitute for professional medical, legal, financial, or psychological advice, and should not be relied upon as such.`,
  },
  {
    num: '12',
    title: 'Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. If we make material changes, we will notify you via the app or by email, and update the "Last Updated" date above. Your continued use of the Service after changes take effect constitutes acceptance of the revised policy.`,
  },
  {
    num: '13',
    title: 'Contact Us',
    content: `If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us at:\n\nEmail: contact@issdelhi.org\nAlternate: jyotishasutraai@gmail.com\nAddress: 386, Sant Nagar, New Delhi – 110065`,
  },
]

export default function PrivacyPage({ onNavigateBack }: PrivacyPageProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">

      {/* ── Page header ── */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-primary-fixed/60 border border-outline-variant rounded-full px-4 py-1.5 mb-6">
          <span className="material-symbols-outlined text-primary text-sm">shield</span>
          <span className="text-xs font-semibold tracking-[0.15em] uppercase text-primary">Privacy Policy</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-primary italic tracking-tight mb-4">
          Your Privacy Matters
        </h1>
        <p className="text-on-surface-variant text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Astro Sutra &nbsp;·&nbsp; Last Updated: <strong>July 27, 2026</strong>
        </p>
      </div>

      {/* ── Intro callout ── */}
      <div className="bg-primary-fixed/50 border border-outline-variant rounded-2xl p-5 sm:p-7 mb-10 flex gap-4 items-start">
        <span className="material-symbols-outlined text-primary text-2xl shrink-0 mt-0.5">info</span>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          We built Astro Sutra to be a trusted companion for your spiritual journey. This policy explains
          exactly what data we collect, why we collect it, and how you can control it. We never sell your
          personal or birth data to advertisers.
        </p>
      </div>

      {/* ── Sections ── */}
      <div className="space-y-8">
        {sections.map((sec) => (
          <div
            key={sec.num}
            className="bg-white/70 border border-outline-variant/70 rounded-2xl overflow-hidden"
          >
            {/* Section header */}
            <div className="flex items-center gap-3 px-6 py-4 bg-primary-fixed/40 border-b border-outline-variant/60">
              <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
                {sec.num}
              </span>
              <h2 className="font-semibold text-primary text-base sm:text-lg">{sec.title}</h2>
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
                  <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
                    {sec.content}
                  </p>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom nav ── */}
      <div className="mt-14 pt-8 border-t border-outline-variant text-center">
        <p className="text-xs text-on-surface-variant mb-5 italic">
          This policy was last reviewed on July 27, 2026. Please consult a qualified lawyer before
          relying on it for specific legal compliance requirements in your jurisdiction.
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
