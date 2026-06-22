import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useRole } from '../context/RoleContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

function EditProjectModal({ isOpen, onClose, project, onSave }) {
  const [form, setForm] = useState({
    name: project?.name || '',
    client: project?.client || '',
    contactPerson: project?.contactPerson || '',
    contactPhone: project?.contactPhone || '',
    background: project?.background || '',
    notes: project?.notes || '',
    targetCount: project?.targetCount || 1,
    manager: project?.manager || '',
  });

  const f = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });
  const inputClass = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, targetCount: Number(form.targetCount) });
    onClose();
  };

  if (!project) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="编辑项目信息" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">项目名称 *</label>
            <input type="text" className={inputClass} required {...f('name')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">目标需求量 *</label>
            <input type="number" min="1" className={inputClass} required {...f('targetCount')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">客户名称</label>
            <input type="text" className={inputClass} {...f('client')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">项目负责人</label>
            <input type="text" className={inputClass} {...f('manager')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">联系人</label>
            <input type="text" className={inputClass} {...f('contactPerson')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
            <input type="text" className={inputClass} {...f('contactPhone')} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">项目背景</label>
          <textarea rows={3} className={inputClass} {...f('background')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <textarea rows={2} className={inputClass} {...f('notes')} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800">保存</button>
        </div>
      </form>
    </Modal>
  );
}

function AllocateDevicesModal({ isOpen, onClose, pendingDevices, getTypeName, onConfirm }) {
  const [selected, setSelected] = useState(new Set());

  const toggle = (devId) => setSelected((prev) => {
    const next = new Set(prev);
    next.has(devId) ? next.delete(devId) : next.add(devId);
    return next;
  });
  const allSelected = pendingDevices.length > 0 && selected.size === pendingDevices.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(pendingDevices.map((d) => d.id)));

  const handleConfirm = () => {
    onConfirm([...selected]);
    setSelected(new Set());
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="分配设备" size="lg">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">从「待分配项目」设备中选择，确认后分配到当前项目。</p>
        <div className="border border-gray-200 rounded overflow-hidden max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 w-8">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={pendingDevices.length === 0} />
                </th>
                {['设备SN', '整机类型', '装配人', '完成时间'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pendingDevices.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => toggle(d.id)}>
                  <td className="px-3 py-2"><input type="checkbox" checked={selected.has(d.id)} onChange={() => toggle(d.id)} onClick={(e) => e.stopPropagation()} /></td>
                  <td className="px-3 py-2 font-mono text-xs text-gray-800 font-medium">{d.sn}</td>
                  <td className="px-3 py-2 text-gray-600">{getTypeName(d.deviceTypeId)}</td>
                  <td className="px-3 py-2 text-gray-600">{d.assembler}</td>
                  <td className="px-3 py-2 text-gray-400 text-xs">{d.updatedAt}</td>
                </tr>
              ))}
              {pendingDevices.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">暂无待分配设备</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button onClick={handleConfirm} disabled={selected.size === 0}
            className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800 disabled:opacity-40">
            确认分配（{selected.size}）
          </button>
        </div>
      </div>
    </Modal>
  );
}

function TransferModal({ isOpen, onClose, device, projects, currentProjectId, onConfirm }) {
  const [targetProjectId, setTargetProjectId] = useState('');
  const [reason, setReason] = useState('');

  const handleConfirm = (e) => {
    e.preventDefault();
    if (!targetProjectId) return;
    onConfirm({ device, targetProjectId, reason });
    setTargetProjectId('');
    setReason('');
    onClose();
  };

  const targets = projects.filter((p) => p.id !== currentProjectId && !p.voided);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`转移设备：${device?.sn || ''}`}>
      <form onSubmit={handleConfirm} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">目标项目 *</label>
          <select value={targetProjectId} onChange={(e) => setTargetProjectId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500" required>
            <option value="">-- 选择项目 --</option>
            {targets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">转移原因</label>
          <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-amber-600 rounded hover:bg-amber-700">确认转移</button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { state, dispatch } = useApp();
  const { canDo } = useRole();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [transferTarget, setTransferTarget] = useState(null);
  const [expandedDeviceId, setExpandedDeviceId] = useState(null);

  const { projects, deviceAllocations, devices, deliveryRecords, deviceTypes } = state;

  const project = projects.find((p) => p.id === id);
  if (!project) {
    return (
      <div className="p-6">
        <div className="text-gray-400">项目不存在</div>
      </div>
    );
  }

  const allocations = deviceAllocations.filter((a) => a.projectId === id);
  const allocatedDeviceIds = [...new Set(allocations.map((a) => a.deviceId))];
  const allocatedDevices = allocatedDeviceIds
    .map((devId) => devices.find((d) => d.id === devId))
    .filter(Boolean);

  const allocated = allocatedDevices.length;
  const pct = Math.min(Math.round((allocated / project.targetCount) * 100), 100);

  const getTypeName = (typeId) => deviceTypes.find((dt) => dt.id === typeId)?.name || typeId;

  const getDeviceDeliveryStages = (deviceId) => {
    const records = deliveryRecords
      .filter((r) => r.deviceId === deviceId && r.projectId === id)
      .sort((a, b) => b.recordTime.localeCompare(a.recordTime));
    const stages = ['出厂检验', '现场安装调试', '客户验收'];
    return stages.map((stage) => {
      const latest = records.find((r) => r.stage === stage);
      return { stage, result: latest?.result, time: latest?.recordTime };
    });
  };

  const handleSave = (form) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    dispatch({
      type: 'UPDATE_PROJECT',
      payload: { id, ...form, updatedAt: now },
    });
  };

  const pendingDevices = devices.filter((d) => d.status === '待分配项目');
  const getProjectName = (pid) => projects.find((p) => p.id === pid)?.name || pid;
  const canAllocate = canDo('add_device_allocation') || canDo('add_project');

  const now = () => new Date().toISOString().slice(0, 16).replace('T', ' ');

  const handleAllocate = (deviceIds) => {
    const t = now();
    deviceIds.forEach((devId) => {
      const device = devices.find((d) => d.id === devId);
      if (!device) return;
      dispatch({
        type: 'ADD_DEVICE_ALLOCATION',
        payload: {
          id: `ALLOC-${Date.now()}-${devId}`,
          deviceId: devId,
          projectId: id,
          allocatedBy: state.currentUser,
          allocatedAt: t,
          notes: '',
          type: '分配',
          fromProjectId: null,
        },
      });
      dispatch({ type: 'UPDATE_DEVICE', payload: { id: devId, status: '已分配项目', projectId: id, updatedAt: t } });
      dispatch({
        type: 'ADD_OPERATION_LOG',
        payload: {
          id: `LOG-${Date.now()}-${devId}`,
          deviceId: devId,
          operator: state.currentUser,
          timestamp: t,
          actionType: '分配至项目',
          fromStatus: '待分配项目',
          toStatus: '已分配项目',
          notes: `分配至 ${project.name}`,
        },
      });
    });
  };

  const handleTransfer = ({ device, targetProjectId, reason }) => {
    const t = now();
    dispatch({
      type: 'ADD_DEVICE_ALLOCATION',
      payload: {
        id: `ALLOC-${Date.now()}-${device.id}`,
        deviceId: device.id,
        projectId: targetProjectId,
        allocatedBy: state.currentUser,
        allocatedAt: t,
        notes: reason,
        type: '转移',
        fromProjectId: id,
      },
    });
    dispatch({ type: 'UPDATE_DEVICE', payload: { id: device.id, projectId: targetProjectId, updatedAt: t } });
    dispatch({
      type: 'ADD_OPERATION_LOG',
      payload: {
        id: `LOG-${Date.now()}-${device.id}`,
        deviceId: device.id,
        operator: state.currentUser,
        timestamp: t,
        actionType: '项目转移',
        fromStatus: project.name,
        toStatus: getProjectName(targetProjectId),
        notes: reason || `从 ${project.name} 转移至 ${getProjectName(targetProjectId)}`,
      },
    });
  };

  const getDeviceAllocHistory = (deviceId) =>
    deviceAllocations
      .filter((a) => a.deviceId === deviceId)
      .sort((a, b) => (b.allocatedAt || '').localeCompare(a.allocatedAt || ''));

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/projects" className="hover:text-slate-700 hover:underline">项目列表</Link>
          <span>›</span>
          <span className="text-gray-800 font-medium">{project.name}</span>
        </div>
        {canDo('add_project') && !project.voided && (
          <button
            onClick={() => setShowEditModal(true)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
          >
            编辑信息
          </button>
        )}
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded shadow-sm p-5">
        <h2 className="text-base font-semibold text-gray-700 mb-4">项目基本信息</h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div><span className="text-gray-500">项目名称：</span><span className="font-medium text-gray-800">{project.name}</span></div>
          <div><span className="text-gray-500">客户：</span><span className="text-gray-700">{project.client || '—'}</span></div>
          <div><span className="text-gray-500">项目负责人：</span><span className="text-gray-700">{project.manager || '—'}</span></div>
          <div><span className="text-gray-500">联系人：</span><span className="text-gray-700">{project.contactPerson || '—'}</span></div>
          <div><span className="text-gray-500">联系电话：</span><span className="text-gray-700">{project.contactPhone || '—'}</span></div>
          <div><span className="text-gray-500">创建时间：</span><span className="text-gray-500 text-xs">{project.createdAt}</span></div>
          {project.background && (
            <div className="col-span-3"><span className="text-gray-500">项目背景：</span><span className="text-gray-700">{project.background}</span></div>
          )}
          {project.notes && (
            <div className="col-span-3"><span className="text-gray-500">备注：</span><span className="text-gray-700">{project.notes}</span></div>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded shadow-sm p-5">
        <h2 className="text-base font-semibold text-gray-700 mb-3">分配进度</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all text-xs text-white flex items-center justify-center font-medium ${pct >= 100 ? 'bg-green-500' : pct > 50 ? 'bg-blue-500' : 'bg-amber-400'}`}
              style={{ width: `${Math.max(pct, 8)}%` }}
            >
              {pct > 20 ? `${pct}%` : ''}
            </div>
          </div>
          <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
            {allocated} / {project.targetCount} 台
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-2">目标需求 {project.targetCount} 台，已分配 {allocated} 台，剩余 {Math.max(project.targetCount - allocated, 0)} 台</p>
      </div>

      {/* 设备管理 */}
      <div className="bg-white rounded shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-700">设备管理（{allocatedDevices.length}台）</h2>
          {canAllocate && !project.voided && (
            <button onClick={() => setShowAllocateModal(true)}
              className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded hover:bg-slate-800">
              + 分配设备
            </button>
          )}
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2.5 w-8" />
              {['设备SN', '整机类型', '当前状态', '分配时间', '操作'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {allocatedDevices.map((d) => {
              const alloc = allocations.find((a) => a.deviceId === d.id);
              const isExpanded = expandedDeviceId === d.id;
              const history = getDeviceAllocHistory(d.id);
              return (
                <>
                  <tr key={d.id} className={isExpanded ? 'bg-slate-50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-2.5 text-gray-400 text-sm cursor-pointer w-8"
                      onClick={() => setExpandedDeviceId(isExpanded ? null : d.id)}>
                      {isExpanded ? '▼' : '▶'}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-800 font-medium">
                      <Link to={`/devices/${d.id}`} className="hover:text-blue-600 hover:underline">{d.sn}</Link>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{getTypeName(d.deviceTypeId)}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={d.status} /></td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">{alloc?.allocatedAt || '—'}</td>
                    <td className="px-4 py-2.5">
                      <Link to={`/devices/${d.id}`} className="text-slate-600 hover:underline text-xs mr-3">查看详情</Link>
                      {canAllocate && !project.voided && (
                        <button onClick={() => setTransferTarget(d)} className="text-amber-600 hover:underline text-xs">转移</button>
                      )}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${d.id}-history`}>
                      <td colSpan={6} className="px-0 py-0 bg-slate-50 border-b border-slate-200">
                        <div className="px-12 py-4">
                          <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">分配/转移记录</div>
                          {history.length > 0 ? (
                            <table className="w-full text-sm border border-gray-200 rounded overflow-hidden">
                              <thead className="bg-gray-100">
                                <tr>
                                  {['时间', '类型', '目标项目', '操作人', '备注'].map((h) => (
                                    <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {history.map((h) => (
                                  <tr key={h.id} className="bg-white">
                                    <td className="px-3 py-2 text-gray-400 text-xs">{h.allocatedAt}</td>
                                    <td className="px-3 py-2">
                                      <span className={`text-xs px-2 py-0.5 rounded-full border ${h.type === '转移' ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-blue-100 text-blue-700 border-blue-300'}`}>{h.type}</span>
                                    </td>
                                    <td className="px-3 py-2 text-gray-700">{getProjectName(h.projectId)}</td>
                                    <td className="px-3 py-2 text-gray-600">{h.allocatedBy}</td>
                                    <td className="px-3 py-2 text-gray-500 text-xs">{h.notes || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-sm text-gray-400">暂无分配记录</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
            {allocatedDevices.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无已分配设备</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delivery Status */}
      {allocatedDevices.length > 0 && (
        <div className="bg-white rounded shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-700">交付状态概览</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">设备SN</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">出厂检验</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">现场安装调试</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">客户验收</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allocatedDevices.map((d) => {
                const stages = getDeviceDeliveryStages(d.id);
                return (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-800 font-medium">{d.sn}</td>
                    {stages.map(({ stage, result, time }) => (
                      <td key={stage} className="px-4 py-2.5">
                        {result ? (
                          <div>
                            <StatusBadge status={result} />
                            <div className="text-xs text-gray-400 mt-0.5">{time?.slice(0, 10)}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <EditProjectModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        project={project}
        onSave={handleSave}
      />

      <AllocateDevicesModal
        isOpen={showAllocateModal}
        onClose={() => setShowAllocateModal(false)}
        pendingDevices={pendingDevices}
        getTypeName={getTypeName}
        onConfirm={handleAllocate}
      />

      {transferTarget && (
        <TransferModal
          isOpen={!!transferTarget}
          onClose={() => setTransferTarget(null)}
          device={transferTarget}
          projects={projects}
          currentProjectId={id}
          onConfirm={handleTransfer}
        />
      )}
    </div>
  );
}
