'use client';
import { useState } from 'react';
import { Facebook, Instagram, Music2, AtSign } from 'lucide-react';

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
  for (const word of text.trim().split(/\\s+/)) {
    const next = line ? line + ' ' + word : word;
    if (ctx.measureText(next).width > maxWidth && line) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}
function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load the image asset.'));
    image.src = src;
  });
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
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, size, size);
      if (coverImage) {
        const photo = await loadImage(coverImage);
        const scale = Math.max(size / photo.width, size / photo.height);
        const width = photo.width * scale; const height = photo.height * scale;
        ctx.drawImage(photo, (size - width) / 2, (size - height) / 2, width, height);
      }

      // Figma frame 418:2 — original Campus Radar logo cropped from the repository SVG.
      ctx.fillStyle = '#FAF8F2'; ctx.fillRect(52.5, 52.5, 223.6, 82.4);
      const logo = await loadImage('/campusradar.svg');
      ctx.save(); ctx.beginPath(); ctx.rect(69.8, 52.5, 188.5, 68.2); ctx.clip();
      ctx.drawImage(logo, 69.8, -24.6, 188.5, 236); ctx.restore();

      const dateText = displayDate(date);
      ctx.font = '400 31px Arial';
      const dateWidth = Math.max(355, ctx.measureText(dateText).width + 34);
      const dateX = 1200 - 52.5 - dateWidth;
      ctx.fillStyle = '#FAF8F2'; ctx.strokeStyle = '#233F9E'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.roundRect(dateX, 52.5, dateWidth, 52, 26); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2C51D2'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(dateText, dateX + dateWidth / 2, 78.5); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';

      const panelTop = 800;
      const panel = ctx.createLinearGradient(0, panelTop, 0, 1122);
      panel.addColorStop(0, 'rgba(44,81,210,0.78)'); panel.addColorStop(0.28, 'rgba(44,81,210,0.94)'); panel.addColorStop(1, '#2C51D2');
      ctx.fillStyle = panel; ctx.fillRect(0, panelTop, size, 322);

      const category = labelFor(contentType);
      ctx.font = '400 37px Arial';
      const categoryWidth = ctx.measureText(category).width + 34;
      ctx.fillStyle = '#FAF8F2'; ctx.strokeStyle = '#233F9E'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.roundRect(31.5, 705.5, categoryWidth, 48, 24); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2C51D2'; ctx.fillText(category, 47, 738);

      ctx.fillStyle = '#FFFFFF'; ctx.font = '600 47px Arial';
      const titleLines = wrapText(ctx, title || 'Your article headline', 1162).slice(0, 2);
      titleLines.forEach((line, index) => ctx.fillText(line, 30, 864 + index * 52));
      ctx.font = '400 29px Arial';
      wrapText(ctx, excerpt || 'Your article summary will appear here.', 1100).slice(0, 2).forEach((line, index) => ctx.fillText(line, 31.5, 980 + index * 34));
      ctx.font = '600 38px Arial'; ctx.textAlign = 'right';
      ctx.fillText('By: ' + (authorName || 'Campus Radar'), 1074, 1084); ctx.textAlign = 'left';

      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 1122, size, 78);
      ctx.fillStyle = '#2C51D2'; ctx.font = '400 29px Arial';
      ctx.fillText('READ MORE: www.campusradar.com', 52.5, 1170);
      ctx.textAlign = 'right'; ctx.font = '400 25px Arial';
      ctx.fillText('f   X   ♪   ◎   @campusradarfunaab', 1148, 1170); ctx.textAlign = 'left';

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
        <button type="button" onClick={downloadThumbnail} disabled={downloading || !coverImage} className="rounded-lg bg-[#2C51D2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#233F9E] disabled:cursor-not-allowed disabled:opacity-50">{downloading ? 'Preparing PNG…' : 'Download PNG'}</button>
      </div>
      <div className="mx-auto aspect-square w-full max-w-[520px] overflow-hidden bg-white text-white shadow-sm">
        <div className="relative h-full w-full">
          {coverImage ? <img src={coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 bg-[#2C51D2]" />}
          <div className="absolute left-[4.37%] top-[4.37%] h-[6.87%] w-[18.64%] overflow-hidden bg-[#FAF8F2]">
            <img src="/campusradar.svg" alt="Campus Radar" className="absolute left-[7.75%] top-[-93.63%] h-[286.5%] w-[84.27%] max-w-none" />
          </div>
          <div className="absolute right-[12.3%] top-[4.37%] rounded-full border-[1.5px] border-[#233F9E] bg-[#FAF8F2] px-[1.3%] py-[0.45%] text-[clamp(8px,2.25vw,17px)] font-normal leading-tight text-[#2C51D2]">{displayDate(date)}</div>
          <div className="absolute inset-x-0 top-[66.67%] h-[26.77%] bg-gradient-to-b from-[#2C51D2]/80 via-[#2C51D2]/95 to-[#2C51D2]" />
          <div className="absolute left-[2.63%] top-[58.8%] rounded-full border-[1.5px] border-[#233F9E] bg-[#FAF8F2] px-[1.25%] py-[0.25%] text-[clamp(9px,2.3vw,18px)] font-normal leading-tight text-[#2C51D2]">{labelFor(contentType)}</div>
          <div className="absolute left-[2.5%] right-[2.5%] top-[68.1%]">
            <h3 className="line-clamp-2 text-[clamp(18px,4.05vw,34px)] font-semibold leading-[1.08]">{title || 'Your article headline'}</h3>
            <p className="mt-[1.2%] line-clamp-2 text-[clamp(10px,2.45vw,19px)] leading-[1.1]">{excerpt || 'Your article summary will appear here.'}</p>
          </div>
          <p className="absolute right-[3.1%] top-[87.2%] text-[clamp(10px,3.05vw,23px)] font-semibold leading-none">By: {authorName || 'Campus Radar'}</p>
          <div className="absolute inset-x-0 bottom-0 flex h-[6.56%] items-center justify-between bg-white px-[4.37%] text-[clamp(8px,2.65vw,20px)] font-normal leading-none text-[#2C51D2]">
            <span>READ MORE: www.campusradar.com</span>
            <div className="flex items-center gap-[0.8vw]">
              <Facebook size={14} strokeWidth={2.4} fill="#2C51D2" color="#2C51D2" />
              <span className="font-semibold">X</span>
              <Music2 size={14} strokeWidth={2.4} />
              <Instagram size={14} strokeWidth={2.2} />
              <span>@campusradarfunaab</span>
            </div>
          </div>
        </div>
      </div>
      {!coverImage && <p className="mt-3 text-xs text-amber-700">Select a cover image to enable PNG download.</p>}
      {downloadError && <p className="mt-3 text-sm text-red-600">{downloadError}</p>}
    </section>
  );
}
