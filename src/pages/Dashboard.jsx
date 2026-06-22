import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const NOW_DATE = new Date('2026-06-22');
const TODAY_STR = '2026-06-22';

function daysSince(dateStr) {
  if (!dateStr) return 0;
  const d = new Date(dateStr.replace(' ', 'T'));
  return Math.floor((NOW_DATE - d) / 86400000);
}

const PRODUCTION_STAGES = [
  { key: '装配中',    color: 'bg-blue-400',   label: '装配中' },
  { key: '功能测试中', color: 'bg-violet-400', label: '功能测试中' },
  { key: '老化测试中', color: 'bg-amber-400',  label: '老化测试中' },
  { key: '终测中',    color: 'bg-orange-400',  label: '终测中' },
];

export default function Dashboard() {
  const { state } = useApp();
  const navigate = useNavigate();
  const { devices, projects, alerts, workOrders, deliveryRecords, deviceAllocations } = state;

  /* ---- Top stat cards ---- */
  const todayAssembled = devices.filter((d) => (d.assemblyTime || '').slice(0, 10) === TODAY_STR).length;
  const onlineCount = devices.filter((d) => d.status === '在线运营' && d.online === true).length;
  const pendingAssign = devices.filter((d) => d.status === '待分配项目').length;
  const pendingAlerts = alerts.filter((a) => a.status === '待处理').length;
  const inProgressWO = workOrders.filter((w) => w.status === '处理中').length;
  const activeProjects = projects.filter((p) => !p.voided).length;

  const cards = [
    { label: '今日新增整机', value: todayAssembled, path: '/assembly', color: 'border-blue-500' },
    { label: '当前在线设备', value: onlineCount, path: '/devices?tab=online', color: 'border-emerald-500' },
    { label: '待分配设备', value: pendingAssign, path: '/devices?status=待分配项目', color: 'border-green-500' },
    { label: '未处理告警', value: pendingAlerts, path: '/devices?tab=alerts', color: 'border-red-500' },
    { label: '进行中工单', value: inProgressWO, path: '/work-orders', color: 'border-orange-500' },
    { label: '项目交付进度', value: activeProjects, path: '/projects', color: 'border-indigo-500' },
  ];

  /* ---- Section 1: 生产制造状态 ---- */
  const productionCounts = {};
  PRODUCTION_STAGES.forEach((s) => { productionCounts[s.key] = 0; });
  devices.forEach((d) => { if (productionCounts[d.status] !== undefined) productionCounts[d.status]++; });
  const productionTotal = Object.values(productionCounts).reduce((a, b) => a + b, 0);

  const overdueProduction = devices
    .filter((d) => PRODUCTION_STAGES.some((s) => s.key === d.status))
    .map((d) => ({ ...d, days: daysSince(d.updatedAt || d.assemblyTime) }))
    .filter((d) => d.days > 7)
    .sort((a, b) => b.days - a.days);

  /* ---- Section 2: 设备运营状态 ---- */
  const operating = devices.filter((d) => d.status === '在线运营');
  const opOnline = operating.filter((d) => d.online).length;
  const opOffline = operating.length - opOnline;
  const unresolvedAlerts = alerts
    .filter((a) => !['已解决', '已关闭'].includes(a.status))
    .sort((a, b) => b.alertTime.localeCompare(a.alertTime));

  /* ---- Section 3: 项目交付状态 ---- */
  const projectProgress = projects.filter((p) => !p.voided).map((p) => {
    const allocatedIds = [...new Set(deviceAllocations.filter((a) => a.projectId === p.id).map((a) => a.deviceId))];
    const allocated = allocatedIds.filter((devId) => devices.some((d) => d.id === devId)).length;
    const acceptedIds = new Set(
      deliveryRecords
        .filter((r) => r.projectId === p.id && r.stage === '客户验收' && r.result === '通过')
        .map((r) => r.deviceId)
    );
    const delivered = acceptedIds.size;
    return { ...p, allocated, delivered };
  });

  /* ---- Section 4: 维修状态 ---- */
  const thisMonth = TODAY_STR.slice(0, 7);
  const isThisMonth = (s) => (s || '').slice(0, 7) === thisMonth;
  const woNew = workOrders.filter((w) => isThisMonth(w.createdAt)).length;
  const woCompleted = workOrders.filter((w) => isThisMonth(w.closedAt) && ['已关闭', '已完成'].includes(w.status)).length;
  const woInProgress = workOrders.filter((w) => w.status === '处理中').length;
  const overdueWO = workOrders
    .filter((w) => w.status === '待处理' && daysSince(w.createdAt) > 3)
    .sort((a, b) => daysSince(b.createdAt) - daysSince(a.createdAt));

  const sevBadge = (sev) => sev === '严重' || sev === '高'
    ? 'bg-red-100 text-red-700 border-red-300'
    : 'bg-amber-100 text-amber-700 border-amber-300';

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800">运营看板</h1>

      {/* Top stat cards */}
      <div className="grid grid-cols-6 gap-4">
        {cards.map(({ label, value, path, color }) => (
          <button key={label} onClick={() => navigate(path)}
            className={`bg-gray-50 border border-gray-100 rounded-xl p-4 text-left border-l-4 ${color} hover:shadow-sm hover:border-slate-300 transition-all group`}>
            <div className="text-3xl font-semibold text-gray-900 group-hover:text-slate-700">{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </button>
        ))}
      </div>

      {/* Section 1: 生产制造状态 */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">生产制造状态</h2>
        <div className="grid grid-cols-2 gap-4">
          {/* In-progress breakdown */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
            <div className="text-xs font-semibold text-gray-500 mb-3">在制整机分布（共 {productionTotal} 台）</div>
            {productionTotal > 0 ? (
              <>
                <div className="flex h-8 rounded-full overflow-hidden gap-px mb-3">
                  {PRODUCTION_STAGES.map((s) => {
                    const count = productionCounts[s.key];
                    if (count === 0) return null;
                    const pct = Math.round((count / productionTotal) * 100);
                    return (
                      <button key={s.key} onClick={() => navigate(`/devices?status=${encodeURIComponent(s.key)}`)}
                        className={`${s.color} flex items-center justify-center text-white text-xs font-medium hover:brightness-110 transition-all`}
                        style={{ width: `${pct}%` }} title={`${s.label}: ${count}台`}>
                        {pct > 14 ? count : ''}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-3">
                  {PRODUCTION_STAGES.map((s) => (
                    <div key={s.key} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                      <span>{s.label}</span>
                      <span className="font-semibold text-gray-800">{productionCounts[s.key]}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-400 py-4 text-center">暂无在制整机</div>
            )}
          </div>

          {/* Overdue devices */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
            <div className="text-xs font-semibold text-gray-500 mb-3">超期整机（&gt;7天未更新）</div>
            {overdueProduction.length > 0 ? (
              <div className="space-y-1.5">
                {overdueProduction.slice(0, 6).map((d) => (
                  <button key={d.id} onClick={() => navigate(`/devices/${d.id}`)}
                    className="w-full flex items-center justify-between text-xs py-1 px-1 hover:bg-amber-50 rounded transition-colors group">
                    <span className="font-mono text-gray-700 group-hover:text-slate-800">{d.sn}</span>
                    <span className="flex items-center gap-2">
                      <span className="bg-orange-100 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded-full">{d.status}</span>
                      <span className="text-amber-600 font-medium">{d.days}天</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
                <span>✓</span><span>无超期整机</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: 设备运营状态 */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">设备运营状态</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
            <div className="text-xs font-semibold text-gray-500 mb-3">在线 / 离线</div>
            <div className="flex items-center gap-6">
              <button onClick={() => navigate('/devices?tab=online')}
                className="flex-1 text-center hover:bg-gray-50 rounded-lg py-3 transition-colors">
                <div className="text-3xl font-semibold text-emerald-600">{opOnline}</div>
                <div className="text-xs text-gray-500 mt-1">在线</div>
              </button>
              <div className="h-12 w-px bg-gray-200" />
              <button onClick={() => navigate('/devices?tab=online')}
                className="flex-1 text-center hover:bg-gray-50 rounded-lg py-3 transition-colors">
                <div className="text-3xl font-semibold text-red-500">{opOffline}</div>
                <div className="text-xs text-gray-500 mt-1">离线</div>
              </button>
            </div>
            <div className="mt-3 flex h-2 rounded-full overflow-hidden bg-gray-100">
              {operating.length > 0 && (
                <>
                  <div className="bg-emerald-500" style={{ width: `${(opOnline / operating.length) * 100}%` }} />
                  <div className="bg-red-400" style={{ width: `${(opOffline / operating.length) * 100}%` }} />
                </>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
            <div className="text-xs font-semibold text-gray-500 mb-3">未解决告警设备</div>
            {unresolvedAlerts.length > 0 ? (
              <div className="space-y-1.5">
                {unresolvedAlerts.slice(0, 6).map((a) => (
                  <button key={a.id} onClick={() => navigate(`/devices/${a.deviceId}`)}
                    className="w-full flex items-center justify-between gap-2 text-xs py-1 px-1 hover:bg-gray-50 rounded transition-colors group">
                    <span className="font-mono text-gray-700 group-hover:text-slate-800 flex-shrink-0">{a.deviceSN}</span>
                    <span className="flex-1 text-gray-500 truncate text-left">{a.description}</span>
                    <span className={`px-1.5 py-0.5 rounded-full border flex-shrink-0 ${sevBadge(a.severity)}`}>{a.severity}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
                <span>✓</span><span>无未解决告警</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: 项目交付状态 */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">项目交付状态</h2>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 space-y-4">
          {projectProgress.map((p) => {
            const pct = p.targetCount > 0 ? Math.min(Math.round((p.allocated / p.targetCount) * 100), 100) : 0;
            const deliverPct = p.targetCount > 0 ? Math.round((p.delivered / p.targetCount) * 100) : 0;
            return (
              <button key={p.id} onClick={() => navigate(`/projects/${p.id}`)}
                className="w-full text-left hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors">
                <div className="flex items-center justify-between mb-1.5 text-sm">
                  <span className="font-medium text-gray-800">{p.name}</span>
                  <span className="text-xs text-gray-500">
                    已分配 {p.allocated}/{p.targetCount} 台 · 验收通过 {p.delivered} 台（{deliverPct}%）
                  </span>
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-3 relative overflow-hidden">
                  <div className={`h-3 rounded-full ${pct >= 100 ? 'bg-green-500' : pct > 50 ? 'bg-blue-500' : 'bg-amber-400'}`}
                    style={{ width: `${Math.max(pct, 2)}%` }} />
                </div>
              </button>
            );
          })}
          {projectProgress.length === 0 && <div className="text-sm text-gray-400 text-center py-4">暂无项目</div>}
        </div>
      </div>

      {/* Section 4: 维修状态 */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">维修状态</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
            <div className="text-xs font-semibold text-gray-500 mb-3">本月工单统计</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '本月新增', value: woNew, color: 'text-slate-700' },
                { label: '本月完成', value: woCompleted, color: 'text-green-600' },
                { label: '处理中', value: woInProgress, color: 'text-orange-600' },
              ].map(({ label, value, color }) => (
                <button key={label} onClick={() => navigate('/work-orders')}
                  className="text-center hover:bg-gray-50 rounded-lg py-3 transition-colors">
                  <div className={`text-2xl font-semibold ${color}`}>{value}</div>
                  <div className="text-xs text-gray-500 mt-1">{label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
            <div className="text-xs font-semibold text-gray-500 mb-3">超期未处理工单（&gt;3天）</div>
            {overdueWO.length > 0 ? (
              <div className="space-y-1.5">
                {overdueWO.slice(0, 6).map((w) => (
                  <button key={w.id} onClick={() => navigate(`/work-orders?highlight=${w.id}`)}
                    className="w-full flex items-center justify-between gap-2 text-xs py-1 px-1 hover:bg-red-50 rounded transition-colors group">
                    <span className="font-mono text-gray-600 group-hover:text-slate-800 flex-shrink-0">{w.id}</span>
                    <span className="font-mono text-gray-500 flex-shrink-0">{w.deviceSN}</span>
                    <span className={`px-1.5 py-0.5 rounded-full border flex-shrink-0 ${sevBadge(w.severity)}`}>{w.severity}</span>
                    <span className="text-red-600 font-medium flex-shrink-0">{daysSince(w.createdAt)}天</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
                <span>✓</span><span>无超期工单</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
