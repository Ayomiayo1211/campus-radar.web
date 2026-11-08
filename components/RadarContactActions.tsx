type RadarContactActionsProps = {
  summary: string;
};

function toWhatsAppNumber(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('0')) return `234${digits.slice(1)}`;
  if (digits.length === 10) return `234${digits}`;
  return digits;
}

export function RadarContactActions({ summary }: RadarContactActionsProps) {
  const candidates = summary.match(/\+?\d[\d\s().-]{7,}\d/g) ?? [];
  const contacts = Array.from(
    new Map(
      candidates
        .map((value) => ({ value: value.trim(), digits: value.replace(/\D/g, '') }))
        .filter((item) => item.digits.length >= 10 && item.digits.length <= 15)
        .map((item) => [item.digits, item])
    ).values()
  );

  if (!contacts.length) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {contacts.map((contact) => (
        <div key={contact.digits} className="flex flex-wrap items-center gap-2">
          <a
            href={`https://wa.me/${toWhatsAppNumber(contact.value)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full bg-[#168A52] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#116D40]"
          >
            WhatsApp · {contact.value}
          </a>
          <a
            href={`tel:${contact.value.replace(/[^\d+]/g, '')}`}
            className="inline-flex items-center rounded-full border border-[var(--line)] px-3 py-2 text-xs font-bold text-[var(--ink)] transition hover:bg-[var(--surface)]"
          >
            Call
          </a>
        </div>
      ))}
    </div>
  );
}
