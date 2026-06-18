import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import OperationLog from '../components/OperationLog';

export default function DeviceDetail() {
  const { id } = useParams();
  const { state } = useApp();

  const device = state.devices.find((d) => d.id === id);

  if (!device) {
    return (
      <div className="p-6">
        <Link to="/devices" className="text-slate-600 hover:underline text-sm">← 返回设备列表</Link>
        <div className="mt-8 text-center text-gray-400">设备不存在</div>
      </div>
    );
  }

  const deviceType = state.deviceTypes.find((dt) => dt.id === device.deviceTypeId);
  const testRecords = state.testRecords
    .filter((t) => t.deviceId === id)
    .sort((a, b) => new Date(a.testTime) - new Date(b.testTime));
  const logs = state.operationLogs.filter((l) => l.deviceId === id);

  const getModuleName = (moduleTypeId) =>
    state.moduleTypes.find((m) => m.id === moduleTypeId)?.name || moduleTypeId;

  const getMaterialSN = (materialId) =>
    state.materials.find((m) => m.id === materialId)?.sn || materialId;

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/devices" className="text-slate-600 hover:underline">设备列表</Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-700 font-medium">{device.sn}</span>
      </div>

      {/* Section 1: Basic Info */}
      <div className="bg-white rounded shadow-sm p-5">
        <h2 className="text-base font-semibold text-gray-700 mb-4">基本信息</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">设备SN</div>
            <div className="text-sm font-medium text-gray-800">{device.sn}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">整机类型</div>
            <div className="text-sm font-medium text-gray-800">{deviceType?.name || device.deviceTypeId}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">当前状态</div>
            <StatusBadge status={device.status} size="sm" />
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">创建时间</div>
            <div className="text-sm text-gray-600">{device.createdAt}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">最近更新</div>
            <div className="text-sm text-gray-600">{device.updatedAt}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">装配人</div>
            <div className="text-sm text-gray-600">{device.assembler}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">装配时间</div>
            <div className="text-sm text-gray-600">{device.assemblyTime}</div>
          </div>
          {device.photoName && (
            <div>
              <div className="text-xs text-gray-400 mb-1">现场照片</div>
              <div className="text-sm text-gray-500 font-mono">{device.photoName}</div>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Assembly Record */}
      <div className="bg-white rounded shadow-sm p-5">
        <h2 className="text-base font-semibold text-gray-700 mb-4">装配记录</h2>
        {device.usedMaterials && device.usedMaterials.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['模组类型', '物料SN'].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {device.usedMaterials.map((um, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-700">{getModuleName(um.moduleTypeId)}</td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-500">{getMaterialSN(um.materialId)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-sm text-gray-400">暂无模组物料记录</div>
        )}
      </div>

      {/* Section 3: Test History */}
      <div className="bg-white rounded shadow-sm p-5">
        <h2 className="text-base font-semibold text-gray-700 mb-4">测试历史</h2>
        {testRecords.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['测试类型', '结果', '测试员', '测试时间', '报告文件', '备注'].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {testRecords.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-700">{t.testType}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={t.result === '合格' ? '合格' : '不合格'} />
                  </td>
                  <td className="px-4 py-2 text-gray-600">{t.operator}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs whitespace-nowrap">{t.testTime}</td>
                  <td className="px-4 py-2 text-gray-400 text-xs font-mono">{t.reportFile || '—'}</td>
                  <td className="px-4 py-2 text-gray-400 text-xs">{t.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-sm text-gray-400">暂无测试记录</div>
        )}
      </div>

      {/* Section 4: Operation Log */}
      <div className="bg-white rounded shadow-sm p-5">
        <h2 className="text-base font-semibold text-gray-700 mb-4">操作日志 / 状态变更记录</h2>
        <OperationLog logs={logs} />
      </div>
    </div>
  );
}
