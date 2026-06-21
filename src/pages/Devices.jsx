import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';

const STATUS_CHIPS = [
  { key: '全部',      color: 'bg-gray-100 text-gray-700 border-gray-300' },
  { key: '装配中',    color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { key: '整机装配',  color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { key: '功能测试中', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { key: '老化测试中', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { key: '终测中',    color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { key: '待分配项目', color: 'bg-green-100 text-green-700 border-green-300' },
  { key: '已分配项目', color: 'bg-teal-100 text-teal-700 border-teal-300' },
  { key: '在线运营',  color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { key: '退役',     color: 'bg-gray-200 text-gray-500 border-gray-300' },
  { key: '返修中',    color: 'bg-red-100 text-red-700 border-red-300' },
];

const NOW_DATE = new Date('2024-01-22');
function daysSince(dateStr) {
  if (!dateStr) return 0;
  const d = new Date(dateStr.replace(' ', 'T'));
  return Math.floor((NOW_DATE - d) / 86400000);
}

export default function Devices() {
  const { state } = useApp();
  const [searchParams] = useSearchParams();
  const [filterStatus, setFilterStatus] = useState('全部');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const s = searchParams.get('status');
    if (s) setFilterStatus(s);
  }, [searchParams]);

  const { devices, deviceTypes } = state;
  const getTypeName = (id) => deviceTypes.find((dt) => dt.id === id)?.name || id;

  const total = devices.length;
  const inProgress = devices.filter((d) =>
    ['装配中', '整机装配', '功能测试中', '老化测试中', '终测中', '返修中'].includes(d.status)
  ).length;
  const online = devices.filter((d) => d.status === '在线运营').length;
  const readyToAssign = devices.filter((d) => d.status === '待分配项目').length;

  const statusCounts = STATUS_CHIPS.slice(1).reduce((acc, c) => {
    acc[c.key] = devices.filter((d) => d.status === c.key).length;
    return acc;
  }, {});

  const filtered = devices.filter((d) => {
    const matchStatus = filterStatus === '全部' || d.status === filterStatus;
    const matchSearch = !search ||
      d.sn.toLowerCase().includes(search.toLowerCase()) ||
      getTypeName(d.deviceTypeId).toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">设备列表</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '设备总数',    value: total,          color: 'border-slate-500' },
          { label: '在制/进行中', value: inProgress,     color: 'border-blue-500' },
          { label: '在线运营',      value: online,         color: 'border-emerald-500' },
          { label: '待分配项目',  value: readyToAssign,  color: 'border-emerald-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`bg-gray-50 border border-gray-100 rounded-xl p-4 border-l-4 ${color}`}>
            <div className="text-3xl font-semibold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter chips + search */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-4 flex flex-wrap gap-2 items-center">
        <button onClick={() => setFilterStatus('全部')}
          className={`px-3 py-1 text-xs rounded-full border font-medium transition-colors ${
            filterStatus === '全部' ? 'bg-slate-700 text-white border-slate-700' : 'bg-gray-100 text-gray-600 border-gray-300 hover:border-slate-400'
          }`}>
          全部 <span className="ml-1">{total}</span>
        </button>
        {STATUS_CHIPS.slice(1).map((c) => (
          statusCounts[c.key] > 0 && (
            <button key={c.key} onClick={() => setFilterStatus(c.key)}
              className={`px-3 py-1 text-xs rounded-full border font-medium transition-colors ${
                filterStatus === c.key
                  ? 'bg-slate-700 text-white border-slate-700'
                  : `${c.color} hover:brightness-95`
              }`}>
              {c.key} <span className="ml-1 font-bold">{statusCounts[c.key]}</span>
            </button>
          )
        ))}
        <div className="ml-auto flex items-center gap-2">
          <input type="text" placeholder="搜索SN / 类型..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none w-44" />
          <span className="text-sm text-gray-400">共 {filtered.length} 台</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['设备SN', '整机类型', '当前状态', '装配人', '最近更新', '在此状态天数', '操作'].map((h) => (
                <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((d) => {
              const days = daysSince(d.updatedAt || d.assemblyTime);
              const isStuck = days > 2 && ['功能测试中', '老化测试中', '终测中', '装配中'].includes(d.status);
              return (
                <tr key={d.id} className={`transition-colors hover:bg-blue-50 ${isStuck ? 'bg-amber-50' : ''}`}>
                  <td className="px-4 py-2 font-medium text-gray-800 font-mono text-xs">{d.sn}</td>
                  <td className="px-4 py-2 text-gray-600">{getTypeName(d.deviceTypeId)}</td>
                  <td className="px-4 py-2"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-2 text-gray-600">{d.assembler}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs">{d.updatedAt}</td>
                  <td className="px-4 py-2">
                    {days > 0 ? (
                      <span className={`text-xs font-medium ${isStuck ? 'text-amber-600' : 'text-gray-500'}`}>
                        {isStuck && '⚠ '}{days}天
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">今天</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <Link to={`/devices/${d.id}`} className="text-slate-600 hover:text-slate-800 text-xs hover:underline">
                      查看详情
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
