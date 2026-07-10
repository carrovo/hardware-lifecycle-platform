// 首页（评审版）：仅展示 平台定位 + 生命周期流程 + 平台核心数据 + 数据更新时间/最近动态。
// 不做个人待办 / 角色工作台 / 复杂模块入口（这些统一在看板中心）。
import { useApp } from '../context/AppContext';
import { Section, StatGrid, StatCard } from '../components/ui';
import { productionPlanStatus, deliveryPlanStatus } from '../utils/status';

// 首页为平台总览，只展示高层级生命周期，不展示生产工站细节，也不把 ERP 当作平台流程节点。
const WORKFLOW = [
  'ERP 正式数据同步', '项目', '生产与质量', '交付', '在线运营', '问题 / 售后', '设备履历 / 质量追溯',
];

const WO_CLOSED = ['已关闭', '已关单', '已作废', '已取消'];

export default function HomePage() {
  const { state } = useApp();
  const devices = state.devices || [];
  const wpp = state.workflowProductionPlans || [];
  const deliveryPlans = state.deliveryPlans || [];
  const workOrders = [...(state.deliveryWorkOrders || []), ...(state.workOrders || [])];
  const qualityIssues = state.qualityIssues || [];
  const logs = state.operationLogs || [];

  const core = [
    { label: '项目数', value: (state.projects || []).length },
    { label: '在线运营设备', value: devices.filter((d) => d.status === '在线运营').length, tone: 'success' },
    { label: '生产中计划', value: wpp.filter((p) => productionPlanStatus(p) === '生产中').length },
    { label: '交付中计划', value: deliveryPlans.filter((p) => deliveryPlanStatus(p) === '交付中').length },
    { label: '未关闭工单', value: workOrders.filter((w) => !WO_CLOSED.includes(w.status)).length, tone: 'warning' },
    { label: '未关闭质量问题', value: qualityIssues.filter((q) => q.status !== '已关闭').length, tone: 'warning' },
  ];

  const lastUpdated = devices.map((d) => d.updatedAt).filter(Boolean).sort().slice(-1)[0] || '—';
  const snOf = (id) => devices.find((d) => d.id === id)?.sn || id;
  const recent = [...logs].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')).slice(0, 6);

  return (
    <div className="p-6 md:p-10 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 标题 + 一句副标题 */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">设备全生命周期质量管理平台</h1>
          <p className="text-[13px] text-gray-500 mt-1.5">
            从项目、生产、交付、资产到售后，统一追踪设备全生命周期质量状态。平台只读同步 ERP 数据，不新增/编辑/删除 ERP 正式单据。
          </p>
        </div>

        {/* 平台核心数据 */}
        <div>
          <div className="text-[13px] font-semibold text-gray-700 mb-3">平台核心数据</div>
          <StatGrid cols={6}>
            {core.map((c) => <StatCard key={c.label} label={c.label} value={c.value} tone={c.tone} />)}
          </StatGrid>
        </div>

        {/* 设备全生命周期工作流 */}
        <div className="bg-white rounded-lg border border-[#ececec] p-6">
          <div className="text-[13px] font-semibold text-gray-700 mb-5">设备全生命周期工作流</div>
          <div className="flex flex-wrap items-center gap-y-3">
            {WORKFLOW.map((node, i) => (
              <div key={node} className="flex items-center">
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg border border-[#ececec] bg-[#fafafa] text-[13px] text-gray-700">
                  {node}
                </span>
                {i < WORKFLOW.length - 1 && <span className="text-gray-300 text-lg px-1.5">→</span>}
              </div>
            ))}
          </div>
        </div>

        {/* 数据更新时间 / 最近动态 */}
        <Section title="最近动态" subtitle={`数据更新时间 ${lastUpdated}（只读同步自各业务模块与 ERP）`}>
          {recent.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-6">暂无动态</div>
          ) : (
            <ul className="divide-y divide-[#f2f2f2]">
              {recent.map((log) => (
                <li key={log.id} className="flex items-center gap-3 py-2.5 text-[13px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                  <span className="text-gray-800 font-medium w-28 flex-shrink-0">{log.actionType}</span>
                  <span className="text-gray-500 flex-shrink-0">{snOf(log.deviceId)}</span>
                  <span className="text-gray-400 flex-1 truncate">{log.notes}</span>
                  <span className="text-gray-400 flex-shrink-0">{log.operator}</span>
                  <span className="text-gray-400 flex-shrink-0 w-36 text-right">{log.timestamp}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
