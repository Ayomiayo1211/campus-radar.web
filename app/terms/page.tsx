import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Use | Campus Radar',
  description: 'Terms governing access to and use of Campus Radar.',
  alternates: { canonical: '/terms' },
};

const updated = '13 November 2026';

export default function TermsPage() {
  return (
    <main className="container max-w-4xl py-12 sm:py-16">
      <Link href="/" className="text-sm font-bold text-[#173B87] underline underline-offset-4">← Campus Radar home</Link>
      <p className="kicker mt-8">Campus Radar · Legal</p>
      <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Terms of Use</h1>
      <p className="mt-3 text-sm text-[var(--muted)]">Last updated: {updated}</p>

      <div className="prose mt-8 max-w-none space-y-7 text-[var(--ink)]">
        <section>
          <h2>1. About Campus Radar</h2>
          <p>Campus Radar is an independent, student-focused media and information platform serving the Federal University of Agriculture, Abeokuta (FUNAAB) community. It is not owned, operated, endorsed or officially maintained by FUNAAB or its Students' Union Government. References to the university or other organisations do not imply their endorsement.</p>
        </section>
        <section>
          <h2>2. Acceptance and access</h2>
          <p>By accessing or using the Campus Radar website, you agree to these Terms of Use and our <Link href="/privacy-policy">Privacy Policy</Link>. If you do not agree, do not use the website. Some features may have additional instructions or eligibility requirements.</p>
        </section>
        <section>
          <h2>3. Editorial content and information</h2>
          <p>Campus Radar publishes news, features, opinions, campus updates, opportunities and other information. We make reasonable editorial efforts to review material, but content may be incomplete, change over time or contain errors. Information is provided for general information and should be independently verified before you rely on it, particularly for deadlines, applications, events, financial decisions or safety matters.</p>
          <p>Publication of an opportunity, event or organisation does not constitute an endorsement or guarantee. Campus Radar is not responsible for third-party application processes, event changes, eligibility decisions or external websites.</p>
        </section>
        <section>
          <h2>4. Submissions and user conduct</h2>
          <p>You are responsible for material you submit. You must have the right and any necessary permission to provide text, photographs, recordings, documents or other content. Do not submit unlawful, defamatory, threatening, harassing, deceptive, discriminatory or privacy-invasive material; malicious code; spam; or content that infringes another person's rights.</p>
          <p>Do not impersonate another person, attempt to gain unauthorised access, interfere with the website, misuse submission forms or attempt to disrupt the platform.</p>
        </section>
        <section>
          <h2>5. Permission to review and publish submissions</h2>
          <p>By sending material for editorial consideration, you give Campus Radar permission to review, edit, reproduce and publish that material for the purpose you submitted it for, including reasonable formatting, headline, length and clarity edits. We will not treat a submission as automatically approved for publication. We may decline, remove or request clarification about any submission.</p>
          <p>You retain ownership of content you create. You are responsible for ensuring that publication does not violate another person's privacy, confidentiality, copyright or other rights. If you need to request a correction or raise a rights concern, contact the newsroom.</p>
        </section>
        <section>
          <h2>6. Confidential tips</h2>
          <p>Our confidential submission channel is intended to help people share information discreetly. However, no online submission method can guarantee absolute anonymity or confidentiality. Avoid including identifying details unless necessary, and do not use the service to submit information that would put you or someone else at immediate risk. We may need to disclose information where required by law or necessary to address a serious safety or security issue.</p>
        </section>
        <section>
          <h2>7. Intellectual property</h2>
          <p>Unless otherwise stated, the Campus Radar name, branding, website design and original editorial material are protected by applicable intellectual property laws. You may link to our publicly available pages and share excerpts with appropriate attribution. You may not reproduce substantial portions of our content, branding or materials for commercial or misleading purposes without prior permission. Third-party names, marks and materials remain the property of their respective owners.</p>
        </section>
        <section>
          <h2>8. Third-party services and links</h2>
          <p>The website may contain links to third-party websites or use third-party services. Those services are governed by their own terms and policies. Campus Radar does not control and is not responsible for their content, availability, security or practices.</p>
        </section>
        <section>
          <h2>9. Availability and limitation of liability</h2>
          <p>We may change, suspend or discontinue features, or restrict access where necessary for maintenance, security or operational reasons. To the extent permitted by applicable law, Campus Radar is not liable for indirect, incidental or consequential loss arising from use of the website, reliance on published information, third-party services or temporary service interruption. Nothing in these Terms excludes liability that cannot lawfully be excluded.</p>
        </section>
        <section>
          <h2>10. Changes to these terms</h2>
          <p>We may revise these Terms when the platform or applicable requirements change. The updated version will appear on this page with a revised date. Continued use of the website after changes take effect means you accept the revised Terms.</p>
        </section>
        <section>
          <h2>11. Contact</h2>
          <p>Questions about these Terms can be sent to <a href="mailto:campusradarfunaab@gmail.com">campusradarfunaab@gmail.com</a>.</p>
        </section>
      </div>
    </main>
  );
}
