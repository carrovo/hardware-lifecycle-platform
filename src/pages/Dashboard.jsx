import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import { Pagination, usePaged } from '../components/Pagination';
import { Page, PageHeader, Section, Toolbar, Select, StatCard, StatGrid, Table, LinkAction } from '../components/ui';
import { productionPlanStatus, deliveryPlanStatus, deviceLifecycleStatus, isPass, isNG } from '../utils/status';

// 看板中心：总览 / 项目 / 质量 / 交付 / 售后 五个看板。
// SaaS dashboard 风格（非大屏）：紧凑指标卡 + 分区卡片 + 紧凑表格，看板只做聚合与跳转，不承载业务流程。

const WO_CLOSED = ['已关闭', '已关单', '已作废', '已取消'];
const isWOOpen = (w) => !WO_CLOSED.includes(w.status);

function useShared(state) {
  const projects = state.projects || [];
  const wpp = state.workflowProductionPlans || [];
  const deliveryPlans = state.deliveryPlans || [];
  const devices = state.devices || [];
  const workOrders = [...(state.deliveryWorkOrders || []), ...(state.workOrders || [])];
  const qualityIssues = state.qualityIssues || [];
  const projName = (id) => projects.find((x) => x.id === id)?.name || '—';
  const projType = (id) => projects.find((x) => x.id === id)?.projectType || '—';
  return { projects, wpp, deliveryPlans, devices, workOrders, qualityIssues, projName, projType };
}

/* ═════════ 总览看板 ═════════ */
function OverviewBoard({ state }) {
  const { projects, wpp, deliveryPlans, devices, workOrders, qualityIssues } = useShared(state);
  const openWO = workOrders.filter(isWOOpen).length;
  const openQI = qualityIssues.filter((q) => q.status !== '已关闭').length;
  const online = devices.filter((d) => d.status === '在线运营').length;

  const lifecycle = ['生产中', '待入库', '待交付', '交付中', '在线运营', '维修中', '已作废'].map((k) => ({
    k, n: devices.filter((d) => deviceLifecycleStatus(d) === k).length,
  }));
  const lastUpdated = devices.map((d) => d.updatedAt).filter(Boolean).sort().slice(-1)[0] || '—';

  return (
    <Page>
      <PageHeader title="总览看板" description="平台级设备全生命周期概览。数据只读同步自各业务模块与 ERP。" />
      <StatGrid cols={6}>
        <StatCard label="项目数" value={projects.length} />
        <StatCard label="生产中计划" value={wpp.filter((p) => productionPlanStatus(p) === '生产中').length} />
        <StatCard label="交付中计划" value={deliveryPlans.filter((p) => deliveryPlanStatus(p) === '交付中').length} />
        <StatCard label="在线运营设备" value={online} tone="success" />
        <StatCard label="未关闭工单" value={openWO} tone={openWO ? 'warning' : 'default'} />
        <StatCard label="未关闭质量问题" value={openQI} tone={openQI ? 'warning' : 'default'} />
      </StatGrid>

      <Section title="设备生命周期分布" subtitle={`共 ${devices.length} 台 · 数据更新时间 ${lastUpdated}`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {lifecycle.map(({ k, n }) => (
            <div key={k} className="rounded-lg border border-[#f0f0f0] bg-[#fafafa] px-3 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-semibold text-gray-900 tracking-tight">{n}</span>
                <StatusBadge status={k} dot />
              </div>
            </div>
          ))}
        </div>
      </Section>
    </Page>
  );
}

/* ═════════ 项目看板 ═════════ */
function ProjectBoard({ state }) {
  const { projects, wpp, deliveryPlans, devices, workOrders } = useShared(state);
  const [projectId, setProjectId] = useState('');
  const [type, setType] = useState('');

  const bottleneckOf = (p) => {
    const prod = wpp.find((w) => w.projectId === p.id && productionPlanStatus(w) === '生产中');
    const deliv = deliveryPlans.find((dp) => dp.projectId === p.id && deliveryPlanStatus(dp) === '交付中');
    const openWOForP = workOrders.filter((w) => w.projectId === p.id && isWOOpen(w)).length;
    if (prod) return prod.currentNode || '生产推进';
    if (deliv) return deliv.currentNode || '绑定设备';
    if (openWOForP > 0) return '工单处理中';
    return '—';
  };

  const rows = projects
    .filter((p) => !projectId || p.id === projectId)
    .filter((p) => !type || p.projectType === type)
    .map((p) => {
      const projDevices = devices.filter((d) => d.projectId === p.id);
      const produced = wpp.filter((w) => w.projectId === p.id).reduce((s, w) => s + devices.filter((d) => d.productionPlanId === w.id && ['待入库', '已入库', '待分配项目', '已分配项目', '在线运营'].includes(d.status)).length, 0);
      const stored = projDevices.filter((d) => ['已入库', '待分配项目', '已分配项目', '在线运营'].includes(d.status)).length;
      const delivered = deliveryPlans.filter((dp) => dp.projectId === p.id).reduce((s, dp) => s + (dp.records?.customerAccept || []).filter(isPass).length, 0);
      const online = projDevices.filter((d) => d.status === '在线运营').length;
      const delayed = deliveryPlans.some((dp) => dp.projectId === p.id && deliveryPlanStatus(dp) === '已延期');
      return { p, produced: Math.min(produced, p.targetCount), stored, delivered, online, delayed, bottleneck: bottleneckOf(p) };
    });
  const pager = usePaged(rows, 10);

  return (
    <Page>
      <PageHeader title="项目看板" description="按项目聚合生产、交付与在线进展，用于识别瓶颈与延期风险。" />
      <Toolbar>
        <span className="text-xs text-gray-400">筛选</span>
        <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}><option value="">全部项目</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
        <Select value={type} onChange={(e) => setType(e.target.value)}><option value="">全部项目类型</option>{['智魔方', '机场', '工业场景', '遥操数采'].map((t) => <option key={t}>{t}</option>)}</Select>
      </Toolbar>
      <Table
        head={['项目', '项目类型', '目标设备数', '已生产/已入库', '已交付', '在线运营', '当前瓶颈', '延期风险', '处理入口']}
        footer={<Pagination page={pager.page} total={pager.total} totalPages={pager.totalPages} onChange={pager.setPage} />}
      >
        {pager.pageItems.map(({ p, produced, stored, delivered, online, delayed, bottleneck }) => (
          <tr key={p.id} className="hover:bg-[#fafafa]">
            <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{p.name}</td>
            <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{p.projectType || '—'}</td>
            <td className="px-3 py-2 text-gray-600">{p.targetCount}</td>
            <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{produced} / {stored}</td>
            <td className="px-3 py-2 text-gray-600">{delivered}</td>
            <td className="px-3 py-2 text-gray-600">{online}</td>
            <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{bottleneck}</td>
            <td className="px-3 py-2">{delayed ? <StatusBadge status="已延期" /> : <span className="text-xs text-green-600">正常</span>}</td>
            <td className="px-3 py-2 text-xs whitespace-nowrap">
              <div className="flex items-center gap-3">
                <LinkAction to={`/projects/${p.id}`}>查看项目</LinkAction>
                <LinkAction to="/projects?tab=production">生产计划</LinkAction>
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </Page>
  );
}

/* ═════════ 质量看板 ═════════ */
const stationKeyNG = (records, deviceIds, key) => records.filter((r) => deviceIds.has(r.deviceId) && r.stationKey === key && r.stationResult === 'NG').length;

function QualityBoard({ state }) {
  const { projects, wpp, deliveryPlans, devices, qualityIssues, projName } = useShared(state);
  const [projectId, setProjectId] = useState('');
  const [supplier, setSupplier] = useState('');
  const tests = (state.testRecords || []).filter((t) => t.stationKey);
  const batches = state.materialBatches || [];
  const deviceTypes = state.deviceTypes || [];
  const suppliers = [...new Set(batches.map((b) => b.supplier).filter(Boolean))];

  const semi = tests.filter((t) => t.stationKey === 'semi');
  const oqt = tests.filter((t) => t.stationKey === 'oqt');
  const firstPassRate = semi.length ? Math.round(semi.filter((t) => t.stationResult === 'Pass').length / semi.length * 100) : 0;
  const finalPassRate = Math.max(oqt.length ? Math.round(oqt.filter((t) => t.stationResult === 'Pass').length / oqt.length * 100) : 0, firstPassRate);

  const supplierRows = suppliers.filter((s) => !supplier || s === supplier).map((sup) => {
    const b = batches.filter((x) => x.supplier === sup);
    const items = b.flatMap((x) => x.items || []);
    const pass = items.filter((it) => ['合格', '特批使用'].includes(it.result)).length;
    const fail = items.filter((it) => it.result === '不合格').length;
    const rate = items.length ? Math.round(pass / items.length * 100) : 0;
    const badBatches = b.filter((x) => (x.items || []).some((it) => it.result === '不合格')).length;
    return { sup, batchCount: b.length, itemCount: items.length, pass, fail, rate, badBatches };
  });
  const badSuppliers = supplierRows.filter((r) => r.badBatches > 0).length;

  const testRows = wpp.filter((p) => !projectId || p.projectId === projectId).map((p) => {
    const devs = devices.filter((d) => d.productionPlanId === p.id);
    const ids = new Set(devs.map((d) => d.id));
    const type = deviceTypes.find((t) => t.id === p.deviceTypeId) || deviceTypes[0];
    const repair = (state.productionWorkOrders || []).filter((w) => w.productionPlanId === p.id).length;
    const finalPass = devs.filter((d) => ['待入库', '已入库', '待分配项目', '已分配项目', '在线运营'].includes(d.status)).length;
    const semiT = tests.filter((r) => ids.has(r.deviceId) && r.stationKey === 'semi');
    const firstRate = semiT.length ? Math.round(semiT.filter((r) => r.stationResult === 'Pass').length / semiT.length * 100) : 0;
    return { p, typeName: type?.name || '—', total: devs.length, semiNG: stationKeyNG(tests, ids, 'semi'), initNG: stationKeyNG(tests, ids, 'init'), midNG: stationKeyNG(tests, ids, 'mid'), oqtNG: stationKeyNG(tests, ids, 'oqt'), repair, finalPass, firstRate };
  });

  const deliveryRows = deliveryPlans.filter((p) => !projectId || p.projectId === projectId).map((dp) => {
    const ngIn = (key) => (dp.records?.[key] || []).filter((r) => isNG(r)).length;
    const openIssues = qualityIssues.filter((q) => q.projectId === dp.projectId && q.status !== '已关闭').length;
    return { dp, projName: projName(dp.projectId), factoryNG: ngIn('factoryInspection'), siteNG: ngIn('siteInstall'), acceptNG: ngIn('customerAccept'), openIssues };
  });

  const supPager = usePaged(supplierRows, 8);
  const testPager = usePaged(testRows, 8);

  return (
    <Page>
      <PageHeader title="质量看板" description="来料、装配测试与交付质量聚合，追踪通过率、NG 与问题分布。" />
      <Toolbar>
        <span className="text-xs text-gray-400">筛选</span>
        <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}><option value="">全部项目</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
        <Select value={supplier} onChange={(e) => setSupplier(e.target.value)}><option value="">全部供应商</option>{suppliers.map((s) => <option key={s}>{s}</option>)}</Select>
      </Toolbar>

      <StatGrid cols={6}>
        <StatCard label="一次通过率" value={`${firstPassRate}%`} tone="success" />
        <StatCard label="最终通过率" value={`${finalPassRate}%`} tone="success" />
        <StatCard label="NG 次数" value={tests.filter((t) => t.stationResult === 'NG').length} tone="danger" />
        <StatCard label="返修中设备" value={devices.filter((d) => d.status === '生产返修中').length} tone="warning" />
        <StatCard label="未关闭质量问题" value={qualityIssues.filter((q) => q.status !== '已关闭').length} tone="warning" />
        <StatCard label="问题供应商" value={badSuppliers} tone={badSuppliers ? 'warning' : 'default'} />
      </StatGrid>

      <Section title="供应商来料质量" bodyClassName="p-0">
        <Table head={['供应商', '到货批次', '到货件数', '合格', '不合格', '来料合格率', '问题批次', '处理入口']}
          footer={<Pagination page={supPager.page} total={supPager.total} totalPages={supPager.totalPages} onChange={supPager.setPage} />}>
          {supPager.pageItems.map((r) => (
            <tr key={r.sup} className="hover:bg-[#fafafa]">
              <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{r.sup}</td>
              <td className="px-3 py-2 text-gray-600">{r.batchCount}</td>
              <td className="px-3 py-2 text-gray-600">{r.itemCount}</td>
              <td className="px-3 py-2 text-green-600">{r.pass}</td>
              <td className="px-3 py-2 text-red-600">{r.fail}</td>
              <td className="px-3 py-2"><span className={`font-medium ${r.rate >= 90 ? 'text-green-600' : r.rate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{r.rate}%</span></td>
              <td className="px-3 py-2 text-gray-600">{r.badBatches}</td>
              <td className="px-3 py-2 text-xs whitespace-nowrap"><LinkAction to="/assets?tab=materials">物料与部件台账</LinkAction></td>
            </tr>
          ))}
        </Table>
      </Section>

      <Section title="装配 / 测试质量" bodyClassName="p-0">
        <Table head={['设备类型', '生产计划', '测试设备', '半成品NG', '初测NG', '中测NG', 'OQT NG', '生产返修', '最终通过', '一次通过率', '处理入口']}
          footer={<Pagination page={testPager.page} total={testPager.total} totalPages={testPager.totalPages} onChange={testPager.setPage} />}>
          {testPager.pageItems.map((r) => (
            <tr key={r.p.id} className="hover:bg-[#fafafa]">
              <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{r.typeName}</td>
              <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{r.p.name}</td>
              <td className="px-3 py-2 text-gray-600">{r.total}</td>
              <td className="px-3 py-2 text-red-600">{r.semiNG}</td>
              <td className="px-3 py-2 text-red-600">{r.initNG}</td>
              <td className="px-3 py-2 text-red-600">{r.midNG}</td>
              <td className="px-3 py-2 text-red-600">{r.oqtNG}</td>
              <td className="px-3 py-2 text-amber-600">{r.repair}</td>
              <td className="px-3 py-2 text-green-600">{r.finalPass}</td>
              <td className="px-3 py-2"><span className={`font-medium ${r.firstRate >= 90 ? 'text-green-600' : r.firstRate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{r.firstRate}%</span></td>
              <td className="px-3 py-2 text-xs whitespace-nowrap"><LinkAction to={`/production-plans/${r.p.id}?node=quality`}>生产计划</LinkAction></td>
            </tr>
          ))}
        </Table>
      </Section>

      <Section title="交付质量" bodyClassName="p-0">
        <Table head={['项目', '交付计划', '出厂检验NG', '现场安装NG', '客户验收NG', '未关闭问题', '处理入口']}>
          {deliveryRows.map((r) => (
            <tr key={r.dp.id} className="hover:bg-[#fafafa]">
              <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{r.projName}</td>
              <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{r.dp.batchNo || r.dp.name}</td>
              <td className="px-3 py-2 text-red-600">{r.factoryNG}</td>
              <td className="px-3 py-2 text-red-600">{r.siteNG}</td>
              <td className="px-3 py-2 text-red-600">{r.acceptNG}</td>
              <td className="px-3 py-2 text-purple-600">{r.openIssues}</td>
              <td className="px-3 py-2 text-xs whitespace-nowrap"><LinkAction to={`/delivery-plans/${r.dp.id}`}>交付计划</LinkAction></td>
            </tr>
          ))}
        </Table>
      </Section>
    </Page>
  );
}

/* ═════════ 交付看板 ═════════ */
function DeliveryBoard({ state }) {
  const { projects, deliveryPlans, projName } = useShared(state);
  const [projectId, setProjectId] = useState('');
  const dwo = state.deliveryWorkOrders || [];

  const plans = deliveryPlans.filter((p) => !projectId || p.projectId === projectId);
  const delivering = deliveryPlans.filter((p) => deliveryPlanStatus(p) === '交付中').length;
  const accepted = deliveryPlans.filter((p) => deliveryPlanStatus(p) === '已验收').length;
  const delayed = deliveryPlans.filter((p) => deliveryPlanStatus(p) === '已延期').length;
  const awaitingAccept = deliveryPlans.reduce((s, p) => s + Math.max((p.boundDeviceIds || []).length - (p.records?.customerAccept || []).filter(isPass).length, 0), 0);
  const acceptedDevices = deliveryPlans.reduce((s, p) => s + (p.records?.customerAccept || []).filter(isPass).length, 0);

  const planRows = plans.map((dp) => {
    const bind = (dp.records?.binding || []).length;
    const fiPass = (dp.records?.factoryInspection || []).filter(isPass).length;
    const siPass = (dp.records?.siteInstall || []).filter(isPass).length;
    const caPass = (dp.records?.customerAccept || []).filter(isPass).length;
    return { dp, bind, fiPass, siPass, caPass, status: deliveryPlanStatus(dp) };
  });

  // 交付风险清单（仅看板聚合，不是新的业务流程）
  const risks = [];
  deliveryPlans.forEach((dp) => {
    if (deliveryPlanStatus(dp) === '已延期') risks.push({ type: '延期交付', target: dp.batchNo || dp.name, project: projName(dp.projectId), detail: `计划验收 ${dp.acceptanceDate || dp.dueDate || '—'}`, to: `/delivery-plans/${dp.id}` });
    (dp.records?.factoryInspection || []).filter(isNG).forEach((r) => risks.push({ type: '出厂检验NG', target: r.deviceSN || r.deviceId, project: projName(dp.projectId), detail: r.notes || '出厂检验未通过', to: `/delivery-plans/${dp.id}?node=factoryInspection` }));
    (dp.records?.siteInstall || []).filter(isNG).forEach((r) => risks.push({ type: '现场安装NG', target: r.deviceSN || r.deviceId, project: projName(dp.projectId), detail: r.notes || '现场安装调试异常', to: `/delivery-plans/${dp.id}?node=siteInstall` }));
    (dp.records?.customerAccept || []).filter(isNG).forEach((r) => risks.push({ type: '验收异常', target: r.deviceSN || r.deviceId, project: projName(dp.projectId), detail: r.notes || '客户验收未通过', to: `/delivery-plans/${dp.id}?node=customerAccept` }));
  });
  dwo.filter((w) => !WO_CLOSED.includes(w.status)).forEach((w) => risks.push({ type: '交付工单未关闭', target: w.deviceSN || w.id, project: projName(w.projectId), detail: w.description || '', to: '/after-sales?tab=orders' }));
  const riskRows = risks.filter((r) => !projectId || r.project === projName(projectId));

  return (
    <Page>
      <PageHeader title="交付看板" description="按交付计划聚合出厂检验、现场安装与客户验收进度。" />
      <Toolbar>
        <span className="text-xs text-gray-400">筛选</span>
        <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}><option value="">全部项目</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
      </Toolbar>
      <StatGrid cols={5}>
        <StatCard label="交付中计划" value={delivering} />
        <StatCard label="已验收计划" value={accepted} tone="success" />
        <StatCard label="已延期计划" value={delayed} tone={delayed ? 'danger' : 'default'} />
        <StatCard label="待客户验收设备" value={awaitingAccept} tone={awaitingAccept ? 'warning' : 'default'} />
        <StatCard label="累计已验收设备" value={acceptedDevices} tone="success" />
      </StatGrid>

      <Section title="交付计划进展" bodyClassName="p-0">
        <Table head={['项目', '交付计划', '目标数', '已绑定', '出厂通过', '现场完成', '已验收', '当前节点', '状态', '处理入口']}>
          {planRows.map(({ dp, bind, fiPass, siPass, caPass, status }) => (
            <tr key={dp.id} className="hover:bg-[#fafafa]">
              <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{projName(dp.projectId)}</td>
              <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{dp.batchNo || dp.name}</td>
              <td className="px-3 py-2 text-gray-600">{dp.targetCount}</td>
              <td className="px-3 py-2 text-gray-600">{bind}</td>
              <td className="px-3 py-2 text-gray-600">{fiPass}</td>
              <td className="px-3 py-2 text-gray-600">{siPass}</td>
              <td className="px-3 py-2 text-green-600">{caPass}</td>
              <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{dp.currentNode || '—'}</td>
              <td className="px-3 py-2"><StatusBadge status={status} /></td>
              <td className="px-3 py-2 text-xs whitespace-nowrap"><LinkAction to={`/delivery-plans/${dp.id}`}>交付计划</LinkAction></td>
            </tr>
          ))}
        </Table>
      </Section>

      <Section title="交付风险清单" subtitle="看板聚合视图，用于集中查看交付风险，非独立业务流程。" bodyClassName="p-0">
        <Table head={['风险类型', '关联对象', '项目', '说明', '处理入口']} empty="暂无交付风险">
          {riskRows.map((r, i) => (
            <tr key={i} className="hover:bg-[#fafafa]">
              <td className="px-3 py-2 whitespace-nowrap"><StatusBadge status={r.type.includes('NG') || r.type.includes('异常') || r.type.includes('延期') ? '严重' : '轻微'} dot /><span className="ml-2 text-gray-700 text-xs">{r.type}</span></td>
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
  const { projects, workOrders, qualityIssues } = useShared(state);
  const [projectId, setProjectId] = useState('');
  const alerts = state.alerts || [];

  const wo = workOrders.filter((w) => !projectId || w.projectId === projectId);
  const openWO = wo.filter(isWOOpen);
  const replacementWO = wo.filter((w) => w.involvesReplacement).length;
  const openQI = qualityIssues.filter((q) => q.status !== '已关闭' && (!projectId || q.projectId === projectId)).length;
  const openAlerts = alerts.filter((a) => !['已关闭', '已解决'].includes(a.status)).length;
  const severeAlerts = alerts.filter((a) => a.severity === '严重' && !['已关闭', '已解决'].includes(a.status)).length;

  // 按项目聚合工单
  const rows = projects.filter((p) => !projectId || p.id === projectId).map((p) => {
    const list = workOrders.filter((w) => w.projectId === p.id);
    return {
      p,
      open: list.filter(isWOOpen).length,
      replace: list.filter((w) => w.involvesReplacement).length,
      closed: list.filter((w) => WO_CLOSED.includes(w.status)).length,
      issues: qualityIssues.filter((q) => q.projectId === p.id && q.status !== '已关闭').length,
    };
  }).filter((r) => r.open + r.replace + r.closed + r.issues > 0);

  return (
    <Page>
      <PageHeader title="售后看板" description="按项目聚合售后工单、换件与在线质量问题、告警。" />
      <Toolbar>
        <span className="text-xs text-gray-400">筛选</span>
        <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}><option value="">全部项目</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
      </Toolbar>
      <StatGrid cols={5}>
        <StatCard label="未关闭工单" value={openWO.length} tone={openWO.length ? 'warning' : 'default'} />
        <StatCard label="换件工单" value={replacementWO} />
        <StatCard label="未关闭质量问题" value={openQI} tone={openQI ? 'warning' : 'default'} />
        <StatCard label="未关闭告警" value={openAlerts} tone={openAlerts ? 'warning' : 'default'} />
        <StatCard label="严重告警" value={severeAlerts} tone={severeAlerts ? 'danger' : 'default'} />
      </StatGrid>

      <Section title="项目售后概览" bodyClassName="p-0">
        <Table head={['项目', '未关闭工单', '换件工单', '已关单', '未关闭质量问题', '处理入口']} empty="暂无售后数据">
          {rows.map(({ p, open, replace, closed, issues }) => (
            <tr key={p.id} className="hover:bg-[#fafafa]">
              <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{p.name}</td>
              <td className="px-3 py-2 text-amber-600">{open}</td>
              <td className="px-3 py-2 text-gray-600">{replace}</td>
              <td className="px-3 py-2 text-gray-500">{closed}</td>
              <td className="px-3 py-2 text-purple-600">{issues}</td>
              <td className="px-3 py-2 text-xs whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <LinkAction to="/after-sales?tab=orders">售后工单</LinkAction>
                  <LinkAction to="/after-sales?tab=issues">问题池</LinkAction>
                </div>
              </td>
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
