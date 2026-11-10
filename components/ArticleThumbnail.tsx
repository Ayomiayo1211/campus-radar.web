'use client';
import { useState } from 'react';
import { Facebook, Instagram, Music2 } from 'lucide-react';

type Props = { title: string; excerpt: string; coverImage: string; contentType: string; authorName: string; date?: string | null };
const SIZE = 1200, BLUE = '#2C51D2', NAVY = '#233F9E', DOMAIN = 'campusradarfunaab.com.ng';

function labelFor(type: string) {
  const labels: Record<string, string> = { NEWS: 'NEWS', THE_RADAR: 'THE RADAR', FEATURE: 'FEATURES', FEATURES: 'FEATURES', OPINION: 'OPINION', OPPORTUNITY: 'OPPORTUNITY' };
  return labels[type.toUpperCase()] || type.replaceAll('_', ' ');
}
function displayDate(value?: string | null) {
  return (value ? new Date(value) : new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
}
function wrapText(ctx: CanvasRenderingContext2D, value: string, maxWidth: number) {
  const words = value.trim().split(/\s+/).filter(Boolean), lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? line + ' ' + word : word;
    if (line && ctx.measureText(next).width > maxWidth) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}
function fitLines(ctx: CanvasRenderingContext2D, value: string, maxWidth: number, maxLines: number, start: number, min: number, weight: number) {
  for (let size = start; size >= min; size--) {
    ctx.font = `${weight} ${size}px Arial, sans-serif`;
    const lines = wrapText(ctx, value, maxWidth);
    if (lines.length <= maxLines) return { lines, size };
  }
  ctx.font = `${weight} ${min}px Arial, sans-serif`;
  const lines = wrapText(ctx, value, maxWidth).slice(0, maxLines);
  const last = lines.length - 1;
  if (last >= 0) {
    let line = lines[last];
    while (line && ctx.measureText(line + '…').width > maxWidth) line = line.slice(0, -1).trimEnd();
    lines[last] = (line || '') + '…';
  }
  return { lines, size: min };
}
function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load the image asset.'));
    image.src = src;
  });
}
function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
  const scale = Math.max(SIZE / image.width, SIZE / image.height);
  const width = image.width * scale, height = image.height * scale;
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, SIZE, SIZE); ctx.clip();
  ctx.drawImage(image, (SIZE - width) / 2, (SIZE - height) / 2, width, height); ctx.restore();
}

export default function ArticleThumbnail({ title, excerpt, coverImage, contentType, authorName, date }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  async function downloadThumbnail() {
    setDownloading(true); setDownloadError('');
    try {
      const canvas = document.createElement('canvas'); canvas.width = SIZE; canvas.height = SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Your browser could not prepare the thumbnail.');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, SIZE, SIZE);
      drawCover(ctx, await loadImage(coverImage));

      ctx.fillStyle = '#FAF8F2'; ctx.fillRect(52, 52, 224, 83);
      const logo = await loadImage('/campusradar.svg');
      ctx.save(); ctx.beginPath(); ctx.rect(70, 53, 189, 68); ctx.clip();
      ctx.drawImage(logo, 70, -25, 189, 236); ctx.restore();

      const dateText = displayDate(date);
      ctx.font = '400 30px Arial, sans-serif';
      const dateWidth = Math.max(355, ctx.measureText(dateText).width + 42), dateX = SIZE - 52 - dateWidth;
      ctx.fillStyle = '#FAF8F2'; ctx.strokeStyle = NAVY; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.roundRect(dateX, 52, dateWidth, 54, 27); ctx.fill(); ctx.stroke();
      ctx.fillStyle = BLUE; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(dateText, dateX + dateWidth / 2, 79);

      const panelTop = 758, panel = ctx.createLinearGradient(0, panelTop, 0, 1122);
      panel.addColorStop(0, 'rgba(44,81,210,0.82)'); panel.addColorStop(.18, 'rgba(44,81,210,0.97)'); panel.addColorStop(1, BLUE);
      ctx.fillStyle = panel; ctx.fillRect(0, panelTop, SIZE, 364);

      const category = labelFor(contentType);
      ctx.font = '400 34px Arial, sans-serif';
      const categoryWidth = ctx.measureText(category).width + 38;
      ctx.fillStyle = '#FAF8F2'; ctx.strokeStyle = NAVY; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.roundRect(32, 710, categoryWidth, 48, 24); ctx.fill(); ctx.stroke();
      ctx.fillStyle = BLUE; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(category, 49, 743);

      const headline = fitLines(ctx, title || 'Your article headline', 1138, 2, 46, 34, 600);
      ctx.font = `600 ${headline.size}px Arial, sans-serif`; ctx.fillStyle = '#fff';
      headline.lines.forEach((line, index) => ctx.fillText(line, 32, 830 + index * 53));

      const summary = fitLines(ctx, excerpt || 'Your article summary will appear here.', 1125, 2, 28, 23, 400);
      ctx.font = `400 ${summary.size}px Arial, sans-serif`;
      summary.lines.forEach((line, index) => ctx.fillText(line, 32, 951 + index * 34));

      const credit = 'By: ' + (authorName || 'Campus Radar');
      ctx.textAlign = 'right'; let creditSize = 36;
      while (creditSize > 24) {
        ctx.font = `600 ${creditSize}px Arial, sans-serif`;
        if (ctx.measureText(credit).width <= 760) break;
        creditSize--;
      }
      ctx.fillStyle = '#fff'; ctx.fillText(credit, 1165, 1083);

      ctx.fillStyle = '#fff'; ctx.fillRect(0, 1122, SIZE, 78);
      ctx.fillStyle = BLUE; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.font = '400 23px Arial, sans-serif'; ctx.fillText('READ MORE: www.' + DOMAIN, 52, 1161);
      const cy = 1161;
      ctx.fillStyle = BLUE; ctx.beginPath(); ctx.arc(735, cy, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 21px Arial, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('f', 735, cy + 1);
      ctx.strokeStyle = BLUE; ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.beginPath();
      ctx.moveTo(765, cy - 11); ctx.lineTo(786, cy + 11); ctx.moveTo(786, cy - 11); ctx.lineTo(765, cy + 11); ctx.stroke();
      ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(814, cy - 13); ctx.lineTo(814, cy + 5);
      ctx.moveTo(814, cy - 13); ctx.quadraticCurveTo(823, cy - 10, 827, cy - 5); ctx.stroke();
      ctx.beginPath(); ctx.arc(809, cy + 7, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = BLUE; ctx.lineWidth = 2.8; ctx.beginPath(); ctx.roundRect(840, cy - 12, 24, 24, 6); ctx.stroke();
      ctx.beginPath(); ctx.arc(852, cy, 5.5, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(859, cy - 7, 1.4, 0, Math.PI * 2); ctx.fill();
      ctx.textAlign = 'left'; ctx.font = '400 19px Arial, sans-serif'; ctx.fillText('@campusradarfunaab', 878, 1162);

      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not export the thumbnail.')), 'image/png'));
      const url = URL.createObjectURL(blob), anchor = document.createElement('a');
      anchor.href = url; anchor.download = (title || 'campus-radar-thumbnail').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.png';
      anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Thumbnail export failed.');
    } finally { setDownloading(false); }
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
          <div className="absolute left-[4.33%] top-[4.33%] h-[6.92%] w-[18.67%] overflow-hidden bg-[#FAF8F2]"><img src="/campusradar.svg" alt="Campus Radar" className="absolute left-[7.75%] top-[-93.63%] h-[286.5%] w-[84.27%] max-w-none" /></div>
          <div className="absolute right-[4.33%] top-[4.33%] max-w-[52%] rounded-full border border-[#233F9E] bg-[#FAF8F2] px-[2%] py-[0.8%] text-center text-[clamp(8px,2.1vw,15px)] leading-tight text-[#2C51D2]">{displayDate(date)}</div>
          <div className="absolute inset-x-0 top-[63.17%] h-[30.33%] bg-gradient-to-b from-[#2C51D2]/85 via-[#2C51D2]/[0.97] to-[#2C51D2]" />
          <div className="absolute left-[2.67%] top-[59.17%] max-w-[70%] rounded-full border border-[#233F9E] bg-[#FAF8F2] px-[1.6%] py-[0.55%] text-[clamp(9px,2vw,16px)] leading-tight text-[#2C51D2]">{labelFor(contentType)}</div>
          <div className="absolute inset-x-[2.67%] top-[68.5%] h-[22%] overflow-hidden">
            <h3 className="line-clamp-2 break-words text-[clamp(16px,3.8vw,31px)] font-semibold leading-[1.08]">{title || 'Your article headline'}</h3>
            <p className="mt-[1.6%] line-clamp-2 break-words text-[clamp(9px,2.25vw,17px)] leading-[1.15]">{excerpt || 'Your article summary will appear here.'}</p>
          </div>
          <p className="absolute bottom-[9.4%] right-[2.9%] max-w-[65%] truncate text-right text-[clamp(10px,2.8vw,21px)] font-semibold leading-none">By: {authorName || 'Campus Radar'}</p>
          <div className="absolute inset-x-0 bottom-0 flex h-[6.5%] items-center justify-between gap-2 bg-white px-[4.33%] text-[#2C51D2]">
            <span className="min-w-0 truncate text-[clamp(7px,1.65vw,13px)] leading-none">READ MORE: www.{DOMAIN}</span>
            <div className="flex shrink-0 items-center gap-[clamp(3px,0.55vw,6px)]">
              <Facebook className="h-[clamp(10px,2.1vw,15px)] w-[clamp(10px,2.1vw,15px)]" strokeWidth={2.4} fill={BLUE} color={BLUE} />
              <span className="text-[clamp(9px,1.7vw,13px)] font-semibold leading-none">X</span>
              <Music2 className="h-[clamp(10px,2.1vw,15px)] w-[clamp(10px,2.1vw,15px)]" strokeWidth={2.4} />
              <Instagram className="h-[clamp(10px,2.1vw,15px)] w-[clamp(10px,2.1vw,15px)]" strokeWidth={2.2} />
              <span className="whitespace-nowrap text-[clamp(6px,1.35vw,10px)] leading-none">@campusradarfunaab</span>
            </div>
          </div>
        </div>
      </div>
      {!coverImage && <p className="mt-3 text-xs text-amber-700">Select a cover image to enable PNG download.</p>}
      {downloadError && <p className="mt-3 text-sm text-red-600">{downloadError}</p>}
    </section>
  );
}
