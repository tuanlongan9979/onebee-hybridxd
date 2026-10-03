// POST /api/lead — nhận đăng ký tư vấn từ website, lưu thành file JSON riêng tư trên Vercel Blob.
// Cần biến môi trường BLOB_READ_WRITE_TOKEN (Vercel tự thêm khi kết nối Blob store với project).
const crypto = require('crypto');
const { put } = require('@vercel/blob');
const { INTERESTS, PACKAGES, REQUESTS, ROLES, PREFIX, parseBody } = require('./_shared');

const clean = (v, max) => String(v ?? '').trim().slice(0, max);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Chỉ nhận POST' });
  }

  const b = parseBody(req);
  if (!b) return res.status(400).json({ ok: false, error: 'Dữ liệu không hợp lệ' });

  // Bẫy bot: trường ẩn "website" phải để trống
  if (b.website) return res.status(200).json({ ok: true });

  const lead = {
    createdAt: new Date().toISOString(),
    name: clean(b.name, 100),
    phone: clean(b.phone, 20).replace(/[\s.]/g, ''),
    company: clean(b.company, 150),
    role: ROLES.includes(b.role) ? b.role : null,
    interest: INTERESTS.includes(b.interest) ? b.interest : 'Chưa xác định',
    package: PACKAGES.includes(b.package) ? b.package : 'Chưa chọn',
    request: REQUESTS.includes(b.request) ? b.request : 'Tư vấn giải pháp',
    note: clean(b.note, 500),
    viewed: Array.isArray(b.viewed) ? b.viewed.filter((v) => INTERESTS.includes(v)) : [],
    source: clean(b.source, 60) || 'Đăng ký tư vấn',
    status: 'Mới',
  };

  if (lead.name.length < 2 || lead.company.length < 2 || !lead.role || !/^(\+84|0)\d{9,10}$/.test(lead.phone)) {
    return res.status(400).json({ ok: false, error: 'Thiếu hoặc sai thông tin bắt buộc' });
  }

  const id = `${lead.createdAt.replace(/[:.]/g, '-')}-${crypto.randomBytes(3).toString('hex')}`;
  try {
    await put(`${PREFIX}${id}.json`, JSON.stringify(lead), {
      access: 'private',
      contentType: 'application/json; charset=utf-8',
      addRandomSuffix: false,
    });
    return res.status(200).json({ ok: true, id });
  } catch (err) {
    console.error('Blob put failed', err);
    return res.status(502).json({ ok: false, error: 'Không lưu được đăng ký' });
  }
};
