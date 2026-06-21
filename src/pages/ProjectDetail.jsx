import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';

export default function ProjectDetail() {
  const { id } = useParams();
  const { state } = useApp();
  const { projects, deviceAllocations, devices, deliveryRecords, deviceTypes } = state;

  const project = projects.find((p) => p.id === id);
  if (!project) {
    return (
      <div className="p-6">
        <div className="text-gray-400">项目不存在</div>
      </div>
    );
  }

  // Get allocated device IDs for this project (deduplicated — latest allocation)
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

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/projects" className="hover:text-slate-700 hover:underline">项目列表</Link>
        <span>›</span>
        <span className="text-gray-800 font-medium">{project.name}</span>
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

      {/* Allocated Devices */}
      <div className="bg-white rounded shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-700">已分配设备（{allocatedDevices.length}台）</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['设备SN', '整机类型', '当前状态', '分配时间', '操作'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {allocatedDevices.map((d) => {
              const alloc = allocations.find((a) => a.deviceId === d.id);
              return (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-800 font-medium">{d.sn}</td>
                  <td className="px-4 py-2.5 text-gray-600">{getTypeName(d.deviceTypeId)}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">{alloc?.allocatedAt || '—'}</td>
                  <td className="px-4 py-2.5">
                    <Link to={`/devices/${d.id}`} className="text-slate-600 hover:underline text-xs">查看详情</Link>
                  </td>
                </tr>
              );
            })}
            {allocatedDevices.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">暂无已分配设备</td></tr>
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
    </div>
  );
}
