import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useRole } from '../context/RoleContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

function AddWorkOrderModal({ isOpen, onClose, onSave, devices, currentUser }) {
  const [form, setForm] = useState({
    deviceId: '', description: '', severity: '高', assignedTo: currentUser,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const device = devices.find((d) => d.id === form.deviceId);
    onSave({ ...form, deviceSN: device?.sn || '', projectId: device?.projectId || null });
    onClose();
    setForm({ deviceId: '', description: '', severity: '高', assignedTo: currentUser });
  };

  const inputClass = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新增工单">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">设备 *</label>
          <select className={inputClass} required value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: e.target.value })}>
            <option value="">-- 选择设备 --</option>
            {devices.map((d) => <option key={d.id} value={d.id}>{d.sn}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">严重程度</label>
            <select className={inputClass} value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
              <option>高</option><option>中</option><option>低</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">处理人</label>
            <input type="text" className={inputClass} value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">故障描述 *</label>
          <textarea rows={3} className={inputClass} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800">保存</button>
        </div>
      </form>
    </Modal>
  );
}

export default function WorkOrders() {
  const { state, dispatch } = useApp();
  const { canDo } = useRole();
  const [searchParams] = useSearchParams();
  const [filterStatus, setFilterStatus] = useState('全部');
  const [expandedId, setExpandedId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const s = searchParams.get('status');
    if (s) setFilterStatus(s);
    const highlight = searchParams.get('highlight');
    if (highlight) setExpandedId(highlight);
  }, [searchParams]);

  const { workOrders, devices, projects, materials, moduleTypes } = state;

  const onlineDevices = devices.filter((d) => d.status === '在线运营');
  const getProjectName = (id) => projects.find((p) => p.id === id)?.name || '—';
  const getMaterialSN = (id) => materials.find((m) => m.id === id)?.sn || id;
  const getModuleName = (id) => moduleTypes.find((m) => m.id === id)?.name || id;

  const filtered = [...workOrders]
    .filter((w) => filterStatus === '全部' || w.status === filterStatus)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const handleSave = (form) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    dispatch({
      type: 'ADD_WORK_ORDER',
      payload: {
        id: `WO-${Date.now()}`,
        deviceId: form.deviceId,
        deviceSN: form.deviceSN,
        projectId: form.projectId,
        description: form.description,
        severity: form.severity,
        status: '待处理',
        assignedTo: form.assignedTo,
        createdAt: now,
        updatedAt: now,
        closedAt: null,
        repairActions: '',
        replacedModules: [],
        recheckResult: null,
        notes: '',
      },
    });
  };

  const handleStatusChange = (wo, newStatus) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    dispatch({
      type: 'UPDATE_WORK_ORDER',
      payload: {
        id: wo.id,
        status: newStatus,
        updatedAt: now,
        closedAt: newStatus === '已关闭' ? now : wo.closedAt,
      },
    });
  };

  const statusCounts = { '待处理': 0, '处理中': 0, '已关闭': 0 };
  workOrders.forEach((w) => { if (statusCounts[w.status] !== undefined) statusCounts[w.status]++; });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">维修工单</h1>
        {canDo('add_work_order') && (
          <button onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-800">
            + 新增工单
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-4 flex flex-wrap gap-2 items-center">
        {['全部', '待处理', '处理中', '已关闭'].map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 text-xs rounded-full border font-medium transition-colors ${
              filterStatus === s ? 'bg-slate-700 text-white border-slate-700' : 'bg-gray-100 text-gray-600 border-gray-300'
            }`}>
            {s}
            {s !== '全部' && <span className="ml-1 font-bold">{statusCounts[s]}</span>}
            {s === '全部' && <span className="ml-1">{workOrders.length}</span>}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400">共 {filtered.length} 条</span>
      </div>

      <div className="bg-white rounded shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['工单号', '设备SN', '故障描述', '严重程度', '状态', '处理人', '创建时间', '操作'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((wo) => {
              const isExpanded = expandedId === wo.id;
              return (
                <>
                  <tr key={wo.id}
                    onClick={() => setExpandedId(isExpanded ? null : wo.id)}
                    className={`cursor-pointer border-t border-gray-100 transition-colors hover:bg-blue-50 ${isExpanded ? 'bg-slate-50' : ''}`}>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{wo.id}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-800 font-medium">{wo.deviceSN}</td>
                    <td className="px-4 py-2.5 text-gray-700 max-w-[200px]">
                      <div className="truncate">{wo.description}</div>
                    </td>
                    <td className="px-4 py-2.5"><StatusBadge status={wo.severity} /></td>
                    <td className="px-4 py-2.5"><StatusBadge status={wo.status} /></td>
                    <td className="px-4 py-2.5 text-gray-600">{wo.assignedTo}</td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">{wo.createdAt}</td>
                    <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1.5">
                        {wo.status === '待处理' && (
                          <button onClick={() => handleStatusChange(wo, '处理中')}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
                            开始处理
                          </button>
                        )}
                        {wo.status === '处理中' && (
                          <button onClick={() => handleStatusChange(wo, '已关闭')}
                            className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700">
                            关闭工单
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${wo.id}-expand`}>
                      <td colSpan={8} className="bg-slate-50 border-b border-slate-200 px-0 py-0">
                        <div className="px-8 py-4 space-y-3">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div><span className="text-gray-500">所属项目：</span><span className="text-gray-800">{wo.projectId ? getProjectName(wo.projectId) : '—'}</span></div>
                            <div><span className="text-gray-500">创建时间：</span><span className="text-gray-700">{wo.createdAt}</span></div>
                            {wo.closedAt && <div><span className="text-gray-500">关闭时间：</span><span className="text-gray-700">{wo.closedAt}</span></div>}
                          </div>
                          {wo.repairActions && (
                            <div className="text-sm"><span className="text-gray-500">维修措施：</span><span className="text-gray-800">{wo.repairActions}</span></div>
                          )}
                          {wo.notes && (
                            <div className="text-sm"><span className="text-gray-500">备注：</span><span className="text-gray-700">{wo.notes}</span></div>
                          )}
                          {wo.recheckResult && (
                            <div className="text-sm"><span className="text-gray-500">复检结果：</span><StatusBadge status={wo.recheckResult} /></div>
                          )}
                          {wo.replacedModules && wo.replacedModules.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-gray-600 mb-2">已更换模块</div>
                              <table className="w-full text-xs border border-gray-200 rounded">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-1.5 text-left">模块类型</th>
                                    <th className="px-3 py-1.5 text-left">拆除物料SN</th>
                                    <th className="px-3 py-1.5 text-left">安装物料SN</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {wo.replacedModules.map((rm, i) => (
                                    <tr key={i} className="border-t border-gray-100">
                                      <td className="px-3 py-1.5">{getModuleName(rm.moduleTypeId)}</td>
                                      <td className="px-3 py-1.5 font-mono">{getMaterialSN(rm.removedMaterialId)}</td>
                                      <td className="px-3 py-1.5 font-mono">{getMaterialSN(rm.addedMaterialId)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">暂无工单</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <AddWorkOrderModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          devices={onlineDevices}
          currentUser={state.currentUser}
        />
      )}
    </div>
  );
}
