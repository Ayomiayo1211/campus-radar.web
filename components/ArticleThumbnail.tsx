'use client';
import { useState } from 'react';

type Props = { title: string; excerpt: string; coverImage: string; contentType: string; authorName: string; date?: string | null };

function labelFor(type: string) {
  const labels: Record<string, string> = { NEWS: 'NEWS', THE_RADAR: 'THE RADAR', FEATURE: 'FEATURES', FEATURES: 'FEATURES', OPINION: 'OPINION', OPPORTUNITY: 'OPPORTUNITY' };
  return labels[type.toUpperCase()] || type.replaceAll('_', ' ');
}
function displayDate(value?: string | null) {
  return (value ? new Date(value) : new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
}
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.trim().split(/\s+/)) {
    const next = line ? line + ' ' + word : word;
    if (ctx.measureText(next).width > maxWidth && line) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export default function ArticleThumbnail({ title, excerpt, coverImage, contentType, authorName, date }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  async function downloadThumbnail() {
    setDownloading(true); setDownloadError('');
    try {
      const size = 1200;
      const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Your browser could not prepare the thumbnail.');
      ctx.fillStyle = '#182c5e'; ctx.fillRect(0, 0, size, size);
      if (coverImage) {
        const photo = new Image(); photo.crossOrigin = 'anonymous'; photo.src = coverImage;
        await new Promise<void>((resolve, reject) => { photo.onload = () => resolve(); photo.onerror = () => reject(new Error('Cover image export failed. Please choose an image from the Campus Radar Media Library.')); });
        const scale = Math.max(size / photo.width, size / photo.height);
        const width = photo.width * scale; const height = photo.height * scale;
        ctx.drawImage(photo, (size - width) / 2, (size - height) / 2, width, height);
      }
      const shade = ctx.createLinearGradient(0, 0, 0, size);
      shade.addColorStop(0, 'rgba(8,18,42,0.12)'); shade.addColorStop(0.48, 'rgba(8,18,42,0.04)'); shade.addColorStop(1, 'rgba(5,13,32,0.35)');
      ctx.fillStyle = shade; ctx.fillRect(0, 0, size, size);

      ctx.fillStyle = '#faf8f2'; ctx.fillRect(52, 52, 224, 82);
      ctx.fillStyle = '#233f9e'; ctx.font = '700 27px Arial'; ctx.fillText('CAMPUS RADAR', 68, 103);

      const dateText = displayDate(date);
      ctx.font = '600 20px Arial';
      const dateWidth = Math.min(430, ctx.measureText(dateText).width + 44);
      ctx.fillStyle = '#faf8f2'; ctx.strokeStyle = '#233f9e'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(size - dateWidth - 52, 52, dateWidth, 82, 41); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2c51d2'; ctx.textAlign = 'center'; ctx.fillText(dateText, size - dateWidth / 2 - 52, 102); ctx.textAlign = 'left';

      ctx.fillStyle = 'rgba(12, 25, 57, 0.88)'; ctx.fillRect(0, 800, size, 320);
      const category = labelFor(contentType);
      ctx.font = '600 24px Arial'; const categoryWidth = ctx.measureText(category).width + 52;
      ctx.fillStyle = '#faf8f2'; ctx.strokeStyle = '#233f9e'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(32, 636, categoryWidth, 66, 33); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2c51d2'; ctx.fillText(category, 58, 679);

      ctx.fillStyle = '#fff'; ctx.font = '700 48px Arial';
      wrapText(ctx, title || 'Your article headline', 1125).slice(0, 3).forEach((line, index) => ctx.fillText(line, 34, 850 + index * 58));
      ctx.font = '400 27px Arial';
      wrapText(ctx, excerpt || 'Your article summary will appear here.', 1080).slice(0, 3).forEach((line, index) => ctx.fillText(line, 36, 950 + index * 38));
      ctx.font = '600 23px Arial'; ctx.textAlign = 'right'; ctx.fillText('By: ' + (authorName || 'Campus Radar'), 1150, 1040); ctx.textAlign = 'left';

      ctx.fillStyle = '#fff'; ctx.fillRect(0, 1120, size, 80);
      ctx.fillStyle = '#2c51d2'; ctx.font = '500 24px Arial'; ctx.fillText('READ MORE: www.campusradar.com', 52, 1168);
      ctx.textAlign = 'right'; ctx.font = '600 22px Arial'; ctx.fillText('@campusradarfunaab', 1150, 1168); ctx.textAlign = 'left';

      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not export the thumbnail.')), 'image/png'));
      const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url;
      anchor.download = (title || 'campus-radar-thumbnail').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.png';
      anchor.click(); URL.revokeObjectURL(url);
    } catch (error) { setDownloadError(error instanceof Error ? error.message : 'Thumbnail export failed.'); }
    finally { setDownloading(false); }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-semibold text-black">Campus Radar Thumbnail</h2><p className="mt-1 text-sm text-gray-600">Live preview using the article details above.</p></div>
        <button type="button" onClick={downloadThumbnail} disabled={downloading || !coverImage} className="rounded-lg bg-[#233f9e] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1b327d] disabled:cursor-not-allowed disabled:opacity-50">{downloading ? 'Preparing PNG…' : 'Download PNG'}</button>
      </div>
      <div className="mx-auto aspect-square w-full max-w-[520px] overflow-hidden bg-[#182c5e] text-white shadow-sm">
        <div className="relative h-full w-full">
          {coverImage ? <img src={coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 bg-gradient-to-br from-[#233f9e] to-[#101d3d]" />}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />
          <div className="absolute left-[4.4%] top-[4.4%] flex h-[7.2%] w-[23%] items-center justify-center bg-[#faf8f2] px-2 text-[clamp(10px,2vw,17px)] font-extrabold tracking-tight text-[#233f9e]">CAMPUS RADAR</div>
          <div className="absolute right-[4.4%] top-[4.4%] rounded-full border-2 border-[#233f9e] bg-[#faf8f2] px-3 py-2 text-[clamp(7px,1.55vw,12px)] font-semibold text-[#2c51d2]">{displayDate(date)}</div>
          <div className="absolute inset-x-0 bottom-[6.6%] h-[26.8%] bg-[#0c1939]/90" />
          <div className="absolute top-[58.8%] left-[2.8%] rounded-full border-2 border-[#233f9e] bg-[#faf8f2] px-4 py-2 text-[clamp(9px,1.8vw,14px)] font-semibold text-[#2c51d2]">{labelFor(contentType)}</div>
          <div className="absolute top-[68%] left-[2.8%] right-[2.8%]"><h3 className="line-clamp-3 text-[clamp(18px,4vw,34px)] font-bold leading-[1.08]">{title || 'Your article headline'}</h3><p className="mt-2 line-clamp-3 text-[clamp(10px,2.2vw,17px)] leading-snug">{excerpt || 'Your article summary will appear here.'}</p></div>
          <p className="absolute top-[87.2%] right-[3%] text-[clamp(9px,1.8vw,14px)] font-semibold">By: {authorName || 'Campus Radar'}</p>
          <div className="absolute inset-x-0 bottom-0 flex h-[6.6%] items-center justify-between bg-white px-[4.4%] text-[clamp(8px,1.8vw,14px)] font-medium text-[#2c51d2]"><span>READ MORE: www.campusradar.com</span><span>@campusradarfunaab</span></div>
        </div>
      </div>
      {!coverImage && <p className="mt-3 text-xs text-amber-700">Select a cover image to enable PNG download.</p>}
      {downloadError && <p className="mt-3 text-sm text-red-600">{downloadError}</p>}
    </section>
  );
}
