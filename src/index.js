// Discord auto check-in: sends MESSAGE from each account (TOKEN_1..TOKEN_12) every INTERVAL_HOURS (default 6) + random 20-120s.
const rand = () => 20000 + Math.floor(Math.random() * 100000); // 20s..120s
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ACCOUNTS = Array.from({ length: 12 }, (_, i) => `TOKEN_${i + 1}`);

async function send(env, token) {
  const r = await fetch(`https://discord.com/api/v9/channels/${env.CHANNEL_ID}/messages`, {
    method: "POST",
    headers: { Authorization: token, "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36" },
    body: JSON.stringify({ content: env.MESSAGE || "checkin", tts: false,
      nonce: String(BigInt(Date.now() - 1420070400000) << 22n) }),
  });
  return { status: r.status, body: (await r.text()).slice(0, 200) };
}

async function runAccount(env, name) {
  const token = env[name];
  if (!token) return;
  const key = `checkin:${name}`;
  const st = JSON.parse((await env.STATE.get(key)) || "{}");
  const now = Date.now();
  if (st.nextAt && now < st.nextAt - 60000) return;      // not due yet
  if (st.lockUntil && now < st.lockUntil) return;         // another tick is handling it
  const wait = st.nextAt ? Math.max(0, st.nextAt - now) : rand();
  await env.STATE.put(key, JSON.stringify({ ...st, lockUntil: now + wait + 180000 }));
  await sleep(wait);
  const res = await send(env, token);
  const at = Date.now();
  const ok = res.status >= 200 && res.status < 300;
  const next = ok ? at + (Number(env.INTERVAL_HOURS) || 6) * 3600 * 1000 + rand() : at + 10 * 60000; // on failure retry in 10 min
  await env.STATE.put(key, JSON.stringify({ lastAt: ok ? at : st.lastAt, lastStatus: res.status,
    lastError: ok ? null : res.body, nextAt: next, fails: ok ? 0 : (st.fails || 0) + 1,
    history: [{ at, status: res.status, err: ok ? null : res.body.slice(0, 80) }, ...(st.history || [])].slice(0, 30) }));
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(Promise.all(ACCOUNTS.map((a) => runAccount(env, a))));
  },
  async fetch(req, env) {
    const out = {};
    for (const a of ACCOUNTS) {
      const st = JSON.parse((await env.STATE.get(`checkin:${a}`)) || "{}");
      const f = (t) => (t ? new Date(t).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) + " WIB" : null);
      out[a] = { tokenSet: !!env[a], lastCheckin: f(st.lastAt), next: f(st.nextAt), lastStatus: st.lastStatus ?? null, lastError: st.lastError ?? null,
        history: (st.history || []).map((h) => `${f(h.at)} ${h.status === 200 || h.status === 201 ? "OK" : "GAGAL " + h.status}`) };
    }
    return new Response(JSON.stringify(out, null, 2), { headers: { "content-type": "application/json" } });
  },
};
