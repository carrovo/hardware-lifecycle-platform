// Color spec: blue=in-progress, amber=attention node, green=complete, red=anomaly
const statusColorMap = {
  // Inspection results
  '合格':    'bg-green-100 text-green-700 border-green-300',
  '不合格':  'bg-red-100 text-red-700 border-red-300',
  '特批使用': 'bg-yellow-100 text-yellow-700 border-yellow-300',
  // Material/inventory status
  '待装配':  'bg-gray-100 text-gray-600 border-gray-300',
  '已占用':  'bg-slate-100 text-slate-600 border-slate-300',
  '退货换货': 'bg-red-100 text-red-700 border-red-300',
  // Device flow — neutral/in-progress (blue)
  '装配中':    'bg-blue-100 text-blue-700 border-blue-300',
  '整机装配':  'bg-blue-100 text-blue-700 border-blue-300',
  '功能测试中': 'bg-blue-100 text-blue-700 border-blue-300',
  // Device flow — attention node (amber)
  '老化测试中': 'bg-amber-100 text-amber-700 border-amber-300',
  '终测中':    'bg-amber-100 text-amber-700 border-amber-300',
  // Device flow — complete/available (green)
  '待分配项目': 'bg-green-100 text-green-700 border-green-300',
  '已分配项目': 'bg-teal-100 text-teal-700 border-teal-300',
  '在线运营':  'bg-emerald-100 text-emerald-700 border-emerald-300',
  // Device flow — retired (gray)
  '退役':     'bg-gray-200 text-gray-500 border-gray-300',
  // Device flow — anomaly (red)
  '返修中':    'bg-red-100 text-red-700 border-red-300',
  // Quality station statuses
  '半成品检验中': 'bg-blue-100 text-blue-700 border-blue-300',
  '初测中':    'bg-blue-100 text-blue-700 border-blue-300',
  '中测中':    'bg-amber-100 text-amber-700 border-amber-300',
  'OQT终测中': 'bg-amber-100 text-amber-700 border-amber-300',
  '生产返修中': 'bg-red-100 text-red-700 border-red-300',
  // Alert severity
  '轻微':     'bg-amber-100 text-amber-700 border-amber-300',
  '严重':     'bg-red-100 text-red-700 border-red-300',
  // Material / module status
  '维修中':   'bg-orange-100 text-orange-700 border-orange-300',
  '已报废':   'bg-gray-200 text-gray-500 border-gray-300',
  // Alert / work order status
  '待处理':   'bg-orange-100 text-orange-700 border-orange-300',
  '处理中':   'bg-blue-100 text-blue-700 border-blue-300',
  '已解决':   'bg-green-100 text-green-700 border-green-300',
  '已生成工单': 'bg-blue-100 text-blue-700 border-blue-300',
  '工单处理中': 'bg-indigo-100 text-indigo-700 border-indigo-300',
  '复检中':   'bg-purple-100 text-purple-700 border-purple-300',
  '已关闭':   'bg-gray-100 text-gray-500 border-gray-300',
  '已处理':   'bg-green-100 text-green-700 border-green-300',
  '已作废':   'bg-gray-100 text-gray-400 border-gray-200',
  // Work order severity
  '高':  'bg-red-100 text-red-700 border-red-300',
  '中':  'bg-amber-100 text-amber-700 border-amber-300',
  '低':  'bg-blue-100 text-blue-700 border-blue-300',
  // Delivery results
  'Pass':    'bg-green-100 text-green-700 border-green-300',
  'NG':      'bg-red-100 text-red-700 border-red-300',
  '待测试':  'bg-gray-100 text-gray-500 border-gray-300',
  '通过':    'bg-green-100 text-green-700 border-green-300',
  '未通过':  'bg-red-100 text-red-700 border-red-300',
  // Record meta-status
  '有效': 'bg-green-100 text-green-700 border-green-300',
  '作废': 'bg-gray-100 text-gray-500 border-gray-300',
  // v6 delivery/device statuses
  '待入库':      'bg-teal-100 text-teal-700 border-teal-300',
  '已入库':      'bg-teal-100 text-teal-700 border-teal-300',
  '出厂检验中':  'bg-blue-100 text-blue-700 border-blue-300',
  '现场安装调试中': 'bg-indigo-100 text-indigo-700 border-indigo-300',
  '客户验收中':  'bg-purple-100 text-purple-700 border-purple-300',
  // Plan/project statuses
  '未开始': 'bg-gray-100 text-gray-600 border-gray-300',
  '进行中': 'bg-blue-100 text-blue-700 border-blue-300',
  '生产中': 'bg-blue-100 text-blue-700 border-blue-300',
  '交付中': 'bg-blue-100 text-blue-700 border-blue-300',
  '已交付': 'bg-emerald-100 text-emerald-700 border-emerald-300',
  '已完成': 'bg-green-100 text-green-700 border-green-300',
  '已验收': 'bg-green-100 text-green-700 border-green-300',
  '已延期': 'bg-red-100 text-red-700 border-red-300',
  '已暂停': 'bg-gray-100 text-gray-500 border-gray-300',
  // Project / production / delivery nodes
  '来料准备': 'bg-cyan-100 text-cyan-700 border-cyan-300',
  '质量测试': 'bg-purple-100 text-purple-700 border-purple-300',
  '整机入库': 'bg-teal-100 text-teal-700 border-teal-300',
  '绑定设备': 'bg-slate-100 text-slate-700 border-slate-300',
  '出厂检验': 'bg-blue-100 text-blue-700 border-blue-300',
  '现场安装调试': 'bg-indigo-100 text-indigo-700 border-indigo-300',
  '客户验收': 'bg-green-100 text-green-700 border-green-300',
};

export default function StatusBadge({ status, size = 'sm' }) {
  const colorClass = statusColorMap[status] || 'bg-gray-100 text-gray-600 border-gray-300';
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  return (
    <span className={`inline-flex items-center border rounded font-medium ${colorClass} ${sizeClass}`}>
      {status}
    </span>
  );
}
