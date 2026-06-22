import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useRole } from '../context/RoleContext';
import { FEISHU_USERS } from '../data/mockData';
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

function AddReplacementModal({ isOpen, onClose, wo, device, deviceType, materials, moduleTypes, currentUser, onSave }) {
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [selectedNewMaterialId, setSelectedNewMaterialId] = useState('');
  const [disposition, setDisposition] = useState('报废');
  const [notes, setNotes] = useState('');

  if (!isOpen || !device || !deviceType) return null;

  const slots = deviceType.slots || [];
  const selectedSlot = slots.find((s) => s.id === selectedSlotId);

  const currentMaterial = selectedSlot
    ? device.usedMaterials?.find((um) => um.moduleTypeId === selectedSlot.moduleTypeId)
    : null;
  const currentMat = currentMaterial
    ? materials.find((m) => m.id === currentMaterial.materialId)
    : null;

  const moduleTypeForSlot = selectedSlot
    ? moduleTypes.find((mt) => mt.id === selectedSlot.moduleTypeId)
    : null;

  const availableMaterials = selectedSlot
    ? materials.filter(
        (m) => m.status === '待装配' && m.category === moduleTypeForSlot?.category
      )
    : [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedSlot || !currentMat || !selectedNewMaterialId) return;
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    onSave({
      slot: selectedSlot,
      removedMaterialId: currentMat.id,
      addedMaterialId: selectedNewMaterialId,
      disposition,
      notes,
      operator: currentUser,
      operatedAt: now,
    });
    setSelectedSlotId('');
    setSelectedNewMaterialId('');
    setDisposition('报废');
    setNotes('');
    onClose();
  };

  const inputClass = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="记录换件">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">选择槁位 *</label>
          <select
            className={inputClass}
            required
            value={selectedSlotId}
            onChange={(e) => { setSelectedSlotId(e.target.value); setSelectedNewMaterialId(''); }}
          >
            <option value="">-- 选择槁位 --</option>
            {slots.map((s) => {
              const mt = moduleTypes.find((m) => m.id === s.moduleTypeId);
              return <option key={s.id} value={s.id}>{s.slotName}（{mt?.name || s.moduleTypeId}）</option>;
            })}
          </select>
        </div>

        {selectedSlot && (
          <div className="bg-gray-50 rounded p-3 text-sm">
            <div className="text-xs text-gray-500 mb-1">当前物料</div>
            {currentMat ? (
              <div className="font-mono text-gray-700">{currentMat.sn}</div>
            ) : (
              <div className="text-gray-400">该槁位暂无物料记录</div>
            )}
          </div>
        )}

        {selectedSlot && currentMat && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">新物料 *</label>
              <select
                className={inputClass}
                required
                value={selectedNewMaterialId}
                onChange={(e) => setSelectedNewMaterialId(e.target.value)}
              >
                <option value="">-- 选择待装配物料 --</option>
                {availableMaterials.map((m) => (
                  <option key={m.id} value={m.id}>{m.sn}（{m.model}）</option>
                ))}
              </select>
              {availableMaterials.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">暂无可用的 {moduleTypeForSlot?.category} 类型待装配物料</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">旧物料处置</label>
              <select className={inputClass} value={disposition} onChange={(e) => setDisposition(e.target.value)}>
                <option>报废</option>
                <option>返厂维修</option>
                <option>库存备用</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">换件备注</label>
              <input type="text" className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="可选" />
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button
            type="submit"
            disabled={!selectedSlot || !currentMat || !selectedNewMaterialId}
            className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800 disabled:opacity-40"
          >
            保存换件
          </button>
        </div>
      </form>
    </Modal>
  );
}

function WorkOrderDetailPanel({ wo, state, dispatch, canDo, currentUser }) {
  const [showStartForm, setShowStartForm] = useState(false);
  const [startAssignee, setStartAssignee] = useState(wo.assignedTo || currentUser);
  const [showRecheckSubmitForm, setShowRecheckSubmitForm] = useState(false);
  const [recheckOperator, setRecheckOperator] = useState(wo.recheckOperator || currentUser);
  const [recheckResult, setRecheckResult] = useState('合格');
  const [recheckNotes, setRecheckNotes] = useState('');
  const [showReplacementModal, setShowReplacementModal] = useState(false);

  const { projects, materials, moduleTypes, devices, deviceTypes } = state;

  const now = () => new Date().toISOString().slice(0, 16).replace('T', ' ');

  const getProjectName = (id) => projects.find((p) => p.id === id)?.name || '—';
  const getMaterialSN = (id) => materials.find((m) => m.id === id)?.sn || id;
  const getModuleName = (id) => moduleTypes.find((m) => m.id === id)?.name || id;

  const device = devices.find((d) => d.id === wo.deviceId);
  const deviceType = device ? deviceTypes.find((dt) => dt.id === device.deviceTypeId) : null;

  const handleStartWork = () => {
    dispatch({ type: 'UPDATE_WORK_ORDER', payload: { id: wo.id, status: '处理中', assignedTo: startAssignee, updatedAt: now() } });
    setShowStartForm(false);
  };

  const handleSubmitRecheck = () => {
    dispatch({ type: 'UPDATE_WORK_ORDER', payload: { id: wo.id, status: '复检中', recheckOperator, updatedAt: now() } });
    setShowRecheckSubmitForm(false);
  };

  const handleCloseRecheck = () => {
    const t = now();
    dispatch({ type: 'UPDATE_WORK_ORDER', payload: { id: wo.id, status: '已关闭', recheckResult, recheckNotes, closedAt: t, updatedAt: t } });
  };

  const dispositionToStatus = (d) => {
    if (d === '报废') return '已报废';
    if (d === '返厂维修') return '返修中';
    return '待装配';
  };

  const handleSaveReplacement = ({ slot, removedMaterialId, addedMaterialId, disposition, notes, operator, operatedAt }) => {
    const t = now();
    const newEntry = {
      id: `RM-${Date.now()}`,
      slotName: slot.slotName,
      moduleTypeId: slot.moduleTypeId,
      removedMaterialId,
      addedMaterialId,
      disposition,
      operator,
      operatedAt,
      notes,
    };
    dispatch({ type: 'UPDATE_WORK_ORDER', payload: { id: wo.id, replacedModules: [...(wo.replacedModules || []), newEntry], updatedAt: t } });
    dispatch({ type: 'UPDATE_MATERIAL', payload: { id: removedMaterialId, status: dispositionToStatus(disposition) } });
    dispatch({ type: 'UPDATE_MATERIAL', payload: { id: addedMaterialId, status: '已占用' } });
    if (device) {
      const newUsedMaterials = (device.usedMaterials || []).map((um) =>
        um.moduleTypeId === slot.moduleTypeId && um.materialId === removedMaterialId
          ? { ...um, materialId: addedMaterialId }
          : um
      );
      dispatch({ type: 'UPDATE_DEVICE', payload: { id: device.id, usedMaterials: newUsedMaterials, updatedAt: t } });
    }
  };

  const inputClass = 'border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-slate-500';

  return (
    <div className="px-8 py-4 space-y-4">
      {/* Basic info */}
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
        <div className="text-sm flex items-center gap-2">
          <span className="text-gray-500">复检结果：</span>
          <StatusBadge status={wo.recheckResult} />
          {wo.recheckNotes && <span className="text-gray-500 text-xs">（{wo.recheckNotes}）</span>}
        </div>
      )}
      {wo.recheckOperator && wo.status !== '已关闭' && (
        <div className="text-sm"><span className="text-gray-500">复检人：</span><span className="text-gray-700">{wo.recheckOperator}</span></div>
      )}

      {/* Replacement records */}
      {wo.replacedModules && wo.replacedModules.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-600 mb-2">换件记录</div>
          <table className="w-full text-xs border border-gray-200 rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-1.5 text-left">槁位</th>
                <th className="px-3 py-1.5 text-left">模块类型</th>
                <th className="px-3 py-1.5 text-left">拆除物料SN</th>
                <th className="px-3 py-1.5 text-left">安装物料SN</th>
                <th className="px-3 py-1.5 text-left">处置</th>
                <th className="px-3 py-1.5 text-left">操作人</th>
                <th className="px-3 py-1.5 text-left">时间</th>
              </tr>
            </thead>
            <tbody>
              {wo.replacedModules.map((rm, i) => (
                <tr key={rm.id || i} className="border-t border-gray-100">
                  <td className="px-3 py-1.5 text-gray-600">{rm.slotName || '—'}</td>
                  <td className="px-3 py-1.5">{getModuleName(rm.moduleTypeId)}</td>
                  <td className="px-3 py-1.5 font-mono">{getMaterialSN(rm.removedMaterialId)}</td>
                  <td className="px-3 py-1.5 font-mono">{getMaterialSN(rm.addedMaterialId)}</td>
                  <td className="px-3 py-1.5 text-gray-500">{rm.disposition || '—'}</td>
                  <td className="px-3 py-1.5 text-gray-500">{rm.operator || '—'}</td>
                  <td className="px-3 py-1.5 text-gray-400">{rm.operatedAt || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Status-driven actions */}
      {wo.status === '待处理' && canDo('start_work_order') && (
        <div className="border-t border-gray-100 pt-3">
          {!showStartForm ? (
            <button
              onClick={() => setShowStartForm(true)}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              开始处理
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">处理人：</span>
              <select
                className={inputClass}
                value={startAssignee}
                onChange={(e) => setStartAssignee(e.target.value)}
              >
                {FEISHU_USERS.map((u) => (
                  <option key={u.id} value={u.name}>{u.name}（{u.role}）</option>
                ))}
              </select>
              <button onClick={handleStartWork} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">确认开始</button>
              <button onClick={() => setShowStartForm(false)} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
            </div>
          )}
        </div>
      )}

      {wo.status === '处理中' && (
        <div className="border-t border-gray-100 pt-3 flex flex-wrap gap-2 items-start">
          {canDo('add_module_replacement') && (
            <button
              onClick={() => setShowReplacementModal(true)}
              className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded hover:bg-amber-700"
            >
              + 记录换件
            </button>
          )}
          {canDo('submit_recheck') && (
            <>
              {!showRecheckSubmitForm ? (
                <button
                  onClick={() => setShowRecheckSubmitForm(true)}
                  className="px-3 py-1.5 text-sm bg-violet-600 text-white rounded hover:bg-violet-700"
                >
                  提交复检
                </button>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-600">复检人：</span>
                  <select
                    className={inputClass}
                    value={recheckOperator}
                    onChange={(e) => setRecheckOperator(e.target.value)}
                  >
                    {FEISHU_USERS.map((u) => (
                      <option key={u.id} value={u.name}>{u.name}（{u.role}）</option>
                    ))}
                  </select>
                  <button onClick={handleSubmitRecheck} className="px-3 py-1.5 text-sm bg-violet-600 text-white rounded hover:bg-violet-700">确认提交</button>
                  <button onClick={() => setShowRecheckSubmitForm(false)} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {wo.status === '复检中' && canDo('do_recheck') && (
        <div className="border-t border-gray-100 pt-3 space-y-2">
          <div className="text-sm font-medium text-gray-700">复检结论</div>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              className={inputClass}
              value={recheckResult}
              onChange={(e) => setRecheckResult(e.target.value)}
            >
              <option value="合格">合格</option>
              <option value="不合格">不合格</option>
            </select>
            <input
              type="text"
              className={`${inputClass} w-48`}
              placeholder="复检备注（可选）"
              value={recheckNotes}
              onChange={(e) => setRecheckNotes(e.target.value)}
            />
            <button onClick={handleCloseRecheck} className="px-3 py-1.5 text-sm bg-gray-700 text-white rounded hover:bg-gray-800">
              关闭工单
            </button>
          </div>
        </div>
      )}

      {showReplacementModal && (
        <AddReplacementModal
          isOpen={showReplacementModal}
          onClose={() => setShowReplacementModal(false)}
          wo={wo}
          device={device}
          deviceType={deviceType}
          materials={materials}
          moduleTypes={moduleTypes}
          currentUser={currentUser}
          onSave={handleSaveReplacement}
        />
      )}
    </div>
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

  const { workOrders, devices, projects } = state;

  const onlineDevices = devices.filter((d) => d.status === '在线运营');
  const getProjectName = (id) => projects.find((p) => p.id === id)?.name || '—';

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
        recheckNotes: '',
        recheckOperator: null,
        notes: '',
      },
    });
  };

  const statusCounts = { '待处理': 0, '处理中': 0, '复检中': 0, '已关闭': 0 };
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
        {['全部', '待处理', '处理中', '复检中', '已关闭'].map((s) => (
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
              {['工单号', '设备SN', '故障描述', '严重程度', '状态', '处理人', '创建时间'].map((h) => (
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
                  </tr>
                  {isExpanded && (
                    <tr key={`${wo.id}-expand`}>
                      <td colSpan={7} className="bg-slate-50 border-b border-slate-200 px-0 py-0">
                        <WorkOrderDetailPanel
                          wo={wo}
                          state={state}
                          dispatch={dispatch}
                          canDo={canDo}
                          currentUser={state.currentUser}
                        />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无工单</td></tr>
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
