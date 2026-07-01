import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import {
  productionPlanStatus, deliveryPlanStatus, isPass,
  deviceLifecycleStatus, deviceBusinessNode,
} from '../utils/status';

export default function HomePage() {
  const { state } = useApp();
  const wpp = state.workflowProductionPlans || [];
  const deliveryPlans = state.deliveryPlans || [];
  const devices = state.devices || [];
  const qualityIssues = state.qualityIssues || [];
  const workOrders = [...(state.deliveryWorkOrders || []), ...(state.workOrders || [])];
  const operationLogs = state.operationLogs || [];

  const nodeCount = (n) => devices.filter((d) => deviceBusinessNode(d) === n).length;
  const lifeCount = (s) => devices.filter((d) => deviceLifecycleStatus(d) === s).length;

  const acceptedTotal = deliveryPlans.reduce((sum, p) => sum + (p.records?.customerAccept || []).filter(isPass).length, 0);
  const boundTotal = deliveryPlans.reduce((sum, p) => sum + (p.boundDeviceIds || []).length, 0);
  const awaitingAccept = Math.max(boundTotal - acceptedTotal, 0);
  const delayedDeliveries = deliveryPlans.filter((p) => deliveryPlanStatus(p) === '已延期');
  const lowStockModules = (state.moduleTypes || []).filter((mt) => mt.active
    && state.materials.filter((m) => m.category === mt.category && m.status === '待装配').length < 2);
  const openIssues = qualityIssues.filter((q) => q.status !== '已关闭');
  const pendingWO = workOrders.filter((w) => ['待处理', '处理中'].includes(w.status)).length;

  // 生命周期流转总览
  const flow = [
    { label: '项目创建', value: state.projects.length, sub: '项目总数', to: '/projects?tab=list' },
    { label: '生产计划', value: wpp.filter((p) => productionPlanStatus(p) === '生产中').length, sub: '生产中', to: '/projects?tab=production' },
    { label: '整机装配', value: nodeCount('整机装配'), sub: '装配中设备', to: '/assets?tab=devices' },
    { label: '质量测试', value: ['半成品检验', '初测', '中测', 'OQT终测'].reduce((s, n) => s + nodeCount(n), 0), sub: '测试中设备', to: '/assets?tab=devices' },
    { label: '整机入库', value: lifeCount('待交付'), sub: '待交付设备', to: '/assets?tab=devices' },
    { label: '交付计划', value: deliveryPlans.filter((p) => deliveryPlanStatus(p) === '交付中').length, sub: '交付中计划', to: '/projects?tab=delivery' },
    { label: '客户验收', value: awaitingAccept, sub: '待验收设备', to: '/projects?tab=delivery' },
    { label: '在线运营', value: lifeCount('在线运营'), sub: '在线设备', to: '/assets?tab=devices' },
  ];

  // 风险动态
  const risks = [
    ...delayedDeliveries.slice(0, 2).map((p) => ({ level: '严重', text: `交付计划「${p.name}」已延期（计划验收 ${p.acceptanceDate || p.dueDate}）`, to: `/delivery-plans/${p.id}` })),
    ...(state.deliveryWorkOrders || []).filter((w) => w.status !== '已关闭' && w.status !== '已作废').slice(0, 2).map((w) => ({ level: '严重', text: `设备 ${w.deviceSN} ${w.ngStation || '交付节点'} NG：${w.description}`, to: '/after-sales?tab=orders' })),
    ...lowStockModules.slice(0, 2).map((mt) => ({ level: '一般', text: `模块「${mt.name}」库存偏低，可用不足 2 件`, to: '/assets?tab=materials' })),
    ...openIssues.slice(0, 2).map((q) => ({ level: '一般', text: `质量问题未关闭：${q.deviceSN} ${q.issueDesc}`, to: '/after-sales?tab=quality' })),
  ].slice(0, 6);

  const todos = [
    { label: '待处理工单', value: pendingWO, to: '/after-sales?tab=orders', color: 'text-orange-600' },
    { label: '待复核质量问题', value: qualityIssues.filter((q) => q.status === '待处理').length, to: '/after-sales?tab=quality', color: 'text-purple-600' },
    { label: '待客户验收设备', value: awaitingAccept, to: '/projects?tab=delivery', color: 'text-blue-600' },
    { label: '延期交付计划', value: delayedDeliveries.length, to: '/projects?tab=delivery', color: 'text-red-600' },
    { label: '库存不足模块', value: lowStockModules.length, to: '/assets?tab=materials', color: 'text-amber-600' },
  ];

  const recentLogs = [...operationLogs].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')).slice(0, 5);

  return (
    <div className="p-6 space-y-6 bg-gradient-to-b from-slate-50 to-gray-100 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">设备全生命周期质量管理平台</h1>
        <p className="text-sm text-gray-500 mt-2">从项目、生产、交付、资产到售后，统一追踪设备全生命周期质量状态。</p>
      </div>

      {/* 生命周期流转总览 */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
        <div className="text-sm font-semibold text-gray-700 mb-4">生命周期流转总览</div>
        <div className="flex items-stretch overflow-x-auto pb-1">
          {flow.map((node, i) => (
            <div key={node.label} className="flex items-center flex-shrink-0">
              <Link to={node.to} className="flex flex-col items-center justify-center w-28 px-2 py-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="text-2xl font-bold text-slate-800">{node.value}</div>
                <div className="text-xs font-medium text-gray-700 mt-1">{node.label}</div>
                <div className="text-[11px] text-gray-400">{node.sub}</div>
              </Link>
              {i < flow.length - 1 && <div className="text-gray-300 text-lg px-0.5">→</div>}
            </div>
          ))}
        </div>
      </div>

      {/* 今日待办 */}
      <div>
        <div className="text-sm font-semibold text-gray-700 mb-3">今日待办</div>
        <div className="grid grid-cols-5 gap-4">
          {todos.map((t) => (
            <Link key={t.label} to={t.to} className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className={`text-3xl font-semibold ${t.value > 0 ? t.color : 'text-gray-300'}`}>{t.value}</div>
              <div className="text-xs text-gray-500 mt-1">{t.label}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 风险动态 */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="text-sm font-semibold text-gray-700 mb-3">风险动态</div>
          <div className="space-y-2.5">
            {risks.map((r, i) => (
              <Link key={i} to={r.to} className="flex items-start gap-2 text-sm hover:bg-slate-50 rounded px-1 py-1 -mx-1">
                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${r.level === '严重' ? 'bg-red-500' : 'bg-amber-400'}`} />
                <span className="text-gray-700 flex-1">{r.text}</span>
              </Link>
            ))}
            {risks.length === 0 && <div className="text-sm text-gray-400 py-6 text-center">暂无风险提醒</div>}
          </div>
        </div>

        {/* 最近操作 */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="text-sm font-semibold text-gray-700 mb-3">最近操作</div>
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
        </div>
      </div>
    </div>
  );
}
