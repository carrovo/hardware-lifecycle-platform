import { useState } from 'react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

function AssemblyModal({ isOpen, onClose, onSubmit, deviceTypes, moduleTypes, materials, currentUser }) {
  const [step, setStep] = useState(1);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [selectedModules, setSelectedModules] = useState({}); // moduleTypeId -> materialId
  const [assembler, setAssembler] = useState(currentUser);
  const [assemblyTime, setAssemblyTime] = useState(
    new Date().toISOString().slice(0, 16).replace('T', ' ')
  );
  const [photoName, setPhotoName] = useState('');

  const selectedType = deviceTypes.find((dt) => dt.id === selectedTypeId);

  const getAvailableMaterials = (moduleTypeId) => {
    const mt = moduleTypes.find((m) => m.id === moduleTypeId);
    if (!mt) return [];
    return materials.filter(
      (mat) => mat.category === mt.category && mat.status === '待装配'
    );
  };

  const handleSelectModule = (moduleTypeId, materialId) => {
    setSelectedModules((prev) => ({ ...prev, [moduleTypeId]: materialId }));
  };

  const canProceedStep2 = () => {
    if (!selectedType) return false;
    return selectedType.requiredModules.every((rm) => {
      const avail = getAvailableMaterials(rm.moduleTypeId);
      return avail.length > 0;
    });
  };

  const canSubmit = () => {
    if (!selectedType || !assembler || !assemblyTime) return false;
    return selectedType.requiredModules.every((rm) => selectedModules[rm.moduleTypeId]);
  };

  const handleClose = () => {
    setStep(1);
    setSelectedTypeId('');
    setSelectedModules({});
    setAssembler(currentUser);
    setPhotoName('');
    onClose();
  };

  const handleSubmit = () => {
    if (!canSubmit()) return;
    const usedMaterials = selectedType.requiredModules.map((rm) => ({
      materialId: selectedModules[rm.moduleTypeId],
      moduleTypeId: rm.moduleTypeId,
    }));
    onSubmit({
      deviceTypeId: selectedTypeId,
      usedMaterials,
      assembler,
      assemblyTime,
      photoName,
    });
    handleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="新建装配" size="lg">
      {/* Step indicators */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-1">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                step === s ? 'bg-slate-700 text-white' : step > s ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step > s ? '✓' : s}
            </div>
            <span className={`text-xs ${step === s ? 'text-slate-700 font-medium' : 'text-gray-400'}`}>
              {s === 1 ? '选择整机类型' : s === 2 ? '选择模组物料' : '填写装配信息'}
            </span>
            {s < 3 && <span className="text-gray-300 mx-1">›</span>}
          </div>
        ))}
      </div>

      {/* Step 1: Select device type */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-3">请选择要装配的整机类型：</p>
          {deviceTypes.map((dt) => (
            <label
              key={dt.id}
              className={`flex items-start gap-3 p-3 border-2 rounded cursor-pointer transition-colors ${
                selectedTypeId === dt.id ? 'border-slate-600 bg-slate-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="deviceType"
                value={dt.id}
                checked={selectedTypeId === dt.id}
                onChange={() => setSelectedTypeId(dt.id)}
                className="mt-0.5"
              />
              <div>
                <div className="font-medium text-gray-800">{dt.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {dt.requiredModules.map((rm) => {
                    const mt = moduleTypes.find((m) => m.id === rm.moduleTypeId);
                    return `${mt?.name || rm.moduleTypeId} × ${rm.quantity}`;
                  }).join(' / ')}
                </div>
              </div>
            </label>
          ))}
          <div className="flex justify-end pt-4">
            <button
              onClick={() => { if (selectedTypeId) setStep(2); }}
              disabled={!selectedTypeId}
              className="px-4 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              下一步
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Select materials */}
      {step === 2 && selectedType && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-2">为每个模组选择可用物料（状态=待装配）：</p>
          {selectedType.requiredModules.map((rm) => {
            const mt = moduleTypes.find((m) => m.id === rm.moduleTypeId);
            const avail = getAvailableMaterials(rm.moduleTypeId);
            return (
              <div key={rm.moduleTypeId} className="border border-gray-200 rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-800">{mt?.name}</span>
                  <span className="text-xs text-gray-500">({mt?.category}) × {rm.quantity}</span>
                  {avail.length === 0 && (
                    <span className="text-xs text-red-500 ml-auto">无可用物料</span>
                  )}
                </div>
                {avail.length > 0 ? (
                  <select
                    value={selectedModules[rm.moduleTypeId] || ''}
                    onChange={(e) => handleSelectModule(rm.moduleTypeId, e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none"
                  >
                    <option value="">-- 请选择 --</option>
                    {avail.map((mat) => (
                      <option key={mat.id} value={mat.id}>
                        {mat.sn} | {mat.model} | 批次:{mat.batchNo}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-red-400">无可用「{mt?.category}」类物料，请先进行来料检验</div>
                )}
              </div>
            );
          })}
          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              上一步
            </button>
            <button
              onClick={() => { if (canProceedStep2()) setStep(3); }}
              disabled={!selectedType.requiredModules.every((rm) => selectedModules[rm.moduleTypeId])}
              className="px-4 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              下一步
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Assembly info */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">装配人</label>
            <input
              type="text"
              value={assembler}
              onChange={(e) => setAssembler(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">装配时间</label>
            <input
              type="text"
              value={assemblyTime}
              onChange={(e) => setAssemblyTime(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">现场照片（文件名）</label>
            <input
              type="text"
              value={photoName}
              onChange={(e) => setPhotoName(e.target.value)}
              placeholder="e.g. assembly_photo.jpg"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500"
            />
          </div>

          <div className="bg-gray-50 rounded p-3 text-sm text-gray-500">
            <div className="font-medium text-gray-700 mb-1">装配信息确认</div>
            <div>整机类型：{selectedType?.name}</div>
            <div>所用物料：{selectedType?.requiredModules.length} 种模组</div>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              上一步
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit()}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-40"
            >
              提交装配
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function Assembly() {
  const { state, dispatch } = useApp();
  const [showModal, setShowModal] = useState(false);

  const assembledDevices = state.devices.filter((d) =>
    ['装配中', '功能测试中', '老化测试中', '终测中', '待分配项目', '已激活', '返修中'].includes(d.status)
  );

  const getDeviceTypeName = (id) =>
    state.deviceTypes.find((dt) => dt.id === id)?.name || id;

  const handleAssembly = (form) => {
    const now = form.assemblyTime;
    const devId = `DEV-${Date.now()}`;
    const devSN = `SN-DEV-${String(state.devices.length + 1).padStart(3, '0')}`;

    // Create device
    dispatch({
      type: 'ADD_DEVICE',
      payload: {
        id: devId,
        sn: devSN,
        deviceTypeId: form.deviceTypeId,
        status: '功能测试中',
        assembler: form.assembler,
        assemblyTime: now,
        photoName: form.photoName,
        usedMaterials: form.usedMaterials,
        createdAt: now,
        updatedAt: now,
      },
    });

    // Mark materials as occupied
    form.usedMaterials.forEach(({ materialId }) => {
      dispatch({
        type: 'UPDATE_MATERIAL',
        payload: { id: materialId, status: '已占用' },
      });
    });

    // Add operation log
    dispatch({
      type: 'ADD_OPERATION_LOG',
      payload: {
        id: `LOG-${Date.now()}`,
        deviceId: devId,
        operator: form.assembler,
        timestamp: now,
        actionType: '装配',
        fromStatus: null,
        toStatus: '功能测试中',
        notes: '整机装配完成，进入功能测试',
      },
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">整机装配</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-800"
        >
          + 新建装配
        </button>
      </div>

      <div className="bg-white rounded shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['ID', '设备SN', '整机类型', '装配状态', '装配人', '装配时间', '照片'].map((h) => (
                <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {assembledDevices.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-400 font-mono text-xs">{d.id}</td>
                <td className="px-4 py-2 font-medium text-gray-800">{d.sn}</td>
                <td className="px-4 py-2 text-gray-600">{getDeviceTypeName(d.deviceTypeId)}</td>
                <td className="px-4 py-2"><StatusBadge status={d.status} /></td>
                <td className="px-4 py-2 text-gray-600">{d.assembler}</td>
                <td className="px-4 py-2 text-gray-500 text-xs">{d.assemblyTime}</td>
                <td className="px-4 py-2 text-gray-400 text-xs">{d.photoName || '—'}</td>
              </tr>
            ))}
            {assembledDevices.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无装配记录</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AssemblyModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleAssembly}
        deviceTypes={state.deviceTypes}
        moduleTypes={state.moduleTypes}
        materials={state.materials}
        currentUser={state.currentUser}
      />
    </div>
  );
}
