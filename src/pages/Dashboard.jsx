import { useSearchParams } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import { Page, PageHeader, Section, StatCard, StatGrid, Table, LinkAction, Chip } from '../components/ui';
import { productionPlanStatus, deliveryPlanStatus, deviceLifecycleStatus, platformOccupancyStatus, isPass, isNG, TODAY } from '../utils/status';

// 看板中心：总览 / 项目 / 质量 / 交付 / 售后 五个看板。
// 定位为「数据可视化 dashboard」：以分布 / 趋势 / 漏斗 / Top / 占比图表为主体，
// 列表仅作为风险 Top 与明细摘要放在下方次要位置，只允许轻量跳转，不承载业务操作。

/* ── 配色（灰阶为主 + 语义色，SaaS 克制风） ─────────────── */
const C = {
  green: '#16a34a', blue: '#2563eb', amber: '#d97706', red: '#dc2626',
  purple: '#7c3aed', teal: '#0d9488', gray: '#94a3b8', slate: '#64748b',
};
// 已校验的分类色序（身份类图表专用，相邻可区分且色盲安全）
const CAT = [C.blue, C.amber, C.teal, C.purple];
const AXIS = { fontSize: 11, fill: '#9ca3af' };
const TT = {
  contentStyle: { fontSize: 12, borderRadius: 8, border: '1px solid #ececec', boxShadow: '0 4px 14px rgba(0,0,0,0.06)', padding: '6px 10px' },
  cursor: { fill: 'rgba(0,0,0,0.03)' },
};
// 状态 -> 语义色（与 StatusBadge 口径一致；用于占比/分布图上色，配合图例二次编码）
const STATUS_HEX = {
  交付中: C.blue, 已验收: C.green, 已延期: C.red, 未开始: C.gray, 已作废: C.slate,
  待处理: C.gray, 待接单: C.gray, 处理中: C.blue, 现场处理中: C.blue, 复检中: C.purple,
  已关闭: C.green, 已关单: C.green, 已取消: C.slate,
};
const sHex = (s) => STATUS_HEX[s] || C.gray;
const LIFE_HEX = {
  生产中: C.blue, 待入库: '#cbd5e1', 待交付: C.gray, 交付中: C.purple, 在线运营: C.green,
  维修中: C.amber, 售后中: C.red, 已停用: C.slate,
};

const WO_CLOSED = ['已关闭', '已关单', '已作废', '已取消'];
const isWOOpen = (w) => !WO_CLOSED.includes(w.status);
const day = (s) => (s || '').slice(0, 10);
const sevWeight = (s) => (['严重', '高'].includes(s) ? 3 : s === '中' ? 2 : 1);

/* ── 时长辅助（解析 'YYYY-MM-DD HH:mm' → Date，计算区间小时数；供各看板时效指标复用） ── */
const parseDT = (s) => {
  if (!s || typeof s !== 'string') return null;
  const m = s.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
  return Number.isNaN(d.getTime()) ? null : d;
};
const hoursBetween = (from, to) => {
  const a = parseDT(from); const b = parseDT(to);
  return a && b ? (b - a) / 3.6e6 : null;
};
// 平台占位「当前时间」（与 TODAY 口径一致；仅用于占位 SLA / 超时计算，非真实业务字段）
const NOW = parseDT(`${TODAY} 00:00`);
const hoursSince = (from) => { const a = parseDT(from); return a ? (NOW - a) / 3.6e6 : null; };
// avgHours(pairs)：pairs 为 [from, to] 数组，返回平均小时数（忽略 null / 无效 / 负值），无数据返回 null
function avgHours(pairs) {
  const xs = (pairs || []).map(([f, t]) => hoursBetween(f, t)).filter((h) => h != null && h >= 0);
  return xs.length ? xs.reduce((s, h) => s + h, 0) / xs.length : null;
}
// fmtDur(hours)：小时 → '2.5 小时' / '1.3 天'（无数据显示 '—'）
function fmtDur(hours) {
  if (hours == null || Number.isNaN(hours)) return '—';
  return hours < 24 ? `${Math.round(hours * 10) / 10} 小时` : `${Math.round((hours / 24) * 10) / 10} 天`;
}
const pctOf = (num, den) => (den ? Math.round((num / den) * 100) : 0);
const topN = (obj, n, color) => Object.entries(obj)
  .map(([name, value]) => ({ name, value, color }))
  .sort((a, b) => b.value - a.value)
  .slice(0, n);

function useShared(state) {
  const projects = state.projects || [];
  const wpp = state.workflowProductionPlans || [];
  const deliveryPlans = state.deliveryPlans || [];
  const devices = state.devices || [];
  const workOrders = [...(state.deliveryWorkOrders || []), ...(state.workOrders || [])];
  const qualityIssues = state.qualityIssues || [];
  const deviceTypes = state.deviceTypes || [];
  const projName = (id) => projects.find((x) => x.id === id)?.name || '—';
  const dtName = (id) => deviceTypes.find((t) => t.id === id)?.name || '—';
  return { projects, wpp, deliveryPlans, devices, workOrders, qualityIssues, deviceTypes, projName, dtName };
}

/* ── 复用图表片段（作为函数返回 chart element，直接作为 ResponsiveContainer 子节点） ── */
function donut(data) {
  return (
    <PieChart>
      <Pie data={data} dataKey="value" nameKey="name" innerRadius={46} outerRadius={78} paddingAngle={2} strokeWidth={0}>
        {data.map((d, i) => <Cell key={i} fill={d.color} />)}
      </Pie>
      <Tooltip {...TT} />
      <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
    </PieChart>
  );
}
function hbar(data, domain) {
  return (
    <BarChart data={data} layout="vertical" margin={{ top: 4, right: 34, left: 6, bottom: 4 }}>
      <CartesianGrid horizontal={false} stroke="#f2f2f2" />
      <XAxis type="number" domain={domain || [0, 'dataMax']} tick={AXIS} axisLine={{ stroke: '#eee' }} tickLine={false} allowDecimals={false} />
      <YAxis type="category" dataKey="name" width={88} tick={AXIS} axisLine={false} tickLine={false} />
      <Tooltip {...TT} />
      <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22} label={{ position: 'right', fontSize: 11, fill: '#6b7280' }}>
        {data.map((d, i) => <Cell key={i} fill={d.color || C.blue} />)}
      </Bar>
    </BarChart>
  );
}

function ChartFrame({ title, subtitle, height = 264, children }) {
  return (
    <Section title={title} subtitle={subtitle}>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    </Section>
  );
}
function Grid2({ children }) {
  return <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{children}</div>;
}

/* ═════════ 总览看板 ═════════ */
function OverviewBoard({ state }) {
  const { projects, deliveryPlans, devices, workOrders, qualityIssues, projName } = useShared(state);
  const tests = (state.testRecords || []).filter((t) => t.stationKey);
  const alerts = state.alerts || [];

  const online = devices.filter((d) => d.status === '在线运营').length;
  const openWO = workOrders.filter(isWOOpen).length;
  const openQI = qualityIssues.filter((q) => q.status !== '已关闭').length;
  const delivering = deliveryPlans.filter((p) => deliveryPlanStatus(p) === '交付中').length;
  const delayed = deliveryPlans.filter((p) => deliveryPlanStatus(p) === '已延期').length;

  // 生命周期阶段分布（饼图）
  const lifeOrder = ['生产中', '待入库', '待交付', '交付中', '在线运营', '维修中', '售后中', '已停用'];
  const lifeData = lifeOrder
    .map((k) => ({ name: k, value: devices.filter((d) => deviceLifecycleStatus(d) === k).length, color: LIFE_HEX[k] || C.gray }))
    .filter((d) => d.value > 0);

  // 风险总览（横向条形）
  const testNG = tests.filter((t) => t.stationResult === 'NG').length;
  const deliveryNG = deliveryPlans.reduce((s, dp) => s + ['factoryInspection', 'siteInstall', 'customerAccept']
    .reduce((a, k) => a + (dp.records?.[k] || []).filter(isNG).length, 0), 0);
  const agedWO = workOrders.filter((w) => isWOOpen(w) && day(w.createdAt) && day(w.createdAt) < TODAY).length;
  const erpPending = devices.filter((d) => d.erpStockStatus === '待检' || d.erpInspectionStatus === '待检').length;
  const riskData = [
    { name: '质量 NG', value: testNG + deliveryNG, color: C.red },
    { name: '交付延期', value: delayed, color: C.amber },
    { name: '售后超时未结', value: agedWO, color: C.red },
    { name: 'ERP 同步待办', value: erpPending, color: C.slate },
  ];

  // 近 7 天动态趋势（按活跃日粗聚合）
  const ev = {};
  const bump = (d, k) => { if (!d) return; const key = day(d); (ev[key] = ev[key] || { newIssue: 0, closeIssue: 0, testNG: 0, delivered: 0 })[k] += 1; };
  qualityIssues.forEach((q) => { bump(q.reportTime, 'newIssue'); (q.processLogs || []).forEach((l) => { if (l.toStatus === '已关闭') bump(l.time, 'closeIssue'); }); });
  workOrders.forEach((w) => { if (w.closedAt) bump(w.closedAt, 'closeIssue'); });
  tests.forEach((t) => { if (t.stationResult === 'NG') bump(t.testTime, 'testNG'); });
  deliveryPlans.forEach((dp) => ['factoryInspection', 'siteInstall', 'customerAccept'].forEach((k) => (dp.records?.[k] || []).forEach((r) => { if (isPass(r)) bump(r.time, 'delivered'); })));
  const trend = Object.keys(ev).sort().slice(-7).map((d) => ({ date: d.slice(5), ...ev[d] }));

  // 风险 Top5（摘要，仅轻量跳转）
  const risks = [];
  deliveryPlans.forEach((dp) => { if (deliveryPlanStatus(dp) === '已延期') risks.push({ type: '交付延期', target: dp.batchNo || dp.name, detail: `计划验收 ${dp.acceptanceDate || dp.dueDate || '—'}`, sev: '高', to: `/delivery-plans/${dp.id}` }); });
  workOrders.filter((w) => isWOOpen(w) && ['严重', '高'].includes(w.severity)).forEach((w) => risks.push({ type: '售后工单', target: w.deviceSN || w.id, detail: w.description || '售后异常处理中', sev: w.severity, to: '/after-sales?tab=orders' }));
  qualityIssues.filter((q) => q.status !== '已关闭' && ['高', '严重'].includes(q.severity)).forEach((q) => risks.push({ type: '质量问题', target: q.deviceSN || q.deviceId, detail: q.issueDesc || '在线质量问题', sev: q.severity, to: '/after-sales?tab=issues' }));
  alerts.filter((a) => a.severity === '严重' && !['已关闭', '已解决'].includes(a.status)).forEach((a) => risks.push({ type: '设备告警', target: a.deviceSN || a.deviceId, detail: a.description || a.alertType, sev: '严重', to: '/assets?tab=devices', proj: a.projectId }));
  const topRisks = risks.sort((x, y) => sevWeight(y.sev) - sevWeight(x.sev)).slice(0, 5);

  return (
    <Page>
      <PageHeader title="总览看板" description="平台级设备全生命周期可视化概览。数据只读同步自各业务模块与 ERP。" />
      <StatGrid cols={6}>
        <StatCard label="项目数" value={projects.length} />
        <StatCard label="在线运营设备" value={online} tone="success" />
        <StatCard label="交付中计划" value={delivering} />
        <StatCard label="未关闭工单" value={openWO} tone={openWO ? 'warning' : 'default'} />
        <StatCard label="未关闭质量问题" value={openQI} tone={openQI ? 'warning' : 'default'} />
        <StatCard label="已延期交付" value={delayed} tone={delayed ? 'danger' : 'default'} />
      </StatGrid>

      <Grid2>
        <ChartFrame title="设备生命周期阶段分布" subtitle={`共 ${devices.length} 台设备`}>{donut(lifeData)}</ChartFrame>
        <ChartFrame title="风险总览" subtitle="质量 / 交付 / 售后 / ERP 四类风险计数">{hbar(riskData)}</ChartFrame>
      </Grid2>

      <ChartFrame title="近 7 天动态趋势" subtitle="新增问题 / 关闭问题 / 测试 NG / 交付完成（按活跃日聚合）">
        <LineChart data={trend} margin={{ top: 8, right: 16, left: -18, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke="#f2f2f2" />
          <XAxis dataKey="date" tick={AXIS} axisLine={{ stroke: '#eee' }} tickLine={false} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
          <Tooltip {...TT} />
          <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="newIssue" name="新增问题" stroke={C.red} strokeWidth={2} dot={{ r: 2 }} />
          <Line type="monotone" dataKey="closeIssue" name="关闭问题" stroke={C.green} strokeWidth={2} dot={{ r: 2 }} />
          <Line type="monotone" dataKey="testNG" name="测试 NG" stroke={C.purple} strokeWidth={2} dot={{ r: 2 }} />
          <Line type="monotone" dataKey="delivered" name="交付完成" stroke={C.blue} strokeWidth={2} dot={{ r: 2 }} />
        </LineChart>
      </ChartFrame>

      <Section title="风险 Top5" subtitle="按严重度排序的高优先风险摘要，可跳转对应模块查看。">
        <Table head={['风险类型', '关联对象', '说明', '']} empty="暂无风险">
          {topRisks.map((r, i) => (
            <tr key={i} className="hover:bg-[#fafafa]">
              <td className="px-3 py-2 whitespace-nowrap"><StatusBadge status={r.type === '交付延期' ? '已延期' : r.type} /></td>
              <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{r.target}</td>
              <td className="px-3 py-2 text-gray-500 text-xs max-w-md truncate">{r.detail}{r.proj ? `（${projName(r.proj)}）` : ''}</td>
              <td className="px-3 py-2 text-xs whitespace-nowrap"><LinkAction to={r.to}>查看</LinkAction></td>
            </tr>
          ))}
        </Table>
      </Section>
    </Page>
  );
}

/* ═════════ 项目看板 ═════════ */
function ProjectBoard({ state }) {
  const { projects, wpp, deliveryPlans, devices, workOrders } = useShared(state);

  // 项目类型分布
  const typeData = ['智魔方', '机场', '工业场景', '遥操数采']
    .map((t, i) => ({ name: t, value: projects.filter((p) => p.projectType === t).length, color: CAT[i] }))
    .filter((d) => d.value > 0);

  const projDeliveryStatus = (p) => {
    const dps = deliveryPlans.filter((d) => d.projectId === p.id);
    if (!dps.length) return '未开始';
    const sts = dps.map((d) => deliveryPlanStatus(d));
    if (sts.includes('已延期')) return '已延期';
    if (sts.every((s) => s === '已验收')) return '已验收';
    if (sts.includes('交付中')) return '交付中';
    return '未开始';
  };
  const delivStatusData = ['交付中', '已验收', '已延期', '未开始']
    .map((k) => ({ name: k, value: projects.filter((p) => projDeliveryStatus(p) === k).length, color: sHex(k) }))
    .filter((d) => d.value > 0);

  // 项目进度排行（已交付 / 目标）
  const progress = projects.map((p) => {
    const delivered = deliveryPlans.filter((dp) => dp.projectId === p.id)
      .reduce((s, dp) => s + (dp.records?.customerAccept || []).filter(isPass).length, 0);
    const pct = p.targetCount ? Math.round((delivered / p.targetCount) * 100) : 0;
    return { name: p.name.replace('项目', ''), value: pct, color: pct >= 80 ? C.green : pct >= 40 ? C.blue : C.gray };
  }).sort((a, b) => b.value - a.value);

  // 项目风险摘要（每行可轻量跳转）
  const riskRows = projects.map((p) => {
    const flags = [];
    if (deliveryPlans.some((dp) => dp.projectId === p.id && deliveryPlanStatus(dp) === '已延期')) flags.push('交付延期');
    if (wpp.some((w) => w.projectId === p.id && productionPlanStatus(w) === '已延期')) flags.push('生产超期');
    const openWOForP = workOrders.filter((w) => w.projectId === p.id && isWOOpen(w)).length;
    if (openWOForP) flags.push(`未结工单 ${openWOForP}`);
    const online = devices.filter((d) => d.projectId === p.id && d.status === '在线运营').length;
    return { p, flags, online };
  });

  return (
    <Page>
      <PageHeader title="项目看板" description="按项目聚合类型、交付状态与进度，识别延期与风险分布。" />
      <StatGrid cols={4}>
        <StatCard label="项目总数" value={projects.length} />
        <StatCard label="进行中项目" value={projects.filter((p) => p.status === '进行中').length} />
        <StatCard label="已延期交付计划" value={deliveryPlans.filter((p) => deliveryPlanStatus(p) === '已延期').length} tone="danger" />
        <StatCard label="未关闭售后工单" value={workOrders.filter(isWOOpen).length} tone="warning" />
      </StatGrid>

      <Grid2>
        <ChartFrame title="项目类型分布">{donut(typeData)}</ChartFrame>
        <ChartFrame title="项目交付状态分布">{donut(delivStatusData)}</ChartFrame>
      </Grid2>

      <ChartFrame title="项目交付进度排行" subtitle="已验收设备 / 目标设备数（%）" height={300}>
        {hbar(progress, [0, 100])}
      </ChartFrame>

      <Section title="项目风险摘要" subtitle="按项目汇总风险标记，可轻量跳转项目详情 / 生产计划 / 交付计划。">
        <Table head={['项目', '类型', '在线设备', '风险标记', '']} empty="暂无项目">
          {riskRows.map(({ p, flags, online }) => (
            <tr key={p.id} className="hover:bg-[#fafafa]">
              <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{p.name}</td>
              <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{p.projectType || '—'}</td>
              <td className="px-3 py-2 text-gray-600">{online}</td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {flags.length ? flags.map((f) => <Chip key={f}>{f}</Chip>) : <span className="text-xs text-green-600">正常</span>}
                </div>
              </td>
              <td className="px-3 py-2 text-xs whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <LinkAction to={`/projects/${p.id}`}>项目详情</LinkAction>
                  <LinkAction to="/projects?tab=production">生产计划</LinkAction>
                  <LinkAction to="/projects?tab=delivery">交付计划</LinkAction>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Section>
    </Page>
  );
}

/* ═════════ 质量看板 ═════════ */
function QualityBoard({ state }) {
  const { devices, qualityIssues, workOrders, dtName } = useShared(state);
  const tests = (state.testRecords || []).filter((t) => t.stationKey);
  const batches = state.materialBatches || [];
  const pwo = state.productionWorkOrders || [];
  const moduleInstances = state.moduleInstances || [];
  const moduleReplacements = state.moduleReplacements || [];

  const semi = tests.filter((t) => t.stationKey === 'semi');
  const oqt = tests.filter((t) => t.stationKey === 'oqt');
  const rate = (arr) => (arr.length ? Math.round(arr.filter((t) => t.stationResult === 'Pass').length / arr.length * 100) : 0);
  const firstPassRate = rate(semi);
  const finalPassRate = Math.max(rate(oqt), firstPassRate);

  // 工站 Pass / NG 分布
  const STATIONS = [['semi', '半成品'], ['init', '初测'], ['mid', '中测'], ['oqt', 'OQT']];
  const stationData = STATIONS.map(([k, label]) => ({
    station: label,
    Pass: tests.filter((t) => t.stationKey === k && t.stationResult === 'Pass').length,
    NG: tests.filter((t) => t.stationKey === k && t.stationResult === 'NG').length,
  }));

  // 故障原因 Top（在线质量问题类型）
  const faultData = [...new Set(qualityIssues.map((q) => q.issueType))]
    .map((t) => ({ name: t, value: qualityIssues.filter((q) => q.issueType === t).length, color: C.purple }))
    .sort((a, b) => b.value - a.value);

  // 生产返修分布（按 NG 工站）
  const repairData = STATIONS.map(([k, label]) => ({ name: label, value: pwo.filter((w) => w.ngStation === k).length, color: C.amber }));

  // 供应商来料质量
  const suppliers = [...new Set(batches.map((b) => b.supplier).filter(Boolean))];
  const supplierRows = suppliers.map((sup) => {
    const b = batches.filter((x) => x.supplier === sup);
    const items = b.flatMap((x) => x.items || []);
    const pass = items.filter((it) => ['合格', '特批使用'].includes(it.result)).length;
    const fail = items.filter((it) => it.result === '不合格').length;
    const r = items.length ? Math.round(pass / items.length * 100) : 0;
    const badBatches = b.filter((x) => (x.items || []).some((it) => it.result === '不合格')).length;
    return { sup, batchCount: b.length, itemCount: items.length, pass, fail, rate: r, badBatches };
  }).sort((a, b) => a.rate - b.rate);
  const supplierChart = supplierRows.map((r) => ({ name: r.sup, value: r.rate, color: r.rate >= 90 ? C.green : r.rate >= 70 ? C.amber : C.red }));

  // 一次通过率趋势（半成品工站按测试日聚合 Pass 占比）
  const semiByDay = {};
  semi.forEach((t) => { const d = day(t.testTime); if (!d) return; (semiByDay[d] = semiByDay[d] || { pass: 0, total: 0 }).total += 1; if (t.stationResult === 'Pass') semiByDay[d].pass += 1; });
  const passTrend = Object.keys(semiByDay).sort().map((d) => ({ date: d.slice(5), rate: pctOf(semiByDay[d].pass, semiByDay[d].total) }));

  // 故障原因 Top10（问题池 faultL2 + 工单 faultL2/faultL3，细粒度，区别于粗分类 issueType 图）
  const faultL2Count = {};
  qualityIssues.forEach((q) => { const k = q.faultL2; if (k && k !== '待业务补充') faultL2Count[k] = (faultL2Count[k] || 0) + 1; });
  workOrders.forEach((w) => { const k = w.faultL2 || w.faultL3; if (k && k !== '待业务补充') faultL2Count[k] = (faultL2Count[k] || 0) + 1; });
  const faultL2Data = topN(faultL2Count, 10, C.red);

  // 返修次数分布（优先 device.repairCount，否则按换件记录 + 生产返修工单数派生，分桶 0/1/2/3+）
  const repairBucketOrder = ['0 次', '1 次', '2 次', '3 次以上'];
  const repairBucket = { '0 次': 0, '1 次': 0, '2 次': 0, '3 次以上': 0 };
  devices.forEach((d) => {
    const rc = d.repairCount != null ? d.repairCount
      : moduleReplacements.filter((r) => r.deviceId === d.id).length + pwo.filter((w) => w.deviceId === d.id).length;
    const key = rc <= 0 ? '0 次' : rc === 1 ? '1 次' : rc === 2 ? '2 次' : '3 次以上';
    repairBucket[key] += 1;
  });
  const repairCountData = repairBucketOrder.map((k) => ({ name: k, value: repairBucket[k], color: k === '0 次' ? C.gray : k === '3 次以上' ? C.red : C.amber }));

  // 模块占用异常计数（源自模块实例平台占用状态）
  const moduleBindException = moduleInstances.filter((mi) => platformOccupancyStatus(mi) === '绑定异常').length;
  const moduleReplaced = moduleInstances.filter((mi) => platformOccupancyStatus(mi) === '已更换').length;
  const modulePendingRepair = moduleInstances.filter((mi) => platformOccupancyStatus(mi) === '旧件待返修').length;

  // 故障原因与模块类型关联（换件工单 faultL2 × 需换模块类型，原型推断）
  const faultModuleCount = {};
  workOrders.filter((w) => w.involvesReplacement && w.faultL2).forEach((w) => {
    const part = (w.needReplaceModuleType || '其他').replace('模块', '');
    faultModuleCount[`${w.faultL2}｜${part}`] = (faultModuleCount[`${w.faultL2}｜${part}`] || 0) + 1;
  });
  const faultModuleData = topN(faultModuleCount, 8, C.purple);

  // 高风险设备摘要
  const RISK_STATUS = ['生产返修中', 'NG待返修', '测试NG', '复测中', '维修中', '售后中'];
  const riskDevices = devices.filter((d) => RISK_STATUS.includes(d.status)).slice(0, 10);

  return (
    <Page>
      <PageHeader title="质量看板" description="来料、装配测试与在线质量聚合，追踪通过率、NG 分布与问题来源。" />
      <StatGrid cols={4}>
        <StatCard label="一次通过率" value={`${firstPassRate}%`} tone="success" />
        <StatCard label="最终通过率" value={`${finalPassRate}%`} tone="success" />
        <StatCard label="测试 NG 次数" value={tests.filter((t) => t.stationResult === 'NG').length} tone="danger" />
        <StatCard label="未关闭质量问题" value={qualityIssues.filter((q) => q.status !== '已关闭').length} tone="warning" />
      </StatGrid>

      <StatGrid cols={3}>
        <StatCard label="绑定异常模块数" value={moduleBindException} tone={moduleBindException ? 'danger' : 'default'} hint="模块实例平台占用状态 = 绑定异常" />
        <StatCard label="已更换模块数" value={moduleReplaced} hint="模块实例平台占用状态 = 已更换" />
        <StatCard label="旧件待返修数" value={modulePendingRepair} tone={modulePendingRepair ? 'warning' : 'default'} hint="下机旧件平台占用状态 = 旧件待返修" />
      </StatGrid>

      <ChartFrame title="一次通过率趋势" subtitle="半成品工站按测试日 Pass 占比（%）">
        <LineChart data={passTrend} margin={{ top: 8, right: 16, left: -18, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke="#f2f2f2" />
          <XAxis dataKey="date" tick={AXIS} axisLine={{ stroke: '#eee' }} tickLine={false} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} domain={[0, 100]} width={32} />
          <Tooltip {...TT} />
          <Line type="monotone" dataKey="rate" name="一次通过率" stroke={C.green} strokeWidth={2} dot={{ r: 2 }} />
        </LineChart>
      </ChartFrame>

      <Grid2>
        <ChartFrame title="工站 Pass / NG 分布" subtitle="半成品 / 初测 / 中测 / OQT">
          <BarChart data={stationData} margin={{ top: 8, right: 8, left: -18, bottom: 4 }} barGap={2}>
            <CartesianGrid vertical={false} stroke="#f2f2f2" />
            <XAxis dataKey="station" tick={AXIS} axisLine={{ stroke: '#eee' }} tickLine={false} />
            <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip {...TT} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Pass" name="Pass" fill={C.green} radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="NG" name="NG" fill={C.red} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ChartFrame>
        <ChartFrame title="在线故障原因 Top" subtitle="按问题类型（issueType）粗分类">{hbar(faultData)}</ChartFrame>
      </Grid2>

      <Grid2>
        <ChartFrame title="故障原因 Top10" subtitle="问题池 + 工单细粒度故障点（faultL2/faultL3）">{hbar(faultL2Data)}</ChartFrame>
        <ChartFrame title="返修次数分布" subtitle="设备按返修次数分桶（repairCount / 换件·返修工单派生）">{hbar(repairCountData)}</ChartFrame>
      </Grid2>

      <Grid2>
        <ChartFrame title="生产返修分布" subtitle="返修工单按 NG 工站">{hbar(repairData)}</ChartFrame>
        <ChartFrame title="供应商来料合格率排行" subtitle="来料合格率（%）">{hbar(supplierChart, [0, 100])}</ChartFrame>
      </Grid2>

      <ChartFrame title="故障原因与模块类型关联" subtitle="换件工单：故障点（faultL2）× 需换模块类型（原型推断）">
        {hbar(faultModuleData)}
      </ChartFrame>

      <Section title="高风险设备摘要" subtitle="处于返修 / NG / 维修 / 售后状态的设备，可跳转设备详情查看。">
        <Table head={['设备 SN', '设备类型', '生命周期', '当前状态', '']} empty="暂无高风险设备">
          {riskDevices.map((d) => (
            <tr key={d.id} className="hover:bg-[#fafafa]">
              <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{d.sn || d.id}</td>
              <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{dtName(d.deviceTypeId)}</td>
              <td className="px-3 py-2"><StatusBadge status={deviceLifecycleStatus(d)} /></td>
              <td className="px-3 py-2"><StatusBadge status={d.status} /></td>
              <td className="px-3 py-2 text-xs whitespace-nowrap"><LinkAction to={`/devices/${d.id}`}>设备详情</LinkAction></td>
            </tr>
          ))}
        </Table>
      </Section>
    </Page>
  );
}

/* ═════════ 交付看板 ═════════ */
function DeliveryBoard({ state }) {
  const { deliveryPlans, projName } = useShared(state);
  const dwo = state.deliveryWorkOrders || [];
  const deliveryExceptions = state.deliveryExceptions || [];

  const delivering = deliveryPlans.filter((p) => deliveryPlanStatus(p) === '交付中').length;
  const accepted = deliveryPlans.filter((p) => deliveryPlanStatus(p) === '已验收').length;
  const delayed = deliveryPlans.filter((p) => deliveryPlanStatus(p) === '已延期').length;
  const boundTotal = deliveryPlans.reduce((s, p) => s + (p.boundDeviceIds || []).length, 0);
  const acceptedDevices = deliveryPlans.reduce((s, p) => s + (p.records?.customerAccept || []).filter(isPass).length, 0);
  const acceptRate = boundTotal ? Math.round((acceptedDevices / boundTotal) * 100) : 0;

  // 交付计划状态分布
  const planStatusData = ['交付中', '已验收', '已延期', '未开始', '已作废']
    .map((k) => ({ name: k, value: deliveryPlans.filter((p) => deliveryPlanStatus(p) === k).length, color: sHex(k) }))
    .filter((d) => d.value > 0);

  // 子工单状态分布
  const woStatusData = [...new Set(dwo.map((w) => w.status))]
    .map((s) => ({ name: s, value: dwo.filter((w) => w.status === s).length, color: sHex(s) }))
    .sort((a, b) => b.value - a.value);

  // 交付风险清单 + 类型分布
  const risks = [];
  deliveryPlans.forEach((dp) => {
    const status = deliveryPlanStatus(dp);
    if (status === '已延期') risks.push({ type: '延期', target: dp.batchNo || dp.name, project: projName(dp.projectId), detail: `计划验收 ${dp.acceptanceDate || dp.dueDate || '—'}`, to: `/delivery-plans/${dp.id}` });
    if (status === '交付中') {
      const bound = (dp.boundDeviceIds || []).length;
      const siPass = (dp.records?.siteInstall || []).filter(isPass).length;
      const fiPass = (dp.records?.factoryInspection || []).filter(isPass).length;
      if (dp.currentNode === '现场安装调试' && dp.siteInstallDate && dp.siteInstallDate < TODAY && siPass < bound) risks.push({ type: '节点超时', target: dp.batchNo || dp.name, project: projName(dp.projectId), detail: `现场安装调试滞后（计划 ${dp.siteInstallDate}）`, to: `/delivery-plans/${dp.id}?node=siteInstall` });
      else if (dp.currentNode === '出厂检验' && dp.factoryDate && dp.factoryDate < TODAY && fiPass < bound) risks.push({ type: '节点超时', target: dp.batchNo || dp.name, project: projName(dp.projectId), detail: `出厂检验滞后（计划出厂 ${dp.factoryDate}）`, to: `/delivery-plans/${dp.id}?node=factoryInspection` });
    }
    (dp.records?.siteInstall || []).filter(isNG).forEach((r) => risks.push({ type: '现场条件未满足', target: r.deviceSN || r.deviceId, project: projName(dp.projectId), detail: r.notes || '现场安装调试异常', to: `/delivery-plans/${dp.id}?node=siteInstall` }));
    (dp.records?.customerAccept || []).filter(isNG).forEach((r) => risks.push({ type: '验收不通过', target: r.deviceSN || r.deviceId, project: projName(dp.projectId), detail: r.notes || '客户验收未通过', to: `/delivery-plans/${dp.id}?node=customerAccept` }));
    (dp.records?.factoryInspection || []).filter(isNG).forEach((r) => risks.push({ type: '其他', target: r.deviceSN || r.deviceId, project: projName(dp.projectId), detail: `出厂检验NG：${r.notes || '出厂检验未通过'}`, to: `/delivery-plans/${dp.id}?node=factoryInspection` }));
  });
  dwo.filter((w) => !WO_CLOSED.includes(w.status)).forEach((w) => risks.push({ type: '已转售后', target: w.deviceSN || w.id, project: projName(w.projectId), detail: `${w.id}｜${w.description || '交付异常已转售后工单'}`, to: '/after-sales?tab=orders' }));

  const RISK_HEX = { 延期: C.amber, 节点超时: C.red, 现场条件未满足: C.amber, 验收不通过: C.red, 已转售后: C.slate, 其他: C.gray };
  const riskTypeData = ['延期', '节点超时', '现场条件未满足', '验收不通过', '已转售后', '其他']
    .map((t) => ({ name: t, value: risks.filter((r) => r.type === t).length, color: RISK_HEX[t] }))
    .filter((d) => d.value > 0);

  // ── 交付异常（item 十二）──
  const exTotal = deliveryExceptions.length;
  const exToCS = deliveryExceptions.filter((e) => e.submittedToCS === true).length;
  const exToIssue = deliveryExceptions.filter((e) => e.linkedIssueId).length;
  const exToWO = deliveryExceptions.filter((e) => e.linkedWorkOrderId).length;
  // 交付异常平均关闭时长：已闭环状态自 occurTime/recordTime 至最后一条处理日志时间
  const EX_CLOSED = ['已关闭', '已远程解决', '已退回交付继续处理'];
  const exCloseHours = avgHours(deliveryExceptions.filter((e) => EX_CLOSED.includes(e.status)).map((e) => {
    const logs = e.processLogs || [];
    return [e.occurTime || e.recordTime, logs.length ? logs[logs.length - 1].time : null];
  }));

  // 交付异常类型 Top5
  const exTypeCount = {};
  deliveryExceptions.forEach((e) => { const k = e.exceptionType || '未标注'; exTypeCount[k] = (exTypeCount[k] || 0) + 1; });
  const exTypeData = topN(exTypeCount, 5, C.amber);

  // 交付延期原因分布：已延期计划的异常按类型聚合（无异常记「未标注」，原型推断）
  const delayedPlans = deliveryPlans.filter((p) => deliveryPlanStatus(p) === '已延期');
  const delayReasonCount = {};
  delayedPlans.forEach((p) => {
    const exs = deliveryExceptions.filter((e) => e.deliveryPlanId === p.id);
    if (exs.length) exs.forEach((e) => { const k = e.exceptionType || '未标注'; delayReasonCount[k] = (delayReasonCount[k] || 0) + 1; });
    else delayReasonCount['未标注'] = (delayReasonCount['未标注'] || 0) + 1;
  });
  const delayReasonData = topN(delayReasonCount, 8, C.red);

  // 交付子工单按时完成率（占位：无 SLA/期望完成字段，以已关闭且回填 closedAt 的占比近似）
  const closedDwo = dwo.filter((w) => WO_CLOSED.includes(w.status));
  const dwoOnTimeRate = pctOf(closedDwo.filter((w) => w.closedAt).length, closedDwo.length);

  // 交付工程师处理量排行（子工单按处理人计数）
  const dwoEngCount = {};
  dwo.forEach((w) => { if (w.assignedTo) dwoEngCount[w.assignedTo] = (dwoEngCount[w.assignedTo] || 0) + 1; });
  const dwoEngData = topN(dwoEngCount, 8, C.blue);

  // 模板超时数（占位：按交付流程模板统计已延期计划数）
  const cubeDelayCount = deliveryPlans.filter((p) => p.templateName === '智魔方交付流程模板' && deliveryPlanStatus(p) === '已延期').length;
  const genDelayCount = deliveryPlans.filter((p) => p.templateName === '通用部署流程模板' && deliveryPlanStatus(p) === '已延期').length;

  return (
    <Page>
      <PageHeader title="交付看板" description="按交付计划聚合出厂检验、现场安装与客户验收，追踪状态与风险分布。" />
      <StatGrid cols={5}>
        <StatCard label="交付中计划" value={delivering} />
        <StatCard label="已验收计划" value={accepted} tone="success" />
        <StatCard label="已延期计划" value={delayed} tone={delayed ? 'danger' : 'default'} />
        <StatCard label="验收通过率" value={`${acceptRate}%`} tone="success" />
        <StatCard label="累计验收通过设备" value={acceptedDevices} tone="success" />
      </StatGrid>

      <StatGrid cols={5}>
        <StatCard label="交付异常数" value={exTotal} tone={exTotal ? 'warning' : 'default'} />
        <StatCard label="提交技术客服数" value={exToCS} hint="submittedToCS = true" />
        <StatCard label="转问题池数" value={exToIssue} hint="已生成质量问题" />
        <StatCard label="转售后工单数" value={exToWO} hint="已生成售后工单" />
        <StatCard label="异常平均关闭时长" value={fmtDur(exCloseHours)} hint="已闭环异常 occur→末条日志" />
      </StatGrid>

      <StatGrid cols={3}>
        <StatCard label="子工单按时完成率" value={`${dwoOnTimeRate}%`} hint="占位：无 SLA 字段，按已关闭回填近似" />
        <StatCard label="智魔方前置准备超时数" value={cubeDelayCount} tone={cubeDelayCount ? 'danger' : 'default'} hint="占位：智魔方交付流程模板已延期计划" />
        <StatCard label="通用部署超时数" value={genDelayCount} tone={genDelayCount ? 'danger' : 'default'} hint="占位：通用部署流程模板已延期计划" />
      </StatGrid>

      <Grid2>
        <ChartFrame title="交付计划状态分布">{donut(planStatusData)}</ChartFrame>
        <ChartFrame title="交付子工单状态分布">{hbar(woStatusData)}</ChartFrame>
      </Grid2>

      <ChartFrame title="交付风险类型分布" subtitle="延期 / 节点超时 / 现场条件未满足 / 验收不通过 / 已转售后 / 其他">
        {hbar(riskTypeData)}
      </ChartFrame>

      <Grid2>
        <ChartFrame title="交付异常类型 Top5" subtitle="按 exceptionType 计数">{hbar(exTypeData)}</ChartFrame>
        <ChartFrame title="交付工程师处理量排行" subtitle="交付子工单按处理人计数">{hbar(dwoEngData)}</ChartFrame>
      </Grid2>

      <ChartFrame title="交付延期原因分布" subtitle="已延期计划关联异常按类型聚合（原型推断）">
        {hbar(delayReasonData)}
      </ChartFrame>

      <Section title="交付风险清单" subtitle="看板聚合视图，集中查看交付风险，仅支持轻量跳转。">
        <Table head={['风险类型', '关联对象', '项目', '说明', '']} empty="暂无交付风险">
          {risks.map((r, i) => (
            <tr key={i} className="hover:bg-[#fafafa]">
              <td className="px-3 py-2 whitespace-nowrap"><StatusBadge status={r.type} /></td>
              <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{r.target}</td>
              <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{r.project}</td>
              <td className="px-3 py-2 text-gray-500 text-xs max-w-xs truncate">{r.detail}</td>
              <td className="px-3 py-2 text-xs whitespace-nowrap"><LinkAction to={r.to}>查看</LinkAction></td>
            </tr>
          ))}
        </Table>
      </Section>
    </Page>
  );
}

/* ═════════ 售后看板 ═════════ */
function AfterSalesBoard({ state }) {
  const { workOrders, qualityIssues, projName } = useShared(state);
  const alerts = state.alerts || [];
  const materials = state.materials || [];
  const moduleReplacements = state.moduleReplacements || [];

  const openWO = workOrders.filter(isWOOpen);
  const replacementWO = workOrders.filter((w) => w.involvesReplacement).length;
  const openQI = qualityIssues.filter((q) => q.status !== '已关闭').length;
  const severeAlerts = alerts.filter((a) => a.severity === '严重' && !['已关闭', '已解决'].includes(a.status)).length;

  // 问题处理漏斗
  const funnelData = [
    { name: '问题上报', value: qualityIssues.length, color: '#1d4ed8' },
    { name: '已受理', value: qualityIssues.filter((q) => q.status !== '待处理').length, color: '#2563eb' },
    { name: '转售后工单', value: workOrders.length, color: '#3b82f6' },
    { name: '已关单', value: workOrders.filter((w) => WO_CLOSED.includes(w.status)).length, color: '#60a5fa' },
  ];

  // 售后工单状态分布（归并为标准态）
  const WO_BUCKET = (s) => {
    if (['待处理', '待分派', '待接单', '待上门'].includes(s)) return '待接单';
    if (['处理中', '现场处理中'].includes(s)) return '处理中';
    if (s === '复检中') return '复检中';
    if (['已关闭', '已关单'].includes(s)) return '已关单';
    if (s === '已作废') return '已作废';
    return '已取消';
  };
  const woStatusData = ['待接单', '处理中', '复检中', '已关单', '已作废', '已取消']
    .map((k) => ({ name: k, value: workOrders.filter((w) => WO_BUCKET(w.status) === k).length, color: sHex(k) }))
    .filter((d) => d.value > 0);

  // 高频故障原因 Top10（工单 faultL2/L3/L1 + 问题池 faultL2，取代原告警类型口径）
  const faultCount = {};
  workOrders.forEach((w) => { const k = w.faultL2 || w.faultL3 || w.faultL1; if (k && k !== '待业务补充') faultCount[k] = (faultCount[k] || 0) + 1; });
  qualityIssues.forEach((q) => { const k = q.faultL2; if (k && k !== '待业务补充') faultCount[k] = (faultCount[k] || 0) + 1; });
  const faultData = topN(faultCount, 10, C.amber);

  // ── 问题池指标（item 十三，源自 qualityIssues）──
  const qiTotal = qualityIssues.length;
  const qiPre = qualityIssues.filter((q) => q.status === '待预处理').length;
  const qiProcessing = qualityIssues.filter((q) => q.status === '预处理中').length;
  const qiMoreInfo = qualityIssues.filter((q) => q.status === '待补充信息').length;
  const qiNewToday = qualityIssues.filter((q) => day(q.enterPoolTime || q.reportTime) === TODAY).length;
  const qiRemoteToday = qualityIssues.filter((q) => day(q.remoteCloseTime) === TODAY).length;
  const qiToWOToday = qualityIssues.filter((q) => day(q.toWorkOrderTime) === TODAY).length;
  const csFirstRespHours = avgHours(qualityIssues.map((q) => [q.enterPoolTime, q.csFirstResponseTime]));
  const preprocessHours = avgHours(qualityIssues.map((q) => [q.csFirstResponseTime, q.preprocessDoneTime]));
  const poolStayHours = avgHours(qualityIssues.map((q) => [q.enterPoolTime, q.closeTime || q.toWorkOrderTime || q.remoteCloseTime]));
  const remoteCloseRate = pctOf(qualityIssues.filter((q) => q.remoteCloseTime).length, qiTotal);
  const toWORate = pctOf(qualityIssues.filter((q) => q.toWorkOrderTime).length, qiTotal);
  const qiNoRespOverdue = qualityIssues.filter((q) => !q.csFirstResponseTime && (hoursSince(q.enterPoolTime) || 0) > 48).length;

  // ── 工单时效指标（源自合并后的 workOrders，含交付子工单）──
  const leaderDispatchHours = avgHours(workOrders.map((w) => [w.createTime, w.dispatchTime]));
  const engAcceptHours = avgHours(workOrders.map((w) => [w.dispatchTime, w.acceptTime]));
  const visitHours = avgHours(workOrders.map((w) => [w.acceptTime, w.actualVisitTime]));
  const visitPairs = workOrders.filter((w) => parseDT(w.expectVisitTime) && parseDT(w.actualVisitTime));
  const visitOnTimeRate = pctOf(visitPairs.filter((w) => parseDT(w.actualVisitTime) <= parseDT(w.expectVisitTime)).length, visitPairs.length);
  const onsiteHours = avgHours(workOrders.map((w) => [w.onsiteStartTime, w.onsiteDoneTime]));
  const closeHours = avgHours(workOrders.filter((w) => w.closeTime).map((w) => [w.createTime, w.closeTime]));
  const woOverSLA = workOrders.filter((w) => isWOOpen(w) && (hoursSince(w.createTime || w.createdAt) || 0) > 48).length;

  // 技术客服 / 工程师处理量排行
  const csAgentCount = {};
  qualityIssues.forEach((q) => { if (q.csAgent) csAgentCount[q.csAgent] = (csAgentCount[q.csAgent] || 0) + 1; });
  const csAgentData = topN(csAgentCount, 8, C.teal);
  const engCount = {};
  workOrders.forEach((w) => { const k = w.engineer || w.assignedTo; if (k) engCount[k] = (engCount[k] || 0) + 1; });
  const engData = topN(engCount, 8, C.blue);

  // 工程师关单及时率排行（占位：已关单工单中 create→close ≤ 48h 占比）
  const engClose = {};
  workOrders.filter((w) => w.closeTime || w.closedAt).forEach((w) => {
    const k = w.engineer || w.assignedTo; if (!k) return;
    const h = hoursBetween(w.createTime || w.createdAt, w.closeTime || w.closedAt);
    const rec = (engClose[k] = engClose[k] || { closed: 0, onTime: 0 });
    rec.closed += 1;
    if (h != null && h >= 0 && h <= 48) rec.onTime += 1;
  });
  const engCloseData = Object.entries(engClose)
    .map(([name, r]) => ({ name, value: pctOf(r.onTime, r.closed), color: C.green }))
    .sort((a, b) => b.value - a.value).slice(0, 8);

  // 换件部件分布（按核心部件类型）
  const matCat = {};
  materials.forEach((m) => { matCat[m.id] = m.category; });
  const partCount = {};
  moduleReplacements.forEach((r) => { const c = matCat[r.addedMaterialId] || matCat[r.removedMaterialId] || '其他'; partCount[c] = (partCount[c] || 0) + 1; });
  workOrders.filter((w) => w.involvesReplacement).forEach((w) => { const c = (w.needReplaceModuleType || '其他').replace('模块', ''); partCount[c] = (partCount[c] || 0) + 1; });
  const partData = Object.entries(partCount).map(([name, value]) => ({ name, value, color: C.teal })).sort((a, b) => b.value - a.value);

  // 超时工单摘要（未关闭且创建早于 TODAY）
  const agedWO = openWO.filter((w) => day(w.createdAt) && day(w.createdAt) < TODAY).sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '')).slice(0, 10);

  return (
    <Page>
      <PageHeader title="售后看板" description="聚合售后工单处理漏斗、状态分布、故障原因与换件部件。" />
      <StatGrid cols={5}>
        <StatCard label="未关闭工单" value={openWO.length} tone={openWO.length ? 'warning' : 'default'} />
        <StatCard label="换件工单" value={replacementWO} />
        <StatCard label="未关闭质量问题" value={openQI} tone={openQI ? 'warning' : 'default'} />
        <StatCard label="严重告警" value={severeAlerts} tone={severeAlerts ? 'danger' : 'default'} />
        <StatCard label="超 SLA 工单数" value={woOverSLA} tone={woOverSLA ? 'danger' : 'default'} hint="占位：未关闭且已过 48h" />
      </StatGrid>

      <StatGrid cols={6}>
        <StatCard label="待预处理数" value={qiPre} />
        <StatCard label="预处理中数" value={qiProcessing} />
        <StatCard label="待补充信息数" value={qiMoreInfo} />
        <StatCard label="今日新增问题" value={qiNewToday} hint={`口径日 ${TODAY}`} />
        <StatCard label="今日远程关闭" value={qiRemoteToday} />
        <StatCard label="今日转售后工单" value={qiToWOToday} />
      </StatGrid>

      <StatGrid cols={6}>
        <StatCard label="客服平均首次响应" value={fmtDur(csFirstRespHours)} hint="enterPool→首次响应" />
        <StatCard label="平均预处理时长" value={fmtDur(preprocessHours)} hint="首次响应→预处理完成" />
        <StatCard label="问题池平均停留" value={fmtDur(poolStayHours)} hint="enterPool→关闭/转单/远程闭环" />
        <StatCard label="远程关闭率" value={`${remoteCloseRate}%`} />
        <StatCard label="转售后工单率" value={`${toWORate}%`} />
        <StatCard label="超时未响应问题数" value={qiNoRespOverdue} tone={qiNoRespOverdue ? 'danger' : 'default'} hint="占位：未响应且已过 48h" />
      </StatGrid>

      <StatGrid cols={6}>
        <StatCard label="Leader 平均分派时长" value={fmtDur(leaderDispatchHours)} hint="create→dispatch" />
        <StatCard label="工程师平均接单时长" value={fmtDur(engAcceptHours)} hint="dispatch→accept" />
        <StatCard label="平均上门时长" value={fmtDur(visitHours)} hint="accept→实际上门" />
        <StatCard label="上门准时率" value={`${visitOnTimeRate}%`} hint="占位：实际≤期望上门" />
        <StatCard label="平均现场处理时长" value={fmtDur(onsiteHours)} hint="现场开始→完成" />
        <StatCard label="平均关单时长" value={fmtDur(closeHours)} hint="create→close（已关单）" />
      </StatGrid>

      <Grid2>
        <ChartFrame title="问题处理漏斗" subtitle="问题上报 → 受理 → 转售后工单 → 已关单">{hbar(funnelData)}</ChartFrame>
        <ChartFrame title="售后工单状态分布">{hbar(woStatusData)}</ChartFrame>
      </Grid2>

      <Grid2>
        <ChartFrame title="高频故障原因 Top10" subtitle="工单 + 问题池故障点（faultL2/L3/L1）">{hbar(faultData)}</ChartFrame>
        <ChartFrame title="换件部件分布" subtitle="按核心部件类型">{hbar(partData)}</ChartFrame>
      </Grid2>

      <Grid2>
        <ChartFrame title="技术客服处理量排行" subtitle="问题池按技术客服计数">{hbar(csAgentData)}</ChartFrame>
        <ChartFrame title="工程师处理量排行" subtitle="工单按工程师计数">{hbar(engData)}</ChartFrame>
      </Grid2>

      <ChartFrame title="工程师关单及时率排行" subtitle="占位：已关单工单 create→close ≤ 48h 占比（%）">
        {hbar(engCloseData, [0, 100])}
      </ChartFrame>

      <Section title="超时工单摘要" subtitle="未关闭且创建较早的工单，可跳转售后工单查看。">
        <Table head={['工单号', '设备 SN', '项目', '严重度', '创建时间', '']} empty="暂无超时工单">
          {agedWO.map((w) => (
            <tr key={w.id} className="hover:bg-[#fafafa]">
              <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{w.id}</td>
              <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{w.deviceSN || w.deviceId || '—'}</td>
              <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{projName(w.projectId)}</td>
              <td className="px-3 py-2"><StatusBadge status={w.severity} /></td>
              <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{w.createdAt || '—'}</td>
              <td className="px-3 py-2 text-xs whitespace-nowrap"><LinkAction to="/after-sales?tab=orders">查看</LinkAction></td>
            </tr>
          ))}
        </Table>
      </Section>
    </Page>
  );
}

const BOARDS = {
  overview: OverviewBoard,
  project: ProjectBoard,
  quality: QualityBoard,
  delivery: DeliveryBoard,
  aftersales: AfterSalesBoard,
};

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const { state } = useApp();
  const tab = searchParams.get('tab');
  // 兼容旧链接：operation → overview
  const key = tab === 'operation' ? 'overview' : tab;
  const Board = BOARDS[key] || OverviewBoard;
  return <Board state={state} />;
}
