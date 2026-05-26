export function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-[var(--text)]">
      <div className="mb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--primary)]">Legal</span>
        <h1 className="mt-2 font-[var(--heading)] text-3xl font-bold text-[var(--text)]">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[var(--text-light)]">Last updated: 27 May 2026</p>
      </div>

      <div className="space-y-8 text-[15px] leading-relaxed text-[var(--text-mid)]">
        <section>
          <h2 className="mb-3 font-[var(--heading)] text-lg font-bold text-[var(--text)]">1. Overview</h2>
          <p>
            Collab ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains
            what information we collect when you use the Collab platform, how we use it, and your rights
            regarding your data. Collab operates in accordance with the Australian Privacy Act 1988 (Cth) and
            the Australian Privacy Principles (APPs).
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[var(--heading)] text-lg font-bold text-[var(--text)]">2. Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong className="text-[var(--text)]">Account information:</strong> your society name, university,
              email address, and password (stored securely via Supabase Auth)
            </li>
            <li>
              <strong className="text-[var(--text)]">Profile information:</strong> society description, type,
              logo image, and social media links you choose to provide
            </li>
            <li>
              <strong className="text-[var(--text)]">Listing data:</strong> collaboration listings you create,
              including title, description, tags, and event dates
            </li>
            <li>
              <strong className="text-[var(--text)]">Messages:</strong> direct messages sent between societies
              via our chat feature
            </li>
            <li>
              <strong className="text-[var(--text)]">Verification data:</strong> your society's trust score and
              registry match information used to verify your account
            </li>
            <li>
              <strong className="text-[var(--text)]">Usage data:</strong> basic analytics such as page visits,
              collected to improve the platform
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-[var(--heading)] text-lg font-bold text-[var(--text)]">3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Create and manage your account</li>
            <li>Verify your society against our university registry</li>
            <li>Display your society profile and listings to other verified societies</li>
            <li>Facilitate collaboration requests and messaging between societies</li>
            <li>Send transactional emails (e.g. verification status, password reset)</li>
            <li>Improve the platform's features and user experience</li>
          </ul>
          <p className="mt-3">
            We do not sell your personal information to third parties.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[var(--heading)] text-lg font-bold text-[var(--text)]">4. Information Visibility</h2>
          <p>
            Your society's profile (name, description, type, university, and social links) is visible to all
            other verified Collab users. Your registered email address is also visible to other users via the
            contact button on your public profile page — clicking it opens a mailto link directly to your
            address. If you do not wish your email to be publicly contactable, do not use a personal address
            when registering; use a shared society inbox instead. Direct messages sent through the Collab
            chat feature are only visible to the two parties involved in a conversation.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[var(--heading)] text-lg font-bold text-[var(--text)]">5. Data Storage & Security</h2>
          <p>
            Your data is stored securely on Supabase infrastructure hosted on AWS (Sydney region). We use
            industry-standard encryption in transit (TLS) and at rest. Access to production data is restricted
            to authorised personnel only.
          </p>
          <p className="mt-3">
            While we take reasonable precautions to protect your data, no system is completely secure.
            We encourage you to use a strong, unique password for your Collab account.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[var(--heading)] text-lg font-bold text-[var(--text)]">6. Cookies & Local Storage</h2>
          <p>
            Collab uses browser local storage to remember your session and onboarding preferences (such as
            whether you have completed the setup wizard). We do not use third-party tracking cookies or
            advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[var(--heading)] text-lg font-bold text-[var(--text)]">7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Access the personal information we hold about you</li>
            <li>Correct inaccurate or incomplete information via your profile settings</li>
            <li>Request deletion of your account and associated data from your profile settings</li>
            <li>Withdraw consent for data processing by deleting your account</li>
          </ul>
          <p className="mt-3">
            To exercise these rights or make a privacy inquiry, contact us at{' '}
            <a href="mailto:privacy@collabapp.au" className="text-[var(--primary)] hover:underline">
              privacy@collabapp.au
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[var(--heading)] text-lg font-bold text-[var(--text)]">8. Data Retention</h2>
          <p>
            We retain your account data for as long as your account is active. When you delete your account,
            we permanently remove your profile, listings, messages, and verification records within 30 days.
            Aggregate anonymised analytics data may be retained indefinitely.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[var(--heading)] text-lg font-bold text-[var(--text)]">9. Third-Party Services</h2>
          <p>Collab uses the following third-party services:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong className="text-[var(--text)]">Supabase</strong> — database, authentication, and file
              storage. Supabase's privacy policy applies to data processed on their infrastructure.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-[var(--heading)] text-lg font-bold text-[var(--text)]">10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify registered societies of
            material changes via email. Continued use of the Service after changes are posted constitutes
            acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[var(--heading)] text-lg font-bold text-[var(--text)]">11. Contact</h2>
          <p>
            Privacy questions or complaints:{' '}
            <a href="mailto:privacy@collabapp.au" className="text-[var(--primary)] hover:underline">
              privacy@collabapp.au
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
