import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useRole } from '../context/RoleContext';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import TabBar from '../components/TabBar';

const NODES = [
  { key: 'materialPrep', label: '来料准备', step: 1 },
  { key: 'assembly',     label: '整机装配', step: 2 },
  { key: 'quality',      label: '质量测试', step: 3 },
  { key: 'warehouse',    label: '整机入库', step: 4 },
];

const STATIONS = [
  { key: 'semi', label: '半成品检验', deviceStatus: '半成品检验中', testType: '功能测试', nextStatus: '初测中' },
  { key: 'init', label: '初测',       deviceStatus: '初测中',        testType: '功能测试', nextStatus: '中测中' },
  { key: 'mid',  label: '中测',       deviceStatus: '中测中',        testType: '老化测试', nextStatus: 'OQT终测中' },
  { key: 'oqt',  label: 'OQT终测',   deviceStatus: 'OQT终测中',     testType: '终测',     nextStatus: '待入库' },
];

/* ─────── Progress Bar ─────── */
function ProgressBar({ activeNode, setActiveNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
      <div className="flex items-center">
        {NODES.map((node, i) => (
          <div key={node.key} className="flex items-center flex-1">
            <button onClick={() => setActiveNode(node.key)}
              className={`flex flex-col items-center gap-1.5 group flex-1`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                activeNode === node.key ? 'bg-slate-700 text-white ring-2 ring-slate-400' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}>{node.step}</div>
              <span className={`text-xs font-medium whitespace-nowrap ${activeNode === node.key ? 'text-slate-700' : 'text-gray-500'}`}>{node.label}</span>
            </button>
            {i < NODES.length - 1 && (
              <div className="w-full h-0.5 bg-gray-200 mx-2 flex-shrink-0" style={{ width: '40px', flexShrink: 0 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────── Node 1: 来料准备 ─────── */
function MaterialPrepNode({ plan }) {
  const { state } = useApp();
  const { materialBatches } = state;

  const linked = materialBatches.filter(b => b.planId === plan.id || (plan.materialBatchIds || []).includes(b.id));

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">关联来料批次</h3>
      <div className="bg-white rounded shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['批次号', '物料类别', '型号', '数量', '合格率', '来料时间'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {linked.map(b => {
              const qualified = (b.items || []).filter(i => i.result !== '不合格').length;
              const total = (b.items || []).length || b.quantity || 0;
              const rate = total > 0 ? Math.round((qualified / total) * 100) : 0;
              return (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{b.batchNo}</td>
                  <td className="px-4 py-2.5 text-gray-600">{b.category}</td>
                  <td className="px-4 py-2.5 text-gray-600">{b.model || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-700">{total} 件</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-medium ${rate >= 90 ? 'text-green-600' : 'text-amber-600'}`}>{rate}%</span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">{b.inspectionTime || '—'}</td>
                </tr>
              );
            })}
            {linked.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无关联来料批次。可在资产管理 → 来料管理中添加批次。</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────── Node 2: 整机装配 ─────── */
function AssemblyRecordModal({ isOpen, onClose, onSave, plan }) {
  const { state } = useApp();
  const [form, setForm] = useState({
    sn: '', deviceTypeId: '', assembler: state.currentUser, assemblyTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
    erpWorkOrderNo: '', notes: '',
  });
  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, id: `DEV-${Date.now()}`, status: '半成品检验中', projectId: plan.projectId, productionPlanId: plan.id, online: false, createdAt: form.assemblyTime, updatedAt: form.assemblyTime });
    onClose();
    setForm({ sn: '', deviceTypeId: '', assembler: state.currentUser, assemblyTime: new Date().toISOString().slice(0, 16).replace('T', ' '), erpWorkOrderNo: '', notes: '' });
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新建装配记录">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">整机SN *</label>
            <input type="text" className={inp} required value={form.sn} onChange={e => setForm({ ...form, sn: e.target.value })} placeholder="如 SN-DEV-XXX" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">整机类型 *</label>
            <select className={inp} required value={form.deviceTypeId} onChange={e => setForm({ ...form, deviceTypeId: e.target.value })}>
              <option value="">-- 选择整机类型 --</option>
              {state.deviceTypes.map(dt => <option key={dt.id} value={dt.id}>{dt.name}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">装配人</label>
            <input type="text" className={inp} value={form.assembler} onChange={e => setForm({ ...form, assembler: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">装配时间</label>
            <input type="text" className={inp} value={form.assemblyTime} onChange={e => setForm({ ...form, assemblyTime: e.target.value })} /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">ERP工单号</label>
          <input type="text" className={inp} value={form.erpWorkOrderNo} onChange={e => setForm({ ...form, erpWorkOrderNo: e.target.value })} /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <textarea rows={2} className={inp} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800">保存</button>
        </div>
      </form>
    </Modal>
  );
}

function AssemblyNode({ plan }) {
  const { state, dispatch } = useApp();
  const { canDo } = useRole();
  const [showModal, setShowModal] = useState(false);

  const devices = state.devices.filter(d => d.productionPlanId === plan.id);

  const handleSave = (form) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    dispatch({ type: 'ADD_DEVICE', payload: { ...form, updatedAt: now } });
    dispatch({
      type: 'ADD_OPERATION_LOG',
      payload: { id: `LOG-${Date.now()}`, deviceId: form.id, operator: form.assembler, timestamp: now, actionType: '整机装配', fromStatus: null, toStatus: '半成品检验中', notes: '完成装配，进入质检流程' },
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">装配记录（{devices.length} 台）</h3>
        {canDo('add_assembly') && (
          <button onClick={() => setShowModal(true)} className="px-3 py-1.5 text-sm bg-slate-700 text-white rounded hover:bg-slate-800">
            + 新建装配
          </button>
        )}
      </div>
      <div className="bg-white rounded shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['整机SN', '整机类型', '当前状态', '装配人', '装配时间', '操作'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {devices.map(d => {
              const typeName = state.deviceTypes.find(dt => dt.id === d.deviceTypeId)?.name || '—';
              return (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-800">{d.sn}</td>
                  <td className="px-4 py-2.5 text-gray-600">{typeName}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-2.5 text-gray-600">{d.assembler || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">{d.assemblyTime || d.createdAt || '—'}</td>
                  <td className="px-4 py-2.5">
                    <Link to={`/devices/${d.id}`} className="text-slate-600 hover:underline text-xs">详情</Link>
                  </td>
                </tr>
              );
            })}
            {devices.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无装配记录</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <AssemblyRecordModal isOpen={showModal} onClose={() => setShowModal(false)} onSave={handleSave} plan={plan} />
    </div>
  );
}

/* ─────── Node 3: 质量测试 ─────── */
function NGModal({ isOpen, onClose, onConfirm }) {
  const [form, setForm] = useState({ ngReason: '', repairPerson: '', repairAction: '' });
  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.ngReason.trim()) return;
    onConfirm(form);
    onClose();
    setForm({ ngReason: '', repairPerson: '', repairAction: '' });
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="记录NG原因及返修信息">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">NG原因 *</label>
          <textarea rows={3} className={inp} required value={form.ngReason} onChange={e => setForm({ ...form, ngReason: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">返修人</label>
            <input type="text" className={inp} value={form.repairPerson} onChange={e => setForm({ ...form, repairPerson: e.target.value })} /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">返修措施</label>
          <textarea rows={2} className={inp} value={form.repairAction} onChange={e => setForm({ ...form, repairAction: e.target.value })} /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700">确认NG</button>
        </div>
      </form>
    </Modal>
  );
}

function AddTestRecordModal({ isOpen, onClose, station, stationDevices, currentUser, onSave }) {
  const [form, setForm] = useState({ deviceId: '', stationResult: 'Pass', operator: currentUser, testTime: new Date().toISOString().slice(0, 16).replace('T', ' '), reportFile: '', reportLink: '', notes: '' });
  const [showNG, setShowNG] = useState(false);
  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';

  if (!station) return null;
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.deviceId) return;
    if (form.stationResult === 'NG') { setShowNG(true); } else { onSave({ ...form, ngData: null }); onClose(); }
  };
  const handleNGConfirm = (ngData) => { onSave({ ...form, ngData }); onClose(); };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`新增${station.label}记录`} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">整机 *</label>
            <select className={inp} required value={form.deviceId} onChange={e => setForm({ ...form, deviceId: e.target.value })}>
              <option value="">-- 选择设备 --</option>
              {stationDevices.map(d => <option key={d.id} value={d.id}>{d.sn}</option>)}
            </select>
            {stationDevices.length === 0 && <p className="text-xs text-amber-600 mt-1">当前工站无待测设备</p>}
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">工站结果 *</label>
            <div className="flex gap-4">
              {['Pass', 'NG'].map(r => (
                <label key={r} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="stationResult" value={r} checked={form.stationResult === r} onChange={() => setForm({ ...form, stationResult: r })} />
                  <span className={`text-sm font-medium ${r === 'Pass' ? 'text-green-700' : 'text-red-700'}`}>{r}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">测试员</label>
              <input type="text" className={inp} value={form.operator} onChange={e => setForm({ ...form, operator: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">测试时间</label>
              <input type="text" className={inp} value={form.testTime} onChange={e => setForm({ ...form, testTime: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">报告文件名</label>
              <input type="text" className={inp} value={form.reportFile} onChange={e => setForm({ ...form, reportFile: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">报告链接</label>
              <input type="text" className={inp} value={form.reportLink} onChange={e => setForm({ ...form, reportLink: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
            <button type="submit" className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800">{form.stationResult === 'NG' ? '记录NG...' : '保存'}</button>
          </div>
        </form>
      </Modal>
      <NGModal isOpen={showNG} onClose={() => setShowNG(false)} onConfirm={handleNGConfirm} />
    </>
  );
}

function QualityNode({ plan }) {
  const { state, dispatch } = useApp();
  const { canDo } = useRole();
  const [activeStation, setActiveStation] = useState('semi');
  const [showModal, setShowModal] = useState(false);

  const station = STATIONS.find(s => s.key === activeStation);
  const planDevices = state.devices.filter(d => d.productionPlanId === plan.id);
  const stationDevices = planDevices.filter(d => d.status === station?.deviceStatus);
  const stationRecords = state.testRecords.filter(r => r.stationKey === activeStation && planDevices.some(d => d.id === r.deviceId))
    .sort((a, b) => b.testTime.localeCompare(a.testTime));

  const handleSave = (form) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const st = STATIONS.find(s => s.key === activeStation);
    if (!st) return;
    const isPass = form.stationResult === 'Pass';
    const newStatus = isPass ? st.nextStatus : '生产返修中';
    dispatch({ type: 'ADD_TEST_RECORD', payload: { id: `TEST-${Date.now()}`, deviceId: form.deviceId, stationKey: activeStation, stationResult: form.stationResult, testType: st.testType, result: isPass ? '合格' : '不合格', operator: form.operator, testTime: form.testTime || now, reportFile: form.reportFile || '', reportLink: form.reportLink || '', notes: form.notes || '', status: '有效', ...(form.ngData || {}) } });
    dispatch({ type: 'UPDATE_DEVICE', payload: { id: form.deviceId, status: newStatus, updatedAt: now } });
  };

  return (
    <div>
      <div className="flex items-end border-b border-gray-200 bg-white mb-4">
        <div className="flex gap-1">
          {STATIONS.map(s => {
            const count = state.testRecords.filter(r => r.stationKey === s.key && planDevices.some(d => d.id === r.deviceId)).length;
            return (
              <button key={s.key} onClick={() => setActiveStation(s.key)}
                className={`px-4 py-2.5 text-sm border-b-2 transition-colors rounded-t ${activeStation === s.key ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                {s.label} <span className="ml-1 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="ml-auto pr-2 pb-1 flex items-center">
          {canDo('add_test_record') && (
            <button onClick={() => setShowModal(true)} className="px-3 py-1.5 text-sm bg-slate-700 text-white rounded hover:bg-slate-800">
              + 新增记录
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['整机SN', '工站结果', '测试员', '时间', '报告'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stationRecords.map(r => {
              const sn = planDevices.find(d => d.id === r.deviceId)?.sn || r.deviceId;
              return (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono text-xs">
                    <Link to={`/devices/${r.deviceId}`} className="text-blue-600 hover:underline">{sn}</Link>
                  </td>
                  <td className="px-4 py-2.5">
                    {r.stationResult === 'Pass'
                      ? <span className="bg-green-100 text-green-700 border border-green-300 px-2 py-0.5 rounded-full text-xs font-medium">✓ Pass</span>
                      : <span className="bg-red-100 text-red-700 border border-red-300 px-2 py-0.5 rounded-full text-xs font-medium">✗ NG</span>}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{r.operator}</td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">{r.testTime}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">
                    {r.reportFile && <div>{r.reportFile}</div>}
                    {r.reportLink && <a href={r.reportLink} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">链接</a>}
                  </td>
                </tr>
              );
            })}
            {stationRecords.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">暂无{station?.label}记录</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AddTestRecordModal isOpen={showModal} onClose={() => setShowModal(false)} station={station} stationDevices={stationDevices} currentUser={state.currentUser} onSave={handleSave} />
    </div>
  );
}

/* ─────── Node 4: 整机入库 ─────── */
function WarehouseModal({ isOpen, onClose, device, onConfirm }) {
  const [erpNo, setErpNo] = useState('');
  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="确认入库">
      <div className="space-y-4">
        <div className="text-sm text-gray-700">确认设备 <span className="font-mono font-semibold">{device?.sn}</span> 入库？</div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">ERP入库单号</label>
          <input type="text" className={inp} value={erpNo} onChange={e => setErpNo(e.target.value)} placeholder="如 WH-2026-XXX" /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button onClick={() => { onConfirm(erpNo); onClose(); }}
            className="px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700">
            确认入库
          </button>
        </div>
      </div>
    </Modal>
  );
}

function WarehouseNode({ plan }) {
  const { state, dispatch } = useApp();
  const { canDo } = useRole();
  const [warehouseDevice, setWarehouseDevice] = useState(null);

  const planDevices = state.devices.filter(d => d.productionPlanId === plan.id);
  const pendingDevices = planDevices.filter(d => d.status === '待入库');
  const storedDevices = planDevices.filter(d => d.status === '已入库' || d.status === '待分配项目' || d.status === '已分配项目');

  const handleConfirm = (erpNo) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    dispatch({ type: 'UPDATE_DEVICE', payload: { id: warehouseDevice.id, status: '已入库', erpInboundNo: erpNo, updatedAt: now } });
    dispatch({ type: 'ADD_OPERATION_LOG', payload: { id: `LOG-${Date.now()}`, deviceId: warehouseDevice.id, operator: state.currentUser, timestamp: now, actionType: '整机入库', fromStatus: '待入库', toStatus: '已入库', notes: `入库，ERP单号 ${erpNo}` } });
  };

  return (
    <div className="space-y-5">
      {pendingDevices.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">待入库设备（{pendingDevices.length} 台）</h3>
          <div className="bg-white rounded shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['整机SN', '整机类型', '状态', '操作'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingDevices.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-800">{d.sn}</td>
                    <td className="px-4 py-2.5 text-gray-600">{state.deviceTypes.find(dt => dt.id === d.deviceTypeId)?.name || '—'}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={d.status} /></td>
                    <td className="px-4 py-2.5">
                      {canDo('add_assembly') && (
                        <button onClick={() => setWarehouseDevice(d)}
                          className="px-3 py-1 text-xs bg-teal-600 text-white rounded hover:bg-teal-700">
                          确认入库
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">已入库设备（{storedDevices.length} 台）</h3>
        <div className="bg-white rounded shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['整机SN', '整机类型', '当前状态', '操作'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {storedDevices.map(d => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-800">{d.sn}</td>
                  <td className="px-4 py-2.5 text-gray-600">{state.deviceTypes.find(dt => dt.id === d.deviceTypeId)?.name || '—'}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-2.5">
                    <Link to={`/devices/${d.id}`} className="text-slate-600 hover:underline text-xs">详情</Link>
                  </td>
                </tr>
              ))}
              {storedDevices.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">暂无已入库设备</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {warehouseDevice && (
        <WarehouseModal isOpen={!!warehouseDevice} onClose={() => setWarehouseDevice(null)} device={warehouseDevice} onConfirm={handleConfirm} />
      )}
    </div>
  );
}

/* ─────── Main Page ─────── */
export default function ProductionPlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useApp();
  const [activeNode, setActiveNode] = useState('materialPrep');

  const plan = [...(state.workflowProductionPlans || []), ...(state.productionPlans || [])].find(p => p.id === id);

  if (!plan) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-400 mb-4">未找到生产计划 {id}</div>
        <button onClick={() => navigate('/projects?tab=production')} className="text-slate-700 hover:underline text-sm">← 返回生产计划</button>
      </div>
    );
  }

  const project = state.projects?.find(p => p.id === plan.projectId);
  const planDevices = state.devices.filter(d => d.productionPlanId === plan.id);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <button onClick={() => navigate('/projects?tab=production')} className="text-gray-400 hover:text-gray-600 mt-1 text-sm">← 返回</button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-gray-800">{plan.name || plan.id}</h1>
            <StatusBadge status={plan.status || '进行中'} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-gray-500">
            {project && <span>关联项目：<Link to={`/projects/${project.id}`} className="text-blue-600 hover:underline">{project.name}</Link></span>}
            <span>目标量：{plan.targetCount ?? '—'} 台</span>
            <span>已装配：{planDevices.length} 台</span>
            {plan.endDate && <span>计划完成：{plan.endDate}</span>}
          </div>
        </div>
      </div>

      {/* Workflow progress */}
      <ProgressBar activeNode={activeNode} setActiveNode={setActiveNode} />

      {/* Node content */}
      {activeNode === 'materialPrep' && <MaterialPrepNode plan={plan} />}
      {activeNode === 'assembly' && <AssemblyNode plan={plan} />}
      {activeNode === 'quality' && <QualityNode plan={plan} />}
      {activeNode === 'warehouse' && <WarehouseNode plan={plan} />}
    </div>
  );
}
