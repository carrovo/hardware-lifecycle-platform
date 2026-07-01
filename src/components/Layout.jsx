import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useRole } from '../context/RoleContext';
import { FEISHU_USERS, ROLES_LIST } from '../data/mockData';

// 一级导航 + 可展开的二级菜单。二级菜单通过 ?tab= 深链到既有页面。
const NAV_ITEMS = [
  { label: '首页', path: '/home' },
  {
    label: '看板中心', base: '/dashboard',
    children: [
      { label: '运营看板', to: '/dashboard?tab=operation', tab: 'operation' },
      { label: '质量看板', to: '/dashboard?tab=quality', tab: 'quality' },
    ],
  },
  {
    label: '项目中心', base: '/projects', match: ['/projects', '/production-plans', '/delivery-plans'],
    children: [
      { label: '项目列表', to: '/projects?tab=list', tab: 'list' },
      { label: '生产计划', to: '/projects?tab=production', tab: 'production' },
      { label: '交付计划', to: '/projects?tab=delivery', tab: 'delivery' },
    ],
  },
  {
    label: '资产管理', base: '/assets', match: ['/assets', '/devices'],
    children: [
      { label: '设备台账', to: '/assets?tab=devices', tab: 'devices' },
      { label: '模块与来料', to: '/assets?tab=materials', tab: 'materials' },
      { label: '设备类型', to: '/assets?tab=types', tab: 'types' },
      { label: '点位管理', to: '/assets?tab=locations', tab: 'locations' },
    ],
  },
  {
    label: '售后管理', base: '/after-sales',
    children: [
      { label: '工单中心', to: '/after-sales?tab=orders', tab: 'orders' },
      { label: '质量问题台账', to: '/after-sales?tab=quality', tab: 'quality' },
    ],
  },
  {
    label: '系统管理', base: '/system',
    children: [
      { label: '用户与角色', to: '/system?tab=roles', tab: 'roles' },
      { label: '权限配置', to: '/system?tab=permissions', tab: 'permissions' },
      { label: '标签配置', to: '/system?tab=labels', tab: 'labels' },
      { label: '工站配置', to: '/system?tab=stations', tab: 'stations' },
      { label: '通知配置', to: '/system?tab=notifications', tab: 'notifications' },
      { label: '操作日志', to: '/system?tab=logs', tab: 'logs' },
    ],
  },
];

const ROLE_COLORS = {
  '管理员': 'bg-purple-600',
  '厂长': 'bg-blue-600',
  '质检员': 'bg-green-600',
  '装配工': 'bg-amber-600',
  '测试员': 'bg-cyan-600',
  '运维工程师': 'bg-teal-600',
  '项目负责人': 'bg-indigo-600',
  '维修工程师': 'bg-red-600',
};

function isGroupActive(item, pathname) {
  if (item.path) return pathname === item.path || pathname.startsWith(`${item.path}/`);
  const bases = item.match || [item.base];
  return bases.some((b) => pathname === b || pathname.startsWith(`${b}/`));
}

export default function Layout({ children }) {
  const { state, dispatch } = useApp();
  const { currentRole, setCurrentRole, canSeeNav } = useRole();
  const location = useLocation();
  const activeTab = new URLSearchParams(location.search).get('tab');

  const currentUser = FEISHU_USERS.find((u) => u.id === (state.currentUserId || 'u1')) || FEISHU_USERS[0];
  const roleColor = ROLE_COLORS[currentRole] || 'bg-slate-600';

  const visibleItems = NAV_ITEMS.filter((item) => canSeeNav(item.path || item.base));

  // 手动展开/收起状态；当前所在的一级菜单默认保持展开。
  const [manualOpen, setManualOpen] = useState({});
  const toggleGroup = (label) => setManualOpen((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <div className="flex min-h-screen w-full bg-gray-100">
      {/* Sidebar */}
      <aside className="w-52 bg-slate-800 flex flex-col fixed top-0 left-0 h-full z-40">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-slate-700">
          <div className="text-white font-bold text-sm leading-tight">设备全生命周期</div>
          <div className="text-slate-400 text-xs mt-0.5">质量管理平台</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {visibleItems.map((item) => {
            if (item.path) {
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-slate-700 text-white font-medium'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`
                  }
                >
                  <span>{item.label}</span>
                </NavLink>
              );
            }
            const groupActive = isGroupActive(item, location.pathname);
            const expanded = manualOpen[item.label] ?? groupActive;
            const onBase = location.pathname === item.base;
            const defaultTab = item.children[0]?.tab;
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleGroup(item.label)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                    groupActive ? 'text-white font-medium' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className={`text-xs text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`}>›</span>
                </button>
                {expanded && (
                  <div className="pb-1">
                    {item.children.map((child) => {
                      const childActive = onBase && (activeTab ? activeTab === child.tab : child.tab === defaultTab);
                      return (
                        <Link
                          key={child.to}
                          to={child.to}
                          className={`flex items-center gap-2 pl-9 pr-4 py-2 text-xs transition-colors ${
                            childActive
                              ? 'bg-slate-700 text-white font-medium border-l-2 border-blue-400'
                              : 'text-slate-400 hover:bg-slate-700/60 hover:text-white border-l-2 border-transparent'
                          }`}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
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
