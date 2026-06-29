// Cloudflare Pages Function: doda email v Brevo kontaktno listo (single opt-in).
// Dostopna na POST /subscribe. API ključ ostane na strežniku (NIKOLI v brskalniku).
//
// Nastavi v Cloudflare dashboard → Pages projekt → Settings → Environment variables
// (Production IN Preview):
//   BREVO_API_KEY      = <tvoj Brevo v3 API ključ>
//   BREVO_LIST_ID      = <ID Brevo liste, npr. 3>
//   BREVO_SENDER_NAME  = NowaDaysPosts            (neobvezno)
//   SITE_URL           = https://nowadaysposts.pages.dev  (neobvezno; za welcome link)
//
// Obrazec na strani POSTa { email } sem (Newsletter.astro -> fetch('/subscribe')).
// Cloudflare Pages env vars pridejo prek context.env (NE process.env).

export async function onRequestPost(context) {
  const { request, env } = context;

  let email;
  try {
    ({ email } = await request.json());
  } catch {
    return json(400, { error: 'Bad request' });
  }

  const valid =
    typeof email === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
  if (!valid) {
    return json(400, { error: 'Please enter a valid email address.' });
  }

  const apiKey = env.BREVO_API_KEY;
  const listId = parseInt(env.BREVO_LIST_ID || '0', 10);
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
      if (resp.status === 201) {
        // nov naročnik -> pozdravni email (best-effort; ne sme zrušiti prijave)
        await sendWelcome(env, apiKey, email.trim()).catch(() => {});
      }
      return json(200, { ok: true });
    }
    const data = await resp.json().catch(() => ({}));
    if (data.code === 'duplicate_parameter') {
      return json(200, { ok: true }); // že naročen = uspeh
    }
    return json(502, { error: data.message || 'Subscription failed. Try again.' });
  } catch {
    return json(502, { error: 'Network error. Try again.' });
  }
}

// GET / ostale metode -> 405 (Pages sicer vrne privzeto; ekspliciten je lepši).
export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return json(405, { error: 'Method not allowed' });
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

// Pozdravni email novemu naročniku (Brevo transactional). Best-effort: če manjka
// verificiran sender, tiho preskoči (prijava vseeno uspe).
async function sendWelcome(env, apiKey, email) {
  // VEDNO auto-detect verificiranega senderja iz Brevo računa (zanesljivo; brez
  // tveganja napačnega senderja). IME pusti brand (NowaDaysPosts).
  let senderEmail = null;
  const senderName = env.BREVO_SENDER_NAME || 'NowaDaysPosts';
  try {
    const sr = await fetch('https://api.brevo.com/v3/senders', {
      headers: { 'api-key': apiKey, accept: 'application/json' },
    });
    if (!sr.ok) return;
    const sdata = await sr.json().catch(() => ({}));
    const list = Array.isArray(sdata.senders) ? sdata.senders : [];
    const chosen = list.find((s) => s.active) || list[0];
    if (chosen && chosen.email) senderEmail = chosen.email;
  } catch {
    return;
  }
  if (!senderEmail) return;
  const site = (env.SITE_URL || 'https://nowadaysposts.pages.dev').replace(/\/$/, '');
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
  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email }],
      subject: 'Welcome to NowaDaysPosts 🏡',
      htmlContent: html,
    }),
  });
}
