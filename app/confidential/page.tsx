import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const confidentialUrl = process.env.NEXT_PUBLIC_CONFIDENTIAL_URL;

export default function Confidential() {
  return <><Header /><main className="container min-h-[65vh] max-w-3xl py-16"><div className="kicker text-[var(--accent)]">Anonymous reporting</div><h1 className="mt-2 text-5xl font-black md:text-7xl">Campus Confidential</h1><p className="mt-6 text-xl leading-8 text-[var(--muted)]">A separate, private channel for sending information to the Campus Radar newsroom without publicly identifying yourself.</p><div className="mt-8 border border-black bg-white p-6 md:p-8"><p className="font-bold">Use Confidential when anonymity matters.</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">This page does not duplicate Confidential's submission or administration system. It is the public entry point into the existing application.</p>{confidentialUrl ? <a href={confidentialUrl} className="mt-6 inline-block rounded-full bg-black px-5 py-3 text-sm font-bold text-white">Open Campus Confidential</a> : <p className="mt-6 border-t border-[var(--line)] pt-4 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Confidential destination will be connected before launch.</p>}</div></main><Footer /></>;
}
