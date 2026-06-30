import { useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useRole } from '../context/RoleContext';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

const NODES = [
  { key: 'factoryInspection', label: '出厂检验',    step: 1 },
  { key: 'siteInstall',       label: '现场安装调试', step: 2 },
  { key: 'customerAccept',    label: '客户验收',    step: 3 },
];

/* ─────── CSV utility ─────── */
function downloadCSV(rows, headers, filename) {
  const bom = '﻿';
  const header = headers.map(h => h.label).join(',');
  const body = rows.map(r =>
    headers.map(h => `"${(r[h.key] ?? '').toString().replace(/"/g, '""')}"`).join(',')
  );
  const csv = bom + [header, ...body].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ─────── CSV Import Modal (UI only) ─────── */
function CSVImportModal({ isOpen, onClose, nodeLabel, templateHeaders }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`导入${nodeLabel}记录（CSV）`}>
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
          导入功能正在开发中，请按下方模板格式准备CSV文件后联系管理员导入。
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">CSV模板格式（第一行为列标题）</h4>
          <div className="bg-gray-50 border border-gray-200 rounded p-3 font-mono text-xs text-gray-600 overflow-x-auto whitespace-nowrap">
            {templateHeaders.join(',')}
          </div>
        </div>
        <div className="text-xs text-gray-500 space-y-1 bg-blue-50 border border-blue-100 rounded-lg p-3">
          <p className="font-medium text-blue-700 mb-1">填写说明</p>
          <p>• 文件编码：UTF-8（带BOM）</p>
          <p>• 时间格式：YYYY-MM-DD HH:mm</p>
          <p>• 检验/安装/验收结果填写：通过 或 未通过</p>
          <p>• 设备SN 须与系统中的整机SN完全一致</p>
        </div>
        <div>
          <button disabled className="w-full py-2.5 text-sm bg-gray-100 text-gray-400 rounded border border-dashed border-gray-300 cursor-not-allowed">
            选择文件上传（开发中）
          </button>
        </div>
        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">关闭</button>
        </div>
      </div>
    </Modal>
  );
}

/* ─────── Device Batch Selector ─────── */
function DeviceBatchSelector({ devices, selectedIds, onToggle, onToggleAll, label }) {
  if (devices.length === 0) return null;
  const allSelected = selectedIds.size === devices.length;
  return (
    <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-blue-700">{label}（{devices.length} 台可选）</span>
        <button onClick={onToggleAll} className="text-xs text-blue-600 hover:underline">
          {allSelected ? '取消全选' : '全选'}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {devices.map(d => (
          <label key={d.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border cursor-pointer transition-all text-xs select-none ${
            selectedIds.has(d.id) ? 'bg-blue-100 border-blue-400 text-blue-800 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
          }`}>
            <input type="checkbox" className="w-3 h-3 accent-blue-600" checked={selectedIds.has(d.id)} onChange={() => onToggle(d.id)} />
            {d.sn}
          </label>
        ))}
      </div>
    </div>
  );
}

/* ─────── Progress Bar ─────── */
function ProgressBar({ plan, activeNode, setActiveNode }) {
  const fi = (plan.records?.factoryInspection || []).length;
  const si = (plan.records?.siteInstall || []).length;
  const ca = (plan.records?.customerAccept || []).length;
  const counts = { factoryInspection: fi, siteInstall: si, customerAccept: ca };

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
      <div className="flex items-center">
        {NODES.map((node, i) => (
          <div key={node.key} className="flex items-center flex-1">
            <button onClick={() => setActiveNode(node.key)} className="flex flex-col items-center gap-1.5 flex-1">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${activeNode === node.key ? 'bg-slate-700 text-white ring-2 ring-slate-400' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                {node.step}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap ${activeNode === node.key ? 'text-slate-700' : 'text-gray-500'}`}>{node.label}</span>
              <span className="text-xs text-gray-400">{counts[node.key]} 台</span>
            </button>
            {i < NODES.length - 1 && <div className="w-10 h-0.5 bg-gray-200 mx-2 flex-shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────── Metrics Panel ─────── */
function MetricsPanel({ plan }) {
  const fi = plan.records?.factoryInspection || [];
  const si = plan.records?.siteInstall || [];
  const ca = plan.records?.customerAccept || [];
  const target = plan.targetCount || 0;

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {[
        { label: '目标交付量', value: target, unit: '台', color: 'border-slate-500' },
        { label: '出厂检验完成', value: fi.filter(r => r.result === '通过').length, unit: `/${fi.length} 台`, color: 'border-blue-500' },
        { label: '现场安装完成', value: si.filter(r => r.result === '通过').length, unit: `/${si.length} 台`, color: 'border-indigo-500' },
        { label: '客户验收通过', value: ca.filter(r => r.result === '通过').length, unit: `/${ca.length} 台`, color: 'border-green-500' },
      ].map(({ label, value, unit, color }) => (
        <div key={label} className={`bg-white rounded-xl shadow-sm border-l-4 ${color} p-4`}>
          <div className="text-2xl font-bold text-gray-900 mb-0.5">{value}<span className="text-sm font-normal text-gray-500 ml-1">{unit}</span></div>
          <div className="text-xs text-gray-500">{label}</div>
        </div>
      ))}
    </div>
  );
}

/* ─────── Node 1: 出厂检验 ─────── */
function AddFactoryInspectionModal({ isOpen, onClose, onSave, eligibleDevices }) {
  const { state } = useApp();
  const [form, setForm] = useState({ deviceId: '', inspector: state.currentUser, time: new Date().toISOString().slice(0, 16).replace('T', ' '), result: '通过', reportFile: '', reportLink: '' });
  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';
  const handleSubmit = (e) => {
    e.preventDefault();
    const device = eligibleDevices.find(d => d.id === form.deviceId);
    onSave({ ...form, id: `FI-${Date.now()}`, deviceSN: device?.sn || '' });
    onClose();
    setForm({ deviceId: '', inspector: state.currentUser, time: new Date().toISOString().slice(0, 16).replace('T', ' '), result: '通过', reportFile: '', reportLink: '' });
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新增出厂检验记录">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">选择设备 *</label>
          <select className={inp} required value={form.deviceId} onChange={e => setForm({ ...form, deviceId: e.target.value })}>
            <option value="">-- 选择已入库设备 --</option>
            {eligibleDevices.map(d => <option key={d.id} value={d.id}>{d.sn}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">检验员</label>
            <input type="text" className={inp} value={form.inspector} onChange={e => setForm({ ...form, inspector: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">检验时间</label>
            <input type="text" className={inp} value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">检验结果 *</label>
          <div className="flex gap-4">
            {['通过', '未通过'].map(r => (
              <label key={r} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="fi-result" value={r} checked={form.result === r} onChange={() => setForm({ ...form, result: r })} />
                <span className={`text-sm font-medium ${r === '通过' ? 'text-green-700' : 'text-red-700'}`}>{r}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">报告文件名</label>
            <input type="text" className={inp} value={form.reportFile} onChange={e => setForm({ ...form, reportFile: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">报告链接</label>
            <input type="text" className={inp} value={form.reportLink} onChange={e => setForm({ ...form, reportLink: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800">保存</button>
        </div>
      </form>
    </Modal>
  );
}

function BatchFIModal({ isOpen, onClose, onSave, selectedIds, eligibleDevices }) {
  const { state } = useApp();
  const [form, setForm] = useState({ inspector: state.currentUser, time: new Date().toISOString().slice(0, 16).replace('T', ' '), result: '通过', reportFile: '', reportLink: '' });
  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';
  const selectedDevices = eligibleDevices.filter(d => selectedIds.has(d.id));

  const handleSubmit = (e) => {
    e.preventDefault();
    const ts = Date.now();
    const records = selectedDevices.map((d, i) => ({ ...form, id: `FI-${ts}-${i}`, deviceId: d.id, deviceSN: d.sn }));
    onSave(records);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`批量提交出厂检验（${selectedDevices.length} 台）`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-3 max-h-28 overflow-y-auto">
          <div className="text-xs text-gray-500 mb-1.5">已选设备</div>
          <div className="flex flex-wrap gap-1.5">
            {selectedDevices.map(d => <span key={d.id} className="font-mono text-xs bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-700">{d.sn}</span>)}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">检验员</label>
            <input type="text" className={inp} value={form.inspector} onChange={e => setForm({ ...form, inspector: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">检验时间</label>
            <input type="text" className={inp} value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">检验结果</label>
          <div className="flex gap-4">
            {['通过', '未通过'].map(r => (
              <label key={r} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="bfi-result" value={r} checked={form.result === r} onChange={() => setForm({ ...form, result: r })} />
                <span className={`text-sm font-medium ${r === '通过' ? 'text-green-700' : 'text-red-700'}`}>{r}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">报告文件名</label>
            <input type="text" className={inp} value={form.reportFile} onChange={e => setForm({ ...form, reportFile: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">报告链接</label>
            <input type="text" className={inp} value={form.reportLink} onChange={e => setForm({ ...form, reportLink: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700">批量提交 {selectedDevices.length} 台</button>
        </div>
      </form>
    </Modal>
  );
}

function FactoryInspectionNode({ plan }) {
  const { state, dispatch } = useApp();
  const { canDo } = useRole();
  const getDeviceLink = (sn) => {
    const dev = sn ? state.devices.find(d => d.sn === sn) : null;
    return dev ? <Link to={`/devices/${dev.id}`} className="text-blue-600 hover:underline">{sn}</Link> : (sn || '—');
  };
  const [showModal, setShowModal] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const records = plan.records?.factoryInspection || [];
  const eligibleDevices = state.devices.filter(d =>
    ['已入库', '待分配项目'].includes(d.status) && (d.projectId === plan.projectId || !d.projectId)
  );

  const toggle = (id) => { const s = new Set(selectedIds); s.has(id) ? s.delete(id) : s.add(id); setSelectedIds(s); };
  const toggleAll = () => setSelectedIds(selectedIds.size === eligibleDevices.length ? new Set() : new Set(eligibleDevices.map(d => d.id)));

  const handleSave = (record) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    dispatch({ type: 'UPDATE_DELIVERY_PLAN', payload: { ...plan, records: { ...plan.records, factoryInspection: [...records, record] } } });
    if (record.result === '通过') dispatch({ type: 'UPDATE_DEVICE', payload: { id: record.deviceId, status: '出厂检验中', updatedAt: now } });
  };

  const handleBatchSave = (batchRecords) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    dispatch({ type: 'UPDATE_DELIVERY_PLAN', payload: { ...plan, records: { ...plan.records, factoryInspection: [...records, ...batchRecords] } } });
    batchRecords.forEach(r => {
      if (r.result === '通过') dispatch({ type: 'UPDATE_DEVICE', payload: { id: r.deviceId, status: '出厂检验中', updatedAt: now } });
    });
    setSelectedIds(new Set());
  };

  const handleExport = () => downloadCSV(records, [
    { key: 'deviceSN', label: '设备SN' },
    { key: 'inspector', label: '检验员' },
    { key: 'time', label: '检验时间' },
    { key: 'result', label: '检验结果' },
    { key: 'reportFile', label: '报告文件' },
    { key: 'reportLink', label: '报告链接' },
  ], `出厂检验记录_${plan.id}.csv`);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">出厂检验记录（{records.length} 条）</h3>
        <div className="flex items-center gap-2">
          {canDo('add_delivery') && selectedIds.size > 0 && (
            <button onClick={() => setShowBatch(true)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
              已选 {selectedIds.size} 台｜批量提交
            </button>
          )}
          <button onClick={() => setShowImport(true)} className="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded hover:bg-gray-50">导入CSV</button>
          <button onClick={handleExport} className="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded hover:bg-gray-50">导出CSV</button>
          {canDo('add_delivery') && (
            <button onClick={() => setShowModal(true)} className="px-3 py-1.5 text-sm bg-slate-700 text-white rounded hover:bg-slate-800">+ 新增记录</button>
          )}
        </div>
      </div>

      {canDo('add_delivery') && (
        <DeviceBatchSelector
          devices={eligibleDevices}
          selectedIds={selectedIds}
          onToggle={toggle}
          onToggleAll={toggleAll}
          label="可出厂检验设备"
        />
      )}

      <div className="bg-white rounded shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['设备SN', '检验员', '时间', '结果', '报告'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-800">{getDeviceLink(r.deviceSN)}</td>
                <td className="px-4 py-2.5 text-gray-600">{r.inspector}</td>
                <td className="px-4 py-2.5 text-gray-400 text-xs">{r.time}</td>
                <td className="px-4 py-2.5"><StatusBadge status={r.result} /></td>
                <td className="px-4 py-2.5 text-gray-500 text-xs">
                  {r.reportFile && <div>{r.reportFile}</div>}
                  {r.reportLink && <a href={r.reportLink} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">链接</a>}
                </td>
              </tr>
            ))}
            {records.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">暂无出厂检验记录</td></tr>}
          </tbody>
        </table>
      </div>

      <AddFactoryInspectionModal isOpen={showModal} onClose={() => setShowModal(false)} onSave={handleSave} eligibleDevices={eligibleDevices} />
      <BatchFIModal isOpen={showBatch} onClose={() => setShowBatch(false)} onSave={handleBatchSave} selectedIds={selectedIds} eligibleDevices={eligibleDevices} />
      <CSVImportModal isOpen={showImport} onClose={() => setShowImport(false)} nodeLabel="出厂检验" templateHeaders={['设备SN', '检验员', '检验时间', '检验结果(通过/未通过)', '报告文件名', '报告链接']} />
    </div>
  );
}

/* ─────── Node 2: 现场安装调试 ─────── */
function AddSiteInstallModal({ isOpen, onClose, onSave }) {
  const { state } = useApp();
  const [form, setForm] = useState({ deviceId: '', deviceSN: '', technician: state.currentUser, address: '', time: new Date().toISOString().slice(0, 16).replace('T', ' '), result: '通过', notes: '' });
  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';
  const inspectedDevices = state.devices.filter(d => d.status === '出厂检验中');
  const handleSubmit = (e) => {
    e.preventDefault();
    const device = inspectedDevices.find(d => d.id === form.deviceId);
    onSave({ ...form, id: `SI-${Date.now()}`, deviceSN: device?.sn || form.deviceSN });
    onClose();
    setForm({ deviceId: '', deviceSN: '', technician: state.currentUser, address: '', time: new Date().toISOString().slice(0, 16).replace('T', ' '), result: '通过', notes: '' });
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新增现场安装记录">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">选择设备 *</label>
          <select className={inp} required value={form.deviceId} onChange={e => { const d = inspectedDevices.find(d => d.id === e.target.value); setForm({ ...form, deviceId: e.target.value, deviceSN: d?.sn || '' }); }}>
            <option value="">-- 选择出厂检验中的设备 --</option>
            {inspectedDevices.map(d => <option key={d.id} value={d.id}>{d.sn}</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">安装地址</label>
          <input type="text" className={inp} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">技术人员</label>
            <input type="text" className={inp} value={form.technician} onChange={e => setForm({ ...form, technician: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">安装时间</label>
            <input type="text" className={inp} value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">安装结果</label>
          <div className="flex gap-4">
            {['通过', '未通过'].map(r => (
              <label key={r} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="si-result" value={r} checked={form.result === r} onChange={() => setForm({ ...form, result: r })} />
                <span className={`text-sm font-medium ${r === '通过' ? 'text-green-700' : 'text-red-700'}`}>{r}</span>
              </label>
            ))}
          </div>
        </div>
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

function BatchSIModal({ isOpen, onClose, onSave, selectedIds, eligibleDevices }) {
  const { state } = useApp();
  const [form, setForm] = useState({ technician: state.currentUser, address: '', time: new Date().toISOString().slice(0, 16).replace('T', ' '), result: '通过', notes: '' });
  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';
  const selectedDevices = eligibleDevices.filter(d => selectedIds.has(d.id));

  const handleSubmit = (e) => {
    e.preventDefault();
    const ts = Date.now();
    const records = selectedDevices.map((d, i) => ({ ...form, id: `SI-${ts}-${i}`, deviceId: d.id, deviceSN: d.sn }));
    onSave(records);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`批量提交现场安装（${selectedDevices.length} 台）`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-3 max-h-28 overflow-y-auto">
          <div className="text-xs text-gray-500 mb-1.5">已选设备</div>
          <div className="flex flex-wrap gap-1.5">
            {selectedDevices.map(d => <span key={d.id} className="font-mono text-xs bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-700">{d.sn}</span>)}
          </div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">安装地址</label>
          <input type="text" className={inp} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">技术人员</label>
            <input type="text" className={inp} value={form.technician} onChange={e => setForm({ ...form, technician: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">安装时间</label>
            <input type="text" className={inp} value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">安装结果</label>
          <div className="flex gap-4">
            {['通过', '未通过'].map(r => (
              <label key={r} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="bsi-result" value={r} checked={form.result === r} onChange={() => setForm({ ...form, result: r })} />
                <span className={`text-sm font-medium ${r === '通过' ? 'text-green-700' : 'text-red-700'}`}>{r}</span>
              </label>
            ))}
          </div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <textarea rows={2} className={inp} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700">批量提交 {selectedDevices.length} 台</button>
        </div>
      </form>
    </Modal>
  );
}

function SiteInstallNode({ plan }) {
  const { state, dispatch } = useApp();
  const { canDo } = useRole();
  const getDeviceLink = (sn) => {
    const dev = sn ? state.devices.find(d => d.sn === sn) : null;
    return dev ? <Link to={`/devices/${dev.id}`} className="text-blue-600 hover:underline">{sn}</Link> : (sn || '—');
  };
  const [showModal, setShowModal] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const records = plan.records?.siteInstall || [];
  const eligibleDevices = state.devices.filter(d => d.status === '出厂检验中');

  const toggle = (id) => { const s = new Set(selectedIds); s.has(id) ? s.delete(id) : s.add(id); setSelectedIds(s); };
  const toggleAll = () => setSelectedIds(selectedIds.size === eligibleDevices.length ? new Set() : new Set(eligibleDevices.map(d => d.id)));

  const handleSave = (record) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    dispatch({ type: 'UPDATE_DELIVERY_PLAN', payload: { ...plan, records: { ...plan.records, siteInstall: [...records, record] } } });
    if (record.result === '通过') dispatch({ type: 'UPDATE_DEVICE', payload: { id: record.deviceId, status: '现场安装调试中', updatedAt: now } });
  };

  const handleBatchSave = (batchRecords) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    dispatch({ type: 'UPDATE_DELIVERY_PLAN', payload: { ...plan, records: { ...plan.records, siteInstall: [...records, ...batchRecords] } } });
    batchRecords.forEach(r => {
      if (r.result === '通过') dispatch({ type: 'UPDATE_DEVICE', payload: { id: r.deviceId, status: '现场安装调试中', updatedAt: now } });
    });
    setSelectedIds(new Set());
  };

  const handleExport = () => downloadCSV(records, [
    { key: 'deviceSN', label: '设备SN' },
    { key: 'technician', label: '技术人员' },
    { key: 'address', label: '安装地址' },
    { key: 'time', label: '安装时间' },
    { key: 'result', label: '安装结果' },
    { key: 'notes', label: '备注' },
  ], `现场安装记录_${plan.id}.csv`);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">现场安装调试记录（{records.length} 条）</h3>
        <div className="flex items-center gap-2">
          {canDo('add_delivery') && selectedIds.size > 0 && (
            <button onClick={() => setShowBatch(true)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
              已选 {selectedIds.size} 台｜批量提交
            </button>
          )}
          <button onClick={() => setShowImport(true)} className="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded hover:bg-gray-50">导入CSV</button>
          <button onClick={handleExport} className="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded hover:bg-gray-50">导出CSV</button>
          {canDo('add_delivery') && (
            <button onClick={() => setShowModal(true)} className="px-3 py-1.5 text-sm bg-slate-700 text-white rounded hover:bg-slate-800">+ 新增记录</button>
          )}
        </div>
      </div>

      {canDo('add_delivery') && (
        <DeviceBatchSelector
          devices={eligibleDevices}
          selectedIds={selectedIds}
          onToggle={toggle}
          onToggleAll={toggleAll}
          label="可现场安装设备"
        />
      )}

      <div className="bg-white rounded shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['设备SN', '技术人员', '安装地址', '时间', '结果', '备注'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-800">{getDeviceLink(r.deviceSN)}</td>
                <td className="px-4 py-2.5 text-gray-600">{r.technician}</td>
                <td className="px-4 py-2.5 text-gray-600 text-xs max-w-[160px] truncate">{r.address || '—'}</td>
                <td className="px-4 py-2.5 text-gray-400 text-xs">{r.time}</td>
                <td className="px-4 py-2.5"><StatusBadge status={r.result} /></td>
                <td className="px-4 py-2.5 text-gray-500 text-xs max-w-[120px] truncate">{r.notes || '—'}</td>
              </tr>
            ))}
            {records.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无现场安装记录</td></tr>}
          </tbody>
        </table>
      </div>

      <AddSiteInstallModal isOpen={showModal} onClose={() => setShowModal(false)} onSave={handleSave} />
      <BatchSIModal isOpen={showBatch} onClose={() => setShowBatch(false)} onSave={handleBatchSave} selectedIds={selectedIds} eligibleDevices={eligibleDevices} />
      <CSVImportModal isOpen={showImport} onClose={() => setShowImport(false)} nodeLabel="现场安装" templateHeaders={['设备SN', '技术人员', '安装地址', '安装时间', '安装结果(通过/未通过)', '备注']} />
    </div>
  );
}

/* ─────── Node 3: 客户验收 ─────── */
function AddCustomerAcceptModal({ isOpen, onClose, onSave }) {
  const { state } = useApp();
  const [form, setForm] = useState({ deviceId: '', deviceSN: '', acceptor: state.currentUser, time: new Date().toISOString().slice(0, 16).replace('T', ' '), result: '通过', erpOutboundNo: '', voucherDesc: '' });
  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';
  const siteDevices = state.devices.filter(d => d.status === '现场安装调试中');
  const handleSubmit = (e) => {
    e.preventDefault();
    const device = siteDevices.find(d => d.id === form.deviceId);
    onSave({ ...form, id: `CA-${Date.now()}`, deviceSN: device?.sn || form.deviceSN });
    onClose();
    setForm({ deviceId: '', deviceSN: '', acceptor: state.currentUser, time: new Date().toISOString().slice(0, 16).replace('T', ' '), result: '通过', erpOutboundNo: '', voucherDesc: '' });
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新增客户验收记录">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">选择设备 *</label>
          <select className={inp} required value={form.deviceId} onChange={e => { const d = siteDevices.find(d => d.id === e.target.value); setForm({ ...form, deviceId: e.target.value, deviceSN: d?.sn || '' }); }}>
            <option value="">-- 选择现场安装调试中的设备 --</option>
            {siteDevices.map(d => <option key={d.id} value={d.id}>{d.sn}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">验收人</label>
            <input type="text" className={inp} value={form.acceptor} onChange={e => setForm({ ...form, acceptor: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">验收时间</label>
            <input type="text" className={inp} value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">验收结果</label>
          <div className="flex gap-4">
            {['通过', '未通过'].map(r => (
              <label key={r} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="ca-result" value={r} checked={form.result === r} onChange={() => setForm({ ...form, result: r })} />
                <span className={`text-sm font-medium ${r === '通过' ? 'text-green-700' : 'text-red-700'}`}>{r}</span>
              </label>
            ))}
          </div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">ERP销售出库单号</label>
          <input type="text" className={inp} value={form.erpOutboundNo} onChange={e => setForm({ ...form, erpOutboundNo: e.target.value })} placeholder="如 SO-2026-XXX" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">验收凭证（照片文件名）</label>
          <input type="text" className={inp} value={form.voucherDesc} onChange={e => setForm({ ...form, voucherDesc: e.target.value })} placeholder="如 acceptance-photo.jpg" /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800">保存</button>
        </div>
      </form>
    </Modal>
  );
}

function BatchCAModal({ isOpen, onClose, onSave, selectedIds, eligibleDevices }) {
  const { state } = useApp();
  const [form, setForm] = useState({ acceptor: state.currentUser, time: new Date().toISOString().slice(0, 16).replace('T', ' '), result: '通过', erpOutboundNo: '', voucherDesc: '' });
  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';
  const selectedDevices = eligibleDevices.filter(d => selectedIds.has(d.id));

  const handleSubmit = (e) => {
    e.preventDefault();
    const ts = Date.now();
    const records = selectedDevices.map((d, i) => ({ ...form, id: `CA-${ts}-${i}`, deviceId: d.id, deviceSN: d.sn }));
    onSave(records);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`批量提交客户验收（${selectedDevices.length} 台）`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-3 max-h-28 overflow-y-auto">
          <div className="text-xs text-gray-500 mb-1.5">已选设备</div>
          <div className="flex flex-wrap gap-1.5">
            {selectedDevices.map(d => <span key={d.id} className="font-mono text-xs bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-700">{d.sn}</span>)}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">验收人</label>
            <input type="text" className={inp} value={form.acceptor} onChange={e => setForm({ ...form, acceptor: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">验收时间</label>
            <input type="text" className={inp} value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">验收结果</label>
          <div className="flex gap-4">
            {['通过', '未通过'].map(r => (
              <label key={r} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="bca-result" value={r} checked={form.result === r} onChange={() => setForm({ ...form, result: r })} />
                <span className={`text-sm font-medium ${r === '通过' ? 'text-green-700' : 'text-red-700'}`}>{r}</span>
              </label>
            ))}
          </div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">ERP销售出库单号</label>
          <input type="text" className={inp} value={form.erpOutboundNo} onChange={e => setForm({ ...form, erpOutboundNo: e.target.value })} placeholder="如 SO-2026-XXX" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">验收凭证（照片文件名）</label>
          <input type="text" className={inp} value={form.voucherDesc} onChange={e => setForm({ ...form, voucherDesc: e.target.value })} placeholder="如 acceptance-photo.jpg" /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700">批量提交 {selectedDevices.length} 台</button>
        </div>
      </form>
    </Modal>
  );
}

function CustomerAcceptNode({ plan }) {
  const { state, dispatch } = useApp();
  const { canDo } = useRole();
  const getDeviceLink = (sn) => {
    const dev = sn ? state.devices.find(d => d.sn === sn) : null;
    return dev ? <Link to={`/devices/${dev.id}`} className="text-blue-600 hover:underline">{sn}</Link> : (sn || '—');
  };
  const [showModal, setShowModal] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const records = plan.records?.customerAccept || [];
  const eligibleDevices = state.devices.filter(d => d.status === '现场安装调试中');

  const toggle = (id) => { const s = new Set(selectedIds); s.has(id) ? s.delete(id) : s.add(id); setSelectedIds(s); };
  const toggleAll = () => setSelectedIds(selectedIds.size === eligibleDevices.length ? new Set() : new Set(eligibleDevices.map(d => d.id)));

  const handleSave = (record) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    dispatch({ type: 'UPDATE_DELIVERY_PLAN', payload: { ...plan, records: { ...plan.records, customerAccept: [...records, record] } } });
    if (record.result === '通过') dispatch({ type: 'UPDATE_DEVICE', payload: { id: record.deviceId, status: '在线运营', updatedAt: now } });
  };

  const handleBatchSave = (batchRecords) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    dispatch({ type: 'UPDATE_DELIVERY_PLAN', payload: { ...plan, records: { ...plan.records, customerAccept: [...records, ...batchRecords] } } });
    batchRecords.forEach(r => {
      if (r.result === '通过') dispatch({ type: 'UPDATE_DEVICE', payload: { id: r.deviceId, status: '在线运营', updatedAt: now } });
    });
    setSelectedIds(new Set());
  };

  const handleExport = () => downloadCSV(records, [
    { key: 'deviceSN', label: '设备SN' },
    { key: 'acceptor', label: '验收人' },
    { key: 'time', label: '验收时间' },
    { key: 'result', label: '验收结果' },
    { key: 'erpOutboundNo', label: 'ERP出库单号' },
    { key: 'voucherDesc', label: '验收凭证' },
  ], `客户验收记录_${plan.id}.csv`);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">客户验收记录（{records.length} 条）</h3>
        <div className="flex items-center gap-2">
          {canDo('add_delivery') && selectedIds.size > 0 && (
            <button onClick={() => setShowBatch(true)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
              已选 {selectedIds.size} 台｜批量提交
            </button>
          )}
          <button onClick={() => setShowImport(true)} className="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded hover:bg-gray-50">导入CSV</button>
          <button onClick={handleExport} className="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded hover:bg-gray-50">导出CSV</button>
          {canDo('add_delivery') && (
            <button onClick={() => setShowModal(true)} className="px-3 py-1.5 text-sm bg-slate-700 text-white rounded hover:bg-slate-800">+ 新增记录</button>
          )}
        </div>
      </div>

      {canDo('add_delivery') && (
        <DeviceBatchSelector
          devices={eligibleDevices}
          selectedIds={selectedIds}
          onToggle={toggle}
          onToggleAll={toggleAll}
          label="可验收设备"
        />
      )}

      <div className="bg-white rounded shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['设备SN', '验收人', '时间', '结果', 'ERP出库单号', '凭证'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-800">{getDeviceLink(r.deviceSN)}</td>
                <td className="px-4 py-2.5 text-gray-600">{r.acceptor}</td>
                <td className="px-4 py-2.5 text-gray-400 text-xs">{r.time}</td>
                <td className="px-4 py-2.5"><StatusBadge status={r.result} /></td>
                <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{r.erpOutboundNo || '—'}</td>
                <td className="px-4 py-2.5 text-gray-500 text-xs">{r.voucherDesc || '—'}</td>
              </tr>
            ))}
            {records.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无客户验收记录</td></tr>}
          </tbody>
        </table>
      </div>

      <AddCustomerAcceptModal isOpen={showModal} onClose={() => setShowModal(false)} onSave={handleSave} />
      <BatchCAModal isOpen={showBatch} onClose={() => setShowBatch(false)} onSave={handleBatchSave} selectedIds={selectedIds} eligibleDevices={eligibleDevices} />
      <CSVImportModal isOpen={showImport} onClose={() => setShowImport(false)} nodeLabel="客户验收" templateHeaders={['设备SN', '验收人', '验收时间', '验收结果(通过/未通过)', 'ERP出库单号', '验收凭证文件名']} />
    </div>
  );
}

/* ─────── Main Page ─────── */
export default function DeliveryPlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const NODE_KEYS = ['factoryInspection', 'siteInstall', 'customerAccept'];
  const nodeParam = searchParams.get('node');
  const activeNode = NODE_KEYS.includes(nodeParam) ? nodeParam : 'factoryInspection';
  const setActiveNode = (key) => setSearchParams({ node: key }, { replace: true });

  const plan = state.deliveryPlans?.find(p => p.id === id);

  if (!plan) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-400 mb-4">未找到交付计划 {id}</div>
        <button onClick={() => navigate('/projects?tab=delivery')} className="text-slate-700 hover:underline text-sm">← 返回交付计划</button>
      </div>
    );
  }

  const project = state.projects?.find(p => p.id === plan.projectId);

  return (
    <div className="p-6">
      <div className="flex items-start gap-4 mb-6">
        <button onClick={() => navigate('/projects?tab=delivery')} className="text-gray-400 hover:text-gray-600 mt-1 text-sm">← 返回</button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-base font-semibold text-gray-800">{plan.name}</span>
            <StatusBadge status={plan.status} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-gray-500">
            {project && <span>关联项目：<Link to={`/projects/${project.id}`} className="text-blue-600 hover:underline">{project.name}</Link></span>}
            <span>目标交付：{plan.targetCount} 台</span>
            {plan.dueDate && <span>截止日期：{plan.dueDate}</span>}
          </div>
        </div>
      </div>

      <MetricsPanel plan={plan} />
      <ProgressBar plan={plan} activeNode={activeNode} setActiveNode={setActiveNode} />

      {activeNode === 'factoryInspection' && <FactoryInspectionNode plan={plan} />}
      {activeNode === 'siteInstall' && <SiteInstallNode plan={plan} />}
      {activeNode === 'customerAccept' && <CustomerAcceptNode plan={plan} />}
    </div>
  );
}
