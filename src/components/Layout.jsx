import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useRole } from '../context/RoleContext';
import { FEISHU_USERS, ROLES_LIST } from '../data/mockData';

const navGroups = [
  {
    label: '生产制造',
    items: [
      { label: '生产看板', path: '/dashboard' },
      { label: '设备列表', path: '/devices' },
      { label: '来料检验', path: '/materials' },
      { label: '整机装配', path: '/assembly' },
      { label: '测试中心', path: '/tests' },
      { label: '生产计划', path: '/production-plan' },
      { label: '设备类型', path: '/device-types' },
    ],
  },
  {
    label: '项目交付',
    items: [
      { label: '项目列表', path: '/projects' },
      { label: '设备分配', path: '/device-allocation' },
      { label: '交付流程', path: '/delivery' },
    ],
  },
  {
    label: '长期维护',
    items: [
      { label: '在线运营', path: '/operations' },
      { label: '告警中心', path: '/alerts' },
      { label: '维修工单', path: '/work-orders' },
      { label: '退役管理', path: '/retirement' },
    ],
  },
  {
    label: '系统管理',
    items: [
      { label: '用户管理', path: '/users' },
      { label: '角色权限', path: '/roles' },
    ],
  },
];

const ROLE_COLORS = {
  '管理员': 'bg-purple-600',
  '厂长': 'bg-blue-600',
  '质检员': 'bg-green-600',
  '装配工': 'bg-amber-600',
  '测试员': 'bg-cyan-600',
  '运维': 'bg-teal-600',
  '项目负责人': 'bg-indigo-600',
  '现场工程师': 'bg-orange-600',
  '维修工程师': 'bg-red-600',
};

export default function Layout({ children }) {
  const { state, dispatch } = useApp();
  const { currentRole, setCurrentRole, canSeeNav } = useRole();

  const currentUser = FEISHU_USERS.find((u) => u.id === (state.currentUserId || 'u1')) || FEISHU_USERS[0];
  const roleColor = ROLE_COLORS[currentRole] || 'bg-slate-600';

  const visibleGroups = navGroups
    .map((g) => ({ ...g, items: g.items.filter((item) => canSeeNav(item.path)) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="flex min-h-screen w-full bg-gray-100">
      {/* Sidebar */}
      <aside className="w-52 bg-slate-800 flex flex-col fixed top-0 left-0 h-full z-40">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-slate-700">
          <div className="text-white font-bold text-sm leading-tight">硬件全生命周期</div>
          <div className="text-slate-400 text-xs mt-0.5">管理平台</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {visibleGroups.map((group) => (
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
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Feishu indicator */}
        <div className="px-4 py-2 border-t border-slate-700">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0"></span>
            <span>飞书通知已集成</span>
          </div>
        </div>

        {/* Role Switch */}
        <div className="px-4 py-3 border-t border-slate-700">
          <div className="text-xs text-slate-400 mb-1.5">切换身份预览</div>
          <select
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value)}
            className="w-full bg-slate-700 text-white text-xs rounded px-2 py-1.5 border border-slate-600 focus:outline-none focus:border-slate-400 mb-2"
          >
            {ROLES_LIST.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-white text-xs ${roleColor}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-white/60"></span>
            {currentRole}
          </span>
        </div>

        {/* Current User */}
        <div className="px-4 py-3 border-t border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {currentUser.avatar}
            </div>
            <div className="min-w-0">
              <div className="text-white text-xs font-medium truncate">{currentUser.name}</div>
              <div className="text-slate-400 text-xs truncate">{currentUser.dept}</div>
            </div>
          </div>
          <select
            value={state.currentUserId || 'u1'}
            onChange={(e) => dispatch({ type: 'SET_CURRENT_USER', payload: e.target.value })}
            className="w-full bg-slate-700 text-white text-xs rounded px-2 py-1 border border-slate-600 focus:outline-none"
          >
            {FEISHU_USERS.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.dept})</option>
            ))}
          </select>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 ml-52 min-h-screen">
        {children}
      </main>
    </div>
  );
}
