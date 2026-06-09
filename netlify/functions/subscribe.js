// Netlify serverless funkcija: doda email v Brevo kontaktno listo (single opt-in).
// API ključ ostane na strežniku (NIKOLI v brskalniku).
//
// Nastavi v Netlify dashboard → Site settings → Environment variables:
//   BREVO_API_KEY = <tvoj Brevo v3 API ključ>
//   BREVO_LIST_ID = <ID Brevo liste, npr. 2>
//
// Obrazec na strani POSTa { email } sem (/.netlify/functions/subscribe).

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  let email;
  try {
    ({ email } = JSON.parse(event.body || '{}'));
  } catch {
    return json(400, { error: 'Bad request' });
  }

  const valid =
    typeof email === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
  if (!valid) {
    return json(400, { error: 'Please enter a valid email address.' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const listId = parseInt(process.env.BREVO_LIST_ID || '0', 10);
  if (!apiKey || !listId) {
    return json(500, { error: 'Newsletter is not configured yet.' });
  }

  try {
    const resp = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        email: email.trim(),
        listIds: [listId],
        updateEnabled: true, // če kontakt obstaja -> ga le posodobi (204)
      }),
    });

    if (resp.status === 201 || resp.status === 204) {
      let welcome = resp.status === 204 ? 'skipped:existing-contact' : 'pending';
      if (resp.status === 201) {
        welcome = await sendWelcome(apiKey, email.trim()).catch(
          (e) => 'error:' + (e && e.message ? e.message : 'unknown'));
      }
      return json(200, { ok: true, welcome });
    }
    const data = await resp.json().catch(() => ({}));
    if (data.code === 'duplicate_parameter') {
      return json(200, { ok: true }); // že naročen = uspeh
    }
    return json(502, { error: data.message || 'Subscription failed. Try again.' });
  } catch {
    return json(502, { error: 'Network error. Try again.' });
  }
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}

// Pozdravni email novemu naročniku (Brevo transactional). Best-effort: če manjka
// BREVO_SENDER_EMAIL, tiho preskoči (prijava vseeno uspe).
async function sendWelcome(apiKey, email) {
  // VEDNO auto-detect verificiranega senderja iz Brevo računa (zanesljivo; brez
  // tveganja napačnega BREVO_SENDER_EMAIL). Vrne status string za debug.
  let senderEmail = null;
  let senderName = process.env.BREVO_SENDER_NAME || 'NowaDaysPosts';
  try {
    const sr = await fetch('https://api.brevo.com/v3/senders', {
      headers: { 'api-key': apiKey, accept: 'application/json' },
    });
    if (!sr.ok) return 'senders-http:' + sr.status;
    const sdata = await sr.json().catch(() => ({}));
    const list = Array.isArray(sdata.senders) ? sdata.senders : [];
    const chosen = list.find((s) => s.active) || list[0];
    if (chosen && chosen.email) {
      senderEmail = chosen.email;
      if (chosen.name) senderName = chosen.name;
    }
  } catch (e) {
    return 'senders-error:' + (e && e.message ? e.message : 'unknown');
  }
  if (!senderEmail) return 'no-sender';
  const site = (process.env.SITE_URL || 'https://nowadaysposts.netlify.app').replace(/\/$/, '');
  const html = `<!doctype html><html><body style="margin:0;background:#f6f1e9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e9;font-family:Arial,sans-serif;"><tr><td align="center" style="padding:28px 14px;">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:100%;">
      <tr><td align="center" style="font-family:Georgia,serif;font-size:24px;font-weight:bold;color:#2f2c2b;padding-bottom:4px;">${senderName}</td></tr>
      <tr><td align="center" style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#be7456;padding-bottom:22px;">Welcome aboard</td></tr>
      <tr><td style="background:#ffffff;border-radius:18px;padding:28px 26px;color:#2f2c2b;font-size:15px;line-height:1.6;">
        <p style="margin:0 0 14px;font-family:Georgia,serif;font-size:20px;font-weight:bold;">You're in! 🏡</p>
        <p style="margin:0 0 14px;color:#5c554f;">Thanks for joining. A few times a week we'll send you the prettiest, top-rated home decor finds — hand-picked, no spam.</p>
        <p style="margin:0 0 22px;color:#5c554f;">Can't wait? Browse the latest finds right now:</p>
        <p style="margin:0;"><a href="${site}?utm_source=email&utm_medium=welcome" style="display:inline-block;background:#2f2c2b;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:13px 28px;border-radius:999px;">Browse the latest finds &rarr;</a></p>
      </td></tr>
      <tr><td align="center" style="font-size:11px;color:#7a716a;padding:20px 10px 0;line-height:1.6;">As an Amazon Associate I earn from qualifying purchases.<br>You signed up at ${senderName}. Not you? Just reply and we'll remove you.</td></tr>
    </table>
  </td></tr></table></body></html>`;
  const wr = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email }],
      subject: 'Welcome to NowaDaysPosts 🏡',
      htmlContent: html,
    }),
  });
  if (wr.status === 201 || wr.ok) return 'sent:' + senderEmail;
  const wt = await wr.text().catch(() => '');
  return 'send-failed:' + wr.status + ':' + wt.slice(0, 140);
}
