import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';

function StatGrid({ items }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {items.map((card) => (
        <div key={card.label} className={`bg-white rounded shadow-sm border-l-4 ${card.color} p-5`}>
          <div className="text-3xl font-semibold text-gray-900">{card.value}</div>
          <div className="text-sm text-gray-500 mt-1">{card.label}</div>
        </div>
      ))}
    </div>
  );
}

function Board({ title, subtitle, children }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
      {subtitle && <p className="text-xs text-gray-400 -mt-2">{subtitle}</p>}
      {children}
    </section>
  );
}

function OperationBoard({ state }) {
  const productionPlans = state.workflowProductionPlans || [];
  const deliveryPlans = state.deliveryPlans || [];
  const workOrders = [...(state.deliveryWorkOrders || [])];
  const online = state.devices.filter((d) => d.status === '在线运营').length;
  const pendingWO = workOrders.filter((w) => ['待处理', '处理中'].includes(w.status)).length;
  const pendingIssues = (state.qualityIssues || []).filter((q) => q.status !== '已关闭').length;
  const delayed = deliveryPlans.filter((p) => p.dueDate && p.dueDate < '2026-07-01' && p.status !== '已验收' && p.status !== '已作废').length;

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">运营看板</h1>
        <p className="text-sm text-gray-500 mt-1">全局运营监控视图，处理闭环仍在项目中心 / 售后管理内完成。</p>
      </div>
      <Board title="全局指标">
        <StatGrid items={[
          { label: '项目总数', value: state.projects.length, color: 'border-blue-500' },
          { label: '生产计划', value: productionPlans.length, color: 'border-indigo-500' },
          { label: '交付计划', value: deliveryPlans.length, color: 'border-emerald-500' },
          { label: '在线设备', value: online, color: 'border-teal-500' },
        ]} />
      </Board>
      <Board title="本月进展">
        <StatGrid items={[
          { label: '生产中计划', value: productionPlans.filter((p) => p.status === '生产中').length, color: 'border-blue-500' },
          { label: '已完成计划', value: productionPlans.filter((p) => p.status === '已完成').length, color: 'border-green-500' },
          { label: '交付中计划', value: deliveryPlans.filter((p) => (p.status === '交付中' || p.status === '进行中')).length, color: 'border-amber-500' },
          { label: '已验收计划', value: deliveryPlans.filter((p) => p.status === '已验收').length, color: 'border-emerald-500' },
        ]} />
      </Board>
      <Board title="今日待处理">
        <StatGrid items={[
          { label: '待处理工单', value: pendingWO, color: 'border-orange-500' },
          { label: '未关闭质量问题', value: pendingIssues, color: 'border-purple-500' },
          { label: '延期交付计划', value: delayed, color: 'border-red-500' },
          { label: '待分配设备', value: state.devices.filter((d) => d.status === '待分配项目').length, color: 'border-slate-500' },
        ]} />
      </Board>
      <Board title="风险提醒" subtitle="延期、异常与高负载项目将在此聚合提示。">
        <div className="bg-white rounded shadow-sm p-6 text-sm text-gray-500">
          {delayed > 0 ? `当前有 ${delayed} 个交付计划已延期，建议优先跟进。` : '暂无高风险提醒。'}
        </div>
      </Board>
    </div>
  );
}

function QualityBoard({ state }) {
  const tests = state.testRecords || [];
  const stationTests = tests.filter((t) => t.stationKey);
  const firstPass = stationTests.filter((t) => t.stationKey === 'semi');
  const firstPassRate = firstPass.length ? Math.round(firstPass.filter((t) => t.stationResult === 'Pass').length / firstPass.length * 100) : 0;
  const oqt = stationTests.filter((t) => t.stationKey === 'oqt');
  const finalPassRate = oqt.length ? Math.round(oqt.filter((t) => t.stationResult === 'Pass').length / oqt.length * 100) : 0;
  const ngCount = stationTests.filter((t) => t.stationResult === 'NG').length;
  const openIssues = (state.qualityIssues || []).filter((q) => q.status !== '已关闭').length;
  const stations = [
    { key: 'semi', label: '半成品检验' }, { key: 'init', label: '初测' },
    { key: 'mid', label: '中测' }, { key: 'oqt', label: 'OQT终测' },
  ].map((s) => {
    const recs = stationTests.filter((t) => t.stationKey === s.key);
    return { ...s, pass: recs.filter((t) => t.stationResult === 'Pass').length, ng: recs.filter((t) => t.stationResult === 'NG').length };
  });

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">质量看板</h1>
        <p className="text-sm text-gray-500 mt-1">质量看板只做监控统计，处理闭环由质量问题台账与工单中心负责。</p>
      </div>
      <Board title="核心质量指标">
        <StatGrid items={[
          { label: '一次通过率', value: `${firstPassRate}%`, color: 'border-green-500' },
          { label: '最终通过率', value: `${finalPassRate}%`, color: 'border-emerald-500' },
          { label: 'NG次数', value: ngCount, color: 'border-red-500' },
          { label: '未关闭质量问题', value: openIssues, color: 'border-purple-500' },
        ]} />
      </Board>
      <Board title="工站质量表现">
        <div className="grid grid-cols-4 gap-4">
          {stations.map((s) => (
            <div key={s.key} className="bg-white rounded shadow-sm p-4 border border-gray-100">
              <div className="text-sm font-medium text-gray-800">{s.label}</div>
              <div className="text-xs text-gray-500 mt-2">Pass {s.pass} / NG {s.ng}</div>
            </div>
          ))}
        </div>
      </Board>
      <div className="grid grid-cols-2 gap-6">
        <Board title="高风险项目" subtitle="按未关闭质量问题数排序。">
          <div className="bg-white rounded shadow-sm p-4 space-y-2 text-sm">
            {state.projects.map((p) => ({ p, n: (state.qualityIssues || []).filter((q) => q.projectId === p.id && q.status !== '已关闭').length }))
              .filter((x) => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 5)
              .map(({ p, n }) => (
                <div key={p.id} className="flex justify-between border-b border-gray-100 pb-1 last:border-0">
                  <span className="text-gray-700">{p.name}</span>
                  <span className="text-red-600 font-medium">{n} 个未关闭</span>
                </div>
              ))}
            {(state.qualityIssues || []).filter((q) => q.status !== '已关闭').length === 0 && <div className="text-gray-400">暂无高风险项目</div>}
          </div>
        </Board>
        <Board title="待处理质量问题">
          <div className="bg-white rounded shadow-sm p-4 space-y-2 text-sm">
            {(state.qualityIssues || []).filter((q) => q.status === '待处理').slice(0, 5).map((q) => (
              <div key={q.id} className="flex justify-between border-b border-gray-100 pb-1 last:border-0">
                <span className="text-gray-700 truncate mr-2">{q.deviceSN} · {q.issueDesc}</span>
                <span className="text-amber-600 whitespace-nowrap">{q.reportTime?.slice(5, 10)}</span>
              </div>
            ))}
            {(state.qualityIssues || []).filter((q) => q.status === '待处理').length === 0 && <div className="text-gray-400">暂无待处理质量问题</div>}
          </div>
        </Board>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const { state } = useApp();
  const activeTab = searchParams.get('tab') === 'quality' ? 'quality' : 'operation';
  return activeTab === 'quality' ? <QualityBoard state={state} /> : <OperationBoard state={state} />;
}
