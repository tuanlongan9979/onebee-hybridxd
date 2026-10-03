// Dùng chung cho api/lead.js và api/leads.js (file bắt đầu bằng "_" không thành endpoint trên Vercel)

const INTERESTS = [
  'Quản lý dự án',
  'Dự toán & Dự thầu',
  'Thẩm tra thiết kế',
  'Thanh quyết toán',
  'Kiểm thử & Nghiệm thu',
  'Hồ sơ & Cấp phép',
  'Chưa xác định',
];
const PACKAGES = [
  'Chưa chọn',
  'Combo 1 · Tư vấn & Giám sát',
  'Combo 2 · Nhà thầu thi công',
  'Combo 3 · Chủ đầu tư',
  'Lark CB', 'Lark NC', 'Lark Admin',
  'QLDA Full', 'Giám sát Hiện trường', 'Tư vấn Thiết kế',
];
const REQUESTS = ['Tư vấn giải pháp', 'Dùng thử Demo 7 ngày', 'Nhận bảng tính ROI'];
const ROLES = ['Chủ đầu tư', 'Nhà thầu', 'Tư vấn'];

// Mỗi đăng ký là 1 file JSON riêng tư: leads/<thời gian ISO>-<ngẫu nhiên>.json
const PREFIX = 'leads/';

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch { return null; }
}

module.exports = { INTERESTS, PACKAGES, REQUESTS, ROLES, PREFIX, parseBody };
