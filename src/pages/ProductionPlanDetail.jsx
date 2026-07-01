import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Pagination, usePaged } from '../components/Pagination';
import { productionPlanStatus } from '../utils/status';

const NODES = [
  { key: 'materialPrep', label: '来料准备' },
  { key: 'assembly', label: '整机装配' },
  { key: 'quality', label: '质量测试' },
  { key: 'warehouse', label: '整机入库' },
];

const STATIONS = ['半成品检验', '初测', '中测', 'OQT终测'];
const STATION_KEY_LABEL = { semi: '半成品检验', init: '初测', mid: '中测', oqt: 'OQT终测' };
const STATION_KEYS = ['semi', 'init', 'mid', 'oqt'];
const INPUT = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500 bg-white';
const BTN_PRIMARY = 'px-3 py-1.5 text-sm bg-slate-700 text-white rounded hover:bg-slate-800';
const BTN_GHOST = 'px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded hover:bg-gray-50';

function nowText() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

function MetricCards({ items }) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-5">
      {items.map((item) => (
        <div key={item.label} className={`bg-white rounded shadow-sm border-l-4 ${item.color} p-4`}>
          <div className="text-2xl font-semibold text-gray-900">{item.value}</div>
          <div className="text-xs text-gray-500 mt-1">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

function FlowStepper({ activeNode, onChange, counts }) {
  return (
    <div className="bg-white rounded shadow-sm p-5 mb-6">
      <div className="flex items-center">
        {NODES.map((node, index) => (
          <div key={node.key} className="flex items-center flex-1">
            <button onClick={() => onChange(node.key)} className="flex-1 flex flex-col items-center gap-1">
              <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${activeNode === node.key ? 'bg-blue-600 text-white ring-2 ring-blue-200' : 'bg-gray-100 text-gray-500'}`}>{index + 1}</span>
              <span className={`text-xs ${activeNode === node.key ? 'text-slate-800 font-medium' : 'text-gray-500'}`}>{node.label}</span>
              <span className="text-xs text-gray-400">{counts[node.key] || 0}</span>
            </button>
            {index < NODES.length - 1 && <div className="w-10 h-0.5 bg-gray-200 mx-2" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function Section({ title, action, children }) {
  return (
    <section className="bg-white rounded shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

// 生产计划详情内的通用动作占位弹窗，按动作名展示对应字段。
const ACTION_FIELDS = {
  关联来料批次: ['生产计划', '模块类型', '型号', '供应商', '需求数量', '可选来料批次', 'ERP采购单号', 'ERP到货通知单号', '批次到货数量', '批次可用数量', '本次锁定数量', '关联说明'],
  新增计划外模块: ['模块类型', '型号', '供应商', '是否必填', '需求数量', 'ERP采购单号', '备注'],
  查看关联批次: ['批次号', '模块类型', '供应商', 'ERP采购单号', '可用数量', '本计划锁定数量'],
  生成生产返修记录: ['设备SN', '来源工站', 'NG原因', '返修说明', '负责人', '状态'],
  查看返修: ['返修记录ID', '设备SN', '来源工站', '返修说明', '状态'],
  录入ERP产成品入库单号: ['ERP生产订单号', 'ERP产成品入库单号', '入库仓库', '入库时间', '入库操作人'],
};

function ActionPlaceholderModal({ isOpen, onClose, title, text }) {
  const fields = ACTION_FIELDS[title];
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{text}</p>
        {fields && (
          <div className="grid grid-cols-2 gap-3">
            {fields.map((f) => (
              <div key={f} className={f.length > 4 ? 'col-span-2' : ''}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{f}</label>
                <input disabled className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-400" placeholder={`（原型占位）${f}`} />
              </div>
            ))}
          </div>
        )}
        <div className="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-700">当前阶段作为原型动作入口保留，后续会接入真实流转和校验。</div>
        <div className="flex justify-end">
          <button onClick={onClose} className={BTN_PRIMARY}>知道了</button>
        </div>
      </div>
    </Modal>
  );
}

/* ═════════ 装配位置 / 设备类型解析 ═════════ */
function resolveDeviceType(plan, state) {
  return state.deviceTypes.find((t) => t.id === plan.deviceTypeId)
    || state.deviceTypes.find((t) => t.name === plan.deviceType)
    || state.deviceTypes[0];
}

const LABEL_TEMPLATE = [
  { key: '批次标签', required: true, sample: '首批' },
  { key: '客户标签', required: false, sample: '智魔方' },
  { key: '版本标签', required: false, sample: 'V2' },
];

/* ═════════ 来料准备 ═════════ */
function MaterialPrepNode({ plan, state, openAction, goMaterials }) {
  const deviceType = resolveDeviceType(plan, state);
  const linkedBatches = (state.materialBatches || []).filter((batch) => plan.materialBatchIds?.includes(batch.id) || batch.planId === plan.id);
  const target = Math.max(plan.targetCount || 1, 1);

  // 按整机类型 BOM 归并所需模块类别
  const bomByCategory = {};
  (deviceType?.slots || []).forEach((s) => {
    const mt = state.moduleTypes.find((m) => m.id === s.moduleTypeId);
    const cat = mt?.category || '其他';
    bomByCategory[cat] = (bomByCategory[cat] || 0) + (s.quantity || 1);
  });
  const categories = Object.keys(bomByCategory).length ? Object.keys(bomByCategory) : ['底盘', '机械臂', '电机', '末端', '全身相机', '预控'];

  const kitStatus = (need, available, linked) => {
    if (linked === 0) return '待关联';
    if (available >= need) return '已齐套';
    if (available > 0) return '部分齐套';
    return '库存不足';
  };

  const rows = categories.map((cat) => {
    const need = (bomByCategory[cat] || 1) * target;
    const catMats = state.materials.filter((m) => m.category === cat);
    const available = catMats.filter((m) => m.status === '待装配').length;
    const locked = catMats.filter((m) => m.status === '已占用').length;
    const catBatches = linkedBatches.filter((b) => b.category === cat);
    const sample = catMats[0] || {};
    const batch = catBatches[0] || {};
    return {
      category: cat,
      model: batch.model || sample.model || '—',
      supplier: batch.supplier || sample.supplier || '—',
      need,
      linked: catBatches.length,
      locked,
      available,
      gap: Math.max(need - available - locked, 0),
      erpPO: batch.erpPurchaseOrderNo || '—',
      erpArrival: batch.erpArrivalNo || batch.arrivalNo || '—',
      status: kitStatus(need, available, catBatches.length),
    };
  });
  const readyCount = rows.filter((r) => r.status === '已齐套').length;
  const waitLink = rows.filter((r) => r.status === '待关联').length;
  const gapCount = rows.filter((r) => r.gap > 0).length;
  const canConfirm = waitLink === 0 && gapCount === 0;
  const rowsPaged = usePaged(rows, 10);
  const batchPaged = usePaged(linkedBatches, 10);

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-700">
        来料准备节点用于建立生产计划与 ERP采购单、来料批次、库存模块之间的主动关联关系，不仅仅是自动识别库存。
      </div>
      <MetricCards items={[
        { label: '齐套进度', value: `${readyCount}/${rows.length}`, color: 'border-cyan-500' },
        { label: '已关联批次', value: linkedBatches.length, color: 'border-blue-500' },
        { label: 'ERP生产订单号', value: plan.erpProductionOrderNo || '未关联', color: plan.erpProductionOrderNo ? 'border-green-500' : 'border-amber-500' },
        { label: '计划数量', value: plan.targetCount || 0, color: 'border-slate-500' },
      ]} />
      <div className={`rounded p-3 text-xs border ${canConfirm ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
        当前结论：共 {rows.length} 类模块，{waitLink} 类待关联，{gapCount} 类存在缺口，{canConfirm ? '已满足齐套条件，可确认来料齐套。' : '暂不可确认来料齐套。'}
      </div>
      <Section title="所需模块清单" action={
        <div className="flex gap-2 flex-wrap">
          <button className={BTN_GHOST} onClick={() => openAction('关联来料批次')}>关联来料批次</button>
          <button className={BTN_GHOST} onClick={() => openAction('新增计划外模块')}>新增计划外模块</button>
          <button className={`${BTN_PRIMARY} disabled:opacity-40`} disabled={!canConfirm} onClick={() => openAction('确认来料齐套')}>确认来料齐套</button>
        </div>
      }>
        <div className="text-xs text-gray-400 mb-2">
          可在下方行内「查看批次」，或
          <button className="text-blue-600 hover:underline mx-1" onClick={goMaterials}>跳转模块与来料</button>
          （已按当前生产计划所需模块筛选可用批次）。
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>{['模块类型', '型号', '供应商', '需求数量', '已关联批次数', '已锁定数量', '可用库存', '缺口数量', 'ERP采购单号', 'ERP到货通知单号', '齐套状态', '操作'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">{rowsPaged.pageItems.map((r) => (
              <tr key={r.category}>
                <td className="px-3 py-2 whitespace-nowrap">{r.category}</td>
                <td className="px-3 py-2 text-gray-600">{r.model}</td>
                <td className="px-3 py-2 text-gray-600">{r.supplier}</td>
                <td className="px-3 py-2">{r.need}</td>
                <td className="px-3 py-2">{r.linked}</td>
                <td className="px-3 py-2 text-gray-500">{r.locked}</td>
                <td className="px-3 py-2">{r.available}</td>
                <td className="px-3 py-2">{r.gap > 0 ? <span className="text-red-600 font-medium">{r.gap}</span> : <span className="text-gray-400">0</span>}</td>
                <td className="px-3 py-2 font-mono text-xs text-gray-500">{r.erpPO}</td>
                <td className="px-3 py-2 font-mono text-xs text-gray-500">{r.erpArrival}</td>
                <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                <td className="px-3 py-2 text-xs whitespace-nowrap">
                  <div className="flex gap-x-3">
                    <button className="text-slate-600 hover:underline" onClick={() => openAction('关联来料批次')}>关联批次</button>
                    <button className="text-blue-600 hover:underline" onClick={() => openAction('查看关联批次')}>查看批次</button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <Pagination page={rowsPaged.page} total={rowsPaged.total} totalPages={rowsPaged.totalPages} onChange={rowsPaged.setPage} />
      </Section>
      <Section title="已关联来料批次" action={<button className={BTN_GHOST} onClick={() => openAction('查看关联批次')}>查看关联批次</button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>{['批次号', '模块类型', '型号', '供应商', 'ERP采购单号', '数量', '合格数', '本计划锁定'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {batchPaged.pageItems.map((batch) => <tr key={batch.id}><td className="px-3 py-2 font-mono text-xs">{batch.batchNo}</td><td className="px-3 py-2">{batch.category}</td><td className="px-3 py-2">{batch.model}</td><td className="px-3 py-2">{batch.supplier}</td><td className="px-3 py-2 font-mono text-xs">{batch.erpPurchaseOrderNo || '—'}</td><td className="px-3 py-2">{batch.quantity}</td><td className="px-3 py-2">{(batch.items || []).filter((item) => item.result !== '不合格').length}</td><td className="px-3 py-2">{(batch.items || []).filter((it) => it.status === '已占用').length}</td></tr>)}
              {linkedBatches.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400">暂无关联来料批次，请先「关联来料批次」</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination page={batchPaged.page} total={batchPaged.total} totalPages={batchPaged.totalPages} onChange={batchPaged.setPage} />
      </Section>
    </div>
  );
}

/* ═════════ 整机装配：录入待测试设备 ═════════ */
const ASSEMBLY_DISPLAY = {
  未开始: '待录入', 整机装配: '待录入', 装配中: '录入中', 待确认装配完成: '待确认装配完成',
  半成品检验中: '已录入待测试', 初测中: '已录入待测试', 中测中: '已录入待测试', OQT终测中: '已录入待测试',
  待入库: '已录入待测试', 已入库: '已录入待测试', 待分配项目: '已录入待测试', 已分配项目: '已录入待测试',
  在线运营: '已录入待测试', 生产返修中: '已录入待测试', 装配异常: '装配异常',
};
const assemblyDisplay = (device) => ASSEMBLY_DISPLAY[device.status] || (device.placeholder ? '待录入' : '录入中');

function RecordDeviceModal({ isOpen, onClose, plan, state, dispatch }) {
  const deviceType = resolveDeviceType(plan, state);
  const slots = deviceType?.slots || [];
  const [bindings, setBindings] = useState({});
  const [labels, setLabels] = useState({});
  const [sn, setSn] = useState('');
  const [assembler, setAssembler] = useState(state.currentUser);

  const availableFor = (moduleTypeId) => {
    const mt = state.moduleTypes.find((m) => m.id === moduleTypeId);
    const usedIds = new Set(Object.values(bindings));
    return state.materials.filter((m) => m.category === mt?.category && m.status === '待装配' && !usedIds.has(m.id));
  };
  const matById = (id) => state.materials.find((m) => m.id === id);
  const requiredSlots = slots;
  const boundRequired = requiredSlots.filter((s) => bindings[s.id]).length;
  const labelsOk = LABEL_TEMPLATE.filter((l) => l.required).every((l) => (labels[l.key] || '').trim());
  const canSubmit = sn.trim() && boundRequired === requiredSlots.length && labelsOk;

  const submit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    const ts = Date.now();
    const usedMaterials = slots.filter((s) => bindings[s.id]).map((s) => ({ materialId: bindings[s.id], moduleTypeId: s.moduleTypeId }));
    dispatch({
      type: 'ADD_DEVICE',
      payload: {
        id: `DEV-${ts}`, sn: sn.trim(), deviceTypeId: deviceType?.id,
        status: '半成品检验中', assembler, productionPlanId: plan.id,
        assemblyTime: nowText(), createdAt: nowText(), updatedAt: nowText(),
        usedMaterials, labels,
      },
    });
    Object.values(bindings).forEach((materialId) => {
      dispatch({ type: 'UPDATE_MATERIAL', payload: { id: materialId, status: '已占用' } });
    });
    setBindings({}); setLabels({}); setSn('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="录入待测试设备" size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">基础信息</div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="block text-xs text-gray-600 mb-1">设备SN *</label><input className={INPUT} required value={sn} onChange={(e) => setSn(e.target.value)} placeholder="如 SN-DEV-1001" /></div>
          <div><label className="block text-xs text-gray-600 mb-1">设备类型</label><input className={`${INPUT} bg-gray-50`} readOnly value={deviceType?.name || '—'} /></div>
          <div><label className="block text-xs text-gray-600 mb-1">配置版本</label><input className={`${INPUT} bg-gray-50`} readOnly value={deviceType?.version || 'V1'} /></div>
          <div><label className="block text-xs text-gray-600 mb-1">所属生产计划</label><input className={`${INPUT} bg-gray-50`} readOnly value={plan.name || plan.id} /></div>
          <div><label className="block text-xs text-gray-600 mb-1">装配人</label><input className={INPUT} value={assembler} onChange={(e) => setAssembler(e.target.value)} /></div>
          <div><label className="block text-xs text-gray-600 mb-1">装配时间</label><input className={`${INPUT} bg-gray-50`} readOnly value={nowText()} /></div>
          <div><label className="block text-xs text-gray-600 mb-1">装配照片/附件</label><input className={`${INPUT} bg-gray-50 text-gray-400`} disabled placeholder="（原型占位）上传照片" /></div>
        </div>

        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">模块绑定（模块SN 只能从在库可用实例中选择：已装配 / 维修中 / 已报废 / 锁定其他计划的模块不可选）</div>
        <div className="border border-gray-200 rounded overflow-hidden max-h-72 overflow-y-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0"><tr>{['装配位置', '需要模块类型', '是否必填', '模块SN', '模块型号', '供应商', '来源批次', '当前状态', '操作'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {slots.map((s) => {
                  const mt = state.moduleTypes.find((m) => m.id === s.moduleTypeId);
                  const opts = availableFor(s.moduleTypeId);
                  const chosen = matById(bindings[s.id]);
                  return (
                    <tr key={s.id}>
                      <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{s.slotName}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{mt?.name || s.moduleTypeId}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">是</td>
                      <td className="px-3 py-2">
                        <select className="border border-gray-300 rounded px-2 py-1 text-xs w-44" value={bindings[s.id] || ''} onChange={(e) => setBindings({ ...bindings, [s.id]: e.target.value })}>
                          <option value="">-- 选择在库可用SN --</option>
                          {chosen && !opts.some((o) => o.id === chosen.id) && <option value={chosen.id}>{chosen.sn}</option>}
                          {opts.map((o) => <option key={o.id} value={o.id}>{o.sn}（{o.supplier}）</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">{chosen?.model || mt?.model || '—'}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">{chosen?.supplier || '—'}</td>
                      <td className="px-3 py-2 font-mono text-xs text-gray-500 whitespace-nowrap">{chosen?.batchNo || '—'}</td>
                      <td className="px-3 py-2"><StatusBadge status={chosen ? '待装配' : '待关联'} /></td>
                      <td className="px-3 py-2 text-xs whitespace-nowrap">{chosen ? <button type="button" className="text-red-400 hover:text-red-600 hover:underline" onClick={() => setBindings({ ...bindings, [s.id]: '' })}>解绑</button> : <span className="text-gray-300">未绑定</span>}</td>
                    </tr>
                  );
                })}
                {slots.length === 0 && <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-400">该设备类型暂无装配 BOM 模板</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">设备标签（按设备类型标签模板）</div>
        <div className="grid grid-cols-3 gap-3">
          {LABEL_TEMPLATE.map((l) => (
            <div key={l.key}>
              <label className="block text-xs text-gray-600 mb-1">{l.key}{l.required && <span className="text-red-500"> *</span>}</label>
              <input className={INPUT} value={labels[l.key] || ''} onChange={(e) => setLabels({ ...labels, [l.key]: e.target.value })} placeholder={l.sample} />
            </div>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded p-3 text-xs text-amber-700">
          必填模块（{boundRequired}/{requiredSlots.length}）与必填标签全部完成后才能确认录入。确认后设备进入质量测试节点，状态为「待测试」，所选模块实例状态更新为「已装配」。
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={BTN_GHOST}>取消</button>
          <button type="submit" disabled={!canSubmit} className={`${BTN_PRIMARY} disabled:opacity-40`}>确认录入待测试设备</button>
        </div>
      </form>
    </Modal>
  );
}

// 装配状态严格按“必填模块完成 + 必填标签完成”判定，避免 2/10 却显示已录入待测试。
function assemblyRowStatus(device, reqTotal, bound, labelsFilled) {
  if (device.status === '装配异常') return '装配异常';
  if (bound === 0 && device.placeholder) return '待录入';
  if (reqTotal > 0 && bound < reqTotal) return '待补齐模块';
  if (!labelsFilled) return '待补齐标签';
  return '已录入待测试';
}

function AssemblyNode({ planDevices, state, openRecord, openAction }) {
  const rows = planDevices.map((device) => {
    const type = state.deviceTypes.find((item) => item.id === device.deviceTypeId);
    const total = type?.slots?.length || 0;
    const bound = device.usedMaterials?.length || 0;
    const labelsFilled = !!(device.labels && device.labels['批次标签']);
    return { device, type, total, bound, labelsFilled, aStatus: assemblyRowStatus(device, total, bound, labelsFilled) };
  });
  const labelState = (device) => {
    const count = device.labels ? Object.keys(device.labels).length : 0;
    return count === 0 ? '未填写' : count === 1 ? '部分填写' : '已填写';
  };
  const paged = usePaged(rows, 10);
  const done = rows.filter((r) => r.aStatus === '已录入待测试').length;
  const allDone = rows.length > 0 && done === rows.length;
  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-700">
        整机装配按生产计划绑定的设备类型 / 配置版本生成装配模板。录入待测试设备时需填写整机 SN，并将每个必填模块位置绑定到具体模块 SN（只能从模块实例库存选择）。必填模块与必填标签全部完成，状态才会显示「已录入待测试」。
      </div>
      <MetricCards items={[
        { label: '装配设备', value: rows.length, color: 'border-blue-500' },
        { label: '待补齐', value: rows.filter((r) => ['待录入', '待补齐模块', '待补齐标签'].includes(r.aStatus)).length, color: 'border-amber-500' },
        { label: '已录入待测试', value: done, color: 'border-green-500' },
        { label: '装配异常', value: rows.filter((r) => r.aStatus === '装配异常').length, color: 'border-red-500' },
      ]} />
      <Section title="装配设备列表" action={
        <div className="flex gap-2 flex-wrap">
          <button className={BTN_GHOST} onClick={() => openAction('批量导入待测试设备')}>批量导入待测试设备</button>
          <button className={BTN_GHOST} onClick={() => openAction('查看装配模板')}>查看装配模板</button>
          <button className={BTN_GHOST} onClick={openRecord}>录入待测试设备</button>
          <button className={`${BTN_PRIMARY} disabled:opacity-40`} disabled={!allDone} onClick={() => openAction('确认装配完成')}>确认装配完成并进入质量测试</button>
        </div>
      }>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>{['设备SN', '设备类型', '装配状态', '模块绑定进度', '必填模块完成数', '设备标签状态', '装配人', '装配时间', '操作'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {paged.pageItems.map(({ device, type, aStatus, bound, total }) => (
                <tr key={device.id}>
                  <td className="px-3 py-2 font-mono text-xs whitespace-nowrap"><Link className="text-blue-600 hover:underline" to={`/devices/${device.id}`}>{device.sn}</Link></td>
                  <td className="px-3 py-2 whitespace-nowrap">{type?.name || device.deviceTypeId}</td>
                  <td className="px-3 py-2"><StatusBadge status={aStatus} /></td>
                  <td className="px-3 py-2">{bound}/{total}</td>
                  <td className="px-3 py-2">{bound}/{total}</td>
                  <td className="px-3 py-2"><StatusBadge status={labelState(device)} /></td>
                  <td className="px-3 py-2 whitespace-nowrap">{device.assembler || '—'}</td>
                  <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{device.assemblyTime || '—'}</td>
                  <td className="px-3 py-2 text-xs">
                    <div className="flex gap-x-3 whitespace-nowrap">
                      <button className="text-slate-600 hover:underline" onClick={() => openAction('查看装配记录')}>查看记录</button>
                      <button className="text-blue-600 hover:underline" onClick={() => openAction('编辑装配')}>编辑装配</button>
                      <button className="text-emerald-600 hover:underline" onClick={() => openAction('补充标签')}>补充标签</button>
                      <button className="text-red-400 hover:text-red-600 hover:underline" onClick={() => openAction('作废录入')}>作废录入</button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={9} className="px-3 py-8 text-center text-gray-400">暂无待测试设备，请「录入待测试设备」</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination page={paged.page} total={paged.total} totalPages={paged.totalPages} onChange={paged.setPage} />
      </Section>
    </div>
  );
}

/* ═════════ 质量测试：设备测试矩阵 ═════════ */
const LEGACY_TESTTYPE_STATION = { 功能测试: '初测', 老化测试: '中测', 终测: 'OQT终测', 半成品检验: '半成品检验', 初测: '初测', 中测: '中测', OQT终测: 'OQT终测' };
const stationOf = (record) => STATION_KEY_LABEL[record.stationKey] || LEGACY_TESTTYPE_STATION[record.testType] || null;
const isPassRecord = (record) => record.stationResult === 'Pass' || (!record.stationResult && ['合格', 'Pass', '通过'].includes(record.result));
const isNGRecord = (record) => record.stationResult === 'NG' || (!record.stationResult && ['不合格', 'NG', '不通过'].includes(record.result));

function latestStationRec(records, deviceId, stationLabel) {
  return records.filter((r) => r.deviceId === deviceId && stationOf(r) === stationLabel)
    .sort((a, b) => (a.testTime || '').localeCompare(b.testTime || '')).at(-1);
}
function stationPassed(records, deviceId, idx) {
  const rec = latestStationRec(records, deviceId, STATIONS[idx]);
  return rec && isPassRecord(rec);
}
// 整条前缀（0..upToIdx）全部 Pass 才算“可以进入下一工站”。
// 只看相邻工站会漏掉乱序数据（如初测 NG 但中测有 Pass 记录），这里逐级校验。
function chainPassed(records, deviceId, upToIdx) {
  for (let i = 0; i <= upToIdx; i++) {
    if (!stationPassed(records, deviceId, i)) return false;
  }
  return true;
}
function cellStatus(device, records, idx) {
  const prevPass = idx === 0 || chainPassed(records, device.id, idx - 1);
  // 严格顺序：前序工站未全部 Pass 前，本工站一律显示 —，杜绝“前序待测/NG 但后序 Pass”。
  if (!prevPass) return '—';
  const rec = latestStationRec(records, device.id, STATIONS[idx]);
  if (!rec) return '待测';
  if (isPassRecord(rec)) return 'Pass';
  return device.status === '生产返修中' ? '返修中' : 'NG';
}
const CELL_STYLE = {
  Pass: 'bg-green-100 text-green-700', NG: 'bg-red-100 text-red-700',
  待测: 'bg-gray-100 text-gray-500', 返修中: 'bg-amber-100 text-amber-700', '—': 'text-gray-300',
};

// 计算某设备当前可录入的工站下标（第一个非 Pass 的工站；全部 Pass 返回 -1）。
function currentStationIdx(device, records) {
  for (let idx = 0; idx < STATIONS.length; idx++) {
    if (cellStatus(device, records, idx) !== 'Pass') return idx;
  }
  return -1;
}

function TestResultModal({ isOpen, onClose, planDevices, records, state, dispatch }) {
  const [form, setForm] = useState({ deviceId: '', testType: '功能测试', result: 'Pass', operator: state.currentUser, ngReason: '', notes: '', genRepair: true, repairOwner: '' });
  const device = planDevices.find((item) => item.id === form.deviceId);
  const stationIdx = device ? currentStationIdx(device, records) : -1;
  // 工站由设备当前进度自动带出，用户不能自由选择，避免跳站破坏流程。
  const stationKey = stationIdx >= 0 ? STATION_KEYS[stationIdx] : null;
  const stationName = stationIdx >= 0 ? STATIONS[stationIdx] : (device ? '已完成（全部工站 Pass）' : '请先选择设备');
  const cellNow = device && stationIdx >= 0 ? cellStatus(device, records, stationIdx) : null;
  const canRecord = !!device && stationIdx >= 0;
  const isNG = form.result === 'NG';

  const submit = (e) => {
    e.preventDefault();
    if (!canRecord) return;
    const idSeed = Date.now();
    dispatch({
      type: 'ADD_TEST_RECORD',
      payload: { id: `TEST-${idSeed}`, deviceId: form.deviceId, stationKey, stationResult: form.result, testType: form.testType, result: form.result === 'Pass' ? '合格' : '不合格', operator: form.operator, testTime: nowText(), status: '有效', notes: form.notes, ngReason: form.ngReason },
    });
    dispatch({ type: 'UPDATE_DEVICE', payload: { id: form.deviceId, status: form.result === 'Pass' && stationKey === 'oqt' ? '待入库' : form.result === 'NG' ? '生产返修中' : device?.status, updatedAt: nowText() } });
    if (form.result === 'NG' && form.genRepair) {
      dispatch({ type: 'ADD_PRODUCTION_WORK_ORDER', payload: { id: `PWO-${idSeed}`, type: 'production', productionPlanId: device?.productionPlanId, deviceId: form.deviceId, deviceSN: device?.sn || '', ngStation: stationName, description: `${stationName}测试NG：${form.ngReason || form.notes || '待补充原因'}`, severity: '中', status: '待处理', assignedTo: form.repairOwner || '', createdAt: nowText(), updatedAt: nowText(), processLogs: [] } });
    }
    setForm({ deviceId: '', testType: '功能测试', result: 'Pass', operator: state.currentUser, ngReason: '', notes: '', genRepair: true, repairOwner: '' });
    onClose();
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="录入测试结果" size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">设备SN</label><select className={INPUT} required value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: e.target.value })}><option value="">-- 选择设备 --</option>{planDevices.map((d) => <option key={d.id} value={d.id}>{d.sn}</option>)}</select></div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">当前可录入工站</label>
            <input className={`${INPUT} bg-gray-50 ${!canRecord && device ? 'text-gray-400' : 'text-gray-700'}`} readOnly value={stationName} />
            <p className="text-xs text-gray-400 mt-1">工站由设备测试进度自动带出，需上一工站 Pass 后才能录入下一工站。</p>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">测试内容类型</label><select className={INPUT} value={form.testType} onChange={(e) => setForm({ ...form, testType: e.target.value })}>{['功能测试', '老化测试', 'OQT终测', '其他'].map((s) => <option key={s}>{s}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">测试结果</label><select className={INPUT} value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })}><option>Pass</option><option>NG</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">测试人</label><input className={INPUT} value={form.operator} onChange={(e) => setForm({ ...form, operator: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">测试时间</label><input className={`${INPUT} bg-gray-50`} readOnly value={nowText()} /></div>
          {isNG && <>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">NG原因 *</label><input className={INPUT} required value={form.ngReason} onChange={(e) => setForm({ ...form, ngReason: e.target.value })} /></div>
            <div className="flex items-center gap-2 pt-6"><input id="genRepair" type="checkbox" checked={form.genRepair} onChange={(e) => setForm({ ...form, genRepair: e.target.checked })} /><label htmlFor="genRepair" className="text-sm text-gray-700">生成生产返修记录</label></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">返修负责人</label><select className={INPUT} value={form.repairOwner} onChange={(e) => setForm({ ...form, repairOwner: e.target.value })}><option value="">-- 选择返修负责人 --</option>{['张三', '李四', '王五', '赵六'].map((p) => <option key={p}>{p}</option>)}</select></div>
          </>}
          <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">异常说明 / 备注</label><textarea className={INPUT} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">附件 / 报告</label><input className={`${INPUT} bg-gray-50 text-gray-400`} disabled placeholder="（原型占位）上传测试报告" /></div>
        </div>
        {device && !canRecord && <div className="bg-amber-50 border border-amber-100 rounded p-3 text-xs text-amber-700">该设备已全部工站 Pass，无可录入工站，请前往整机入库节点。</div>}
        {canRecord && cellNow === 'NG' && <div className="bg-red-50 border border-red-100 rounded p-3 text-xs text-red-600">该设备当前工站为 NG / 返修中，返修完成后在原工站（{stationName}）重新录入结果。</div>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={BTN_GHOST}>取消</button>
          <button type="submit" disabled={!canRecord} className={`${BTN_PRIMARY} disabled:opacity-40`}>保存测试结果</button>
        </div>
      </form>
    </Modal>
  );
}

function QualityNode({ planDevices, testRecords, workOrders, openTest, openAction }) {
  const deviceIds = new Set(planDevices.map((d) => d.id));
  const records = testRecords.filter((r) => deviceIds.has(r.deviceId));
  const stationProgress = STATIONS.map((label, idx) => {
    let waiting = 0, pass = 0, ng = 0, repair = 0;
    planDevices.forEach((d) => {
      const c = cellStatus(d, records, idx);
      if (c === 'Pass') pass++; else if (c === 'NG') ng++; else if (c === '返修中') repair++; else if (c === '待测') waiting++;
    });
    return { label, waiting, pass, ng, repair };
  });

  const matrix = planDevices.map((d) => {
    const cells = STATIONS.map((_, idx) => cellStatus(d, records, idx));
    // 当前工站 = 第一个非 Pass 的工站；全 Pass 则已完成。
    const currentIdx = cells.findIndex((c) => c !== 'Pass');
    const currentCell = currentIdx === -1 ? null : cells[currentIdx];
    const ngCount = records.filter((r) => r.deviceId === d.id && isNGRecord(r)).length;
    const hasNG = cells.includes('NG') || cells.includes('返修中');
    // 当前状态严格由当前工站单元格推导：NG→待返修、返修中→返修中、待测→测试中、全过→测试通过。
    const currentStatus = currentIdx === -1 ? '测试通过'
      : currentCell === '返修中' ? '返修中'
      : currentCell === 'NG' ? '待返修'
      : '测试中';
    return {
      device: d,
      cells,
      currentStation: currentIdx === -1 ? '已完成' : STATIONS[currentIdx],
      currentStatus,
      ngCount,
      hasNG,
      repair: currentCell === '返修中' ? '返修中' : currentCell === 'NG' ? '待返修' : '—',
    };
  });
  const paged = usePaged(matrix, 10);

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-700">
        质量测试按设备逐工站录入结果：仅上一工站 Pass 后才能录入下一工站；NG 生成生产返修记录，返修完成后回到原 NG 工站重测；全部工站 Pass 后设备方可进入整机入库。
      </div>
      <Section title="工站进度概览">
        <div className="grid grid-cols-4 gap-3">
          {stationProgress.map((s) => (
            <div key={s.label} className="border border-gray-100 rounded p-4">
              <div className="text-sm font-medium text-gray-800 mb-2">{s.label}</div>
              <div className="text-xs text-gray-500 space-y-0.5">
                <div>待测 {s.waiting}</div>
                <div className="text-green-600">Pass {s.pass}</div>
                <div className="text-red-600">NG {s.ng}</div>
                <div className="text-amber-600">返修中 {s.repair}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>
      <Section title="设备测试矩阵" action={<button className={BTN_PRIMARY} onClick={openTest}>录入测试结果</button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>{['设备SN', '半成品检验', '初测', '中测', 'OQT终测', '当前工站', '当前状态', 'NG次数', '返修状态', '操作'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {paged.pageItems.map((m) => (
                <tr key={m.device.id}>
                  <td className="px-3 py-2 font-mono text-xs"><Link className="text-blue-600 hover:underline" to={`/devices/${m.device.id}`}>{m.device.sn}</Link></td>
                  {m.cells.map((c, i) => <td key={i} className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded ${CELL_STYLE[c] || ''}`}>{c}</span></td>)}
                  <td className="px-3 py-2 text-gray-600 text-xs">{m.currentStation}</td>
                  <td className="px-3 py-2"><StatusBadge status={m.currentStatus} /></td>
                  <td className="px-3 py-2">{m.ngCount > 0 ? <span className="text-red-600 font-medium">{m.ngCount}</span> : <span className="text-gray-400">0</span>}</td>
                  <td className="px-3 py-2"><StatusBadge status={m.repair} /></td>
                  <td className="px-3 py-2 text-xs">
                    <div className="flex gap-x-3 whitespace-nowrap">
                      <button className="text-blue-600 hover:underline" onClick={openTest}>录入结果</button>
                      <Link to={`/devices/${m.device.id}`} className="text-slate-600 hover:underline">查看测试记录</Link>
                      {m.hasNG
                        ? <button className="text-red-500 hover:text-red-700 hover:underline" onClick={() => openAction('生成生产返修记录')}>生成返修记录</button>
                        : <span className="text-gray-300 cursor-not-allowed">生成返修记录</span>}
                    </div>
                  </td>
                </tr>
              ))}
              {matrix.length === 0 && <tr><td colSpan={10} className="px-3 py-8 text-center text-gray-400">暂无待测试设备</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination page={paged.page} total={paged.total} totalPages={paged.totalPages} onChange={paged.setPage} />
      </Section>
      <Section title="当前 NG / 返修中设备">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>{['设备SN', '返修单', '来源工站', '状态', '操作'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {workOrders.map((wo) => <tr key={wo.id}><td className="px-3 py-2 font-mono text-xs">{wo.deviceSN}</td><td className="px-3 py-2 font-mono text-xs">{wo.id}</td><td className="px-3 py-2">{wo.ngStation || '—'}</td><td className="px-3 py-2"><StatusBadge status={wo.status} /></td><td className="px-3 py-2 text-xs"><button className="text-slate-600 hover:underline" onClick={() => openAction('查看返修')}>查看返修</button></td></tr>)}
            {workOrders.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">暂无 NG / 返修中设备</td></tr>}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

/* ═════════ 整机入库 ═════════ */
function WarehouseNode({ plan, planDevices, testRecords, state, dispatch, openAction }) {
  const deviceIds = new Set(planDevices.map((d) => d.id));
  const records = testRecords.filter((r) => deviceIds.has(r.deviceId));
  const allPass = (device) => STATIONS.every((_, idx) => stationPassed(records, device.id, idx)) || device.status === '待入库';
  const stored = planDevices.filter((device) => ['已入库', '待分配项目', '已分配项目', '在线运营'].includes(device.status));
  const pending = planDevices.filter((device) => !stored.includes(device) && allPass(device));
  const confirmWarehouse = (device) => {
    dispatch({ type: 'UPDATE_DEVICE', payload: { id: device.id, status: '已入库', erpInboundNo: plan.erpInboundNo || `IN-${plan.id}`, updatedAt: nowText() } });
  };
  const finishPlan = () => {
    dispatch({ type: 'UPDATE_PRODUCTION_PLAN', payload: { id: plan.id, status: '已完成', currentNode: '整机入库', updatedAt: nowText() } });
  };
  const typeName = (id) => state.deviceTypes.find((t) => t.id === id)?.name || id;
  const pendingPaged = usePaged(pending, 10);
  const storedPaged = usePaged(stored, 10);

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-700">
        整机入库只处理通过全部工站（半成品检验 / 初测 / 中测 / OQT终测）Pass 的设备。入库后设备状态变为待交付 / 可交付；计划数量全部入库后生产计划可标记为已完成。
      </div>
      <MetricCards items={[
        { label: '待入库', value: pending.length, color: 'border-teal-500' },
        { label: '已入库', value: stored.length, color: 'border-green-500' },
        { label: '可入库设备', value: pending.length, color: 'border-blue-500' },
        { label: '目标数量', value: plan.targetCount || 0, color: 'border-slate-500' },
      ]} />
      <Section title="ERP入库信息" action={<div className="flex gap-2"><button className={BTN_GHOST} onClick={() => openAction('录入ERP产成品入库单号')}>录入ERP产成品入库单号</button><button className={BTN_GHOST} onClick={() => openAction('查看入库记录')}>查看入库记录</button></div>}>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div><span className="text-gray-500">ERP生产订单号：</span><span className="font-mono text-gray-700">{plan.erpProductionOrderNo || '—'}</span></div>
          <div><span className="text-gray-500">ERP产成品入库单号：</span><span className="font-mono text-gray-700">{plan.erpInboundNo || 'IN-' + plan.id}</span></div>
          <div><span className="text-gray-500">入库仓库：</span><span className="text-gray-700">{plan.warehouse || '成品库'}</span></div>
          <div><span className="text-gray-500">入库时间：</span><span className="text-gray-700">{plan.inboundTime || '按确认时间'}</span></div>
          <div><span className="text-gray-500">入库操作人：</span><span className="text-gray-700">{state.currentUser}</span></div>
        </div>
      </Section>
      <Section title="待入库设备列表" action={<div className="flex gap-2"><button className={BTN_GHOST} onClick={() => pending.forEach(confirmWarehouse)}>批量确认入库</button><button className={BTN_PRIMARY} onClick={finishPlan}>推进生产计划完成</button></div>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>{['设备SN', '设备类型', 'OQT结果', '当前状态', '是否可入库', '入库仓库', '操作'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {pendingPaged.pageItems.map((device) => (
                <tr key={device.id}>
                  <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{device.sn}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{typeName(device.deviceTypeId)}</td>
                  <td className="px-3 py-2"><StatusBadge status="Pass" /></td>
                  <td className="px-3 py-2"><StatusBadge status="待入库" /></td>
                  <td className="px-3 py-2 text-emerald-600 text-xs">可入库</td>
                  <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{plan.warehouse || '成品库'}</td>
                  <td className="px-3 py-2 text-xs">
                    <div className="flex gap-x-3 whitespace-nowrap">
                      <button className="text-teal-600 hover:underline" onClick={() => confirmWarehouse(device)}>确认入库</button>
                      <button className="text-blue-600 hover:underline" onClick={() => openAction('录入ERP产成品入库单号')}>录入ERP入库单号</button>
                    </div>
                  </td>
                </tr>
              ))}
              {pending.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">暂无待入库设备（需全部工站 Pass）</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination page={pendingPaged.page} total={pendingPaged.total} totalPages={pendingPaged.totalPages} onChange={pendingPaged.setPage} />
      </Section>
      <Section title="已入库设备列表">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>{['设备SN', '设备类型', '当前状态', '入库仓库', '入库时间', '操作'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {storedPaged.pageItems.map((device) => (
                <tr key={device.id}>
                  <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{device.sn}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{typeName(device.deviceTypeId)}</td>
                  <td className="px-3 py-2"><StatusBadge status={device.status} /></td>
                  <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{plan.warehouse || '成品库'}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{device.inboundTime || device.updatedAt || '—'}</td>
                  <td className="px-3 py-2 text-xs">
                    <div className="flex gap-x-3 whitespace-nowrap">
                      <button className="text-slate-600 hover:underline" onClick={() => openAction('查看入库记录')}>查看入库记录</button>
                      <button className="text-blue-600 hover:underline" onClick={() => openAction('录入ERP产成品入库单号')}>录入ERP入库单号</button>
                    </div>
                  </td>
                </tr>
              ))}
              {stored.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">暂无已入库设备</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination page={storedPaged.page} total={storedPaged.total} totalPages={storedPaged.totalPages} onChange={storedPaged.setPage} />
      </Section>
    </div>
  );
}

export default function ProductionPlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [action, setAction] = useState(null);
  const [showRecord, setShowRecord] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const nodeParam = searchParams.get('node');
  const activeNode = NODES.some((node) => node.key === nodeParam) ? nodeParam : 'materialPrep';
  const setActiveNode = (key) => setSearchParams({ node: key }, { replace: true });
  const plan = [...(state.workflowProductionPlans || []), ...(state.productionPlans || [])].find((item) => item.id === id);

  if (!plan) {
    return <div className="p-8 text-center text-gray-400">未找到生产计划 {id}</div>;
  }

  const project = state.projects.find((item) => item.id === plan.projectId);
  const planDevices = state.devices.filter((device) => device.productionPlanId === plan.id);
  const planDeviceIds = new Set(planDevices.map((device) => device.id));
  const testRecords = state.testRecords.filter((record) => planDeviceIds.has(record.deviceId));
  const workOrders = state.productionWorkOrders.filter((item) => item.productionPlanId === plan.id || planDeviceIds.has(item.deviceId));
  const target = plan.targetCount || 0;
  const cap = (n) => (target ? Math.min(n, target) : n);
  const counts = {
    materialPrep: (plan.materialBatchIds || []).length,
    assembly: cap(planDevices.length),
    // 测试中设备数（不含已入库及下游），封顶计划数量，避免出现“计划5却显示7”。
    quality: cap(planDevices.filter((d) => ['半成品检验中', '初测中', '中测中', 'OQT终测中', '生产返修中', '功能测试中', '老化测试中', '终测中'].includes(d.status)).length),
    warehouse: cap(planDevices.filter((device) => ['待入库', '已入库', '待分配项目', '已分配项目', '在线运营'].includes(device.status)).length),
  };
  const writeLog = (actionType, notes, fromStatus = plan.status, toStatus = plan.status) => {
    dispatch({ type: 'ADD_OPERATION_LOG', payload: { id: `LOG-${Date.now()}-${plan.id}`, productionPlanId: plan.id, projectId: plan.projectId, operator: state.currentUser, timestamp: nowText(), actionType, fromStatus, toStatus, notes } });
  };
  const handleAction = (name) => {
    if (name === '确认来料齐套') {
      dispatch({ type: 'UPDATE_PRODUCTION_PLAN', payload: { id: plan.id, currentNode: '整机装配', materialReady: true, status: '生产中', updatedAt: nowText() } });
      writeLog(name, '来料齐套确认完成，推进到整机装配', productionPlanStatus(plan), '生产中');
      setActiveNode('assembly');
      return;
    }
    if (name === '确认装配完成') {
      dispatch({ type: 'UPDATE_PRODUCTION_PLAN', payload: { id: plan.id, currentNode: '质量测试', status: '生产中', updatedAt: nowText() } });
      writeLog(name, '装配完成，设备进入质量测试');
      setActiveNode('quality');
      return;
    }
    setAction(name);
  };

  return (
    <div className="p-6">
      <div className="flex items-start gap-4 mb-6">
        <button onClick={() => navigate('/projects?tab=production')} className="text-gray-400 hover:text-gray-600 mt-1 text-sm">← 返回</button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-gray-900">{plan.name || plan.id}</h1>
            <StatusBadge status={productionPlanStatus(plan)} />
            <StatusBadge status={plan.currentNode || NODES.find((node) => node.key === activeNode)?.label} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
            {project && <span>所属项目：<Link to={`/projects/${project.id}`} className="text-blue-600 hover:underline">{project.name}</Link></span>}
            <span>设备类型：{resolveDeviceType(plan, state)?.name || '—'}</span>
            <span>计划数量：{plan.targetCount || 0} 台</span>
            <span>已录入：{planDevices.length} 台</span>
            <span>计划周期：{(plan.createdAt || '').slice(0, 10)} ~ {plan.endDate || '—'}</span>
            <span>ERP生产订单号：{plan.erpProductionOrderNo || '—'}</span>
          </div>
        </div>
      </div>

      <FlowStepper activeNode={activeNode} onChange={setActiveNode} counts={counts} />

      {activeNode === 'materialPrep' && <MaterialPrepNode plan={plan} state={state} openAction={handleAction} goMaterials={() => navigate('/assets?tab=materials')} />}
      {activeNode === 'assembly' && <AssemblyNode planDevices={planDevices} state={state} openRecord={() => setShowRecord(true)} openAction={handleAction} />}
      {activeNode === 'quality' && <QualityNode planDevices={planDevices} testRecords={testRecords} workOrders={workOrders} openTest={() => setShowTest(true)} openAction={handleAction} />}
      {activeNode === 'warehouse' && <WarehouseNode plan={plan} planDevices={planDevices} testRecords={testRecords} state={state} dispatch={dispatch} openAction={handleAction} />}

      <ActionPlaceholderModal isOpen={!!action} onClose={() => setAction(null)} title={action || ''} text={`已触发「${action || ''}」动作。`} />
      <RecordDeviceModal isOpen={showRecord} onClose={() => setShowRecord(false)} plan={plan} state={state} dispatch={dispatch} />
      <TestResultModal isOpen={showTest} onClose={() => setShowTest(false)} planDevices={planDevices} records={testRecords} state={state} dispatch={dispatch} />
    </div>
  );
}
