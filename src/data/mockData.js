// Mock Data for Hardware Lifecycle Management Platform
//
// ⚠️ 全平台 mock 数据按「设备生命周期阶段」严格隔离，禁止同一台设备跨阶段复用：
//   生产中 → 已入库/待交付 → 交付中 → 在线运营 → 历史归档/停用（单向流转）。
// 设备池划分（见 devices 注释）：
//   A 生产中池      DEV-007/008/010/013/014..026/025  → 仅生产计划 / 工站测试 / 生产返修
//   B 已入库/待交付  DEV-007/024/101..106              → ERP 合格入库，交付计划绑定候选
//   C 交付中池      DEV-201..210                      → 已绑定交付计划，出厂/安装/验收
//   D 在线运营池    DEV-301..310                      → 已客户验收，含点位/告警/售后/在线质量问题
//   E 历史归档池    DEV-401..404                      → 交付后退役，仅保留已关闭历史
// 一致性由 scripts/validateMockData.mjs 校验。

export const USERS = ['张三', '李四', '王五', '赵六'];

export const MATERIAL_CATEGORIES = ['底盘', '机械臂', '电机', '末端', '全身相机', '预控', '传感器'];

// ============ 系统字典（系统管理维护，全平台复用）============
// 项目类型 / 业务场景字典
export const PROJECT_TYPES = ['智魔方', '机场', '工业场景', '遥操数采'];
// 机器人型号字典（仅保留 AlphaBot1、AlphaBot2）
export const ROBOT_MODELS = ['AlphaBot1', 'AlphaBot2'];
// 模块 / 核心部件字典
export const CORE_PART_TYPES = ['机械臂', '夹爪', '灵巧手', '控制器', '其他核心部件'];

export const moduleTypes = [
  { id: 'MT-001', name: '差速驱动底盘', category: '底盘', specs: '承重≥80kg，最大速度1.5m/s，续航≥8h，IP54', urdf: 'chassis_diff_v2.urdf', active: true, safeStock: 5 },
  { id: 'MT-001B', name: '全向轮底盘', category: '底盘', specs: '承重≥60kg，全向移动，最大速度1.0m/s，续航≥6h', urdf: 'chassis_omni_v1.urdf', active: true },
  { id: 'MT-002', name: '六自由度机械臂', category: '机械臂', specs: '臂展860mm，末端重复定位精度±0.02mm，额定负载5kg', urdf: 'arm_6dof_v3.urdf', active: true, safeStock: 4 },
  { id: 'MT-003', name: '关节伺服电机', category: '电机', specs: '额定转矩8N·m，编码器17bit，峰值转矩24N·m', urdf: 'joint_motor_v2.urdf', active: true, safeStock: 8 },
  { id: 'MT-003B', name: '驱动轮电机', category: '电机', specs: '额定转速3000rpm，编码器13bit，IPX5防护', urdf: 'drive_motor_v1.urdf', active: false },
  { id: 'MT-004', name: '执行夹爪末端', category: '末端', specs: '夹持力0-50N，开口行程0-85mm，精度±0.5mm', urdf: 'gripper_v2.urdf', active: true, safeStock: 4 },
  { id: 'MT-004B', name: '六维力矩传感器末端', category: '末端', specs: '量程Fx/Fy/Fz 200N，Mx/My/Mz 10N·m，采样率1kHz', urdf: 'force_sensor_v1.urdf', active: true },
  { id: 'MT-005', name: '腕部RGBD相机', category: '全身相机', specs: '深度分辨率640×480@30fps，测距范围0.3-3m', urdf: 'wrist_cam_v1.urdf', active: true, safeStock: 4 },
  { id: 'MT-005B', name: '头部RGBD相机', category: '全身相机', specs: '深度分辨率1280×720@30fps，FOV 87°', urdf: 'head_cam_v2.urdf', active: true },
  { id: 'MT-005C', name: '胸部广角相机', category: '全身相机', specs: '1080P@60fps，FOV 120°，鱼眼畸变<2%', urdf: 'chest_cam_v1.urdf', active: true },
  { id: 'MT-006', name: '感知控制预控模块', category: '预控', specs: '搭载8核CPU+GPU，运行频率200Hz，支持ROS2，板载32GB存储', urdf: 'precontrol_v3.urdf', active: true, safeStock: 6 },
  { id: 'MT-007', name: '惯性测量单元IMU', category: '传感器', specs: '6轴IMU，加速度计±8g，陀螺仪±2000°/s，采样率1000Hz', urdf: 'imu_v1.urdf', active: true },
];

export const deviceTypes = [
  {
    id: 'DT-001',
    name: 'AlphaBot 1',
    urdf: 'alphabot_1.urdf',
    slots: [
      { id: 's1', slotName: '底盘槁位', moduleTypeId: 'MT-001', quantity: 1 },
      { id: 's2', slotName: '左臂槁位', moduleTypeId: 'MT-002', quantity: 1 },
      { id: 's3', slotName: '右臂槁位', moduleTypeId: 'MT-002', quantity: 1 },
      { id: 's4', slotName: '关节电机A槁位', moduleTypeId: 'MT-003', quantity: 1 },
      { id: 's5', slotName: '关节电机B槁位', moduleTypeId: 'MT-003', quantity: 1 },
      { id: 's6', slotName: '关节电机C槁位', moduleTypeId: 'MT-003', quantity: 1 },
      { id: 's7', slotName: '关节电机D槁位', moduleTypeId: 'MT-003', quantity: 1 },
      { id: 's8', slotName: '左手末端槁位', moduleTypeId: 'MT-004', quantity: 1 },
      { id: 's9', slotName: '右手末端槁位', moduleTypeId: 'MT-004', quantity: 1 },
      { id: 's10', slotName: '预控槁位', moduleTypeId: 'MT-006', quantity: 1 },
    ],
  },
  {
    id: 'DT-002',
    name: 'AlphaBot 2',
    urdf: 'alphabot_2.urdf',
    slots: [
      { id: 's1', slotName: '底盘槁位', moduleTypeId: 'MT-001', quantity: 1 },
      { id: 's2', slotName: '左臂槁位', moduleTypeId: 'MT-002', quantity: 1 },
      { id: 's3', slotName: '右臂槁位', moduleTypeId: 'MT-002', quantity: 1 },
      { id: 's4', slotName: '关节电机A槁位', moduleTypeId: 'MT-003', quantity: 1 },
      { id: 's5', slotName: '关节电机B槁位', moduleTypeId: 'MT-003', quantity: 1 },
      { id: 's6', slotName: '关节电机C槁位', moduleTypeId: 'MT-003', quantity: 1 },
      { id: 's7', slotName: '关节电机D槁位', moduleTypeId: 'MT-003', quantity: 1 },
      { id: 's8', slotName: '关节电机E槁位', moduleTypeId: 'MT-003', quantity: 1 },
      { id: 's9', slotName: '关节电机F槁位', moduleTypeId: 'MT-003', quantity: 1 },
      { id: 's10', slotName: '左手末端槁位', moduleTypeId: 'MT-004', quantity: 1 },
      { id: 's11', slotName: '右手末端槁位', moduleTypeId: 'MT-004', quantity: 1 },
      { id: 's12', slotName: '左腕相机槁位', moduleTypeId: 'MT-005', quantity: 1 },
      { id: 's13', slotName: '右腕相机槁位', moduleTypeId: 'MT-005', quantity: 1 },
      { id: 's14', slotName: '头部相机槁位', moduleTypeId: 'MT-005B', quantity: 1 },
      { id: 's15', slotName: '胸部相机槁位', moduleTypeId: 'MT-005C', quantity: 1 },
      { id: 's16', slotName: '预控槁位', moduleTypeId: 'MT-006', quantity: 1 },
    ],
  },
  {
    id: 'DT-003',
    name: 'AlphaBot 1S',
    urdf: 'alphabot_1s.urdf',
    slots: [
      { id: 's1', slotName: '底盘槁位', moduleTypeId: 'MT-001', quantity: 1 },
      { id: 's2', slotName: '左臂槁位', moduleTypeId: 'MT-002', quantity: 1 },
      { id: 's3', slotName: '右臂槁位', moduleTypeId: 'MT-002', quantity: 1 },
      { id: 's4', slotName: '关节电机A槁位', moduleTypeId: 'MT-003', quantity: 1 },
      { id: 's5', slotName: '关节电机B槁位', moduleTypeId: 'MT-003', quantity: 1 },
      { id: 's6', slotName: '关节电机C槁位', moduleTypeId: 'MT-003', quantity: 1 },
      { id: 's7', slotName: '关节电机D槁位', moduleTypeId: 'MT-003', quantity: 1 },
      { id: 's8', slotName: '左手末端槁位', moduleTypeId: 'MT-004', quantity: 1 },
      { id: 's9', slotName: '右手末端槁位', moduleTypeId: 'MT-004', quantity: 1 },
      { id: 's10', slotName: '头部相机槁位', moduleTypeId: 'MT-005', quantity: 1 },
      { id: 's11', slotName: '预控槁位', moduleTypeId: 'MT-006', quantity: 1 },
    ],
  },
];

export const materials = [
  { id: 'MAT-001', sn: 'SN-CHASSIS-001', category: '底盘', model: 'CH-2024-A', batchNo: 'BATCH-2024-001', supplier: '供应商A', quantity: 1, inspectionResult: '合格', inspector: '张三', inspectionTime: '2026-05-01 09:30', status: '已占用', notes: '', manufactureDate: '2025-10-01', firmwareVersion: '', operatingHours: 800 },
  { id: 'MAT-002', sn: 'SN-CHASSIS-002', category: '底盘', model: 'CH-2024-A', batchNo: 'BATCH-2024-001', supplier: '供应商A', quantity: 1, inspectionResult: '合格', inspector: '张三', inspectionTime: '2026-05-01 09:45', status: '已占用', notes: '', manufactureDate: '2025-10-04', firmwareVersion: '', operatingHours: 867 },
  { id: 'MAT-003', sn: 'SN-ARM-001', category: '机械臂', model: 'ARM-2024-B', batchNo: 'BATCH-2024-002', supplier: '供应商B', quantity: 1, inspectionResult: '合格', inspector: '李四', inspectionTime: '2026-05-02 10:00', status: '已占用', notes: '', manufactureDate: '2025-10-08', firmwareVersion: '', operatingHours: 934 },
  { id: 'MAT-004', sn: 'SN-ARM-002', category: '机械臂', model: 'ARM-2024-B', batchNo: 'BATCH-2024-002', supplier: '供应商B', quantity: 1, inspectionResult: '合格', inspector: '李四', inspectionTime: '2026-05-02 10:15', status: '待装配', notes: '', manufactureDate: '2025-10-12', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-005', sn: 'SN-ARM-003', category: '机械臂', model: 'ARM-2024-B', batchNo: 'BATCH-2024-002', supplier: '供应商B', quantity: 1, inspectionResult: '不合格', inspector: '李四', inspectionTime: '2026-05-02 10:30', status: '退货换货', notes: '外壳有裂纹', manufactureDate: '2025-10-16', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-006', sn: 'SN-MOTOR-001', category: '电机', model: 'MTR-2024-C', batchNo: 'BATCH-2024-003', supplier: '供应商C', quantity: 1, inspectionResult: '合格', inspector: '王五', inspectionTime: '2026-05-03 08:30', status: '已占用', notes: '', manufactureDate: '2025-10-20', firmwareVersion: '', operatingHours: 1135 },
  { id: 'MAT-007', sn: 'SN-MOTOR-002', category: '电机', model: 'MTR-2024-C', batchNo: 'BATCH-2024-003', supplier: '供应商C', quantity: 1, inspectionResult: '合格', inspector: '王五', inspectionTime: '2026-05-03 08:45', status: '待装配', notes: '', manufactureDate: '2025-10-24', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-008', sn: 'SN-MOTOR-003', category: '电机', model: 'MTR-2024-C', batchNo: 'BATCH-2024-003', supplier: '供应商C', quantity: 1, inspectionResult: '特批使用', inspector: '赵六', inspectionTime: '2026-05-03 09:00', status: '待装配', notes: '噪音略高，特批使用', manufactureDate: '2025-10-28', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-009', sn: 'SN-END-001', category: '末端', model: 'END-2024-D', batchNo: 'BATCH-2024-004', supplier: '供应商D', quantity: 1, inspectionResult: '合格', inspector: '张三', inspectionTime: '2026-05-04 09:00', status: '已占用', notes: '', manufactureDate: '2025-11-01', firmwareVersion: '', operatingHours: 1336 },
  { id: 'MAT-010', sn: 'SN-END-002', category: '末端', model: 'END-2024-D', batchNo: 'BATCH-2024-004', supplier: '供应商D', quantity: 1, inspectionResult: '合格', inspector: '张三', inspectionTime: '2026-05-04 09:15', status: '待装配', notes: '', manufactureDate: '2025-11-05', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-011', sn: 'SN-CAM-001', category: '全身相机', model: 'CAM-2024-E', batchNo: 'BATCH-2024-005', supplier: '供应商E', quantity: 1, inspectionResult: '合格', inspector: '李四', inspectionTime: '2026-05-05 10:00', status: '已占用', notes: '', manufactureDate: '2025-11-09', firmwareVersion: '', operatingHours: 1470 },
  { id: 'MAT-012', sn: 'SN-CAM-002', category: '全身相机', model: 'CAM-2024-E', batchNo: 'BATCH-2024-005', supplier: '供应商E', quantity: 1, inspectionResult: '不合格', inspector: '李四', inspectionTime: '2026-05-05 10:20', status: '退货换货', notes: '图像传感器损坏', manufactureDate: '2025-11-13', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-013', sn: 'SN-CTRL-001', category: '预控', model: 'CTRL-2024-F', batchNo: 'BATCH-2024-006', supplier: '供应商F', quantity: 1, inspectionResult: '合格', inspector: '王五', inspectionTime: '2026-05-06 08:00', status: '已占用', notes: '', manufactureDate: '2025-11-17', firmwareVersion: '', operatingHours: 1604 },
  { id: 'MAT-014', sn: 'SN-CTRL-002', category: '预控', model: 'CTRL-2024-F', batchNo: 'BATCH-2024-006', supplier: '供应商F', quantity: 1, inspectionResult: '合格', inspector: '王五', inspectionTime: '2026-05-06 08:30', status: '待装配', notes: '', manufactureDate: '2025-11-21', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-015', sn: 'SN-MOTOR-004', category: '电机', model: 'MTR-2024-C', batchNo: 'BATCH-2024-007', supplier: '供应商C', quantity: 1, inspectionResult: '合格', inspector: '赵六', inspectionTime: '2026-05-07 09:00', status: '待装配', notes: '', manufactureDate: '2025-11-25', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-016', sn: 'SN-MOTOR-005', category: '电机', model: 'MTR-2024-C', batchNo: 'BATCH-2024-007', supplier: '供应商C', quantity: 1, inspectionResult: '合格', inspector: '赵六', inspectionTime: '2026-05-07 09:10', status: '已占用', notes: '', manufactureDate: '2025-11-29', firmwareVersion: '', operatingHours: 804 },
  { id: 'MAT-017', sn: 'SN-MOTOR-006', category: '电机', model: 'MTR-2024-C', batchNo: 'BATCH-2024-007', supplier: '供应商C', quantity: 1, inspectionResult: '合格', inspector: '赵六', inspectionTime: '2026-05-07 09:20', status: '已占用', notes: '', manufactureDate: '2025-12-03', firmwareVersion: '', operatingHours: 871 },
  { id: 'MAT-018', sn: 'SN-CHASSIS-003', category: '底盘', model: 'CH-2024-A', batchNo: 'BATCH-2024-008', supplier: '供应商A', quantity: 1, inspectionResult: '合格', inspector: '张三', inspectionTime: '2026-05-10 09:00', status: '已占用', notes: '', manufactureDate: '2025-12-07', firmwareVersion: '', operatingHours: 938 },
  { id: 'MAT-019', sn: 'SN-ARM-004', category: '机械臂', model: 'ARM-2024-B', batchNo: 'BATCH-2024-008', supplier: '供应商B', quantity: 1, inspectionResult: '合格', inspector: '李四', inspectionTime: '2026-05-10 09:30', status: '已占用', notes: '', manufactureDate: '2025-12-11', firmwareVersion: '', operatingHours: 1005 },
  { id: 'MAT-020', sn: 'SN-ARM-005', category: '机械臂', model: 'ARM-2024-B', batchNo: 'BATCH-2024-008', supplier: '供应商B', quantity: 1, inspectionResult: '合格', inspector: '李四', inspectionTime: '2026-05-10 09:45', status: '已占用', notes: '', manufactureDate: '2025-12-15', firmwareVersion: '', operatingHours: 1072 },
  { id: 'MAT-021', sn: 'SN-CHASSIS-004', category: '底盘', model: 'CH-2026-A', batchNo: 'BATCH-2026-009', supplier: '务实科技', quantity: 1, inspectionResult: '合格', inspector: '张三', inspectionTime: '2026-05-12 09:00', status: '待装配', notes: '', manufactureDate: '2025-12-19', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-022', sn: 'SN-CHASSIS-005', category: '底盘', model: 'CH-2026-A', batchNo: 'BATCH-2026-009', supplier: '务实科技', quantity: 1, inspectionResult: '合格', inspector: '张三', inspectionTime: '2026-05-12 09:10', status: '待装配', notes: '', manufactureDate: '2025-12-23', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-023', sn: 'SN-CHASSIS-006', category: '底盘', model: 'CH-2026-A', batchNo: 'BATCH-2026-009', supplier: '务实科技', quantity: 1, inspectionResult: '合格', inspector: '张三', inspectionTime: '2026-05-12 09:20', status: '待装配', notes: '', manufactureDate: '2025-12-27', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-024', sn: 'SN-ARM-006', category: '机械臂', model: 'ARM-2026-B', batchNo: 'BATCH-2026-010', supplier: '务实科技', quantity: 1, inspectionResult: '合格', inspector: '李四', inspectionTime: '2026-05-14 10:00', status: '待装配', notes: '', manufactureDate: '2025-12-31', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-025', sn: 'SN-ARM-007', category: '机械臂', model: 'ARM-2026-B', batchNo: 'BATCH-2026-010', supplier: '务实科技', quantity: 1, inspectionResult: '合格', inspector: '李四', inspectionTime: '2026-05-14 10:10', status: '待装配', notes: '', manufactureDate: '2026-01-04', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-026', sn: 'SN-ARM-008', category: '机械臂', model: 'ARM-2026-B', batchNo: 'BATCH-2026-010', supplier: '务实科技', quantity: 1, inspectionResult: '合格', inspector: '李四', inspectionTime: '2026-05-14 10:20', status: '待装配', notes: '', manufactureDate: '2026-01-08', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-027', sn: 'SN-MOTOR-007', category: '电机', model: 'MTR-2026-C', batchNo: 'BATCH-2026-011', supplier: '迈驰驱动', quantity: 1, inspectionResult: '不合格', inspector: '王五', inspectionTime: '2026-05-15 08:30', status: '退货换货', notes: '转子偏心，振动超标', manufactureDate: '2026-01-12', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-028', sn: 'SN-MOTOR-008', category: '电机', model: 'MTR-2026-C', batchNo: 'BATCH-2026-011', supplier: '迈驰驱动', quantity: 1, inspectionResult: '合格', inspector: '王五', inspectionTime: '2026-05-15 08:40', status: '待装配', notes: '', manufactureDate: '2026-01-16', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-029', sn: 'SN-MOTOR-009', category: '电机', model: 'MTR-2026-C', batchNo: 'BATCH-2026-011', supplier: '迈驰驱动', quantity: 1, inspectionResult: '合格', inspector: '王五', inspectionTime: '2026-05-15 08:50', status: '待装配', notes: '', manufactureDate: '2026-01-20', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-030', sn: 'SN-END-003', category: '末端', model: 'END-2026-D', batchNo: 'BATCH-2026-012', supplier: '务实科技', quantity: 1, inspectionResult: '合格', inspector: '赵六', inspectionTime: '2026-05-18 09:00', status: '待装配', notes: '', manufactureDate: '2026-01-24', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-031', sn: 'SN-END-004', category: '末端', model: 'END-2026-D', batchNo: 'BATCH-2026-012', supplier: '务实科技', quantity: 1, inspectionResult: '合格', inspector: '赵六', inspectionTime: '2026-05-18 09:10', status: '待装配', notes: '', manufactureDate: '2026-01-28', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-032', sn: 'SN-CAM-003', category: '全身相机', model: 'CAM-2026-E', batchNo: 'BATCH-2026-013', supplier: '锐视传感器', quantity: 1, inspectionResult: '特批使用', inspector: '张三', inspectionTime: '2026-05-20 10:00', status: '待装配', notes: '色差偏移轻微，特批使用', manufactureDate: '2026-02-01', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-033', sn: 'SN-CAM-004', category: '全身相机', model: 'CAM-2026-E', batchNo: 'BATCH-2026-013', supplier: '锐视传感器', quantity: 1, inspectionResult: '合格', inspector: '张三', inspectionTime: '2026-05-20 10:10', status: '待装配', notes: '', manufactureDate: '2026-02-05', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-034', sn: 'SN-CTRL-003', category: '预控', model: 'CTRL-2026-F', batchNo: 'BATCH-2026-014', supplier: '务实科技', quantity: 1, inspectionResult: '合格', inspector: '李四', inspectionTime: '2026-05-22 08:00', status: '待装配', notes: '', manufactureDate: '2026-02-09', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-035', sn: 'SN-CTRL-004', category: '预控', model: 'CTRL-2026-F', batchNo: 'BATCH-2026-014', supplier: '务实科技', quantity: 1, inspectionResult: '合格', inspector: '李四', inspectionTime: '2026-05-22 08:10', status: '待装配', notes: '', manufactureDate: '2026-02-13', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-036', sn: 'SN-CHASSIS-007', category: '底盘', model: 'CH-2026-A', batchNo: 'BATCH-2026-015', supplier: '务实科技', quantity: 1, inspectionResult: '不合格', inspector: '王五', inspectionTime: '2026-05-25 09:00', status: '退货换货', notes: '底盘焊缝开裂', manufactureDate: '2026-02-17', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-037', sn: 'SN-CHASSIS-008', category: '底盘', model: 'CH-2026-A', batchNo: 'BATCH-2026-015', supplier: '务实科技', quantity: 1, inspectionResult: '不合格', inspector: '王五', inspectionTime: '2026-05-25 09:10', status: '退货换货', notes: '底盘焊缝开裂', manufactureDate: '2026-02-21', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-038', sn: 'SN-ARM-009', category: '机械臂', model: 'ARM-2026-B', batchNo: 'BATCH-2026-016', supplier: '务实科技', quantity: 1, inspectionResult: '特批使用', inspector: '赵六', inspectionTime: '2026-05-28 09:30', status: '待装配', notes: '关节间隙略大，特批低速场景使用', manufactureDate: '2026-02-25', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-039', sn: 'SN-ARM-010', category: '机械臂', model: 'ARM-2026-B', batchNo: 'BATCH-2026-016', supplier: '务实科技', quantity: 1, inspectionResult: '合格', inspector: '赵六', inspectionTime: '2026-05-28 09:40', status: '待装配', notes: '', manufactureDate: '2026-03-01', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-040', sn: 'SN-ARM-011', category: '机械臂', model: 'ARM-2026-B', batchNo: 'BATCH-2026-016', supplier: '务实科技', quantity: 1, inspectionResult: '合格', inspector: '赵六', inspectionTime: '2026-05-28 09:50', status: '待装配', notes: '', manufactureDate: '2026-03-05', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-041', sn: 'SN-MOTOR-010', category: '电机', model: 'MTR-2026-C', batchNo: 'BATCH-2026-017', supplier: '迈驰驱动', quantity: 1, inspectionResult: '合格', inspector: '张三', inspectionTime: '2026-06-01 08:00', status: '待装配', notes: '', manufactureDate: '2026-03-09', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-042', sn: 'SN-MOTOR-011', category: '电机', model: 'MTR-2026-C', batchNo: 'BATCH-2026-017', supplier: '迈驰驱动', quantity: 1, inspectionResult: '合格', inspector: '张三', inspectionTime: '2026-06-01 08:10', status: '待装配', notes: '', manufactureDate: '2026-03-13', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-043', sn: 'SN-MOTOR-012', category: '电机', model: 'MTR-2026-C', batchNo: 'BATCH-2026-017', supplier: '迈驰驱动', quantity: 1, inspectionResult: '合格', inspector: '张三', inspectionTime: '2026-06-01 08:20', status: '待装配', notes: '', manufactureDate: '2026-03-17', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-044', sn: 'SN-END-005', category: '末端', model: 'END-2026-D', batchNo: 'BATCH-2026-018', supplier: '锐视传感器', quantity: 1, inspectionResult: '不合格', inspector: '李四', inspectionTime: '2026-06-03 10:00', status: '退货换货', notes: '传感器灵敏度不达标', manufactureDate: '2026-03-21', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-045', sn: 'SN-CAM-005', category: '全身相机', model: 'CAM-2026-E', batchNo: 'BATCH-2026-019', supplier: '锐视传感器', quantity: 1, inspectionResult: '合格', inspector: '王五', inspectionTime: '2026-06-05 09:00', status: '待装配', notes: '', manufactureDate: '2026-03-25', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-046', sn: 'SN-CAM-006', category: '全身相机', model: 'CAM-2026-E', batchNo: 'BATCH-2026-019', supplier: '锐视传感器', quantity: 1, inspectionResult: '合格', inspector: '王五', inspectionTime: '2026-06-05 09:10', status: '待装配', notes: '', manufactureDate: '2026-03-29', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-047', sn: 'SN-CAM-007', category: '全身相机', model: 'CAM-2026-E', batchNo: 'BATCH-2026-019', supplier: '锐视传感器', quantity: 1, inspectionResult: '合格', inspector: '王五', inspectionTime: '2026-06-05 09:20', status: '待装配', notes: '', manufactureDate: '2026-04-02', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-048', sn: 'SN-CTRL-005', category: '预控', model: 'CTRL-2026-F', batchNo: 'BATCH-2026-020', supplier: '务实科技', quantity: 1, inspectionResult: '合格', inspector: '赵六', inspectionTime: '2026-06-08 08:30', status: '待装配', notes: '', manufactureDate: '2026-04-06', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-049', sn: 'SN-CTRL-006', category: '预控', model: 'CTRL-2026-F', batchNo: 'BATCH-2026-020', supplier: '务实科技', quantity: 1, inspectionResult: '合格', inspector: '赵六', inspectionTime: '2026-06-08 08:40', status: '维修中', notes: '固件刷写失败，送修', manufactureDate: '2026-04-10', firmwareVersion: '', operatingHours: 436 },
  { id: 'MAT-050', sn: 'SN-CHASSIS-009', category: '底盘', model: 'CH-2026-B', batchNo: 'BATCH-2026-021', supplier: '迈驰驱动', quantity: 1, inspectionResult: '合格', inspector: '张三', inspectionTime: '2026-06-10 09:00', status: '待装配', notes: '', manufactureDate: '2026-04-14', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-051', sn: 'SN-CHASSIS-010', category: '底盘', model: 'CH-2026-B', batchNo: 'BATCH-2026-021', supplier: '迈驰驱动', quantity: 1, inspectionResult: '合格', inspector: '张三', inspectionTime: '2026-06-10 09:10', status: '已报废', notes: '搬运中碰撞损坏，无法修复', manufactureDate: '2026-04-18', firmwareVersion: '', operatingHours: 2250 },
  { id: 'MAT-052', sn: 'SN-MOTOR-013', category: '电机', model: 'MTR-2026-C', batchNo: 'BATCH-2026-022', supplier: '迈驰驱动', quantity: 1, inspectionResult: '合格', inspector: '李四', inspectionTime: '2026-06-15 08:00', status: '待装配', notes: '', manufactureDate: '2026-04-22', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-053', sn: 'SN-MOTOR-014', category: '电机', model: 'MTR-2026-C', batchNo: 'BATCH-2026-022', supplier: '迈驰驱动', quantity: 1, inspectionResult: '合格', inspector: '李四', inspectionTime: '2026-06-15 08:10', status: '待装配', notes: '', manufactureDate: '2026-04-26', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-054', sn: 'SN-MOTOR-015', category: '电机', model: 'MTR-2026-C', batchNo: 'BATCH-2026-022', supplier: '迈驰驱动', quantity: 1, inspectionResult: '合格', inspector: '李四', inspectionTime: '2026-06-15 08:20', status: '维修中', notes: '编码器故障，返厂维修', manufactureDate: '2026-04-30', firmwareVersion: '', operatingHours: 400 },
];

// ============ 设备池（按生命周期阶段隔离） ============
export const devices = [
  // ── A 生产中池 · WPP-001 智魔方Q1批次生产 / AlphaBot 1 / 5台（演示生产四节点）──
  { id: 'DEV-007', sn: 'SN-DEV-007', deviceTypeId: 'DT-001', status: '已入库', assembler: '王五', assemblyTime: '2026-05-20 10:00', photoName: 'assembly_dev007.jpg', usedMaterials: [{ materialId: 'MAT-001', moduleTypeId: 'MT-001' }, { materialId: 'MAT-003', moduleTypeId: 'MT-002' }], projectId: 'PROJ-001', productionPlanId: 'WPP-001', erpStorageOrderNo: 'WR-2026-088', erpInboundNo: 'PI-2026-015', erpInspectionNo: 'QC-2026-015', erpInspectionStatus: '合格', erpStockStatus: '合格可用', erpSerialNo: 'SN-DEV-007', warehouse: '成品库', inboundTime: '2026-06-08 09:30', createdAt: '2026-05-20 10:00', updatedAt: '2026-06-08 09:30' },
  { id: 'DEV-008', sn: 'SN-DEV-008', deviceTypeId: 'DT-001', status: '生产返修中', assembler: '赵六', assemblyTime: '2026-05-18 09:00', photoName: 'assembly_dev008.jpg', usedMaterials: [], projectId: 'PROJ-001', productionPlanId: 'WPP-001', createdAt: '2026-05-18 09:00', updatedAt: '2026-06-19 09:30' },
  { id: 'DEV-010', sn: 'SN-DEV-010', deviceTypeId: 'DT-001', status: '生产返修中', assembler: '李四', assemblyTime: '2026-05-19 09:00', photoName: 'assembly_dev010.jpg', usedMaterials: [], projectId: 'PROJ-001', productionPlanId: 'WPP-001', createdAt: '2026-05-19 09:00', updatedAt: '2026-06-20 08:55' },
  { id: 'DEV-013', sn: 'SN-DEV-013', deviceTypeId: 'DT-001', status: '半成品检验中', assembler: '张三', assemblyTime: '2026-05-22 10:00', photoName: 'assembly_dev013.jpg', usedMaterials: [], projectId: 'PROJ-001', productionPlanId: 'WPP-001', createdAt: '2026-05-22 10:00', updatedAt: '2026-06-21 09:02' },
  { id: 'DEV-025', sn: 'SN-DEV-025', deviceTypeId: 'DT-001', status: '中测中', assembler: '王五', assemblyTime: '2026-05-24 10:00', photoName: 'assembly_dev025.jpg', usedMaterials: [], projectId: 'PROJ-001', productionPlanId: 'WPP-001', createdAt: '2026-05-24 10:00', updatedAt: '2026-06-22 09:00' },
  // ── A 生产中池 · WPP-002 智魔方Q2补单生产 / AlphaBot 1 / 6台 ──
  { id: 'DEV-014', sn: 'SN-DEV-014', deviceTypeId: 'DT-001', status: '待入库', assembler: '张三', assemblyTime: '2026-06-12 10:00', photoName: 'assembly_dev014.jpg', usedMaterials: [], productionPlanId: 'WPP-002', erpInspectionStatus: '待检', erpStockStatus: '待检', createdAt: '2026-06-12 10:00', updatedAt: '2026-06-19 16:00' },
  { id: 'DEV-015', sn: 'SN-DEV-015', deviceTypeId: 'DT-001', status: '待入库', assembler: '李四', assemblyTime: '2026-06-13 09:30', photoName: 'assembly_dev015.jpg', usedMaterials: [], productionPlanId: 'WPP-002', erpInspectionStatus: '待检', erpStockStatus: '待检', createdAt: '2026-06-13 09:30', updatedAt: '2026-06-19 16:30' },
  { id: 'DEV-016', sn: 'SN-DEV-016', deviceTypeId: 'DT-001', status: 'OQT终测中', assembler: '赵六', assemblyTime: '2026-06-14 09:00', photoName: 'assembly_dev016.jpg', usedMaterials: [], productionPlanId: 'WPP-002', createdAt: '2026-06-14 09:00', updatedAt: '2026-06-21 11:00' },
  { id: 'DEV-017', sn: 'SN-DEV-017', deviceTypeId: 'DT-001', status: '初测中', assembler: '王五', assemblyTime: '2026-06-19 09:00', photoName: 'assembly_dev017.jpg', usedMaterials: [], productionPlanId: 'WPP-002', createdAt: '2026-06-19 09:00', updatedAt: '2026-06-20 12:00' },
  { id: 'DEV-018', sn: 'SN-DEV-018', deviceTypeId: 'DT-001', status: '中测中', assembler: '赵六', assemblyTime: '2026-06-16 11:00', photoName: 'assembly_dev018.jpg', usedMaterials: [], productionPlanId: 'WPP-002', createdAt: '2026-06-16 11:00', updatedAt: '2026-06-20 10:00' },
  { id: 'DEV-019', sn: 'SN-DEV-019', deviceTypeId: 'DT-001', status: '半成品检验中', assembler: '张三', assemblyTime: '2026-06-18 09:00', photoName: 'assembly_dev019.jpg', usedMaterials: [], productionPlanId: 'WPP-002', createdAt: '2026-06-18 09:00', updatedAt: '2026-06-20 15:00' },
  // ── A 生产中池 · WPP-003 华熙生物首批生产 / AlphaBot 2 / 6台 ──
  { id: 'DEV-020', sn: 'SN-DEV-020', deviceTypeId: 'DT-002', status: '装配中', assembler: '李四', assemblyTime: '2026-06-20 09:00', photoName: 'assembly_dev020.jpg', usedMaterials: [], productionPlanId: 'WPP-003', createdAt: '2026-06-20 09:00', updatedAt: '2026-06-21 10:00' },
  { id: 'DEV-021', sn: 'SN-DEV-021', deviceTypeId: 'DT-002', status: '装配中', assembler: '王五', assemblyTime: '2026-06-20 10:30', photoName: 'assembly_dev021.jpg', usedMaterials: [], productionPlanId: 'WPP-003', createdAt: '2026-06-20 10:30', updatedAt: '2026-06-21 11:00' },
  { id: 'DEV-022', sn: 'SN-DEV-022', deviceTypeId: 'DT-002', status: '中测中', assembler: '赵六', assemblyTime: '2026-06-16 10:00', photoName: 'assembly_dev022.jpg', usedMaterials: [], productionPlanId: 'WPP-003', createdAt: '2026-06-16 10:00', updatedAt: '2026-06-21 09:00' },
  { id: 'DEV-023', sn: 'SN-DEV-023', deviceTypeId: 'DT-002', status: '初测中', assembler: '张三', assemblyTime: '2026-06-18 09:00', photoName: 'assembly_dev023.jpg', usedMaterials: [], productionPlanId: 'WPP-003', createdAt: '2026-06-18 09:00', updatedAt: '2026-06-21 09:30' },
  { id: 'DEV-024', sn: 'SN-DEV-024', deviceTypeId: 'DT-002', status: '已入库', assembler: '李四', assemblyTime: '2026-06-10 09:00', photoName: 'assembly_dev024.jpg', usedMaterials: [], productionPlanId: 'WPP-003', erpInboundNo: 'PI-2026-041', erpInspectionNo: 'QC-2026-041', erpInspectionStatus: '合格', erpStockStatus: '合格可用', erpSerialNo: 'SN-DEV-024', warehouse: '成品库', inboundTime: '2026-06-19 10:00', createdAt: '2026-06-10 09:00', updatedAt: '2026-06-19 10:00' },
  { id: 'DEV-026', sn: 'SN-DEV-026', deviceTypeId: 'DT-002', status: '生产返修中', assembler: '赵六', assemblyTime: '2026-06-12 10:00', photoName: 'assembly_dev026.jpg', usedMaterials: [], productionPlanId: 'WPP-003', createdAt: '2026-06-12 10:00', updatedAt: '2026-06-21 16:00' },

  // ── B 已入库 / 待交付池（ERP 合格入库，交付计划绑定候选，无告警/无售后）──
  { id: 'DEV-101', sn: 'SN-DEV-101', deviceTypeId: 'DT-001', status: '已入库', assembler: '张三', assemblyTime: '2026-05-30 10:00', photoName: 'assembly_dev101.jpg', usedMaterials: [], projectId: 'PROJ-004', productionPlanId: 'WPP-005', erpInboundNo: 'PI-2026-101', erpInspectionNo: 'QC-2026-101', erpInspectionStatus: '合格', erpStockStatus: '合格可用', erpSerialNo: 'SN-DEV-101', warehouse: '成品库', inboundTime: '2026-06-10 09:00', createdAt: '2026-05-30 10:00', updatedAt: '2026-06-10 09:00' },
  { id: 'DEV-102', sn: 'SN-DEV-102', deviceTypeId: 'DT-001', status: '已入库', assembler: '李四', assemblyTime: '2026-05-31 10:00', photoName: 'assembly_dev102.jpg', usedMaterials: [], projectId: 'PROJ-004', productionPlanId: 'WPP-005', erpInboundNo: 'PI-2026-102', erpInspectionNo: 'QC-2026-102', erpInspectionStatus: '合格', erpStockStatus: '合格可用', erpSerialNo: 'SN-DEV-102', warehouse: '成品库', inboundTime: '2026-06-11 09:00', createdAt: '2026-05-31 10:00', updatedAt: '2026-06-11 09:00' },
  { id: 'DEV-103', sn: 'SN-DEV-103', deviceTypeId: 'DT-001', status: '已入库', assembler: '王五', assemblyTime: '2026-06-01 10:00', photoName: 'assembly_dev103.jpg', projectId: 'PROJ-001', usedMaterials: [], productionPlanId: 'WPP-005', erpInboundNo: 'PI-2026-103', erpInspectionNo: 'QC-2026-103', erpInspectionStatus: '合格', erpStockStatus: '合格可用', erpSerialNo: 'SN-DEV-103', warehouse: '成品库', inboundTime: '2026-06-12 09:00', createdAt: '2026-06-01 10:00', updatedAt: '2026-06-12 09:00' },
  { id: 'DEV-104', sn: 'SN-DEV-104', deviceTypeId: 'DT-002', status: '已入库', assembler: '赵六', assemblyTime: '2026-06-02 10:00', photoName: 'assembly_dev104.jpg', projectId: 'PROJ-004', usedMaterials: [], productionPlanId: 'WPP-006', erpInboundNo: 'PI-2026-104', erpInspectionNo: 'QC-2026-104', erpInspectionStatus: '合格', erpStockStatus: '合格可用', erpSerialNo: 'SN-DEV-104', warehouse: '成品库', inboundTime: '2026-06-13 09:00', createdAt: '2026-06-02 10:00', updatedAt: '2026-06-13 09:00' },
  { id: 'DEV-105', sn: 'SN-DEV-105', deviceTypeId: 'DT-001', status: '已入库', assembler: '张三', assemblyTime: '2026-06-03 10:00', photoName: 'assembly_dev105.jpg', usedMaterials: [], productionPlanId: 'WPP-005', erpInboundNo: 'PI-2026-105', erpInspectionNo: 'QC-2026-105', erpInspectionStatus: '合格', erpStockStatus: '合格可用', erpSerialNo: 'SN-DEV-105', warehouse: '成品库', inboundTime: '2026-06-14 09:00', createdAt: '2026-06-03 10:00', updatedAt: '2026-06-14 09:00' },
  { id: 'DEV-106', sn: 'SN-DEV-106', deviceTypeId: 'DT-002', status: '已入库', assembler: '李四', assemblyTime: '2026-06-04 10:00', photoName: 'assembly_dev106.jpg', projectId: 'PROJ-003', usedMaterials: [], productionPlanId: 'WPP-007', erpInboundNo: 'PI-2026-106', erpInspectionNo: 'QC-2026-106', erpInspectionStatus: '合格', erpStockStatus: '合格可用', erpSerialNo: 'SN-DEV-106', warehouse: '成品库', inboundTime: '2026-06-15 09:00', createdAt: '2026-06-04 10:00', updatedAt: '2026-06-15 09:00' },

  // ── C 交付中池 · DP-001 智魔方首批交付 / 4台 ──
  { id: 'DEV-201', sn: 'SN-DEV-201', deviceTypeId: 'DT-001', status: '已分配项目', assembler: '王五', assemblyTime: '2026-05-25 10:00', photoName: 'assembly_dev201.jpg', usedMaterials: [], projectId: 'PROJ-001', productionPlanId: 'WPP-005', deliveryPlanId: 'DP-001', preAssignedLocationId: 'LOC-012', erpInboundNo: 'PI-2026-201', erpInspectionNo: 'QC-2026-201', erpInspectionStatus: '合格', erpStockStatus: '已分配', erpSerialNo: 'SN-DEV-201', createdAt: '2026-05-25 10:00', updatedAt: '2026-06-18 09:00' },
  { id: 'DEV-202', sn: 'SN-DEV-202', deviceTypeId: 'DT-001', status: '已分配项目', assembler: '赵六', assemblyTime: '2026-05-26 10:00', photoName: 'assembly_dev202.jpg', usedMaterials: [], projectId: 'PROJ-001', productionPlanId: 'WPP-005', deliveryPlanId: 'DP-001', preAssignedLocationId: 'LOC-012', erpInboundNo: 'PI-2026-202', erpInspectionNo: 'QC-2026-202', erpInspectionStatus: '合格', erpStockStatus: '已分配', erpSerialNo: 'SN-DEV-202', createdAt: '2026-05-26 10:00', updatedAt: '2026-06-19 14:00' },
  { id: 'DEV-203', sn: 'SN-DEV-203', deviceTypeId: 'DT-001', status: '现场安装调试中', assembler: '张三', assemblyTime: '2026-05-27 10:00', photoName: 'assembly_dev203.jpg', usedMaterials: [], projectId: 'PROJ-001', productionPlanId: 'WPP-005', deliveryPlanId: 'DP-001', locationId: 'LOC-010', preAssignedLocationId: 'LOC-010', erpInboundNo: 'PI-2026-203', erpInspectionNo: 'QC-2026-203', erpInspectionStatus: '合格', erpStockStatus: '已分配', erpSerialNo: 'SN-DEV-203', createdAt: '2026-05-27 10:00', updatedAt: '2026-06-21 10:00' },
  { id: 'DEV-204', sn: 'SN-DEV-204', deviceTypeId: 'DT-001', status: '客户验收中', assembler: '李四', assemblyTime: '2026-05-28 10:00', photoName: 'assembly_dev204.jpg', usedMaterials: [], projectId: 'PROJ-001', productionPlanId: 'WPP-005', deliveryPlanId: 'DP-001', locationId: 'LOC-009', preAssignedLocationId: 'LOC-009', erpInboundNo: 'PI-2026-204', erpInspectionNo: 'QC-2026-204', erpInspectionStatus: '合格', erpStockStatus: '已分配', erpSerialNo: 'SN-DEV-204', createdAt: '2026-05-28 10:00', updatedAt: '2026-06-22 10:00' },
  // ── C 交付中池 · DP-002 华熙生物首批交付 / 3台（含出厂/安装 NG）──
  { id: 'DEV-205', sn: 'SN-DEV-205', deviceTypeId: 'DT-002', status: '已分配项目', assembler: '王五', assemblyTime: '2026-05-29 10:00', photoName: 'assembly_dev205.jpg', usedMaterials: [], projectId: 'PROJ-002', productionPlanId: 'WPP-006', deliveryPlanId: 'DP-002', preAssignedLocationId: 'LOC-008', erpInboundNo: 'PI-2026-205', erpInspectionNo: 'QC-2026-205', erpInspectionStatus: '合格', erpStockStatus: '已分配', erpSerialNo: 'SN-DEV-205', createdAt: '2026-05-29 10:00', updatedAt: '2026-06-19 10:00' },
  { id: 'DEV-206', sn: 'SN-DEV-206', deviceTypeId: 'DT-002', status: '现场安装调试中', assembler: '赵六', assemblyTime: '2026-05-30 10:00', photoName: 'assembly_dev206.jpg', usedMaterials: [], projectId: 'PROJ-002', productionPlanId: 'WPP-006', deliveryPlanId: 'DP-002', locationId: 'LOC-008', preAssignedLocationId: 'LOC-008', erpInboundNo: 'PI-2026-206', erpInspectionNo: 'QC-2026-206', erpInspectionStatus: '合格', erpStockStatus: '已分配', erpSerialNo: 'SN-DEV-206', createdAt: '2026-05-30 10:00', updatedAt: '2026-06-21 14:00' },
  { id: 'DEV-207', sn: 'SN-DEV-207', deviceTypeId: 'DT-002', status: '客户验收中', assembler: '张三', assemblyTime: '2026-05-31 10:00', photoName: 'assembly_dev207.jpg', usedMaterials: [], projectId: 'PROJ-002', productionPlanId: 'WPP-006', deliveryPlanId: 'DP-002', locationId: 'LOC-014', preAssignedLocationId: 'LOC-014', erpInboundNo: 'PI-2026-207', erpInspectionNo: 'QC-2026-207', erpInspectionStatus: '合格', erpStockStatus: '已分配', erpSerialNo: 'SN-DEV-207', createdAt: '2026-05-31 10:00', updatedAt: '2026-06-22 11:00' },
  // ── C 交付中池 · DP-003 机场T3试点交付 / 1台 ──
  { id: 'DEV-208', sn: 'SN-DEV-208', deviceTypeId: 'DT-002', status: '现场安装调试中', assembler: '李四', assemblyTime: '2026-06-01 10:00', photoName: 'assembly_dev208.jpg', usedMaterials: [], projectId: 'PROJ-003', productionPlanId: 'WPP-007', deliveryPlanId: 'DP-003', locationId: 'LOC-007', preAssignedLocationId: 'LOC-007', erpInboundNo: 'PI-2026-208', erpInspectionNo: 'QC-2026-208', erpInspectionStatus: '合格', erpStockStatus: '已分配', erpSerialNo: 'SN-DEV-208', createdAt: '2026-06-01 10:00', updatedAt: '2026-06-21 15:00' },
  // ── C 交付中池 · DP-008 医疗康养首批交付 / 2台 ──
  { id: 'DEV-209', sn: 'SN-DEV-209', deviceTypeId: 'DT-001', status: '已分配项目', assembler: '王五', assemblyTime: '2026-06-02 10:00', photoName: 'assembly_dev209.jpg', usedMaterials: [], projectId: 'PROJ-004', deliveryPlanId: 'DP-008', preAssignedLocationId: 'LOC-013', erpInboundNo: 'PI-2026-209', erpInspectionNo: 'QC-2026-209', erpInspectionStatus: '合格', erpStockStatus: '已分配', erpSerialNo: 'SN-DEV-209', createdAt: '2026-06-02 10:00', updatedAt: '2026-06-20 09:00' },
  { id: 'DEV-210', sn: 'SN-DEV-210', deviceTypeId: 'DT-001', status: '现场安装调试中', assembler: '赵六', assemblyTime: '2026-06-03 10:00', photoName: 'assembly_dev210.jpg', usedMaterials: [], projectId: 'PROJ-004', deliveryPlanId: 'DP-008', locationId: 'LOC-011', preAssignedLocationId: 'LOC-011', erpInboundNo: 'PI-2026-210', erpInspectionNo: 'QC-2026-210', erpInspectionStatus: '合格', erpStockStatus: '已分配', erpSerialNo: 'SN-DEV-210', createdAt: '2026-06-03 10:00', updatedAt: '2026-06-21 14:00' },

  // ── D 在线运营池 · 智魔方（DP-004 已验收）──
  { id: 'DEV-301', sn: 'SN-DEV-301', deviceTypeId: 'DT-001', status: '在线运营', assembler: '王五', assemblyTime: '2026-04-10 10:00', photoName: 'assembly_dev301.jpg', usedMaterials: [], projectId: 'PROJ-001', locationId: 'LOC-001', productionPlanId: 'WPP-005', deliveryPlanId: 'DP-004', erpInboundNo: 'PI-2026-301', erpInspectionNo: 'QC-2026-301', erpInspectionStatus: '合格', erpStockStatus: '合格可用', erpSerialNo: 'SN-DEV-301', batteryPercent: 87, storagePercent: 42, lastHeartbeat: '2026-06-22 08:55', online: true, createdAt: '2026-04-10 10:00', updatedAt: '2026-06-22 08:55' },
  { id: 'DEV-302', sn: 'SN-DEV-302', deviceTypeId: 'DT-001', status: '在线运营', assembler: '赵六', assemblyTime: '2026-04-11 10:00', photoName: 'assembly_dev302.jpg', usedMaterials: [], projectId: 'PROJ-001', locationId: 'LOC-001', productionPlanId: 'WPP-005', deliveryPlanId: 'DP-004', erpInboundNo: 'PI-2026-302', erpInspectionNo: 'QC-2026-302', erpInspectionStatus: '合格', erpStockStatus: '合格可用', erpSerialNo: 'SN-DEV-302', batteryPercent: 93, storagePercent: 30, lastHeartbeat: '2026-06-22 09:02', online: true, createdAt: '2026-04-11 10:00', updatedAt: '2026-06-22 09:02' },
  { id: 'DEV-303', sn: 'SN-DEV-303', deviceTypeId: 'DT-001', status: '在线运营', assembler: '张三', assemblyTime: '2026-04-12 10:00', photoName: 'assembly_dev303.jpg', usedMaterials: [], projectId: 'PROJ-001', locationId: 'LOC-002', productionPlanId: 'WPP-005', deliveryPlanId: 'DP-004', erpInboundNo: 'PI-2026-303', erpInspectionNo: 'QC-2026-303', erpInspectionStatus: '合格', erpStockStatus: '合格可用', erpSerialNo: 'SN-DEV-303', batteryPercent: 62, storagePercent: 71, lastHeartbeat: '2026-06-22 07:30', online: true, createdAt: '2026-04-12 10:00', updatedAt: '2026-06-22 07:30' },
  { id: 'DEV-304', sn: 'SN-DEV-304', deviceTypeId: 'DT-001', status: '在线运营', assembler: '李四', assemblyTime: '2026-04-13 10:00', photoName: 'assembly_dev304.jpg', usedMaterials: [], projectId: 'PROJ-001', locationId: 'LOC-002', productionPlanId: 'WPP-005', deliveryPlanId: 'DP-004', erpInboundNo: 'PI-2026-304', erpInspectionNo: 'QC-2026-304', erpInspectionStatus: '合格', erpStockStatus: '合格可用', erpSerialNo: 'SN-DEV-304', batteryPercent: 18, storagePercent: 55, lastHeartbeat: '2026-06-21 22:10', online: false, createdAt: '2026-04-13 10:00', updatedAt: '2026-06-21 22:10' },
  // ── D 在线运营池 · 华熙生物（DP-005 已验收）──
  { id: 'DEV-305', sn: 'SN-DEV-305', deviceTypeId: 'DT-002', status: '在线运营', assembler: '王五', assemblyTime: '2026-04-15 10:00', photoName: 'assembly_dev305.jpg', usedMaterials: [], projectId: 'PROJ-002', locationId: 'LOC-003', productionPlanId: 'WPP-006', deliveryPlanId: 'DP-005', erpInboundNo: 'PI-2026-305', erpInspectionNo: 'QC-2026-305', erpInspectionStatus: '合格', erpStockStatus: '合格可用', erpSerialNo: 'SN-DEV-305', batteryPercent: 74, storagePercent: 60, lastHeartbeat: '2026-06-22 08:10', online: true, createdAt: '2026-04-15 10:00', updatedAt: '2026-06-22 08:10' },
  { id: 'DEV-306', sn: 'SN-DEV-306', deviceTypeId: 'DT-002', status: '在线运营', assembler: '赵六', assemblyTime: '2026-04-16 10:00', photoName: 'assembly_dev306.jpg', usedMaterials: [], projectId: 'PROJ-002', locationId: 'LOC-003', productionPlanId: 'WPP-006', deliveryPlanId: 'DP-005', erpInboundNo: 'PI-2026-306', erpInspectionNo: 'QC-2026-306', erpInspectionStatus: '合格', erpStockStatus: '合格可用', erpSerialNo: 'SN-DEV-306', batteryPercent: 88, storagePercent: 45, lastHeartbeat: '2026-06-22 08:40', online: true, createdAt: '2026-04-16 10:00', updatedAt: '2026-06-22 08:40' },
  { id: 'DEV-307', sn: 'SN-DEV-307', deviceTypeId: 'DT-002', status: '在线运营', assembler: '张三', assemblyTime: '2026-04-17 10:00', photoName: 'assembly_dev307.jpg', usedMaterials: [], projectId: 'PROJ-002', locationId: 'LOC-004', productionPlanId: 'WPP-006', deliveryPlanId: 'DP-005', erpInboundNo: 'PI-2026-307', erpInspectionNo: 'QC-2026-307', erpInspectionStatus: '合格', erpStockStatus: '合格可用', erpSerialNo: 'SN-DEV-307', batteryPercent: 15, storagePercent: 88, lastHeartbeat: '2026-06-21 23:10', online: false, createdAt: '2026-04-17 10:00', updatedAt: '2026-06-21 23:10' },
  // ── D 在线运营池 · 机场（DP-006 已验收）──
  { id: 'DEV-308', sn: 'SN-DEV-308', deviceTypeId: 'DT-002', status: '在线运营', assembler: '王五', assemblyTime: '2026-04-18 10:00', photoName: 'assembly_dev308.jpg', usedMaterials: [], projectId: 'PROJ-003', locationId: 'LOC-005', productionPlanId: 'WPP-007', deliveryPlanId: 'DP-006', erpInboundNo: 'PI-2026-308', erpInspectionNo: 'QC-2026-308', erpInspectionStatus: '合格', erpStockStatus: '合格可用', erpSerialNo: 'SN-DEV-308', batteryPercent: 66, storagePercent: 52, lastHeartbeat: '2026-06-22 07:55', online: true, createdAt: '2026-04-18 10:00', updatedAt: '2026-06-22 07:55' },
  { id: 'DEV-309', sn: 'SN-DEV-309', deviceTypeId: 'DT-002', status: '在线运营', assembler: '赵六', assemblyTime: '2026-04-19 10:00', photoName: 'assembly_dev309.jpg', usedMaterials: [], projectId: 'PROJ-003', locationId: 'LOC-005', productionPlanId: 'WPP-007', deliveryPlanId: 'DP-006', erpInboundNo: 'PI-2026-309', erpInspectionNo: 'QC-2026-309', erpInspectionStatus: '合格', erpStockStatus: '合格可用', erpSerialNo: 'SN-DEV-309', batteryPercent: 41, storagePercent: 63, lastHeartbeat: '2026-06-22 06:10', online: true, createdAt: '2026-04-19 10:00', updatedAt: '2026-06-22 06:10' },
  { id: 'DEV-310', sn: 'SN-DEV-310', deviceTypeId: 'DT-002', status: '在线运营', assembler: '张三', assemblyTime: '2026-04-20 10:00', photoName: 'assembly_dev310.jpg', usedMaterials: [], projectId: 'PROJ-003', locationId: 'LOC-006', productionPlanId: 'WPP-007', deliveryPlanId: 'DP-006', erpInboundNo: 'PI-2026-310', erpInspectionNo: 'QC-2026-310', erpInspectionStatus: '合格', erpStockStatus: '合格可用', erpSerialNo: 'SN-DEV-310', batteryPercent: 79, storagePercent: 33, lastHeartbeat: '2026-06-22 07:40', online: true, createdAt: '2026-04-20 10:00', updatedAt: '2026-06-22 07:40' },

  // ── E 历史归档池 · 展厅演示（DP-007 已验收后退役，仅保留已关闭历史）──
  { id: 'DEV-401', sn: 'SN-DEV-401', deviceTypeId: 'DT-001', status: '退役', assembler: '张三', assemblyTime: '2026-03-01 10:00', photoName: 'assembly_dev401.jpg', usedMaterials: [], projectId: 'PROJ-005', productionPlanId: 'WPP-008', deliveryPlanId: 'DP-007', erpInboundNo: 'PI-2026-401', erpInspectionNo: 'QC-2026-401', erpInspectionStatus: '合格', erpStockStatus: '已出库', erpSerialNo: 'SN-DEV-401', createdAt: '2026-03-01 10:00', updatedAt: '2026-06-01 18:00' },
  { id: 'DEV-402', sn: 'SN-DEV-402', deviceTypeId: 'DT-001', status: '退役', assembler: '李四', assemblyTime: '2026-03-02 10:00', photoName: 'assembly_dev402.jpg', usedMaterials: [], projectId: 'PROJ-005', productionPlanId: 'WPP-008', deliveryPlanId: 'DP-007', erpInboundNo: 'PI-2026-402', erpInspectionNo: 'QC-2026-402', erpInspectionStatus: '合格', erpStockStatus: '已出库', erpSerialNo: 'SN-DEV-402', createdAt: '2026-03-02 10:00', updatedAt: '2026-06-01 18:00' },
  { id: 'DEV-403', sn: 'SN-DEV-403', deviceTypeId: 'DT-001', status: '退役', assembler: '王五', assemblyTime: '2026-03-03 10:00', photoName: 'assembly_dev403.jpg', usedMaterials: [], projectId: 'PROJ-005', productionPlanId: 'WPP-008', deliveryPlanId: 'DP-007', erpInboundNo: 'PI-2026-403', erpInspectionNo: 'QC-2026-403', erpInspectionStatus: '合格', erpStockStatus: '已出库', erpSerialNo: 'SN-DEV-403', createdAt: '2026-03-03 10:00', updatedAt: '2026-06-05 18:00' },
  { id: 'DEV-404', sn: 'SN-DEV-404', deviceTypeId: 'DT-001', status: '退役', assembler: '赵六', assemblyTime: '2026-03-04 10:00', photoName: 'assembly_dev404.jpg', usedMaterials: [], projectId: 'PROJ-005', productionPlanId: 'WPP-008', deliveryPlanId: 'DP-007', erpInboundNo: 'PI-2026-404', erpInspectionNo: 'QC-2026-404', erpInspectionStatus: '合格', erpStockStatus: '已出库', erpSerialNo: 'SN-DEV-404', createdAt: '2026-03-04 10:00', updatedAt: '2026-06-05 18:00' },

  // ── F 状态覆盖补充池（新项目 PROJ-006/007/008 · 覆盖 device.status 各枚举）──
  // 深圳机场 PROJ-006 / WPP-009（生产阶段：来料→装配→绑定→半成品→初测→中测）
  { id: 'DEV-501', sn: 'SN-DEV-501', deviceTypeId: 'DT-002', status: '来料准备', assembler: '', assemblyTime: '', photoName: '', usedMaterials: [], projectId: 'PROJ-006', productionPlanId: 'WPP-009', placeholder: true, createdAt: '2026-07-01 09:00', updatedAt: '2026-07-08 09:00' },
  { id: 'DEV-502', sn: 'SN-DEV-502', deviceTypeId: 'DT-002', status: '装配中', assembler: '赵六', assemblyTime: '2026-07-02 09:00', photoName: 'assembly_dev502.jpg', usedMaterials: [], projectId: 'PROJ-006', productionPlanId: 'WPP-009', createdAt: '2026-07-02 09:00', updatedAt: '2026-07-08 09:10' },
  { id: 'DEV-503', sn: 'SN-DEV-503', deviceTypeId: 'DT-002', status: '模块绑定中', assembler: '赵六', assemblyTime: '2026-07-02 10:00', photoName: 'assembly_dev503.jpg', usedMaterials: [], projectId: 'PROJ-006', productionPlanId: 'WPP-009', createdAt: '2026-07-02 10:00', updatedAt: '2026-07-08 09:20' },
  { id: 'DEV-504', sn: 'SN-DEV-504', deviceTypeId: 'DT-002', status: '半成品检验中', assembler: '张三', assemblyTime: '2026-07-03 09:00', photoName: 'assembly_dev504.jpg', usedMaterials: [], projectId: 'PROJ-006', productionPlanId: 'WPP-009', createdAt: '2026-07-03 09:00', updatedAt: '2026-07-08 09:30' },
  { id: 'DEV-505', sn: 'SN-DEV-505', deviceTypeId: 'DT-002', status: '初测中', assembler: '王五', assemblyTime: '2026-07-03 10:00', photoName: 'assembly_dev505.jpg', usedMaterials: [], projectId: 'PROJ-006', productionPlanId: 'WPP-009', createdAt: '2026-07-03 10:00', updatedAt: '2026-07-08 09:40' },
  { id: 'DEV-506', sn: 'SN-DEV-506', deviceTypeId: 'DT-002', status: '中测中', assembler: '王五', assemblyTime: '2026-07-04 09:00', photoName: 'assembly_dev506.jpg', usedMaterials: [], projectId: 'PROJ-006', productionPlanId: 'WPP-009', createdAt: '2026-07-04 09:00', updatedAt: '2026-07-08 09:50' },
  // 北京机场 PROJ-007 / WPP-010（测试阶段：OQT→质量测试→NG待返修→生产返修→复测→已完成测试）
  { id: 'DEV-507', sn: 'SN-DEV-507', deviceTypeId: 'DT-002', status: 'OQT中', assembler: '赵六', assemblyTime: '2026-07-04 10:00', photoName: 'assembly_dev507.jpg', usedMaterials: [], projectId: 'PROJ-007', productionPlanId: 'WPP-010', createdAt: '2026-07-04 10:00', updatedAt: '2026-07-08 10:00' },
  { id: 'DEV-508', sn: 'SN-DEV-508', deviceTypeId: 'DT-002', status: '质量测试中', assembler: '王五', assemblyTime: '2026-07-05 09:00', photoName: 'assembly_dev508.jpg', usedMaterials: [], projectId: 'PROJ-007', productionPlanId: 'WPP-010', createdAt: '2026-07-05 09:00', updatedAt: '2026-07-08 10:10' },
  { id: 'DEV-509', sn: 'SN-DEV-509', deviceTypeId: 'DT-002', status: 'NG待返修', assembler: '张三', assemblyTime: '2026-07-05 10:00', photoName: 'assembly_dev509.jpg', usedMaterials: [], projectId: 'PROJ-007', productionPlanId: 'WPP-010', createdAt: '2026-07-05 10:00', updatedAt: '2026-07-08 10:20' },
  { id: 'DEV-510', sn: 'SN-DEV-510', deviceTypeId: 'DT-002', status: '生产返修中', assembler: '赵六', assemblyTime: '2026-07-05 11:00', photoName: 'assembly_dev510.jpg', usedMaterials: [], projectId: 'PROJ-007', productionPlanId: 'WPP-010', createdAt: '2026-07-05 11:00', updatedAt: '2026-07-08 10:30' },
  { id: 'DEV-511', sn: 'SN-DEV-511', deviceTypeId: 'DT-002', status: '复测中', assembler: '王五', assemblyTime: '2026-07-06 09:00', photoName: 'assembly_dev511.jpg', usedMaterials: [], projectId: 'PROJ-007', productionPlanId: 'WPP-010', createdAt: '2026-07-06 09:00', updatedAt: '2026-07-08 10:40' },
  { id: 'DEV-512', sn: 'SN-DEV-512', deviceTypeId: 'DT-002', status: '已完成测试', assembler: '王五', assemblyTime: '2026-07-06 10:00', photoName: 'assembly_dev512.jpg', usedMaterials: [], projectId: 'PROJ-007', productionPlanId: 'WPP-010', createdAt: '2026-07-06 10:00', updatedAt: '2026-07-08 10:50' },
  // HKC PROJ-008 / WPP-011（下游：待入库→已入库→在线运营(未知)→售后中(在线)→已停用→已报废）
  { id: 'DEV-513', sn: 'SN-DEV-513', deviceTypeId: 'DT-001', status: '待入库', assembler: '李四', assemblyTime: '2026-06-20 09:00', photoName: 'assembly_dev513.jpg', usedMaterials: [], projectId: 'PROJ-008', productionPlanId: 'WPP-011', erpInspectionStatus: '待检', erpStockStatus: '待检', createdAt: '2026-06-20 09:00', updatedAt: '2026-07-08 11:00' },
  { id: 'DEV-514', sn: 'SN-DEV-514', deviceTypeId: 'DT-001', status: '已入库', assembler: '李四', assemblyTime: '2026-06-18 09:00', photoName: 'assembly_dev514.jpg', usedMaterials: [], projectId: 'PROJ-008', productionPlanId: 'WPP-011', erpInboundNo: 'PI-2026-514', erpInspectionNo: 'QC-2026-514', erpInspectionStatus: '合格', erpStockStatus: '合格可用', erpSerialNo: 'SN-DEV-514', warehouse: '成品库', inboundTime: '2026-06-28 09:00', createdAt: '2026-06-18 09:00', updatedAt: '2026-06-28 09:00' },
  { id: 'DEV-515', sn: 'SN-DEV-515', deviceTypeId: 'DT-001', status: '在线运营', assembler: '李四', assemblyTime: '2026-05-10 09:00', photoName: 'assembly_dev515.jpg', usedMaterials: [], projectId: 'PROJ-008', productionPlanId: 'WPP-011', erpInboundNo: 'PI-2026-515', erpInspectionNo: 'QC-2026-515', erpInspectionStatus: '合格', erpStockStatus: '合格可用', erpSerialNo: 'SN-DEV-515', batteryPercent: 70, storagePercent: 48, createdAt: '2026-05-10 09:00', updatedAt: '2026-07-08 11:10' },
  { id: 'DEV-516', sn: 'SN-DEV-516', deviceTypeId: 'DT-001', status: '售后中', assembler: '李四', assemblyTime: '2026-05-11 09:00', photoName: 'assembly_dev516.jpg', usedMaterials: [], projectId: 'PROJ-008', productionPlanId: 'WPP-011', erpInboundNo: 'PI-2026-516', erpInspectionNo: 'QC-2026-516', erpInspectionStatus: '合格', erpStockStatus: '合格可用', erpSerialNo: 'SN-DEV-516', batteryPercent: 34, storagePercent: 62, lastHeartbeat: '2026-07-08 08:30', online: true, createdAt: '2026-05-11 09:00', updatedAt: '2026-07-08 11:20' },
  { id: 'DEV-517', sn: 'SN-DEV-517', deviceTypeId: 'DT-001', status: '已停用', assembler: '李四', assemblyTime: '2026-05-12 09:00', photoName: 'assembly_dev517.jpg', usedMaterials: [], projectId: 'PROJ-008', productionPlanId: 'WPP-011', erpInboundNo: 'PI-2026-517', erpInspectionNo: 'QC-2026-517', erpInspectionStatus: '合格', erpStockStatus: '已出库', erpSerialNo: 'SN-DEV-517', online: false, createdAt: '2026-05-12 09:00', updatedAt: '2026-07-05 18:00' },
  { id: 'DEV-518', sn: 'SN-DEV-518', deviceTypeId: 'DT-001', status: '已报废', assembler: '李四', assemblyTime: '2026-05-13 09:00', photoName: 'assembly_dev518.jpg', usedMaterials: [], projectId: 'PROJ-008', productionPlanId: 'WPP-011', erpInboundNo: 'PI-2026-518', erpInspectionNo: 'QC-2026-518', erpInspectionStatus: '合格', erpStockStatus: '已报废', erpSerialNo: 'SN-DEV-518', createdAt: '2026-05-13 09:00', updatedAt: '2026-07-06 18:00' },
];

// ============ 工站测试记录（semi/init/mid/oqt）============
const _STL = { semi: '半成品检验', init: '初测', mid: '中测', oqt: 'OQT终测' };
const _stTT = { semi: '功能测试', init: '功能测试', mid: '老化测试', oqt: '终测' };
function _sRec(did, key, res, time, op, extra = {}) {
  const pass = res === 'Pass';
  const r = { id: `TR-${did}-${key.toUpperCase()}`, deviceId: did, stationKey: key, stationResult: res, testType: _stTT[key], result: pass ? '合格' : '不合格', operator: op, testTime: time, reportFile: pass ? `${key}_${did}.pdf` : '', reportLink: '', notes: pass ? `${_STL[key]}通过` : `${_STL[key]}NG`, status: '有效' };
  if (key === 'mid') { r.duration = pass ? '48小时' : '24小时'; r.peakTemp = pass ? '68°C' : '86°C'; r.anomalyCount = pass ? 0 : 3; }
  return { ...r, ...extra };
}
const _fullPass = (did, day, op = '张三') => [
  _sRec(did, 'semi', 'Pass', `${day} 09:00`, op), _sRec(did, 'init', 'Pass', `${day} 10:30`, op),
  _sRec(did, 'mid', 'Pass', `${day} 13:00`, op), _sRec(did, 'oqt', 'Pass', `${day} 16:00`, op),
];
// 下游（已入库/交付中）设备仅保留 OQT 终测通过记录，避免测试记录冗余
const _oqtPass = (did, day, op = '张三') => [_sRec(did, 'oqt', 'Pass', `${day} 16:00`, op)];
export const testRecords = [
  // WPP-001 演示口径：007 全工站 Pass；008/010 初测 NG（返修中）；013 半成品待测（无记录）；025 中测中（semi/init Pass）
  ..._fullPass('DEV-007', '2026-05-20', '张三'),
  _sRec('DEV-008', 'semi', 'Pass', '2026-05-19 09:00', '张三'),
  _sRec('DEV-008', 'init', 'NG', '2026-05-19 11:00', '王五', { ngReason: '关节电机初始化失败', repairPerson: '赵六', repairAction: '更换关节电机', estimatedCompletion: '2026-06-22' }),
  _sRec('DEV-010', 'semi', 'Pass', '2026-05-19 09:00', '张三'),
  _sRec('DEV-010', 'init', 'NG', '2026-05-19 11:00', '王五', { ngReason: '底盘驱动板通信异常', repairPerson: '赵六', repairAction: '更换驱动板', estimatedCompletion: '2026-06-23' }),
  _sRec('DEV-025', 'semi', 'Pass', '2026-05-24 09:00', '张三'),
  _sRec('DEV-025', 'init', 'Pass', '2026-05-24 11:00', '王五'),
  // WPP-002：014/015 全工站 Pass（待入库）；016 返修后 OQT 重测（semi/init/mid Pass）；017 初测中；018 中测中；019 半成品待测
  ..._fullPass('DEV-014', '2026-06-15', '张三'),
  ..._fullPass('DEV-015', '2026-06-15', '李四'),
  _sRec('DEV-016', 'semi', 'Pass', '2026-06-14 09:00', '张三'),
  _sRec('DEV-016', 'init', 'Pass', '2026-06-14 11:00', '王五'),
  _sRec('DEV-016', 'mid', 'Pass', '2026-06-15 09:00', '王五'),
  _sRec('DEV-016', 'oqt', 'NG', '2026-06-16 15:00', '张三', { ngReason: 'OQT终测导航静态定位误差超限', repairPerson: '李四', repairAction: '重新标定导航参数，返修后重测', estimatedCompletion: '2026-06-22' }),
  _sRec('DEV-017', 'semi', 'Pass', '2026-06-19 09:00', '张三'),
  _sRec('DEV-018', 'semi', 'Pass', '2026-06-16 12:00', '赵六'),
  _sRec('DEV-018', 'init', 'Pass', '2026-06-17 09:00', '王五'),
  // WPP-003（AlphaBot 2）：020/021 装配中（无测试）；022 中测（semi/init Pass）+ mid NG；023 初测中；024 全工站 Pass（已入库）；026 半成品 NG（返修中）
  _sRec('DEV-022', 'semi', 'Pass', '2026-06-16 12:00', '赵六'),
  _sRec('DEV-022', 'init', 'Pass', '2026-06-17 09:00', '王五'),
  _sRec('DEV-022', 'mid', 'NG', '2026-06-21 09:00', '赵六', { ngReason: '驱动电机连续运行温升过快', repairPerson: '张三', repairAction: '清洁散热片并检查风道', estimatedCompletion: '2026-06-24' }),
  _sRec('DEV-023', 'semi', 'Pass', '2026-06-18 09:00', '张三'),
  ..._fullPass('DEV-024', '2026-06-10', '李四'),
  _sRec('DEV-026', 'semi', 'NG', '2026-06-13 09:00', '张三', { ngReason: 'IMU传感器初始化失败', repairPerson: '王五', repairAction: '更换IMU模组', estimatedCompletion: '2026-06-22' }),
  // B 待交付池：OQT 终测通过（生产阶段历史）
  ..._oqtPass('DEV-101', '2026-05-30', '张三'), ..._oqtPass('DEV-102', '2026-05-31', '李四'),
  ..._oqtPass('DEV-103', '2026-06-01', '王五'), ..._oqtPass('DEV-104', '2026-06-02', '赵六'),
  ..._oqtPass('DEV-105', '2026-06-03', '张三'), ..._oqtPass('DEV-106', '2026-06-04', '李四'),
  // C 交付中池：OQT 终测通过（生产阶段历史）
  ..._oqtPass('DEV-201', '2026-05-25', '王五'), ..._oqtPass('DEV-202', '2026-05-26', '赵六'),
  ..._oqtPass('DEV-203', '2026-05-27', '张三'), ..._oqtPass('DEV-204', '2026-05-28', '李四'),
  ..._oqtPass('DEV-205', '2026-05-29', '王五'), ..._oqtPass('DEV-206', '2026-05-30', '赵六'),
  ..._oqtPass('DEV-207', '2026-05-31', '张三'), ..._oqtPass('DEV-208', '2026-06-01', '李四'),
  ..._oqtPass('DEV-209', '2026-06-02', '王五'), ..._oqtPass('DEV-210', '2026-06-03', '赵六'),
  // D 在线运营池：全工站 Pass（生产阶段历史）
  ..._fullPass('DEV-301', '2026-04-10', '王五'), ..._fullPass('DEV-302', '2026-04-11', '赵六'),
  ..._fullPass('DEV-303', '2026-04-12', '张三'), ..._fullPass('DEV-304', '2026-04-13', '李四'),
  ..._fullPass('DEV-305', '2026-04-15', '王五'), ..._fullPass('DEV-306', '2026-04-16', '赵六'),
  ..._fullPass('DEV-307', '2026-04-17', '张三'), ..._fullPass('DEV-308', '2026-04-18', '王五'),
  ..._fullPass('DEV-309', '2026-04-19', '赵六'), ..._fullPass('DEV-310', '2026-04-20', '张三'),
];

// ============ 操作日志（与设备当前生命周期阶段一致）============
const _opSpecs = [
  // 生产中（装配 / 工站测试 / 返修）
  ['DEV-008', '赵六', '2026-05-18 09:00', '装配', null, '半成品检验中', '完成整机装配'],
  ['DEV-008', '王五', '2026-05-19 11:00', '初测不合格', '初测中', '生产返修中', '关节电机初始化失败，转生产返修'],
  ['DEV-010', '李四', '2026-05-19 09:00', '装配', null, '半成品检验中', '完成整机装配'],
  ['DEV-010', '王五', '2026-05-19 11:00', '初测不合格', '初测中', '生产返修中', '底盘驱动板通信异常，转生产返修'],
  ['DEV-013', '张三', '2026-05-22 10:00', '装配', null, '半成品检验中', '完成整机装配，进入半成品检验'],
  ['DEV-025', '王五', '2026-05-24 10:00', '装配', null, '半成品检验中', '完成整机装配'],
  ['DEV-025', '王五', '2026-05-24 11:00', '初测通过', '初测中', '中测中', '初测通过，进入中测'],
  ['DEV-016', '赵六', '2026-06-16 15:00', 'OQT终测不合格', 'OQT终测中', '生产返修中', 'OQT导航定位超限，转返修'],
  ['DEV-016', '李四', '2026-06-20 10:00', '返修完成', '生产返修中', 'OQT终测中', '导航参数重标定完成，返修后重新OQT'],
  ['DEV-022', '赵六', '2026-06-21 09:00', '中测不合格', '中测中', '生产返修中', '驱动电机温升过快，转返修'],
  ['DEV-026', '张三', '2026-06-13 09:00', '半成品检验不合格', '半成品检验中', '生产返修中', 'IMU初始化失败，转返修'],
  ['DEV-007', '王五', '2026-06-08 09:30', '整机入库', 'OQT终测中', '已入库', 'ERP产品检验合格，整机入库'],
  ['DEV-024', '李四', '2026-06-19 10:00', '整机入库', 'OQT终测中', '已入库', 'ERP产品检验合格，整机入库'],
  // 待交付
  ['DEV-101', '张三', '2026-06-10 09:00', '整机入库', 'OQT终测中', '已入库', 'ERP检验合格入库，待交付'],
  ['DEV-104', '赵六', '2026-06-13 09:00', '整机入库', 'OQT终测中', '已入库', 'ERP检验合格入库，待交付'],
  // 交付中（绑定 / 出厂 / 安装）
  ['DEV-203', '赵六', '2026-06-14 14:00', '出厂检验', '已分配项目', '现场安装调试中', '出厂检验合格，现场安装调试'],
  ['DEV-204', '张三', '2026-06-15 15:00', '现场安装调试', '现场安装调试中', '客户验收中', '现场安装调试完成，等待客户验收'],
  ['DEV-206', '赵六', '2026-06-21 14:00', '现场安装调试', '已分配项目', '现场安装调试中', '网络配置异常，安装调试处理中'],
  ['DEV-208', '李四', '2026-06-20 10:00', '出厂检验', '已分配项目', '现场安装调试中', '出厂检验合格，现场安装调试'],
  ['DEV-210', '赵六', '2026-06-21 14:00', '现场安装调试', '已分配项目', '现场安装调试中', '医院现场安装调试中'],
  // 在线运营（上线 / 告警处理）
  ['DEV-301', '张三', '2026-04-22 10:00', '上线运营', '客户验收中', '在线运营', '客户验收通过，上线运营'],
  ['DEV-302', '张三', '2026-04-23 10:00', '上线运营', '客户验收中', '在线运营', '客户验收通过，上线运营'],
  ['DEV-303', '张三', '2026-04-24 10:00', '上线运营', '客户验收中', '在线运营', '客户验收通过，上线运营'],
  ['DEV-305', '李四', '2026-04-25 10:00', '上线运营', '客户验收中', '在线运营', '客户验收通过，上线运营'],
  ['DEV-307', '李四', '2026-04-26 10:00', '上线运营', '客户验收中', '在线运营', '客户验收通过，上线运营'],
  ['DEV-308', '王五', '2026-04-27 10:00', '上线运营', '客户验收中', '在线运营', '客户验收通过，上线运营'],
  ['DEV-310', '王五', '2026-04-28 10:00', '上线运营', '客户验收中', '在线运营', '客户验收通过，上线运营'],
  ['DEV-301', '赵六', '2026-06-19 06:00', '告警处理', '在线运营', '在线运营', '电量低告警，现场充电完成'],
  ['DEV-303', '赵六', '2026-06-21 07:00', '告警处理', '在线运营', '在线运营', '存储清理，定位漂移排查中'],
  ['DEV-307', '赵六', '2026-06-20 14:30', '告警处理', '在线运营', '在线运营', '关节电机过热，已生成工单'],
  // 历史归档（上线 → 退役）
  ['DEV-401', '张三', '2026-03-10 10:00', '上线运营', '客户验收中', '在线运营', '展厅样机上线'],
  ['DEV-401', '张三', '2026-06-01 18:00', '退役', '在线运营', '退役', '展厅改版，样机退役归档'],
  ['DEV-403', '李四', '2026-06-05 18:00', '退役', '在线运营', '退役', '样机退役归档'],
];
export const operationLogs = _opSpecs.map((s, i) => ({ id: `LOG-${String(i + 1).padStart(3, '0')}`, deviceId: s[0], operator: s[1], timestamp: s[2], actionType: s[3], fromStatus: s[4], toStatus: s[5], notes: s[6] }));

export const productionPlans = [
  { id: 'PLAN-001', date: '2026-06-01', target: 3, actual: 3, project: '智魔方项目', projectId: 'PROJ-001', notes: '', erpProductionOrderNo: 'MO-2026-015' },
  { id: 'PLAN-002', date: '2026-06-02', target: 4, actual: 3, project: '智魔方项目', projectId: 'PROJ-001', notes: '一台因零件缺货延期' },
  { id: 'PLAN-003', date: '2026-06-03', target: 4, actual: 4, project: '华熙生物项目', projectId: 'PROJ-002', notes: '' },
  { id: 'PLAN-004', date: '2026-06-04', target: 5, actual: 5, project: '华熙生物项目', projectId: 'PROJ-002', notes: '' },
  { id: 'PLAN-005', date: '2026-06-05', target: 3, actual: 2, project: '智魔方项目', projectId: 'PROJ-001', notes: '设备故障影响产能' },
  { id: 'PLAN-006', date: '2026-06-06', target: 4, actual: 4, project: '机场项目', projectId: 'PROJ-003', notes: '' },
  { id: 'PLAN-007', date: '2026-06-09', target: 4, actual: 3, project: '机场项目', projectId: 'PROJ-003', notes: '' },
  { id: 'PLAN-008', date: '2026-06-10', target: 5, actual: 4, project: '华熙生物项目', projectId: 'PROJ-002', notes: '' },
  { id: 'PLAN-009', date: '2026-06-11', target: 4, actual: 4, project: '智魔方项目', projectId: 'PROJ-001', notes: '' },
  { id: 'PLAN-010', date: '2026-06-16', target: 3, actual: 2, project: '智魔方项目', projectId: 'PROJ-001', notes: '' },
  { id: 'PLAN-011', date: '2026-06-17', target: 4, actual: 3, project: '华熙生物项目', projectId: 'PROJ-002', notes: '加急补单' },
  { id: 'PLAN-012', date: '2026-06-18', target: 2, actual: 1, project: '机场项目', projectId: 'PROJ-003', notes: '' },
  { id: 'PLAN-013', date: '2026-06-21', target: 4, actual: 0, project: '智魔方项目', projectId: 'PROJ-001', notes: '' },
  { id: 'PLAN-014', date: '2026-06-22', target: 3, actual: 0, project: '机场项目', projectId: 'PROJ-003', notes: '新增订单' },
];

// 生产跟踪计划（ProductionPlanDetail / Dashboard / 质量看板）
export const workflowProductionPlans = [
  { id: 'WPP-001', name: '智魔方Q1批次生产', projectId: 'PROJ-001', deviceTypeId: 'DT-001', targetCount: 5, status: '生产中', currentNode: '质量测试', materialReady: true, endDate: '2026-07-10', createdAt: '2026-05-15 09:00', updatedAt: '2026-06-22 09:00', owner: '张三', erpProductionOrderNo: 'MO-2026-015', materialBatchIds: ['BATCH-001', 'BATCH-002', 'BATCH-003'], notes: '智魔方园区A厂房首批，演示生产四节点' },
  { id: 'WPP-002', name: '智魔方Q2补单生产', projectId: 'PROJ-001', deviceTypeId: 'DT-001', targetCount: 6, status: '生产中', currentNode: '质量测试', materialReady: true, endDate: '2026-07-15', createdAt: '2026-06-10 10:00', updatedAt: '2026-06-21 11:00', owner: '张三', erpProductionOrderNo: 'MO-2026-031', erpInboundNo: 'PI-2026-031', erpInspectionNo: 'QC-2026-031', erpStockStatus: '部分合格可用', warehouse: '成品库', materialBatchIds: ['BATCH-009', 'BATCH-017'], notes: '含待入库与OQT返修重测样例' },
  { id: 'WPP-003', name: '华熙生物首批生产', projectId: 'PROJ-002', deviceTypeId: 'DT-002', targetCount: 6, status: '生产中', currentNode: '整机装配', materialReady: true, endDate: '2026-07-31', createdAt: '2026-06-08 09:00', updatedAt: '2026-06-21 16:00', owner: '李四', erpProductionOrderNo: 'MO-2026-038', materialBatchIds: ['BATCH-010', 'BATCH-016', 'BATCH-019'], notes: 'AlphaBot 2 医疗级洁净要求' },
  { id: 'WPP-004', name: '机场项目追加生产', projectId: 'PROJ-003', deviceTypeId: 'DT-001', targetCount: 4, status: '生产中', currentNode: '来料准备', materialReady: false, endDate: '2026-07-25', createdAt: '2026-06-18 14:00', updatedAt: '2026-06-22 09:00', owner: '王五', erpProductionOrderNo: 'MO-2026-042', materialBatchIds: ['BATCH-021', 'BATCH-018'], notes: '仍在来料准备，末端批次退货存在领料缺口' },
  { id: 'WPP-005', name: '智魔方首批已完成', projectId: 'PROJ-001', deviceTypeId: 'DT-001', targetCount: 9, status: '已完成', currentNode: '整机入库', materialReady: true, endDate: '2026-05-20', createdAt: '2026-04-05 09:00', updatedAt: '2026-05-20 18:00', owner: '张三', erpProductionOrderNo: 'MO-2026-008', erpInboundNo: 'PI-2026-008', erpInspectionNo: 'QC-2026-008', erpStockStatus: '合格可用', warehouse: '成品库', materialBatchIds: ['BATCH-008'], notes: '首批交付/在线运营设备来源' },
  { id: 'WPP-006', name: '华熙生物首批已完成', projectId: 'PROJ-002', deviceTypeId: 'DT-002', targetCount: 6, status: '已完成', currentNode: '整机入库', materialReady: true, endDate: '2026-05-25', createdAt: '2026-04-10 09:00', updatedAt: '2026-05-25 18:00', owner: '李四', erpProductionOrderNo: 'MO-2026-022', erpStockStatus: '合格可用', warehouse: '成品库', materialBatchIds: ['BATCH-005'], notes: '华熙交付/在线运营设备来源' },
  { id: 'WPP-007', name: '机场首批已完成', projectId: 'PROJ-003', deviceTypeId: 'DT-002', targetCount: 5, status: '已完成', currentNode: '整机入库', materialReady: true, endDate: '2026-05-28', createdAt: '2026-04-12 10:00', updatedAt: '2026-05-28 18:00', owner: '王五', erpProductionOrderNo: 'MO-2026-028', erpStockStatus: '合格可用', warehouse: '成品库', materialBatchIds: ['BATCH-007'], notes: 'IP65 已通过民航认证，机场交付/在线来源' },
  { id: 'WPP-008', name: '展厅样机历史批次', projectId: 'PROJ-005', deviceTypeId: 'DT-001', targetCount: 4, status: '已完成', currentNode: '整机入库', materialReady: true, endDate: '2026-03-15', createdAt: '2026-02-20 09:00', updatedAt: '2026-03-15 18:00', owner: '张三', erpProductionOrderNo: 'MO-2026-003', erpStockStatus: '合格可用', warehouse: '成品库', materialBatchIds: ['BATCH-006'], notes: '展厅演示样机（已退役归档）来源' },
  { id: 'WPP-009', name: '深圳机场首批生产', projectId: 'PROJ-006', deviceTypeId: 'DT-002', targetCount: 6, status: '生产中', currentNode: '质量测试', materialReady: true, endDate: '2026-06-20', createdAt: '2026-03-02 09:00', updatedAt: '2026-07-08 09:00', owner: '王五', erpProductionOrderNo: 'MO-2026-051', materialBatchIds: ['BATCH-019', 'BATCH-016'], notes: '长期未结批次，endDate 已超期（演示已延期/超期卡点）' },
  { id: 'WPP-010', name: '北京机场首批生产', projectId: 'PROJ-007', deviceTypeId: 'DT-002', targetCount: 6, status: '生产中', currentNode: '质量测试', materialReady: true, endDate: '2026-07-25', createdAt: '2026-06-10 09:00', updatedAt: '2026-07-08 10:00', owner: '王五', erpProductionOrderNo: 'MO-2026-052', materialBatchIds: ['BATCH-017'], notes: '含 OQT/复测/NG 待返修样例' },
  { id: 'WPP-011', name: 'HKC 首批已完成', projectId: 'PROJ-008', deviceTypeId: 'DT-001', targetCount: 6, status: '已完成', currentNode: '整机入库', materialReady: true, endDate: '2026-06-28', createdAt: '2026-05-01 09:00', updatedAt: '2026-06-28 18:00', owner: '李四', erpProductionOrderNo: 'MO-2026-053', erpStockStatus: '合格可用', warehouse: '成品库', materialBatchIds: ['BATCH-008'], notes: 'HKC 在线运营/售后/停用设备来源' },
];

export const materialBatches = [
  { id: 'BATCH-001', batchNo: 'BATCH-2024-001', category: '底盘', model: 'CH-2024-A', supplier: '供应商A', quantity: 2, inspector: '张三', inspectionTime: '2026-05-01 09:30', notes: '', erpPurchaseOrderNo: 'PO-2026-001', items: [{ id: 'MAT-001', sn: 'SN-CHASSIS-001', result: '合格', status: '已占用', notes: '' }, { id: 'MAT-002', sn: 'SN-CHASSIS-002', result: '合格', status: '已占用', notes: '' }] },
  { id: 'BATCH-002', batchNo: 'BATCH-2024-002', category: '机械臂', model: 'ARM-2024-B', supplier: '供应商B', quantity: 3, inspector: '李四', inspectionTime: '2026-05-02 10:00', notes: '', items: [{ id: 'MAT-003', sn: 'SN-ARM-001', result: '合格', status: '已占用', notes: '' }, { id: 'MAT-004', sn: 'SN-ARM-002', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-005', sn: 'SN-ARM-003', result: '不合格', status: '退货换货', notes: '外壳有裂纹' }] },
  { id: 'BATCH-003', batchNo: 'BATCH-2024-003', category: '电机', model: 'MTR-2024-C', supplier: '供应商C', quantity: 3, inspector: '王五', inspectionTime: '2026-05-03 08:30', notes: '', erpPurchaseOrderNo: 'PO-2026-002', items: [{ id: 'MAT-006', sn: 'SN-MOTOR-001', result: '合格', status: '已占用', notes: '' }, { id: 'MAT-007', sn: 'SN-MOTOR-002', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-008', sn: 'SN-MOTOR-003', result: '特批使用', status: '待装配', notes: '噪音略高，特批使用' }] },
  { id: 'BATCH-004', batchNo: 'BATCH-2024-004', category: '末端', model: 'END-2024-D', supplier: '供应商D', quantity: 2, inspector: '张三', inspectionTime: '2026-05-04 09:00', notes: '', items: [{ id: 'MAT-009', sn: 'SN-END-001', result: '合格', status: '已占用', notes: '' }, { id: 'MAT-010', sn: 'SN-END-002', result: '合格', status: '待装配', notes: '' }] },
  { id: 'BATCH-005', batchNo: 'BATCH-2024-005', category: '全身相机', model: 'CAM-2024-E', supplier: '供应商E', quantity: 2, inspector: '李四', inspectionTime: '2026-05-05 10:00', notes: '', items: [{ id: 'MAT-011', sn: 'SN-CAM-001', result: '合格', status: '已占用', notes: '' }, { id: 'MAT-012', sn: 'SN-CAM-002', result: '不合格', status: '退货换货', notes: '图像传感器损坏' }] },
  { id: 'BATCH-006', batchNo: 'BATCH-2024-006', category: '预控', model: 'CTRL-2024-F', supplier: '供应商F', quantity: 2, inspector: '王五', inspectionTime: '2026-05-06 08:00', notes: '', items: [{ id: 'MAT-013', sn: 'SN-CTRL-001', result: '合格', status: '已占用', notes: '' }, { id: 'MAT-014', sn: 'SN-CTRL-002', result: '合格', status: '待装配', notes: '' }] },
  { id: 'BATCH-007', batchNo: 'BATCH-2024-007', category: '电机', model: 'MTR-2024-C', supplier: '供应商C', quantity: 3, inspector: '赵六', inspectionTime: '2026-05-07 09:00', notes: '', items: [{ id: 'MAT-015', sn: 'SN-MOTOR-004', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-016', sn: 'SN-MOTOR-005', result: '合格', status: '已占用', notes: '' }, { id: 'MAT-017', sn: 'SN-MOTOR-006', result: '合格', status: '已占用', notes: '' }] },
  { id: 'BATCH-008', batchNo: 'BATCH-2024-008', category: '底盘', model: 'CH-2024-A', supplier: '供应商A', quantity: 3, inspector: '张三', inspectionTime: '2026-05-10 09:00', notes: '', items: [{ id: 'MAT-018', sn: 'SN-CHASSIS-003', result: '合格', status: '已占用', notes: '' }, { id: 'MAT-019', sn: 'SN-ARM-004', result: '合格', status: '已占用', notes: '' }, { id: 'MAT-020', sn: 'SN-ARM-005', result: '合格', status: '已占用', notes: '' }] },
  { id: 'BATCH-009', batchNo: 'BATCH-2026-009', category: '底盘', model: 'CH-2026-A', supplier: '务实科技', quantity: 3, inspector: '张三', inspectionTime: '2026-05-12 09:00', notes: '', erpPurchaseOrderNo: 'PO-2026-009', erpArrivalNo: 'AN-2026-009', erpDeliveryNo: 'MO-OUT-2026-031-01', warehouse: '生产领料库', overIssued: false, planId: 'WPP-002', items: [{ id: 'MAT-021', sn: 'SN-CHASSIS-004', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-022', sn: 'SN-CHASSIS-005', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-023', sn: 'SN-CHASSIS-006', result: '合格', status: '待装配', notes: '' }] },
  { id: 'BATCH-010', batchNo: 'BATCH-2026-010', category: '机械臂', model: 'ARM-2026-B', supplier: '务实科技', quantity: 3, inspector: '李四', inspectionTime: '2026-05-14 10:00', notes: '超额出库示例：领料数量大于计划用量', erpPurchaseOrderNo: 'PO-2026-010', erpArrivalNo: 'AN-2026-010', erpDeliveryNo: 'MO-OUT-2026-038-02', warehouse: '生产领料库', overIssued: true, planId: 'WPP-003', items: [{ id: 'MAT-024', sn: 'SN-ARM-006', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-025', sn: 'SN-ARM-007', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-026', sn: 'SN-ARM-008', result: '合格', status: '待装配', notes: '' }] },
  { id: 'BATCH-011', batchNo: 'BATCH-2026-011', category: '电机', model: 'MTR-2026-C', supplier: '迈驰驱动', quantity: 3, inspector: '王五', inspectionTime: '2026-05-15 08:30', notes: '1件转子偏心，已退货', items: [{ id: 'MAT-027', sn: 'SN-MOTOR-007', result: '不合格', status: '退货换货', notes: '转子偏心，振动超标' }, { id: 'MAT-028', sn: 'SN-MOTOR-008', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-029', sn: 'SN-MOTOR-009', result: '合格', status: '待装配', notes: '' }] },
  { id: 'BATCH-012', batchNo: 'BATCH-2026-012', category: '末端', model: 'END-2026-D', supplier: '务实科技', quantity: 2, inspector: '赵六', inspectionTime: '2026-05-18 09:00', notes: '', items: [{ id: 'MAT-030', sn: 'SN-END-003', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-031', sn: 'SN-END-004', result: '合格', status: '待装配', notes: '' }] },
  { id: 'BATCH-013', batchNo: 'BATCH-2026-013', category: '全身相机', model: 'CAM-2026-E', supplier: '锐视传感器', quantity: 2, inspector: '张三', inspectionTime: '2026-05-20 10:00', notes: '1件色差偏移，特批使用', items: [{ id: 'MAT-032', sn: 'SN-CAM-003', result: '特批使用', status: '待装配', notes: '色差偏移轻微，特批低照度场景' }, { id: 'MAT-033', sn: 'SN-CAM-004', result: '合格', status: '待装配', notes: '' }] },
  { id: 'BATCH-014', batchNo: 'BATCH-2026-014', category: '预控', model: 'CTRL-2026-F', supplier: '务实科技', quantity: 2, inspector: '李四', inspectionTime: '2026-05-22 08:00', notes: '', items: [{ id: 'MAT-034', sn: 'SN-CTRL-003', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-035', sn: 'SN-CTRL-004', result: '合格', status: '待装配', notes: '' }] },
  { id: 'BATCH-015', batchNo: 'BATCH-2026-015', category: '底盘', model: 'CH-2026-A', supplier: '务实科技', quantity: 2, inspector: '王五', inspectionTime: '2026-05-25 09:00', notes: '整批不合格，焊缝开裂，退货处理', items: [{ id: 'MAT-036', sn: 'SN-CHASSIS-007', result: '不合格', status: '退货换货', notes: '底盘焊缝开裂' }, { id: 'MAT-037', sn: 'SN-CHASSIS-008', result: '不合格', status: '退货换货', notes: '底盘焊缝开裂' }] },
  { id: 'BATCH-016', batchNo: 'BATCH-2026-016', category: '机械臂', model: 'ARM-2026-B', supplier: '务实科技', quantity: 3, inspector: '赵六', inspectionTime: '2026-05-28 09:30', notes: '1件关节间隙偏大，特批低速场景', items: [{ id: 'MAT-038', sn: 'SN-ARM-009', result: '特批使用', status: '待装配', notes: '关节间隙略大，特批低速场景使用' }, { id: 'MAT-039', sn: 'SN-ARM-010', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-040', sn: 'SN-ARM-011', result: '合格', status: '待装配', notes: '' }] },
  { id: 'BATCH-017', batchNo: 'BATCH-2026-017', category: '电机', model: 'MTR-2026-C', supplier: '迈驰驱动', quantity: 3, inspector: '张三', inspectionTime: '2026-06-01 08:00', notes: '', planId: 'WPP-002', items: [{ id: 'MAT-041', sn: 'SN-MOTOR-010', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-042', sn: 'SN-MOTOR-011', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-043', sn: 'SN-MOTOR-012', result: '合格', status: '待装配', notes: '' }] },
  { id: 'BATCH-018', batchNo: 'BATCH-2026-018', category: '末端', model: 'END-2026-D', supplier: '锐视传感器', quantity: 1, inspector: '李四', inspectionTime: '2026-06-03 10:00', notes: '传感器灵敏度不达标，整批退货（WPP-004 领料缺口）', planId: 'WPP-004', items: [{ id: 'MAT-044', sn: 'SN-END-005', result: '不合格', status: '退货换货', notes: '传感器灵敏度不达标' }] },
  { id: 'BATCH-019', batchNo: 'BATCH-2026-019', category: '全身相机', model: 'CAM-2026-E', supplier: '锐视传感器', quantity: 3, inspector: '王五', inspectionTime: '2026-06-05 09:00', notes: '', planId: 'WPP-003', items: [{ id: 'MAT-045', sn: 'SN-CAM-005', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-046', sn: 'SN-CAM-006', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-047', sn: 'SN-CAM-007', result: '合格', status: '待装配', notes: '' }] },
  { id: 'BATCH-020', batchNo: 'BATCH-2026-020', category: '预控', model: 'CTRL-2026-F', supplier: '务实科技', quantity: 2, inspector: '赵六', inspectionTime: '2026-06-08 08:30', notes: '1件固件刷写失败，送修', items: [{ id: 'MAT-048', sn: 'SN-CTRL-005', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-049', sn: 'SN-CTRL-006', result: '合格', status: '维修中', notes: '固件刷写失败，送修' }] },
  { id: 'BATCH-021', batchNo: 'BATCH-2026-021', category: '底盘', model: 'CH-2026-B', supplier: '迈驰驱动', quantity: 2, inspector: '张三', inspectionTime: '2026-06-10 09:00', notes: '1件搬运损坏已报废', planId: 'WPP-004', items: [{ id: 'MAT-050', sn: 'SN-CHASSIS-009', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-051', sn: 'SN-CHASSIS-010', result: '合格', status: '已报废', notes: '搬运中碰撞损坏，无法修复' }] },
  { id: 'BATCH-022', batchNo: 'BATCH-2026-022', category: '电机', model: 'MTR-2026-C', supplier: '迈驰驱动', quantity: 3, inspector: '李四', inspectionTime: '2026-06-15 08:00', notes: '整批停用：编码器批次性缺陷，已作废', voided: true, items: [{ id: 'MAT-052', sn: 'SN-MOTOR-013', result: '合格', status: '已报废', notes: '批次停用' }, { id: 'MAT-053', sn: 'SN-MOTOR-014', result: '合格', status: '已报废', notes: '批次停用' }, { id: 'MAT-054', sn: 'SN-MOTOR-015', result: '合格', status: '维修中', notes: '编码器故障，返厂维修' }] },
];

// ============ 模块实例（SN 级模块库存，供模块库存汇总与一致性校验）============
// 状态：在库可用 / 已锁定生产计划 / 已装配 / 维修中 / 已报废 / 退货换货
const _MI_CATS = [
  ['底盘', 'MT-001', ['BATCH-001', 'BATCH-008', 'BATCH-009', 'BATCH-021']],
  ['机械臂', 'MT-002', ['BATCH-002', 'BATCH-010', 'BATCH-016']],
  ['电机', 'MT-003', ['BATCH-003', 'BATCH-007', 'BATCH-011', 'BATCH-017', 'BATCH-022']],
  ['末端', 'MT-004', ['BATCH-004', 'BATCH-012', 'BATCH-018']],
  ['全身相机', 'MT-005', ['BATCH-005', 'BATCH-013', 'BATCH-019']],
  ['预控', 'MT-006', ['BATCH-006', 'BATCH-014', 'BATCH-020']],
];
const _MI_BIND = ['DEV-007', 'DEV-024', 'DEV-101', 'DEV-102', 'DEV-103', 'DEV-104', 'DEV-105', 'DEV-106', 'DEV-201', 'DEV-202', 'DEV-203', 'DEV-204', 'DEV-205', 'DEV-206', 'DEV-207', 'DEV-208', 'DEV-209', 'DEV-210', 'DEV-301', 'DEV-302', 'DEV-303', 'DEV-304', 'DEV-305', 'DEV-306', 'DEV-307', 'DEV-308', 'DEV-309', 'DEV-310', 'DEV-401', 'DEV-402', 'DEV-403', 'DEV-404'];
const _MI_PLAN = ['WPP-001', 'WPP-002', 'WPP-003'];
function _buildModuleInstances() {
  const out = [];
  const dist = ['在库可用', '在库可用', '在库可用', '在库可用', '在库可用', '在库可用', '在库可用', '已锁定生产计划', '已锁定生产计划', '已装配', '已装配', '已装配', '已装配', '维修中', '已报废', '退货换货'];
  let seq = 0;
  _MI_CATS.forEach(([cat, mt, batches], ci) => {
    for (let k = 0; k < 16; k++) {
      seq += 1;
      const st = dist[k];
      const inst = { id: `MOD-${String(seq).padStart(4, '0')}`, sn: `SN-MOD-${ci + 1}${String(k + 1).padStart(2, '0')}`, moduleTypeId: mt, category: cat, sourceBatchId: batches[k % batches.length], status: st, boundDeviceId: null, lockedPlanId: null };
      if (st === '已装配') inst.boundDeviceId = _MI_BIND[seq % _MI_BIND.length];
      if (st === '已锁定生产计划') inst.lockedPlanId = _MI_PLAN[seq % _MI_PLAN.length];
      out.push(inst);
    }
  });
  return out;
}
// 模块/核心部件状态样例（未绑定 / 已绑定 / 已更换 / 已返修 / 已报废）
const _moduleInstancesExtra = [
  { id: 'MOD-E01', sn: 'SN-MOD-EX-01', moduleTypeId: 'MT-002', category: '机械臂', sourceBatchId: 'BATCH-016', status: '未绑定', boundDeviceId: null, lockedPlanId: null },
  { id: 'MOD-E02', sn: 'SN-MOD-EX-02', moduleTypeId: 'MT-002', category: '机械臂', sourceBatchId: 'BATCH-010', status: '已绑定', boundDeviceId: 'DEV-515', lockedPlanId: null },
  { id: 'MOD-E03', sn: 'SN-MOD-EX-03', moduleTypeId: 'MT-003', category: '电机', sourceBatchId: 'BATCH-007', status: '已更换', boundDeviceId: 'DEV-303', lockedPlanId: null },
  { id: 'MOD-E04', sn: 'SN-MOD-EX-04', moduleTypeId: 'MT-003', category: '电机', sourceBatchId: 'BATCH-017', status: '已返修', boundDeviceId: null, lockedPlanId: null },
  { id: 'MOD-E05', sn: 'SN-MOD-EX-05', moduleTypeId: 'MT-006', category: '预控', sourceBatchId: 'BATCH-020', status: '已报废', boundDeviceId: null, lockedPlanId: null },
];
export const moduleInstances = [..._buildModuleInstances(), ..._moduleInstancesExtra];

// ============ 项目（5 个演示项目）============
export const projects = [
  { id: 'PROJ-001', name: '智魔方项目', projectType: '智魔方', client: '智魔方科技有限公司', contactPerson: '采购负责人', contactPhone: '13800138001', background: '为智魔方科技园区引入智能搬运机器人，提升产线自动化水平。含生产计划、交付计划、在线运营、健康告警、质量问题与售后工单全链路。', notes: '优先保障A厂房产线交付', targetCount: 12, manager: '张三', status: '进行中', erpProjectNo: 'ERP-PJ-2026-001', members: [{ name: '张三', role: '项目负责人' }, { name: '李四', role: '生产协同' }, { name: '王五', role: '质量协同' }, { name: '赵六', role: '交付协同' }, { name: '蔡八', role: 'ERP 协同' }], createdAt: '2026-04-05 09:00', updatedAt: '2026-06-22 10:00' },
  { id: 'PROJ-002', name: '华熙生物项目', projectType: '工业场景', client: '华熙生物科技股份有限公司', contactPerson: '项目对接人', contactPhone: '13900139002', background: '为华熙生物园区部署 AlphaBot 2 智能物流机器人，含 AlphaBot 2 生产计划、交付中计划、在线运营设备与交付质量问题。', notes: '需满足生物园区洁净环境要求', targetCount: 8, manager: '李四', status: '进行中', erpProjectNo: 'ERP-PJ-2026-002', members: [{ name: '李四', role: '项目负责人' }, { name: '王五', role: '生产协同' }, { name: '赵六', role: '质量协同' }, { name: '张三', role: '交付协同' }, { name: '蔡八', role: 'ERP 协同' }], createdAt: '2026-04-10 10:00', updatedAt: '2026-06-22 09:00' },
  { id: 'PROJ-003', name: '机场项目', projectType: '机场', client: '首都国际机场集团', contactPerson: '运营负责人', contactPhone: '13700137003', background: '在机场航站楼部署巡检机器人，含追加生产计划、T3 试点交付、T2 点位部署中。', notes: '防护等级需IP65以上，需通过民航安全认证', targetCount: 8, manager: '王五', status: '进行中', erpProjectNo: 'ERP-PJ-2026-003', members: [{ name: '王五', role: '项目负责人' }, { name: '赵六', role: '生产协同' }, { name: '张三', role: '质量协同' }, { name: '李四', role: '售后协同' }], createdAt: '2026-04-12 10:00', updatedAt: '2026-06-21 15:00' },
  { id: 'PROJ-004', name: '医疗康养项目', projectType: '遥操数采', client: '深圳南山医院', contactPerson: '设备科负责人', contactPhone: '13500135005', background: '院内药品、耗材、检验样本跨楼层配送。以待交付/待绑定设备池为主，含少量未关闭交付工单。', notes: '电梯联动接口暂未开放，先做单楼层闭环演示', targetCount: 4, manager: '赵六', status: '进行中', members: [{ name: '赵六', role: '项目负责人' }, { name: '张三', role: '生产协同' }, { name: '李四', role: '只读成员' }], createdAt: '2026-06-01 11:00', updatedAt: '2026-06-21 14:00' },
  { id: 'PROJ-005', name: '展厅演示项目', projectType: '智魔方', client: '内部展厅', contactPerson: '品牌部', contactPhone: '13300133007', background: '展厅样机演示项目，承载历史关闭质量问题、已关闭工单、已停用点位与退役归档设备样例，不影响主流程看板。', notes: '仅用于历史/归档演示', targetCount: 4, manager: '张三', status: '进行中', erpProjectNo: 'ERP-PJ-2026-005', members: [{ name: '张三', role: '项目负责人' }, { name: '李四', role: '只读成员' }], createdAt: '2026-02-20 09:00', updatedAt: '2026-06-05 18:00' },
  { id: 'PROJ-006', name: '深圳机场项目', projectType: '机场', client: '深圳宝安国际机场', contactPerson: '航站楼运营部', contactPhone: '13600136006', background: '为深圳宝安国际机场 T3 航站楼部署智能巡检与引导机器人，覆盖生产、交付与在线运营全链路。', notes: '需满足机场安检与IP65防护要求', targetCount: 6, manager: '王五', status: '进行中', erpProjectNo: 'ERP-PJ-2026-006', members: [{ name: '王五', role: '项目负责人' }, { name: '赵六', role: '生产协同' }, { name: '张三', role: '质量协同' }, { name: '蔡八', role: 'ERP 协同' }], createdAt: '2026-03-02 09:00', updatedAt: '2026-07-08 10:00' },
  { id: 'PROJ-007', name: '北京机场项目', projectType: '机场', client: '北京大兴国际机场', contactPerson: '设备管理处', contactPhone: '13600136007', background: '为北京大兴国际机场部署引导与配送机器人，含新增生产计划与在线运营健康监测。', notes: '大兴航站楼跨区域巡检，需通过民航认证', targetCount: 6, manager: '王五', status: '进行中', erpProjectNo: 'ERP-PJ-2026-007', members: [{ name: '王五', role: '项目负责人' }, { name: '李四', role: '生产协同' }, { name: '赵六', role: '售后协同' }, { name: '蔡八', role: 'ERP 协同' }], createdAt: '2026-05-06 09:00', updatedAt: '2026-07-08 11:00' },
  { id: 'PROJ-008', name: 'HKC 项目', projectType: '工业场景', client: 'HKC 科技', contactPerson: '智能制造部', contactPhone: '13600136008', background: '为 HKC 科技面板产线部署物料搬运与在线质量巡检机器人，含在线运营、售后与停用报废样例。', notes: '面板车间洁净与防静电要求', targetCount: 6, manager: '李四', status: '进行中', erpProjectNo: 'ERP-PJ-2026-008', members: [{ name: '李四', role: '项目负责人' }, { name: '王五', role: '生产协同' }, { name: '赵六', role: '运维协同' }, { name: '陈九', role: 'ERP 协同' }], createdAt: '2026-05-20 09:00', updatedAt: '2026-07-08 12:00' },
];

export const deviceAllocations = [
  { id: 'ALLOC-001', deviceId: 'DEV-201', projectId: 'PROJ-001', allocatedBy: '张三', allocatedAt: '2026-06-05 09:00', notes: '首批交付分配', type: '分配', fromProjectId: null },
  { id: 'ALLOC-002', deviceId: 'DEV-204', projectId: 'PROJ-001', allocatedBy: '张三', allocatedAt: '2026-06-05 09:10', notes: '首批交付分配', type: '分配', fromProjectId: null },
  { id: 'ALLOC-003', deviceId: 'DEV-205', projectId: 'PROJ-002', allocatedBy: '李四', allocatedAt: '2026-06-06 09:00', notes: '华熙首批分配', type: '分配', fromProjectId: null },
  { id: 'ALLOC-004', deviceId: 'DEV-208', projectId: 'PROJ-003', allocatedBy: '王五', allocatedAt: '2026-06-07 09:00', notes: '机场试点分配', type: '分配', fromProjectId: null },
  { id: 'ALLOC-005', deviceId: 'DEV-301', projectId: 'PROJ-001', allocatedBy: '张三', allocatedAt: '2026-04-08 09:00', notes: '首批上线设备', type: '分配', fromProjectId: null },
  { id: 'ALLOC-006', deviceId: 'DEV-305', projectId: 'PROJ-002', allocatedBy: '李四', allocatedAt: '2026-04-13 09:00', notes: '华熙上线设备', type: '分配', fromProjectId: null },
  { id: 'ALLOC-007', deviceId: 'DEV-308', projectId: 'PROJ-003', allocatedBy: '王五', allocatedAt: '2026-04-16 09:00', notes: '机场上线设备', type: '分配', fromProjectId: null },
  { id: 'ALLOC-008', deviceId: 'DEV-209', projectId: 'PROJ-004', allocatedBy: '赵六', allocatedAt: '2026-06-08 09:00', notes: '医疗康养首批分配', type: '分配', fromProjectId: null },
  { id: 'ALLOC-009', deviceId: 'DEV-210', projectId: 'PROJ-004', allocatedBy: '赵六', allocatedAt: '2026-06-08 09:10', notes: '医疗康养首批分配', type: '分配', fromProjectId: null },
];

export const deliveryRecords = [
  { id: 'DELIV-001', deviceId: 'DEV-203', projectId: 'PROJ-001', stage: '出厂检验', result: '合格', operator: '赵六', recordTime: '2026-06-13 10:00', notes: '各项指标正常', address: '' },
  { id: 'DELIV-002', deviceId: 'DEV-203', projectId: 'PROJ-001', stage: '现场安装调试', result: '通过', operator: '赵六', recordTime: '2026-06-14 14:00', notes: '安装顺利，调试进行中', address: '广州市天河区天环广场' },
  { id: 'DELIV-003', deviceId: 'DEV-204', projectId: 'PROJ-001', stage: '出厂检验', result: '合格', operator: '张三', recordTime: '2026-06-12 10:00', notes: '', address: '' },
  { id: 'DELIV-004', deviceId: 'DEV-204', projectId: 'PROJ-001', stage: '现场安装调试', result: '通过', operator: '王五', recordTime: '2026-06-15 10:00', notes: '安装调试完成，待客户验收', address: '北京市朝阳区大悦城' },
  { id: 'DELIV-005', deviceId: 'DEV-205', projectId: 'PROJ-002', stage: '出厂检验', result: '未通过', operator: '张三', recordTime: '2026-06-19 09:00', notes: 'IP65密封性不足，已生成交付工单', address: '' },
  { id: 'DELIV-006', deviceId: 'DEV-208', projectId: 'PROJ-003', stage: '出厂检验', result: '合格', operator: '王五', recordTime: '2026-06-15 11:00', notes: '防护等级IP65验证通过', address: '' },
  { id: 'DELIV-007', deviceId: 'DEV-301', projectId: 'PROJ-001', stage: '客户验收', result: '通过', operator: '张三', recordTime: '2026-04-21 15:00', notes: '客户满意，签署验收单', address: '深圳市南山区海岸城' },
  { id: 'DELIV-008', deviceId: 'DEV-305', projectId: 'PROJ-002', stage: '客户验收', result: '通过', operator: '李四', recordTime: '2026-04-24 15:00', notes: '洁净环境验收通过', address: '北京市朝阳区三里屯' },
  { id: 'DELIV-009', deviceId: 'DEV-308', projectId: 'PROJ-003', stage: '客户验收', result: '通过', operator: '王五', recordTime: '2026-04-26 15:00', notes: '民航验收通过', address: '首都国际机场T3航站楼A区' },
  { id: 'DELIV-010', deviceId: 'DEV-210', projectId: 'PROJ-004', stage: '现场安装调试', result: '通过', operator: '赵六', recordTime: '2026-06-21 14:00', notes: '医院单楼层闭环安装中', address: '深圳市南山医院A栋' },
];

// ============ 健康告警 ============
// 只引用在线运营 / 交付后设备（轻微=低，严重=高）。
// 集中在 6 台在线设备（301/303/305/307/308/310）以覆盖“有未关闭告警”，
// 另 4 台在线设备（302/304/306/309）无告警，用于演示台账“无告警”置灰。
// alert.workOrderId 指向的售后工单必须与 alert.deviceId 为同一台设备。
const _nu = (n, r) => ({ name: n, role: r });
export const alerts = [
  // DEV-301（智魔方·海岸城）：1 未关闭 + 1 历史
  { id: 'ALERT-001', deviceId: 'DEV-301', projectId: 'PROJ-001', deviceSN: 'SN-DEV-301', alertType: '电池异常', alertTime: '2026-06-22 02:05', source: '系统自动', severity: '轻微', description: '电池电量低于20%，建议及时充电', status: '待处理', workOrderId: null, notifiedAt: '2026-06-22 02:06', notifyStatus: '已送达', notifiedUsers: [_nu('赵六', '运维工程师'), _nu('蔡八', '项目负责人')], processLogs: [] },
  { id: 'ALERT-002', deviceId: 'DEV-301', projectId: 'PROJ-001', deviceSN: 'SN-DEV-301', alertType: '机械结构', alertTime: '2026-06-15 09:00', source: '系统自动', severity: '轻微', description: '机械臂关节润滑度不足，运行摩擦力增大', status: '已解决', workOrderId: null, notifiedAt: '2026-06-15 09:01', notifyStatus: '已送达', notifiedUsers: [_nu('赵六', '运维工程师'), _nu('蔡八', '项目负责人')], processLogs: [{ operator: '赵六', time: '2026-06-15 10:00', fromStatus: '待处理', toStatus: '处理中', notes: '现场补充润滑' }, { operator: '赵六', time: '2026-06-15 12:00', fromStatus: '处理中', toStatus: '已解决', notes: '摩擦力恢复正常' }] },
  // DEV-303（智魔方·万象城）：1 未关闭（关联工单 WO-001）+ 1 历史
  { id: 'ALERT-003', deviceId: 'DEV-303', projectId: 'PROJ-001', deviceSN: 'SN-DEV-303', alertType: '温度异常', alertTime: '2026-06-20 14:15', source: '系统自动', severity: '严重', description: '关节电机温升偏高，温度达88°C', status: '工单处理中', workOrderId: 'WO-001', notifiedAt: '2026-06-20 14:16', notifyStatus: '已送达', notifiedUsers: [_nu('赵六', '运维工程师'), _nu('李七', '厂长')], processLogs: [{ operator: '赵六', time: '2026-06-20 14:30', fromStatus: '待处理', toStatus: '已生成工单', notes: '严重告警，已生成换件工单 WO-001' }] },
  { id: 'ALERT-004', deviceId: 'DEV-303', projectId: 'PROJ-001', deviceSN: 'SN-DEV-303', alertType: '其他', alertTime: '2026-06-12 22:40', source: '系统自动', severity: '轻微', description: '存储空间使用率超过70%，建议清理日志', status: '已关闭', workOrderId: null, notifiedAt: '2026-06-12 22:41', notifyStatus: '已送达', notifiedUsers: [_nu('赵六', '运维工程师'), _nu('蔡八', '项目负责人')], processLogs: [{ operator: '赵六', time: '2026-06-13 07:00', fromStatus: '待处理', toStatus: '处理中', notes: '远程清理日志' }, { operator: '赵六', time: '2026-06-13 09:00', fromStatus: '处理中', toStatus: '已关闭', notes: '存储恢复正常' }] },
  // DEV-305（华熙·三里屯）：1 未关闭
  { id: 'ALERT-005', deviceId: 'DEV-305', projectId: 'PROJ-002', deviceSN: 'SN-DEV-305', alertType: '通信中断', alertTime: '2026-06-21 06:10', source: '系统自动', severity: '轻微', description: '导航模块定位漂移，偏差超过阈值0.3m', status: '处理中', workOrderId: null, notifiedAt: '2026-06-21 06:11', notifyStatus: '已送达', notifiedUsers: [_nu('赵六', '运维工程师'), _nu('蔡八', '项目负责人')], processLogs: [{ operator: '赵六', time: '2026-06-21 07:00', fromStatus: '待处理', toStatus: '处理中', notes: '正在排查定位漂移，可能是地图数据老化' }] },
  // DEV-307（华熙·王府井）：1 未关闭（关联工单 WO-008）+ 1 历史
  { id: 'ALERT-006', deviceId: 'DEV-307', projectId: 'PROJ-002', deviceSN: 'SN-DEV-307', alertType: '温度异常', alertTime: '2026-06-20 14:15', source: '系统自动', severity: '严重', description: '关节3电机过热，温度达到92°C，超过阈值', status: '已生成工单', workOrderId: 'WO-008', notifiedAt: '2026-06-20 14:16', notifyStatus: '已送达', notifiedUsers: [_nu('赵六', '运维工程师'), _nu('李七', '厂长')], processLogs: [{ operator: '赵六', time: '2026-06-20 14:30', fromStatus: '待处理', toStatus: '已生成工单', notes: '严重告警，已生成换件工单 WO-008' }] },
  { id: 'ALERT-007', deviceId: 'DEV-307', projectId: 'PROJ-002', deviceSN: 'SN-DEV-307', alertType: '传感器异常', alertTime: '2026-06-15 08:55', source: '系统自动', severity: '轻微', description: '语音播报模块偶发无声', status: '已解决', workOrderId: null, notifiedAt: '2026-06-15 08:56', notifyStatus: '已送达', notifiedUsers: [_nu('赵六', '运维工程师'), _nu('蔡八', '项目负责人')], processLogs: [{ operator: '赵六', time: '2026-06-15 10:00', fromStatus: '待处理', toStatus: '处理中', notes: '扬声器积灰，清洁中' }, { operator: '赵六', time: '2026-06-16 09:00', fromStatus: '处理中', toStatus: '已解决', notes: '清洁后恢复正常' }] },
  // DEV-308（机场·T3 A区）：2 未关闭（其一关联工单 WO-005）
  { id: 'ALERT-008', deviceId: 'DEV-308', projectId: 'PROJ-003', deviceSN: 'SN-DEV-308', alertType: '通信中断', alertTime: '2026-06-21 01:05', source: '系统自动', severity: '严重', description: '预控模组通信中断超过5分钟', status: '工单处理中', workOrderId: 'WO-005', notifiedAt: '2026-06-21 01:06', notifyStatus: '已送达', notifiedUsers: [_nu('赵六', '运维工程师'), _nu('李七', '厂长')], processLogs: [{ operator: '赵六', time: '2026-06-21 01:10', fromStatus: '待处理', toStatus: '已生成工单', notes: '严重告警，已生成软件问题工单 WO-005' }] },
  { id: 'ALERT-009', deviceId: 'DEV-308', projectId: 'PROJ-003', deviceSN: 'SN-DEV-308', alertType: '传感器异常', alertTime: '2026-06-22 07:40', source: '人工上报', severity: '轻微', description: '巡检摄像头偶发花屏，需现场检查', status: '待处理', workOrderId: null, notifiedAt: '2026-06-22 07:41', notifyStatus: '已送达', notifiedUsers: [_nu('赵六', '运维工程师'), _nu('蔡八', '项目负责人')], processLogs: [] },
  // DEV-310（机场·T3 B区）：1 未关闭 + 1 历史
  { id: 'ALERT-010', deviceId: 'DEV-310', projectId: 'PROJ-003', deviceSN: 'SN-DEV-310', alertType: '机械结构', alertTime: '2026-06-22 07:55', source: '人工上报', severity: '严重', description: '主控板过压保护触发，设备紧急停机', status: '待处理', workOrderId: null, notifiedAt: '2026-06-22 07:56', notifyStatus: '已送达', notifiedUsers: [_nu('赵六', '运维工程师'), _nu('李七', '厂长')], processLogs: [] },
  { id: 'ALERT-011', deviceId: 'DEV-310', projectId: 'PROJ-003', deviceSN: 'SN-DEV-310', alertType: '其他', alertTime: '2026-06-14 18:30', source: '系统自动', severity: '轻微', description: '末端执行器抓取精度下降，误差约±2mm', status: '已关闭', workOrderId: null, notifiedAt: '2026-06-14 18:31', notifyStatus: '已送达', notifiedUsers: [_nu('赵六', '运维工程师'), _nu('蔡八', '项目负责人')], processLogs: [{ operator: '李四', time: '2026-06-14 20:00', fromStatus: '待处理', toStatus: '处理中', notes: '重新标定末端' }, { operator: '李四', time: '2026-06-15 09:00', fromStatus: '处理中', toStatus: '已关闭', notes: '精度恢复正常' }] },
  // 历史归档设备的已关闭告警（交付后退役设备，仅保留历史）
  { id: 'ALERT-012', deviceId: 'DEV-401', projectId: 'PROJ-005', deviceSN: 'SN-DEV-401', alertType: '电池异常', alertTime: '2026-05-10 10:00', source: '系统自动', severity: '轻微', description: '展厅样机电量偏低提醒', status: '已关闭', workOrderId: null, notifiedAt: '2026-05-10 10:01', notifyStatus: '已送达', notifiedUsers: [_nu('赵六', '运维工程师')], processLogs: [{ operator: '赵六', time: '2026-05-10 12:00', fromStatus: '待处理', toStatus: '已关闭', notes: '样机退役归档前已闭环' }] },
  { id: 'ALERT-013', deviceId: 'DEV-402', projectId: 'PROJ-005', deviceSN: 'SN-DEV-402', alertType: '其他', alertTime: '2026-05-12 10:00', source: '系统自动', severity: '严重', description: '展厅样机主控偶发重启', status: '已关闭', workOrderId: 'WO-009', notifiedAt: '2026-05-12 10:01', notifyStatus: '已送达', notifiedUsers: [_nu('赵六', '运维工程师'), _nu('李七', '厂长')], processLogs: [{ operator: '赵六', time: '2026-05-12 11:00', fromStatus: '待处理', toStatus: '已生成工单', notes: '已生成工单 WO-009' }, { operator: '李四', time: '2026-05-20 17:00', fromStatus: '工单处理中', toStatus: '已关闭', notes: '样机退役，工单归档关闭' }] },
  // 健康告警状态覆盖（引用在线运营设备 DEV-515/516）：待处理/工单处理中/已生成问题/已生成售后工单/已关闭
  { id: 'ALERT-014', deviceId: 'DEV-516', projectId: 'PROJ-008', deviceSN: 'SN-DEV-516', alertType: '电池异常', alertTime: '2026-07-08 02:05', source: '系统自动', severity: '轻微', description: '电池电量低于35%，建议及时充电', status: '待处理', workOrderId: null, notifiedAt: '2026-07-08 02:06', notifyStatus: '已送达', notifiedUsers: [_nu('赵六', '运维工程师'), _nu('蔡八', '项目负责人')], processLogs: [] },
  { id: 'ALERT-015', deviceId: 'DEV-516', projectId: 'PROJ-008', deviceSN: 'SN-DEV-516', alertType: '温度异常', alertTime: '2026-07-07 14:15', source: '系统自动', severity: '严重', description: '关节电机温升偏高，已派发售后工单现场处理', status: '工单处理中', workOrderId: 'WO-014', notifiedAt: '2026-07-07 14:16', notifyStatus: '已送达', notifiedUsers: [_nu('赵六', '运维工程师'), _nu('李七', '厂长')], processLogs: [{ operator: '赵六', time: '2026-07-07 14:30', fromStatus: '待处理', toStatus: '工单处理中', notes: '已生成售后工单 WO-014，现场处理中' }] },
  { id: 'ALERT-016', deviceId: 'DEV-515', projectId: 'PROJ-008', deviceSN: 'SN-DEV-515', alertType: '传感器异常', alertTime: '2026-07-07 09:00', source: '人工上报', severity: '轻微', description: '巡检相机偶发花屏，已登记为质量问题', status: '已生成问题', workOrderId: null, linkedIssueId: 'QI-001', notifiedAt: '2026-07-07 09:01', notifyStatus: '已送达', notifiedUsers: [_nu('赵六', '运维工程师'), _nu('蔡八', '项目负责人')], processLogs: [{ operator: '赵六', time: '2026-07-07 09:30', fromStatus: '待处理', toStatus: '已生成问题', notes: '已登记质量问题 QI-001' }] },
  { id: 'ALERT-017', deviceId: 'DEV-516', projectId: 'PROJ-008', deviceSN: 'SN-DEV-516', alertType: '通信中断', alertTime: '2026-07-06 06:10', source: '系统自动', severity: '严重', description: '预控通信中断，已生成售后工单待接单', status: '已生成售后工单', workOrderId: 'WO-012', notifiedAt: '2026-07-06 06:11', notifyStatus: '已送达', notifiedUsers: [_nu('赵六', '运维工程师'), _nu('李七', '厂长')], processLogs: [{ operator: '赵六', time: '2026-07-06 06:30', fromStatus: '待处理', toStatus: '已生成售后工单', notes: '已生成售后工单 WO-012' }] },
  { id: 'ALERT-018', deviceId: 'DEV-515', projectId: 'PROJ-008', deviceSN: 'SN-DEV-515', alertType: '其他', alertTime: '2026-07-01 18:30', source: '系统自动', severity: '轻微', description: '存储使用率超过70%，远程清理后恢复', status: '已关闭', workOrderId: null, notifiedAt: '2026-07-01 18:31', notifyStatus: '已送达', notifiedUsers: [_nu('赵六', '运维工程师'), _nu('蔡八', '项目负责人')], processLogs: [{ operator: '赵六', time: '2026-07-01 19:00', fromStatus: '待处理', toStatus: '处理中', notes: '远程清理日志' }, { operator: '赵六', time: '2026-07-01 20:00', fromStatus: '处理中', toStatus: '已关闭', notes: '存储恢复正常' }] },
];

// ============ 售后工单（仅在线运营/历史归档设备；不含生产测试 NG）============
export const workOrders = [
  { id: 'WO-001', woClass: '换件工单', involvesReplacement: true, needReplaceModuleType: '电机模块', oldModuleSN: '待确认', newModuleSN: '待选择', newModuleStockStatus: '待选择', deviceId: 'DEV-303', deviceSN: 'SN-DEV-303', projectId: 'PROJ-001', description: '关节电机温升偏高，需检查散热并评估更换', severity: '中', status: '处理中', assignedTo: '王五', createdAt: '2026-06-20 14:30', updatedAt: '2026-06-20 16:00', closedAt: null, repairActions: '已到现场，正在拆除散热模组检查', replacedModules: [], recheckResult: null, notes: '散热风扇异物堵塞' },
  { id: 'WO-002', woClass: '其他问题工单', involvesReplacement: false, deviceId: 'DEV-301', deviceSN: 'SN-DEV-301', projectId: 'PROJ-001', description: '末端执行器抓取精度异常，超出允许误差范围', severity: '中', status: '待处理', assignedTo: '赵六', createdAt: '2026-06-21 09:00', updatedAt: '2026-06-21 09:00', closedAt: null, repairActions: '', replacedModules: [], recheckResult: null, notes: '标定参数疑似偏移' },
  { id: 'WO-003', woClass: '换件工单', involvesReplacement: true, needReplaceModuleType: '机械臂模块', oldModuleSN: 'SN-ARM-001', newModuleSN: 'SN-ARM-002', newModuleStockStatus: '已选择（在库可用）', deviceId: 'DEV-301', deviceSN: 'SN-DEV-301', projectId: 'PROJ-001', description: '机械臂关节2抖动明显，定位精度异常', severity: '中', status: '复检中', assignedTo: '王五', recheckPerson: '李四', createdAt: '2026-06-11 10:00', updatedAt: '2026-06-18 14:30', closedAt: null, repairActions: '重新校准关节编码器，更换磨损轴承衬套', replacedModules: [{ removedMaterialId: 'MAT-003', addedMaterialId: 'MAT-004', moduleTypeId: 'MT-002' }], recheckResult: null, notes: '关节2齿轮轻微磨损' },
  { id: 'WO-004', woClass: '软件问题工单', involvesReplacement: false, softwareVersion: 'v2.3.1', deviceId: 'DEV-305', deviceSN: 'SN-DEV-305', projectId: 'PROJ-002', description: '设备在低电量时异常重启', severity: '高', status: '待处理', assignedTo: '', createdAt: '2026-06-20 09:00', updatedAt: '2026-06-20 09:00', closedAt: null, repairActions: '', replacedModules: [], recheckResult: null, notes: '' },
  { id: 'WO-005', woClass: '软件问题工单', involvesReplacement: false, softwareVersion: 'v2.3.0', deviceId: 'DEV-308', deviceSN: 'SN-DEV-308', projectId: 'PROJ-003', description: '预控模组通信中断，设备无法接收指令', severity: '高', status: '处理中', assignedTo: '李四', createdAt: '2026-06-21 01:10', updatedAt: '2026-06-21 09:00', closedAt: null, repairActions: '排查预控网络固件，尝试升级', replacedModules: [], recheckResult: null, notes: '来自告警 ALERT-009' },
  { id: 'WO-006', woClass: '其他问题工单', involvesReplacement: false, deviceId: 'DEV-310', deviceSN: 'SN-DEV-310', projectId: 'PROJ-003', description: '末端抓取精度下降，标定参数偏移', severity: '低', status: '已关闭', assignedTo: '李四', createdAt: '2026-06-16 12:00', updatedAt: '2026-06-18 17:00', closedAt: '2026-06-18 17:00', repairActions: '重新标定末端执行器，精度恢复正常', replacedModules: [], recheckResult: '合格', recheckPerson: '张三', notes: '标定参数偏移，已重置' },
  { id: 'WO-007', woClass: '软件问题工单', involvesReplacement: false, softwareVersion: 'v2.3.1', deviceId: 'DEV-302', deviceSN: 'SN-DEV-302', projectId: 'PROJ-001', description: '导航地图更新失败，设备反复回到原点', severity: '低', status: '已关闭', assignedTo: '张三', createdAt: '2026-06-15 09:00', updatedAt: '2026-06-15 14:00', closedAt: '2026-06-15 14:00', repairActions: '远程推送新地图固件，重新建图完成', replacedModules: [], recheckResult: '合格', recheckPerson: '李四', notes: '固件版本不兼容导致' },
  { id: 'WO-008', woClass: '换件工单', involvesReplacement: true, needReplaceModuleType: '电机模块', oldModuleSN: '待确认', newModuleSN: '待选择', newModuleStockStatus: '待选择', deviceId: 'DEV-307', deviceSN: 'SN-DEV-307', projectId: 'PROJ-002', description: '关节3电机过热，温度达92°C，需更换电机模块', severity: '高', status: '处理中', assignedTo: '王五', createdAt: '2026-06-20 14:30', updatedAt: '2026-06-20 16:00', closedAt: null, repairActions: '拆检散热模组，确认电机绕组老化', replacedModules: [], recheckResult: null, notes: '来自告警 ALERT-007' },
  { id: 'WO-009', woClass: '其他问题工单', involvesReplacement: false, deviceId: 'DEV-402', deviceSN: 'SN-DEV-402', projectId: 'PROJ-005', description: '展厅样机主控偶发重启，退役前排查', severity: '中', status: '已关闭', assignedTo: '李四', createdAt: '2026-05-12 11:00', updatedAt: '2026-05-20 17:00', closedAt: '2026-05-20 17:00', repairActions: '刷写稳定固件，观察后归档', replacedModules: [], recheckResult: '合格', recheckPerson: '张三', notes: '样机退役归档' },
  { id: 'WO-010', woClass: '换件工单', involvesReplacement: true, needReplaceModuleType: '底盘模块', oldModuleSN: '待确认', newModuleSN: '待选择', newModuleStockStatus: '不涉及', deviceId: 'DEV-401', deviceSN: 'SN-DEV-401', projectId: 'PROJ-005', description: '展厅样机底盘异响，评估后决定退役不再维修', severity: '低', status: '已作废', assignedTo: '赵六', createdAt: '2026-05-15 10:00', updatedAt: '2026-05-16 10:00', closedAt: '2026-05-16 10:00', repairActions: '', replacedModules: [], recheckResult: null, voidReason: '样机退役，工单作废', notes: '' },
  // 售后工单状态覆盖（关联在线设备 DEV-515/516）：待分派/待接单/待上门/现场处理中/已关单/已取消
  { id: 'WO-011', woClass: '其他问题工单', involvesReplacement: false, deviceId: 'DEV-515', deviceSN: 'SN-DEV-515', projectId: 'PROJ-008', description: '巡检机器人偶发定位漂移，等待派单', severity: '中', status: '待分派', assignedTo: '', createdAt: '2026-07-07 09:00', updatedAt: '2026-07-07 09:00', closedAt: null, repairActions: '', replacedModules: [], recheckResult: null, notes: '' },
  { id: 'WO-012', woClass: '软件问题工单', involvesReplacement: false, softwareVersion: 'v2.4.0', deviceId: 'DEV-516', deviceSN: 'SN-DEV-516', projectId: 'PROJ-008', description: '预控通信中断，已派单待工程师接单', severity: '高', status: '待接单', assignedTo: '赵六', createdAt: '2026-07-06 06:30', updatedAt: '2026-07-06 06:30', closedAt: null, repairActions: '', replacedModules: [], recheckResult: null, notes: '来自告警 ALERT-017' },
  { id: 'WO-013', woClass: '其他问题工单', involvesReplacement: false, deviceId: 'DEV-515', deviceSN: 'SN-DEV-515', projectId: 'PROJ-008', description: '触摸屏响应迟滞，已接单待上门', severity: '低', status: '待上门', assignedTo: '赵六', createdAt: '2026-07-05 10:00', updatedAt: '2026-07-06 09:00', closedAt: null, repairActions: '已电话初诊，预约上门', replacedModules: [], recheckResult: null, notes: '' },
  { id: 'WO-014', woClass: '换件工单', involvesReplacement: true, needReplaceModuleType: '电机模块', oldModuleSN: '待确认', newModuleSN: '待选择', newModuleStockStatus: '待选择', deviceId: 'DEV-516', deviceSN: 'SN-DEV-516', projectId: 'PROJ-008', description: '关节电机温升偏高，工程师现场处理中', severity: '高', status: '现场处理中', assignedTo: '王五', createdAt: '2026-07-07 14:30', updatedAt: '2026-07-08 10:00', closedAt: null, repairActions: '现场拆检散热模组，评估更换电机', replacedModules: [], recheckResult: null, notes: '来自告警 ALERT-015' },
  { id: 'WO-015', woClass: '其他问题工单', involvesReplacement: false, deviceId: 'DEV-515', deviceSN: 'SN-DEV-515', projectId: 'PROJ-008', description: '导航地图老化导致偏差，已重建地图', severity: '中', status: '已关单', assignedTo: '赵六', createdAt: '2026-07-02 09:00', updatedAt: '2026-07-04 16:00', closedAt: '2026-07-04 16:00', closeNote: '重建地图并现场验证通过，客户签字确认', finalResult: '已解决', repairActions: '远程推送新地图并重新建图', replacedModules: [], recheckResult: '合格', recheckPerson: '张三', notes: '' },
  { id: 'WO-016', woClass: '其他问题工单', involvesReplacement: false, deviceId: 'DEV-516', deviceSN: 'SN-DEV-516', projectId: 'PROJ-008', description: '客户误报异响，复核无故障', severity: '低', status: '已取消', assignedTo: '赵六', createdAt: '2026-07-03 09:00', updatedAt: '2026-07-03 15:00', closedAt: '2026-07-03 15:00', repairActions: '', replacedModules: [], recheckResult: null, cancelReason: '客户误报，复核无异常，工单取消', notes: '' },
];

export const retirements = [];

export const moduleReplacements = [
  { id: 'MR-001', workOrderId: 'WO-003', deviceId: 'DEV-301', slotName: '左臂槁位', removedMaterialId: 'MAT-003', addedMaterialId: 'MAT-004', removedDisposition: '维修中', operator: '李四', timestamp: '2026-06-15 09:30', status: '已换件', erpPickingNo: 'PICK-2026-001', erpPickingStatus: '已领料', notes: '机械臂关节磨损，整体更换' },
  { id: 'MR-002', workOrderId: 'WO-001', deviceId: 'DEV-303', slotName: '预控槁位', removedMaterialId: 'MAT-013', addedMaterialId: 'MAT-014', removedDisposition: '维修中', operator: '王五', timestamp: '2026-06-20 15:30', status: '旧件待返修', erpPickingNo: 'PICK-2026-002', erpPickingStatus: '已领料', notes: '预控模块散热异常，更换后送修' },
  // 换件记录状态覆盖：待领料/已领料/已换件/旧件待返修/旧件已返修/旧件已报废
  { id: 'MR-003', workOrderId: 'WO-014', deviceId: 'DEV-516', slotName: '关节电机A槁位', removedMaterialId: 'MAT-006', addedMaterialId: 'MAT-007', removedDisposition: '待评估', operator: '王五', timestamp: '2026-07-08 10:00', status: '待领料', erpPickingNo: 'PICK-2026-003', erpPickingStatus: '未领料', notes: '换件工单待领料' },
  { id: 'MR-004', workOrderId: 'WO-008', deviceId: 'DEV-307', slotName: '关节电机B槁位', removedMaterialId: 'MAT-016', addedMaterialId: 'MAT-017', removedDisposition: '待返修', operator: '王五', timestamp: '2026-06-21 10:00', status: '已领料', erpPickingNo: 'PICK-2026-004', erpPickingStatus: '已领料', notes: '备件已领料，待现场换件' },
  { id: 'MR-005', workOrderId: 'WO-003', deviceId: 'DEV-301', slotName: '右臂槁位', removedMaterialId: 'MAT-019', addedMaterialId: 'MAT-020', removedDisposition: '已返修', operator: '李四', timestamp: '2026-06-18 14:00', status: '旧件已返修', erpPickingNo: 'PICK-2026-005', erpPickingStatus: '已领料', notes: '旧件返修完成回库' },
  { id: 'MR-006', workOrderId: 'WO-001', deviceId: 'DEV-303', slotName: '底盘槁位', removedMaterialId: 'MAT-018', addedMaterialId: 'MAT-001', removedDisposition: '已报废', operator: '王五', timestamp: '2026-06-20 16:00', status: '旧件已报废', erpPickingNo: 'PICK-2026-006', erpPickingStatus: '已领料', notes: '旧件损坏无法修复，报废处理' },
];

export const labelCategories = [
  { id: 'LC-001', name: '末端类型', options: ['夹爪末端', '焊接末端', '力矩末端'] },
  { id: 'LC-002', name: '底盘类型', options: ['差速底盘', '全向底盘'] },
  { id: 'LC-003', name: '控制器型号', options: ['NUC-i5', 'NUC-i7', 'Xavier NX'] },
];

// ============ 生产工单（生产测试 NG，仅生产阶段设备；不进入售后工单中心）============
export const productionWorkOrders = [
  { id: 'PWO-001', type: 'production', productionPlanId: 'WPP-001', deviceId: 'DEV-008', deviceSN: 'SN-DEV-008', ngStation: 'init', description: '初测NG，关节电机初始化失败', severity: '高', status: '处理中', assignedTo: '赵六', createdAt: '2026-05-19 11:00', updatedAt: '2026-06-19 09:30', repairActions: '更换关节电机模块，重新烧录固件', recheckPerson: '', recheckResult: '', attachmentDesc: '', logFile: 'init_log_DEV008.txt', imageFile: '', processLogs: [{ time: '2026-05-19 11:00', operator: '赵六', fromStatus: '待处理', toStatus: '处理中', notes: '已承接，确认关节电机硬件故障' }] },
  { id: 'PWO-002', type: 'production', productionPlanId: 'WPP-001', deviceId: 'DEV-010', deviceSN: 'SN-DEV-010', ngStation: 'init', description: '初测NG，底盘驱动板通信异常', severity: '中', status: '待处理', assignedTo: '', createdAt: '2026-05-19 11:00', updatedAt: '2026-05-19 11:00', repairActions: '', recheckPerson: '', recheckResult: '', attachmentDesc: '', logFile: '', imageFile: '', processLogs: [] },
  { id: 'PWO-003', type: 'production', productionPlanId: 'WPP-002', deviceId: 'DEV-016', deviceSN: 'SN-DEV-016', ngStation: 'oqt', description: 'OQT终测NG，导航静态定位误差超限', severity: '中', status: '复检中', assignedTo: '李四', recheckPerson: '张三', createdAt: '2026-06-16 15:00', updatedAt: '2026-06-20 10:00', repairActions: '重新标定导航参数，返修后提交重测', recheckResult: '', attachmentDesc: '', logFile: 'oqt_log_DEV016.txt', imageFile: '', processLogs: [{ time: '2026-06-16 15:00', operator: '李四', fromStatus: '待处理', toStatus: '处理中', notes: '已承接，开始导航参数标定' }, { time: '2026-06-20 10:00', operator: '李四', fromStatus: '处理中', toStatus: '复检中', notes: '标定完成，提交复检', recheckPerson: '张三' }] },
  { id: 'PWO-004', type: 'production', productionPlanId: 'WPP-003', deviceId: 'DEV-022', deviceSN: 'SN-DEV-022', ngStation: 'mid', description: '中测NG，驱动电机连续运行温升过快', severity: '高', status: '处理中', assignedTo: '张三', createdAt: '2026-06-21 09:00', updatedAt: '2026-06-21 14:00', repairActions: '清洁电机散热片，检查风道', recheckPerson: '', recheckResult: '', attachmentDesc: '温度日志', logFile: 'thermal_DEV022.txt', imageFile: '', processLogs: [{ time: '2026-06-21 09:00', operator: '张三', fromStatus: '待处理', toStatus: '处理中', notes: '已承接，排查散热' }] },
  { id: 'PWO-005', type: 'production', productionPlanId: 'WPP-003', deviceId: 'DEV-026', deviceSN: 'SN-DEV-026', ngStation: 'semi', description: '半成品检验NG，IMU传感器初始化失败', severity: '中', status: '待处理', assignedTo: '', createdAt: '2026-06-13 09:00', updatedAt: '2026-06-13 09:00', repairActions: '', recheckPerson: '', recheckResult: '', attachmentDesc: '', logFile: '', imageFile: '', processLogs: [] },
  { id: 'PWO-006', type: 'production', productionPlanId: 'WPP-002', deviceId: 'DEV-018', deviceSN: 'SN-DEV-018', ngStation: 'mid', description: '中测发现散热风扇异响，已更换后复检通过', severity: '低', status: '已关闭', assignedTo: '李四', createdAt: '2026-06-17 14:00', updatedAt: '2026-06-19 10:00', repairActions: '更换散热风扇，重新装配', recheckPerson: '王五', recheckResult: '通过', attachmentDesc: '', logFile: '', imageFile: '', processLogs: [{ time: '2026-06-17 14:00', operator: '李四', fromStatus: '待处理', toStatus: '处理中', notes: '确认风扇异响' }, { time: '2026-06-18 10:00', operator: '李四', fromStatus: '处理中', toStatus: '复检中', notes: '已更换，提交复检' }, { time: '2026-06-19 10:00', operator: '王五', fromStatus: '复检中', toStatus: '已关闭', notes: '复检通过，重新进入中测' }] },
  { id: 'PWO-007', type: 'production', productionPlanId: 'WPP-001', deviceId: 'DEV-025', deviceSN: 'SN-DEV-025', ngStation: 'semi', description: '半成品检验发现机壳轻微变形，更换后复检通过', severity: '低', status: '已关闭', assignedTo: '张三', createdAt: '2026-05-23 14:00', updatedAt: '2026-05-25 10:00', repairActions: '更换机壳外壳，重新装配紧固件', recheckPerson: '王五', recheckResult: '通过', attachmentDesc: '机壳测量报告', logFile: '', imageFile: 'housing_DEV025.jpg', processLogs: [{ time: '2026-05-23 14:00', operator: '张三', fromStatus: '待处理', toStatus: '处理中', notes: '确认机壳变形' }, { time: '2026-05-24 10:00', operator: '张三', fromStatus: '处理中', toStatus: '复检中', notes: '已更换，提交复检' }, { time: '2026-05-25 10:00', operator: '王五', fromStatus: '复检中', toStatus: '已关闭', notes: '外观符合公差要求' }] },
];

// ============ 交付工单（交付阶段问题，仅交付中设备）============
export const deliveryWorkOrders = [
  { id: 'DWO-001', woClass: '其他问题工单', involvesReplacement: false, type: 'delivery', deliveryPlanId: 'DP-001', deviceId: 'DEV-203', deviceSN: 'SN-DEV-203', projectId: 'PROJ-001', description: '现场安装时发现底盘运动偏差偏大', severity: '中', status: '已关闭', assignedTo: '赵六', createdAt: '2026-06-14 14:00', updatedAt: '2026-06-16 16:00', closedAt: '2026-06-16 16:00', repairActions: '重新校准底盘里程计和陀螺仪参数', recheckPerson: '张三', recheckResult: '通过', attachmentDesc: '现场安装日志', logFile: 'install_DEV203.txt', imageFile: '', moduleReplacements: [], processLogs: [{ time: '2026-06-14 14:00', operator: '赵六', fromStatus: '待处理', toStatus: '处理中', notes: '已承接工单' }, { time: '2026-06-15 10:00', operator: '赵六', fromStatus: '处理中', toStatus: '复检中', notes: '校准完成，提交复检', recheckPerson: '张三' }, { time: '2026-06-16 16:00', operator: '张三', fromStatus: '复检中', toStatus: '已关闭', notes: '复检通过' }] },
  { id: 'DWO-002', woClass: '换件工单', involvesReplacement: true, needReplaceModuleType: '底盘密封件', oldModuleSN: '待确认', newModuleSN: '待选择', newModuleStockStatus: '待选择', type: 'delivery', deliveryPlanId: 'DP-002', deviceId: 'DEV-205', deviceSN: 'SN-DEV-205', projectId: 'PROJ-002', description: '出厂检验防护等级测试不通过，IP65密封性不足', severity: '高', status: '复检中', assignedTo: '张三', recheckPerson: '王五', createdAt: '2026-06-19 10:00', updatedAt: '2026-06-22 14:00', closedAt: null, repairActions: '更换防护等级不足部位的密封件', recheckResult: '', attachmentDesc: 'IP防护测试报告', logFile: 'ip65_DEV205.pdf', imageFile: '', moduleReplacements: [], processLogs: [{ time: '2026-06-19 10:00', operator: '张三', fromStatus: '待处理', toStatus: '处理中', notes: '拆检发现底部密封圈老化' }, { time: '2026-06-21 16:00', operator: '张三', fromStatus: '处理中', toStatus: '复检中', notes: '密封件更换完成，提交复检' }] },
  { id: 'DWO-003', woClass: '软件问题工单', involvesReplacement: false, softwareVersion: 'v2.3.0', type: 'delivery', deliveryPlanId: 'DP-002', deviceId: 'DEV-206', deviceSN: 'SN-DEV-206', projectId: 'PROJ-002', description: '现场安装调试时网络连接不稳定，丢包率高', severity: '中', status: '处理中', assignedTo: '王五', createdAt: '2026-06-21 14:00', updatedAt: '2026-06-22 09:00', closedAt: null, repairActions: '排查网络模块固件版本，尝试更新至最新版本', recheckPerson: '', recheckResult: '', attachmentDesc: '', logFile: 'network_DEV206.txt', imageFile: '', moduleReplacements: [], processLogs: [{ time: '2026-06-21 14:00', operator: '王五', fromStatus: '待处理', toStatus: '处理中', notes: '到场排查，发现网络模块固件需升级' }] },
  { id: 'DWO-004', woClass: '其他问题工单', involvesReplacement: false, type: 'delivery', deliveryPlanId: 'DP-003', deviceId: 'DEV-208', deviceSN: 'SN-DEV-208', projectId: 'PROJ-003', description: '现场安装时发现设备外观有划伤，客户要求处理', severity: '低', status: '待处理', assignedTo: '', createdAt: '2026-06-21 16:00', updatedAt: '2026-06-21 16:00', closedAt: null, repairActions: '', recheckPerson: '', recheckResult: '', attachmentDesc: '外观划伤照片', logFile: '', imageFile: 'scratch_DEV208.jpg', moduleReplacements: [], processLogs: [] },
  { id: 'DWO-005', woClass: '软件问题工单', involvesReplacement: false, softwareVersion: 'v2.1.5', type: 'delivery', deliveryPlanId: 'DP-001', deviceId: 'DEV-204', deviceSN: 'SN-DEV-204', projectId: 'PROJ-001', description: '客户验收时反馈设备启动时间过长，超过30秒', severity: '低', status: '待处理', assignedTo: '', createdAt: '2026-06-22 08:00', updatedAt: '2026-06-22 08:00', closedAt: null, repairActions: '', recheckPerson: '', recheckResult: '', attachmentDesc: '', logFile: '', imageFile: '', moduleReplacements: [], processLogs: [] },
  { id: 'DWO-006', woClass: '换件工单', involvesReplacement: true, needReplaceModuleType: '预控模块', oldModuleSN: '待确认', newModuleSN: '待选择', newModuleStockStatus: '待选择', type: 'delivery', deliveryPlanId: 'DP-008', deviceId: 'DEV-210', deviceSN: 'SN-DEV-210', projectId: 'PROJ-004', description: '医院现场安装调试时预控模块偶发重启', severity: '中', status: '处理中', assignedTo: '赵六', createdAt: '2026-06-21 14:00', updatedAt: '2026-06-22 09:00', closedAt: null, repairActions: '排查预控供电与固件，评估更换', recheckPerson: '', recheckResult: '', attachmentDesc: '', logFile: 'ctrl_DEV210.txt', imageFile: '', moduleReplacements: [], processLogs: [{ time: '2026-06-21 14:00', operator: '赵六', fromStatus: '待处理', toStatus: '处理中', notes: '已到医院现场排查' }] },
];

// ============ 交付计划（6-8 个，覆盖交付中/已验收/已延期）============
export const deliveryPlans = [
  { id: 'DP-001', name: '智魔方首批交付计划', batchNo: 'DB-2026-001', projectId: 'PROJ-001', targetCount: 4, status: '交付中', owner: '张三', currentNode: '客户验收', factoryDate: '2026-06-12', siteInstallDate: '2026-06-14', acceptanceDate: '2026-08-15', dueDate: '2026-08-15', erpOutboundNo: 'SO-2026-018', erpAcceptanceNo: '', boundDeviceIds: ['DEV-201', 'DEV-202', 'DEV-203', 'DEV-204'],
    records: {
      binding: [{ id: 'BIND-201', deviceId: 'DEV-201', preAssignedLocationId: 'LOC-012', operator: '张三', time: '2026-06-05 09:00' }, { id: 'BIND-202', deviceId: 'DEV-202', preAssignedLocationId: 'LOC-012', operator: '张三', time: '2026-06-05 09:10' }, { id: 'BIND-203', deviceId: 'DEV-203', preAssignedLocationId: 'LOC-010', operator: '张三', time: '2026-06-05 09:20' }, { id: 'BIND-204', deviceId: 'DEV-204', preAssignedLocationId: 'LOC-009', operator: '张三', time: '2026-06-05 09:30' }],
      factoryInspection: [{ id: 'FI-202', deviceId: 'DEV-202', deviceSN: 'SN-DEV-202', operator: '赵六', time: '2026-06-12 10:00', result: 'Pass', reportFile: 'fi_DEV202.pdf', reportLink: '' }, { id: 'FI-203', deviceId: 'DEV-203', deviceSN: 'SN-DEV-203', operator: '赵六', time: '2026-06-13 10:00', result: 'Pass', reportFile: 'fi_DEV203.pdf', reportLink: '' }, { id: 'FI-204', deviceId: 'DEV-204', deviceSN: 'SN-DEV-204', operator: '张三', time: '2026-06-12 10:00', result: 'Pass', reportFile: 'fi_DEV204.pdf', reportLink: '' }],
      siteInstall: [{ id: 'SI-204', deviceId: 'DEV-204', deviceSN: 'SN-DEV-204', operator: '王五', locationId: 'LOC-009', time: '2026-06-15 10:00', result: 'Pass', notes: '安装调试完成，待客户验收' }],
      customerAccept: [],
    } },
  { id: 'DP-002', name: '华熙生物首批交付计划', batchNo: 'DB-2026-002', projectId: 'PROJ-002', targetCount: 3, status: '交付中', owner: '李四', currentNode: '现场安装调试', factoryDate: '2026-06-18', siteInstallDate: '2026-06-21', acceptanceDate: '2026-06-25', dueDate: '2026-06-25', erpOutboundNo: '', erpAcceptanceNo: '', boundDeviceIds: ['DEV-205', 'DEV-206', 'DEV-207'],
    records: {
      binding: [{ id: 'BIND-205', deviceId: 'DEV-205', preAssignedLocationId: 'LOC-008', operator: '李四', time: '2026-06-06 09:00' }, { id: 'BIND-206', deviceId: 'DEV-206', preAssignedLocationId: 'LOC-008', operator: '李四', time: '2026-06-06 09:10' }, { id: 'BIND-207', deviceId: 'DEV-207', preAssignedLocationId: 'LOC-014', operator: '李四', time: '2026-06-06 09:20' }],
      factoryInspection: [{ id: 'FI-205', deviceId: 'DEV-205', deviceSN: 'SN-DEV-205', operator: '张三', time: '2026-06-19 09:00', result: 'NG', reportFile: '', reportLink: '', notes: 'IP65防护不足，已生成工单DWO-002' }, { id: 'FI-206', deviceId: 'DEV-206', deviceSN: 'SN-DEV-206', operator: '张三', time: '2026-06-18 10:00', result: 'Pass', reportFile: 'fi_DEV206.pdf', reportLink: '' }, { id: 'FI-207', deviceId: 'DEV-207', deviceSN: 'SN-DEV-207', operator: '张三', time: '2026-06-18 11:00', result: 'Pass', reportFile: 'fi_DEV207.pdf', reportLink: '' }],
      siteInstall: [{ id: 'SI-206', deviceId: 'DEV-206', deviceSN: 'SN-DEV-206', operator: '王五', locationId: 'LOC-008', time: '2026-06-21 14:00', result: 'NG', notes: '网络不稳定，已生成工单DWO-003' }, { id: 'SI-207', deviceId: 'DEV-207', deviceSN: 'SN-DEV-207', operator: '赵六', locationId: 'LOC-014', time: '2026-06-21 10:00', result: 'Pass', notes: '安装完成，待验收' }],
      customerAccept: [],
    } },
  { id: 'DP-003', name: '机场T3试点交付计划', batchNo: 'DB-2026-003', projectId: 'PROJ-003', targetCount: 2, status: '交付中', owner: '王五', currentNode: '绑定设备', factoryDate: '2026-06-15', siteInstallDate: '2026-07-05', acceptanceDate: '2026-08-20', dueDate: '2026-08-20', erpOutboundNo: '', erpAcceptanceNo: '', boundDeviceIds: ['DEV-208'],
    records: {
      binding: [{ id: 'BIND-208', deviceId: 'DEV-208', preAssignedLocationId: 'LOC-007', operator: '王五', time: '2026-06-07 09:00' }],
      factoryInspection: [{ id: 'FI-208', deviceId: 'DEV-208', deviceSN: 'SN-DEV-208', operator: '王五', time: '2026-06-15 11:00', result: 'Pass', reportFile: 'fi_DEV208.pdf', reportLink: '' }],
      siteInstall: [], customerAccept: [],
    } },
  { id: 'DP-004', name: '智魔方Q1上线交付计划', batchNo: 'DB-2026-004', projectId: 'PROJ-001', targetCount: 4, status: '已验收', owner: '张三', currentNode: '客户验收', factoryDate: '2026-04-15', siteInstallDate: '2026-04-18', acceptanceDate: '2026-04-21', dueDate: '2026-04-25', erpOutboundNo: 'SO-2026-004', erpAcceptanceNo: 'AC-2026-004', boundDeviceIds: ['DEV-301', 'DEV-302', 'DEV-303', 'DEV-304'],
    records: {
      binding: [{ id: 'BIND-301', deviceId: 'DEV-301', preAssignedLocationId: 'LOC-001', operator: '张三', time: '2026-04-08 09:00' }, { id: 'BIND-302', deviceId: 'DEV-302', preAssignedLocationId: 'LOC-001', operator: '张三', time: '2026-04-08 09:10' }, { id: 'BIND-303', deviceId: 'DEV-303', preAssignedLocationId: 'LOC-002', operator: '张三', time: '2026-04-08 09:20' }, { id: 'BIND-304', deviceId: 'DEV-304', preAssignedLocationId: 'LOC-002', operator: '张三', time: '2026-04-08 09:30' }],
      factoryInspection: [{ id: 'FI-301', deviceId: 'DEV-301', deviceSN: 'SN-DEV-301', operator: '赵六', time: '2026-04-15 10:00', result: 'Pass', reportFile: 'fi_DEV301.pdf', reportLink: '' }, { id: 'FI-302', deviceId: 'DEV-302', deviceSN: 'SN-DEV-302', operator: '赵六', time: '2026-04-15 11:00', result: 'Pass', reportFile: 'fi_DEV302.pdf', reportLink: '' }, { id: 'FI-303', deviceId: 'DEV-303', deviceSN: 'SN-DEV-303', operator: '赵六', time: '2026-04-16 10:00', result: 'Pass', reportFile: 'fi_DEV303.pdf', reportLink: '' }, { id: 'FI-304', deviceId: 'DEV-304', deviceSN: 'SN-DEV-304', operator: '赵六', time: '2026-04-16 11:00', result: 'Pass', reportFile: 'fi_DEV304.pdf', reportLink: '' }],
      siteInstall: [{ id: 'SI-301', deviceId: 'DEV-301', deviceSN: 'SN-DEV-301', operator: '王五', locationId: 'LOC-001', time: '2026-04-18 10:00', result: 'Pass', notes: '' }, { id: 'SI-302', deviceId: 'DEV-302', deviceSN: 'SN-DEV-302', operator: '王五', locationId: 'LOC-001', time: '2026-04-18 11:00', result: 'Pass', notes: '' }, { id: 'SI-303', deviceId: 'DEV-303', deviceSN: 'SN-DEV-303', operator: '王五', locationId: 'LOC-002', time: '2026-04-19 10:00', result: 'Pass', notes: '' }, { id: 'SI-304', deviceId: 'DEV-304', deviceSN: 'SN-DEV-304', operator: '王五', locationId: 'LOC-002', time: '2026-04-19 11:00', result: 'Pass', notes: '' }],
      customerAccept: [{ id: 'CA-301', deviceId: 'DEV-301', deviceSN: 'SN-DEV-301', operator: '蔡八', locationId: 'LOC-001', time: '2026-04-21 15:00', result: 'Pass', erpOutboundNo: 'SO-2026-004', voucherDesc: '验收单301.pdf' }, { id: 'CA-302', deviceId: 'DEV-302', deviceSN: 'SN-DEV-302', operator: '蔡八', locationId: 'LOC-001', time: '2026-04-21 15:10', result: 'Pass', erpOutboundNo: 'SO-2026-004', voucherDesc: '验收单302.pdf' }, { id: 'CA-303', deviceId: 'DEV-303', deviceSN: 'SN-DEV-303', operator: '蔡八', locationId: 'LOC-002', time: '2026-04-21 15:20', result: 'Pass', erpOutboundNo: 'SO-2026-004', voucherDesc: '验收单303.pdf' }, { id: 'CA-304', deviceId: 'DEV-304', deviceSN: 'SN-DEV-304', operator: '蔡八', locationId: 'LOC-002', time: '2026-04-21 15:30', result: 'Pass', erpOutboundNo: 'SO-2026-004', voucherDesc: '验收单304.pdf' }],
    } },
  { id: 'DP-005', name: '华熙生物上线交付计划', batchNo: 'DB-2026-005', projectId: 'PROJ-002', targetCount: 3, status: '已验收', owner: '李四', currentNode: '客户验收', factoryDate: '2026-04-20', siteInstallDate: '2026-04-22', acceptanceDate: '2026-04-24', dueDate: '2026-04-28', erpOutboundNo: 'SO-2026-005', erpAcceptanceNo: 'AC-2026-005', boundDeviceIds: ['DEV-305', 'DEV-306', 'DEV-307'],
    records: {
      binding: [{ id: 'BIND-305', deviceId: 'DEV-305', preAssignedLocationId: 'LOC-003', operator: '李四', time: '2026-04-13 09:00' }, { id: 'BIND-306', deviceId: 'DEV-306', preAssignedLocationId: 'LOC-003', operator: '李四', time: '2026-04-13 09:10' }, { id: 'BIND-307', deviceId: 'DEV-307', preAssignedLocationId: 'LOC-004', operator: '李四', time: '2026-04-13 09:20' }],
      factoryInspection: [{ id: 'FI-305', deviceId: 'DEV-305', deviceSN: 'SN-DEV-305', operator: '张三', time: '2026-04-20 10:00', result: 'Pass', reportFile: 'fi_DEV305.pdf', reportLink: '' }, { id: 'FI-306', deviceId: 'DEV-306', deviceSN: 'SN-DEV-306', operator: '张三', time: '2026-04-20 11:00', result: 'Pass', reportFile: 'fi_DEV306.pdf', reportLink: '' }, { id: 'FI-307', deviceId: 'DEV-307', deviceSN: 'SN-DEV-307', operator: '张三', time: '2026-04-21 10:00', result: 'Pass', reportFile: 'fi_DEV307.pdf', reportLink: '' }],
      siteInstall: [{ id: 'SI-305', deviceId: 'DEV-305', deviceSN: 'SN-DEV-305', operator: '赵六', locationId: 'LOC-003', time: '2026-04-22 10:00', result: 'Pass', notes: '洁净环境安装顺利' }, { id: 'SI-306', deviceId: 'DEV-306', deviceSN: 'SN-DEV-306', operator: '赵六', locationId: 'LOC-003', time: '2026-04-22 11:00', result: 'Pass', notes: '' }, { id: 'SI-307', deviceId: 'DEV-307', deviceSN: 'SN-DEV-307', operator: '赵六', locationId: 'LOC-004', time: '2026-04-23 10:00', result: 'Pass', notes: '' }],
      customerAccept: [{ id: 'CA-305', deviceId: 'DEV-305', deviceSN: 'SN-DEV-305', operator: '蔡八', locationId: 'LOC-003', time: '2026-04-24 15:00', result: 'Pass', erpOutboundNo: 'SO-2026-005', voucherDesc: '验收单305.pdf' }, { id: 'CA-306', deviceId: 'DEV-306', deviceSN: 'SN-DEV-306', operator: '蔡八', locationId: 'LOC-003', time: '2026-04-24 15:10', result: 'Pass', erpOutboundNo: 'SO-2026-005', voucherDesc: '验收单306.pdf' }, { id: 'CA-307', deviceId: 'DEV-307', deviceSN: 'SN-DEV-307', operator: '蔡八', locationId: 'LOC-004', time: '2026-04-24 15:20', result: 'Pass', erpOutboundNo: 'SO-2026-005', voucherDesc: '验收单307.pdf' }],
    } },
  { id: 'DP-006', name: '机场T3上线交付计划', batchNo: 'DB-2026-006', projectId: 'PROJ-003', targetCount: 3, status: '已验收', owner: '王五', currentNode: '客户验收', factoryDate: '2026-04-22', siteInstallDate: '2026-04-24', acceptanceDate: '2026-04-26', dueDate: '2026-04-30', erpOutboundNo: 'SO-2026-006', erpAcceptanceNo: 'AC-2026-006', boundDeviceIds: ['DEV-308', 'DEV-309', 'DEV-310'],
    records: {
      binding: [{ id: 'BIND-308', deviceId: 'DEV-308', preAssignedLocationId: 'LOC-005', operator: '王五', time: '2026-04-16 09:00' }, { id: 'BIND-309', deviceId: 'DEV-309', preAssignedLocationId: 'LOC-005', operator: '王五', time: '2026-04-16 09:10' }, { id: 'BIND-310', deviceId: 'DEV-310', preAssignedLocationId: 'LOC-006', operator: '王五', time: '2026-04-16 09:20' }],
      factoryInspection: [{ id: 'FI-308', deviceId: 'DEV-308', deviceSN: 'SN-DEV-308', operator: '王五', time: '2026-04-22 10:00', result: 'Pass', reportFile: 'fi_DEV308.pdf', reportLink: '' }, { id: 'FI-309', deviceId: 'DEV-309', deviceSN: 'SN-DEV-309', operator: '王五', time: '2026-04-22 11:00', result: 'Pass', reportFile: 'fi_DEV309.pdf', reportLink: '' }, { id: 'FI-310', deviceId: 'DEV-310', deviceSN: 'SN-DEV-310', operator: '王五', time: '2026-04-23 10:00', result: 'Pass', reportFile: 'fi_DEV310.pdf', reportLink: '' }],
      siteInstall: [{ id: 'SI-308', deviceId: 'DEV-308', deviceSN: 'SN-DEV-308', operator: '赵六', locationId: 'LOC-005', time: '2026-04-24 10:00', result: 'Pass', notes: '巡检路线已配置' }, { id: 'SI-309', deviceId: 'DEV-309', deviceSN: 'SN-DEV-309', operator: '赵六', locationId: 'LOC-005', time: '2026-04-24 11:00', result: 'Pass', notes: '' }, { id: 'SI-310', deviceId: 'DEV-310', deviceSN: 'SN-DEV-310', operator: '赵六', locationId: 'LOC-006', time: '2026-04-25 10:00', result: 'Pass', notes: '' }],
      customerAccept: [{ id: 'CA-308', deviceId: 'DEV-308', deviceSN: 'SN-DEV-308', operator: '运营负责人', locationId: 'LOC-005', time: '2026-04-26 15:00', result: 'Pass', erpOutboundNo: 'SO-2026-006', voucherDesc: '民航验收单308.pdf' }, { id: 'CA-309', deviceId: 'DEV-309', deviceSN: 'SN-DEV-309', operator: '运营负责人', locationId: 'LOC-005', time: '2026-04-26 15:10', result: 'Pass', erpOutboundNo: 'SO-2026-006', voucherDesc: '民航验收单309.pdf' }, { id: 'CA-310', deviceId: 'DEV-310', deviceSN: 'SN-DEV-310', operator: '运营负责人', locationId: 'LOC-006', time: '2026-04-26 15:20', result: 'Pass', erpOutboundNo: 'SO-2026-006', voucherDesc: '民航验收单310.pdf' }],
    } },
  { id: 'DP-007', name: '展厅样机历史交付计划', batchNo: 'DB-2026-007', projectId: 'PROJ-005', targetCount: 4, status: '已验收', owner: '张三', currentNode: '客户验收', factoryDate: '2026-03-05', siteInstallDate: '2026-03-08', acceptanceDate: '2026-03-10', dueDate: '2026-03-15', erpOutboundNo: 'SO-2026-003', erpAcceptanceNo: 'AC-2026-003', boundDeviceIds: ['DEV-401', 'DEV-402', 'DEV-403', 'DEV-404'],
    records: {
      binding: [{ id: 'BIND-401', deviceId: 'DEV-401', preAssignedLocationId: 'LOC-014', operator: '张三', time: '2026-03-01 09:00' }, { id: 'BIND-402', deviceId: 'DEV-402', preAssignedLocationId: 'LOC-014', operator: '张三', time: '2026-03-01 09:10' }, { id: 'BIND-403', deviceId: 'DEV-403', preAssignedLocationId: 'LOC-014', operator: '张三', time: '2026-03-01 09:20' }, { id: 'BIND-404', deviceId: 'DEV-404', preAssignedLocationId: 'LOC-014', operator: '张三', time: '2026-03-01 09:30' }],
      factoryInspection: [{ id: 'FI-401', deviceId: 'DEV-401', deviceSN: 'SN-DEV-401', operator: '王五', time: '2026-03-05 10:00', result: 'Pass', reportFile: 'fi_DEV401.pdf', reportLink: '' }, { id: 'FI-402', deviceId: 'DEV-402', deviceSN: 'SN-DEV-402', operator: '王五', time: '2026-03-05 11:00', result: 'Pass', reportFile: 'fi_DEV402.pdf', reportLink: '' }, { id: 'FI-403', deviceId: 'DEV-403', deviceSN: 'SN-DEV-403', operator: '王五', time: '2026-03-06 10:00', result: 'Pass', reportFile: 'fi_DEV403.pdf', reportLink: '' }, { id: 'FI-404', deviceId: 'DEV-404', deviceSN: 'SN-DEV-404', operator: '王五', time: '2026-03-06 11:00', result: 'Pass', reportFile: 'fi_DEV404.pdf', reportLink: '' }],
      siteInstall: [{ id: 'SI-401', deviceId: 'DEV-401', deviceSN: 'SN-DEV-401', operator: '赵六', locationId: 'LOC-014', time: '2026-03-08 10:00', result: 'Pass', notes: '' }, { id: 'SI-402', deviceId: 'DEV-402', deviceSN: 'SN-DEV-402', operator: '赵六', locationId: 'LOC-014', time: '2026-03-08 11:00', result: 'Pass', notes: '' }, { id: 'SI-403', deviceId: 'DEV-403', deviceSN: 'SN-DEV-403', operator: '赵六', locationId: 'LOC-014', time: '2026-03-09 10:00', result: 'Pass', notes: '' }, { id: 'SI-404', deviceId: 'DEV-404', deviceSN: 'SN-DEV-404', operator: '赵六', locationId: 'LOC-014', time: '2026-03-09 11:00', result: 'Pass', notes: '' }],
      customerAccept: [{ id: 'CA-401', deviceId: 'DEV-401', deviceSN: 'SN-DEV-401', operator: '品牌部', locationId: 'LOC-014', time: '2026-03-10 15:00', result: 'Pass', erpOutboundNo: 'SO-2026-003', voucherDesc: '展厅验收单401.pdf' }, { id: 'CA-402', deviceId: 'DEV-402', deviceSN: 'SN-DEV-402', operator: '品牌部', locationId: 'LOC-014', time: '2026-03-10 15:10', result: 'Pass', erpOutboundNo: 'SO-2026-003', voucherDesc: '展厅验收单402.pdf' }, { id: 'CA-403', deviceId: 'DEV-403', deviceSN: 'SN-DEV-403', operator: '品牌部', locationId: 'LOC-014', time: '2026-03-10 15:20', result: 'Pass', erpOutboundNo: 'SO-2026-003', voucherDesc: '展厅验收单403.pdf' }, { id: 'CA-404', deviceId: 'DEV-404', deviceSN: 'SN-DEV-404', operator: '品牌部', locationId: 'LOC-014', time: '2026-03-10 15:30', result: 'Pass', erpOutboundNo: 'SO-2026-003', voucherDesc: '展厅验收单404.pdf' }],
    } },
  { id: 'DP-008', name: '医疗康养首批交付计划', batchNo: 'DB-2026-008', projectId: 'PROJ-004', targetCount: 2, status: '交付中', owner: '赵六', currentNode: '现场安装调试', factoryDate: '2026-06-15', siteInstallDate: '2026-06-21', acceptanceDate: '2026-08-30', dueDate: '2026-08-30', erpOutboundNo: '', erpAcceptanceNo: '', boundDeviceIds: ['DEV-209', 'DEV-210'],
    records: {
      binding: [{ id: 'BIND-209', deviceId: 'DEV-209', preAssignedLocationId: 'LOC-013', operator: '赵六', time: '2026-06-08 09:00' }, { id: 'BIND-210', deviceId: 'DEV-210', preAssignedLocationId: 'LOC-011', operator: '赵六', time: '2026-06-08 09:10' }],
      factoryInspection: [{ id: 'FI-210', deviceId: 'DEV-210', deviceSN: 'SN-DEV-210', operator: '王五', time: '2026-06-15 10:00', result: 'Pass', reportFile: 'fi_DEV210.pdf', reportLink: '' }],
      siteInstall: [], customerAccept: [],
    } },
  { id: 'DP-009', name: '深圳机场试点交付计划', batchNo: 'DB-2026-009', projectId: 'PROJ-006', targetCount: 3, status: '未开始', owner: '王五', currentNode: '绑定设备', factoryDate: '', siteInstallDate: '', acceptanceDate: '', dueDate: '2026-09-30', erpOutboundNo: '', erpAcceptanceNo: '', boundDeviceIds: [],
    records: { binding: [], factoryInspection: [], siteInstall: [], customerAccept: [] } },
  { id: 'DP-010', name: '北京机场首批交付计划', batchNo: 'DB-2026-010', projectId: 'PROJ-007', targetCount: 3, status: '已暂停', owner: '王五', currentNode: '绑定设备', factoryDate: '', siteInstallDate: '', acceptanceDate: '', dueDate: '2026-09-30', erpOutboundNo: '', erpAcceptanceNo: '', boundDeviceIds: [],
    records: { binding: [], factoryInspection: [], siteInstall: [], customerAccept: [] } },
];

export const FEISHU_USERS = [
  { id: 'u1', name: '张三', avatar: 'Z', dept: '制造部', role: '装配工', title: '装配', projectScope: '本部门项目', dataScope: '生产数据可见', status: '启用', lastLogin: '2026-07-02 09:30' },
  { id: 'u2', name: '李四', avatar: 'L', dept: '质检部', role: '质检员', title: '质检', projectScope: '本部门项目', dataScope: '质量数据可见', status: '启用', lastLogin: '2026-07-02 09:10' },
  { id: 'u3', name: '王五', avatar: 'W', dept: '测试部', role: '测试员', title: '测试', projectScope: '本部门项目', dataScope: '质量数据可见', status: '启用', lastLogin: '2026-07-01 18:20' },
  { id: 'u4', name: '赵六', avatar: 'Z', dept: '运维部', role: '运维工程师', title: '现场运维', projectScope: '指定项目', dataScope: '交付数据可见', status: '启用', lastLogin: '2026-07-01 17:45' },
  { id: 'u5', name: '李七', avatar: 'L', dept: '管理部', role: '厂长', title: '工厂管理', projectScope: '全部项目', dataScope: '全局可见', status: '启用', lastLogin: '2026-07-02 08:50' },
  { id: 'u6', name: '蔡八', avatar: 'C', dept: '项目部', role: '项目负责人', title: '项目管理', projectScope: '本人负责项目', dataScope: '项目内可见', status: '启用', lastLogin: '2026-07-02 10:00' },
  { id: 'u7', name: '陈九', avatar: 'C', dept: 'ERP 协同', role: 'ERP协同角色', title: '单据协同', projectScope: '指定项目', dataScope: 'ERP 单据关联可见', status: '启用', lastLogin: '2026-07-01 16:30' },
];

export const ROLES_LIST = [
  '质检员', '装配工', '测试员', '运维工程师', '项目负责人', '厂长', '维修工程师', '管理员',
];

export const ROLE_NAV_PERMISSIONS = {
  '质检员':     ['/home', '/projects', '/assets', '/after-sales'],
  '装配工':     ['/home', '/projects', '/assets'],
  '测试员':     ['/home', '/projects', '/assets'],
  '运维工程师':  ['/home', '/dashboard', '/assets', '/after-sales'],
  '维修工程师':  ['/home', '/after-sales', '/assets'],
  '项目负责人':  ['/home', '/dashboard', '/projects', '/assets', '/after-sales'],
  '厂长':       ['/home', '/dashboard', '/projects', '/assets', '/after-sales'],
  '管理员':     ['/home', '/dashboard', '/projects', '/assets', '/after-sales', '/system'],
  // ERP 协同角色（生产计划 / 库管 / 供应链采购 / 质量检验 / 财务等，只读核对 ERP 单据关联）
  'ERP协同角色': ['/home', '/projects', '/assets'],
};

export const ROLE_ACTION_PERMISSIONS = {
  '质检员':     ['add_material_batch', 'void_test_record', 'recheck_work_order'],
  '装配工':     ['add_assembly'],
  '测试员':     ['add_test_record', 'void_test_record'],
  '运维工程师':  ['add_work_order', 'update_alert', 'add_delivery', 'update_work_order', 'add_quality_issue', 'update_quality_issue'],
  '项目负责人':  ['add_project', 'add_device_allocation', 'add_delivery', 'void_project', 'manage_locations', 'add_quality_issue', 'update_quality_issue'],
  '厂长':       ['add_material_batch', 'add_assembly', 'add_test_record', 'void_test_record', 'add_production_plan', 'add_project', 'add_device_allocation', 'add_delivery', 'add_work_order', 'add_retirement', 'add_device_type', 'add_module_type', 'edit_device_type', 'edit_module_type', 'void_project', 'update_work_order', 'recheck_work_order', 'manage_locations', 'add_quality_issue', 'update_quality_issue'],
  '维修工程师':  ['add_work_order', 'update_work_order', 'add_quality_issue', 'update_quality_issue'],
  '管理员':     ['add_material_batch', 'add_assembly', 'add_test_record', 'void_test_record', 'add_production_plan', 'add_project', 'add_device_allocation', 'add_delivery', 'add_work_order', 'add_retirement', 'add_device_type', 'add_module_type', 'edit_device_type', 'edit_module_type', 'void_project', 'manage_users', 'manage_roles', 'update_work_order', 'recheck_work_order', 'manage_locations', 'add_quality_issue', 'update_quality_issue'],
  'ERP协同角色': [], // 只读核对 ERP 单据关联，默认无处理动作权限
};

// ============ 点位（deviceIds 只放在线运营设备；交付中设备通过 device.locationId 关联）============
export const locations = [
  { id: 'LOC-001', projectId: 'PROJ-001', name: '深圳海岸城店', address: '深圳市南山区海岸城', deviceIds: ['DEV-301', 'DEV-302'], plannedCount: 3, owner: '赵六', deliveryPlanIds: ['DP-004'], updatedAt: '2026-04-21 15:00' },
  { id: 'LOC-002', projectId: 'PROJ-001', name: '深圳万象城店', address: '深圳市罗湖区万象城', deviceIds: ['DEV-303', 'DEV-304'], plannedCount: 3, owner: '赵六', deliveryPlanIds: ['DP-004'], updatedAt: '2026-04-21 15:30' },
  { id: 'LOC-003', projectId: 'PROJ-002', name: '北京三里屯店', address: '北京市朝阳区三里屯', deviceIds: ['DEV-305', 'DEV-306'], plannedCount: 2, owner: '李四', deliveryPlanIds: ['DP-005'], updatedAt: '2026-04-24 15:10' },
  { id: 'LOC-004', projectId: 'PROJ-002', name: '北京王府井店', address: '北京市东城区王府井', deviceIds: ['DEV-307'], plannedCount: 2, owner: '李四', deliveryPlanIds: ['DP-005'], updatedAt: '2026-04-24 15:20' },
  { id: 'LOC-005', projectId: 'PROJ-003', name: 'T3航站楼A区', address: '首都国际机场T3航站楼A区', deviceIds: ['DEV-308', 'DEV-309'], plannedCount: 2, owner: '王五', deliveryPlanIds: ['DP-006'], updatedAt: '2026-04-26 15:10' },
  { id: 'LOC-006', projectId: 'PROJ-003', name: 'T3航站楼B区', address: '首都国际机场T3航站楼B区', deviceIds: ['DEV-310'], plannedCount: 2, owner: '王五', deliveryPlanIds: ['DP-006'], updatedAt: '2026-04-26 15:20' },
  { id: 'LOC-007', projectId: 'PROJ-003', name: 'T2航站楼A区', address: '首都国际机场T2航站楼A区', deviceIds: [], plannedCount: 2, owner: '王五', deliveryPlanIds: ['DP-003'], updatedAt: '2026-06-21 15:00' },
  { id: 'LOC-008', projectId: 'PROJ-002', name: '上海徐汇店', address: '上海市徐汇区港汇恒隆', deviceIds: [], plannedCount: 2, owner: '李四', deliveryPlanIds: ['DP-002'], updatedAt: '2026-06-21 14:00' },
  { id: 'LOC-009', projectId: 'PROJ-001', name: '广州天环店', address: '广州市天河区天环广场', deviceIds: [], plannedCount: 1, owner: '张三', deliveryPlanIds: ['DP-001'], updatedAt: '2026-06-22 10:00' },
  { id: 'LOC-010', projectId: 'PROJ-001', name: '北京朝阳大悦城店', address: '北京市朝阳区大悦城', deviceIds: [], plannedCount: 1, owner: '张三', deliveryPlanIds: ['DP-001'], updatedAt: '2026-06-21 10:00' },
  { id: 'LOC-011', projectId: 'PROJ-004', name: '深圳南山医院A栋', address: '深圳市南山区南山医院A栋', deviceIds: [], plannedCount: 1, owner: '赵六', deliveryPlanIds: ['DP-008'], updatedAt: '2026-06-21 14:00' },
  { id: 'LOC-012', projectId: 'PROJ-001', name: '深圳前海壹方城店', address: '深圳市南山区前海壹方城', deviceIds: [], plannedCount: 2, owner: '张三', deliveryPlanIds: ['DP-001'], updatedAt: '2026-06-05 09:00' },
  { id: 'LOC-013', projectId: 'PROJ-004', name: '深圳蛇口分院', address: '深圳市南山区蛇口人民医院', deviceIds: [], plannedCount: 2, owner: '赵六', deliveryPlanIds: ['DP-008'], updatedAt: '2026-06-08 09:00' },
  { id: 'LOC-014', projectId: 'PROJ-005', name: '旧样板展位', address: '公司一层品牌展厅', deviceIds: [], plannedCount: 1, owner: '张三', disabled: true, deliveryPlanIds: ['DP-007'], updatedAt: '2026-06-01 18:00' },
];

// ============ 质量问题台账 ============
export const qualityIssues = [
  // 在线运营（仅在线运营设备）
  { id: 'QI-001', deviceId: 'DEV-301', deviceSN: 'SN-DEV-301', deviceName: 'AlphaBot 1', locationId: 'LOC-001', projectId: 'PROJ-001', issueDesc: '机器人在货架转角处导航异常，频繁停止等待', reporterId: 'user-zhaoliu', reporterName: '赵六', reportTime: '2026-06-22 14:30', status: '待处理', source: '扫码上报', sourceStage: '在线运营', issueType: '功能异常', severity: '中', owner: '赵六', linkedWorkOrder: false, processLogs: [] },
  { id: 'QI-002', deviceId: 'DEV-302', deviceSN: 'SN-DEV-302', deviceName: 'AlphaBot 1', locationId: 'LOC-001', projectId: 'PROJ-001', issueDesc: '设备运行时发出异常响声，疑似关节松动', reporterId: 'user-zhangsan', reporterName: '张三', reportTime: '2026-06-21 09:15', status: '处理中', source: '手动录入', sourceStage: '在线运营', issueType: '功能异常', severity: '中', owner: '张三', linkedWorkOrder: false, processLogs: [{ time: '2026-06-21 11:00', operator: '李四', fromStatus: '待处理', toStatus: '处理中', notes: '已到场确认，关节螺丝松动，正在紧固' }] },
  { id: 'QI-003', deviceId: 'DEV-303', deviceSN: 'SN-DEV-303', deviceName: 'AlphaBot 1', locationId: 'LOC-002', projectId: 'PROJ-001', issueDesc: '屏幕显示异常，出现竖条纹花屏', reporterId: 'user-wangwu', reporterName: '王五', reportTime: '2026-06-20 16:45', status: '已关闭', source: '扫码上报', sourceStage: '在线运营', issueType: '外观缺陷', severity: '高', owner: '王五', linkedWorkOrder: false, processLogs: [{ time: '2026-06-20 17:30', operator: '赵六', fromStatus: '待处理', toStatus: '处理中', notes: '远程重启后恢复' }, { time: '2026-06-21 09:00', operator: '赵六', fromStatus: '处理中', toStatus: '已关闭', notes: '确认为软件渲染问题，已推送更新包' }] },
  { id: 'QI-004', deviceId: 'DEV-305', deviceSN: 'SN-DEV-305', deviceName: 'AlphaBot 2', locationId: 'LOC-003', projectId: 'PROJ-002', issueDesc: '充电桩对接不稳定，充电过程多次中断', reporterId: 'user-lisi', reporterName: '李四', reportTime: '2026-06-22 08:20', status: '待处理', source: '手动录入', sourceStage: '在线运营', issueType: '通信异常', severity: '高', owner: '李四', linkedWorkOrder: false, processLogs: [] },
  { id: 'QI-005', deviceId: 'DEV-307', deviceSN: 'SN-DEV-307', deviceName: 'AlphaBot 2', locationId: 'LOC-004', projectId: 'PROJ-002', issueDesc: '设备在人群密集区域速度控制响应迟滞', reporterId: 'user-zhaoliu', reporterName: '赵六', reportTime: '2026-06-21 13:00', status: '处理中', source: '扫码上报', sourceStage: '在线运营', issueType: '性能不达标', severity: '中', owner: '赵六', linkedWorkOrder: false, processLogs: [{ time: '2026-06-21 15:00', operator: '王五', fromStatus: '待处理', toStatus: '处理中', notes: '系感知延迟导致，正在调整参数' }] },
  { id: 'QI-006', deviceId: 'DEV-308', deviceSN: 'SN-DEV-308', deviceName: 'AlphaBot 2', locationId: 'LOC-005', projectId: 'PROJ-003', issueDesc: '电量低于20%时自主返回充电桩功能失效', reporterId: 'user-zhangsan', reporterName: '张三', reportTime: '2026-06-20 11:30', status: '已关闭', source: '手动录入', sourceStage: '在线运营', issueType: '功能异常', severity: '高', owner: '张三', linkedWorkOrder: false, processLogs: [{ time: '2026-06-20 14:00', operator: '李四', fromStatus: '待处理', toStatus: '处理中', notes: '确认为固件bug，申请补丁' }, { time: '2026-06-22 10:00', operator: '李四', fromStatus: '处理中', toStatus: '已关闭', notes: '固件补丁已推送，功能验证通过' }] },
  { id: 'QI-007', deviceId: 'DEV-310', deviceSN: 'SN-DEV-310', deviceName: 'AlphaBot 2', locationId: 'LOC-006', projectId: 'PROJ-003', issueDesc: 'B区安检通道附近LIDAR点云数据丢失，影响避障', reporterId: 'user-wangwu', reporterName: '王五', reportTime: '2026-06-22 10:00', status: '待处理', source: '扫码上报', sourceStage: '在线运营', issueType: '通信异常', severity: '高', owner: '王五', linkedWorkOrder: false, processLogs: [] },
  { id: 'QI-008', deviceId: 'DEV-304', deviceSN: 'SN-DEV-304', deviceName: 'AlphaBot 1', locationId: 'LOC-002', projectId: 'PROJ-001', issueDesc: '设备在湿滑地面行进时偶发打滑，里程计偏差大', reporterId: 'user-zhaoliu', reporterName: '赵六', reportTime: '2026-06-18 09:30', status: '已关闭', source: '扫码上报', sourceStage: '在线运营', issueType: '功能异常', severity: '中', owner: '赵六', linkedWorkOrder: false, processLogs: [{ time: '2026-06-18 11:00', operator: '王五', fromStatus: '待处理', toStatus: '处理中', notes: '底盘轮胎磨损，已申请更换' }, { time: '2026-06-20 15:00', operator: '王五', fromStatus: '处理中', toStatus: '已关闭', notes: '轮胎更换完成，误差在允许范围内' }] },
  { id: 'QI-009', deviceId: 'DEV-306', deviceSN: 'SN-DEV-306', deviceName: 'AlphaBot 2', locationId: 'LOC-003', projectId: 'PROJ-002', issueDesc: '机器人语音播报功能异常，提示音模糊', reporterId: 'user-zhangsan', reporterName: '张三', reportTime: '2026-06-17 15:20', status: '已关闭', source: '手动录入', sourceStage: '在线运营', issueType: '功能异常', severity: '中', owner: '张三', linkedWorkOrder: false, processLogs: [{ time: '2026-06-17 17:00', operator: '赵六', fromStatus: '待处理', toStatus: '处理中', notes: '扬声器积灰，清洁后恢复正常' }, { time: '2026-06-18 09:00', operator: '赵六', fromStatus: '处理中', toStatus: '已关闭', notes: '持续监测24小时，问题未复现' }] },
  // 交付阶段质量问题（交付中设备）
  { id: 'QI-010', deviceId: 'DEV-205', deviceSN: 'SN-DEV-205', deviceName: 'AlphaBot 2', locationId: null, projectId: 'PROJ-002', issueDesc: '出厂检验发现IP65防护密封性不足', reporterId: 'user-zhangsan', reporterName: '张三', reportTime: '2026-06-19 09:30', status: '处理中', source: '手动录入', sourceStage: '出厂检验', issueType: '功能异常', severity: '高', owner: '张三', linkedWorkOrder: true, linkedWorkOrderId: 'DWO-002', processLogs: [{ time: '2026-06-19 10:00', operator: '张三', fromStatus: '待处理', toStatus: '处理中', notes: '已生成交付换件工单 DWO-002' }] },
  { id: 'QI-011', deviceId: 'DEV-206', deviceSN: 'SN-DEV-206', deviceName: 'AlphaBot 2', locationId: 'LOC-008', projectId: 'PROJ-002', issueDesc: '现场安装调试时网络连接不稳定，丢包率高', reporterId: 'user-wangwu', reporterName: '王五', reportTime: '2026-06-21 14:30', status: '处理中', source: '扫码上报', sourceStage: '现场安装调试', issueType: '通信异常', severity: '中', owner: '王五', linkedWorkOrder: true, linkedWorkOrderId: 'DWO-003', processLogs: [{ time: '2026-06-21 15:00', operator: '王五', fromStatus: '待处理', toStatus: '处理中', notes: '排查网络模块固件' }] },
  { id: 'QI-012', deviceId: 'DEV-208', deviceSN: 'SN-DEV-208', deviceName: 'AlphaBot 2', locationId: 'LOC-007', projectId: 'PROJ-003', issueDesc: '现场安装时发现设备外观有划伤', reporterId: 'user-lisi', reporterName: '李四', reportTime: '2026-06-21 16:30', status: '待处理', source: '手动录入', sourceStage: '现场安装调试', issueType: '外观缺陷', severity: '低', owner: '李四', linkedWorkOrder: true, linkedWorkOrderId: 'DWO-004', processLogs: [] },
  { id: 'QI-013', deviceId: 'DEV-204', deviceSN: 'SN-DEV-204', deviceName: 'AlphaBot 1', locationId: 'LOC-009', projectId: 'PROJ-001', issueDesc: '客户验收时反馈设备启动时间过长', reporterId: 'user-zhangsan', reporterName: '张三', reportTime: '2026-06-22 08:30', status: '待处理', source: '手动录入', sourceStage: '客户验收', issueType: '性能不达标', severity: '低', owner: '张三', linkedWorkOrder: true, linkedWorkOrderId: 'DWO-005', processLogs: [] },
  { id: 'QI-014', deviceId: 'DEV-210', deviceSN: 'SN-DEV-210', deviceName: 'AlphaBot 1', locationId: 'LOC-011', projectId: 'PROJ-004', issueDesc: '医院现场安装调试时预控模块偶发重启', reporterId: 'user-zhaoliu', reporterName: '赵六', reportTime: '2026-06-21 14:30', status: '处理中', source: '扫码上报', sourceStage: '现场安装调试', issueType: '功能异常', severity: '中', owner: '赵六', linkedWorkOrder: true, linkedWorkOrderId: 'DWO-006', processLogs: [{ time: '2026-06-21 15:00', operator: '赵六', fromStatus: '待处理', toStatus: '处理中', notes: '现场排查预控供电与固件' }] },
  // 生产测试阶段质量问题（生产阶段设备；不进入售后工单中心）
  { id: 'QI-015', deviceId: 'DEV-022', deviceSN: 'SN-DEV-022', deviceName: 'AlphaBot 2', locationId: null, projectId: 'PROJ-002', issueDesc: '中测阶段驱动电机连续运行温升过快', reporterId: 'user-zhaoliu', reporterName: '赵六', reportTime: '2026-06-21 09:10', status: '处理中', source: '扫码上报', sourceStage: '生产测试', issueType: '性能不达标', severity: '高', owner: '张三', linkedWorkOrder: false, processLogs: [{ time: '2026-06-21 09:30', operator: '张三', fromStatus: '待处理', toStatus: '处理中', notes: '关联生产工单 PWO-004 处理' }] },
  { id: 'QI-016', deviceId: 'DEV-026', deviceSN: 'SN-DEV-026', deviceName: 'AlphaBot 2', locationId: null, projectId: 'PROJ-002', issueDesc: '半成品检验发现IMU传感器初始化失败', reporterId: 'user-wangwu', reporterName: '王五', reportTime: '2026-06-13 09:10', status: '待处理', source: '手动录入', sourceStage: '生产测试', issueType: '功能异常', severity: '中', owner: '王五', linkedWorkOrder: false, processLogs: [] },
];

