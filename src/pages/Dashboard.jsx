import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import SecondaryTabs from '../components/SecondaryTabs';
import StatusBadge from '../components/StatusBadge';

const NOW_DATE = new Date('2026-06-26');
const THIS_MONTH = '2026-06';

function monthWarehouseCount(devices) {
  return devices.filter(d => {
    const s = d.status;
    return (
      s === '待分配项目' || s === '已分配项目' || s === '在线运营' || s === '出厂检验中' ||
      s === '现场安装调试中' || s === '客户验收中' || s === '待入库' || s === '已入库'
    ) && (d.assemblyTime || '').slice(0, 7) === THIS_MONTH;
  }).length;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Math.ceil((d - NOW_DATE) / 86400000);
}

function timeProgressPct(createdAt, endDate) {
  if (!createdAt || !endDate) return 0;
  const start = new Date(createdAt.replace(' ', 'T'));
  const end = new Date(endDate);
  const total = end - start;
  if (total <= 0) return 100;
  const elapsed = NOW_DATE - start;
  return Math.min(Math.round((elapsed / total) * 100), 100);
}

function buildSparklineData(testRecords, stationKey) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(NOW_DATE);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    const dayRecords = testRecords.filter(r => r.stationKey === stationKey && r.testTime && r.testTime.slice(0, 10) === ds);
    const total = dayRecords.length;
    const pass = dayRecords.filter(r => r.stationResult === 'Pass').length;
    days.push({ date: ds.slice(5), rate: total > 0 ? Math.round((pass / total) * 100) : null });
  }
  return days;
}

const STATION_LABELS = { semi: '半成品检验', init: '初测', mid: '中测', oqt: 'OQT终测' };

const SEV_CHIP = {
  '严重': 'bg-red-100 text-red-700 border-red-300',
  '高':   'bg-red-100 text-red-700 border-red-300',
  '中':   'bg-amber-100 text-amber-700 border-amber-300',
  '低':   'bg-blue-100 text-blue-700 border-blue-300',
  '轻微': 'bg-amber-100 text-amber-700 border-amber-300',
};

const STATUS_SORT = [
  '半成品检验中','初测中','中测中','OQT终测中','生产返修中',
  '待入库','已入库','待分配项目','出厂检验中','现场安装调试中','客户验收中','在线运营',
];

function KpiCard({ value, label, sub, path, accent }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(path)}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-left hover:shadow-md transition-all group border-t-4 ${accent}`}>
      <div className="text-4xl font-bold text-gray-900 group-hover:text-slate-700">{value}</div>
      <div className="text-sm font-medium text-gray-700 mt-2">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </button>
  );
}

function Sparkline({ data }) {
  const filled = data.map(d => ({ ...d, rate: d.rate ?? undefined }));
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={filled} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} dot={false} connectNulls />
        <Tooltip
          formatter={(v) => v != null ? `${v}%` : '—'}
          labelFormatter={(l) => l}
          contentStyle={{ fontSize: 11 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ─────── 明细 Tab ─────── */
function DetailTab({ projects, deliveryPlans, testRecords, allWOs, alerts }) {
  const navigate = useNavigate();

  /* ── 项目进展：已验收通过台数 ── */
  const projectRows = projects.filter(p => !p.voided).map(p => {
    const projPlans = (deliveryPlans || []).filter(dp => dp.projectId === p.id);
    const accepted = projPlans.reduce((sum, dp) => {
      return sum + (dp.records?.customerAccept || []).filter(r => r.result === '通过').length;
    }, 0);
    const target = p.targetCount || 0;
    const pct = target > 0 ? Math.min(Math.round((accepted / target) * 100), 100) : 0;
    return { ...p, accepted, target, pct };
  });

  /* ── 质量工站 ── */
  const stationKeys = ['semi', 'init', 'mid', 'oqt'];
  const stationStats = stationKeys.map(key => {
    const recs = (testRecords || []).filter(r => r.stationKey === key);
    const total = recs.length;
    const pass = recs.filter(r => r.stationResult === 'Pass').length;
    const rate = total > 0 ? Math.round((pass / total) * 100) : null;
    return { key, label: STATION_LABELS[key], total, pass, rate, sparkData: buildSparklineData(testRecords || [], key) };
  });

  const ngPending = (testRecords || []).filter(r => r.stationResult === 'NG').length;
  const totalTests = (testRecords || []).length;
  const totalPass = (testRecords || []).filter(r => r.stationResult === 'Pass').length;
  const overallRate = totalTests > 0 ? Math.round((totalPass / totalTests) * 100) : null;

  /* ── 异常与待处理 ── */
  const pendingWOs = (allWOs || [])
    .filter(w => w.status === '待处理' || w.status === '处理中')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);
  const pendingAlerts = (alerts || [])
    .filter(a => a.status === '待处理' || a.status === '处理中')
    .sort((a, b) => b.alertTime.localeCompare(a.alertTime))
    .slice(0, 6);

  return (
    <div className="p-6 space-y-6">
      {/* 项目进展 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-800">项目验收进展</span>
          <button onClick={() => navigate('/projects')} className="text-xs text-blue-600 hover:underline">查看全部</button>
        </div>
        <div className="divide-y divide-gray-50">
          {projectRows.map(p => (
            <button key={p.id} onClick={() => navigate(`/projects/${p.id}`)}
              className="w-full px-5 py-4 text-left hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-medium text-gray-800 text-sm">{p.name}</span>
                <span className="text-xs text-gray-400 ml-auto">已验收通过 {p.accepted}/{p.target} 台</span>
                <span className={`text-xs font-semibold w-10 text-right ${p.pct >= 100 ? 'text-green-600' : p.pct >= 60 ? 'text-blue-600' : 'text-orange-500'}`}>{p.pct}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-1.5 rounded-full transition-all ${p.pct >= 100 ? 'bg-green-500' : p.pct >= 60 ? 'bg-blue-500' : 'bg-orange-400'}`} style={{ width: `${Math.max(p.pct, 1)}%` }} />
              </div>
            </button>
          ))}
          {projectRows.length === 0 && <div className="px-5 py-8 text-center text-gray-400 text-sm">暂无项目</div>}
        </div>
      </div>

      {/* 质量统计 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-800">质量统计</span>
          <button onClick={() => navigate('/projects?tab=quality')} className="text-xs text-blue-600 hover:underline">质量看板</button>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-4 gap-4 mb-4">
            {stationStats.map(s => (
              <div key={s.key} className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                <div className={`text-2xl font-bold mb-1 ${s.rate == null ? 'text-gray-300' : s.rate >= 90 ? 'text-green-600' : s.rate >= 75 ? 'text-amber-500' : 'text-red-500'}`}>
                  {s.rate != null ? `${s.rate}%` : '—'}
                </div>
                <div className="text-xs text-gray-400 mb-2">{s.pass}/{s.total}</div>
                <Sparkline data={s.sparkData} />
              </div>
            ))}
          </div>
          <div className="flex gap-6 pt-4 border-t border-gray-100 text-sm">
            <div>
              <span className="text-xs text-gray-500">综合良率</span>
              <span className="ml-2 font-semibold text-gray-800">{overallRate != null ? `${overallRate}%` : '—'}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500">NG待处理</span>
              <span className={`ml-2 font-semibold ${ngPending > 0 ? 'text-red-600' : 'text-gray-800'}`}>{ngPending} 条</span>
            </div>
          </div>
        </div>
      </div>

      {/* 异常与待处理 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">待处理工单</span>
            <button onClick={() => navigate('/after-sales')} className="text-xs text-blue-600 hover:underline">查看全部</button>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingWOs.map(w => (
              <div key={w.id} className="px-5 py-3 flex items-center gap-3">
                <span className="font-mono text-xs text-gray-600 w-20 flex-shrink-0">{w.id}</span>
                <span className="font-mono text-xs text-gray-500 flex-shrink-0">{w.deviceSN}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded border flex-shrink-0 ${SEV_CHIP[w.severity] || 'bg-gray-100 text-gray-600 border-gray-300'}`}>{w.severity}</span>
                <span className="text-xs text-gray-400 ml-auto flex-shrink-0">{(w.createdAt || '').slice(5, 10)}</span>
              </div>
            ))}
            {pendingWOs.length === 0 && <div className="px-5 py-6 text-center text-sm text-gray-400">暂无待处理工单</div>}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">健康告警</span>
            <button onClick={() => navigate('/assets?tab=devices&subtab=alerts')} className="text-xs text-blue-600 hover:underline">查看全部</button>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingAlerts.map(a => (
              <div key={a.id} className="px-5 py-3 flex items-center gap-3">
                <span className="font-mono text-xs text-gray-600 w-24 flex-shrink-0">{a.deviceSN}</span>
                <span className="text-xs text-gray-500 flex-1 truncate">{a.description}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded border flex-shrink-0 ${SEV_CHIP[a.severity] || 'bg-gray-100 text-gray-600 border-gray-300'}`}>{a.severity}</span>
              </div>
            ))}
            {pendingAlerts.length === 0 && <div className="px-5 py-6 text-center text-sm text-gray-400">暂无未处理告警</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────── Main ─────── */
export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';

  const { state } = useApp();
  const navigate = useNavigate();
  const {
    projects, devices, alerts, productionWorkOrders, deliveryWorkOrders,
    workflowProductionPlans = [], testRecords = [], deviceAllocations = [],
    deviceTypes = [], deliveryPlans = [],
  } = state;

  /* ─── KPI Cards ─── */
  const activeProjects = projects.filter(p => !p.voided && p.status !== '已完成');
  const activeProjectCount = activeProjects.length;

  const totalTarget = workflowProductionPlans.reduce((s, p) => s + (p.targetCount || 0), 0);
  const monthWarehouse = monthWarehouseCount(devices);
  const warehousePct = totalTarget > 0 ? Math.round((monthWarehouse / totalTarget) * 100) : 0;

  const allWOs = [...(productionWorkOrders || []), ...(deliveryWorkOrders || [])];
  const pendingWOCount = allWOs.filter(w => w.status === '待处理' || w.status === '处理中').length;

  const pendingAlertCount = (alerts || []).filter(a => a.status === '待处理' || a.status === '处理中').length;

  /* ─── Block 1: 项目进展 ─── */
  const projectProgress = projects.filter(p => !p.voided).map(p => {
    const projPlans = (deliveryPlans || []).filter(dp => dp.projectId === p.id);
    const accepted = projPlans.reduce((sum, dp) => {
      return sum + (dp.records?.customerAccept || []).filter(r => r.result === '通过').length;
    }, 0);
    const target = p.targetCount || 0;
    const pct = target > 0 ? Math.min(Math.round((accepted / target) * 100), 100) : 0;
    const daysLeft = daysUntil(p.dueDate || null);
    const timePct = timeProgressPct(p.createdAt, p.dueDate);
    const atRisk = pct < timePct && timePct > 30;
    return { ...p, accepted, target, pct, daysLeft, timePct, atRisk };
  });

  /* ─── Block 2: 质量情况 ─── */
  const stationKeys = ['semi', 'init', 'mid', 'oqt'];
  const stationStats = stationKeys.map(key => {
    const recs = testRecords.filter(r => r.stationKey === key);
    const total = recs.length;
    const pass = recs.filter(r => r.stationResult === 'Pass').length;
    const rate = total > 0 ? Math.round((pass / total) * 100) : null;
    return { key, label: STATION_LABELS[key], total, pass, rate, sparkData: buildSparklineData(testRecords, key) };
  });

  const incomingTotal = devices.length;
  const qualifiedDevices = devices.filter(d => {
    const finished = ['待分配项目','已分配项目','在线运营','出厂检验中','现场安装调试中','客户验收中'];
    return finished.includes(d.status);
  }).length;
  const incomingRate = incomingTotal > 0 ? Math.round((qualifiedDevices / incomingTotal) * 100) : 0;

  const ngDeviceIds = new Set(testRecords.filter(r => r.stationResult === 'NG' && r.ngReason).map(r => r.deviceId));
  const unresolvedNGDevices = [...ngDeviceIds].filter(id => {
    const d = devices.find(dd => dd.id === id);
    return d && ['生产返修中','半成品检验中','初测中','中测中','OQT终测中','功能测试中'].includes(d.status);
  }).length;

  /* ─── Block 3: 异常与待处理 ─── */
  const pendingWOs = allWOs
    .filter(w => w.status === '待处理' || w.status === '处理中')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const pendingAlerts = (alerts || [])
    .filter(a => a.status === '待处理' || a.status === '处理中')
    .sort((a, b) => b.alertTime.localeCompare(a.alertTime))
    .slice(0, 5);

  const TABS = [
    { key: 'overview', label: '总览' },
    { key: 'detail', label: '明细' },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="bg-white px-6 pt-5 pb-4 border-b border-gray-100">
        <SecondaryTabs tabs={TABS} activeTab={tab} onChange={k => setSearchParams({ tab: k })} />
      </div>

      {/* 总览 */}
      {tab === 'overview' && (
        <div className="p-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4">
            <KpiCard value={activeProjectCount} label="进行中的项目" sub={`共 ${projects.length} 个项目`} path="/projects" accent="border-blue-500" />
            <KpiCard value={`${monthWarehouse} / ${totalTarget}`} label="本月完成整机 / 目标" sub={totalTarget > 0 ? `完成率 ${warehousePct}%` : ''} path="/assets" accent="border-green-500" />
            <KpiCard value={pendingWOCount} label="未处理售后工单" sub="待处理 + 处理中" path="/after-sales" accent="border-orange-500" />
            <KpiCard value={pendingAlertCount} label="未处理健康告警" sub="待处理 + 处理中" path="/assets?tab=devices&subtab=alerts" accent="border-red-500" />
          </div>

          {/* Block 1: 项目进展 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">项目进展</span>
              <button onClick={() => navigate('/projects')} className="text-xs text-blue-600 hover:underline">查看全部</button>
            </div>
            <div className="divide-y divide-gray-50">
              {projectProgress.map(p => (
                <button key={p.id} onClick={() => navigate(`/projects/${p.id}`)}
                  className="w-full px-5 py-4 text-left hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-800 text-sm">{p.name}</span>
                    {p.pct >= 100 && (
                      <span className="bg-green-100 text-green-700 border border-green-300 text-xs px-1.5 py-0.5 rounded-full">✓ 已完成</span>
                    )}
                    <span className="ml-auto text-xs text-gray-400">
                      {p.accepted}/{p.target} 台已验收
                      {p.daysLeft != null && (
                        <span className={p.daysLeft < 14 ? ' text-amber-600 font-medium' : ''}>
                          {' · '}{p.daysLeft > 0 ? `${p.daysLeft}天后截止` : `已逾期${Math.abs(p.daysLeft)}天`}
                        </span>
                      )}
                    </span>
                    {p.pct < 60 && <span className="text-xs text-red-500 font-medium flex-shrink-0">⚠ 延期风险</span>}
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${p.pct >= 100 ? 'bg-green-500' : p.pct >= 60 ? 'bg-blue-500' : 'bg-orange-400'}`}
                      style={{ width: `${Math.max(p.pct, 2)}%` }}
                    />
                  </div>
                </button>
              ))}
              {projectProgress.length === 0 && (
                <div className="px-5 py-8 text-center text-gray-400 text-sm">暂无项目</div>
              )}
            </div>
          </div>

          {/* Block 2: 质量情况 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">质量情况</span>
              <button onClick={() => navigate('/projects?tab=quality')} className="text-xs text-blue-600 hover:underline">质量看板</button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-4 gap-4 mb-5">
                {stationStats.map(s => (
                  <div key={s.key} className="bg-gray-50 rounded-lg p-4">
                    <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                    <div className={`text-2xl font-bold mb-2 ${s.rate == null ? 'text-gray-300' : s.rate >= 90 ? 'text-green-600' : s.rate >= 75 ? 'text-amber-500' : 'text-red-500'}`}>
                      {s.rate != null ? `${s.rate}%` : '—'}
                    </div>
                    <div className="text-xs text-gray-400 mb-2">{s.total} 次检验</div>
                    <Sparkline data={s.sparkData} />
                  </div>
                ))}
              </div>
              <div className="flex gap-6 pt-4 border-t border-gray-100">
                <div>
                  <span className="text-xs text-gray-500">整机综合良率</span>
                  <span className="ml-2 text-sm font-semibold text-gray-800">{incomingRate}%</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500">当前NG待修整机</span>
                  <span className={`ml-2 text-sm font-semibold ${unresolvedNGDevices > 0 ? 'text-red-600' : 'text-gray-800'}`}>{unresolvedNGDevices} 台</span>
                </div>
              </div>
            </div>
          </div>

          {/* Block 3: 异常与待处理 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">待处理工单</span>
                <button onClick={() => navigate('/after-sales')} className="text-xs text-blue-600 hover:underline">
                  {allWOs.filter(w => w.status === '待处理' || w.status === '处理中').length > 5 ? '查看全部' : ''}
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {pendingWOs.map(w => (
                  <div key={w.id} className="px-5 py-3 flex items-center gap-3">
                    <span className="font-mono text-xs text-gray-600 w-20 flex-shrink-0">{w.id}</span>
                    <span className="font-mono text-xs text-gray-500 flex-shrink-0">{w.deviceSN}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded border flex-shrink-0 ${SEV_CHIP[w.severity] || 'bg-gray-100 text-gray-600 border-gray-300'}`}>{w.severity}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-auto">{(w.createdAt || '').slice(5, 10)}</span>
                  </div>
                ))}
                {pendingWOs.length === 0 && (
                  <div className="px-5 py-6 text-center text-sm text-gray-400">暂无待处理工单</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">健康告警</span>
                <button onClick={() => navigate('/assets?tab=devices&subtab=alerts')} className="text-xs text-blue-600 hover:underline">
                  {pendingAlertCount > 5 ? '查看全部' : ''}
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {pendingAlerts.map(a => (
                  <div key={a.id} className="px-5 py-3 flex items-center gap-3">
                    <span className="font-mono text-xs text-gray-600 w-24 flex-shrink-0">{a.deviceSN}</span>
                    <span className="text-xs text-gray-500 flex-1 truncate">{a.description}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded border flex-shrink-0 ${SEV_CHIP[a.severity] || 'bg-gray-100 text-gray-600 border-gray-300'}`}>{a.severity}</span>
                  </div>
                ))}
                {pendingAlerts.length === 0 && (
                  <div className="px-5 py-6 text-center text-sm text-gray-400">暂无未处理告警</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 明细 */}
      {tab === 'detail' && (
        <DetailTab
          projects={projects}
          deliveryPlans={deliveryPlans}
          testRecords={testRecords}
          allWOs={allWOs}
          alerts={alerts}
        />
      )}
    </div>
  );
}
