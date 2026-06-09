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
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}
