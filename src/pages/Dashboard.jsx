import { useSearchParams } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import { Page, PageHeader, Section, StatCard, StatGrid, Table, LinkAction, Chip } from '../components/ui';
import { productionPlanStatus, deliveryPlanStatus, deviceLifecycleStatus, isPass, isNG, TODAY } from '../utils/status';

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
  维修中: C.amber, 售后中: C.red, 已停用: C.slate, 已报废: '#475569', 退役: C.slate,
};

const WO_CLOSED = ['已关闭', '已关单', '已作废', '已取消'];
const isWOOpen = (w) => !WO_CLOSED.includes(w.status);
const day = (s) => (s || '').slice(0, 10);
const sevWeight = (s) => (['严重', '高'].includes(s) ? 3 : s === '中' ? 2 : 1);

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
  const lifeOrder = ['生产中', '待入库', '待交付', '交付中', '在线运营', '维修中', '售后中', '已停用', '已报废'];
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
  const { devices, qualityIssues, dtName } = useShared(state);
  const tests = (state.testRecords || []).filter((t) => t.stationKey);
  const batches = state.materialBatches || [];
  const pwo = state.productionWorkOrders || [];

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
        <ChartFrame title="在线故障原因 Top">{hbar(faultData)}</ChartFrame>
      </Grid2>

      <Grid2>
        <ChartFrame title="生产返修分布" subtitle="返修工单按 NG 工站">{hbar(repairData)}</ChartFrame>
        <ChartFrame title="供应商来料合格率排行" subtitle="来料合格率（%）">{hbar(supplierChart, [0, 100])}</ChartFrame>
      </Grid2>

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

      <Grid2>
        <ChartFrame title="交付计划状态分布">{donut(planStatusData)}</ChartFrame>
        <ChartFrame title="交付子工单状态分布">{hbar(woStatusData)}</ChartFrame>
      </Grid2>

      <ChartFrame title="交付风险类型分布" subtitle="延期 / 节点超时 / 现场条件未满足 / 验收不通过 / 已转售后 / 其他">
        {hbar(riskTypeData)}
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

  // 高频故障原因（在线告警类型）
  const faultData = [...new Set(alerts.map((a) => a.alertType))]
    .map((t) => ({ name: t, value: alerts.filter((a) => a.alertType === t).length, color: C.amber }))
    .sort((a, b) => b.value - a.value);

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
      <StatGrid cols={4}>
        <StatCard label="未关闭工单" value={openWO.length} tone={openWO.length ? 'warning' : 'default'} />
        <StatCard label="换件工单" value={replacementWO} />
        <StatCard label="未关闭质量问题" value={openQI} tone={openQI ? 'warning' : 'default'} />
        <StatCard label="严重告警" value={severeAlerts} tone={severeAlerts ? 'danger' : 'default'} />
      </StatGrid>

      <Grid2>
        <ChartFrame title="问题处理漏斗" subtitle="问题上报 → 受理 → 转售后工单 → 已关单">{hbar(funnelData)}</ChartFrame>
        <ChartFrame title="售后工单状态分布">{hbar(woStatusData)}</ChartFrame>
      </Grid2>

      <Grid2>
        <ChartFrame title="高频故障原因" subtitle="在线告警类型分布">{hbar(faultData)}</ChartFrame>
        <ChartFrame title="换件部件分布" subtitle="按核心部件类型">{hbar(partData)}</ChartFrame>
      </Grid2>

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
