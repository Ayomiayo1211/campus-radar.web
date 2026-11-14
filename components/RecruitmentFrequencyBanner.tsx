import Link from 'next/link';

export function RecruitmentFrequencyBanner() {
  return (
    <section className="border-y border-[#173B87]/15 bg-[#07152f] text-white">
      <div className="container grid gap-6 py-10 md:grid-cols-[1fr_auto] md:items-center">
        <div className="max-w-2xl">
          <p className="kicker text-[#9bbcff]">Campus Radar · Open newsroom</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Choose Your <span className="text-[#83a8ff]">Frequency.</span></h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">Six teams. Different skills. One newsroom. Find where your ideas, creativity and curiosity fit, then help tell the stories that matter on campus.</p>
        </div>
        <Link href="/join" className="inline-flex w-fit items-center rounded-full bg-white px-6 py-3 text-sm font-extrabold text-[#173B87] transition hover:bg-[#eaf0ff]">Explore the teams <span aria-hidden="true" className="ml-2">→</span></Link>
      </div>
    </section>
  );
}
