import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useRole } from '../context/RoleContext';
import { FEISHU_USERS } from '../data/mockData';
import Modal from './Modal';

// 一级导航 + 可展开的二级菜单。二级菜单通过 ?tab= 深链到既有页面。
const NAV_ITEMS = [
  { label: '首页', path: '/home', icon: '🏠' },
  {
    label: '看板中心', base: '/dashboard', icon: '📊',
    children: [
      { label: '运营看板', to: '/dashboard?tab=operation', tab: 'operation' },
      { label: '质量看板', to: '/dashboard?tab=quality', tab: 'quality' },
    ],
  },
  {
    label: '项目中心', base: '/projects', icon: '📁', match: ['/projects', '/production-plans', '/delivery-plans'],
    children: [
      { label: '项目列表', to: '/projects?tab=list', tab: 'list' },
      { label: '生产计划', to: '/projects?tab=production', tab: 'production' },
      { label: '交付计划', to: '/projects?tab=delivery', tab: 'delivery' },
    ],
  },
  {
    label: '资产管理', base: '/assets', icon: '📦', match: ['/assets', '/devices'],
    children: [
      { label: '设备列表', to: '/assets?tab=devices', tab: 'devices' },
      { label: '设备类型', to: '/assets?tab=types', tab: 'types' },
      { label: '模块来料', to: '/assets?tab=materials', tab: 'materials' },
      { label: '点位管理', to: '/assets?tab=locations', tab: 'locations' },
    ],
  },
  {
    label: '售后管理', base: '/after-sales', icon: '🛠',
    children: [
      { label: '工单中心', to: '/after-sales?tab=orders', tab: 'orders' },
      { label: '质量问题台账', to: '/after-sales?tab=quality', tab: 'quality' },
    ],
  },
  {
    label: '系统管理', base: '/system', icon: '⚙️',
    children: [
      // 「标签配置」「工站配置」评审阶段暂不开放，先从导航隐藏（页面代码保留）。
      { label: '用户与角色', to: '/system?tab=roles', tab: 'roles' },
      { label: '权限配置', to: '/system?tab=permissions', tab: 'permissions' },
      { label: '通知配置', to: '/system?tab=notifications', tab: 'notifications' },
      { label: '操作日志', to: '/system?tab=logs', tab: 'logs' },
    ],
  },
];

// 内部角色值 → 展示名。ERP 统一为「ERP 协同角色」。
const ROLE_DISPLAY = { '厂长': '工厂负责人', 'ERP协同角色': 'ERP 协同角色' };
const roleLabel = (r) => ROLE_DISPLAY[r] || r;

const ROLE_COLORS = {
  '管理员': 'bg-purple-600',
  '厂长': 'bg-blue-600',
  '质检员': 'bg-green-600',
  '装配工': 'bg-amber-600',
  '测试员': 'bg-cyan-600',
  '运维工程师': 'bg-teal-600',
  '项目负责人': 'bg-indigo-600',
  '维修工程师': 'bg-red-600',
  'ERP协同角色': 'bg-slate-600',
};

function isGroupActive(item, pathname) {
  if (item.path) return pathname === item.path || pathname.startsWith(`${item.path}/`);
  const bases = item.match || [item.base];
  return bases.some((b) => pathname === b || pathname.startsWith(`${b}/`));
}

// 右上角用户菜单（所有页面可见）：当前用户 / 部门 / 角色 + 个人信息 / 权限说明 / 退出登录。
// 评审版不再提供角色切换入口，也不显示飞书通知状态。
function UserRoleMenu({ currentUser, currentRole }) {
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState(null); // 'profile' | 'perm' | 'logout' | 'loggedOut'
  const roleColor = ROLE_COLORS[currentRole] || 'bg-slate-600';
  const openDialog = (d) => { setDialog(d); setOpen(false); };
  const menuItem = (label, onClick, danger) => (
    <button onClick={onClick} className={`w-full text-left text-sm px-2 py-1.5 rounded ${danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'}`}>{label}</button>
  );

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm text-gray-700 border border-gray-200 rounded-full pl-1 pr-3 py-1 hover:bg-gray-50">
        <span className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-bold">{currentUser.avatar}</span>
        <span className="text-gray-800">{currentUser.name}（{currentUser.dept}）</span>
        <span className="text-gray-300">｜</span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-xs ${roleColor}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-white/60" />{roleLabel(currentRole)}
        </span>
        <span className="text-gray-400 text-xs">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3 space-y-2">
            <div className="space-y-1.5 text-sm px-1">
              <div className="flex justify-between"><span className="text-gray-400 text-xs">当前用户</span><span className="text-gray-800 font-medium">{currentUser.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-400 text-xs">所属部门</span><span className="text-gray-700">{currentUser.dept}</span></div>
              <div className="flex justify-between"><span className="text-gray-400 text-xs">当前角色</span><span className="text-gray-800 font-medium">{roleLabel(currentRole)}</span></div>
            </div>
            <div className="border-t border-gray-100 pt-2 space-y-0.5">
              {menuItem('个人信息', () => openDialog('profile'))}
              {menuItem('权限说明', () => openDialog('perm'))}
              {menuItem('退出登录', () => openDialog('logout'), true)}
            </div>
          </div>
        </>
      )}

      {/* 个人信息 */}
      <Modal isOpen={dialog === 'profile'} onClose={() => setDialog(null)} title="个人信息">
        <div className="space-y-2 text-sm">
          {[
            ['当前用户', currentUser.name],
            ['所属部门', currentUser.dept],
            ['岗位/职能', currentUser.title || '—'],
            ['当前角色', roleLabel(currentRole)],
            ['可访问项目', currentUser.projectScope || '—'],
            ['数据权限范围', currentUser.dataScope || '—'],
            ['最近登录', currentUser.lastLogin || '—'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-gray-50 pb-1.5"><span className="text-gray-400 text-xs">{k}</span><span className="text-gray-800">{v}</span></div>
          ))}
          <div className="flex justify-end pt-2"><button onClick={() => setDialog(null)} className="px-4 py-2 text-sm bg-slate-700 text-white rounded hover:bg-slate-800">关闭</button></div>
        </div>
      </Modal>

      {/* 权限说明 */}
      <Modal isOpen={dialog === 'perm'} onClose={() => setDialog(null)} title="权限说明">
        <div className="space-y-3 text-sm text-gray-600">
          <p>当前角色：<span className="text-gray-800 font-medium">{roleLabel(currentRole)}</span>。角色决定可见的导航模块与可执行的操作。</p>
          <p>数据可见范围以项目成员与角色为准：只有项目成员可以查看或操作该项目下的生产计划、交付计划、设备、点位、质量问题和工单；管理员不受此限制。</p>
          <p className="text-gray-400 text-xs">具体的模块可见性与操作权限在「系统管理 / 权限配置」中维护。</p>
          <div className="flex justify-end gap-2 pt-1">
            <Link to="/system?tab=permissions" onClick={() => setDialog(null)} className="px-4 py-2 text-sm border border-gray-300 text-gray-600 rounded hover:bg-gray-50">前往权限配置</Link>
            <button onClick={() => setDialog(null)} className="px-4 py-2 text-sm bg-slate-700 text-white rounded hover:bg-slate-800">知道了</button>
          </div>
        </div>
      </Modal>

      {/* 退出登录确认 */}
      <Modal isOpen={dialog === 'logout'} onClose={() => setDialog(null)} title="确认退出登录">
        <div className="space-y-4 text-sm">
          <p className="text-gray-600">当前为原型演示环境，确认后将返回登录占位页或保持当前页面。</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDialog(null)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
            <button onClick={() => setDialog('loggedOut')} className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700">确认退出</button>
          </div>
        </div>
      </Modal>

      {/* 模拟退出结果 */}
      <Modal isOpen={dialog === 'loggedOut'} onClose={() => setDialog(null)} title="已退出登录">
        <div className="space-y-4 text-sm">
          <p className="text-gray-600">原型环境暂未接入真实登录，已模拟退出。</p>
          <div className="flex justify-end"><button onClick={() => setDialog(null)} className="px-4 py-2 text-white bg-slate-700 rounded hover:bg-slate-800">知道了</button></div>
        </div>
      </Modal>
    </div>
  );
}

export default function Layout({ children }) {
  const { state } = useApp();
  const { currentRole, canSeeNav } = useRole();
  const location = useLocation();
  const activeTab = new URLSearchParams(location.search).get('tab');

  const currentUser = FEISHU_USERS.find((u) => u.id === (state.currentUserId || 'u1')) || FEISHU_USERS[0];

  const visibleItems = NAV_ITEMS.filter((item) => canSeeNav(item.path || item.base));

  // 手动展开/收起状态；当前所在的一级菜单默认保持展开。
  const [manualOpen, setManualOpen] = useState({});
  const toggleGroup = (label) => setManualOpen((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <div className="flex min-h-screen w-full bg-gray-100">
      {/* Sidebar：仅平台名称 + 主导航（不含飞书状态 / 身份切换 / 用户下拉） */}
      <aside className="w-52 bg-slate-800 flex flex-col fixed top-0 left-0 h-full z-40">
        <div className="px-4 py-4 border-b border-slate-700">
          <div className="text-white font-bold text-sm leading-tight">设备全生命周期</div>
          <div className="text-slate-400 text-xs mt-0.5">质量管理平台</div>
        </div>

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
                        ? 'bg-slate-700 text-white font-medium border-l-2 border-blue-400'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white border-l-2 border-transparent'
                    }`
                  }
                >
                  <span className="w-4 text-center">{item.icon}</span>
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
                    groupActive ? 'text-white font-medium bg-slate-700/40' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2"><span className="w-4 text-center">{item.icon}</span>{item.label}</span>
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
      </aside>

      {/* Content：顶部条（右上角用户 / 角色区域）+ 页面内容 */}
      <div className="flex-1 min-w-0 ml-52 min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 h-12 bg-white border-b border-gray-200 flex items-center justify-end px-4 flex-shrink-0">
          <UserRoleMenu currentUser={currentUser} currentRole={currentRole} />
        </header>
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
