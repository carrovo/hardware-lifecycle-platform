import { ROLES_LIST, ROLE_ACTION_PERMISSIONS, ROLE_NAV_PERMISSIONS } from '../data/mockData';

const ALL_ACTIONS = [
  'add_material_batch', 'add_assembly', 'add_test_record', 'void_test_record',
  'add_production_plan', 'add_project', 'add_device_allocation', 'add_delivery',
  'add_work_order', 'add_retirement', 'add_device_type', 'add_module_type',
  'edit_device_type', 'edit_module_type', 'void_project', 'manage_users', 'manage_roles',
  'start_work_order', 'submit_recheck', 'do_recheck', 'add_module_replacement',
];

const ACTION_LABELS = {
  'add_material_batch': '新增来料批次',
  'add_assembly': '整机装配',
  'add_test_record': '新增测试记录',
  'void_test_record': '作废测试记录',
  'add_production_plan': '新增生产计划',
  'add_project': '新增项目',
  'add_device_allocation': '设备分配',
  'add_delivery': '新增交付记录',
  'add_work_order': '新增维修工单',
  'add_retirement': '设备退役',
  'add_device_type': '新增整机类型',
  'add_module_type': '新增模块类型',
  'edit_device_type': '编辑整机类型',
  'edit_module_type': '编辑模块类型',
  'void_project': '作废项目',
  'manage_users': '用户管理',
  'manage_roles': '角色管理',
  'start_work_order': '开始处理工单',
  'submit_recheck': '提交复检',
  'do_recheck': '执行复检',
  'add_module_replacement': '记录换件',
};

export default function Roles() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-1">角色权限矩阵</h1>
      <p className="text-sm text-gray-500 mb-6">各角色对功能操作的权限配置（只读展示）</p>
      <div className="bg-white rounded shadow-sm overflow-x-auto">
        <table className="text-xs w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap min-w-32">操作权限</th>
              {ROLES_LIST.map((r) => (
                <th key={r} className="px-3 py-3 text-center font-semibold text-gray-600 whitespace-nowrap">{r}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ALL_ACTIONS.map((action) => (
              <tr key={action} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{ACTION_LABELS[action]}</td>
                {ROLES_LIST.map((role) => {
                  const has = (ROLE_ACTION_PERMISSIONS[role] || []).includes(action);
                  return (
                    <td key={role} className="px-3 py-2 text-center">
                      {has
                        ? <span className="text-green-600 font-bold">✓</span>
                        : <span className="text-gray-200">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-white rounded shadow-sm overflow-x-auto">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">导航菜单可见性</h2>
        </div>
        <table className="text-xs w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap min-w-32">菜单页面</th>
              {ROLES_LIST.map((r) => (
                <th key={r} className="px-3 py-3 text-center font-semibold text-gray-600 whitespace-nowrap">{r}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[
              ['/dashboard', '生产看板'],
              ['/materials', '来料检验'],
              ['/assembly', '整机装配'],
              ['/tests', '测试中心'],
              ['/devices', '设备列表'],
              ['/production-plan', '生产计划'],
              ['/device-types', '设备类型'],
              ['/projects', '项目列表'],
              ['/device-allocation', '设备分配'],
              ['/delivery', '交付流程'],
              ['/operations', '在线运营'],
              ['/alerts', '告警中心'],
              ['/work-orders', '维修工单'],
              ['/retirement', '退役管理'],
              ['/users', '用户管理'],
              ['/roles', '角色权限'],
            ].map(([path, label]) => (
              <tr key={path} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-700">{label}</td>
                {ROLES_LIST.map((role) => {
                  const has = (ROLE_NAV_PERMISSIONS[role] || []).includes(path);
                  return (
                    <td key={role} className="px-3 py-2 text-center">
                      {has
                        ? <span className="text-green-600 font-bold">✓</span>
                        : <span className="text-gray-200">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
