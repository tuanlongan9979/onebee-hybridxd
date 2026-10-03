// GET /api/leads — danh sách đăng ký cho trang /admin. Bắt buộc header x-admin-key = ADMIN_KEY.
const crypto = require('crypto');
const { list, get } = require('@vercel/blob');
const { PREFIX } = require('./_shared');

function authorized(req) {
  const want = process.env.ADMIN_KEY || '';
  const got = String(req.headers['x-admin-key'] || '');
  if (!want || got.length !== want.length) return false;
  return crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

async function readLead(pathname) {
  const r = await get(pathname, { access: 'private', useCache: false });
  if (!r || !r.stream) return null;
  const lead = JSON.parse(await new Response(r.stream).text());
  return { id: pathname.slice(PREFIX.length).replace(/\.json$/, ''), ...lead };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Chỉ nhận GET' });
  }
  if (!authorized(req)) return res.status(401).json({ ok: false, error: 'Sai mã quản trị' });

  try {
    const blobs = [];
    let cursor;
    do {
      const page = await list({ prefix: PREFIX, cursor, limit: 1000 });
      blobs.push(...page.blobs);
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);

    // Đọc song song theo lô 20 để không quá tải
    const leads = [];
    for (let i = 0; i < blobs.length; i += 20) {
      const batch = await Promise.all(blobs.slice(i, i + 20).map((b) => readLead(b.pathname).catch(() => null)));
      leads.push(...batch.filter(Boolean));
    }
    leads.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return res.status(200).json({ ok: true, count: leads.length, leads });
  } catch (err) {
    console.error('Blob list failed', err);
    return res.status(502).json({ ok: false, error: 'Không đọc được dữ liệu' });
  }
};
