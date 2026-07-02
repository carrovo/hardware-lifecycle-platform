import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import { Pagination, usePaged } from '../components/Pagination';
import { productionPlanStatus, deliveryPlanStatus, deviceLifecycleStatus, isPass } from '../utils/status';

const SELECT = 'border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-600 focus:outline-none';
const TESTING_STATUSES = ['半成品检验中', '初测中', '中测中', 'OQT终测中', '生产返修中'];

function StatGrid({ items, cols = 4 }) {
  const colClass = { 2: 'grid-cols-2', 4: 'grid-cols-4', 5: 'grid-cols-5', 6: 'grid-cols-6' }[cols] || 'grid-cols-4';
  return (
    <div className={`grid ${colClass} gap-3`}>
      {items.map((c) => (
        <div key={c.label} className={`bg-white rounded shadow-sm border-l-4 ${c.color} p-4`}>
          <div className="text-2xl font-semibold text-gray-900">{c.value}</div>
          <div className="text-xs text-gray-500 mt-1">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

function Group({ label, children }) {
  return (
    <div>
      <div className="text-xs text-gray-400 mb-2">{label}</div>
      {children}
    </div>
  );
}

function Board({ title, children, right }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-gray-700">{title}</h2>{right}</div>
      {children}
    </section>
  );
}

// 页面级筛选区 + 当前分析范围。
function FilterBar({ children, scope }) {
  return (
    <div className="bg-white rounded shadow-sm p-4 space-y-2">
      <div className="flex flex-wrap gap-2 items-center">{children}</div>
      <div className="text-xs text-gray-500 border-t border-gray-100 pt-2">
        当前分析范围：{scope}
        <span className="text-gray-400 ml-1">（时间范围为页面级分析范围，用于说明统计口径；当前 mock 数据不逐条按时间联动。）</span>
      </div>
    </div>
  );
}

// 处理入口文字按钮
function Entry({ to, children }) {
  return <Link to={to} className="text-blue-600 hover:underline">{children}</Link>;
}

function Table({ head, rows, empty = '暂无数据', pager }) {
  return (
    <div className="bg-white rounded shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>{head.map((h) => <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length ? rows : <tr><td colSpan={head.length} className="px-4 py-8 text-center text-gray-400">{empty}</td></tr>}
          </tbody>
        </table>
      </div>
      {pager && <Pagination page={pager.page} total={pager.total} totalPages={pager.totalPages} onChange={pager.setPage} />}
    </div>
  );
}

/* ═════════ 运营看板 ═════════ */
function OperationBoard({ state }) {
  const [view, setView] = useState('全部');
  const [projectId, setProjectId] = useState('');
  const [supplier, setSupplier] = useState('');
  const [deviceTypeId, setDeviceTypeId] = useState('');
  const [range, setRange] = useState('近30天');

  const wpp = state.workflowProductionPlans || [];
  const deliveryPlans = state.deliveryPlans || [];
  const devices = state.devices || [];
  const batches = state.materialBatches || [];
  const materials = state.materials || [];
  const moduleTypes = state.moduleTypes || [];
  const deviceTypes = state.deviceTypes || [];
  const workOrders = [...(state.deliveryWorkOrders || []), ...(state.workOrders || [])];
  const suppliers = [...new Set([...batches.map((b) => b.supplier), ...materials.map((m) => m.supplier)].filter(Boolean))];

  const lifeCount = (s) => devices.filter((d) => deviceLifecycleStatus(d) === s).length;
  const openWO = workOrders.filter((w) => !['已关闭', '已作废'].includes(w.status)).length;
  const awaitingAccept = deliveryPlans.reduce((s, p) => s + Math.max((p.boundDeviceIds || []).length - (p.records?.customerAccept || []).filter(isPass).length, 0), 0);

  // 供应商 × 模块类型 库存
  const invMap = {};
  materials.forEach((m) => {
    const key = `${m.supplier || '—'}|${m.category}`;
    invMap[key] = invMap[key] || { supplier: m.supplier || '—', category: m.category, avail: 0 };
    if (m.status === '待装配') invMap[key].avail += 1;
  });
  const catNeedingPlans = (cat) => wpp.filter((w) => productionPlanStatus(w) === '生产中').filter((w) => {
    const dt = deviceTypes.find((t) => t.id === w.deviceTypeId) || deviceTypes.find((t) => t.name === w.deviceType);
    return (dt?.slots || []).some((sl) => moduleTypes.find((mt) => mt.id === sl.moduleTypeId)?.category === cat);
  });
  const inventoryRows = Object.values(invMap)
    .filter((r) => !supplier || r.supplier === supplier)
    .map((r) => ({ ...r, risk: r.avail === 0 ? '缺料' : r.avail < 3 ? '偏低' : '正常', affectedPlans: catNeedingPlans(r.category) }));
  const shortModules = inventoryRows.filter((r) => r.risk === '缺料').length;

  const overviewA = [
    { label: '项目数', value: state.projects.length, color: 'border-blue-500' },
    { label: '生产中计划数', value: wpp.filter((p) => productionPlanStatus(p) === '生产中').length, color: 'border-amber-500' },
    { label: '交付中计划数', value: deliveryPlans.filter((p) => deliveryPlanStatus(p) === '交付中').length, color: 'border-purple-500' },
    { label: '未关闭工单', value: openWO, color: 'border-orange-500' },
  ];
  const overviewB = [
    { label: '待入库设备数', value: devices.filter((d) => d.status === '待入库').length, color: 'border-teal-500' },
    { label: '待客户验收设备数', value: awaitingAccept, color: 'border-blue-500' },
    { label: '在线运营设备数', value: lifeCount('在线运营'), color: 'border-emerald-500' },
    { label: '库存不足模块', value: shortModules, color: 'border-red-500' },
  ];

  const bottleneckOf = (p) => {
    const prodActive = wpp.find((w) => w.projectId === p.id && productionPlanStatus(w) === '生产中');
    const delivActive = deliveryPlans.find((dp) => dp.projectId === p.id && deliveryPlanStatus(dp) === '交付中');
    const openWOForP = workOrders.filter((w) => w.projectId === p.id && ['待处理', '处理中'].includes(w.status)).length;
    if (prodActive) return { 来料准备: '来料准备', 整机装配: '录入待测试设备', 质量测试: '质量测试', 整机入库: '整机入库' }[prodActive.currentNode] || '生产推进';
    if (delivActive) return delivActive.currentNode || '绑定设备';
    if (openWOForP > 0) return '工单处理中';
    return '—';
  };

  const projectRows = state.projects.filter((p) => !projectId || p.id === projectId).map((p) => {
    const projDevices = devices.filter((d) => d.projectId === p.id);
    const produced = wpp.filter((w) => w.projectId === p.id).reduce((s, w) => s + devices.filter((d) => d.productionPlanId === w.id && ['待入库', '已入库', '待分配项目', '已分配项目', '在线运营'].includes(d.status)).length, 0);
    const stored = projDevices.filter((d) => ['已入库', '待分配项目', '已分配项目', '在线运营'].includes(d.status)).length;
    const delivered = deliveryPlans.filter((dp) => dp.projectId === p.id).reduce((s, dp) => s + (dp.records?.customerAccept || []).filter(isPass).length, 0);
    const online = projDevices.filter((d) => d.status === '在线运营').length;
    const delayed = deliveryPlans.some((dp) => dp.projectId === p.id && deliveryPlanStatus(dp) === '已延期');
    return { p, produced: Math.min(produced, p.targetCount), stored, delivered, online, delayed, bottleneck: bottleneckOf(p) };
  });

  // 今日 / 本周待处理任务列表
  const projName = (id) => state.projects.find((x) => x.id === id)?.name || '—';
  const tasks = [];
  wpp.filter((p) => productionPlanStatus(p) === '生产中' && !p.materialReady).forEach((p) => tasks.push({ type: '待确认来料齐套', target: p.name || p.id, project: projName(p.projectId), owner: p.owner || '—', time: (p.createdAt || '').slice(0, 10), risk: '中', to: `/production-plans/${p.id}?node=materialPrep`, entry: '查看生产计划' }));
  wpp.filter((p) => productionPlanStatus(p) === '生产中' && devices.some((d) => d.productionPlanId === p.id && TESTING_STATUSES.includes(d.status))).forEach((p) => tasks.push({ type: '待录入测试结果', target: p.name || p.id, project: projName(p.projectId), owner: p.owner || '—', time: (p.createdAt || '').slice(0, 10), risk: '中', to: `/production-plans/${p.id}?node=quality`, entry: '查看生产计划' }));
  deliveryPlans.filter((dp) => deliveryPlanStatus(dp) === '交付中' && (dp.boundDeviceIds || []).length > (dp.records?.customerAccept || []).filter(isPass).length).forEach((dp) => tasks.push({ type: '待客户验收', target: dp.batchNo || dp.name, project: projName(dp.projectId), owner: dp.owner || '—', time: dp.acceptanceDate || dp.dueDate || '—', risk: '中', to: `/delivery-plans/${dp.id}?node=customerAccept`, entry: '查看交付计划' }));
  inventoryRows.filter((r) => r.risk === '缺料').forEach((r) => tasks.push({ type: '库存不足', target: `${r.category}（${r.supplier}）`, project: '—', owner: '—', time: '—', risk: '高', to: '/assets?tab=materials', entry: '查看模块与来料' }));
  workOrders.filter((w) => !['已关闭', '已作废'].includes(w.status) && (w.createdAt || '') < '2026-06-20').forEach((w) => tasks.push({ type: '工单超时', target: w.id, project: projName(w.projectId), owner: w.assignedTo || '—', time: w.createdAt || '—', risk: '高', to: '/after-sales?tab=orders', entry: '查看工单' }));
  deliveryPlans.filter((dp) => deliveryPlanStatus(dp) === '已延期').forEach((dp) => tasks.push({ type: '延期交付', target: dp.batchNo || dp.name, project: projName(dp.projectId), owner: dp.owner || '—', time: dp.acceptanceDate || dp.dueDate || '—', risk: '高', to: `/delivery-plans/${dp.id}`, entry: '查看交付计划' }));
  const taskRows = tasks.filter((t) => !projectId || t.project === projName(projectId));

  const projPager = usePaged(projectRows, 10);
  const invPager = usePaged(inventoryRows, 10);
  const taskPager = usePaged(taskRows, 10);

  const scope = `${range}内 ${projectId ? projName(projectId) : '全部项目'}、${supplier || '全部供应商'}、${deviceTypeId ? (deviceTypes.find((t) => t.id === deviceTypeId)?.name || '全部设备类型') : '全部设备类型'} 的运营数据`;
  const riskPill = (r) => r === '高' ? 'bg-red-100 text-red-700 border-red-300' : r === '中' ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-blue-100 text-blue-700 border-blue-300';

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">运营看板</h1>
        <p className="text-sm text-gray-500 mt-1">按项目 / 供应商 / 设备类型视角监控项目推进、生产交付进度、库存风险与待处理事项；只做监控与入口，处理闭环在项目中心 / 资产管理 / 售后管理。</p>
      </div>

      <FilterBar scope={scope}>
        <span className="text-xs text-gray-400">运营视角</span>
        <select className={SELECT} value={view} onChange={(e) => setView(e.target.value)}>
          {['全部', '按项目', '按供应商', '按设备类型'].map((v) => <option key={v}>{v}</option>)}
        </select>
        <select className={SELECT} value={projectId} onChange={(e) => setProjectId(e.target.value)}><option value="">全部项目</option>{state.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select className={SELECT} value={supplier} onChange={(e) => setSupplier(e.target.value)}><option value="">全部供应商</option>{suppliers.map((s) => <option key={s}>{s}</option>)}</select>
        <select className={SELECT} value={deviceTypeId} onChange={(e) => setDeviceTypeId(e.target.value)}><option value="">全部设备类型</option>{deviceTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <select className={SELECT} value={range} onChange={(e) => setRange(e.target.value)}>{['近30天', '本月', '本周'].map((r) => <option key={r}>{r}</option>)}</select>
      </FilterBar>

      {(view === '全部' || view === '按设备类型') && (
        <Board title="全局运营概览">
          <div className="space-y-4">
            <Group label="项目与计划"><StatGrid cols={4} items={overviewA} /></Group>
            <Group label="设备与风险"><StatGrid cols={4} items={overviewB} /></Group>
          </div>
        </Board>
      )}

      {(view === '全部' || view === '按项目') && (
        <Board title="项目交付进展">
          <Table
            head={['项目', '目标设备数', '已生产/已入库', '已交付', '在线运营', '当前瓶颈', '延期风险', '处理入口']}
            pager={projPager}
            rows={projPager.pageItems.map(({ p, produced, stored, delivered, online, delayed, bottleneck }) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-3 py-2.5 font-medium text-gray-800 whitespace-nowrap">{p.name}</td>
                <td className="px-3 py-2.5 text-gray-600">{p.targetCount}</td>
                <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{produced} / {stored}</td>
                <td className="px-3 py-2.5 text-gray-600">{delivered}</td>
                <td className="px-3 py-2.5 text-gray-600">{online}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap">{bottleneck}</td>
                <td className="px-3 py-2.5">{delayed ? <StatusBadge status="已延期" /> : <span className="text-xs text-green-600">正常</span>}</td>
                <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                  <div className="flex items-center gap-x-3">
                    <Entry to={`/projects/${p.id}`}>查看项目</Entry>
                    <Entry to="/projects?tab=production">查看生产计划</Entry>
                  </div>
                </td>
              </tr>
            ))} />
        </Board>
      )}

      {(view === '全部' || view === '按供应商') && (
        <Board title="供应商与库存概览">
          <Table
            head={['供应商', '模块类型', '可用库存', '库存风险', '影响生产计划', '处理入口']}
            pager={invPager}
            empty="暂无库存数据"
            rows={invPager.pageItems.map((r) => (
              <tr key={`${r.supplier}-${r.category}`} className="hover:bg-gray-50">
                <td className="px-3 py-2.5 font-medium text-gray-800 whitespace-nowrap">{r.supplier}</td>
                <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{r.category}</td>
                <td className="px-3 py-2.5"><span className={`font-semibold ${r.avail > 0 ? 'text-blue-700' : 'text-gray-400'}`}>{r.avail}</span></td>
                <td className="px-3 py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full border ${r.risk === '缺料' ? 'bg-red-100 text-red-700 border-red-300' : r.risk === '偏低' ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-green-100 text-green-700 border-green-300'}`}>{r.risk}</span></td>
                <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap">{r.affectedPlans.length ? r.affectedPlans.map((w) => w.name || w.id).join('、') : '—'}</td>
                <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                  <div className="flex items-center gap-x-3">
                    <Entry to="/assets?tab=materials">查看模块与来料</Entry>
                    <Entry to="/projects?tab=production">查看生产计划</Entry>
                  </div>
                </td>
              </tr>
            ))} />
        </Board>
      )}

      <Board title="今日 / 本周待处理">
        <Table
          head={['事项类型', '关联对象', '所属项目', '负责人', '发生时间 / 截止时间', '风险等级', '处理入口']}
          pager={taskPager}
          empty="暂无待处理事项"
          rows={taskPager.pageItems.map((t, i) => (
            <tr key={`${t.type}-${t.target}-${i}`} className="hover:bg-gray-50">
              <td className="px-3 py-2.5 text-gray-800 whitespace-nowrap">{t.type}</td>
              <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap">{t.target}</td>
              <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap">{t.project}</td>
              <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap">{t.owner}</td>
              <td className="px-3 py-2.5 text-gray-400 text-xs whitespace-nowrap">{t.time}</td>
              <td className="px-3 py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full border ${riskPill(t.risk)}`}>{t.risk}</span></td>
              <td className="px-3 py-2.5 text-xs whitespace-nowrap"><Entry to={t.to}>{t.entry}</Entry></td>
            </tr>
          ))} />
      </Board>
    </div>
  );
}

/* ═════════ 质量看板 ═════════ */
const stationKeyNG = (records, deviceIds, key) => records.filter((r) => deviceIds.has(r.deviceId) && r.stationKey === key && r.stationResult === 'NG').length;

function QualityBoard({ state }) {
  const [view, setView] = useState('总体');
  const [projectId, setProjectId] = useState('');
  const [planId, setPlanId] = useState('');
  const [deliveryPlanId, setDeliveryPlanId] = useState('');
  const [supplier, setSupplier] = useState('');
  const [deviceTypeId, setDeviceTypeId] = useState('');
  const [range, setRange] = useState('近30天');

  const tests = (state.testRecords || []).filter((t) => t.stationKey);
  const devices = state.devices || [];
  const batches = state.materialBatches || [];
  const wpp = state.workflowProductionPlans || [];
  const deliveryPlans = state.deliveryPlans || [];
  const qualityIssues = state.qualityIssues || [];
  const deviceTypes = state.deviceTypes || [];
  const suppliers = [...new Set(batches.map((b) => b.supplier).filter(Boolean))];
  const projName = (id) => state.projects.find((x) => x.id === id)?.name || '—';

  const semi = tests.filter((t) => t.stationKey === 'semi');
  const oqt = tests.filter((t) => t.stationKey === 'oqt');
  const firstPassRate = semi.length ? Math.round(semi.filter((t) => t.stationResult === 'Pass').length / semi.length * 100) : 0;
  const rawFinal = oqt.length ? Math.round(oqt.filter((t) => t.stationResult === 'Pass').length / oqt.length * 100) : 0;
  // 最终通过率含返修后通过，逻辑上不应低于一次通过率。
  const finalPassRate = Math.max(rawFinal, firstPassRate);

  const supplierRows = suppliers.filter((s) => !supplier || s === supplier).map((sup) => {
    const b = batches.filter((x) => x.supplier === sup);
    const items = b.flatMap((x) => x.items || []);
    const pass = items.filter((it) => ['合格', '特批使用'].includes(it.result)).length;
    const fail = items.filter((it) => it.result === '不合格').length;
    const rate = items.length ? Math.round(pass / items.length * 100) : 0;
    const badBatches = b.filter((x) => (x.items || []).some((it) => it.result === '不合格')).length;
    // 该供应商模块被哪些生产中计划使用（近似“影响生产计划”）
    const cats = [...new Set((state.materials || []).filter((m) => m.supplier === sup).map((m) => m.category))];
    const affected = wpp.filter((w) => productionPlanStatus(w) === '生产中').filter((w) => {
      const dt = deviceTypes.find((t) => t.id === w.deviceTypeId) || deviceTypes.find((t) => t.name === w.deviceType);
      return (dt?.slots || []).some((sl) => cats.includes((state.moduleTypes || []).find((mt) => mt.id === sl.moduleTypeId)?.category));
    });
    return { sup, batchCount: b.length, itemCount: items.length, pass, fail, rate, badBatches, affected };
  });
  const badSuppliers = supplierRows.filter((r) => r.badBatches > 0).length;

  const testRows = wpp
    .filter((p) => !projectId || p.projectId === projectId)
    .filter((p) => !planId || p.id === planId)
    .filter((p) => !deviceTypeId || p.deviceTypeId === deviceTypeId)
    .map((p) => {
      const devs = devices.filter((d) => d.productionPlanId === p.id);
      const ids = new Set(devs.map((d) => d.id));
      const type = deviceTypes.find((t) => t.id === p.deviceTypeId) || deviceTypes.find((t) => t.name === p.deviceType) || deviceTypes[0];
      const repair = (state.productionWorkOrders || []).filter((w) => w.productionPlanId === p.id).length;
      const finalPass = devs.filter((d) => ['待入库', '已入库', '待分配项目', '已分配项目', '在线运营'].includes(d.status)).length;
      const semiT = tests.filter((r) => ids.has(r.deviceId) && r.stationKey === 'semi');
      const firstRate = semiT.length ? Math.round(semiT.filter((r) => r.stationResult === 'Pass').length / semiT.length * 100) : 0;
      return { p, typeName: type?.name || '—', total: devs.length, semiNG: stationKeyNG(tests, ids, 'semi'), initNG: stationKeyNG(tests, ids, 'init'), midNG: stationKeyNG(tests, ids, 'mid'), oqtNG: stationKeyNG(tests, ids, 'oqt'), repair, finalPass, firstRate };
    });

  const deliveryRows = deliveryPlans
    .filter((p) => !projectId || p.projectId === projectId)
    .filter((p) => !deliveryPlanId || p.id === deliveryPlanId)
    .map((dp) => {
      const ngIn = (key) => (dp.records?.[key] || []).filter((r) => ['NG', '不通过', '未通过'].includes(r.result)).length;
      const woCount = (state.deliveryWorkOrders || []).filter((w) => w.deliveryPlanId === dp.id).length;
      const openIssues = qualityIssues.filter((q) => q.projectId === dp.projectId && q.status !== '已关闭').length;
      return { dp, projName: projName(dp.projectId), factoryNG: ngIn('factoryInspection'), siteNG: ngIn('siteInstall'), acceptNG: ngIn('customerAccept'), woCount, openIssues };
    });

  const supPager = usePaged(supplierRows, 10);
  const testPager = usePaged(testRows, 10);
  const delivPager = usePaged(deliveryRows, 10);

  const coreA = [
    { label: '一次通过率', value: `${firstPassRate}%`, color: 'border-green-500' },
    { label: '最终通过率', value: `${finalPassRate}%`, color: 'border-emerald-500' },
  ];
  const coreB = [
    { label: 'NG次数', value: tests.filter((t) => t.stationResult === 'NG').length, color: 'border-red-500' },
    { label: '返修中设备', value: devices.filter((d) => d.status === '生产返修中').length, color: 'border-amber-500' },
    { label: '未关闭质量问题', value: qualityIssues.filter((q) => q.status !== '已关闭').length, color: 'border-purple-500' },
    { label: '问题供应商', value: badSuppliers, color: 'border-orange-500' },
  ];

  const scope = `${range}内 ${projectId ? projName(projectId) : '全部项目'}、${supplier || '全部供应商'}、${deviceTypeId ? (deviceTypes.find((t) => t.id === deviceTypeId)?.name || '全部设备类型') : '全部设备类型'} 的质量数据`;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">质量看板</h1>
        <p className="text-sm text-gray-500 mt-1">监控供应商来料质量、装配测试质量、交付质量与未关闭质量问题；只做统计与风险定位，处理入口在质量问题台账与工单中心。</p>
      </div>

      <FilterBar scope={scope}>
        <span className="text-xs text-gray-400">质量视角</span>
        <select className={SELECT} value={view} onChange={(e) => setView(e.target.value)}>
          {['总体', '来料质量', '装配测试质量', '交付质量'].map((v) => <option key={v}>{v}</option>)}
        </select>
        <select className={SELECT} value={projectId} onChange={(e) => setProjectId(e.target.value)}><option value="">全部项目</option>{state.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select className={SELECT} value={planId} onChange={(e) => setPlanId(e.target.value)}><option value="">全部生产计划</option>{wpp.map((p) => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}</select>
        <select className={SELECT} value={deliveryPlanId} onChange={(e) => setDeliveryPlanId(e.target.value)}><option value="">全部交付计划</option>{deliveryPlans.map((p) => <option key={p.id} value={p.id}>{p.batchNo || p.name}</option>)}</select>
        <select className={SELECT} value={supplier} onChange={(e) => setSupplier(e.target.value)}><option value="">全部供应商</option>{suppliers.map((s) => <option key={s}>{s}</option>)}</select>
        <select className={SELECT} value={deviceTypeId} onChange={(e) => setDeviceTypeId(e.target.value)}><option value="">全部设备类型</option>{deviceTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <select className={SELECT} value={range} onChange={(e) => setRange(e.target.value)}>{['近30天', '本月', '本周'].map((r) => <option key={r}>{r}</option>)}</select>
      </FilterBar>

      {view === '总体' && (
        <Board title="质量核心指标">
          <div className="space-y-4">
            <Group label="通过率"><StatGrid cols={2} items={coreA} /></Group>
            <Group label="问题与风险"><StatGrid cols={4} items={coreB} /></Group>
          </div>
        </Board>
      )}

      {(view === '总体' || view === '来料质量') && (
        <Board title="供应商来料质量">
          <Table
            head={['供应商', '到货批次数', '到货件数', '合格件数', '不合格件数', '来料合格率', '问题批次数', '影响生产计划', '处理入口']}
            pager={supPager}
            rows={supPager.pageItems.map((r) => (
              <tr key={r.sup} className="hover:bg-gray-50">
                <td className="px-3 py-2.5 font-medium text-gray-800 whitespace-nowrap">{r.sup}</td>
                <td className="px-3 py-2.5 text-gray-600">{r.batchCount}</td>
                <td className="px-3 py-2.5 text-gray-600">{r.itemCount}</td>
                <td className="px-3 py-2.5 text-green-600">{r.pass}</td>
                <td className="px-3 py-2.5 text-red-600">{r.fail}</td>
                <td className="px-3 py-2.5"><span className={`font-medium ${r.rate >= 90 ? 'text-green-600' : r.rate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{r.rate}%</span></td>
                <td className="px-3 py-2.5 text-gray-600">{r.badBatches}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap">{r.affected.length ? r.affected.map((w) => w.name || w.id).join('、') : '—'}</td>
                <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                  <div className="flex items-center gap-x-3">
                    <Entry to="/assets?tab=materials">查看模块与来料</Entry>
                    <Entry to="/after-sales?tab=quality">查看质量问题</Entry>
                  </div>
                </td>
              </tr>
            ))} />
        </Board>
      )}

      {(view === '总体' || view === '装配测试质量') && (
        <Board title="装配 / 测试质量">
          <Table
            head={['设备类型', '生产计划', '测试设备数', '半成品检验NG', '初测NG', '中测NG', 'OQT终测NG', '生产返修数', '最终通过数', '一次通过率', '处理入口']}
            pager={testPager}
            rows={testPager.pageItems.map((r) => (
              <tr key={r.p.id} className="hover:bg-gray-50">
                <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{r.typeName}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap">{r.p.name}</td>
                <td className="px-3 py-2.5 text-gray-600">{r.total}</td>
                <td className="px-3 py-2.5 text-red-600">{r.semiNG}</td>
                <td className="px-3 py-2.5 text-red-600">{r.initNG}</td>
                <td className="px-3 py-2.5 text-red-600">{r.midNG}</td>
                <td className="px-3 py-2.5 text-red-600">{r.oqtNG}</td>
                <td className="px-3 py-2.5 text-amber-600">{r.repair}</td>
                <td className="px-3 py-2.5 text-green-600">{r.finalPass}</td>
                <td className="px-3 py-2.5"><span className={`font-medium ${r.firstRate >= 90 ? 'text-green-600' : r.firstRate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{r.firstRate}%</span></td>
                <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                  <div className="flex items-center gap-x-3">
                    <Entry to={`/production-plans/${r.p.id}?node=quality`}>查看生产计划</Entry>
                    <Entry to="/after-sales?tab=orders">查看工单</Entry>
                  </div>
                </td>
              </tr>
            ))} />
        </Board>
      )}

      {(view === '总体' || view === '交付质量') && (
        <Board title="交付质量">
          <Table
            head={['项目', '交付计划', '出厂检验NG', '现场安装调试NG', '客户验收NG', '关联工单数', '未关闭问题数', '处理入口']}
            pager={delivPager}
            rows={delivPager.pageItems.map((r) => (
              <tr key={r.dp.id} className="hover:bg-gray-50">
                <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{r.projName}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap">{r.dp.batchNo || r.dp.name}</td>
                <td className="px-3 py-2.5 text-red-600">{r.factoryNG}</td>
                <td className="px-3 py-2.5 text-red-600">{r.siteNG}</td>
                <td className="px-3 py-2.5 text-red-600">{r.acceptNG}</td>
                <td className="px-3 py-2.5 text-gray-600">{r.woCount}</td>
                <td className="px-3 py-2.5 text-purple-600">{r.openIssues}</td>
                <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                  <div className="flex items-center gap-x-3">
                    <Entry to={`/delivery-plans/${r.dp.id}`}>查看交付计划</Entry>
                    <Entry to="/after-sales?tab=quality">查看质量问题</Entry>
                  </div>
                </td>
              </tr>
            ))} />
        </Board>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const { state } = useApp();
  const activeTab = searchParams.get('tab') === 'quality' ? 'quality' : 'operation';
  return activeTab === 'quality' ? <QualityBoard state={state} /> : <OperationBoard state={state} />;
}
