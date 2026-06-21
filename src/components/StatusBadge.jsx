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
  '已激活':    'bg-green-100 text-green-700 border-green-300',
  // Device flow — anomaly (red)
  '返修中':    'bg-red-100 text-red-700 border-red-300',
  // Record meta-status
  '有效': 'bg-green-100 text-green-700 border-green-300',
  '作废': 'bg-gray-100 text-gray-500 border-gray-300',
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
