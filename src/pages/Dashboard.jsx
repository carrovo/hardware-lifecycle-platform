import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import { productionPlanStatus, deliveryPlanStatus } from '../utils/status';

const TODAY = '2026-07-01';
const THIS_MONTH = '2026-06';

function StatGrid({ items, cols = 4 }) {
  const colClass = { 3: 'grid-cols-3', 4: 'grid-cols-4', 5: 'grid-cols-5', 6: 'grid-cols-6' }[cols] || 'grid-cols-4';
  return (
    <div className={`grid ${colClass} gap-4`}>
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
  const wpp = state.workflowProductionPlans || [];
  const deliveryPlans = state.deliveryPlans || [];
  const devices = state.devices || [];
  const workOrders = [...(state.deliveryWorkOrders || []), ...(state.workOrders || [])];
  const qualityIssues = state.qualityIssues || [];
  const online = devices.filter((d) => d.status === '在线运营').length;
  const openWO = workOrders.filter((w) => !['已关闭', '已作废'].includes(w.status)).length;
  const delayed = deliveryPlans.filter((p) => deliveryPlanStatus(p) === '已延期');
  const lowStock = (state.moduleTypes || []).filter((mt) => mt.active
    && state.materials.filter((m) => m.category === mt.category && m.status === '待装配').length < 2);
  const stalePlans = wpp.filter((p) => productionPlanStatus(p) === '生产中' && p.endDate && p.endDate < TODAY);
  const awaitingAccept = deliveryPlans.reduce((s, p) => s + Math.max((p.boundDeviceIds || []).length - (p.records?.customerAccept || []).filter((r) => ['Pass', '通过'].includes(r.result)).length, 0), 0);

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">运营看板</h1>
        <p className="text-sm text-gray-500 mt-1">全局运营监控视图；处理闭环仍在项目中心 / 售后管理完成。</p>
      </div>
      <Board title="全局指标">
        <StatGrid cols={6} items={[
          { label: '项目总数', value: state.projects.length, color: 'border-blue-500' },
          { label: '设备总数', value: devices.length, color: 'border-slate-500' },
          { label: '生产计划数', value: wpp.length, color: 'border-indigo-500' },
          { label: '交付计划数', value: deliveryPlans.length, color: 'border-emerald-500' },
          { label: '在线设备数', value: online, color: 'border-teal-500' },
          { label: '未关闭工单数', value: openWO, color: 'border-orange-500' },
        ]} />
      </Board>
      <Board title="本月进展" subtitle="统计口径：2026-06">
        <StatGrid items={[
          { label: '本月新增项目', value: state.projects.filter((p) => (p.createdAt || '').startsWith(THIS_MONTH)).length, color: 'border-blue-500' },
          { label: '本月完成生产计划', value: wpp.filter((p) => p.status === '已完成').length, color: 'border-green-500' },
          { label: '本月完成交付计划', value: deliveryPlans.filter((p) => deliveryPlanStatus(p) === '已验收').length, color: 'border-emerald-500' },
          { label: '本月新增质量问题', value: qualityIssues.filter((q) => (q.reportTime || '').startsWith(THIS_MONTH)).length, color: 'border-purple-500' },
        ]} />
      </Board>
      <Board title="今日待处理">
        <StatGrid items={[
          { label: '待处理工单', value: workOrders.filter((w) => ['待处理', '处理中'].includes(w.status)).length, color: 'border-orange-500' },
          { label: '待复检设备', value: devices.filter((d) => d.status === '生产返修中').length, color: 'border-red-500' },
          { label: '待客户验收设备', value: awaitingAccept, color: 'border-blue-500' },
          { label: '逾期事项', value: delayed.length + stalePlans.length, color: 'border-amber-500' },
        ]} />
      </Board>
      <Board title="风险提醒">
        <StatGrid items={[
          { label: '延期交付计划', value: delayed.length, color: 'border-red-500' },
          { label: '高优先级质量问题', value: qualityIssues.filter((q) => q.status !== '已关闭' && (q.severity === '高' || q.severity === '严重')).length, color: 'border-purple-500' },
          { label: '模块库存不足', value: lowStock.length, color: 'border-amber-500' },
          { label: '长时间未推进计划', value: stalePlans.length, color: 'border-slate-500' },
        ]} />
      </Board>
    </div>
  );
}

function QualityBoard({ state }) {
  const tests = (state.testRecords || []).filter((t) => t.stationKey);
  const devices = state.devices || [];
  const deviceTypes = state.deviceTypes || [];
  const qualityIssues = state.qualityIssues || [];

  const stationDef = [
    { key: 'semi', label: '半成品检验' }, { key: 'init', label: '初测' },
    { key: 'mid', label: '中测' }, { key: 'oqt', label: 'OQT终测' },
  ];
  const stations = stationDef.map((s) => {
    const recs = tests.filter((t) => t.stationKey === s.key);
    const pass = recs.filter((t) => t.stationResult === 'Pass').length;
    const ng = recs.filter((t) => t.stationResult === 'NG').length;
    const rate = recs.length ? Math.round(pass / recs.length * 100) : 0;
    return { ...s, total: recs.length, pass, ng, rate };
  });
  const firstPassRate = stations[0].total ? stations[0].rate : 0;
  const finalPassRate = stations[3].total ? stations[3].rate : 0;
  const ngCount = tests.filter((t) => t.stationResult === 'NG').length;
  const openIssues = qualityIssues.filter((q) => q.status !== '已关闭').length;
  const repairing = devices.filter((d) => d.status === '生产返修中').length;

  // NG 分布
  const ngByStation = stations.filter((s) => s.ng > 0).map((s) => ({ label: s.label, n: s.ng }));
  const ngByType = {};
  tests.filter((t) => t.stationResult === 'NG').forEach((t) => {
    const dev = devices.find((d) => d.id === t.deviceId);
    const name = deviceTypes.find((dt) => dt.id === dev?.deviceTypeId)?.name || '其他';
    ngByType[name] = (ngByType[name] || 0) + 1;
  });
  const ngBySource = {};
  qualityIssues.forEach((q) => { ngBySource[q.source || '其他'] = (ngBySource[q.source || '其他'] || 0) + 1; });

  const highRiskProjects = state.projects.map((p) => {
    const ngN = tests.filter((t) => t.stationResult === 'NG' && devices.find((d) => d.id === t.deviceId)?.projectId === p.id).length;
    const openN = qualityIssues.filter((q) => q.projectId === p.id && q.status !== '已关闭').length;
    const delayedN = (state.deliveryPlans || []).filter((dp) => dp.projectId === p.id && deliveryPlanStatus(dp) === '已延期').length;
    const score = ngN + openN * 2 + delayedN * 2;
    return { p, ngN, openN, delayedN, score, level: score >= 4 ? '高' : score >= 2 ? '中' : '低' };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);

  const Distro = ({ title, entries }) => (
    <div className="bg-white rounded shadow-sm p-4 border border-gray-100">
      <div className="text-xs font-medium text-gray-500 mb-2">{title}</div>
      <div className="space-y-1.5">
        {entries.length ? entries.map((e) => (
          <div key={e.label} className="flex items-center justify-between text-sm">
            <span className="text-gray-700 truncate mr-2">{e.label}</span>
            <span className="text-red-600 font-medium">{e.n}</span>
          </div>
        )) : <div className="text-xs text-gray-400">暂无 NG</div>}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">质量看板</h1>
        <p className="text-sm text-gray-500 mt-1">质量看板只做监控统计，不处理问题。处理入口在售后管理的质量问题台账和工单中心。</p>
      </div>
      <Board title="核心指标">
        <StatGrid cols={5} items={[
          { label: '一次通过率', value: `${firstPassRate}%`, color: 'border-green-500' },
          { label: '最终通过率', value: `${finalPassRate}%`, color: 'border-emerald-500' },
          { label: 'NG次数', value: ngCount, color: 'border-red-500' },
          { label: '未关闭质量问题', value: openIssues, color: 'border-purple-500' },
          { label: '返修中设备', value: repairing, color: 'border-amber-500' },
        ]} />
      </Board>
      <Board title="工站质量表现">
        <div className="bg-white rounded shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>{['工站', '测试数', 'Pass', 'NG', '一次通过率'].map((h) => <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {stations.map((s) => (
                <tr key={s.key} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-800">{s.label}</td>
                  <td className="px-4 py-2.5 text-gray-600">{s.total}</td>
                  <td className="px-4 py-2.5 text-green-600">{s.pass}</td>
                  <td className="px-4 py-2.5 text-red-600">{s.ng}</td>
                  <td className="px-4 py-2.5">
                    <span className={`font-medium ${s.rate >= 90 ? 'text-green-600' : s.rate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{s.rate}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Board>
      <Board title="NG 分布">
        <div className="grid grid-cols-3 gap-4">
          <Distro title="按工站" entries={ngByStation} />
          <Distro title="按设备类型" entries={Object.entries(ngByType).map(([label, n]) => ({ label, n }))} />
          <Distro title="按问题来源" entries={Object.entries(ngBySource).map(([label, n]) => ({ label, n }))} />
        </div>
      </Board>
      <Board title="高风险项目">
        <div className="bg-white rounded shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>{['项目名称', 'NG次数', '未关闭质量问题', '延期交付计划', '风险等级'].map((h) => <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {highRiskProjects.map(({ p, ngN, openN, delayedN, level }) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-800">{p.name}</td>
                  <td className="px-4 py-2.5 text-gray-600">{ngN}</td>
                  <td className="px-4 py-2.5 text-gray-600">{openN}</td>
                  <td className="px-4 py-2.5 text-gray-600">{delayedN}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={level === '高' ? '严重' : level === '中' ? '轻微' : '低'} /></td>
                </tr>
              ))}
              {highRiskProjects.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">暂无高风险项目</td></tr>}
            </tbody>
          </table>
        </div>
      </Board>
      <Board title="待处理质量问题">
        <div className="bg-white rounded shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>{['问题ID', '关联设备SN', '来源阶段', '严重程度', '状态', '负责人'].map((h) => <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {qualityIssues.filter((q) => q.status !== '已关闭').slice(0, 8).map((q) => (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{q.id}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-800">{q.deviceSN}</td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">{q.sourceStage || '在线运营'}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={q.severity || '轻微'} /></td>
                  <td className="px-4 py-2.5"><StatusBadge status={q.status} /></td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">{q.owner || q.reporterName || '—'}</td>
                </tr>
              ))}
              {qualityIssues.filter((q) => q.status !== '已关闭').length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无待处理质量问题</td></tr>}
            </tbody>
          </table>
        </div>
      </Board>
    </div>
  );
}

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const { state } = useApp();
  const activeTab = searchParams.get('tab') === 'quality' ? 'quality' : 'operation';
  return activeTab === 'quality' ? <QualityBoard state={state} /> : <OperationBoard state={state} />;
}
