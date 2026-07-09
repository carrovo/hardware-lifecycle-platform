// 状态 badge：Linear 风格 chip —— 极浅底 + 细边框 + 语义色圆点，不使用夸张色块。
// 语义：neutral=灰(未开始/待办/终态)，info=蓝(进行中)，success=绿(通过/完成)，
//       warning=琥珀(需关注)，danger=红(异常/NG/超期)，purple=紫(少量强调)。

// 按语义分组的状态集合
const TONE_GROUPS = {
  success: [
    '合格', '通过', 'Pass', '已通过', '测试通过', '已完成', '已验收', '已交付', '在线运营',
    '已解决', '已处理', '有效', '已齐套', '已装配', '已入库', '已录入待测试', '已填写',
    '可交付', '已出厂', '已关单',
  ],
  info: [
    '装配中', '整机装配', '功能测试中', '半成品检验中', '初测中', '处理中', '现场处理中',
    '生产中', '交付中', '进行中', '出厂检验中', '录入中', '测试中', '已绑定', '待出厂检验',
    '安装调试中', '现场安装调试中', '出厂检验', '现场安装调试', '整机入库', '来料准备',
    '已生成工单', '工单处理中',
  ],
  warning: [
    '特批使用', '老化测试中', '终测中', '中测中', 'OQT终测中', '轻微', '待处理', '待分派',
    '部分齐套', '待确认装配完成', '待补齐模块', '待补齐标签', '待返修', '部分填写',
    '待确认出厂', '库存不足', '长期未结', '当前卡点',
  ],
  danger: [
    '不合格', '退货换货', '返修中', '生产返修中', '生产返修', '严重', 'NG', '未通过', '缺料',
    '装配异常', '测试NG', '不可入库', '不可出厂', '安装异常', '验收异常', '已延期', '超期', '高',
  ],
  purple: ['质量测试', '复检中', '客户验收中', '待客户验收', '绑定设备', '客户验收'],
  neutral: [
    '待装配', '已占用', '退役', '已报废', '待分配项目', '未开始', '已暂停', '已关闭', '已作废',
    '待测试', '待检验', '待录入', '待验收', '待关联', '未填写', '待确认', '待绑定', '待交付',
    '待接单', '待上门', '已取消', '未知', '离线', '未接入', '待入库', '已分配项目', '中', '低',
    '在线', '待关单',
  ],
};

const TONE_STYLE = {
  neutral: { chip: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
  info: { chip: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  success: { chip: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  warning: { chip: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  danger: { chip: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  purple: { chip: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
};

const STATUS_TONE = {};
Object.entries(TONE_GROUPS).forEach(([tone, list]) => list.forEach((s) => { STATUS_TONE[s] = tone; }));

function statusTone(status) {
  return STATUS_TONE[status] || 'neutral';
}

export default function StatusBadge({ status, size = 'sm', dot = true }) {
  const tone = TONE_STYLE[statusTone(status)] || TONE_STYLE.neutral;
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-[13px] px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-1.5 border rounded-md font-medium whitespace-nowrap ${tone.chip} ${sizeClass}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tone.dot}`} />}
      {status}
    </span>
  );
}
