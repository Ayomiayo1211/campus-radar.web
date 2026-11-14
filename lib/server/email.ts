type ResendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

function requiredEnv(name: string, cloudflareEnv?: Record<string, unknown>): string {
  const bindingValue = cloudflareEnv?.[name];
  const value = (typeof bindingValue === 'string' ? bindingValue : process.env[name])?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export async function sendEmail(
  { to, subject, html, env }: ResendEmailInput & { env?: Record<string, unknown> },
) {
  const apiKey = requiredEnv('RESEND_API_KEY', env);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Campus Radar <admin@campusradarfunaab.com.ng>',
      to: [to],
      subject,
      html,
      reply_to: 'hello@campusradarfunaab.com.ng',
    }),
  });

  const result = await response.json().catch(() => ({})) as {
    id?: string;
    message?: string;
    name?: string;
  };

  if (!response.ok || !result.id) {
    const detail = result.message || result.name || `HTTP ${response.status}`;
    console.error('[resend diagnostic] Email delivery failed:', response.status, detail);
    throw new Error(`Resend email failed (${response.status}): ${detail}`);
  }

  return result as { id: string };
}
