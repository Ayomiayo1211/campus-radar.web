'use client';

import { FormEvent, useState } from 'react';
import styles from './join.module.css';

const teams = [
  { value: 'EDITORIAL', label: 'Editorial', detail: 'Reporting, writing, editing and story production.' },
  { value: 'CREATIVE', label: 'Creative', detail: 'Graphic design, visual communication and video editing.' },
  { value: 'PHOTOGRAPHY', label: 'Photography', detail: 'Event coverage, photojournalism and visual documentation.' },
  { value: 'PODCAST', label: 'Podcast', detail: 'Audio production, hosting and podcast content.' },
  { value: 'EVENTS', label: 'Events', detail: 'Planning and delivering Campus Radar events and activations.' },
  { value: 'PARTNERSHIPS', label: 'Partnerships', detail: 'External relations, sponsorships and collaborations.' },
] as const;

const levels = ['100', '200', '300', '400', '500', 'Postgraduate', 'Other'];
const hours = ['1–3 hrs', '4–6 hrs', '7–10 hrs', '10+ hrs'];

export default function JoinPage() {
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function toggleTeam(team: string) {
    setSelectedTeams(current => current.includes(team) ? current.filter(item => item !== team) : [...current, team]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!selectedTeams.length) {
      setError('Select at least one team before submitting.');
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      fullName: String(data.get('fullName') ?? ''),
      matricNumber: String(data.get('matricNumber') ?? ''),
      level: String(data.get('level') ?? ''),
      department: String(data.get('department') ?? ''),
      phone: String(data.get('phone') ?? ''),
      whatsapp: String(data.get('whatsapp') ?? ''),
      email: String(data.get('email') ?? ''),
      teams: selectedTeams,
      whyTeam: String(data.get('whyTeam') ?? ''),
      skills: String(data.get('skills') ?? ''),
      portfolio: String(data.get('portfolio') ?? ''),
      priorRole: String(data.get('priorRole') ?? ''),
      heardFrom: String(data.get('heardFrom') ?? ''),
      hours: String(data.get('hours') ?? ''),
      acknowledged: data.get('acknowledged') === 'on',
      website: String(data.get('website') ?? ''),
    };

    setSubmitting(true);
    try {
      const response = await fetch('/api/member-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Your application could not be submitted.');
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.radar} aria-hidden="true">
          <span className={styles.ring} /><span className={styles.ring} /><span className={styles.ring} />
          <span className={styles.sweep} /><span className={styles.blipOne} /><span className={styles.blipTwo} /><span className={styles.blipThree} />
          <span className={styles.core} />
        </div>
        <p className={styles.eyebrow}>Campus Radar · FUNAAB</p>
        <h1>New Member Application</h1>
        <p className={styles.heroSub}>You're on our radar. Tell us about yourself and where you'd like to plug in. It takes about five minutes.</p>
        <p className={styles.session}>2026/2027 SESSION</p>
      </header>

      {submitted ? (
        <section className={styles.success} role="status">
          <div className={styles.successMark}>✓</div>
          <h2>Application received.</h2>
          <p>Your details have been submitted to Campus Radar FUNAAB. Our team will contact you using the details you provided.</p>
          <p className={styles.successNote}>Thank you for your interest in joining the team.</p>
        </section>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          <section className={styles.sector}>
            <p className={styles.sectorTag}>Sector 01 · Identification</p>
            <div className={styles.field}>
              <label htmlFor="fullName">Full name <span>*</span></label>
              <input id="fullName" name="fullName" autoComplete="name" required minLength={2} maxLength={120} />
            </div>
            <div className={styles.gridTwo}>
              <div className={styles.field}>
                <label htmlFor="matricNumber">Matric / Reg number <span>*</span></label>
                <input id="matricNumber" name="matricNumber" required maxLength={60} />
              </div>
              <div className={styles.field}>
                <label htmlFor="level">Level <span>*</span></label>
                <select id="level" name="level" required defaultValue=""><option value="" disabled>Select level</option>{levels.map(level => <option key={level}>{level}</option>)}</select>
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="department">Department <span>*</span></label>
              <input id="department" name="department" required maxLength={120} />
            </div>
            <div className={styles.gridTwo}>
              <div className={styles.field}>
                <label htmlFor="phone">Phone number <span>*</span></label>
                <input id="phone" name="phone" type="tel" autoComplete="tel" required minLength={7} maxLength={40} />
              </div>
              <div className={styles.field}>
                <label htmlFor="whatsapp">WhatsApp number <small>(if different)</small></label>
                <input id="whatsapp" name="whatsapp" type="tel" maxLength={40} />
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="email">Email address <span>*</span></label>
              <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} />
            </div>
          </section>

          <section className={styles.sector}>
            <p className={styles.sectorTag}>Sector 02 · Where you want to operate</p>
            <fieldset className={styles.fieldset}>
              <legend>Which team(s) interest you? <small>(select at least one)</small></legend>
              <div className={styles.teamGrid}>
                {teams.map(team => (
                  <label key={team.value} className={`${styles.teamOption} ${selectedTeams.includes(team.value) ? styles.teamSelected : ''}`}>
                    <input type="checkbox" checked={selectedTeams.includes(team.value)} onChange={() => toggleTeam(team.value)} />
                    <span><strong>{team.label}</strong><small>{team.detail}</small></span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className={styles.field}>
              <label htmlFor="whyTeam">Why these teams? <small>(optional)</small></label>
              <textarea id="whyTeam" name="whyTeam" rows={3} maxLength={2000} placeholder="A sentence or two is fine." />
            </div>
          </section>

          <section className={styles.sector}>
            <p className={styles.sectorTag}>Sector 03 · Background</p>
            <div className={styles.field}>
              <label htmlFor="skills">Relevant skills or experience <small>(optional)</small></label>
              <textarea id="skills" name="skills" rows={3} maxLength={3000} placeholder="Writing, editing, photography, hosting, design, social media, event planning..." />
            </div>
            <div className={styles.field}>
              <label htmlFor="portfolio">Link to past work / social handles <small>(optional)</small></label>
              <input id="portfolio" name="portfolio" maxLength={500} placeholder="Instagram, X, blog, portfolio or anything you've made." />
            </div>
            <div className={styles.gridTwo}>
              <div className={styles.field}>
                <label htmlFor="priorRole">Held a leadership or media role before?</label>
                <select id="priorRole" name="priorRole" defaultValue=""><option value="">Select one</option><option>Yes</option><option>No</option></select>
              </div>
              <div className={styles.field}>
                <label htmlFor="heardFrom">How did you hear about us?</label>
                <select id="heardFrom" name="heardFrom" defaultValue=""><option value="">Select one</option><option>Instagram</option><option>Twitter / X</option><option>WhatsApp</option><option>Friend / referral</option><option>Campus event</option><option>Other</option></select>
              </div>
            </div>
          </section>

          <section className={styles.sector}>
            <p className={styles.sectorTag}>Sector 04 · Commitment</p>
            <div className={styles.field}>
              <label htmlFor="hours">Hours per week you can commit <span>*</span></label>
              <select id="hours" name="hours" required defaultValue=""><option value="" disabled>Select one</option>{hours.map(value => <option key={value}>{value}</option>)}</select>
            </div>
            <label className={styles.ack}>
              <input type="checkbox" name="acknowledged" required />
              <span>I understand that new members go through a four-week probationary period, and continued membership requires regular dues payment.</span>
            </label>
          </section>

          <div className={styles.honeypot} aria-hidden="true">
            <label htmlFor="website">Leave this field empty</label>
            <input id="website" name="website" tabIndex={-1} autoComplete="off" />
          </div>

          {error && <p className={styles.error} role="alert">{error}</p>}
          <button className={styles.submit} type="submit" disabled={submitting}>{submitting ? 'Submitting application…' : 'Submit application'}</button>
          <p className={styles.privacy}>Your information will only be used for Campus Radar's 2026/2027 recruitment and membership process. Access is restricted to authorised newsroom administrators.</p>
        </form>
      )}
      <footer className={styles.footer}>CAMPUS RADAR · FUNAAB</footer>
    </main>
  );
}
