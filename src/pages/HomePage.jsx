import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useRole } from '../context/RoleContext';
import { FEISHU_USERS } from '../data/mockData';
import StatusBadge from '../components/StatusBadge';
import {
  productionPlanStatus, deliveryPlanStatus, isPass, deviceLifecycleStatus,
} from '../utils/status';

const STATION_LABEL = { semi: '半成品检验', init: '初测', mid: '中测', oqt: 'OQT终测' };
const stationLabel = (t) => STATION_LABEL[t.stationKey] || t.testType || '测试';

// 内部角色 → 首页视图口径（不同角色看到不同权限范围内的数据）
const ROLE_VIEW = {
  '管理员': 'admin',
  '厂长': 'admin',            // 工厂负责人 = 管理层，全局
  '项目负责人': 'project',
  '装配工': 'production',
  '测试员': 'quality',
  '质检员': 'quality',
  '运维工程师': 'delivery',
  '维修工程师': 'aftersales',
  'ERP协同角色': 'erp',
};
const VIEW_TAG = {
  admin: '全局运营概览', project: '我的项目概览', production: '生产任务概览',
  quality: '质量任务概览', delivery: '交付任务概览', aftersales: '我的售后任务', erp: 'ERP 协同状态概览',
};

// 生命周期流转节点（不含「项目创建」；项目总数放在关键指标里）
function computeFlow(devs, wppList, dpList) {
  const life = (s) => devs.filter((d) => deviceLifecycleStatus(d) === s).length;
  const st = (arr) => devs.filter((d) => arr.includes(d.status)).length;
  const accepted = dpList.reduce((s, p) => s + (p.records?.customerAccept || []).filter(isPass).length, 0);
  const bound = dpList.reduce((s, p) => s + (p.boundDeviceIds || []).length, 0);
  return {
    plan: { label: '生产计划', value: wppList.filter((p) => productionPlanStatus(p) === '生产中').length, sub: '生产中', to: '/projects?tab=production' },
    assembly: { label: '整机装配', value: st(['装配中', '整机装配']), sub: '装配中', to: '/assets?tab=devices' },
    test: { label: '质量测试', value: st(['半成品检验中', '初测中', '中测中', 'OQT终测中', '生产返修中']), sub: '测试中', to: '/assets?tab=devices' },
    inbound: { label: '整机入库', value: life('待入库') + life('待交付'), sub: '待交付', to: '/assets?tab=devices' },
    delivery: { label: '交付计划', value: dpList.filter((p) => deliveryPlanStatus(p) === '交付中').length, sub: '交付中', to: '/projects?tab=delivery' },
    accept: { label: '客户验收', value: Math.max(bound - accepted, 0), sub: '待验收', to: '/projects?tab=delivery' },
    online: { label: '在线运营', value: life('在线运营'), sub: '在线', to: '/assets?tab=devices' },
  };
}

export default function HomePage() {
  const { state } = useApp();
  const { currentRole, canSeeNav } = useRole();
  const currentUser = FEISHU_USERS.find((u) => u.id === (state.currentUserId || 'u1')) || FEISHU_USERS[0];
  const view = ROLE_VIEW[currentRole] || 'admin';

  const projects = state.projects || [];
  const devices = state.devices || [];
  const wpp = state.workflowProductionPlans || [];
  const deliveryPlans = state.deliveryPlans || [];
  const qualityIssues = state.qualityIssues || [];
  const alerts = state.alerts || [];
  const allWO = [...(state.deliveryWorkOrders || []), ...(state.workOrders || [])];
  const batches = state.materialBatches || [];
  const moduleTypes = state.moduleTypes || [];
  const materials = state.materials || [];
  const testRecords = state.testRecords || [];
  const operationLogs = state.operationLogs || [];

  const devSN = (id) => devices.find((d) => d.id === id)?.sn || id;
  const lifeN = (s) => devices.filter((d) => deviceLifecycleStatus(d) === s).length;
  const stN = (arr) => devices.filter((d) => arr.includes(d.status)).length;

  const openWO = allWO.filter((w) => !['已关闭', '已作废'].includes(w.status));
  const openQI = qualityIssues.filter((q) => q.status !== '已关闭');
  const closedIssues = qualityIssues.filter((q) => q.status === '已关闭');
  const openAlerts = alerts.filter((a) => !['已解决', '已关闭'].includes(a.status));
  const recentNG = testRecords.filter((t) => t.stationResult === 'NG').sort((a, b) => (b.testTime || '').localeCompare(a.testTime || ''));
  const lowStockModules = moduleTypes.filter((mt) => mt.active && materials.filter((m) => m.category === mt.category && m.status === '待装配').length < (mt.safeStock ?? 2) && materials.some((m) => m.category === mt.category));
  const delayedPlans = deliveryPlans.filter((p) => deliveryPlanStatus(p) === '已延期');
  const acceptedTotal = deliveryPlans.reduce((s, p) => s + (p.records?.customerAccept || []).filter(isPass).length, 0);
  const boundTotal = deliveryPlans.reduce((s, p) => s + (p.boundDeviceIds || []).length, 0);
  const awaitingAccept = Math.max(boundTotal - acceptedTotal, 0);
  const waitBind = deliveryPlans.reduce((s, p) => (['交付中', '未开始'].includes(deliveryPlanStatus(p)) ? s + Math.max((p.targetCount || 0) - (p.boundDeviceIds || []).length, 0) : s), 0);

  // 项目负责人：仅自己负责的项目
  const myProjects = projects.filter((p) => p.manager === currentUser.name);
  const myProjIds = new Set(myProjects.map((p) => p.id));
  const myDevices = devices.filter((d) => myProjIds.has(d.projectId));
  const myWPP = wpp.filter((p) => myProjIds.has(p.projectId));
  const myDP = deliveryPlans.filter((p) => myProjIds.has(p.projectId));
  const myOpenQI = openQI.filter((q) => myProjIds.has(q.projectId));
  const myAcceptGap = myDP.reduce((s, p) => s + Math.max((p.boundDeviceIds || []).length - (p.records?.customerAccept || []).filter(isPass).length, 0), 0);

  const V = {
    projectTotal: projects.length,
    producing: lifeN('生产中'), waitInbound: stN(['待入库']), readyDeliver: lifeN('待交付'),
    delivering: lifeN('交付中'), online: stN(['在线运营']),
    assembling: stN(['装配中', '整机装配']), testing: stN(['半成品检验中', '初测中', '中测中', 'OQT终测中']),
    repairing: stN(['生产返修中']), waitFactory: stN(['已分配项目']), siteInstalling: stN(['现场安装调试中']), waitAccept: stN(['客户验收中']),
    producingPlans: wpp.filter((p) => productionPlanStatus(p) === '生产中').length,
    deliveringPlans: deliveryPlans.filter((p) => deliveryPlanStatus(p) === '交付中').length,
    delayedCount: delayedPlans.length, materialGap: wpp.filter((p) => productionPlanStatus(p) === '生产中' && p.materialReady === false).length,
    awaitingAccept, waitBind,
    openWOCount: openWO.length, recheckWO: allWO.filter((w) => w.status === '复检中').length,
    swapWO: allWO.filter((w) => (w.woClass === '换件工单' || w.involvesReplacement) && !['已关闭', '已作废'].includes(w.status)).length,
    closedWO: allWO.filter((w) => w.status === '已关闭').length,
    pendingAlerts: openAlerts.filter((a) => a.status === '待处理').length, severeAlerts: openAlerts.filter((a) => a.severity === '严重').length,
    openQICount: openQI.length, pendingQI: qualityIssues.filter((q) => q.status === '待处理').length,
    severeQI: openQI.filter((q) => ['高', '严重'].includes(q.severity)).length,
    onlineQIOpen: openQI.filter((q) => (q.sourceStage || '在线运营') === '在线运营').length,
    factoryQIOpen: openQI.filter((q) => q.sourceStage === '出厂检验').length,
    ngCount: recentNG.length, badBatches: batches.filter((b) => b.voided || (b.items || []).some((it) => it.result === '不合格')).length,
    lowStock: lowStockModules.length,
    erpPlanOrder: wpp.filter((p) => !p.erpProductionOrderNo).length,
    erpBom: wpp.filter((p) => productionPlanStatus(p) === '生产中' && !(p.materialBatchIds && p.materialBatchIds.length)).length,
    erpMatOut: batches.filter((b) => (b.planId || wpp.some((p) => (p.materialBatchIds || []).includes(b.id))) && !b.erpDeliveryNo).length,
    erpOverIssue: batches.filter((b) => b.overIssued).length,
    erpInbound: devices.filter((d) => d.status === '待入库' && !d.erpInboundNo).length,
    erpInspect: devices.filter((d) => d.status === '待入库' && d.erpInspectionStatus !== '合格').length,
    erpSalesOut: deliveryPlans.filter((p) => deliveryPlanStatus(p) === '交付中' && !p.erpOutboundNo).length,
  };

  const flowGlobal = computeFlow(devices, wpp, deliveryPlans);
  const flowMine = computeFlow(myDevices, myWPP, myDP);
  const flow = view === 'project' ? flowMine : flowGlobal;

  // 消息 / 动态池（含 cat 供角色过滤）
  const msgPool = [
    ...openWO.slice(0, 2).map((w) => ({ tag: '新增工单', cat: 'order', color: 'text-orange-600', text: `${w.deviceSN} · ${w.description}`, to: '/after-sales?tab=orders', projectId: w.projectId })),
    ...recentNG.slice(0, 2).map((t) => ({ tag: '测试NG', cat: 'test', color: 'text-red-600', text: `${devSN(t.deviceId)} · ${stationLabel(t)} NG`, to: '/projects?tab=production' })),
    ...delayedPlans.slice(0, 1).map((p) => ({ tag: '交付延期', cat: 'delivery', color: 'text-red-600', text: `交付计划「${p.name}」已延期`, to: `/delivery-plans/${p.id}`, projectId: p.projectId })),
    ...closedIssues.slice(0, 1).map((q) => ({ tag: '质量问题关闭', cat: 'qi', color: 'text-green-600', text: `${q.deviceSN} · ${q.issueDesc}`, to: '/after-sales?tab=quality', projectId: q.projectId })),
    ...openAlerts.slice(0, 1).map((a) => ({ tag: '告警处理', cat: 'alert', color: 'text-amber-600', text: `${a.deviceSN} · ${a.description}`, to: '/assets?tab=devices&subtab=alerts', projectId: a.projectId })),
    ...devices.filter((d) => d.status === '已入库').slice(0, 1).map((d) => ({ tag: '设备入库', cat: 'inbound', color: 'text-teal-600', text: `${d.sn} 已入库`, to: '/assets?tab=devices' })),
    ...(V.erpInbound > 0 ? [{ tag: 'ERP产品入库关联', cat: 'erp', color: 'text-blue-600', text: `${V.erpInbound} 台待入库设备待关联 ERP 产品入库单`, to: '/assets?tab=devices' }] : []),
    ...(V.erpSalesOut > 0 ? [{ tag: 'ERP销售出库关联', cat: 'erp', color: 'text-blue-600', text: `${V.erpSalesOut} 个交付计划待关联 ERP 销售出库 / 验收单`, to: '/projects?tab=delivery' }] : []),
  ];
  // 风险池
  const riskPool = [
    ...delayedPlans.slice(0, 2).map((p) => ({ cat: 'delivery', level: '严重', text: `交付计划「${p.name}」已延期（计划验收 ${p.acceptanceDate || p.dueDate}）`, to: `/delivery-plans/${p.id}`, projectId: p.projectId })),
    ...openQI.filter((q) => ['高', '严重'].includes(q.severity)).slice(0, 2).map((q) => ({ cat: 'qi', level: '严重', text: `高优先级质量问题：${q.deviceSN} ${q.issueDesc}`, to: '/after-sales?tab=quality', projectId: q.projectId })),
    ...openAlerts.filter((a) => a.severity === '严重').slice(0, 2).map((a) => ({ cat: 'alert', level: '严重', text: `严重健康告警：${a.deviceSN} ${a.description}`, to: '/assets?tab=devices&subtab=alerts', projectId: a.projectId })),
    ...lowStockModules.slice(0, 2).map((mt) => ({ cat: 'material', level: '一般', text: `模块「${mt.name}」库存偏低`, to: '/assets?tab=materials' })),
    ...(V.materialGap > 0 ? [{ cat: 'material', level: '一般', text: '生产计划存在来料齐套缺口', to: '/projects?tab=production' }] : []),
    ...recentNG.slice(0, 1).map((t) => ({ cat: 'test', level: '一般', text: `测试 NG / 返修：${devSN(t.deviceId)} ${stationLabel(t)}`, to: '/projects?tab=production' })),
    ...((V.erpInbound + V.erpInspect) > 0 ? [{ cat: 'erp', level: '一般', text: 'ERP 入库 / 检验单存在未关联', to: '/assets?tab=devices' }] : []),
    ...(V.erpSalesOut > 0 ? [{ cat: 'erp', level: '一般', text: 'ERP 销售出库 / 验收单存在未关联', to: '/projects?tab=delivery' }] : []),
  ];

  // 入口池（按 canSeeNav 过滤）
  const ENTRY = {
    projList: { label: '项目列表', to: '/projects?tab=list', base: '/projects' },
    prodPlan: { label: '生产计划', to: '/projects?tab=production', base: '/projects' },
    delivPlan: { label: '交付计划', to: '/projects?tab=delivery', base: '/projects' },
    devices: { label: '设备台账', to: '/assets?tab=devices', base: '/assets' },
    materials: { label: '模块与来料', to: '/assets?tab=materials', base: '/assets' },
    locations: { label: '点位管理', to: '/assets?tab=locations', base: '/assets' },
    alerts: { label: '健康告警', to: '/assets?tab=devices&subtab=alerts', base: '/assets' },
    orders: { label: '工单中心', to: '/after-sales?tab=orders', base: '/after-sales' },
    quality: { label: '质量问题台账', to: '/after-sales?tab=quality', base: '/after-sales' },
    opBoard: { label: '运营看板', to: '/dashboard?tab=operation', base: '/dashboard' },
    qBoard: { label: '质量看板', to: '/dashboard?tab=quality', base: '/dashboard' },
  };

  const m = (label, value, color, to) => ({ label, value, color, to });
  const VIEWS = {
    admin: {
      metrics: [m('项目总数', V.projectTotal, 'text-blue-600', '/projects?tab=list'), m('生产中设备', V.producing, 'text-blue-600', '/assets?tab=devices'), m('待交付设备', V.readyDeliver, 'text-teal-600', '/assets?tab=devices'), m('交付中设备', V.delivering, 'text-purple-600', '/projects?tab=delivery'), m('在线运营设备', V.online, 'text-emerald-600', '/assets?tab=devices'), m('待处理问题', V.openQICount + V.openWOCount, 'text-orange-600', '/after-sales?tab=quality')],
      flowKeys: ['plan', 'assembly', 'test', 'inbound', 'delivery', 'accept', 'online'],
      todos: [m('待处理工单', V.openWOCount, 'text-orange-600', '/after-sales?tab=orders'), m('待复核质量问题', V.pendingQI, 'text-purple-600', '/after-sales?tab=quality'), m('待客户验收设备', V.awaitingAccept, 'text-blue-600', '/projects?tab=delivery'), m('待处理健康告警', V.pendingAlerts, 'text-red-600', '/assets?tab=devices&subtab=alerts'), m('库存不足模块', V.lowStock, 'text-amber-600', '/assets?tab=materials')],
      riskCats: null, msgCats: null, entries: ['projList', 'prodPlan', 'delivPlan', 'devices', 'materials', 'orders', 'quality', 'opBoard', 'qBoard'], showLogs: true,
    },
    project: {
      metrics: [m('我负责项目', myProjects.length, 'text-indigo-600', '/projects?tab=list'), m('项目待交付设备', myDevices.filter((d) => deviceLifecycleStatus(d) === '待交付').length, 'text-teal-600', '/assets?tab=devices'), m('交付中计划', myDP.filter((p) => deliveryPlanStatus(p) === '交付中').length, 'text-blue-600', '/projects?tab=delivery'), m('延期交付计划', myDP.filter((p) => deliveryPlanStatus(p) === '已延期').length, 'text-red-600', '/projects?tab=delivery'), m('未关闭质量问题', myOpenQI.length, 'text-purple-600', '/after-sales?tab=quality'), m('待客户验收设备', myAcceptGap, 'text-blue-600', '/projects?tab=delivery')],
      flowKeys: ['plan', 'assembly', 'test', 'inbound', 'delivery', 'accept', 'online'],
      todos: [m('延期交付计划', myDP.filter((p) => deliveryPlanStatus(p) === '已延期').length, 'text-red-600', '/projects?tab=delivery'), m('待客户验收', myAcceptGap, 'text-blue-600', '/projects?tab=delivery'), m('未关闭质量问题', myOpenQI.length, 'text-purple-600', '/after-sales?tab=quality'), m('交付中计划', myDP.filter((p) => deliveryPlanStatus(p) === '交付中').length, 'text-blue-600', '/projects?tab=delivery')],
      riskCats: new Set(['delivery', 'qi', 'alert']), msgCats: new Set(['order', 'delivery', 'qi', 'alert']), scopeProject: true, entries: ['projList', 'prodPlan', 'delivPlan', 'devices', 'quality', 'orders'], showLogs: true,
    },
    production: {
      metrics: [m('生产计划数', V.producingPlans, 'text-blue-600', '/projects?tab=production'), m('待装配设备', V.assembling, 'text-amber-600', '/assets?tab=devices'), m('测试中设备', V.testing, 'text-blue-600', '/assets?tab=devices'), m('返修中设备', V.repairing, 'text-red-600', '/assets?tab=devices'), m('待入库设备', V.waitInbound, 'text-teal-600', '/assets?tab=devices'), m('来料缺口项', V.materialGap, 'text-orange-600', '/assets?tab=materials')],
      flowKeys: ['plan', 'assembly', 'test', 'inbound'],
      todos: [m('待装配', V.assembling, 'text-amber-600', '/assets?tab=devices'), m('待测试', V.testing, 'text-blue-600', '/assets?tab=devices'), m('返修中', V.repairing, 'text-red-600', '/assets?tab=devices'), m('待入库', V.waitInbound, 'text-teal-600', '/assets?tab=devices'), m('来料缺口', V.materialGap, 'text-orange-600', '/assets?tab=materials')],
      riskCats: new Set(['material', 'test']), msgCats: new Set(['test', 'inbound', 'material']), entries: ['prodPlan', 'devices', 'materials'], showLogs: false,
    },
    quality: {
      metrics: [m('待测试设备', V.testing, 'text-blue-600', '/assets?tab=devices'), m('测试NG(近期)', V.ngCount, 'text-red-600', '/projects?tab=production'), m('返修中设备', V.repairing, 'text-amber-600', '/assets?tab=devices'), m('待复核质量问题', V.pendingQI, 'text-purple-600', '/after-sales?tab=quality'), m('严重质量问题', V.severeQI, 'text-red-600', '/after-sales?tab=quality'), m('来料异常批次', V.badBatches, 'text-orange-600', '/assets?tab=materials')],
      flowKeys: ['plan', 'test', 'inbound'],
      todos: [m('待测试', V.testing, 'text-blue-600', '/assets?tab=devices'), m('待复核', V.pendingQI, 'text-purple-600', '/after-sales?tab=quality'), m('测试NG', V.ngCount, 'text-red-600', '/projects?tab=production'), m('来料异常', V.badBatches, 'text-orange-600', '/assets?tab=materials'), m('出厂检验问题', V.factoryQIOpen, 'text-amber-600', '/after-sales?tab=quality')],
      riskCats: new Set(['qi', 'test', 'material']), msgCats: new Set(['test', 'qi', 'material']), entries: ['qBoard', 'quality', 'prodPlan', 'devices'], showLogs: false,
    },
    delivery: {
      metrics: [m('交付中计划', V.deliveringPlans, 'text-blue-600', '/projects?tab=delivery'), m('待绑定设备', V.waitBind, 'text-teal-600', '/projects?tab=delivery'), m('待出厂检验设备', V.waitFactory, 'text-amber-600', '/assets?tab=devices'), m('现场安装调试中', V.siteInstalling, 'text-indigo-600', '/assets?tab=devices'), m('待客户验收设备', V.waitAccept, 'text-purple-600', '/projects?tab=delivery'), m('延期交付计划', V.delayedCount, 'text-red-600', '/projects?tab=delivery')],
      flowKeys: ['delivery', 'accept', 'online'],
      todos: [m('待绑定', V.waitBind, 'text-teal-600', '/projects?tab=delivery'), m('待出厂检验', V.waitFactory, 'text-amber-600', '/assets?tab=devices'), m('现场安装调试', V.siteInstalling, 'text-indigo-600', '/assets?tab=devices'), m('待客户验收', V.waitAccept, 'text-purple-600', '/projects?tab=delivery')],
      riskCats: new Set(['delivery']), msgCats: new Set(['delivery', 'order']), entries: ['delivPlan', 'locations', 'devices', 'quality'], showLogs: false,
    },
    aftersales: {
      metrics: [m('待处理工单', V.openWOCount, 'text-orange-600', '/after-sales?tab=orders'), m('待处理严重告警', V.severeAlerts, 'text-red-600', '/assets?tab=devices&subtab=alerts'), m('待换件工单', V.swapWO, 'text-amber-600', '/after-sales?tab=orders'), m('复检中工单', V.recheckWO, 'text-purple-600', '/after-sales?tab=orders'), m('已处理工单', V.closedWO, 'text-green-600', '/after-sales?tab=orders'), m('未关闭在线问题', V.onlineQIOpen, 'text-blue-600', '/after-sales?tab=quality')],
      flowKeys: ['inbound', 'delivery', 'online'],
      todos: [m('待处理工单', V.openWOCount, 'text-orange-600', '/after-sales?tab=orders'), m('待复检', V.recheckWO, 'text-purple-600', '/after-sales?tab=orders'), m('严重告警', V.severeAlerts, 'text-red-600', '/assets?tab=devices&subtab=alerts'), m('换件任务', V.swapWO, 'text-amber-600', '/after-sales?tab=orders')],
      riskCats: new Set(['alert', 'qi']), msgCats: new Set(['order', 'alert', 'qi']), entries: ['orders', 'alerts', 'quality', 'devices'], showLogs: false,
    },
    erp: {
      metrics: [m('待关联生产订单', V.erpPlanOrder, 'text-blue-600', '/projects?tab=production'), m('待关联BOM/物料清单', V.erpBom, 'text-indigo-600', '/assets?tab=materials'), m('待关联材料出库', V.erpMatOut, 'text-amber-600', '/assets?tab=materials'), m('待关联超额出库', V.erpOverIssue, 'text-orange-600', '/assets?tab=materials'), m('待关联产品入库单', V.erpInbound, 'text-teal-600', '/assets?tab=devices'), m('待关联产品检验单', V.erpInspect, 'text-red-600', '/assets?tab=devices'), m('待关联销售出库/验收单', V.erpSalesOut, 'text-purple-600', '/projects?tab=delivery')],
      flowKeys: ['plan', 'inbound', 'delivery'],
      todos: [m('待关联生产订单', V.erpPlanOrder, 'text-blue-600', '/projects?tab=production'), m('待关联材料出库', V.erpMatOut, 'text-amber-600', '/assets?tab=materials'), m('待关联产品入库', V.erpInbound, 'text-teal-600', '/assets?tab=devices'), m('待关联产品检验', V.erpInspect, 'text-red-600', '/assets?tab=devices'), m('待关联销售出库/验收', V.erpSalesOut, 'text-purple-600', '/projects?tab=delivery')],
      riskCats: new Set(['erp']), msgCats: new Set(['erp', 'inbound']), entries: ['prodPlan', 'materials', 'devices', 'delivPlan'], showLogs: false,
    },
  };
  const cfg = VIEWS[view];
  const inProjectScope = (item) => !cfg.scopeProject || item.projectId === undefined || myProjIds.has(item.projectId);
  const messages = msgPool.filter((x) => (!cfg.msgCats || cfg.msgCats.has(x.cat)) && inProjectScope(x)).slice(0, 8);
  const risks = riskPool.filter((x) => (!cfg.riskCats || cfg.riskCats.has(x.cat)) && inProjectScope(x)).slice(0, 6);
  const entries = cfg.entries.map((k) => ENTRY[k]).filter((e) => canSeeNav(e.base));
  const logSource = view === 'project'
    ? operationLogs.filter((l) => myDevices.some((d) => d.id === l.deviceId))
    : operationLogs;
  const recentLogs = [...logSource].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')).slice(0, 5);

  return (
    <div className="p-6 space-y-6 bg-gradient-to-b from-slate-50 to-gray-100 min-h-screen">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">设备全生命周期质量管理平台</h1>
          <p className="text-sm text-gray-500 mt-2">从项目、生产、交付、资产到售后，统一追踪设备全生命周期质量状态。</p>
        </div>
        <span className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-700 text-white text-sm">
          {VIEW_TAG[view]}
        </span>
      </div>

      {/* 关键指标 */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {cfg.metrics.map((c) => (
          <Link key={c.label} to={c.to} className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
            <div className={`text-2xl font-semibold ${c.value > 0 ? c.color : 'text-gray-300'}`}>{c.value}</div>
            <div className="text-xs text-gray-500 mt-1">{c.label}</div>
          </Link>
        ))}
      </div>

      {/* 生命周期流转总览（按角色口径） */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
        <div className="text-sm font-semibold text-gray-700 mb-4">设备生命周期分布{view === 'project' ? '（我的项目）' : ''}</div>
        <div className="flex items-stretch overflow-x-auto pb-1">
          {cfg.flowKeys.map((key, i) => {
            const node = flow[key];
            return (
              <div key={key} className="flex items-center flex-shrink-0">
                <Link to={node.to} className="flex flex-col items-center justify-center w-28 px-2 py-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="text-2xl font-bold text-slate-800">{node.value}</div>
                  <div className="text-xs font-medium text-gray-700 mt-1">{node.label}</div>
                  <div className="text-[11px] text-gray-400">{node.sub}</div>
                </Link>
                {i < cfg.flowKeys.length - 1 && <div className="text-gray-300 text-lg px-0.5">→</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* 待办 */}
      <div>
        <div className="text-sm font-semibold text-gray-700 mb-3">{view === 'admin' ? '全部待办' : '我的待办'}</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {cfg.todos.map((t) => (
            <Link key={t.label} to={t.to} className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className={`text-3xl font-semibold ${t.value > 0 ? t.color : 'text-gray-300'}`}>{t.value}</div>
              <div className="text-xs text-gray-500 mt-1">{t.label}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 风险提醒 */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="text-sm font-semibold text-gray-700 mb-3">风险提醒</div>
          <div className="space-y-2.5">
            {risks.map((r, i) => (
              <Link key={i} to={r.to} className="flex items-start gap-2 text-sm hover:bg-slate-50 rounded px-1 py-1 -mx-1">
                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${r.level === '严重' ? 'bg-red-500' : 'bg-amber-400'}`} />
                <span className="text-gray-700 flex-1">{r.text}</span>
              </Link>
            ))}
            {risks.length === 0 && <div className="text-sm text-gray-400 py-6 text-center">当前角色暂无风险提醒</div>}
          </div>
        </div>

        {/* 消息 / 动态中心 */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="text-sm font-semibold text-gray-700 mb-3">消息 / 动态中心</div>
          <div className="space-y-2">
            {messages.map((msg, i) => (
              <Link key={i} to={msg.to} className="flex items-center gap-2 text-sm hover:bg-slate-50 rounded px-1 py-1 -mx-1">
                <span className={`text-xs font-medium w-20 flex-shrink-0 ${msg.color}`}>{msg.tag}</span>
                <span className="text-gray-600 flex-1 truncate">{msg.text}</span>
              </Link>
            ))}
            {messages.length === 0 && <div className="text-sm text-gray-400 py-6 text-center">暂无与当前角色相关的动态</div>}
          </div>
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
        <div className="text-sm font-semibold text-gray-700 mb-3">常用工作入口</div>
        <div className="flex flex-wrap gap-2">
          {entries.map((e) => (
            <Link key={e.label} to={e.to} className="text-sm px-3 py-1.5 rounded-full border border-gray-200 text-slate-700 hover:bg-slate-50">{e.label}</Link>
          ))}
          {entries.length === 0 && <div className="text-sm text-gray-400">当前角色暂无可进入的快捷入口</div>}
        </div>
      </div>

      {/* 最近操作（操作日志为敏感信息，仅管理员 / 项目负责人可见） */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
        <div className="text-sm font-semibold text-gray-700 mb-3">最近操作</div>
        {cfg.showLogs ? (
          <div className="space-y-3">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 text-sm">
                <span className="w-2 h-2 rounded-full mt-1.5 bg-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-gray-800 font-medium">{log.actionType}</span>
                    {log.toStatus && <StatusBadge status={log.toStatus} />}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 truncate">{log.timestamp} · {log.operator} · {log.notes || ''}</div>
                </div>
              </div>
            ))}
            {recentLogs.length === 0 && <div className="text-sm text-gray-400 py-6 text-center">暂无操作记录</div>}
          </div>
        ) : (
          <div className="text-sm text-gray-400 py-4">操作日志为敏感信息，已隐藏（仅管理员 / 项目负责人可见）。</div>
        )}
      </div>
    </div>
  );
}
