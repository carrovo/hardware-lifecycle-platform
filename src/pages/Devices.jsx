import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';

const ALL_STATUSES = ['全部', '装配中', '整机装配', '功能测试中', '老化测试中', '终测中', '待分配项目', '返修中', '已激活'];

export default function Devices() {
  const { state } = useApp();
  const [filterStatus, setFilterStatus] = useState('全部');

  const { devices, deviceTypes } = state;

  const filtered = devices.filter((d) =>
    filterStatus === '全部' || d.status === filterStatus
  );

  const getTypeName = (id) => deviceTypes.find((dt) => dt.id === id)?.name || id;

  // Summary counts
  const total = devices.length;
  const notActivated = devices.filter((d) =>
    ['装配中', '整机装配', '功能测试中', '老化测试中', '终测中', '返修中'].includes(d.status)
  ).length;
  const activated = devices.filter((d) => d.status === '已激活').length;
  const readyToAssign = devices.filter((d) => d.status === '待分配项目').length;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-4">设备列表</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '设备总数', value: total, color: 'border-slate-500' },
          { label: '在制/未激活', value: notActivated, color: 'border-blue-500' },
          { label: '已激活', value: activated, color: 'border-green-500' },
          { label: '待分配项目', value: readyToAssign, color: 'border-blue-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`bg-white rounded shadow-sm p-4 border-l-4 ${color}`}>
            <div className="text-2xl font-bold text-gray-800">{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-4 flex items-center gap-3 flex-wrap">
        <label className="text-sm text-gray-600">状态筛选</label>
        <div className="flex gap-1 flex-wrap">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                filterStatus === s
                  ? 'bg-slate-700 text-white border-slate-700'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-slate-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-400 ml-auto">共 {filtered.length} 台</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['设备ID', '设备SN', '整机类型', '当前状态', '装配人', '最近更新时间', '操作'].map((h) => (
                <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-400 font-mono text-xs">{d.id}</td>
                <td className="px-4 py-2 font-medium text-gray-800">{d.sn}</td>
                <td className="px-4 py-2 text-gray-600">{getTypeName(d.deviceTypeId)}</td>
                <td className="px-4 py-2"><StatusBadge status={d.status} /></td>
                <td className="px-4 py-2 text-gray-600">{d.assembler}</td>
                <td className="px-4 py-2 text-gray-500 text-xs">{d.updatedAt}</td>
                <td className="px-4 py-2">
                  <Link
                    to={`/devices/${d.id}`}
                    className="text-slate-600 hover:text-slate-800 text-xs hover:underline"
                  >
                    查看详情
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无数据</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
