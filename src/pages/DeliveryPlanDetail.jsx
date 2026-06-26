import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useRole } from '../context/RoleContext';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

const NODES = [
  { key: 'factoryInspection', label: '出厂检验',    step: 1 },
  { key: 'siteInstall',       label: '现场安装调试', step: 2 },
  { key: 'customerAccept',    label: '客户验收',    step: 3 },
];

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

function FactoryInspectionNode({ plan, onUpdatePlan }) {
  const { state, dispatch } = useApp();
  const { canDo } = useRole();
  const [showModal, setShowModal] = useState(false);

  const records = plan.records?.factoryInspection || [];
  const eligibleDevices = state.devices.filter(d => ['已入库', '待分配项目'].includes(d.status) && (d.projectId === plan.projectId || !d.projectId));

  const handleSave = (record) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const updated = { ...plan, records: { ...plan.records, factoryInspection: [...records, record] } };
    dispatch({ type: 'UPDATE_DELIVERY_PLAN', payload: updated });
    if (record.result === '通过') {
      dispatch({ type: 'UPDATE_DEVICE', payload: { id: record.deviceId, status: '出厂检验中', updatedAt: now } });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">出厂检验记录（{records.length} 条）</h3>
        {canDo('add_delivery') && (
          <button onClick={() => setShowModal(true)} className="px-3 py-1.5 text-sm bg-slate-700 text-white rounded hover:bg-slate-800">+ 新增记录</button>
        )}
      </div>
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
                <td className="px-4 py-2.5 font-mono text-xs text-gray-800">{r.deviceSN}</td>
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

function SiteInstallNode({ plan }) {
  const { dispatch } = useApp();
  const { canDo } = useRole();
  const [showModal, setShowModal] = useState(false);
  const records = plan.records?.siteInstall || [];

  const handleSave = (record) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const updated = { ...plan, records: { ...plan.records, siteInstall: [...records, record] } };
    dispatch({ type: 'UPDATE_DELIVERY_PLAN', payload: updated });
    if (record.result === '通过') {
      dispatch({ type: 'UPDATE_DEVICE', payload: { id: record.deviceId, status: '现场安装调试中', updatedAt: now } });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">现场安装调试记录（{records.length} 条）</h3>
        {canDo('add_delivery') && (
          <button onClick={() => setShowModal(true)} className="px-3 py-1.5 text-sm bg-slate-700 text-white rounded hover:bg-slate-800">+ 新增记录</button>
        )}
      </div>
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
                <td className="px-4 py-2.5 font-mono text-xs text-gray-800">{r.deviceSN}</td>
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

function CustomerAcceptNode({ plan }) {
  const { dispatch } = useApp();
  const { canDo } = useRole();
  const [showModal, setShowModal] = useState(false);
  const records = plan.records?.customerAccept || [];

  const handleSave = (record) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const updated = { ...plan, records: { ...plan.records, customerAccept: [...records, record] } };
    dispatch({ type: 'UPDATE_DELIVERY_PLAN', payload: updated });
    if (record.result === '通过') {
      dispatch({ type: 'UPDATE_DEVICE', payload: { id: record.deviceId, status: '在线运营', updatedAt: now } });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">客户验收记录（{records.length} 条）</h3>
        {canDo('add_delivery') && (
          <button onClick={() => setShowModal(true)} className="px-3 py-1.5 text-sm bg-slate-700 text-white rounded hover:bg-slate-800">+ 新增记录</button>
        )}
      </div>
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
                <td className="px-4 py-2.5 font-mono text-xs text-gray-800">{r.deviceSN}</td>
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
    </div>
  );
}

/* ─────── Main Page ─────── */
export default function DeliveryPlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useApp();
  const [activeNode, setActiveNode] = useState('factoryInspection');

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
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <button onClick={() => navigate('/projects?tab=delivery')} className="text-gray-400 hover:text-gray-600 mt-1 text-sm">← 返回</button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-gray-800">{plan.name}</h1>
            <StatusBadge status={plan.status} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-gray-500">
            {project && <span>关联项目：<Link to={`/projects/${project.id}`} className="text-blue-600 hover:underline">{project.name}</Link></span>}
            <span>目标交付：{plan.targetCount} 台</span>
            {plan.dueDate && <span>截止日期：{plan.dueDate}</span>}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <MetricsPanel plan={plan} />

      {/* Workflow progress */}
      <ProgressBar plan={plan} activeNode={activeNode} setActiveNode={setActiveNode} />

      {/* Node content */}
      {activeNode === 'factoryInspection' && <FactoryInspectionNode plan={plan} />}
      {activeNode === 'siteInstall' && <SiteInstallNode plan={plan} />}
      {activeNode === 'customerAccept' && <CustomerAcceptNode plan={plan} />}
    </div>
  );
}
