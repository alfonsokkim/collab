export function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-[var(--text)]">
      <div className="mb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--primary)]">Legal</span>
        <h1 className="mt-2 font-[var(--heading)] text-3xl font-bold text-[var(--text)]">Terms of Service</h1>
        <p className="mt-2 text-sm text-[var(--text-light)]">Last updated: 27 May 2026</p>
      </div>

      <div className="space-y-8 text-[15px] leading-relaxed text-[var(--text-mid)]">
        <section>
          <h2 className="mb-3 font-[var(--heading)] text-lg font-bold text-[var(--text)]">1. About Collab</h2>
          <p>
            Collab is a platform that connects university student societies across NSW, enabling them to discover
            collaboration opportunities, share event calendars, and communicate directly. These Terms of Service
            ("Terms") govern your use of the Collab platform ("Service").
          </p>
          <p className="mt-3">
            By creating an account or using the Service, you agree to be bound by these Terms. If you do not
            agree, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[var(--heading)] text-lg font-bold text-[var(--text)]">2. Eligibility</h2>
          <p>
            Collab is available exclusively to student societies affiliated with recognised universities in NSW,
            including UNSW Sydney, the University of Sydney, UTS, Macquarie University, and Western Sydney
            University. By registering, you represent that you are an authorised representative of a registered
            student society at one of these institutions.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[var(--heading)] text-lg font-bold text-[var(--text)]">3. Account Registration & Verification</h2>
          <p>
            You must provide accurate information when creating your account, including your society's name and
            a valid university email address. Collab uses an automated verification system to match your society
            against our registry. Societies that cannot be automatically verified may be subject to manual review.
          </p>
          <p className="mt-3">
            You are responsible for maintaining the confidentiality of your login credentials and for all activity
            that occurs under your account.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[var(--heading)] text-lg font-bold text-[var(--text)]">4. Acceptable Use</h2>
          <p>You agree not to use the Service to:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Post false, misleading, or fraudulent society information</li>
            <li>Spam or harass other societies via the messaging or collab request features</li>
            <li>Upload content that is illegal, offensive, or infringes on third-party rights</li>
            <li>Attempt to gain unauthorised access to other accounts or Collab's systems</li>
            <li>Use automated tools to scrape or extract data from the platform</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-[var(--heading)] text-lg font-bold text-[var(--text)]">5. Collaboration Listings & Requests</h2>
          <p>
            Listings posted on Collab represent genuine collaboration opportunities. You are responsible for the
            accuracy of your listings and for honouring accepted collaboration requests in good faith. Collab
            does not mediate disputes between societies.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[var(--heading)] text-lg font-bold text-[var(--text)]">6. Content Ownership</h2>
          <p>
            You retain ownership of any content you upload (logos, descriptions, event details). By posting
            content on Collab, you grant us a non-exclusive, royalty-free licence to display and distribute
            that content within the platform for the purpose of operating the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[var(--heading)] text-lg font-bold text-[var(--text)]">7. Account Termination</h2>
          <p>
            Collab reserves the right to suspend or terminate accounts that violate these Terms or engage in
            behaviour detrimental to the community, without prior notice. You may delete your account at any
            time from your profile settings.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[var(--heading)] text-lg font-bold text-[var(--text)]">8. Disclaimers</h2>
          <p>
            The Service is provided "as is" without warranties of any kind. Collab does not guarantee
            uninterrupted availability, and we are not liable for any loss or damage arising from your use of
            the platform or from collaborations arranged through it.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[var(--heading)] text-lg font-bold text-[var(--text)]">9. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of the Service after changes are posted
            constitutes acceptance of the revised Terms. We will notify registered societies of material changes
            via email.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[var(--heading)] text-lg font-bold text-[var(--text)]">10. Contact</h2>
          <p>
            Questions about these Terms? Email us at{' '}
            <a href="mailto:hello@collabapp.au" className="text-[var(--primary)] hover:underline">
              hello@collabapp.au
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
