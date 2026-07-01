import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { productionPlanStatus, assemblyStatus, qualityStatus } from '../utils/status';

const NODES = [
  { key: 'materialPrep', label: '来料准备' },
  { key: 'assembly', label: '整机装配' },
  { key: 'quality', label: '质量测试' },
  { key: 'warehouse', label: '整机入库' },
];

const STATIONS = ['半成品检验', '初测', '中测', 'OQT终测'];
const STATION_KEY_LABEL = { semi: '半成品检验', init: '初测', mid: '中测', oqt: 'OQT终测' };
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
              <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${activeNode === node.key ? 'bg-slate-700 text-white' : 'bg-gray-200 text-gray-600'}`}>{index + 1}</span>
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

function ActionPlaceholderModal({ isOpen, onClose, title, text }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{text}</p>
        <div className="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-700">当前阶段作为原型动作入口保留，后续会接入真实流转和校验。</div>
        <div className="flex justify-end">
          <button onClick={onClose} className={BTN_PRIMARY}>知道了</button>
        </div>
      </div>
    </Modal>
  );
}

function AssemblyModal({ isOpen, onClose, plan, state, dispatch }) {
  const [form, setForm] = useState({ deviceTypeId: state.deviceTypes[0]?.id || '', count: 1, assembler: state.currentUser, label: '' });
  const submit = (e) => {
    e.preventDefault();
    const ts = Date.now();
    Array.from({ length: Number(form.count || 1) }).forEach((_, index) => {
      dispatch({
        type: 'ADD_DEVICE',
        payload: {
          id: `DEV-${ts}-${index}`,
          sn: `SN-DEV-${String(ts).slice(-4)}-${index + 1}`,
          deviceTypeId: form.deviceTypeId,
          status: '半成品检验中',
          assembler: form.assembler,
          productionPlanId: plan.id,
          assemblyTime: nowText(),
          updatedAt: nowText(),
          labels: form.label ? { 批次标签: form.label } : {},
        },
      });
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新建设备装配" size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">整机类型</label><select className={INPUT} value={form.deviceTypeId} onChange={(e) => setForm({ ...form, deviceTypeId: e.target.value })}>{state.deviceTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">生成数量</label><input className={INPUT} type="number" min="1" value={form.count} onChange={(e) => setForm({ ...form, count: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">装配人</label><input className={INPUT} value={form.assembler} onChange={(e) => setForm({ ...form, assembler: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">设备标签</label><input className={INPUT} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="如：首批 / 加急 / 客户样机" /></div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={BTN_GHOST}>取消</button>
          <button type="submit" className={BTN_PRIMARY}>保存装配记录</button>
        </div>
      </form>
    </Modal>
  );
}

function TestResultModal({ isOpen, onClose, planDevices, state, dispatch }) {
  const [form, setForm] = useState({ deviceId: '', stationKey: 'semi', result: 'Pass', operator: state.currentUser, notes: '' });
  const stationName = STATION_KEY_LABEL[form.stationKey];
  const submit = (e) => {
    e.preventDefault();
    const idSeed = Date.now();
    const device = planDevices.find((item) => item.id === form.deviceId);
    dispatch({
      type: 'ADD_TEST_RECORD',
      payload: {
        id: `TEST-${idSeed}`,
        deviceId: form.deviceId,
        stationKey: form.stationKey,
        stationResult: form.result,
        testType: stationName,
        result: form.result === 'Pass' ? '合格' : '不合格',
        operator: form.operator,
        testTime: nowText(),
        status: '有效',
        notes: form.notes,
      },
    });
    dispatch({ type: 'UPDATE_DEVICE', payload: { id: form.deviceId, status: form.result === 'Pass' && form.stationKey === 'oqt' ? '待入库' : form.result === 'NG' ? '生产返修中' : device?.status, updatedAt: nowText() } });
    if (form.result === 'NG') {
      dispatch({
        type: 'ADD_PRODUCTION_WORK_ORDER',
        payload: {
          id: `PWO-${idSeed}`,
          type: 'production',
          productionPlanId: device?.productionPlanId,
          deviceId: form.deviceId,
          deviceSN: device?.sn || '',
          ngStation: stationName,
          description: `${stationName}测试NG：${form.notes || '待补充原因'}`,
          severity: '中',
          status: '待处理',
          assignedTo: '',
          createdAt: nowText(),
          updatedAt: nowText(),
          processLogs: [],
        },
      });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="录入测试结果" size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">设备</label><select className={INPUT} required value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: e.target.value })}><option value="">-- 选择设备 --</option>{planDevices.map((device) => <option key={device.id} value={device.id}>{device.sn}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">工站</label><select className={INPUT} value={form.stationKey} onChange={(e) => setForm({ ...form, stationKey: e.target.value })}>{Object.entries(STATION_KEY_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">结果</label><select className={INPUT} value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })}><option>Pass</option><option>NG</option><option>待测试</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">测试员</label><input className={INPUT} value={form.operator} onChange={(e) => setForm({ ...form, operator: e.target.value })} /></div>
          <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">备注 / NG原因</label><textarea className={INPUT} rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={BTN_GHOST}>取消</button>
          <button type="submit" className={BTN_PRIMARY}>保存测试结果</button>
        </div>
      </form>
    </Modal>
  );
}

function MaterialPrepNode({ plan, state, openAction }) {
  const linkedBatches = (state.materialBatches || []).filter((batch) => plan.materialBatchIds?.includes(batch.id) || batch.planId === plan.id);
  const kitStatus = (available, required) => {
    if (available >= required) return '已齐套';
    if (available > 0) return '部分齐套';
    return '缺料';
  };
  const requiredModules = ['底盘', '机械臂', '电机', '末端', '全身相机', '预控'].map((category) => {
    const available = state.materials.filter((item) => item.category === category && item.status === '待装配').length;
    return { category, required: Math.max(plan.targetCount || 1, 1), available };
  });
  const readyCount = requiredModules.filter((item) => item.available >= item.required).length;

  return (
    <div className="space-y-5">
      <MetricCards items={[
        { label: '齐套类别', value: `${readyCount}/${requiredModules.length}`, color: 'border-cyan-500' },
        { label: '关联批次', value: linkedBatches.length, color: 'border-blue-500' },
        { label: 'ERP生产订单号', value: plan.erpProductionOrderNo ? '已关联' : '未关联', color: plan.erpProductionOrderNo ? 'border-green-500' : 'border-amber-500' },
        { label: '计划数量', value: plan.targetCount || 0, color: 'border-slate-500' },
      ]} />
      <Section title="ERP关联信息" action={<button className={BTN_GHOST} onClick={() => openAction('刷新库存')}>刷新库存</button>}>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div><span className="text-gray-500">ERP生产订单号：</span><span className="font-mono text-gray-700">{plan.erpProductionOrderNo || '—'}</span></div>
          <div><span className="text-gray-500">计划创建：</span><span className="text-gray-700">{plan.createdAt || '—'}</span></div>
          <div><span className="text-gray-500">计划完成：</span><span className="text-gray-700">{plan.endDate || '—'}</span></div>
        </div>
      </Section>
      <Section title="所需模块清单" action={<button className={BTN_GHOST} onClick={() => openAction('跳转来料管理')}>跳转来料管理</button>}>
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>{['模块类别', '需求数量', '可用库存', '齐套状态'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">{requiredModules.map((item) => <tr key={item.category}><td className="px-3 py-2">{item.category}</td><td className="px-3 py-2">{item.required}</td><td className="px-3 py-2">{item.available}</td><td className="px-3 py-2"><StatusBadge status={kitStatus(item.available, item.required)} /></td></tr>)}</tbody>
        </table>
      </Section>
      <Section title="关联来料批次" action={<div className="flex gap-2"><button className={BTN_GHOST} onClick={() => openAction('关联来料批次')}>关联来料批次</button><button className={BTN_PRIMARY} onClick={() => openAction('确认来料齐套')}>确认来料齐套</button></div>}>
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>{['批次号', '物料类别', '型号', '数量', '合格数', 'ERP采购单'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {linkedBatches.map((batch) => <tr key={batch.id}><td className="px-3 py-2 font-mono text-xs">{batch.batchNo}</td><td className="px-3 py-2">{batch.category}</td><td className="px-3 py-2">{batch.model}</td><td className="px-3 py-2">{batch.quantity}</td><td className="px-3 py-2">{(batch.items || []).filter((item) => item.result !== '不合格').length}</td><td className="px-3 py-2 font-mono text-xs">{batch.erpPurchaseOrderNo || '—'}</td></tr>)}
            {linkedBatches.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">暂无关联来料批次</td></tr>}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

const labelFillStatus = (device) => {
  const count = device.labels ? Object.keys(device.labels).length : 0;
  if (count === 0) return '未填写';
  if (count === 1) return '部分填写';
  return '已填写';
};

const assemblyActions = (status) => {
  switch (status) {
    case '未开始': return [{ label: '开始装配', action: '开始装配', cls: 'text-emerald-600' }];
    case '装配中': return [{ label: '继续装配', action: '继续装配', cls: 'text-blue-600' }];
    case '待确认装配完成': return [{ label: '确认完成', action: '确认装配完成', cls: 'text-emerald-600' }];
    case '装配异常': return [{ label: '查看异常', action: '查看装配异常', cls: 'text-red-600' }, { label: '继续装配', action: '继续装配', cls: 'text-blue-600' }];
    case '已装配':
    default: return [{ label: '查看记录', action: '查看装配记录', cls: 'text-slate-600' }];
  }
};

function AssemblyNode({ planDevices, state, openAssembly, openAction }) {
  const rows = planDevices.map((device) => ({ device, aStatus: assemblyStatus(device) }));
  return (
    <div className="space-y-5">
      <MetricCards items={[
        { label: '装配设备', value: rows.length, color: 'border-blue-500' },
        { label: '装配中', value: rows.filter((r) => r.aStatus === '装配中').length, color: 'border-amber-500' },
        { label: '已装配', value: rows.filter((r) => r.aStatus === '已装配').length, color: 'border-green-500' },
        { label: '装配异常', value: rows.filter((r) => r.aStatus === '装配异常').length, color: 'border-red-500' },
      ]} />
      <Section title="装配设备列表" action={<div className="flex gap-2"><button className={BTN_GHOST} onClick={() => openAction('批量生成设备占位')}>批量生成设备占位</button><button className={BTN_PRIMARY} onClick={openAssembly}>新建设备装配</button></div>}>
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>{['设备SN', '设备类型', '装配状态', '模块绑定进度', '设备标签状态', '装配人', '操作'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(({ device, aStatus }) => {
              const type = state.deviceTypes.find((item) => item.id === device.deviceTypeId);
              return (
                <tr key={device.id}>
                  <td className="px-3 py-2 font-mono text-xs"><Link className="text-blue-600 hover:underline" to={`/devices/${device.id}`}>{device.sn}</Link></td>
                  <td className="px-3 py-2">{type?.name || device.deviceTypeId}</td>
                  <td className="px-3 py-2"><StatusBadge status={aStatus} /></td>
                  <td className="px-3 py-2">{device.usedMaterials?.length || 0}/{type?.slots?.length || 0}</td>
                  <td className="px-3 py-2"><StatusBadge status={labelFillStatus(device)} /></td>
                  <td className="px-3 py-2">{device.assembler || '—'}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      {assemblyActions(aStatus).map((a) => (
                        <button key={a.label} className={`text-xs hover:underline ${a.cls}`} onClick={() => openAction(a.action)}>{a.label}</button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">暂无装配设备</td></tr>}
          </tbody>
        </table>
      </Section>
      <Section title="设备装配详情 / 模块绑定">
        <div className="grid grid-cols-3 gap-3 text-sm text-gray-600">
          <div className="bg-gray-50 rounded p-3">模块绑定：展示各设备已绑定模块 / 总槽位数量</div>
          <div className="bg-gray-50 rounded p-3">设备标签：支持批次、客户、版本等标签，标签状态分未填写 / 部分填写 / 已填写</div>
          <div className="bg-gray-50 rounded p-3">确认装配完成：全部装配完成后推进到质量测试</div>
        </div>
      </Section>
    </div>
  );
}

const testResultLabel = (record) => {
  if (!record) return '待测试';
  if (record.stationResult === 'Pass') return 'Pass';
  if (record.stationResult === 'NG') return 'NG';
  if (['合格', 'Pass', '通过'].includes(record.result)) return 'Pass';
  if (['不合格', 'NG', '不通过'].includes(record.result)) return 'NG';
  return '待测试';
};

function QualityNode({ planDevices, testRecords, workOrders, openTest, openAction }) {
  const stationStats = STATIONS.map((label) => {
    const records = testRecords.filter((record) => (STATION_KEY_LABEL[record.stationKey] || record.testType) === label);
    return { label, total: records.length, pass: records.filter((record) => record.stationResult === 'Pass' || record.result === '合格').length, ng: records.filter((record) => record.stationResult === 'NG' || record.result === '不合格').length };
  });

  return (
    <div className="space-y-5">
      <MetricCards items={[
        { label: '测试设备', value: planDevices.length, color: 'border-purple-500' },
        { label: 'Pass记录', value: testRecords.filter((r) => r.stationResult === 'Pass' || r.result === '合格').length, color: 'border-green-500' },
        { label: 'NG记录', value: testRecords.filter((r) => r.stationResult === 'NG' || r.result === '不合格').length, color: 'border-red-500' },
        { label: '生产返修', value: workOrders.length, color: 'border-amber-500' },
      ]} />
      <Section title="工站流程" action={<div className="flex gap-2"><button className={BTN_GHOST} onClick={() => openAction('查看测试记录')}>查看测试记录</button><button className={BTN_PRIMARY} onClick={openTest}>录入测试结果</button></div>}>
        <div className="grid grid-cols-4 gap-3">
          {stationStats.map((station) => <div key={station.label} className="border border-gray-100 rounded p-4"><div className="text-sm font-medium text-gray-800">{station.label}</div><div className="text-xs text-gray-500 mt-2">Pass {station.pass} / NG {station.ng} / 共 {station.total}</div></div>)}
        </div>
      </Section>
      <Section title="设备测试列表">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>{['设备SN', '测试状态', '最新测试结果', 'NG返修单', '操作'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {planDevices.map((device) => {
              const latest = testRecords.filter((record) => record.deviceId === device.id).sort((a, b) => (b.testTime || '').localeCompare(a.testTime || ''))[0];
              const wo = workOrders.find((item) => item.deviceId === device.id);
              return <tr key={device.id}><td className="px-3 py-2 font-mono text-xs">{device.sn}</td><td className="px-3 py-2"><StatusBadge status={qualityStatus(device, latest)} /></td><td className="px-3 py-2"><StatusBadge status={testResultLabel(latest)} /></td><td className="px-3 py-2">{wo ? <StatusBadge status={wo.status} /> : '—'}</td><td className="px-3 py-2"><button className="text-xs text-red-600 hover:underline" onClick={() => openAction('生成返修记录')}>生成返修记录</button></td></tr>;
            })}
            {planDevices.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-400">暂无测试设备</td></tr>}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

function WarehouseNode({ plan, planDevices, state, dispatch, openAction }) {
  const oqtPassDeviceIds = new Set(state.testRecords.filter((record) => record.stationKey === 'oqt' && record.stationResult === 'Pass').map((record) => record.deviceId));
  const pending = planDevices.filter((device) => device.status === '待入库' || oqtPassDeviceIds.has(device.id));
  const stored = planDevices.filter((device) => ['已入库', '待分配项目', '已分配项目', '在线运营'].includes(device.status));
  const confirmWarehouse = (device) => {
    dispatch({ type: 'UPDATE_DEVICE', payload: { id: device.id, status: '已入库', erpInboundNo: plan.erpInboundNo || `IN-${plan.id}`, updatedAt: nowText() } });
  };
  const finishPlan = () => {
    dispatch({ type: 'UPDATE_PRODUCTION_PLAN', payload: { id: plan.id, status: '已完成', currentNode: '整机入库', updatedAt: nowText() } });
  };

  return (
    <div className="space-y-5">
      <MetricCards items={[
        { label: '待入库', value: pending.length, color: 'border-teal-500' },
        { label: '已入库', value: stored.length, color: 'border-green-500' },
        { label: 'OQT Pass可入库', value: pending.filter((d) => oqtPassDeviceIds.has(d.id)).length, color: 'border-blue-500' },
        { label: '目标数量', value: plan.targetCount || 0, color: 'border-slate-500' },
      ]} />
      <Section title="ERP关联信息" action={<button className={BTN_GHOST} onClick={() => openAction('查看入库记录')}>查看入库记录</button>}>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div><span className="text-gray-500">ERP生产订单号：</span><span className="font-mono text-gray-700">{plan.erpProductionOrderNo || '—'}</span></div>
          <div><span className="text-gray-500">ERP产成品入库单号：</span><span className="font-mono text-gray-700">{plan.erpInboundNo || 'IN-' + plan.id}</span></div>
          <div><span className="text-gray-500">入库规则：</span><span className="text-gray-700">仅 OQT Pass 设备可入库</span></div>
        </div>
      </Section>
      <Section title="待入库设备列表" action={<div className="flex gap-2"><button className={BTN_GHOST} onClick={() => pending.forEach(confirmWarehouse)}>批量确认入库</button><button className={BTN_PRIMARY} onClick={finishPlan}>推进生产计划完成</button></div>}>
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>{['设备SN', '当前状态', 'OQT结果', '入库资格', '操作'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {pending.map((device) => {
              const canStore = oqtPassDeviceIds.has(device.id) || device.status === '待入库';
              return <tr key={device.id}><td className="px-3 py-2 font-mono text-xs">{device.sn}</td><td className="px-3 py-2"><StatusBadge status={canStore ? '待入库' : '不可入库'} /></td><td className="px-3 py-2"><StatusBadge status={oqtPassDeviceIds.has(device.id) ? 'Pass' : '待测试'} /></td><td className="px-3 py-2">{canStore ? '可入库' : '需OQT Pass'}</td><td className="px-3 py-2"><button className="text-xs text-teal-600 hover:underline disabled:opacity-40" disabled={!canStore} onClick={() => confirmWarehouse(device)}>确认入库</button></td></tr>;
            })}
            {pending.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-400">暂无待入库设备</td></tr>}
          </tbody>
        </table>
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
  const [showAssembly, setShowAssembly] = useState(false);
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
  const counts = {
    materialPrep: (plan.materialBatchIds || []).length,
    assembly: planDevices.length,
    quality: testRecords.length,
    warehouse: planDevices.filter((device) => ['待入库', '已入库', '待分配项目', '已分配项目'].includes(device.status)).length,
  };
  const writeLog = (actionType, notes, fromStatus = plan.status, toStatus = plan.status) => {
    dispatch({
      type: 'ADD_OPERATION_LOG',
      payload: {
        id: `LOG-${Date.now()}-${plan.id}`,
        productionPlanId: plan.id,
        projectId: plan.projectId,
        operator: state.currentUser,
        timestamp: nowText(),
        actionType,
        fromStatus,
        toStatus,
        notes,
      },
    });
  };
  const handleAction = (name) => {
    if (name === '确认来料齐套') {
      dispatch({ type: 'UPDATE_PRODUCTION_PLAN', payload: { id: plan.id, currentNode: '整机装配', materialReady: true, status: '生产中', updatedAt: nowText() } });
      writeLog(name, '来料齐套确认完成，推进到整机装配', productionPlanStatus(plan), '生产中');
      setActiveNode('assembly');
      return;
    }
    if (name === '批量生成设备占位') {
      const missing = Math.max((plan.targetCount || 0) - planDevices.length, 0);
      Array.from({ length: missing }).forEach((_, index) => {
        const seed = `${Date.now()}-${index}`;
        dispatch({
          type: 'ADD_DEVICE',
          payload: {
            id: `DEV-${seed}`,
            sn: `SN-${plan.id}-${String(planDevices.length + index + 1).padStart(2, '0')}`,
            deviceTypeId: state.deviceTypes[0]?.id || '',
            status: '整机装配',
            assembler: state.currentUser,
            productionPlanId: plan.id,
            assemblyTime: '',
            createdAt: nowText(),
            updatedAt: nowText(),
            placeholder: true,
          },
        });
      });
      writeLog(name, `生成 ${missing} 台设备占位`);
      setAction(`${name}：已生成 ${missing} 台占位设备`);
      return;
    }
    if (name === '保存装配记录' || name === '确认装配完成') {
      planDevices.forEach((device) => {
        if (['整机装配', '装配中'].includes(device.status)) {
          dispatch({ type: 'UPDATE_DEVICE', payload: { id: device.id, status: '半成品检验中', updatedAt: nowText() } });
        }
      });
      dispatch({ type: 'UPDATE_PRODUCTION_PLAN', payload: { id: plan.id, currentNode: '质量测试', status: '生产中', updatedAt: nowText() } });
      writeLog(name, '装配记录已保存，设备进入质量测试');
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
            <span>计划数量：{plan.targetCount || 0} 台</span>
            <span>已装配：{planDevices.length} 台</span>
            <span>计划周期：{(plan.createdAt || '').slice(0, 10)} ~ {plan.endDate || '—'}</span>
            <span>ERP生产订单号：{plan.erpProductionOrderNo || '—'}</span>
          </div>
        </div>
      </div>

      <FlowStepper activeNode={activeNode} onChange={setActiveNode} counts={counts} />

      {activeNode === 'materialPrep' && <MaterialPrepNode plan={plan} state={state} openAction={handleAction} />}
      {activeNode === 'assembly' && <AssemblyNode planDevices={planDevices} state={state} openAssembly={() => setShowAssembly(true)} openAction={handleAction} />}
      {activeNode === 'quality' && <QualityNode planDevices={planDevices} testRecords={testRecords} workOrders={workOrders} openTest={() => setShowTest(true)} openAction={handleAction} />}
      {activeNode === 'warehouse' && <WarehouseNode plan={plan} planDevices={planDevices} state={state} dispatch={dispatch} openAction={handleAction} />}

      <ActionPlaceholderModal isOpen={!!action} onClose={() => setAction(null)} title={action || ''} text={`已触发「${action || ''}」动作。`} />
      <AssemblyModal isOpen={showAssembly} onClose={() => setShowAssembly(false)} plan={plan} state={state} dispatch={dispatch} />
      <TestResultModal isOpen={showTest} onClose={() => setShowTest(false)} planDevices={planDevices} state={state} dispatch={dispatch} />
    </div>
  );
}
