// 状态 badge：Linear 风格 chip —— 极浅底 + 细边框 + 语义色圆点。
// 统一配色规则（全平台同一状态同一色）：
//   success 绿：已完成 / Pass / 已入库 / 已关单 等达成/通过/终态正向
//   info    蓝：进行中 / 生产中 / 交付中 / 现场处理中 等进行中
//   test    紫：质量测试 / 工站测试（半成品检验/初测/中测/OQT/复测 等）
//   neutral 灰：待处理 / 待分派 / 待接单 / 待上门 / 未接入 等待办/未开始/中性态
//   warning 橙：预警 / 长期未结 / 延期 / 待验收 等需关注
//   danger  红：NG / 阻塞 / 超时 / 严重 / 生产返修中 等异常
//   erp     中性浅蓝：ERP 只读同步 / 同步中 / 只读 等（不使用强业务状态色）

const TONE_GROUPS = {
  success: [
    '已完成', '已完成测试', 'Pass', '通过', '已通过', '测试通过', '复测通过', '检验合格', '合格',
    '已入库', '已关单', '已验收', '已交付', '在线运营', '已解决', '已处理', '有效', '已齐套', '已装配',
    '可交付', '已出厂', '无明显卡点', '已同步过', '已换件', '旧件已返修', '已更换', '已返修', '在线',
  ],
  info: [
    '进行中', '生产中', '交付中', '现场处理中', '装配中', '整机装配', '模块绑定中', '模块绑定',
    '来料准备', '整机入库', '已绑定', '安装调试中', '现场安装调试中', '出厂检验中', '录入中',
    '已生成工单', '工单处理中', '已生成售后工单', '已生成问题', '已领料', '设备识别', '部分入库',
  ],
  test: [
    '质量测试', '质量测试中', '工站测试', '半成品检验中', '半成品检验', '初测中', '初测', '中测中', '中测',
    'OQT中', 'OQT终测中', 'OQT终测', 'OQT', '复测中', '复检中', '客户验收中', '待客户验收', '绑定设备', '客户验收',
  ],
  warning: [
    '预警', '长期未结', '当前卡点', '延期', '已延期', '待验收', '待复测', '待检', '特批使用',
    '老化测试中', '终测中', '轻微', '部分齐套', '待确认装配完成', '待确认出厂', '待补齐模块', '待补齐标签',
    '待返修', '库存不足', '旧件待返修', '现场条件未满足', '同步中', '待接口补齐',
  ],
  danger: [
    'NG', '测试NG', 'NG待返修', '不合格', '检验不合格', '复测未通过', '未通过', '验收不通过', '严重', '高',
    '生产返修中', '生产返修', '阻塞', '超时', '节点超时', '同步异常', '退货换货', '装配异常', '安装异常',
    '验收异常', '缺料', '不可入库', '不可出厂', '异常',
  ],
  neutral: [
    '待处理', '待分派', '待接单', '待上门', '未接入', '未知', '离线', '未开始', '未测试', '待测试',
    '待录入', '待关联', '未填写', '待确认', '待绑定', '未绑定', '待交付', '待领料', '已占用', '待装配',
    '已停用', '已报废', '退役', '已作废', '已取消', '已关闭', '售后中', '维修中', '待入库', '已分配项目',
    '其他', '已转售后', '中', '低', '在库可用', '已锁定生产计划',
  ],
  erp: [
    'ERP 只读同步', '只读同步', '只读', '已同步', '待同步', 'ERP 无返回', 'ERP无返回', 'ERP 待接口补齐',
    'ERP待接口补齐', '未入库',
  ],
};

const TONE_STYLE = {
  neutral: { chip: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
  info: { chip: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  success: { chip: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  warning: { chip: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  danger: { chip: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  test: { chip: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  purple: { chip: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  erp: { chip: 'bg-slate-50 text-slate-500 border-slate-200', dot: 'bg-slate-400' },
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
