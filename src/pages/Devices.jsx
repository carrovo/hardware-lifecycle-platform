import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';

const KANBAN_COLS = [
  { key: '装配中',    label: '装配中',   color: 'border-blue-400',   bg: 'bg-blue-50',   badge: 'bg-blue-400' },
  { key: '功能测试中', label: '功能测试', color: 'border-violet-400', bg: 'bg-violet-50', badge: 'bg-violet-400' },
  { key: '老化测试中', label: '老化测试', color: 'border-amber-400',  bg: 'bg-amber-50',  badge: 'bg-amber-400' },
  { key: '终测中',    label: '终测',     color: 'border-orange-400', bg: 'bg-orange-50', badge: 'bg-orange-400' },
  { key: '待分配项目', label: '待分配',   color: 'border-green-400',  bg: 'bg-green-50',  badge: 'bg-green-400' },
];

const ALL_STATUSES = ['全部', '装配中', '整机装配', '功能测试中', '老化测试中', '终测中', '待分配项目', '返修中', '已激活'];

const NOW_DATE = new Date('2024-01-22');
function daysSince(dateStr) {
  if (!dateStr) return 0;
  const d = new Date(dateStr.replace(' ', 'T'));
  return Math.floor((NOW_DATE - d) / 86400000);
}

function DeviceCard({ device, typeName }) {
  const days = daysSince(device.assemblyTime || device.updatedAt);
  const isStuck = days > 2;
  return (
    <Link to={`/devices/${device.id}`}>
      <div className={`bg-white rounded-lg shadow-sm p-3 mb-2 border-l-4 cursor-pointer hover:shadow-md transition-shadow relative ${
        isStuck ? 'border-orange-400' : 'border-gray-200'
      }`}>
        {isStuck && <span className="absolute top-2 right-2 text-amber-500 text-xs font-bold">⚠</span>}
        <div className="font-mono text-xs font-semibold text-gray-800 pr-5">{device.sn}</div>
        <div className="text-xs text-gray-500 mt-0.5">{typeName}</div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">{device.assembler}</span>
          <span className={`text-xs ${isStuck ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
            {days > 0 ? `${days}天前` : '今天'}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function Devices() {
  const { state } = useApp();
  const [view, setView] = useState('kanban');
  const [filterStatus, setFilterStatus] = useState('全部');

  const { devices, deviceTypes } = state;
  const getTypeName = (id) => deviceTypes.find((dt) => dt.id === id)?.name || id;

  const total = devices.length;
  const inProgress = devices.filter((d) =>
    ['装配中', '整机装配', '功能测试中', '老化测试中', '终测中', '返修中'].includes(d.status)
  ).length;
  const activated = devices.filter((d) => d.status === '已激活').length;
  const readyToAssign = devices.filter((d) => d.status === '待分配项目').length;

  const grouped = {};
  KANBAN_COLS.forEach((c) => { grouped[c.key] = []; });
  devices.forEach((d) => { if (grouped[d.status] !== undefined) grouped[d.status].push(d); });

  const filtered = devices.filter((d) => filterStatus === '全部' || d.status === filterStatus);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">设备列表</h1>
        <div className="flex border border-gray-200 rounded overflow-hidden text-sm">
          <button onClick={() => setView('kanban')}
            className={`px-3 py-1.5 ${view === 'kanban' ? 'bg-slate-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            看板
          </button>
          <button onClick={() => setView('list')}
            className={`px-3 py-1.5 ${view === 'list' ? 'bg-slate-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            列表
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '设备总数',  value: total,          color: 'border-slate-500' },
          { label: '在制/进行中', value: inProgress,   color: 'border-blue-500' },
          { label: '已激活',    value: activated,       color: 'border-green-500' },
          { label: '待分配项目', value: readyToAssign,  color: 'border-emerald-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`bg-gray-50 border border-gray-100 rounded-xl p-4 border-l-4 ${color}`}>
            <div className="text-3xl font-semibold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {view === 'kanban' ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {KANBAN_COLS.map((col) => (
            <div key={col.key} className="flex-1 min-w-[160px]">
              <div className={`border-t-2 ${col.color} ${col.bg} rounded-t px-3 py-2 flex items-center justify-between mb-2`}>
                <span className="text-xs font-semibold text-gray-700">{col.label}</span>
                <span className={`${col.badge} text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center`}>
                  {grouped[col.key].length}
                </span>
              </div>
              <div>
                {grouped[col.key].map((d) => (
                  <DeviceCard key={d.id} device={d} typeName={getTypeName(d.deviceTypeId)} />
                ))}
                {grouped[col.key].length === 0 && (
                  <div className="text-center text-gray-300 text-xs py-6 border-2 border-dashed border-gray-100 rounded-lg">暂无</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="bg-white rounded shadow-sm px-4 py-3 mb-4 flex items-center gap-3 flex-wrap">
            <label className="text-sm text-gray-600">状态筛选</label>
            <div className="flex gap-1 flex-wrap">
              {ALL_STATUSES.map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    filterStatus === s ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-gray-600 border-gray-300 hover:border-slate-400'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
            <span className="text-sm text-gray-400 ml-auto">共 {filtered.length} 台</span>
          </div>
          <div className="bg-white rounded shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['设备ID', '设备SN', '整机类型', '当前状态', '装配人', '最近更新时间', '操作'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-2 text-gray-400 font-mono text-xs">{d.id}</td>
                    <td className="px-4 py-2 font-medium text-gray-800">{d.sn}</td>
                    <td className="px-4 py-2 text-gray-600">{getTypeName(d.deviceTypeId)}</td>
                    <td className="px-4 py-2"><StatusBadge status={d.status} /></td>
                    <td className="px-4 py-2 text-gray-600">{d.assembler}</td>
                    <td className="px-4 py-2 text-gray-500 text-xs">{d.updatedAt}</td>
                    <td className="px-4 py-2">
                      <Link to={`/devices/${d.id}`} className="text-slate-600 hover:text-slate-800 text-xs hover:underline">
                        查看详情
                      </Link>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
