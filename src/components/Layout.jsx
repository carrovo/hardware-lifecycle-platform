import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { USERS } from '../data/mockData';

const navGroups = [
  {
    label: '生产制造',
    items: [
      { label: '生产看板', path: '/dashboard', icon: '📊' },
      { label: '设备列表', path: '/devices', icon: '💻' },
      { label: '来料检验', path: '/materials', icon: '📦' },
      { label: '整机装配', path: '/assembly', icon: '⚙️' },
      { label: '测试中心', path: '/tests', icon: '🔬' },
      { label: '生产计划', path: '/production-plan', icon: '📅' },
      { label: '设备类型', path: '/device-types', icon: '🔧' },
    ],
  },
  {
    label: '项目交付',
    items: [
      { label: '项目列表', path: '/projects', icon: '🗂️' },
      { label: '设备分配', path: '/device-allocation', icon: '📋' },
      { label: '交付流程', path: '/delivery', icon: '🚚' },
    ],
  },
  {
    label: '长期维护',
    items: [
      { label: '在线运营', path: '/operations', icon: '🟢' },
      { label: '告警中心', path: '/alerts', icon: '🔔' },
      { label: '维修工单', path: '/work-orders', icon: '🛠️' },
      { label: '退役管理', path: '/retirement', icon: '🗃️' },
    ],
  },
];

export default function Layout({ children }) {
  const { state, dispatch } = useApp();

  return (
    <div className="flex min-h-screen w-full bg-gray-100">
      {/* Sidebar */}
      <aside className="w-48 bg-slate-800 flex flex-col fixed top-0 left-0 h-full z-40">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-slate-700">
          <div className="text-white font-bold text-sm leading-tight">
            硬件全生命周期
          </div>
          <div className="text-slate-400 text-xs mt-0.5">管理平台</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-2">
              <div className="px-4 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {group.label}
              </div>
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-slate-700 text-white font-medium'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`
                  }
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Feishu indicator */}
        <div className="px-4 py-2 border-t border-slate-700">
          <div className="flex items-center gap-1.5 text-xs text-slate-400" title="关键节点状态变化将同步通知至飞书">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0"></span>
            <span>飞书通知已集成</span>
          </div>
        </div>

        {/* User Selector */}
        <div className="px-4 py-3 border-t border-slate-700">
          <div className="text-xs text-slate-400 mb-1">当前操作人</div>
          <select
            value={state.currentUser}
            onChange={(e) => dispatch({ type: 'SET_CURRENT_USER', payload: e.target.value })}
            className="w-full bg-slate-700 text-white text-sm rounded px-2 py-1.5 border border-slate-600 focus:outline-none focus:border-slate-400"
          >
            {USERS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 ml-48 min-h-screen">
        {children}
      </main>
    </div>
  );
}
