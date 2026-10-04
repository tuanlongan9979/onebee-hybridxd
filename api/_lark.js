// Ghi 1 bản ghi vào Lark Base qua Open API. Dùng chung cho api/lead.js (file bắt đầu bằng "_" không thành endpoint).
// Biến môi trường: LARK_APP_ID, LARK_APP_SECRET, LARK_BASE_TOKEN, LARK_TABLE_ID, LARK_DOMAIN (tùy chọn, mặc định Lark quốc tế).

const REQUIRED = ['LARK_APP_ID', 'LARK_APP_SECRET', 'LARK_BASE_TOKEN', 'LARK_TABLE_ID'];
// Mã lỗi Lark khi tenant_access_token hết hạn hoặc không hợp lệ: lấy token mới rồi thử lại 1 lần
const TOKEN_ERRORS = [99991661, 99991663, 99991668];
const TIMEOUT_MS = 8000;

let cache = { token: '', expiresAt: 0 };

const domain = () => (process.env.LARK_DOMAIN || 'https://open.larksuite.com').replace(/\/+$/, '');

const isConfigured = () => REQUIRED.every((k) => process.env[k]);

async function postJson(url, body, headers = {}) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  return r.json().catch(() => ({}));
}

async function getToken(force) {
  if (!force && cache.token && Date.now() < cache.expiresAt) return cache.token;
  const j = await postJson(`${domain()}/open-apis/auth/v3/tenant_access_token/internal`, {
    app_id: process.env.LARK_APP_ID,
    app_secret: process.env.LARK_APP_SECRET,
  });
  if (j.code !== 0 || !j.tenant_access_token) throw new Error(`Lark token ${j.code}: ${j.msg}`);
  // Trừ 60 giây để không dùng token sát lúc hết hạn
  cache = { token: j.tenant_access_token, expiresAt: Date.now() + Math.max(0, (j.expire || 0) - 60) * 1000 };
  return cache.token;
}

// Trả về record_id; ném lỗi (chỉ có mã + thông báo của Lark, không có bí mật) nếu không ghi được
async function addRecord(fields) {
  const url = `${domain()}/open-apis/bitable/v1/apps/${process.env.LARK_BASE_TOKEN}/tables/${process.env.LARK_TABLE_ID}/records`;
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await getToken(attempt > 0);
    const j = await postJson(url, { fields }, { Authorization: `Bearer ${token}` });
    if (j.code === 0) return j.data && j.data.record && j.data.record.record_id;
    if (attempt === 0 && TOKEN_ERRORS.includes(j.code)) continue;
    throw new Error(`Lark record ${j.code}: ${j.msg}`);
  }
}

module.exports = { isConfigured, addRecord };
