import { Buffer } from 'node:buffer';

type GmailSendInput = {
  to: string;
  subject: string;
  html: string;
};

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export async function sendGmailMessage({ to, subject, html }: GmailSendInput) {
  const clientId = requiredEnv('GMAIL_CLIENT_ID');
  const clientSecret = requiredEnv('GMAIL_CLIENT_SECRET');
  const refreshToken = requiredEnv('GMAIL_REFRESH_TOKEN');
  const senderEmail = requiredEnv('GMAIL_SENDER_EMAIL');

  if (!/^[^\s@]+@gmail\.com$/i.test(senderEmail)) {
    throw new Error('GMAIL_SENDER_EMAIL must be the Gmail account authorised with Google');
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const tokenData = await tokenResponse.json() as { access_token?: string; error?: string; error_description?: string };
  if (!tokenResponse.ok || !tokenData.access_token) {
    console.error('[gmail] OAuth token refresh failed:', tokenData.error || tokenResponse.status);
    throw new Error('Gmail authentication failed. Check the Google OAuth configuration.');
  }

  const encodedHtml = Buffer.from(html, 'utf8').toString('base64');
  const mimeMessage = [
    `From: Campus Radar <${senderEmail}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    encodedHtml,
  ].join('\r\n');

  const raw = Buffer.from(mimeMessage, 'utf8').toString('base64url');
  const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (!sendResponse.ok) {
    const detail = await sendResponse.text();
    console.error(`[gmail] Message send failed (HTTP ${sendResponse.status}): ${detail.slice(0, 800)}`);
    throw new Error('Gmail could not send the message. Check the sender account and Gmail API permissions.');
  }

  return await sendResponse.json() as { id?: string; threadId?: string };
}
