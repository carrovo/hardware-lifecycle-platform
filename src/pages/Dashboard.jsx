import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import { productionPlanStatus, deliveryPlanStatus, deviceLifecycleStatus, isPass } from '../utils/status';

function StatGrid({ items, cols = 4 }) {
  const colClass = { 4: 'grid-cols-4', 5: 'grid-cols-5', 6: 'grid-cols-6', 8: 'grid-cols-8' }[cols] || 'grid-cols-4';
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

function Board({ title, children, right }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-gray-700">{title}</h2>{right}</div>
      {children}
    </section>
  );
}

function Table({ head, rows, empty = '暂无数据' }) {
  return (
    <div className="bg-white rounded shadow-sm overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50"><tr>{head.map((h) => <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length ? rows : <tr><td colSpan={head.length} className="px-4 py-8 text-center text-gray-400">{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

const SELECT = 'border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-600 focus:outline-none';

/* ═════════ 运营看板 ═════════ */
function OperationBoard({ state }) {
  const [view, setView] = useState('全部');
  const [projectId, setProjectId] = useState('');
  const [supplier, setSupplier] = useState('');
  const [deviceTypeId, setDeviceTypeId] = useState('');

  const wpp = state.workflowProductionPlans || [];
  const deliveryPlans = state.deliveryPlans || [];
  const devices = state.devices || [];
  const batches = state.materialBatches || [];
  const workOrders = [...(state.deliveryWorkOrders || []), ...(state.workOrders || [])];
  const suppliers = [...new Set(batches.map((b) => b.supplier).filter(Boolean))];

  const lifeCount = (s, filterFn) => devices.filter((d) => deviceLifecycleStatus(d) === s && (!filterFn || filterFn(d))).length;
  const openWO = workOrders.filter((w) => !['已关闭', '已作废'].includes(w.status)).length;

  const overview = [
    { label: '项目数', value: state.projects.length, color: 'border-blue-500' },
    { label: '供应商数', value: suppliers.length, color: 'border-indigo-500' },
    { label: '模块库存总量', value: state.materials.length, color: 'border-cyan-500' },
    { label: '生产中设备数', value: lifeCount('生产中'), color: 'border-amber-500' },
    { label: '已入库设备数', value: lifeCount('待交付'), color: 'border-teal-500' },
    { label: '交付中设备数', value: lifeCount('交付中'), color: 'border-purple-500' },
    { label: '在线运营设备数', value: lifeCount('在线运营'), color: 'border-emerald-500' },
    { label: '未关闭工单数', value: openWO, color: 'border-orange-500' },
  ];

  const projectRows = state.projects.filter((p) => !projectId || p.id === projectId).map((p) => {
    const projDevices = devices.filter((d) => d.projectId === p.id);
    const produced = wpp.filter((w) => w.projectId === p.id).reduce((s, w) => s + devices.filter((d) => d.productionPlanId === w.id && ['待入库', '已入库', '待分配项目', '已分配项目', '在线运营'].includes(d.status)).length, 0);
    const stored = projDevices.filter((d) => ['已入库', '待分配项目', '已分配项目', '在线运营'].includes(d.status)).length;
    const delivered = deliveryPlans.filter((dp) => dp.projectId === p.id).reduce((s, dp) => s + (dp.records?.customerAccept || []).filter(isPass).length, 0);
    const online = projDevices.filter((d) => d.status === '在线运营').length;
    const delayed = deliveryPlans.some((dp) => dp.projectId === p.id && deliveryPlanStatus(dp) === '已延期');
    return { p, produced: Math.min(produced, p.targetCount), stored, delivered, online, delayed };
  });

  const supplierRows = suppliers.filter((s) => !supplier || s === supplier).map((sup) => {
    const b = batches.filter((x) => x.supplier === sup);
    const items = b.flatMap((x) => x.items || []);
    const pass = items.filter((it) => ['合格', '特批使用'].includes(it.result)).length;
    const fail = items.filter((it) => it.result === '不合格').length;
    const avail = items.filter((it) => it.status === '待装配').length;
    const rate = items.length ? Math.round(pass / items.length * 100) : 0;
    return { sup, batchCount: b.length, rate, fail, avail, risk: avail === 0 ? '缺料' : avail < 3 ? '偏低' : '正常' };
  });

  const awaitingAccept = deliveryPlans.reduce((s, p) => s + Math.max((p.boundDeviceIds || []).length - (p.records?.customerAccept || []).filter(isPass).length, 0), 0);

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">运营看板</h1>
          <p className="text-sm text-gray-500 mt-1">支持视角切换与项目 / 供应商 / 设备类型筛选；处理闭环在项目中心 / 售后管理。</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select className={SELECT} value={view} onChange={(e) => setView(e.target.value)}>
            {['全部', '按项目', '按供应商', '按设备类型'].map((v) => <option key={v}>{v}</option>)}
          </select>
          <select className={SELECT} value={projectId} onChange={(e) => setProjectId(e.target.value)}><option value="">全部项目</option>{state.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <select className={SELECT} value={supplier} onChange={(e) => setSupplier(e.target.value)}><option value="">全部供应商</option>{suppliers.map((s) => <option key={s}>{s}</option>)}</select>
          <select className={SELECT} value={deviceTypeId} onChange={(e) => setDeviceTypeId(e.target.value)}><option value="">全部设备类型</option>{state.deviceTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
          <select className={SELECT}><option>近30天</option><option>本月</option><option>本周</option></select>
        </div>
      </div>

      {(view === '全部' || view === '按设备类型') && <Board title="全局运营概览"><StatGrid cols={8} items={overview} /></Board>}

      {(view === '全部' || view === '按项目') && (
        <Board title="项目交付进展">
          <Table head={['项目', '目标设备数', '已生产', '已入库', '已交付', '在线运营', '延期风险']} rows={projectRows.map(({ p, produced, stored, delivered, online, delayed }) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="px-3 py-2.5 font-medium text-gray-800">{p.name}</td>
              <td className="px-3 py-2.5 text-gray-600">{p.targetCount}</td>
              <td className="px-3 py-2.5 text-gray-600">{produced}</td>
              <td className="px-3 py-2.5 text-gray-600">{stored}</td>
              <td className="px-3 py-2.5 text-gray-600">{delivered}</td>
              <td className="px-3 py-2.5 text-gray-600">{online}</td>
              <td className="px-3 py-2.5">{delayed ? <StatusBadge status="已延期" /> : <span className="text-xs text-green-600">正常</span>}</td>
            </tr>
          ))} />
        </Board>
      )}

      {(view === '全部' || view === '按供应商') && (
        <Board title="供应商与库存概览">
          <Table head={['供应商', '模块批次数', '合格率', '不合格件数', '当前可用库存', '库存风险']} rows={supplierRows.map((r) => (
            <tr key={r.sup} className="hover:bg-gray-50">
              <td className="px-3 py-2.5 font-medium text-gray-800">{r.sup}</td>
              <td className="px-3 py-2.5 text-gray-600">{r.batchCount}</td>
              <td className="px-3 py-2.5"><span className={`font-medium ${r.rate >= 90 ? 'text-green-600' : r.rate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{r.rate}%</span></td>
              <td className="px-3 py-2.5 text-gray-600">{r.fail}</td>
              <td className="px-3 py-2.5 text-gray-600">{r.avail}</td>
              <td className="px-3 py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full border ${r.risk === '缺料' ? 'bg-red-100 text-red-700 border-red-300' : r.risk === '偏低' ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-green-100 text-green-700 border-green-300'}`}>{r.risk}</span></td>
            </tr>
          ))} />
        </Board>
      )}

      <Board title="今日 / 本周待处理">
        <StatGrid cols={5} items={[
          { label: '待处理工单', value: workOrders.filter((w) => ['待处理', '处理中'].includes(w.status)).length, color: 'border-orange-500' },
          { label: '待确认来料', value: wpp.filter((p) => productionPlanStatus(p) === '生产中' && !p.materialReady).length, color: 'border-cyan-500' },
          { label: '待入库设备', value: devices.filter((d) => d.status === '待入库').length, color: 'border-teal-500' },
          { label: '待客户验收', value: awaitingAccept, color: 'border-blue-500' },
          { label: '延期交付计划', value: deliveryPlans.filter((p) => deliveryPlanStatus(p) === '已延期').length, color: 'border-red-500' },
        ]} />
      </Board>
    </div>
  );
}

/* ═════════ 质量看板 ═════════ */
const stationKeyNG = (records, deviceIds, key) => records.filter((r) => deviceIds.has(r.deviceId) && r.stationKey === key && r.stationResult === 'NG').length;

function QualityBoard({ state }) {
  const [view, setView] = useState('总体');
  const [projectId, setProjectId] = useState('');
  const [supplier, setSupplier] = useState('');

  const tests = (state.testRecords || []).filter((t) => t.stationKey);
  const devices = state.devices || [];
  const batches = state.materialBatches || [];
  const wpp = state.workflowProductionPlans || [];
  const deliveryPlans = state.deliveryPlans || [];
  const qualityIssues = state.qualityIssues || [];
  const suppliers = [...new Set(batches.map((b) => b.supplier).filter(Boolean))];

  const semi = tests.filter((t) => t.stationKey === 'semi');
  const oqt = tests.filter((t) => t.stationKey === 'oqt');
  const firstPassRate = semi.length ? Math.round(semi.filter((t) => t.stationResult === 'Pass').length / semi.length * 100) : 0;
  const finalPassRate = oqt.length ? Math.round(oqt.filter((t) => t.stationResult === 'Pass').length / oqt.length * 100) : 0;

  const supplierRows = suppliers.filter((s) => !supplier || s === supplier).map((sup) => {
    const b = batches.filter((x) => x.supplier === sup);
    const items = b.flatMap((x) => x.items || []);
    const pass = items.filter((it) => ['合格', '特批使用'].includes(it.result)).length;
    const fail = items.filter((it) => it.result === '不合格').length;
    const rate = items.length ? Math.round(pass / items.length * 100) : 0;
    const badBatches = b.filter((x) => (x.items || []).some((it) => it.result === '不合格')).length;
    return { sup, batchCount: b.length, itemCount: items.length, pass, fail, rate, badBatches };
  });

  const testRows = wpp.filter((p) => !projectId || p.projectId === projectId).map((p) => {
    const devs = devices.filter((d) => d.productionPlanId === p.id);
    const ids = new Set(devs.map((d) => d.id));
    const type = state.deviceTypes.find((t) => t.name === p.deviceType) || state.deviceTypes[0];
    const repair = (state.productionWorkOrders || []).filter((w) => w.productionPlanId === p.id).length;
    const finalPass = devs.filter((d) => ['待入库', '已入库', '待分配项目', '已分配项目', '在线运营'].includes(d.status)).length;
    return { p, typeName: type?.name || '—', total: devs.length, semiNG: stationKeyNG(tests, ids, 'semi'), initNG: stationKeyNG(tests, ids, 'init'), midNG: stationKeyNG(tests, ids, 'mid'), oqtNG: stationKeyNG(tests, ids, 'oqt'), repair, finalPass };
  });

  const deliveryRows = deliveryPlans.filter((p) => !projectId || p.projectId === projectId).map((dp) => {
    const proj = state.projects.find((x) => x.id === dp.projectId);
    const ngIn = (key) => (dp.records?.[key] || []).filter((r) => ['NG', '不通过', '未通过'].includes(r.result)).length;
    const woCount = (state.deliveryWorkOrders || []).filter((w) => w.deliveryPlanId === dp.id).length;
    const openIssues = qualityIssues.filter((q) => q.projectId === dp.projectId && q.status !== '已关闭').length;
    return { dp, projName: proj?.name || '—', factoryNG: ngIn('factoryInspection'), siteNG: ngIn('siteInstall'), acceptNG: ngIn('customerAccept'), woCount, openIssues };
  });

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">质量看板</h1>
          <p className="text-sm text-gray-500 mt-1">只做监控统计（供应商质量 / 装配测试质量 / 交付质量）；处理入口在质量问题台账与工单中心。</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select className={SELECT} value={view} onChange={(e) => setView(e.target.value)}>
            {['总体', '供应商来料质量', '装配测试质量', '交付质量'].map((v) => <option key={v}>{v}</option>)}
          </select>
          <select className={SELECT} value={projectId} onChange={(e) => setProjectId(e.target.value)}><option value="">全部项目</option>{state.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <select className={SELECT} value={supplier} onChange={(e) => setSupplier(e.target.value)}><option value="">全部供应商</option>{suppliers.map((s) => <option key={s}>{s}</option>)}</select>
          <select className={SELECT}><option>全部设备类型</option>{state.deviceTypes.map((t) => <option key={t.id}>{t.name}</option>)}</select>
        </div>
      </div>

      {(view === '总体') && (
        <Board title="核心指标">
          <StatGrid cols={5} items={[
            { label: '一次通过率', value: `${firstPassRate}%`, color: 'border-green-500' },
            { label: '最终通过率', value: `${finalPassRate}%`, color: 'border-emerald-500' },
            { label: 'NG次数', value: tests.filter((t) => t.stationResult === 'NG').length, color: 'border-red-500' },
            { label: '未关闭质量问题', value: qualityIssues.filter((q) => q.status !== '已关闭').length, color: 'border-purple-500' },
            { label: '返修中设备', value: devices.filter((d) => d.status === '生产返修中').length, color: 'border-amber-500' },
          ]} />
        </Board>
      )}

      {(view === '总体' || view === '供应商来料质量') && (
        <Board title="供应商来料质量">
          <Table head={['供应商', '到货批次数', '到货件数', '合格件数', '不合格件数', '来料合格率', '问题批次数']} rows={supplierRows.map((r) => (
            <tr key={r.sup} className="hover:bg-gray-50">
              <td className="px-3 py-2.5 font-medium text-gray-800">{r.sup}</td>
              <td className="px-3 py-2.5 text-gray-600">{r.batchCount}</td>
              <td className="px-3 py-2.5 text-gray-600">{r.itemCount}</td>
              <td className="px-3 py-2.5 text-green-600">{r.pass}</td>
              <td className="px-3 py-2.5 text-red-600">{r.fail}</td>
              <td className="px-3 py-2.5"><span className={`font-medium ${r.rate >= 90 ? 'text-green-600' : r.rate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{r.rate}%</span></td>
              <td className="px-3 py-2.5 text-gray-600">{r.badBatches}</td>
            </tr>
          ))} />
        </Board>
      )}

      {(view === '总体' || view === '装配测试质量') && (
        <Board title="装配 / 测试质量">
          <Table head={['设备类型', '生产计划', '测试设备数', '半成品检验NG', '初测NG', '中测NG', 'OQT终测NG', '生产返修数', '最终通过数']} rows={testRows.map((r) => (
            <tr key={r.p.id} className="hover:bg-gray-50">
              <td className="px-3 py-2.5 text-gray-700">{r.typeName}</td>
              <td className="px-3 py-2.5 text-gray-600 text-xs">{r.p.name}</td>
              <td className="px-3 py-2.5 text-gray-600">{r.total}</td>
              <td className="px-3 py-2.5 text-red-600">{r.semiNG}</td>
              <td className="px-3 py-2.5 text-red-600">{r.initNG}</td>
              <td className="px-3 py-2.5 text-red-600">{r.midNG}</td>
              <td className="px-3 py-2.5 text-red-600">{r.oqtNG}</td>
              <td className="px-3 py-2.5 text-amber-600">{r.repair}</td>
              <td className="px-3 py-2.5 text-green-600">{r.finalPass}</td>
            </tr>
          ))} />
        </Board>
      )}

      {(view === '总体' || view === '交付质量') && (
        <Board title="交付质量">
          <Table head={['项目', '交付计划', '出厂检验NG', '现场安装调试NG', '客户验收NG', '工单数', '未关闭问题数']} rows={deliveryRows.map((r) => (
            <tr key={r.dp.id} className="hover:bg-gray-50">
              <td className="px-3 py-2.5 text-gray-700">{r.projName}</td>
              <td className="px-3 py-2.5 text-gray-600 text-xs">{r.dp.batchNo || r.dp.name}</td>
              <td className="px-3 py-2.5 text-red-600">{r.factoryNG}</td>
              <td className="px-3 py-2.5 text-red-600">{r.siteNG}</td>
              <td className="px-3 py-2.5 text-red-600">{r.acceptNG}</td>
              <td className="px-3 py-2.5 text-gray-600">{r.woCount}</td>
              <td className="px-3 py-2.5 text-purple-600">{r.openIssues}</td>
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
