import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Campus Radar',
  description: 'How Campus Radar collects, uses and protects information.',
  alternates: { canonical: '/privacy-policy' },
};

const updated = '14 November 2026';

export default function PrivacyPolicyPage() {
  return (
    <main className="container max-w-4xl py-12 sm:py-16">
      <Link href="/" className="text-sm font-bold text-[#173B87] underline underline-offset-4">← Campus Radar home</Link>
      <p className="kicker mt-8">Campus Radar · Legal</p>
      <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Privacy Policy</h1>
      <p className="mt-3 text-sm text-[var(--muted)]">Last updated: {updated}</p>

      <div className="prose mt-8 max-w-none space-y-7 text-[var(--ink)]">
        <section>
          <h2>1. About this policy</h2>
          <p>Campus Radar is an independent, student-focused media and information platform serving the Federal University of Agriculture, Abeokuta (FUNAAB) community. It is not an official FUNAAB website or university service. This policy explains what information we may collect when you visit or use the website, submit material, subscribe to updates or interact with our newsroom.</p>
        </section>
        <section>
          <h2>2. Information we collect</h2>
          <p>Depending on how you use the website, information may include:</p>
          <ul>
            <li><strong>Information you provide:</strong> details and contact information entered in submission forms, confidential tips, comments, newsletter subscriptions, account or administrative invitations, and messages to the newsroom.</li>
            <li><strong>Submitted material:</strong> text, photographs, documents, audio, links and other files you choose to send us for editorial or platform purposes.</li>
            <li><strong>Technical information:</strong> information routinely provided by your browser or hosting infrastructure, such as IP address, device and browser details, requested pages, timestamps and basic diagnostic or security logs.</li>
            <li><strong>Website preferences:</strong> a local browser preference may be stored to remember your selected display theme.</li>
          </ul>
          <p>Please do not include passwords, financial account details or other highly sensitive information in ordinary submissions. A submission marked confidential should still not be treated as a guarantee of absolute anonymity.</p>
        </section>
        <section>
          <h2>3. How we use information</h2>
          <p>We use information to operate and secure the website; review and respond to submissions; verify information; communicate with contributors and subscribers; manage newsroom accounts and invitations; publish material where appropriate; deliver requested updates; prevent abuse; troubleshoot technical issues; and improve the platform.</p>
          <p>We do not sell personal information. We do not use information submitted to the newsroom for unrelated advertising purposes.</p>
        </section>
        <section>
          <h2>4. Email delivery and forwarding</h2>
          <p>Campus Radar uses Resend to send platform-generated emails, including administrative invitations and newsroom notifications. Incoming messages sent to Campus Radar domain addresses may be forwarded to a designated inbox using Cloudflare Email Routing.</p>
          <p>These services process message content and recipient or sender details as necessary to deliver email. Campus Radar does not use this setup to access or read the contents of the destination inbox. Email delivery and forwarding are also subject to the providers' respective privacy policies and terms.</p>
        </section>
        <section>
          <h2>5. Service providers and sharing</h2>
          <p>We may rely on service providers that help host the website, store platform data, deliver email or protect the service. These providers process information as needed to provide their services. We do not sell or rent personal information. We may disclose information if reasonably necessary to comply with applicable law, respond to a valid legal request, protect the rights and safety of people or the platform, or investigate abuse.</p>
          <p>When you ask us to publish a story, comment, image or other contribution, the material and any byline or attribution you provide may become public. Do not submit material for publication unless you have the right to share it.</p>
        </section>
        <section>
          <h2>6. Retention and security</h2>
          <p>We retain information for as long as reasonably necessary for the purpose for which it was collected, including editorial records, platform administration, security, legal compliance and dispute resolution. Retention periods may differ by information type. We use reasonable administrative and technical safeguards, but no website or electronic transmission can be guaranteed completely secure.</p>
        </section>
        <section>
          <h2>7. Your choices and requests</h2>
          <p>You may contact us to ask about personal information you have provided, request a correction or deletion where appropriate, or unsubscribe from optional email updates. We may need to retain some records for legitimate editorial, security or legal reasons. We may also need to verify your identity before acting on a request.</p>
        </section>
        <section>
          <h2>8. Children</h2>
          <p>Campus Radar is intended for a general university-community audience and is not designed to knowingly collect personal information from children under 13. If you believe a child has provided personal information, contact us so we can review the matter.</p>
        </section>
        <section>
          <h2>9. Changes to this policy</h2>
          <p>We may update this policy when our practices or services change. The latest version will be published on this page with its updated date.</p>
        </section>
        <section>
          <h2>10. Contact</h2>
          <p>For privacy questions or requests, contact the Campus Radar newsroom at <a href="mailto:hello@campusradarfunaab.com.ng">hello@campusradarfunaab.com.ng</a>.</p>
        </section>
      </div>
    </main>
  );
}
