// Centralized status derivation & vocabularies.
// Goal: one place to map raw mock/device state -> the status label the UI shows,
// so project / production / delivery pages never disagree.

export const TODAY = '2026-07-01';

// Delivery / test results are stored as Pass / NG. Legacy mock used 通过 / 不通过.
export const isPass = (record) => !!record && ['Pass', '通过'].includes(record.result);
export const isNG = (record) => !!record && ['NG', '不通过', '未通过'].includes(record.result);

// ---- Project status ----------------------------------------------------------
export function projectStatus(project, productionPlans = [], deliveryPlans = []) {
  if (project.voided || project.status === '已作废') return '已作废';
  if (project.status) return project.status;
  const accepted = deliveryPlans
    .filter((p) => p.projectId === project.id)
    .reduce((sum, plan) => sum + (plan.records?.customerAccept || []).filter(isPass).length, 0);
  if (project.closedAt) return '已关闭';
  if (accepted >= (project.targetCount || 0) && project.targetCount > 0) return '已交付';
  if (productionPlans.some((plan) => plan.projectId === project.id)) return '进行中';
  return '未开始';
}

// ---- Production plan status --------------------------------------------------
// Canonical: 未开始 / 生产中 / 已完成 / 已延期 / 已作废
export function productionPlanStatus(plan, today = TODAY) {
  if (plan.status === '已作废') return '已作废';
  if (plan.status === '已完成') return '已完成';
  const raw = plan.status === '待开始'
    ? '未开始'
    : (plan.status === '进行中' || plan.status === '生产中')
      ? '生产中'
      : (plan.status || '未开始');
  if (plan.endDate && plan.endDate < today && !['已完成', '已作废', '未开始'].includes(raw)) return '已延期';
  return raw;
}

// ---- Delivery plan status ----------------------------------------------------
// Canonical: 未开始 / 交付中 / 已验收 / 已延期 / 已作废
export function deliveryPlanStatus(plan, today = TODAY) {
  if (plan.voided || plan.status === '已作废') return '已作废';
  const accepted = (plan.records?.customerAccept || []).filter(isPass).length;
  if (plan.status === '已验收' || (accepted >= (plan.targetCount || 0) && plan.targetCount > 0)) return '已验收';
  const raw = (plan.status === '进行中' || plan.status === '交付中') ? '交付中' : (plan.status || '未开始');
  if (plan.dueDate && plan.dueDate < today && !['未开始', '已验收', '已作废'].includes(raw)) return '已延期';
  return raw;
}

// ---- Device -> assembly node status -----------------------------------------
// Canonical: 未开始 / 装配中 / 待确认装配完成 / 已装配 / 装配异常
const ASSEMBLED_DONE = [
  '半成品检验中', '初测中', '中测中', 'OQT终测中', '测试通过', '测试NG', '返修中', '生产返修中',
  '功能测试中', '老化测试中', '终测中',
  '待入库', '已入库', '待分配项目', '已分配项目', '在线运营', '待交付', '可交付', '待出厂检验',
];
export function assemblyStatus(device) {
  const s = device.status;
  if (s === '装配异常') return '装配异常';
  if (s === '待确认装配完成') return '待确认装配完成';
  if (s === '装配中') return '装配中';
  if (s === '未开始') return '未开始';
  if (s === '整机装配') return device.placeholder ? '未开始' : '装配中';
  if (ASSEMBLED_DONE.includes(s)) return '已装配';
  return '未开始';
}

// ---- Device (+ latest record) -> quality-test node status --------------------
// Canonical: 待测试 / 半成品检验中 / 初测中 / 中测中 / OQT终测中 / 测试通过 / 测试NG / 返修中
const STATION_STATUSES = ['半成品检验中', '初测中', '中测中', 'OQT终测中'];
const TEST_PASSED_DOWNSTREAM = [
  '测试通过', '待入库', '已入库', '待分配项目', '已分配项目', '在线运营', '待交付', '可交付', '待出厂检验',
];
export function qualityStatus(device, latestRecord) {
  const s = device.status;
  if (s === '生产返修中' || s === '返修中') return '返修中';
  if (s === '测试NG') return '测试NG';
  if (STATION_STATUSES.includes(s)) return s;
  if (s === '功能测试中') return '初测中';
  if (s === '老化测试中') return '中测中';
  if (s === '终测中') return 'OQT终测中';
  if (TEST_PASSED_DOWNSTREAM.includes(s)) return '测试通过';
  if (latestRecord) {
    if (isNG(latestRecord)) return '测试NG';
    if (isPass(latestRecord)) return '测试通过';
  }
  return '待测试';
}

// ---- Delivery node derived statuses -----------------------------------------
export const resultLabel = (record, pendingLabel) => (record ? (isPass(record) ? 'Pass' : 'NG') : pendingLabel);

// 绑定设备节点当前状态: 待交付 / 可交付 / 待出厂检验
export function bindingDeviceStatus(device, isBound) {
  if (isBound) return '待出厂检验';
  if (['已入库', '待分配项目', '已分配项目'].includes(device.status)) return '可交付';
  return '待交付';
}

// 出厂检验节点出厂状态: 待出厂检验 / 待确认出厂 / 已出厂 / 不可出厂
export function factoryStageStatus(record) {
  if (!record) return '待出厂检验';
  return isPass(record) ? '已出厂' : '不可出厂';
}

// 现场安装调试节点当前状态: 安装调试中 / 安装异常 / 待客户验收
export function siteStageStatus(record) {
  if (!record) return '安装调试中';
  return isPass(record) ? '待客户验收' : '安装异常';
}

// 客户验收节点当前状态: 待客户验收 / 在线运营 / 验收异常
export function acceptStageStatus(record) {
  if (!record) return '待客户验收';
  return isPass(record) ? '在线运营' : '验收异常';
}

// ---- 设备资产台账：生命周期状态 & 当前业务节点 -----------------------------
// 生命周期状态只用：生产中 / 待入库 / 待交付 / 交付中 / 在线运营 / 维修中 / 已作废
export function deviceLifecycleStatus(device) {
  const s = device.status;
  if (['已作废', '退役', '已报废'].includes(s)) return '已作废';
  if (['维修中'].includes(s)) return '维修中';
  if (s === '在线运营') return '在线运营';
  if (['已分配项目', '出厂检验中', '现场安装调试中', '客户验收中'].includes(s)) return '交付中';
  if (['已入库', '待分配项目'].includes(s)) return '待交付';
  if (s === '待入库') return '待入库';
  // 装配 / 质量测试 / 生产返修等在制环节统一归为生产中
  return '生产中';
}

// 当前业务节点：整机装配 / 半成品检验 / 初测 / 中测 / OQT终测 / 整机入库 /
//               出厂检验 / 现场安装调试 / 客户验收 / 在线运营
const DEVICE_NODE_MAP = {
  装配中: '整机装配', 整机装配: '整机装配', 待确认装配完成: '整机装配', 已装配: '整机装配',
  半成品检验中: '半成品检验', 初测中: '初测', 中测中: '中测', OQT终测中: 'OQT终测',
  功能测试中: '初测', 老化测试中: '中测', 终测中: 'OQT终测', 生产返修中: 'OQT终测',
  待入库: '整机入库', 已入库: '整机入库', 待分配项目: '整机入库',
  已分配项目: '出厂检验', 出厂检验中: '出厂检验',
  现场安装调试中: '现场安装调试', 客户验收中: '客户验收', 在线运营: '在线运营',
};
export function deviceBusinessNode(device) {
  return DEVICE_NODE_MAP[device.status] || '整机装配';
}
