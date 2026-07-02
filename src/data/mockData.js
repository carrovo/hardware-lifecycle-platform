// Mock Data for Hardware Lifecycle Management Platform

export const USERS = ['张三', '李四', '王五', '赵六'];

export const MATERIAL_CATEGORIES = ['底盘', '机械臂', '电机', '末端', '全身相机', '预控', '传感器'];

export const moduleTypes = [
  { id: 'MT-001', name: '差速驱动底盘', category: '底盘', specs: '承重≥80kg，最大速度1.5m/s，续航≥8h，IP54', urdf: 'chassis_diff_v2.urdf', active: true },
  { id: 'MT-001B', name: '全向轮底盘', category: '底盘', specs: '承重≥60kg，全向移动，最大速度1.0m/s，续航≥6h', urdf: 'chassis_omni_v1.urdf', active: true },
  { id: 'MT-002', name: '六自由度机械臂', category: '机械臂', specs: '臂展860mm，末端重复定位精度±0.02mm，额定负载5kg', urdf: 'arm_6dof_v3.urdf', active: true },
  { id: 'MT-003', name: '关节伺服电机', category: '电机', specs: '额定转矩8N·m，编码器17bit，峰值转矩24N·m', urdf: 'joint_motor_v2.urdf', active: true },
  { id: 'MT-003B', name: '驱动轮电机', category: '电机', specs: '额定转速3000rpm，编码器13bit，IPX5防护', urdf: 'drive_motor_v1.urdf', active: false },
  { id: 'MT-004', name: '执行夹爪末端', category: '末端', specs: '夹持力0-50N，开口行程0-85mm，精度±0.5mm', urdf: 'gripper_v2.urdf', active: true },
  { id: 'MT-004B', name: '六维力矩传感器末端', category: '末端', specs: '量程Fx/Fy/Fz 200N，Mx/My/Mz 10N·m，采样率1kHz', urdf: 'force_sensor_v1.urdf', active: true },
  { id: 'MT-005', name: '腕部RGBD相机', category: '全身相机', specs: '深度分辨率640×480@30fps，测距范围0.3-3m', urdf: 'wrist_cam_v1.urdf', active: true },
  { id: 'MT-005B', name: '头部RGBD相机', category: '全身相机', specs: '深度分辨率1280×720@30fps，FOV 87°', urdf: 'head_cam_v2.urdf', active: true },
  { id: 'MT-005C', name: '胸部广角相机', category: '全身相机', specs: '1080P@60fps，FOV 120°，鱼眼畸变<2%', urdf: 'chest_cam_v1.urdf', active: true },
  { id: 'MT-006', name: '感知控制预控模块', category: '预控', specs: '搭载8核CPU+GPU，运行频率200Hz，支持ROS2，板载32GB存储', urdf: 'precontrol_v3.urdf', active: true },
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
  // BATCH-009: 底盘, 务实科技
  { id: 'MAT-021', sn: 'SN-CHASSIS-004', category: '底盘', model: 'CH-2026-A', batchNo: 'BATCH-2026-009', supplier: '务实科技', quantity: 1, inspectionResult: '合格', inspector: '张三', inspectionTime: '2026-05-12 09:00', status: '待装配', notes: '', manufactureDate: '2025-12-19', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-022', sn: 'SN-CHASSIS-005', category: '底盘', model: 'CH-2026-A', batchNo: 'BATCH-2026-009', supplier: '务实科技', quantity: 1, inspectionResult: '合格', inspector: '张三', inspectionTime: '2026-05-12 09:10', status: '待装配', notes: '', manufactureDate: '2025-12-23', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-023', sn: 'SN-CHASSIS-006', category: '底盘', model: 'CH-2026-A', batchNo: 'BATCH-2026-009', supplier: '务实科技', quantity: 1, inspectionResult: '合格', inspector: '张三', inspectionTime: '2026-05-12 09:20', status: '待装配', notes: '', manufactureDate: '2025-12-27', firmwareVersion: '', operatingHours: 0 },
  // BATCH-010: 机械臂, 务实科技
  { id: 'MAT-024', sn: 'SN-ARM-006', category: '机械臂', model: 'ARM-2026-B', batchNo: 'BATCH-2026-010', supplier: '务实科技', quantity: 1, inspectionResult: '合格', inspector: '李四', inspectionTime: '2026-05-14 10:00', status: '待装配', notes: '', manufactureDate: '2025-12-31', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-025', sn: 'SN-ARM-007', category: '机械臂', model: 'ARM-2026-B', batchNo: 'BATCH-2026-010', supplier: '务实科技', quantity: 1, inspectionResult: '合格', inspector: '李四', inspectionTime: '2026-05-14 10:10', status: '待装配', notes: '', manufactureDate: '2026-01-04', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-026', sn: 'SN-ARM-008', category: '机械臂', model: 'ARM-2026-B', batchNo: 'BATCH-2026-010', supplier: '务实科技', quantity: 1, inspectionResult: '合格', inspector: '李四', inspectionTime: '2026-05-14 10:20', status: '待装配', notes: '', manufactureDate: '2026-01-08', firmwareVersion: '', operatingHours: 0 },
  // BATCH-011: 电机, 迈驰驱动
  { id: 'MAT-027', sn: 'SN-MOTOR-007', category: '电机', model: 'MTR-2026-C', batchNo: 'BATCH-2026-011', supplier: '迈驰驱动', quantity: 1, inspectionResult: '不合格', inspector: '王五', inspectionTime: '2026-05-15 08:30', status: '退货换货', notes: '转子偏心，振动超标', manufactureDate: '2026-01-12', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-028', sn: 'SN-MOTOR-008', category: '电机', model: 'MTR-2026-C', batchNo: 'BATCH-2026-011', supplier: '迈驰驱动', quantity: 1, inspectionResult: '合格', inspector: '王五', inspectionTime: '2026-05-15 08:40', status: '待装配', notes: '', manufactureDate: '2026-01-16', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-029', sn: 'SN-MOTOR-009', category: '电机', model: 'MTR-2026-C', batchNo: 'BATCH-2026-011', supplier: '迈驰驱动', quantity: 1, inspectionResult: '合格', inspector: '王五', inspectionTime: '2026-05-15 08:50', status: '待装配', notes: '', manufactureDate: '2026-01-20', firmwareVersion: '', operatingHours: 0 },
  // BATCH-012: 末端, 务实科技
  { id: 'MAT-030', sn: 'SN-END-003', category: '末端', model: 'END-2026-D', batchNo: 'BATCH-2026-012', supplier: '务实科技', quantity: 1, inspectionResult: '合格', inspector: '赵六', inspectionTime: '2026-05-18 09:00', status: '待装配', notes: '', manufactureDate: '2026-01-24', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-031', sn: 'SN-END-004', category: '末端', model: 'END-2026-D', batchNo: 'BATCH-2026-012', supplier: '务实科技', quantity: 1, inspectionResult: '合格', inspector: '赵六', inspectionTime: '2026-05-18 09:10', status: '待装配', notes: '', manufactureDate: '2026-01-28', firmwareVersion: '', operatingHours: 0 },
  // BATCH-013: 全身相机, 锐视传感器
  { id: 'MAT-032', sn: 'SN-CAM-003', category: '全身相机', model: 'CAM-2026-E', batchNo: 'BATCH-2026-013', supplier: '锐视传感器', quantity: 1, inspectionResult: '特批使用', inspector: '张三', inspectionTime: '2026-05-20 10:00', status: '待装配', notes: '色差偏移轻微，特批使用', manufactureDate: '2026-02-01', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-033', sn: 'SN-CAM-004', category: '全身相机', model: 'CAM-2026-E', batchNo: 'BATCH-2026-013', supplier: '锐视传感器', quantity: 1, inspectionResult: '合格', inspector: '张三', inspectionTime: '2026-05-20 10:10', status: '待装配', notes: '', manufactureDate: '2026-02-05', firmwareVersion: '', operatingHours: 0 },
  // BATCH-014: 预控, 务实科技
  { id: 'MAT-034', sn: 'SN-CTRL-003', category: '预控', model: 'CTRL-2026-F', batchNo: 'BATCH-2026-014', supplier: '务实科技', quantity: 1, inspectionResult: '合格', inspector: '李四', inspectionTime: '2026-05-22 08:00', status: '待装配', notes: '', manufactureDate: '2026-02-09', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-035', sn: 'SN-CTRL-004', category: '预控', model: 'CTRL-2026-F', batchNo: 'BATCH-2026-014', supplier: '务实科技', quantity: 1, inspectionResult: '合格', inspector: '李四', inspectionTime: '2026-05-22 08:10', status: '待装配', notes: '', manufactureDate: '2026-02-13', firmwareVersion: '', operatingHours: 0 },
  // BATCH-015: 底盘, 务实科技 (不合格批次)
  { id: 'MAT-036', sn: 'SN-CHASSIS-007', category: '底盘', model: 'CH-2026-A', batchNo: 'BATCH-2026-015', supplier: '务实科技', quantity: 1, inspectionResult: '不合格', inspector: '王五', inspectionTime: '2026-05-25 09:00', status: '退货换货', notes: '底盘焊缝开裂', manufactureDate: '2026-02-17', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-037', sn: 'SN-CHASSIS-008', category: '底盘', model: 'CH-2026-A', batchNo: 'BATCH-2026-015', supplier: '务实科技', quantity: 1, inspectionResult: '不合格', inspector: '王五', inspectionTime: '2026-05-25 09:10', status: '退货换货', notes: '底盘焊缝开裂', manufactureDate: '2026-02-21', firmwareVersion: '', operatingHours: 0 },
  // BATCH-016: 机械臂, 务实科技 (特批使用)
  { id: 'MAT-038', sn: 'SN-ARM-009', category: '机械臂', model: 'ARM-2026-B', batchNo: 'BATCH-2026-016', supplier: '务实科技', quantity: 1, inspectionResult: '特批使用', inspector: '赵六', inspectionTime: '2026-05-28 09:30', status: '待装配', notes: '关节间隙略大，特批低速场景使用', manufactureDate: '2026-02-25', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-039', sn: 'SN-ARM-010', category: '机械臂', model: 'ARM-2026-B', batchNo: 'BATCH-2026-016', supplier: '务实科技', quantity: 1, inspectionResult: '合格', inspector: '赵六', inspectionTime: '2026-05-28 09:40', status: '待装配', notes: '', manufactureDate: '2026-03-01', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-040', sn: 'SN-ARM-011', category: '机械臂', model: 'ARM-2026-B', batchNo: 'BATCH-2026-016', supplier: '务实科技', quantity: 1, inspectionResult: '合格', inspector: '赵六', inspectionTime: '2026-05-28 09:50', status: '待装配', notes: '', manufactureDate: '2026-03-05', firmwareVersion: '', operatingHours: 0 },
  // BATCH-017: 电机, 迈驰驱动
  { id: 'MAT-041', sn: 'SN-MOTOR-010', category: '电机', model: 'MTR-2026-C', batchNo: 'BATCH-2026-017', supplier: '迈驰驱动', quantity: 1, inspectionResult: '合格', inspector: '张三', inspectionTime: '2026-06-01 08:00', status: '待装配', notes: '', manufactureDate: '2026-03-09', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-042', sn: 'SN-MOTOR-011', category: '电机', model: 'MTR-2026-C', batchNo: 'BATCH-2026-017', supplier: '迈驰驱动', quantity: 1, inspectionResult: '合格', inspector: '张三', inspectionTime: '2026-06-01 08:10', status: '待装配', notes: '', manufactureDate: '2026-03-13', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-043', sn: 'SN-MOTOR-012', category: '电机', model: 'MTR-2026-C', batchNo: 'BATCH-2026-017', supplier: '迈驰驱动', quantity: 1, inspectionResult: '合格', inspector: '张三', inspectionTime: '2026-06-01 08:20', status: '待装配', notes: '', manufactureDate: '2026-03-17', firmwareVersion: '', operatingHours: 0 },
  // BATCH-018: 末端, 锐视传感器 (不合格)
  { id: 'MAT-044', sn: 'SN-END-005', category: '末端', model: 'END-2026-D', batchNo: 'BATCH-2026-018', supplier: '锐视传感器', quantity: 1, inspectionResult: '不合格', inspector: '李四', inspectionTime: '2026-06-03 10:00', status: '退货换货', notes: '传感器灵敏度不达标', manufactureDate: '2026-03-21', firmwareVersion: '', operatingHours: 0 },
  // BATCH-019: 全身相机, 锐视传感器
  { id: 'MAT-045', sn: 'SN-CAM-005', category: '全身相机', model: 'CAM-2026-E', batchNo: 'BATCH-2026-019', supplier: '锐视传感器', quantity: 1, inspectionResult: '合格', inspector: '王五', inspectionTime: '2026-06-05 09:00', status: '待装配', notes: '', manufactureDate: '2026-03-25', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-046', sn: 'SN-CAM-006', category: '全身相机', model: 'CAM-2026-E', batchNo: 'BATCH-2026-019', supplier: '锐视传感器', quantity: 1, inspectionResult: '合格', inspector: '王五', inspectionTime: '2026-06-05 09:10', status: '待装配', notes: '', manufactureDate: '2026-03-29', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-047', sn: 'SN-CAM-007', category: '全身相机', model: 'CAM-2026-E', batchNo: 'BATCH-2026-019', supplier: '锐视传感器', quantity: 1, inspectionResult: '合格', inspector: '王五', inspectionTime: '2026-06-05 09:20', status: '待装配', notes: '', manufactureDate: '2026-04-02', firmwareVersion: '', operatingHours: 0 },
  // BATCH-020: 预控, 务实科技
  { id: 'MAT-048', sn: 'SN-CTRL-005', category: '预控', model: 'CTRL-2026-F', batchNo: 'BATCH-2026-020', supplier: '务实科技', quantity: 1, inspectionResult: '合格', inspector: '赵六', inspectionTime: '2026-06-08 08:30', status: '待装配', notes: '', manufactureDate: '2026-04-06', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-049', sn: 'SN-CTRL-006', category: '预控', model: 'CTRL-2026-F', batchNo: 'BATCH-2026-020', supplier: '务实科技', quantity: 1, inspectionResult: '合格', inspector: '赵六', inspectionTime: '2026-06-08 08:40', status: '维修中', notes: '固件刷写失败，送修', manufactureDate: '2026-04-10', firmwareVersion: '', operatingHours: 436 },
  // BATCH-021: 底盘, 迈驰驱动
  { id: 'MAT-050', sn: 'SN-CHASSIS-009', category: '底盘', model: 'CH-2026-B', batchNo: 'BATCH-2026-021', supplier: '迈驰驱动', quantity: 1, inspectionResult: '合格', inspector: '张三', inspectionTime: '2026-06-10 09:00', status: '待装配', notes: '', manufactureDate: '2026-04-14', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-051', sn: 'SN-CHASSIS-010', category: '底盘', model: 'CH-2026-B', batchNo: 'BATCH-2026-021', supplier: '迈驰驱动', quantity: 1, inspectionResult: '合格', inspector: '张三', inspectionTime: '2026-06-10 09:10', status: '已报废', notes: '搬运中碰撞损坏，无法修复', manufactureDate: '2026-04-18', firmwareVersion: '', operatingHours: 2250 },
  // BATCH-022: 电机, 迈驰驱动
  { id: 'MAT-052', sn: 'SN-MOTOR-013', category: '电机', model: 'MTR-2026-C', batchNo: 'BATCH-2026-022', supplier: '迈驰驱动', quantity: 1, inspectionResult: '合格', inspector: '李四', inspectionTime: '2026-06-15 08:00', status: '待装配', notes: '', manufactureDate: '2026-04-22', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-053', sn: 'SN-MOTOR-014', category: '电机', model: 'MTR-2026-C', batchNo: 'BATCH-2026-022', supplier: '迈驰驱动', quantity: 1, inspectionResult: '合格', inspector: '李四', inspectionTime: '2026-06-15 08:10', status: '待装配', notes: '', manufactureDate: '2026-04-26', firmwareVersion: '', operatingHours: 0 },
  { id: 'MAT-054', sn: 'SN-MOTOR-015', category: '电机', model: 'MTR-2026-C', batchNo: 'BATCH-2026-022', supplier: '迈驰驱动', quantity: 1, inspectionResult: '合格', inspector: '李四', inspectionTime: '2026-06-15 08:20', status: '维修中', notes: '编码器故障，返厂维修', manufactureDate: '2026-04-30', firmwareVersion: '', operatingHours: 400 },
];

export const devices = [
  { id: 'DEV-001', sn: 'SN-DEV-001', deviceTypeId: 'DT-001', status: '已入库', assembler: '张三', assemblyTime: '2026-06-11 10:00', photoName: 'assembly_dev001.jpg', usedMaterials: [{ materialId: 'MAT-001', moduleTypeId: 'MT-001' }, { materialId: 'MAT-003', moduleTypeId: 'MT-002' }], productionPlanId: 'WPP-002', erpInboundNo: 'PI-2026-031', erpInspectionNo: 'QC-2026-031', erpInspectionStatus: '合格', erpStockStatus: '合格可用', erpSerialNo: 'SN-DEV-001', warehouse: '成品库', inboundTime: '2026-06-15 09:30', labels: { 批次标签: '首批' }, createdAt: '2026-06-11 10:00', updatedAt: '2026-06-15 09:30' },
  { id: 'DEV-002', sn: 'SN-DEV-002', deviceTypeId: 'DT-001', status: '生产返修中', assembler: '李四', assemblyTime: '2026-06-16 14:00', photoName: 'assembly_dev002.jpg', usedMaterials: [{ materialId: 'MAT-001', moduleTypeId: 'MT-001' }, { materialId: 'MAT-003', moduleTypeId: 'MT-002' }], productionPlanId: 'WPP-002', createdAt: '2026-06-16 14:00', updatedAt: '2026-06-17 09:00' },
  { id: 'DEV-003', sn: 'SN-DEV-003', deviceTypeId: 'DT-001', status: '中测中', assembler: '王五', assemblyTime: '2026-06-14 09:00', photoName: 'assembly_dev003.jpg', usedMaterials: [{ materialId: 'MAT-006', moduleTypeId: 'MT-003' }, { materialId: 'MAT-009', moduleTypeId: 'MT-004' }], productionPlanId: 'WPP-002', createdAt: '2026-06-14 09:00', updatedAt: '2026-06-16 15:00' },
  { id: 'DEV-004', sn: 'SN-DEV-004', deviceTypeId: 'DT-002', status: '待入库', assembler: '赵六', assemblyTime: '2026-06-10 08:00', photoName: 'assembly_dev004.jpg', usedMaterials: [{ materialId: 'MAT-013', moduleTypeId: 'MT-006' }], productionPlanId: 'WPP-005', createdAt: '2026-06-10 08:00', updatedAt: '2026-06-19 08:00' },
  { id: 'DEV-005', sn: 'SN-DEV-005', deviceTypeId: 'DT-002', status: '生产返修中', assembler: '张三', assemblyTime: '2026-06-01 10:00', photoName: 'assembly_dev005.jpg', usedMaterials: [{ materialId: 'MAT-002', moduleTypeId: 'MT-001' }, { materialId: 'MAT-019', moduleTypeId: 'MT-002' }, { materialId: 'MAT-020', moduleTypeId: 'MT-002' }, { materialId: 'MAT-006', moduleTypeId: 'MT-003' }, { materialId: 'MAT-016', moduleTypeId: 'MT-003' }, { materialId: 'MAT-017', moduleTypeId: 'MT-003' }, { materialId: 'MAT-009', moduleTypeId: 'MT-004' }, { materialId: 'MAT-013', moduleTypeId: 'MT-006' }], productionPlanId: 'WPP-005', createdAt: '2026-06-01 10:00', updatedAt: '2026-06-08 16:00' },
  { id: 'DEV-006', sn: 'SN-DEV-006', deviceTypeId: 'DT-001', status: '生产返修中', assembler: '李四', assemblyTime: '2026-05-28 09:00', photoName: 'assembly_dev006.jpg', usedMaterials: [{ materialId: 'MAT-001', moduleTypeId: 'MT-001' }, { materialId: 'MAT-003', moduleTypeId: 'MT-002' }, { materialId: 'MAT-018', moduleTypeId: 'MT-001' }, { materialId: 'MAT-011', moduleTypeId: 'MT-005' }], productionPlanId: 'WPP-007', createdAt: '2026-05-28 09:00', updatedAt: '2026-06-05 10:00' },
  { id: 'DEV-007', sn: 'SN-DEV-007', deviceTypeId: 'DT-001', status: '已分配项目', assembler: '王五', assemblyTime: '2026-05-20 10:00', photoName: 'assembly_dev007.jpg', usedMaterials: [{ materialId: 'MAT-002', moduleTypeId: 'MT-001' }, { materialId: 'MAT-004', moduleTypeId: 'MT-002' }], projectId: 'PROJ-001', productionPlanId: 'WPP-001', erpStorageOrderNo: 'WR-2026-088', erpInboundNo: 'PI-2026-015', erpInspectionNo: 'QC-2026-015', erpInspectionStatus: '合格', erpStockStatus: '合格可用', erpSerialNo: 'SN-DEV-007', createdAt: '2026-05-20 10:00', updatedAt: '2026-06-10 09:00' },
  { id: 'DEV-008', sn: 'SN-DEV-008', deviceTypeId: 'DT-001', status: '生产返修中', assembler: '赵六', assemblyTime: '2026-05-18 09:00', photoName: 'assembly_dev008.jpg', usedMaterials: [{ materialId: 'MAT-011', moduleTypeId: 'MT-005' }, { materialId: 'MAT-013', moduleTypeId: 'MT-006' }], projectId: 'PROJ-001', productionPlanId: 'WPP-001', createdAt: '2026-05-18 09:00', updatedAt: '2026-06-10 09:30' },
  { id: 'DEV-009', sn: 'SN-DEV-009', locationId: 'LOC-004', deviceTypeId: 'DT-001', status: '已分配项目', assembler: '张三', assemblyTime: '2026-05-15 10:00', photoName: 'assembly_dev009.jpg', usedMaterials: [{ materialId: 'MAT-018', moduleTypeId: 'MT-001' }, { materialId: 'MAT-019', moduleTypeId: 'MT-002' }], projectId: 'PROJ-002', productionPlanId: 'WPP-004', createdAt: '2026-05-15 10:00', updatedAt: '2026-06-12 10:00' },
  { id: 'DEV-010', sn: 'SN-DEV-010', deviceTypeId: 'DT-001', status: '生产返修中', assembler: '李四', assemblyTime: '2026-04-20 09:00', photoName: 'assembly_dev010.jpg', usedMaterials: [{ materialId: 'MAT-016', moduleTypeId: 'MT-003' }, { materialId: 'MAT-017', moduleTypeId: 'MT-003' }], projectId: 'PROJ-001', productionPlanId: 'WPP-001', createdAt: '2026-04-20 09:00', updatedAt: '2026-06-21 08:55' },
  { id: 'DEV-011', sn: 'SN-DEV-011', locationId: 'LOC-003', deviceTypeId: 'DT-001', status: '在线运营', assembler: '王五', assemblyTime: '2026-04-15 10:00', photoName: 'assembly_dev011.jpg', usedMaterials: [{ materialId: 'MAT-006', moduleTypeId: 'MT-003' }], projectId: 'PROJ-002', productionPlanId: 'WPP-004', batteryPercent: 62, storagePercent: 71, lastHeartbeat: '2026-06-21 07:30', online: true, createdAt: '2026-04-15 10:00', updatedAt: '2026-06-21 07:30' },
  { id: 'DEV-012', sn: 'SN-DEV-012', locationId: 'LOC-005', deviceTypeId: 'DT-002', status: '在线运营', assembler: '赵六', assemblyTime: '2026-04-10 09:00', photoName: 'assembly_dev012.jpg', usedMaterials: [{ materialId: 'MAT-009', moduleTypeId: 'MT-004' }], projectId: 'PROJ-003', productionPlanId: 'WPP-006', batteryPercent: 15, storagePercent: 88, lastHeartbeat: '2026-06-20 23:10', online: false, createdAt: '2026-04-10 09:00', updatedAt: '2026-06-20 23:10' },
  { id: 'DEV-013', sn: 'SN-DEV-013', deviceTypeId: 'DT-001', status: '半成品检验中', assembler: '张三', assemblyTime: '2026-03-25 10:00', photoName: 'assembly_dev013.jpg', usedMaterials: [], projectId: 'PROJ-001', productionPlanId: 'WPP-001', createdAt: '2026-03-25 10:00', updatedAt: '2026-06-21 09:02' },
  // 全工站 Pass、待整机入库 (WPP-002)
  { id: 'DEV-014', sn: 'SN-DEV-014', deviceTypeId: 'DT-001', status: '待入库', assembler: '张三', assemblyTime: '2026-06-12 10:00', photoName: 'assembly_dev014.jpg', usedMaterials: [{ materialId: 'MAT-001', moduleTypeId: 'MT-001' }], productionPlanId: 'WPP-002', erpInboundNo: 'PI-2026-032', erpInspectionStatus: '待检', erpStockStatus: '待检', createdAt: '2026-06-12 10:00', updatedAt: '2026-06-19 16:00' },
  { id: 'DEV-015', sn: 'SN-DEV-015', deviceTypeId: 'DT-001', status: '待入库', assembler: '李四', assemblyTime: '2026-06-13 09:30', photoName: 'assembly_dev015.jpg', usedMaterials: [{ materialId: 'MAT-003', moduleTypeId: 'MT-002' }], productionPlanId: 'WPP-002', createdAt: '2026-06-13 09:30', updatedAt: '2026-06-19 16:30' },
  // 装配中 / 检验中 (WPP-002)
  { id: 'DEV-016', sn: 'SN-DEV-016', deviceTypeId: 'DT-001', status: '初测中', assembler: '李四', assemblyTime: '2026-06-19 09:00', photoName: 'assembly_dev016.jpg', usedMaterials: [], productionPlanId: 'WPP-002', createdAt: '2026-06-19 09:00', updatedAt: '2026-06-19 12:00' },
  { id: 'DEV-017', sn: 'SN-DEV-017', deviceTypeId: 'DT-002', status: '生产返修中', assembler: '王五', assemblyTime: '2026-06-20 10:30', photoName: 'assembly_dev017.jpg', usedMaterials: [], productionPlanId: 'WPP-002', createdAt: '2026-06-20 10:30', updatedAt: '2026-06-20 10:30' },
  // 中测中/OQT终测中 (WPP-005)
  { id: 'DEV-018', sn: 'SN-DEV-018', deviceTypeId: 'DT-001', status: 'OQT终测中', assembler: '赵六', assemblyTime: '2026-06-16 11:00', photoName: 'assembly_dev018.jpg', usedMaterials: [{ materialId: 'MAT-002', moduleTypeId: 'MT-001' }, { materialId: 'MAT-004', moduleTypeId: 'MT-002' }], productionPlanId: 'WPP-005', createdAt: '2026-06-16 11:00', updatedAt: '2026-06-17 10:00' },
  { id: 'DEV-019', sn: 'SN-DEV-019', deviceTypeId: 'DT-002', status: '生产返修中', assembler: '张三', assemblyTime: '2026-06-15 14:30', photoName: 'assembly_dev019.jpg', usedMaterials: [{ materialId: 'MAT-007', moduleTypeId: 'MT-003' }], productionPlanId: 'WPP-005', createdAt: '2026-06-15 14:30', updatedAt: '2026-06-17 09:30' },
  // 生产返修中 (WPP-007)
  { id: 'DEV-020', sn: 'SN-DEV-020', deviceTypeId: 'DT-001', status: '生产返修中', assembler: '李四', assemblyTime: '2026-06-13 09:00', photoName: 'assembly_dev020.jpg', usedMaterials: [{ materialId: 'MAT-010', moduleTypeId: 'MT-004' }], productionPlanId: 'WPP-007', createdAt: '2026-06-13 09:00', updatedAt: '2026-06-16 14:00' },
  // 终测中 (WPP-007)
  { id: 'DEV-021', sn: 'SN-DEV-021', deviceTypeId: 'DT-002', status: '待入库', assembler: '王五', assemblyTime: '2026-06-09 08:30', photoName: 'assembly_dev021.jpg', usedMaterials: [{ materialId: 'MAT-014', moduleTypeId: 'MT-006' }], productionPlanId: 'WPP-007', createdAt: '2026-06-09 08:30', updatedAt: '2026-06-19 11:00' },
  // 待分配项目 (WPP-006 completed devices)
  { id: 'DEV-022', sn: 'SN-DEV-022', deviceTypeId: 'DT-001', status: '生产返修中', assembler: '赵六', assemblyTime: '2026-06-02 10:00', photoName: 'assembly_dev022.jpg', usedMaterials: [{ materialId: 'MAT-018', moduleTypeId: 'MT-001' }, { materialId: 'MAT-019', moduleTypeId: 'MT-002' }, { materialId: 'MAT-016', moduleTypeId: 'MT-003' }], productionPlanId: 'WPP-006', createdAt: '2026-06-02 10:00', updatedAt: '2026-06-09 16:00' },
  // Additional completed devices for WPP-001 / WPP-006
  { id: 'DEV-023', sn: 'SN-DEV-023', deviceTypeId: 'DT-002', status: '已分配项目', assembler: '张三', assemblyTime: '2026-05-22 09:00', photoName: 'assembly_dev023.jpg', usedMaterials: [], projectId: 'PROJ-003', productionPlanId: 'WPP-006', createdAt: '2026-05-22 09:00', updatedAt: '2026-06-08 10:00' },
  { id: 'DEV-024', sn: 'SN-DEV-024', locationId: 'LOC-006', deviceTypeId: 'DT-001', status: '在线运营', assembler: '李四', assemblyTime: '2026-05-10 09:00', photoName: 'assembly_dev024.jpg', usedMaterials: [], projectId: 'PROJ-003', productionPlanId: 'WPP-006', batteryPercent: 74, storagePercent: 55, lastHeartbeat: '2026-06-22 08:10', online: true, createdAt: '2026-05-10 09:00', updatedAt: '2026-06-22 08:10' },
  { id: 'DEV-025', sn: 'SN-DEV-025', deviceTypeId: 'DT-001', status: '中测中', assembler: '王五', assemblyTime: '2026-04-28 10:00', photoName: 'assembly_dev025.jpg', usedMaterials: [], projectId: 'PROJ-001', productionPlanId: 'WPP-001', createdAt: '2026-04-28 10:00', updatedAt: '2026-06-22 09:00' },
  { id: 'DEV-026', sn: 'SN-DEV-026', deviceTypeId: 'DT-001', status: '已分配项目', assembler: '赵六', assemblyTime: '2026-05-18 08:30', photoName: 'assembly_dev026.jpg', usedMaterials: [], projectId: 'PROJ-002', productionPlanId: 'WPP-004', createdAt: '2026-05-18 08:30', updatedAt: '2026-06-13 09:00' },
  // 智魔方首批已交付在线运营设备（WPP-008 已完成计划）——用于交付计划 / 点位 / 健康告警 / 质量问题的在线示例，
  // 与 WPP-001 在制设备（DEV-008/010/013/025）解耦，避免跨页面矛盾。
  { id: 'DEV-027', sn: 'SN-DEV-027', locationId: 'LOC-001', deviceTypeId: 'DT-001', status: '在线运营', assembler: '李四', assemblyTime: '2026-04-20 09:00', photoName: 'assembly_dev027.jpg', usedMaterials: [], projectId: 'PROJ-001', productionPlanId: 'WPP-008', deliveryPlanId: 'DP-001', erpInboundNo: 'PI-2026-008', erpInspectionNo: 'QC-2026-008', erpInspectionStatus: '合格', erpStockStatus: '合格可用', erpSerialNo: 'SN-DEV-027', batteryPercent: 87, storagePercent: 42, lastHeartbeat: '2026-06-21 08:55', online: true, createdAt: '2026-04-20 09:00', updatedAt: '2026-06-21 08:55' },
  { id: 'DEV-028', sn: 'SN-DEV-028', locationId: 'LOC-001', deviceTypeId: 'DT-001', status: '在线运营', assembler: '张三', assemblyTime: '2026-03-25 10:00', photoName: 'assembly_dev028.jpg', usedMaterials: [], projectId: 'PROJ-001', productionPlanId: 'WPP-008', deliveryPlanId: 'DP-001', erpInboundNo: 'PI-2026-008', erpInspectionNo: 'QC-2026-008', erpInspectionStatus: '合格', erpStockStatus: '合格可用', erpSerialNo: 'SN-DEV-028', batteryPercent: 93, storagePercent: 30, lastHeartbeat: '2026-06-21 09:02', online: true, createdAt: '2026-03-25 10:00', updatedAt: '2026-06-21 09:02' },
  { id: 'DEV-029', sn: 'SN-DEV-029', locationId: 'LOC-002', deviceTypeId: 'DT-001', status: '在线运营', assembler: '王五', assemblyTime: '2026-04-28 10:00', photoName: 'assembly_dev029.jpg', usedMaterials: [], projectId: 'PROJ-001', productionPlanId: 'WPP-008', deliveryPlanId: 'DP-006', erpInboundNo: 'PI-2026-008', erpInspectionNo: 'QC-2026-008', erpInspectionStatus: '合格', erpStockStatus: '合格可用', erpSerialNo: 'SN-DEV-029', batteryPercent: 91, storagePercent: 18, lastHeartbeat: '2026-06-22 09:00', online: true, createdAt: '2026-04-28 10:00', updatedAt: '2026-06-22 09:00' },
];

export const testRecords = [
  { id: 'TEST-001', deviceId: 'DEV-002', testType: '功能测试', result: '不合格', operator: '张三', testTime: '2026-06-17 09:00', reportFile: 'func_test_dev002_v1.pdf', notes: '关节2运动异常', status: '有效' },
  { id: 'TEST-002', deviceId: 'DEV-002', testType: '功能测试', result: '合格', operator: '张三', testTime: '2026-06-17 15:00', reportFile: 'func_test_dev002_v2.pdf', notes: '重新调整后通过', status: '有效' },
  { id: 'TEST-003', deviceId: 'DEV-003', testType: '功能测试', result: '合格', operator: '李四', testTime: '2026-06-15 10:00', reportFile: 'func_test_dev003.pdf', notes: '', status: '有效' },
  { id: 'TEST-004', deviceId: 'DEV-003', testType: '老化测试', result: '不合格', operator: '王五', testTime: '2026-06-16 08:00', reportFile: 'burn_test_dev003_v1.pdf', notes: '温度异常', duration: '24小时', peakTemp: '85°C', anomalyCount: 3, status: '有效' },
  { id: 'TEST-005', deviceId: 'DEV-003', testType: '老化测试', result: '合格', operator: '王五', testTime: '2026-06-16 15:00', reportFile: 'burn_test_dev003_v2.pdf', notes: '更换散热模块后通过', duration: '48小时', peakTemp: '72°C', anomalyCount: 0, status: '有效' },
  { id: 'TEST-006', deviceId: 'DEV-004', testType: '功能测试', result: '合格', operator: '张三', testTime: '2026-06-12 10:00', reportFile: 'func_test_dev004.pdf', notes: '', status: '有效' },
  { id: 'TEST-007', deviceId: 'DEV-004', testType: '老化测试', result: '合格', operator: '李四', testTime: '2026-06-14 08:00', reportFile: 'burn_test_dev004.pdf', notes: '', duration: '72小时', peakTemp: '68°C', anomalyCount: 0, status: '有效' },
  { id: 'TEST-008', deviceId: 'DEV-005', testType: '功能测试', result: '合格', operator: '王五', testTime: '2026-06-03 10:00', reportFile: 'func_test_dev005.pdf', notes: '', status: '有效' },
  { id: 'TEST-009', deviceId: 'DEV-005', testType: '老化测试', result: '合格', operator: '赵六', testTime: '2026-06-05 08:00', reportFile: 'burn_test_dev005.pdf', notes: '', duration: '72小时', peakTemp: '70°C', anomalyCount: 1, status: '有效' },
  { id: 'TEST-010', deviceId: 'DEV-005', testType: '终测', result: '合格', operator: '张三', testTime: '2026-06-07 09:00', reportFile: 'final_test_dev005.pdf', notes: '', status: '有效' },
  { id: 'TEST-011', deviceId: 'DEV-006', testType: '功能测试', result: '合格', operator: '李四', testTime: '2026-05-30 10:00', reportFile: 'func_test_dev006.pdf', notes: '', status: '有效' },
  { id: 'TEST-012', deviceId: 'DEV-006', testType: '老化测试', result: '合格', operator: '王五', testTime: '2026-06-01 08:00', reportFile: 'burn_test_dev006.pdf', notes: '', duration: '72小时', peakTemp: '65°C', anomalyCount: 0, status: '有效' },
  { id: 'TEST-013', deviceId: 'DEV-006', testType: '终测', result: '合格', operator: '赵六', testTime: '2026-06-03 09:00', reportFile: 'final_test_dev006.pdf', notes: '', status: '有效' },
  { id: 'TEST-014', deviceId: 'DEV-007', testType: '功能测试', result: '合格', operator: '张三', testTime: '2026-05-22 10:00', reportFile: 'func_test_dev007.pdf', notes: '', status: '有效' },
  { id: 'TEST-015', deviceId: 'DEV-007', testType: '老化测试', result: '合格', operator: '李四', testTime: '2026-05-24 08:00', reportFile: 'burn_test_dev007.pdf', notes: '', duration: '72小时', peakTemp: '69°C', anomalyCount: 0, status: '有效' },
  { id: 'TEST-016', deviceId: 'DEV-007', testType: '终测', result: '合格', operator: '王五', testTime: '2026-05-26 09:00', reportFile: 'final_test_dev007.pdf', notes: '', status: '有效' },
  { id: 'TEST-020', deviceId: 'DEV-009', testType: '功能测试', result: '合格', operator: '王五', testTime: '2026-05-17 10:00', reportFile: 'func_test_dev009.pdf', notes: '', status: '有效' },
  { id: 'TEST-021', deviceId: 'DEV-009', testType: '老化测试', result: '不合格', operator: '赵六', testTime: '2026-05-19 08:00', reportFile: 'burn_test_dev009_v1.pdf', notes: '电机过热', duration: '24小时', peakTemp: '91°C', anomalyCount: 5, status: '有效' },
  { id: 'TEST-022', deviceId: 'DEV-009', testType: '老化测试', result: '合格', operator: '赵六', testTime: '2026-05-21 08:00', reportFile: 'burn_test_dev009_v2.pdf', notes: '更换散热后通过', duration: '72小时', peakTemp: '71°C', anomalyCount: 0, status: '有效' },
  { id: 'TEST-023', deviceId: 'DEV-009', testType: '终测', result: '合格', operator: '张三', testTime: '2026-05-23 09:00', reportFile: 'final_test_dev009.pdf', notes: '', status: '有效' },
  { id: 'TEST-024', deviceId: 'DEV-027', testType: '终测', result: '合格', operator: '李四', testTime: '2026-04-18 10:00', reportFile: 'final_test_dev010.pdf', notes: '', status: '有效' },
  { id: 'TEST-025', deviceId: 'DEV-011', testType: '终测', result: '合格', operator: '王五', testTime: '2026-04-13 10:00', reportFile: 'final_test_dev011.pdf', notes: '', status: '有效' },
  // Quality station records
  { id: 'TEST-S001', deviceId: 'DEV-001', stationKey: 'semi', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '张三', testTime: '2026-06-10 09:00', reportFile: 'semi_DEV001.pdf', reportLink: '', notes: '半成品检验通过', status: '有效' },
  { id: 'TEST-S002', deviceId: 'DEV-002', stationKey: 'semi', stationResult: 'NG', testType: '功能测试', result: '不合格', operator: '张三', testTime: '2026-06-10 10:00', reportFile: '', reportLink: '', notes: 'PCB接口故障', ngReason: 'PCB接口虚焊', repairPerson: '李四', repairAction: '重新焊接PCB接口', estimatedCompletion: '2026-06-12', status: '有效' },
  { id: 'TEST-S003', deviceId: 'DEV-016', stationKey: 'semi', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '张三', testTime: '2026-06-19 10:00', reportFile: 'semi_DEV016.pdf', reportLink: '', notes: '半成品检验通过', status: '有效' },
  { id: 'TEST-I001', deviceId: 'DEV-001', stationKey: 'init', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '王五', testTime: '2026-06-11 09:00', reportFile: 'init_DEV001.pdf', reportLink: '', notes: '初测全部功能正常', status: '有效' },
  { id: 'TEST-I002', deviceId: 'DEV-017', stationKey: 'init', stationResult: 'NG', testType: '功能测试', result: '不合格', operator: '王五', testTime: '2026-06-20 11:00', reportFile: '', reportLink: '', notes: '传感器响应异常', ngReason: '关节传感器信号中断', repairPerson: '赵六', repairAction: '更换关节传感器', estimatedCompletion: '2026-06-22', status: '有效' },
  { id: 'TEST-M001', deviceId: 'DEV-001', stationKey: 'mid', stationResult: 'Pass', testType: '老化测试', result: '合格', operator: '王五', testTime: '2026-06-13 09:00', duration: '72小时', peakTemp: '68°C', anomalyCount: 0, reportFile: 'aging_DEV001.pdf', reportLink: '', notes: '老化测试通过', status: '有效' },
  { id: 'TEST-M002', deviceId: 'DEV-018', stationKey: 'mid', stationResult: 'Pass', testType: '老化测试', result: '合格', operator: '王五', testTime: '2026-06-17 10:00', duration: '48小时', peakTemp: '71°C', anomalyCount: 0, reportFile: 'aging_DEV018.pdf', reportLink: '', notes: '中测通过', status: '有效' },
  { id: 'TEST-O001', deviceId: 'DEV-001', stationKey: 'oqt', stationResult: 'Pass', testType: '终测', result: '合格', operator: '张三', testTime: '2026-06-14 15:00', reportFile: 'oqt_DEV001.pdf', reportLink: '', notes: 'OQT终测通过，质检员已签核', status: '有效' },
  // Expanded station records — 7-day span (2026-06-16 to 2026-06-22), covering all 4 stations
  // semi
  { id: 'TEST-S004', deviceId: 'DEV-004', stationKey: 'semi', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '李四', testTime: '2026-06-16 09:30', reportFile: 'semi_DEV004.pdf', reportLink: '', notes: '', status: '有效' },
  { id: 'TEST-S005', deviceId: 'DEV-005', stationKey: 'semi', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '李四', testTime: '2026-06-16 10:30', reportFile: 'semi_DEV005.pdf', reportLink: '', notes: '', status: '有效' },
  { id: 'TEST-S006', deviceId: 'DEV-006', stationKey: 'semi', stationResult: 'NG', testType: '功能测试', result: '不合格', operator: '张三', testTime: '2026-06-17 09:00', reportFile: '', reportLink: '', notes: '传感器通信异常', ngReason: 'IMU传感器初始化失败', repairPerson: '王五', repairAction: '更换IMU模组', estimatedCompletion: '2026-06-19', status: '有效' },
  { id: 'TEST-S007', deviceId: 'DEV-018', stationKey: 'semi', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '李四', testTime: '2026-06-17 10:00', reportFile: 'semi_DEV018.pdf', reportLink: '', notes: '', status: '有效' },
  { id: 'TEST-S008', deviceId: 'DEV-019', stationKey: 'semi', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '张三', testTime: '2026-06-18 09:00', reportFile: 'semi_DEV019.pdf', reportLink: '', notes: '', status: '有效' },
  { id: 'TEST-S009', deviceId: 'DEV-020', stationKey: 'semi', stationResult: 'NG', testType: '功能测试', result: '不合格', operator: '王五', testTime: '2026-06-18 10:30', reportFile: '', reportLink: '', notes: '关节力矩超标', ngReason: '关节3力矩传感器读数偏差', repairPerson: '赵六', repairAction: '重新校准力矩传感器', estimatedCompletion: '2026-06-20', status: '有效' },
  { id: 'TEST-S010', deviceId: 'DEV-021', stationKey: 'semi', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '李四', testTime: '2026-06-19 09:30', reportFile: 'semi_DEV021.pdf', reportLink: '', notes: '', status: '有效' },
  { id: 'TEST-S011', deviceId: 'DEV-022', stationKey: 'semi', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '张三', testTime: '2026-06-20 09:00', reportFile: 'semi_DEV022.pdf', reportLink: '', notes: '', status: '有效' },
  { id: 'TEST-S012', deviceId: 'DEV-023', stationKey: 'semi', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '李四', testTime: '2026-06-21 09:30', reportFile: 'semi_DEV023.pdf', reportLink: '', notes: '', status: '有效' },
  { id: 'TEST-S013', deviceId: 'DEV-026', stationKey: 'semi', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '王五', testTime: '2026-05-30 09:00', reportFile: 'semi_DEV026.pdf', reportLink: '', notes: '半成品检验通过', status: '有效' },
  { id: 'TEST-I013', deviceId: 'DEV-026', stationKey: 'init', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '王五', testTime: '2026-05-31 09:00', reportFile: 'init_DEV026.pdf', reportLink: '', notes: '初测通过', status: '有效' },
  { id: 'TEST-M013', deviceId: 'DEV-026', stationKey: 'mid', stationResult: 'Pass', testType: '老化测试', result: '合格', operator: '王五', testTime: '2026-06-01 09:00', duration: '48小时', peakTemp: '67°C', anomalyCount: 0, reportFile: 'aging_DEV026.pdf', reportLink: '', notes: '中测通过', status: '有效' },
  { id: 'TEST-O013', deviceId: 'DEV-026', stationKey: 'oqt', stationResult: 'Pass', testType: '终测', result: '合格', operator: '张三', testTime: '2026-06-02 15:00', reportFile: 'oqt_DEV026.pdf', reportLink: '', notes: 'OQT终测通过', status: '有效' },
  // init
  { id: 'TEST-I003', deviceId: 'DEV-004', stationKey: 'init', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '王五', testTime: '2026-06-17 09:00', reportFile: 'init_DEV004.pdf', reportLink: '', notes: '', status: '有效' },
  { id: 'TEST-I004', deviceId: 'DEV-005', stationKey: 'init', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '王五', testTime: '2026-06-17 10:30', reportFile: 'init_DEV005.pdf', reportLink: '', notes: '', status: '有效' },
  { id: 'TEST-I005', deviceId: 'DEV-018', stationKey: 'init', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '赵六', testTime: '2026-06-18 09:30', reportFile: 'init_DEV018.pdf', reportLink: '', notes: '', status: '有效' },
  { id: 'TEST-I006', deviceId: 'DEV-019', stationKey: 'init', stationResult: 'NG', testType: '功能测试', result: '不合格', operator: '张三', testTime: '2026-06-19 10:00', reportFile: '', reportLink: '', notes: '图像处理单元无响应', ngReason: '头部RGBD相机初始化失败', repairPerson: '李四', repairAction: '更换头部相机模块', estimatedCompletion: '2026-06-21', status: '有效' },
  { id: 'TEST-I007', deviceId: 'DEV-021', stationKey: 'init', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '王五', testTime: '2026-06-20 09:00', reportFile: 'init_DEV021.pdf', reportLink: '', notes: '', status: '有效' },
  { id: 'TEST-I008', deviceId: 'DEV-022', stationKey: 'init', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '赵六', testTime: '2026-06-21 10:00', reportFile: 'init_DEV022.pdf', reportLink: '', notes: '', status: '有效' },
  { id: 'TEST-I009', deviceId: 'DEV-023', stationKey: 'init', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '张三', testTime: '2026-06-22 09:30', reportFile: 'init_DEV023.pdf', reportLink: '', notes: '', status: '有效' },
  // mid
  { id: 'TEST-M003', deviceId: 'DEV-004', stationKey: 'mid', stationResult: 'Pass', testType: '老化测试', result: '合格', operator: '李四', testTime: '2026-06-18 09:00', duration: '48小时', peakTemp: '70°C', anomalyCount: 0, reportFile: 'aging_DEV004.pdf', reportLink: '', notes: '', status: '有效' },
  { id: 'TEST-M004', deviceId: 'DEV-005', stationKey: 'mid', stationResult: 'NG', testType: '老化测试', result: '不合格', operator: '王五', testTime: '2026-06-18 14:00', duration: '24小时', peakTemp: '88°C', anomalyCount: 4, reportFile: '', reportLink: '', notes: '散热不足导致温度超标', ngReason: '老化24h峰值温度88°C超阈值', repairPerson: '赵六', repairAction: '更换散热风扇并重新涂抹导热硅脂', estimatedCompletion: '2026-06-20', status: '有效' },
  { id: 'TEST-M006', deviceId: 'DEV-021', stationKey: 'mid', stationResult: 'Pass', testType: '老化测试', result: '合格', operator: '王五', testTime: '2026-06-20 08:00', duration: '48小时', peakTemp: '69°C', anomalyCount: 0, reportFile: 'aging_DEV021.pdf', reportLink: '', notes: '', status: '有效' },
  { id: 'TEST-M007', deviceId: 'DEV-022', stationKey: 'mid', stationResult: 'NG', testType: '老化测试', result: '不合格', operator: '赵六', testTime: '2026-06-21 09:00', duration: '24小时', peakTemp: '83°C', anomalyCount: 2, reportFile: '', reportLink: '', notes: '驱动电机温升过快', ngReason: '左驱电机连续运行热阻偏高', repairPerson: '张三', repairAction: '清洁电机散热片，检查风道', estimatedCompletion: '2026-06-23', status: '有效' },
  { id: 'TEST-M008', deviceId: 'DEV-023', stationKey: 'mid', stationResult: 'Pass', testType: '老化测试', result: '合格', operator: '李四', testTime: '2026-06-22 08:00', duration: '48小时', peakTemp: '71°C', anomalyCount: 0, reportFile: 'aging_DEV023.pdf', reportLink: '', notes: '', status: '有效' },
  // oqt
  { id: 'TEST-O003', deviceId: 'DEV-004', stationKey: 'oqt', stationResult: 'Pass', testType: '终测', result: '合格', operator: '张三', testTime: '2026-06-19 15:00', reportFile: 'oqt_DEV004.pdf', reportLink: '', notes: 'OQT通过，末端精度±0.5mm', status: '有效' },
  { id: 'TEST-O004', deviceId: 'DEV-021', stationKey: 'oqt', stationResult: 'Pass', testType: '终测', result: '合格', operator: '赵六', testTime: '2026-06-21 14:00', reportFile: 'oqt_DEV021.pdf', reportLink: '', notes: 'OQT终测通过', status: '有效' },
  { id: 'TEST-O006', deviceId: 'DEV-023', stationKey: 'oqt', stationResult: 'Pass', testType: '终测', result: '合格', operator: '李四', testTime: '2026-06-22 14:00', reportFile: 'oqt_DEV023.pdf', reportLink: '', notes: 'OQT全项通过', status: '有效' },
  // DEV-014 / DEV-015：全工站 Pass，待整机入库
  { id: 'TEST-S014', deviceId: 'DEV-014', stationKey: 'semi', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '张三', testTime: '2026-06-15 09:00', reportFile: 'semi_DEV014.pdf', reportLink: '', notes: '半成品检验通过', status: '有效' },
  { id: 'TEST-I014', deviceId: 'DEV-014', stationKey: 'init', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '王五', testTime: '2026-06-16 09:00', reportFile: 'init_DEV014.pdf', reportLink: '', notes: '初测通过', status: '有效' },
  { id: 'TEST-M014', deviceId: 'DEV-014', stationKey: 'mid', stationResult: 'Pass', testType: '老化测试', result: '合格', operator: '王五', testTime: '2026-06-17 09:00', duration: '48小时', peakTemp: '66°C', anomalyCount: 0, reportFile: 'aging_DEV014.pdf', reportLink: '', notes: '中测通过', status: '有效' },
  { id: 'TEST-O014', deviceId: 'DEV-014', stationKey: 'oqt', stationResult: 'Pass', testType: '终测', result: '合格', operator: '张三', testTime: '2026-06-19 15:00', reportFile: 'oqt_DEV014.pdf', reportLink: '', notes: 'OQT终测通过', status: '有效' },
  { id: 'TEST-S015', deviceId: 'DEV-015', stationKey: 'semi', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '张三', testTime: '2026-06-15 10:00', reportFile: 'semi_DEV015.pdf', reportLink: '', notes: '半成品检验通过', status: '有效' },
  { id: 'TEST-I015', deviceId: 'DEV-015', stationKey: 'init', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '王五', testTime: '2026-06-16 10:00', reportFile: 'init_DEV015.pdf', reportLink: '', notes: '初测通过', status: '有效' },
  { id: 'TEST-M015', deviceId: 'DEV-015', stationKey: 'mid', stationResult: 'Pass', testType: '老化测试', result: '合格', operator: '王五', testTime: '2026-06-17 10:00', duration: '48小时', peakTemp: '69°C', anomalyCount: 0, reportFile: 'aging_DEV015.pdf', reportLink: '', notes: '中测通过', status: '有效' },
  { id: 'TEST-O015', deviceId: 'DEV-015', stationKey: 'oqt', stationResult: 'Pass', testType: '终测', result: '合格', operator: '张三', testTime: '2026-06-19 16:00', reportFile: 'oqt_DEV015.pdf', reportLink: '', notes: 'OQT终测通过', status: '有效' },
  // DEV-003：半成品检验/初测 Pass，当前在中测（待测）
  { id: 'TEST-S003B', deviceId: 'DEV-003', stationKey: 'semi', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '张三', testTime: '2026-06-14 15:00', reportFile: 'semi_DEV003.pdf', reportLink: '', notes: '半成品检验通过', status: '有效' },
  { id: 'TEST-I003', deviceId: 'DEV-003', stationKey: 'init', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '王五', testTime: '2026-06-15 15:00', reportFile: 'init_DEV003.pdf', reportLink: '', notes: '初测通过', status: '有效' },
  // DEV-017：半成品检验 Pass，初测 NG（返修中），中测/OQT 应显示 —
  { id: 'TEST-S017', deviceId: 'DEV-017', stationKey: 'semi', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '张三', testTime: '2026-06-20 10:00', reportFile: 'semi_DEV017.pdf', reportLink: '', notes: '半成品检验通过', status: '有效' },
  // WPP-001 演示口径：DEV-007 全工站 Pass（ERP 合格→已入库）；DEV-008/010 初测 NG（生产返修中）；
  // DEV-013 半成品检验中（semi 待测，无工站记录）；DEV-025 中测中（semi/init Pass，mid 待测）。
  { id: 'TEST-S1-DEV-007', deviceId: 'DEV-007', stationKey: 'semi', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '张三', testTime: '2026-05-20 09:00', reportFile: 'semi_DEV-007.pdf', reportLink: '', notes: '半成品检验通过', status: '有效' },
  { id: 'TEST-I1-DEV-007', deviceId: 'DEV-007', stationKey: 'init', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '王五', testTime: '2026-05-20 11:00', reportFile: 'init_DEV-007.pdf', reportLink: '', notes: '初测通过', status: '有效' },
  { id: 'TEST-M1-DEV-007', deviceId: 'DEV-007', stationKey: 'mid', stationResult: 'Pass', testType: '老化测试', result: '合格', operator: '王五', testTime: '2026-05-20 14:00', reportFile: 'aging_DEV-007.pdf', reportLink: '', notes: '中测通过', status: '有效' },
  { id: 'TEST-O1-DEV-007', deviceId: 'DEV-007', stationKey: 'oqt', stationResult: 'Pass', testType: '其他', result: '合格', operator: '张三', testTime: '2026-05-20 16:00', reportFile: 'oqt_DEV-007.pdf', reportLink: '', notes: 'OQT终测通过', status: '有效' },
  { id: 'TEST-S1-DEV-008', deviceId: 'DEV-008', stationKey: 'semi', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '张三', testTime: '2026-05-19 09:00', reportFile: 'semi_DEV008.pdf', reportLink: '', notes: '半成品检验通过', status: '有效' },
  { id: 'TEST-I1-DEV-008', deviceId: 'DEV-008', stationKey: 'init', stationResult: 'NG', testType: '功能测试', result: '不合格', operator: '王五', testTime: '2026-05-19 11:00', reportFile: '', reportLink: '', notes: '初测NG', ngReason: '关节电机初始化失败', status: '有效' },
  { id: 'TEST-S1-DEV-010', deviceId: 'DEV-010', stationKey: 'semi', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '张三', testTime: '2026-05-12 09:00', reportFile: 'semi_DEV010.pdf', reportLink: '', notes: '半成品检验通过', status: '有效' },
  { id: 'TEST-I1-DEV-010', deviceId: 'DEV-010', stationKey: 'init', stationResult: 'NG', testType: '功能测试', result: '不合格', operator: '王五', testTime: '2026-05-12 11:00', reportFile: '', reportLink: '', notes: '初测NG', ngReason: '底盘驱动板通信异常', status: '有效' },
  { id: 'TEST-S1-DEV-025', deviceId: 'DEV-025', stationKey: 'semi', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '张三', testTime: '2026-05-14 09:00', reportFile: 'semi_DEV025.pdf', reportLink: '', notes: '半成品检验通过', status: '有效' },
  { id: 'TEST-I1-DEV-025', deviceId: 'DEV-025', stationKey: 'init', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '王五', testTime: '2026-05-14 11:00', reportFile: 'init_DEV025.pdf', reportLink: '', notes: '初测通过', status: '有效' },
  // WPP-008 已交付设备：全工站 Pass（历史生产记录）
  ...['DEV-027', 'DEV-028', 'DEV-029'].flatMap((did) => [
    { id: `TEST-S1-${did}`, deviceId: did, stationKey: 'semi', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '张三', testTime: '2026-04-01 09:00', reportFile: `semi_${did}.pdf`, reportLink: '', notes: '半成品检验通过', status: '有效' },
    { id: `TEST-I1-${did}`, deviceId: did, stationKey: 'init', stationResult: 'Pass', testType: '功能测试', result: '合格', operator: '王五', testTime: '2026-04-01 11:00', reportFile: `init_${did}.pdf`, reportLink: '', notes: '初测通过', status: '有效' },
    { id: `TEST-M1-${did}`, deviceId: did, stationKey: 'mid', stationResult: 'Pass', testType: '老化测试', result: '合格', operator: '王五', testTime: '2026-04-01 14:00', reportFile: `aging_${did}.pdf`, reportLink: '', notes: '中测通过', status: '有效' },
    { id: `TEST-O1-${did}`, deviceId: did, stationKey: 'oqt', stationResult: 'Pass', testType: '其他', result: '合格', operator: '张三', testTime: '2026-04-01 16:00', reportFile: `oqt_${did}.pdf`, reportLink: '', notes: 'OQT终测通过', status: '有效' },
  ]),
];

export const operationLogs = [
  { id: 'LOG-001', deviceId: 'DEV-002', operator: '李四', timestamp: '2026-06-16 14:00', actionType: '装配', fromStatus: null, toStatus: '功能测试中', notes: '完成整机装配' },
  { id: 'LOG-002', deviceId: 'DEV-002', operator: '张三', timestamp: '2026-06-17 09:00', actionType: '功能测试不合格', fromStatus: '功能测试中', toStatus: '整机装配', notes: '关节2运动异常，返修' },
  { id: 'LOG-003', deviceId: 'DEV-002', operator: '李四', timestamp: '2026-06-17 11:00', actionType: '返修完成', fromStatus: '整机装配', toStatus: '功能测试中', notes: '返修后重新提交测试' },
  { id: 'LOG-004', deviceId: 'DEV-002', operator: '张三', timestamp: '2026-06-17 15:00', actionType: '功能测试通过', fromStatus: '功能测试中', toStatus: '功能测试中', notes: '功能测试合格' },
  { id: 'LOG-005', deviceId: 'DEV-003', operator: '王五', timestamp: '2026-06-14 09:00', actionType: '装配', fromStatus: null, toStatus: '功能测试中', notes: '完成整机装配' },
  { id: 'LOG-006', deviceId: 'DEV-003', operator: '李四', timestamp: '2026-06-15 10:00', actionType: '功能测试通过', fromStatus: '功能测试中', toStatus: '老化测试中', notes: '功能测试合格，进入老化测试' },
  { id: 'LOG-007', deviceId: 'DEV-003', operator: '王五', timestamp: '2026-06-16 08:00', actionType: '老化测试不合格', fromStatus: '老化测试中', toStatus: '整机装配', notes: '温度异常，返修' },
  { id: 'LOG-008', deviceId: 'DEV-003', operator: '王五', timestamp: '2026-06-16 15:00', actionType: '老化测试通过', fromStatus: '整机装配', toStatus: '老化测试中', notes: '更换散热后重测通过' },
  { id: 'LOG-009', deviceId: 'DEV-007', operator: '王五', timestamp: '2026-06-10 09:00', actionType: '分配至项目', fromStatus: '待分配项目', toStatus: '已分配项目', notes: '分配至项目A' },
  { id: 'LOG-010', deviceId: 'DEV-027', operator: '张三', timestamp: '2026-04-22 10:00', actionType: '上线运营', fromStatus: '已分配项目', toStatus: '在线运营', notes: '现场安装完成，上线运营' },
];

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

// Workflow-based production plans (used by ProductionPlanDetail)
export const workflowProductionPlans = [
  {
    id: 'WPP-001', name: '智魔方Q1批次生产', projectId: 'PROJ-001', deviceTypeId: 'DT-001',
    targetCount: 5, status: '已完成', endDate: '2026-06-10',
    createdAt: '2026-05-15 09:00', erpProductionOrderNo: 'MO-2026-015',
    materialBatchIds: ['BATCH-001', 'BATCH-002', 'BATCH-003'],
    notes: '智魔方园区A厂房首批交付',
  },
  {
    id: 'WPP-002', name: '智魔方Q2补单生产', projectId: 'PROJ-001', deviceTypeId: 'DT-001',
    targetCount: 8, status: '生产中', endDate: '2026-07-15',
    createdAt: '2026-06-10 10:00', erpProductionOrderNo: 'MO-2026-031',
    erpInboundNo: 'PI-2026-031', erpInspectionNo: 'QC-2026-031', erpStockStatus: '部分合格可用', warehouse: '成品库',
    materialBatchIds: ['BATCH-009', 'BATCH-010'],
    notes: '',
  },
  {
    id: 'WPP-003', name: '智魔方B厂房备货', projectId: 'PROJ-001', deviceTypeId: 'DT-001',
    targetCount: 2, status: '未开始', endDate: '2026-08-01',
    createdAt: '2026-06-20 14:00', erpProductionOrderNo: '',
    materialBatchIds: [],
    notes: 'B厂房扩产备货',
  },
  {
    id: 'WPP-004', name: '华熙生物首批生产', projectId: 'PROJ-002', deviceTypeId: 'DT-002',
    targetCount: 3, status: '已完成', endDate: '2026-06-12',
    createdAt: '2026-05-20 10:00', erpProductionOrderNo: 'MO-2026-022',
    materialBatchIds: ['BATCH-004', 'BATCH-005', 'BATCH-006'],
    notes: '医疗级洁净要求',
  },
  {
    id: 'WPP-005', name: '华熙生物扩产订单', projectId: 'PROJ-002', deviceTypeId: 'DT-002',
    targetCount: 4, status: '生产中', endDate: '2026-07-31',
    createdAt: '2026-06-15 09:00', erpProductionOrderNo: 'MO-2026-038',
    materialBatchIds: ['BATCH-016', 'BATCH-017'],
    notes: '二期扩产',
  },
  {
    id: 'WPP-006', name: '机场航站楼首批', projectId: 'PROJ-003', deviceTypeId: 'DT-002',
    targetCount: 4, status: '已完成', endDate: '2026-06-05',
    createdAt: '2026-06-01 10:00', erpProductionOrderNo: 'MO-2026-028',
    materialBatchIds: ['BATCH-007', 'BATCH-008'],
    notes: 'IP65防护需求，已通过民航认证',
  },
  {
    id: 'WPP-007', name: '机场追加订单', projectId: 'PROJ-003', deviceTypeId: 'DT-001',
    targetCount: 3, status: '生产中', endDate: '2026-07-20',
    createdAt: '2026-06-18 14:00', erpProductionOrderNo: 'MO-2026-042',
    materialBatchIds: ['BATCH-019', 'BATCH-020'],
    notes: '追加T3航站楼部署',
  },
  {
    id: 'WPP-008', name: '智魔方首批已交付', projectId: 'PROJ-001', deviceTypeId: 'DT-001',
    targetCount: 3, status: '已完成', endDate: '2026-04-20',
    createdAt: '2026-03-20 09:00', erpProductionOrderNo: 'MO-2026-008',
    erpInboundNo: 'PI-2026-008', erpInspectionNo: 'QC-2026-008', erpStockStatus: '合格可用', warehouse: '成品库',
    materialBatchIds: [],
    notes: '首批已交付上线设备（DEV-027/028/029）',
  },
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
  { id: 'BATCH-009', batchNo: 'BATCH-2026-009', category: '底盘', model: 'CH-2026-A', supplier: '务实科技', quantity: 3, inspector: '张三', inspectionTime: '2026-05-12 09:00', notes: '', erpPurchaseOrderNo: 'PO-2026-009', erpArrivalNo: 'AN-2026-009', erpDeliveryNo: 'MO-OUT-2026-031-01', warehouse: '生产领料库', overIssued: false, items: [{ id: 'MAT-021', sn: 'SN-CHASSIS-004', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-022', sn: 'SN-CHASSIS-005', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-023', sn: 'SN-CHASSIS-006', result: '合格', status: '待装配', notes: '' }] },
  { id: 'BATCH-010', batchNo: 'BATCH-2026-010', category: '机械臂', model: 'ARM-2026-B', supplier: '务实科技', quantity: 3, inspector: '李四', inspectionTime: '2026-05-14 10:00', notes: '', erpPurchaseOrderNo: 'PO-2026-010', erpArrivalNo: 'AN-2026-010', erpDeliveryNo: 'MO-OUT-2026-031-02', warehouse: '生产领料库', overIssued: true, items: [{ id: 'MAT-024', sn: 'SN-ARM-006', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-025', sn: 'SN-ARM-007', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-026', sn: 'SN-ARM-008', result: '合格', status: '待装配', notes: '' }] },
  { id: 'BATCH-011', batchNo: 'BATCH-2026-011', category: '电机', model: 'MTR-2026-C', supplier: '迈驰驱动', quantity: 3, inspector: '王五', inspectionTime: '2026-05-15 08:30', notes: '1件转子偏心，已退货', items: [{ id: 'MAT-027', sn: 'SN-MOTOR-007', result: '不合格', status: '退货换货', notes: '转子偏心，振动超标' }, { id: 'MAT-028', sn: 'SN-MOTOR-008', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-029', sn: 'SN-MOTOR-009', result: '合格', status: '待装配', notes: '' }] },
  { id: 'BATCH-012', batchNo: 'BATCH-2026-012', category: '末端', model: 'END-2026-D', supplier: '务实科技', quantity: 2, inspector: '赵六', inspectionTime: '2026-05-18 09:00', notes: '', items: [{ id: 'MAT-030', sn: 'SN-END-003', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-031', sn: 'SN-END-004', result: '合格', status: '待装配', notes: '' }] },
  { id: 'BATCH-013', batchNo: 'BATCH-2026-013', category: '全身相机', model: 'CAM-2026-E', supplier: '锐视传感器', quantity: 2, inspector: '张三', inspectionTime: '2026-05-20 10:00', notes: '1件色差偏移，特批使用', items: [{ id: 'MAT-032', sn: 'SN-CAM-003', result: '特批使用', status: '待装配', notes: '色差偏移轻微，特批低照度场景' }, { id: 'MAT-033', sn: 'SN-CAM-004', result: '合格', status: '待装配', notes: '' }] },
  { id: 'BATCH-014', batchNo: 'BATCH-2026-014', category: '预控', model: 'CTRL-2026-F', supplier: '务实科技', quantity: 2, inspector: '李四', inspectionTime: '2026-05-22 08:00', notes: '', items: [{ id: 'MAT-034', sn: 'SN-CTRL-003', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-035', sn: 'SN-CTRL-004', result: '合格', status: '待装配', notes: '' }] },
  { id: 'BATCH-015', batchNo: 'BATCH-2026-015', category: '底盘', model: 'CH-2026-A', supplier: '务实科技', quantity: 2, inspector: '王五', inspectionTime: '2026-05-25 09:00', notes: '整批不合格，焊缝开裂，退货处理', items: [{ id: 'MAT-036', sn: 'SN-CHASSIS-007', result: '不合格', status: '退货换货', notes: '底盘焊缝开裂' }, { id: 'MAT-037', sn: 'SN-CHASSIS-008', result: '不合格', status: '退货换货', notes: '底盘焊缝开裂' }] },
  { id: 'BATCH-016', batchNo: 'BATCH-2026-016', category: '机械臂', model: 'ARM-2026-B', supplier: '务实科技', quantity: 3, inspector: '赵六', inspectionTime: '2026-05-28 09:30', notes: '1件关节间隙偏大，特批低速场景', items: [{ id: 'MAT-038', sn: 'SN-ARM-009', result: '特批使用', status: '待装配', notes: '关节间隙略大，特批低速场景使用' }, { id: 'MAT-039', sn: 'SN-ARM-010', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-040', sn: 'SN-ARM-011', result: '合格', status: '待装配', notes: '' }] },
  { id: 'BATCH-017', batchNo: 'BATCH-2026-017', category: '电机', model: 'MTR-2026-C', supplier: '迈驰驱动', quantity: 3, inspector: '张三', inspectionTime: '2026-06-01 08:00', notes: '', items: [{ id: 'MAT-041', sn: 'SN-MOTOR-010', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-042', sn: 'SN-MOTOR-011', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-043', sn: 'SN-MOTOR-012', result: '合格', status: '待装配', notes: '' }] },
  { id: 'BATCH-018', batchNo: 'BATCH-2026-018', category: '末端', model: 'END-2026-D', supplier: '锐视传感器', quantity: 1, inspector: '李四', inspectionTime: '2026-06-03 10:00', notes: '传感器灵敏度不达标，整批退货', items: [{ id: 'MAT-044', sn: 'SN-END-005', result: '不合格', status: '退货换货', notes: '传感器灵敏度不达标' }] },
  { id: 'BATCH-019', batchNo: 'BATCH-2026-019', category: '全身相机', model: 'CAM-2026-E', supplier: '锐视传感器', quantity: 3, inspector: '王五', inspectionTime: '2026-06-05 09:00', notes: '', items: [{ id: 'MAT-045', sn: 'SN-CAM-005', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-046', sn: 'SN-CAM-006', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-047', sn: 'SN-CAM-007', result: '合格', status: '待装配', notes: '' }] },
  { id: 'BATCH-020', batchNo: 'BATCH-2026-020', category: '预控', model: 'CTRL-2026-F', supplier: '务实科技', quantity: 2, inspector: '赵六', inspectionTime: '2026-06-08 08:30', notes: '1件固件刷写失败，送修', items: [{ id: 'MAT-048', sn: 'SN-CTRL-005', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-049', sn: 'SN-CTRL-006', result: '合格', status: '维修中', notes: '固件刷写失败，送修' }] },
  { id: 'BATCH-021', batchNo: 'BATCH-2026-021', category: '底盘', model: 'CH-2026-B', supplier: '迈驰驱动', quantity: 2, inspector: '张三', inspectionTime: '2026-06-10 09:00', notes: '1件搬运损坏已报废', items: [{ id: 'MAT-050', sn: 'SN-CHASSIS-009', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-051', sn: 'SN-CHASSIS-010', result: '合格', status: '已报废', notes: '搬运中碰撞损坏，无法修复' }] },
  { id: 'BATCH-022', batchNo: 'BATCH-2026-022', category: '电机', model: 'MTR-2026-C', supplier: '迈驰驱动', quantity: 3, inspector: '李四', inspectionTime: '2026-06-15 08:00', notes: '1件编码器故障，返厂维修', items: [{ id: 'MAT-052', sn: 'SN-MOTOR-013', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-053', sn: 'SN-MOTOR-014', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-054', sn: 'SN-MOTOR-015', result: '合格', status: '维修中', notes: '编码器故障，返厂维修' }] },
];

// ============ Part2 & Part3 Data ============

export const projects = [
  { id: 'PROJ-001', name: '智魔方项目', client: '智魔方科技有限公司', contactPerson: '采购负责人', contactPhone: '13800138001', background: '为智魔方科技园区引入智能搬运机器人，提升产线自动化水平，降低人力成本约30%。', notes: '优先保障A厂房产线交付', targetCount: 5, manager: '张三', createdAt: '2026-05-15 09:00', updatedAt: '2026-06-10 10:00' },
  { id: 'PROJ-002', name: '华熙生物项目', client: '华熙生物科技股份有限公司', contactPerson: '项目对接人', contactPhone: '13900139002', background: '为华熙生物园区部署智能物流机器人，实现原料、样品及成品的自动化配送，提升园区运营效率。', notes: '需满足生物园区洁净环境要求', targetCount: 4, manager: '李四', createdAt: '2026-05-20 10:00', updatedAt: '2026-06-12 09:00' },
  { id: 'PROJ-003', name: '机场项目', client: '首都国际机场集团', contactPerson: '运营负责人', contactPhone: '13700137003', background: '在机场航站楼部署巡检机器人，覆盖安防巡逻、设备状态监测及旅客引导等功能。', notes: '防护等级需IP65以上，需通过民航安全认证', targetCount: 5, manager: '王五', createdAt: '2026-06-01 10:00', updatedAt: '2026-06-18 14:00' },
  { id: 'PROJ-004', name: '苏州高新园区项目', client: '苏州高新产业园运营有限公司', contactPerson: '园区项目经理', contactPhone: '13600136004', background: '园区一期部署巡检与配送复合机器人，覆盖公共区域巡检、物资转运和夜间异常告警。', notes: '首批仅做样板区，验收后扩展到二期', targetCount: 6, manager: '赵六', status: '进行中', erpProjectNo: 'ERP-PJ-2026-044', createdAt: '2026-06-08 09:30', updatedAt: '2026-06-25 16:00' },
  { id: 'PROJ-005', name: '南山医院物流项目', client: '深圳南山医院', contactPerson: '设备科负责人', contactPhone: '13500135005', background: '用于院内药品、耗材、检验样本跨楼层配送，降低人工往返频次。', notes: '电梯联动接口暂未开放，先做单楼层闭环演示', targetCount: 2, manager: '蔡八', status: '未开始', createdAt: '2026-06-18 11:00', updatedAt: '2026-06-18 11:00' },
  { id: 'PROJ-006', name: '杭州东站验收项目', client: '杭州铁路枢纽运营公司', contactPerson: '现场验收负责人', contactPhone: '13400134006', background: '站内巡检机器人完成试运行，进入客户最终验收阶段。', notes: '验收资料已同步ERP', targetCount: 3, manager: '李四', status: '已交付', erpProjectNo: 'ERP-PJ-2026-032', createdAt: '2026-04-10 08:30', updatedAt: '2026-06-26 17:30' },
  { id: 'PROJ-007', name: '旧版展厅样机项目', client: '内部展厅', contactPerson: '品牌部', contactPhone: '13300133007', background: '旧版展厅样机已完成归档，用于查看关闭项目的只读状态。', notes: '已关闭，不再新增计划', targetCount: 1, manager: '张三', status: '已关闭', closedAt: '2026-06-01 18:00', createdAt: '2026-03-01 09:00', updatedAt: '2026-06-01 18:00' },
  { id: 'PROJ-008', name: '作废测试项目', client: '演示客户', contactPerson: '演示联系人', contactPhone: '13200132008', background: '用于演示作废状态下的操作收敛。', notes: '客户需求取消', targetCount: 2, manager: '王五', status: '已作废', voided: true, voidReason: '客户取消采购预算', createdAt: '2026-05-28 14:00', updatedAt: '2026-06-03 10:00' },
];

export const deviceAllocations = [
  { id: 'ALLOC-001', deviceId: 'DEV-007', projectId: 'PROJ-001', allocatedBy: '张三', allocatedAt: '2026-06-10 09:00', notes: '首批交付设备', type: '分配', fromProjectId: null },
  { id: 'ALLOC-002', deviceId: 'DEV-008', projectId: 'PROJ-001', allocatedBy: '张三', allocatedAt: '2026-06-10 09:30', notes: '首批交付设备', type: '分配', fromProjectId: null },
  { id: 'ALLOC-003', deviceId: 'DEV-009', projectId: 'PROJ-002', allocatedBy: '李四', allocatedAt: '2026-06-12 10:00', notes: '医院项目首台', type: '分配', fromProjectId: null },
  { id: 'ALLOC-004', deviceId: 'DEV-010', projectId: 'PROJ-001', allocatedBy: '张三', allocatedAt: '2026-04-21 10:00', notes: '追加分配', type: '分配', fromProjectId: null },
  { id: 'ALLOC-005', deviceId: 'DEV-011', projectId: 'PROJ-002', allocatedBy: '李四', allocatedAt: '2026-04-14 10:00', notes: '医院项目第二台', type: '分配', fromProjectId: null },
  { id: 'ALLOC-006', deviceId: 'DEV-012', projectId: 'PROJ-003', allocatedBy: '王五', allocatedAt: '2026-04-09 10:00', notes: '港口项目首台', type: '分配', fromProjectId: null },
  { id: 'ALLOC-007', deviceId: 'DEV-013', projectId: 'PROJ-001', allocatedBy: '赵六', allocatedAt: '2026-03-24 10:00', notes: '', type: '分配', fromProjectId: null },
];

export const deliveryRecords = [
  { id: 'DELIV-001', deviceId: 'DEV-007', projectId: 'PROJ-001', stage: '出厂检验', result: '合格', operator: '张三', recordTime: '2026-06-10 14:00', notes: '各项指标正常', address: '' },
  { id: 'DELIV-002', deviceId: 'DEV-027', projectId: 'PROJ-001', stage: '出厂检验', result: '合格', operator: '张三', recordTime: '2026-06-10 15:00', notes: '', address: '' },
  { id: 'DELIV-003', deviceId: 'DEV-009', projectId: 'PROJ-002', stage: '出厂检验', result: '合格', operator: '李四', recordTime: '2026-06-12 11:00', notes: '医疗EMC认证通过', address: '' },
  { id: 'DELIV-004', deviceId: 'DEV-007', projectId: 'PROJ-001', stage: '现场安装调试', result: '通过', operator: '王五', recordTime: '2026-06-15 10:00', notes: '安装顺利，调试完成', address: '北京市朝阳区智魔方科技园A厂房' },
  { id: 'DELIV-005', deviceId: 'DEV-027', projectId: 'PROJ-001', stage: '现场安装调试', result: '未通过', operator: '王五', recordTime: '2026-06-15 14:00', notes: '网络配置异常，需重新配置', address: '北京市朝阳区智魔方科技园A厂房' },
  { id: 'DELIV-006', deviceId: 'DEV-027', projectId: 'PROJ-001', stage: '现场安装调试', result: '通过', operator: '王五', recordTime: '2026-06-16 09:00', notes: '重新配置后通过', address: '北京市朝阳区智魔方科技园A厂房' },
  { id: 'DELIV-007', deviceId: 'DEV-009', projectId: 'PROJ-002', stage: '现场安装调试', result: '通过', operator: '赵六', recordTime: '2026-06-17 11:00', notes: '医院环境调试完成', address: '北京市通州区华熙生物园区实验楼' },
  { id: 'DELIV-008', deviceId: 'DEV-007', projectId: 'PROJ-001', stage: '客户验收', result: '通过', operator: '张三', recordTime: '2026-06-18 15:00', notes: '客户满意，签署验收单', address: '北京市朝阳区智魔方科技园A厂房' },
  { id: 'DELIV-009', deviceId: 'DEV-012', projectId: 'PROJ-003', stage: '出厂检验', result: '合格', operator: '王五', recordTime: '2026-04-09 11:00', notes: '防护等级IP65验证通过', address: '' },
];

export const alerts = [
  {
    id: 'ALERT-001', deviceId: 'DEV-027', projectId: 'PROJ-001', deviceSN: 'SN-DEV-027',
    alertTime: '2026-06-19 03:22', source: '系统自动', severity: '轻微',
    description: '电池电量低于20%，建议及时充电',
    status: '已解决', workOrderId: null,
    notifiedUsers: [{ name: '赵六', role: '运维工程师' }, { name: '蔡八', role: '项目负责人' }],
    processLogs: [
      { operator: '赵六', time: '2026-06-19 06:00', fromStatus: '待处理', toStatus: '处理中', notes: '已收到告警，安排现场充电' },
      { operator: '赵六', time: '2026-06-19 08:30', fromStatus: '处理中', toStatus: '已解决', notes: '设备已充电完成，电量恢复至78%' },
    ],
  },
  {
    id: 'ALERT-002', deviceId: 'DEV-012', projectId: 'PROJ-003', deviceSN: 'SN-DEV-012',
    alertTime: '2026-06-20 14:15', source: '系统自动', severity: '严重',
    description: '关节3电机过热，温度达到92°C，超过阈值',
    status: '工单处理中', workOrderId: 'WO-001',
    notifiedUsers: [{ name: '赵六', role: '运维工程师' }, { name: '李七', role: '厂长' }],
    processLogs: [
      { operator: '赵六', time: '2026-06-20 14:30', fromStatus: '待处理', toStatus: '已生成工单', notes: '严重告警，已生成维修工单 WO-001' },
    ],
  },
  {
    id: 'ALERT-003', deviceId: 'DEV-011', projectId: 'PROJ-002', deviceSN: 'SN-DEV-011',
    alertTime: '2026-06-20 22:40', source: '系统自动', severity: '轻微',
    description: '存储空间使用率超过70%，建议清理日志',
    status: '待处理', workOrderId: null,
    notifiedUsers: [{ name: '赵六', role: '运维工程师' }, { name: '蔡八', role: '项目负责人' }],
    processLogs: [],
  },
  {
    id: 'ALERT-004', deviceId: 'DEV-028', projectId: 'PROJ-001', deviceSN: 'SN-DEV-028',
    alertTime: '2026-06-21 01:05', source: '系统自动', severity: '严重',
    description: '预控模组通信中断超过5分钟',
    status: '已生成工单', workOrderId: 'WO-002',
    notifiedUsers: [{ name: '赵六', role: '运维工程师' }, { name: '李七', role: '厂长' }],
    processLogs: [
      { operator: '赵六', time: '2026-06-21 01:10', fromStatus: '待处理', toStatus: '已生成工单', notes: '严重告警，已生成维修工单 WO-002' },
    ],
  },
  {
    id: 'ALERT-005', deviceId: 'DEV-027', projectId: 'PROJ-001', deviceSN: 'SN-DEV-027',
    alertTime: '2026-06-18 11:30', source: '人工上报', severity: '轻微',
    description: '末端执行器抓取精度下降，误差约±2mm',
    status: '已解决', workOrderId: null,
    notifiedUsers: [{ name: '赵六', role: '运维工程师' }, { name: '蔡八', role: '项目负责人' }],
    processLogs: [
      { operator: '李四', time: '2026-06-18 13:00', fromStatus: '待处理', toStatus: '处理中', notes: '已到现场，检查末端传感器' },
      { operator: '李四', time: '2026-06-18 16:00', fromStatus: '处理中', toStatus: '已解决', notes: '重新标定末端执行器，精度恢复正常范围±0.8mm' },
    ],
  },
  {
    id: 'ALERT-006', deviceId: 'DEV-012', projectId: 'PROJ-003', deviceSN: 'SN-DEV-012',
    alertTime: '2026-06-21 07:55', source: '人工上报', severity: '严重',
    description: '设备离线超过8小时，现场人员无法连接',
    status: '工单处理中', workOrderId: 'WO-003',
    notifiedUsers: [{ name: '赵六', role: '运维工程师' }, { name: '李七', role: '厂长' }],
    processLogs: [
      { operator: '赵六', time: '2026-06-21 08:00', fromStatus: '待处理', toStatus: '已生成工单', notes: '设备完全离线，严重故障，已生成维修工单 WO-003' },
    ],
  },
  {
    id: 'ALERT-007', deviceId: 'DEV-011', projectId: 'PROJ-002', deviceSN: 'SN-DEV-011',
    alertTime: '2026-06-21 06:10', source: '系统自动', severity: '轻微',
    description: '导航模块定位漂移，偏差超过阈值0.3m',
    status: '处理中', workOrderId: null,
    notifiedUsers: [{ name: '赵六', role: '运维工程师' }, { name: '蔡八', role: '项目负责人' }],
    processLogs: [
      { operator: '赵六', time: '2026-06-21 07:00', fromStatus: '待处理', toStatus: '处理中', notes: '已远程连接，正在排查定位漂移原因，可能是地图数据老化' },
    ],
  },
  {
    id: 'ALERT-008', deviceId: 'DEV-028', projectId: 'PROJ-001', deviceSN: 'SN-DEV-028',
    alertTime: '2026-06-20 18:30', source: '系统自动', severity: '轻微',
    description: 'CPU使用率持续超过85%，任务响应延迟',
    status: '处理中', workOrderId: null,
    notifiedUsers: [{ name: '赵六', role: '运维工程师' }, { name: '蔡八', role: '项目负责人' }],
    processLogs: [
      { operator: '赵六', time: '2026-06-20 19:15', fromStatus: '待处理', toStatus: '处理中', notes: '已登录后台，发现后台日志服务异常占用CPU，正在清理' },
    ],
  },
  {
    id: 'ALERT-009', deviceId: 'DEV-027', projectId: 'PROJ-001', deviceSN: 'SN-DEV-027',
    alertTime: '2026-06-22 02:05', source: '系统自动', severity: '轻微',
    description: '机械臂关节润滑度不足，运行摩擦力增大',
    status: '待处理', workOrderId: null,
    notifiedUsers: [{ name: '赵六', role: '运维工程师' }, { name: '蔡八', role: '项目负责人' }],
    processLogs: [],
  },
  {
    id: 'ALERT-010', deviceId: 'DEV-012', projectId: 'PROJ-003', deviceSN: 'SN-DEV-012',
    alertTime: '2026-06-22 07:40', source: '人工上报', severity: '严重',
    description: '主控板过压保护触发，设备紧急停机，无法远程复位',
    status: '待处理', workOrderId: null,
    notifiedUsers: [{ name: '赵六', role: '运维工程师' }, { name: '李七', role: '厂长' }],
    processLogs: [],
  },
  {
    id: 'ALERT-011', deviceId: 'DEV-027', projectId: 'PROJ-001', deviceSN: 'SN-DEV-027',
    alertTime: '2026-06-10 14:20', source: '系统自动', severity: '严重',
    description: '关节2位置反馈异常，编码器读数跳变',
    status: '已关闭', workOrderId: 'WO-004',
    notifiedUsers: [{ name: '赵六', role: '运维工程师' }, { name: '李七', role: '厂长' }],
    processLogs: [
      { operator: '赵六', time: '2026-06-10 14:30', fromStatus: '待处理', toStatus: '已生成工单', notes: '编码器故障，严重级别，已生成工单 WO-004' },
      { operator: '李四', time: '2026-06-18 17:00', fromStatus: '工单处理中', toStatus: '已关闭', notes: '对应工单 WO-004 已关闭，设备恢复正常' },
    ],
  },
  {
    id: 'ALERT-012', deviceId: 'DEV-011', projectId: 'PROJ-002', deviceSN: 'SN-DEV-011',
    alertTime: '2026-06-15 08:55', source: '系统自动', severity: '严重',
    description: '导航地图加载失败，设备反复尝试回原点',
    status: '已关闭', workOrderId: 'WO-005',
    notifiedUsers: [{ name: '赵六', role: '运维工程师' }, { name: '蔡八', role: '项目负责人' }],
    processLogs: [
      { operator: '赵六', time: '2026-06-15 09:00', fromStatus: '待处理', toStatus: '已生成工单', notes: '导航失效，严重影响运营，已生成工单 WO-005' },
      { operator: '张三', time: '2026-06-15 14:00', fromStatus: '工单处理中', toStatus: '已关闭', notes: '对应工单 WO-005 已关闭，远程推送地图固件后恢复正常' },
    ],
  },
];

export const workOrders = [
  { id: 'WO-001', woClass: '换件工单', involvesReplacement: true, needReplaceModuleType: '电机模块', oldModuleSN: '待确认', newModuleSN: '待选择', newModuleStockStatus: '待选择', deviceId: 'DEV-012', deviceSN: 'SN-DEV-012', projectId: 'PROJ-003', description: '关节3电机过热，温度达92°C，需检查散热系统及电机状态', severity: '高', status: '处理中', assignedTo: '王五', createdAt: '2026-06-20 14:30', updatedAt: '2026-06-20 16:00', closedAt: null, repairActions: '已到现场，正在拆除散热模组检查', replacedModules: [], recheckResult: null, notes: '散热风扇异物堵塞' },
  { id: 'WO-002', woClass: '换件工单', involvesReplacement: true, needReplaceModuleType: '预控模块', oldModuleSN: '待确认', newModuleSN: '待选择', newModuleStockStatus: '待选择', deviceId: 'DEV-028', deviceSN: 'SN-DEV-028', projectId: 'PROJ-001', description: '预控模组通信中断，设备无法接收指令', severity: '高', status: '待处理', assignedTo: '赵六', createdAt: '2026-06-21 01:10', updatedAt: '2026-06-21 01:10', closedAt: null, repairActions: '', replacedModules: [], recheckResult: null, notes: '' },
  { id: 'WO-003', woClass: '换件工单', involvesReplacement: true, needReplaceModuleType: '预控模块', oldModuleSN: 'MOD-YK-2026-013', newModuleSN: 'MOD-YK-2026-014', newModuleStockStatus: '已选择（在库可用）', deviceId: 'DEV-012', deviceSN: 'SN-DEV-012', projectId: 'PROJ-003', description: '设备离线，网络模块故障，需更换', severity: '高', status: '处理中', assignedTo: '李四', createdAt: '2026-06-21 08:00', updatedAt: '2026-06-21 09:00', closedAt: null, repairActions: '已确认网络模块损坏，准备更换', replacedModules: [{ removedMaterialId: 'MAT-013', addedMaterialId: 'MAT-014', moduleTypeId: 'MT-006' }], recheckResult: null, notes: '网口物理损坏，可能为进水导致' },
  { id: 'WO-004', woClass: '其他问题工单', involvesReplacement: false, deviceId: 'DEV-027', deviceSN: 'SN-DEV-027', projectId: 'PROJ-001', description: '末端执行器抓取精度异常，超出允许误差范围', severity: '中', status: '已关闭', assignedTo: '李四', createdAt: '2026-06-18 12:00', updatedAt: '2026-06-18 17:00', closedAt: '2026-06-18 17:00', repairActions: '重新标定末端执行器，精度恢复正常', replacedModules: [], recheckResult: '合格', notes: '标定参数偏移，已重置' },
  { id: 'WO-005', woClass: '软件问题工单', involvesReplacement: false, softwareVersion: 'v2.3.1', deviceId: 'DEV-011', deviceSN: 'SN-DEV-011', projectId: 'PROJ-002', description: '导航地图更新失败，设备反复回到原点', severity: '低', status: '已关闭', assignedTo: '张三', createdAt: '2026-06-15 09:00', updatedAt: '2026-06-15 14:00', closedAt: '2026-06-15 14:00', repairActions: '远程推送新地图固件，重新建图完成', replacedModules: [], recheckResult: '合格', recheckPerson: '李四', notes: '固件版本不兼容导致' },
  { id: 'WO-006', woClass: '换件工单', involvesReplacement: true, needReplaceModuleType: '机械臂模块', oldModuleSN: '待确认', newModuleSN: '待选择', newModuleStockStatus: '待选择', deviceId: 'DEV-028', deviceSN: 'SN-DEV-028', projectId: 'PROJ-001', description: '机械臂关节2抖动明显，定位精度异常，误差超出允许范围±3mm', severity: '中', status: '复检中', assignedTo: '王五', recheckPerson: '李四', createdAt: '2026-06-21 10:00', updatedAt: '2026-06-21 14:30', closedAt: null, repairActions: '重新校准关节电机编码器，调整PID参数，更换磨损轴承衬套', replacedModules: [], recheckResult: null, notes: '关节2齿轮轻微磨损，已调整间隙' },
];

export const retirements = [];

export const moduleReplacements = [
  {
    id: 'MR-001',
    workOrderId: 'WO-003',
    deviceId: 'DEV-012',
    slotName: '预控槁位',
    removedMaterialId: 'MAT-013',
    addedMaterialId: 'MAT-014',
    removedDisposition: '维修中',
    operator: '李四',
    timestamp: '2026-06-21 09:30',
    notes: '预控模块网络端口物理损坏，整体更换',
  },
];

// ============ PRD v6.0 New Data ============

export const labelCategories = [
  { id: 'LC-001', name: '末端类型', options: ['夹爪末端', '焊接末端', '力矩末端'] },
  { id: 'LC-002', name: '底盘类型', options: ['差速底盘', '全向底盘'] },
  { id: 'LC-003', name: '控制器型号', options: ['NUC-i5', 'NUC-i7', 'Xavier NX'] },
];

export const productionWorkOrders = [
  {
    id: 'PWO-001', type: 'production', productionPlanId: 'WPP-002', deviceId: 'DEV-003', deviceSN: 'SN-DEV-003',
    description: '中测阶段发现散热异常，温度超标', severity: '高',
    status: '处理中', assignedTo: '李四', createdAt: '2026-06-16 10:00', updatedAt: '2026-06-16 14:00',
    repairActions: '更换散热模组，重新导热硅脂涂抹',
    attachmentDesc: '温度传感器异常日志', logFile: 'thermal_log_DEV003.txt', imageFile: 'thermal_photo.jpg',
    recheckPerson: '', recheckResult: '',
    processLogs: [
      { time: '2026-06-16 10:00', operator: '张三', fromStatus: '待处理', toStatus: '处理中', notes: '已承接，发现散热模组故障' },
    ],
  },
  {
    id: 'PWO-002', type: 'production', productionPlanId: 'WPP-002', deviceId: 'DEV-020', deviceSN: 'SN-DEV-020',
    description: 'OQT终测NG，末端执行器精度超标', severity: '中',
    status: '复检中', assignedTo: '赵六', createdAt: '2026-06-16 09:00', updatedAt: '2026-06-18 10:00',
    repairActions: '重新标定末端执行器', recheckPerson: '张三', recheckResult: '',
    attachmentDesc: '', logFile: 'precision_log.txt', imageFile: '',
    processLogs: [
      { time: '2026-06-16 09:00', operator: '赵六', fromStatus: '待处理', toStatus: '处理中', notes: '已承接工单，开始返修' },
      { time: '2026-06-18 10:00', operator: '赵六', fromStatus: '处理中', toStatus: '复检中', notes: '标定完成，提交复检', recheckPerson: '张三' },
    ],
  },
  {
    id: 'PWO-003', type: 'production', productionPlanId: 'WPP-005', deviceId: 'DEV-005', deviceSN: 'SN-DEV-005',
    description: '半成品检验NG，PCB接口虚焊导致通信丢包', severity: '高',
    status: '待处理', assignedTo: '', createdAt: '2026-06-17 09:30', updatedAt: '2026-06-17 09:30',
    repairActions: '', recheckPerson: '', recheckResult: '',
    attachmentDesc: '', logFile: '', imageFile: '',
    processLogs: [],
  },
  {
    id: 'PWO-004', type: 'production', productionPlanId: 'WPP-005', deviceId: 'DEV-019', deviceSN: 'SN-DEV-019',
    description: '初测NG，头部RGBD相机无法初始化', severity: '中',
    status: '处理中', assignedTo: '王五', createdAt: '2026-06-19 10:30', updatedAt: '2026-06-19 14:00',
    repairActions: '更换头部相机模块，重新烧录固件',
    attachmentDesc: '', logFile: 'camera_log.txt', imageFile: '',
    recheckPerson: '', recheckResult: '',
    processLogs: [
      { time: '2026-06-19 10:30', operator: '王五', fromStatus: '待处理', toStatus: '处理中', notes: '已承接，确认是相机模块硬件故障' },
    ],
  },
  {
    id: 'PWO-005', type: 'production', productionPlanId: 'WPP-007', deviceId: 'DEV-020', deviceSN: 'SN-DEV-020',
    description: '半成品检验NG，关节力矩传感器读数漂移', severity: '低',
    status: '已关闭', assignedTo: '张三', createdAt: '2026-06-18 11:00', updatedAt: '2026-06-20 16:00',
    repairActions: '重新校准力矩传感器零点，更新传感器参数',
    recheckPerson: '李四', recheckResult: '通过',
    attachmentDesc: '', logFile: 'torque_log.txt', imageFile: '',
    processLogs: [
      { time: '2026-06-18 11:00', operator: '张三', fromStatus: '待处理', toStatus: '处理中', notes: '已承接，开始校准' },
      { time: '2026-06-19 14:00', operator: '张三', fromStatus: '处理中', toStatus: '复检中', notes: '校准完成，提交复检', recheckPerson: '李四' },
      { time: '2026-06-20 16:00', operator: '李四', fromStatus: '复检中', toStatus: '已关闭', notes: '复检通过，力矩读数稳定' },
    ],
  },
  {
    id: 'PWO-006', type: 'production', productionPlanId: 'WPP-007', deviceId: 'DEV-022', deviceSN: 'SN-DEV-022',
    description: '中测NG，驱动电机散热异常，连续运行温升过快', severity: '高',
    status: '待处理', assignedTo: '', createdAt: '2026-06-21 09:30', updatedAt: '2026-06-21 09:30',
    repairActions: '', recheckPerson: '', recheckResult: '',
    attachmentDesc: '', logFile: '', imageFile: '',
    processLogs: [],
  },
  {
    id: 'PWO-007', type: 'production', productionPlanId: 'WPP-002', deviceId: 'DEV-016', deviceSN: 'SN-DEV-016',
    description: '半成品检验发现机壳轻微变形，不影响功能但超出公差', severity: '低',
    status: '已关闭', assignedTo: '李四', createdAt: '2026-06-19 14:00', updatedAt: '2026-06-21 10:00',
    repairActions: '更换机壳外壳，重新装配紧固件',
    recheckPerson: '王五', recheckResult: '通过',
    attachmentDesc: '机壳测量报告', logFile: '', imageFile: 'housing_photo.jpg',
    processLogs: [
      { time: '2026-06-19 14:00', operator: '李四', fromStatus: '待处理', toStatus: '处理中', notes: '确认机壳变形，需更换' },
      { time: '2026-06-20 10:00', operator: '李四', fromStatus: '处理中', toStatus: '复检中', notes: '已更换机壳，提交复检' },
      { time: '2026-06-21 10:00', operator: '王五', fromStatus: '复检中', toStatus: '已关闭', notes: '外观尺寸符合公差要求' },
    ],
  },
  {
    id: 'PWO-008', type: 'production', productionPlanId: 'WPP-007', deviceId: 'DEV-021', deviceSN: 'SN-DEV-021',
    description: 'OQT终测NG，导航静态定位误差超出±5cm限值', severity: '中',
    status: '待处理', assignedTo: '', createdAt: '2026-06-22 10:30', updatedAt: '2026-06-22 10:30',
    repairActions: '', recheckPerson: '', recheckResult: '',
    attachmentDesc: '', logFile: '', imageFile: '',
    processLogs: [],
  },
];

export const deliveryWorkOrders = [
  {
    id: 'DWO-001', woClass: '其他问题工单', involvesReplacement: false, type: 'delivery', deliveryPlanId: 'DP-001', deviceId: 'DEV-027', deviceSN: 'SN-DEV-027',
    description: '现场安装时发现底盘运动偏差大', severity: '中',
    status: '已关闭', assignedTo: '赵六', createdAt: '2026-06-12 14:00', updatedAt: '2026-06-14 16:00',
    repairActions: '重新校准底盘里程计和陀螺仪参数', recheckPerson: '张三', recheckResult: '通过',
    attachmentDesc: '现场安装日志', logFile: 'install_log.txt', imageFile: 'site_photo.jpg',
    moduleReplacements: [],
    processLogs: [
      { time: '2026-06-12 14:00', operator: '赵六', fromStatus: '待处理', toStatus: '处理中', notes: '已承接工单' },
      { time: '2026-06-13 10:00', operator: '赵六', fromStatus: '处理中', toStatus: '复检中', notes: '校准完成，提交复检', recheckPerson: '张三' },
      { time: '2026-06-14 16:00', operator: '张三', fromStatus: '复检中', toStatus: '已关闭', notes: '复检通过，运动精度符合要求' },
    ],
  },
  {
    id: 'DWO-002', woClass: '软件问题工单', involvesReplacement: false, softwareVersion: 'v2.2.0', type: 'delivery', deliveryPlanId: 'DP-001', deviceId: 'DEV-011', deviceSN: 'SN-DEV-011',
    description: '客户反映设备在低电量时异常重启', severity: '高',
    status: '待处理', assignedTo: '', createdAt: '2026-06-20 09:00', updatedAt: '2026-06-20 09:00',
    repairActions: '', recheckPerson: '', recheckResult: '',
    attachmentDesc: '', logFile: '', imageFile: '',
    moduleReplacements: [],
    processLogs: [],
  },
  {
    id: 'DWO-003', woClass: '其他问题工单', involvesReplacement: false, type: 'delivery', deliveryPlanId: 'DP-002', deviceId: 'DEV-009', deviceSN: 'SN-DEV-009',
    description: '出厂检验发现EMC测试部分指标临界，需补测', severity: '低',
    status: '已关闭', assignedTo: '张三', createdAt: '2026-06-18 10:30', updatedAt: '2026-06-19 17:00',
    repairActions: '增加屏蔽贴片，重新进行EMC测试', recheckPerson: '李四', recheckResult: '通过',
    attachmentDesc: 'EMC测试报告', logFile: 'emc_report.pdf', imageFile: '',
    moduleReplacements: [],
    processLogs: [
      { time: '2026-06-18 10:30', operator: '张三', fromStatus: '待处理', toStatus: '处理中', notes: '确认EMC问题，联系整改方案' },
      { time: '2026-06-19 09:00', operator: '张三', fromStatus: '处理中', toStatus: '复检中', notes: '已添加屏蔽措施，送检' },
      { time: '2026-06-19 17:00', operator: '李四', fromStatus: '复检中', toStatus: '已关闭', notes: 'EMC复测全项通过' },
    ],
  },
  {
    id: 'DWO-004', woClass: '软件问题工单', involvesReplacement: false, softwareVersion: 'v2.3.0', type: 'delivery', deliveryPlanId: 'DP-002', deviceId: 'DEV-026', deviceSN: 'SN-DEV-026',
    description: '现场安装调试时发现网络连接不稳定，丢包率高', severity: '中',
    status: '处理中', assignedTo: '王五', createdAt: '2026-06-21 14:00', updatedAt: '2026-06-22 09:00',
    repairActions: '排查网络模块固件版本，尝试更新至最新版本',
    recheckPerson: '', recheckResult: '',
    attachmentDesc: '', logFile: 'network_log.txt', imageFile: '',
    moduleReplacements: [],
    processLogs: [
      { time: '2026-06-21 14:00', operator: '王五', fromStatus: '待处理', toStatus: '处理中', notes: '到场排查，发现网络模块固件需升级' },
    ],
  },
  {
    id: 'DWO-005', woClass: '其他问题工单', involvesReplacement: false, type: 'delivery', deliveryPlanId: 'DP-003', deviceId: 'DEV-023', deviceSN: 'SN-DEV-023',
    description: '客户验收时发现设备外观有划伤，不影响功能但客户要求处理', severity: '低',
    status: '处理中', assignedTo: '赵六', createdAt: '2026-06-20 16:00', updatedAt: '2026-06-21 10:00',
    repairActions: '安排外观修复，局部喷漆后重新验收',
    recheckPerson: '', recheckResult: '',
    attachmentDesc: '外观划伤照片', logFile: '', imageFile: 'scratch_photo.jpg',
    moduleReplacements: [],
    processLogs: [
      { time: '2026-06-20 16:00', operator: '赵六', fromStatus: '待处理', toStatus: '处理中', notes: '确认划伤位置，安排修复' },
    ],
  },
  {
    id: 'DWO-006', woClass: '换件工单', involvesReplacement: true, needReplaceModuleType: '底盘密封件', oldModuleSN: '待确认', newModuleSN: '待选择', newModuleStockStatus: '待选择', type: 'delivery', deliveryPlanId: 'DP-003', deviceId: 'DEV-024', deviceSN: 'SN-DEV-024',
    description: '出厂检验防护等级测试不通过，IP65密封性不足', severity: '高',
    status: '复检中', assignedTo: '张三', recheckPerson: '王五', createdAt: '2026-06-19 10:00', updatedAt: '2026-06-22 14:00',
    repairActions: '重新检查密封圈，更换防护等级不足部位的密封件',
    recheckResult: '',
    attachmentDesc: 'IP防护测试报告', logFile: 'ip65_test.pdf', imageFile: '',
    moduleReplacements: [],
    processLogs: [
      { time: '2026-06-19 10:00', operator: '张三', fromStatus: '待处理', toStatus: '处理中', notes: '拆检发现底部密封圈老化，安排更换' },
      { time: '2026-06-21 16:00', operator: '张三', fromStatus: '处理中', toStatus: '复检中', notes: '密封件更换完成，提交王五复检' },
    ],
  },
  {
    id: 'DWO-007', woClass: '软件问题工单', involvesReplacement: false, softwareVersion: 'v2.1.5', type: 'delivery', deliveryPlanId: 'DP-001', deviceId: 'DEV-028', deviceSN: 'SN-DEV-028',
    description: '现场安装后客户反馈设备启动时间过长，超过30秒', severity: '低',
    status: '待处理', assignedTo: '', createdAt: '2026-06-22 08:00', updatedAt: '2026-06-22 08:00',
    repairActions: '', recheckPerson: '', recheckResult: '',
    attachmentDesc: '', logFile: '', imageFile: '',
    moduleReplacements: [],
    processLogs: [],
  },
  {
    id: 'DWO-008', woClass: '软件问题工单', involvesReplacement: false, softwareVersion: 'v2.3.1', type: 'delivery', deliveryPlanId: 'DP-002', deviceId: 'DEV-011', deviceSN: 'SN-DEV-011',
    description: '客户验收阶段发现机器人在特定场景下避障失灵', severity: '高',
    status: '待处理', assignedTo: '', createdAt: '2026-06-22 11:00', updatedAt: '2026-06-22 11:00',
    repairActions: '', recheckPerson: '', recheckResult: '',
    attachmentDesc: '', logFile: '', imageFile: '',
    moduleReplacements: [],
    processLogs: [],
  },
];

export const deliveryPlans = [
  {
    // 交付中：已绑定、部分节点推进、尚未全部验收
    id: 'DP-001', name: '智魔方Q2交付计划', batchNo: 'DB-2026-001', projectId: 'PROJ-001',
    targetCount: 5, status: '交付中', owner: '张三', currentNode: '客户验收',
    factoryDate: '2026-06-10', siteInstallDate: '2026-06-14', acceptanceDate: '2026-07-31', dueDate: '2026-07-31',
    erpOutboundNo: 'SO-2026-018', erpAcceptanceNo: 'AC-2026-018',
    boundDeviceIds: ['DEV-027', 'DEV-011', 'DEV-028'],
    records: {
      binding: [
        { id: 'BIND-010', deviceId: 'DEV-027', preAssignedLocationId: 'LOC-001', operator: '张三', time: '2026-06-07 09:00' },
        { id: 'BIND-011', deviceId: 'DEV-011', preAssignedLocationId: 'LOC-001', operator: '张三', time: '2026-06-07 09:10' },
        { id: 'BIND-013', deviceId: 'DEV-028', preAssignedLocationId: 'LOC-001', operator: '张三', time: '2026-06-07 09:20' },
      ],
      factoryInspection: [
        { id: 'FI-001', deviceId: 'DEV-027', deviceSN: 'SN-DEV-027', operator: '赵六', time: '2026-06-08 10:00', result: 'Pass', reportFile: 'fi_DEV010.pdf', reportLink: '' },
        { id: 'FI-002', deviceId: 'DEV-011', deviceSN: 'SN-DEV-011', operator: '赵六', time: '2026-06-08 11:00', result: 'Pass', reportFile: '', reportLink: 'http://report.example.com/fi002' },
        { id: 'FI-003', deviceId: 'DEV-028', deviceSN: 'SN-DEV-028', operator: '张三', time: '2026-06-09 09:00', result: 'Pass', reportFile: 'fi_DEV013.pdf', reportLink: '' },
      ],
      siteInstall: [
        { id: 'SI-001', deviceId: 'DEV-027', deviceSN: 'SN-DEV-027', operator: '赵六', locationId: 'LOC-001', time: '2026-06-12 14:00', result: 'Pass', notes: '' },
        { id: 'SI-002', deviceId: 'DEV-011', deviceSN: 'SN-DEV-011', operator: '赵六', locationId: 'LOC-002', time: '2026-06-13 10:00', result: 'Pass', notes: '' },
      ],
      customerAccept: [
        { id: 'CA-001', deviceId: 'DEV-027', deviceSN: 'SN-DEV-027', operator: '蔡八', locationId: 'LOC-001', time: '2026-06-15 15:00', result: 'Pass', erpOutboundNo: 'SO-2026-018', voucherDesc: '验收单照片.jpg' },
      ],
    },
  },
  {
    // 交付中：出厂检验 / 现场安装调试进行中
    id: 'DP-002', name: '华熙生物交付计划', batchNo: 'DB-2026-002', projectId: 'PROJ-002',
    targetCount: 3, status: '交付中', owner: '李四', currentNode: '现场安装调试',
    factoryDate: '2026-06-18', siteInstallDate: '2026-06-20', acceptanceDate: '2026-08-15', dueDate: '2026-08-15',
    erpOutboundNo: '', erpAcceptanceNo: '',
    boundDeviceIds: ['DEV-009', 'DEV-026'],
    records: {
      binding: [
        { id: 'BIND-009', deviceId: 'DEV-009', preAssignedLocationId: 'LOC-004', operator: '李四', time: '2026-06-17 09:00' },
        { id: 'BIND-026', deviceId: 'DEV-026', preAssignedLocationId: 'LOC-003', operator: '李四', time: '2026-06-17 09:10' },
      ],
      factoryInspection: [
        { id: 'FI-004', deviceId: 'DEV-009', deviceSN: 'SN-DEV-009', operator: '张三', time: '2026-06-18 10:00', result: 'Pass', reportFile: 'fi_DEV009.pdf', reportLink: '' },
        { id: 'FI-005', deviceId: 'DEV-026', deviceSN: 'SN-DEV-026', operator: '张三', time: '2026-06-18 11:00', result: 'Pass', reportFile: 'fi_DEV026.pdf', reportLink: '' },
      ],
      siteInstall: [
        { id: 'SI-003', deviceId: 'DEV-009', deviceSN: 'SN-DEV-009', operator: '赵六', locationId: 'LOC-004', time: '2026-06-20 09:00', result: 'Pass', notes: '洁净环境安装顺利' },
      ],
      customerAccept: [],
    },
  },
  {
    // 交付中：含一台出厂检验 NG，已生成交付工单
    id: 'DP-003', name: '机场T3航站楼交付计划', batchNo: 'DB-2026-003', projectId: 'PROJ-003',
    targetCount: 4, status: '交付中', owner: '王五', currentNode: '出厂检验',
    factoryDate: '2026-06-19', siteInstallDate: '2026-07-05', acceptanceDate: '2026-08-30', dueDate: '2026-08-30',
    erpOutboundNo: '', erpAcceptanceNo: '',
    boundDeviceIds: ['DEV-012', 'DEV-023', 'DEV-024'],
    records: {
      binding: [
        { id: 'BIND-012', deviceId: 'DEV-012', preAssignedLocationId: 'LOC-005', operator: '王五', time: '2026-06-09 09:00' },
        { id: 'BIND-023', deviceId: 'DEV-023', preAssignedLocationId: 'LOC-005', operator: '王五', time: '2026-06-09 09:10' },
        { id: 'BIND-024', deviceId: 'DEV-024', preAssignedLocationId: 'LOC-006', operator: '王五', time: '2026-06-09 09:20' },
      ],
      factoryInspection: [
        { id: 'FI-006', deviceId: 'DEV-012', deviceSN: 'SN-DEV-012', operator: '王五', time: '2026-04-09 11:00', result: 'Pass', reportFile: 'fi_DEV012.pdf', reportLink: '' },
        { id: 'FI-007', deviceId: 'DEV-023', deviceSN: 'SN-DEV-023', operator: '王五', time: '2026-06-10 10:00', result: 'Pass', reportFile: 'fi_DEV023.pdf', reportLink: '' },
        { id: 'FI-008', deviceId: 'DEV-024', deviceSN: 'SN-DEV-024', operator: '张三', time: '2026-06-19 09:00', result: 'NG', reportFile: '', reportLink: '', notes: 'IP65防护不足，已生成工单DWO-006' },
      ],
      siteInstall: [
        { id: 'SI-004', deviceId: 'DEV-012', deviceSN: 'SN-DEV-012', operator: '王五', locationId: 'LOC-005', time: '2026-04-11 10:00', result: 'Pass', notes: '巡检路线已配置' },
      ],
      customerAccept: [],
    },
  },
  {
    // 未开始 且 未绑定设备
    id: 'DP-004', name: '华熙生物二期交付计划', batchNo: 'DB-2026-004', projectId: 'PROJ-002',
    targetCount: 2, status: '未开始', owner: '李四', currentNode: '绑定设备',
    factoryDate: '2026-08-01', siteInstallDate: '2026-08-10', acceptanceDate: '2026-08-25', dueDate: '2026-08-25',
    erpOutboundNo: '', erpAcceptanceNo: '',
    boundDeviceIds: [],
    records: { binding: [], factoryInspection: [], siteInstall: [], customerAccept: [] },
  },
  {
    // 未开始 但 已绑定设备
    id: 'DP-005', name: '机场T2航站楼交付计划', batchNo: 'DB-2026-005', projectId: 'PROJ-003',
    targetCount: 2, status: '未开始', owner: '王五', currentNode: '绑定设备',
    factoryDate: '2026-07-20', siteInstallDate: '2026-07-28', acceptanceDate: '2026-08-10', dueDate: '2026-08-10',
    erpOutboundNo: '', erpAcceptanceNo: '',
    boundDeviceIds: ['DEV-023'],
    records: {
      binding: [
        { id: 'BIND-053', deviceId: 'DEV-023', preAssignedLocationId: 'LOC-006', operator: '王五', time: '2026-06-28 10:00' },
      ],
      factoryInspection: [], siteInstall: [], customerAccept: [],
    },
  },
  {
    // 已延期：计划验收时间早于今天且未全部验收
    id: 'DP-006', name: '智魔方Q1补交付计划', batchNo: 'DB-2026-006', projectId: 'PROJ-001',
    targetCount: 3, status: '交付中', owner: '张三', currentNode: '现场安装调试',
    factoryDate: '2026-06-01', siteInstallDate: '2026-06-08', acceptanceDate: '2026-06-20', dueDate: '2026-06-20',
    erpOutboundNo: '', erpAcceptanceNo: '',
    boundDeviceIds: ['DEV-029'],
    records: {
      binding: [
        { id: 'BIND-025', deviceId: 'DEV-029', preAssignedLocationId: 'LOC-002', operator: '张三', time: '2026-05-30 09:00' },
      ],
      factoryInspection: [
        { id: 'FI-009', deviceId: 'DEV-029', deviceSN: 'SN-DEV-029', operator: '赵六', time: '2026-06-02 10:00', result: 'Pass', reportFile: 'fi_DEV025.pdf', reportLink: '' },
      ],
      siteInstall: [],
      customerAccept: [],
    },
  },
  {
    // 已验收：目标数量全部客户验收 Pass
    id: 'DP-007', name: '杭州东站验收交付计划', batchNo: 'DB-2026-007', projectId: 'PROJ-006',
    targetCount: 1, status: '已验收', owner: '李四', currentNode: '客户验收',
    factoryDate: '2026-05-20', siteInstallDate: '2026-05-25', acceptanceDate: '2026-06-01', dueDate: '2026-06-01',
    erpOutboundNo: 'SO-2026-032', erpAcceptanceNo: 'AC-2026-032',
    boundDeviceIds: ['DEV-024'],
    records: {
      binding: [
        { id: 'BIND-124', deviceId: 'DEV-024', preAssignedLocationId: 'LOC-006', operator: '李四', time: '2026-05-18 09:00' },
      ],
      factoryInspection: [
        { id: 'FI-010', deviceId: 'DEV-024', deviceSN: 'SN-DEV-024', operator: '王五', time: '2026-05-20 10:00', result: 'Pass', reportFile: 'fi_hz024.pdf', reportLink: '' },
      ],
      siteInstall: [
        { id: 'SI-005', deviceId: 'DEV-024', deviceSN: 'SN-DEV-024', operator: '赵六', locationId: 'LOC-006', time: '2026-05-25 10:00', result: 'Pass', notes: '' },
      ],
      customerAccept: [
        { id: 'CA-003', deviceId: 'DEV-024', deviceSN: 'SN-DEV-024', operator: '现场验收负责人', locationId: 'LOC-006', time: '2026-06-01 15:00', result: 'Pass', erpOutboundNo: 'SO-2026-032', voucherDesc: '杭州东站验收单.pdf' },
      ],
    },
  },
  {
    // 已作废
    id: 'DP-008', name: '作废演示交付计划', batchNo: 'DB-2026-008', projectId: 'PROJ-001',
    targetCount: 2, status: '已作废', voided: true, voidReason: '客户调整交付批次', owner: '张三', currentNode: '绑定设备',
    factoryDate: '2026-06-01', siteInstallDate: '', acceptanceDate: '', dueDate: '2026-07-15',
    erpOutboundNo: '', erpAcceptanceNo: '',
    boundDeviceIds: [],
    records: { binding: [], factoryInspection: [], siteInstall: [], customerAccept: [] },
  },
];

export const FEISHU_USERS = [
  { id: 'u1', name: '张三', avatar: 'Z', dept: '制造部', role: '装配工' },
  { id: 'u2', name: '李四', avatar: 'L', dept: '质检部', role: '质检员' },
  { id: 'u3', name: '王五', avatar: 'W', dept: '测试部', role: '测试员' },
  { id: 'u4', name: '赵六', avatar: 'Z', dept: '运维部', role: '运维工程师' },
  { id: 'u5', name: '李七', avatar: 'L', dept: '管理部', role: '厂长' },
  { id: 'u6', name: '蔡八', avatar: 'C', dept: '项目部', role: '项目负责人' },
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
};

export const locations = [
  { id: 'LOC-001', projectId: 'PROJ-001', name: '深圳海岸城店', address: '深圳市南山区海岸城', deviceIds: ['DEV-027', 'DEV-028'] },
  { id: 'LOC-002', projectId: 'PROJ-001', name: '深圳万象城店', address: '深圳市罗湖区万象城', deviceIds: ['DEV-029'] },
  { id: 'LOC-003', projectId: 'PROJ-002', name: '北京三里屯店', address: '北京市朝阳区三里屯', deviceIds: ['DEV-011'] },
  { id: 'LOC-004', projectId: 'PROJ-002', name: '北京王府井店', address: '北京市东城区王府井', deviceIds: ['DEV-009'] },
  { id: 'LOC-005', projectId: 'PROJ-003', name: 'T3航站楼A区', address: '首都国际机场T3航站楼A区', deviceIds: ['DEV-012'] },
  { id: 'LOC-006', projectId: 'PROJ-003', name: 'T3航站楼B区', address: '首都国际机场T3航站楼B区', deviceIds: ['DEV-024'] },
];

export const qualityIssues = [
  { id: 'QI-001', deviceId: 'DEV-027', deviceSN: 'SN-DEV-027', deviceName: 'AlphaBot 1', locationId: 'LOC-001', projectId: 'PROJ-001', issueDesc: '机器人在货架转角处导航异常，频繁停止等待', reporterId: 'user-zhaoliu', reporterName: '赵六', reportTime: '2026-06-22 14:30', status: '待处理', source: '扫码上报', sourceStage: '在线运营', issueType: '功能异常', severity: '中', owner: '赵六', linkedWorkOrder: false, processLogs: [] },
  { id: 'QI-002', deviceId: 'DEV-028', deviceSN: 'SN-DEV-028', deviceName: 'AlphaBot 1', locationId: 'LOC-001', projectId: 'PROJ-001', issueDesc: '设备运行时发出异常响声，疑似关节松动', reporterId: 'user-zhangsan', reporterName: '张三', reportTime: '2026-06-21 09:15', status: '处理中', source: '手动录入', sourceStage: '在线运营', issueType: '功能异常', severity: '中', owner: '张三', linkedWorkOrder: false, processLogs: [{ time: '2026-06-21 11:00', operator: '李四', fromStatus: '待处理', toStatus: '处理中', notes: '已到场确认，关节螺丝松动，正在紧固' }] },
  { id: 'QI-003', deviceId: 'DEV-029', deviceSN: 'SN-DEV-029', deviceName: 'AlphaBot 1', locationId: 'LOC-002', projectId: 'PROJ-001', issueDesc: '屏幕显示异常，出现竖条纹花屏', reporterId: 'user-wangwu', reporterName: '王五', reportTime: '2026-06-20 16:45', status: '已关闭', source: '扫码上报', sourceStage: '在线运营', issueType: '外观缺陷', severity: '高', owner: '王五', linkedWorkOrder: false, processLogs: [{ time: '2026-06-20 17:30', operator: '赵六', fromStatus: '待处理', toStatus: '处理中', notes: '远程重启后恢复' }, { time: '2026-06-21 09:00', operator: '赵六', fromStatus: '处理中', toStatus: '已关闭', notes: '确认为软件渲染问题，已推送更新包' }] },
  { id: 'QI-004', deviceId: 'DEV-011', deviceSN: 'SN-DEV-011', deviceName: 'AlphaBot 1', locationId: 'LOC-003', projectId: 'PROJ-002', issueDesc: '充电桩对接不稳定，充电过程多次中断', reporterId: 'user-lisi', reporterName: '李四', reportTime: '2026-06-22 08:20', status: '待处理', source: '手动录入', sourceStage: '在线运营', issueType: '通信异常', severity: '高', owner: '李四', linkedWorkOrder: false, processLogs: [] },
  { id: 'QI-005', deviceId: 'DEV-009', deviceSN: 'SN-DEV-009', deviceName: 'AlphaBot 1', locationId: 'LOC-004', projectId: 'PROJ-002', issueDesc: '设备在人群密集区域速度控制响应迟滞', reporterId: 'user-zhaoliu', reporterName: '赵六', reportTime: '2026-06-21 13:00', status: '处理中', source: '扫码上报', sourceStage: '在线运营', issueType: '性能不达标', severity: '中', owner: '赵六', linkedWorkOrder: false, processLogs: [{ time: '2026-06-21 15:00', operator: '王五', fromStatus: '待处理', toStatus: '处理中', notes: '已排查，系感知延迟导致，正在调整参数' }] },
  { id: 'QI-006', deviceId: 'DEV-012', deviceSN: 'SN-DEV-012', deviceName: 'AlphaBot 2', locationId: 'LOC-005', projectId: 'PROJ-003', issueDesc: '电量低于20%时自主返回充电桩功能失效', reporterId: 'user-zhangsan', reporterName: '张三', reportTime: '2026-06-20 11:30', status: '已关闭', source: '手动录入', sourceStage: '在线运营', issueType: '功能异常', severity: '高', owner: '张三', linkedWorkOrder: false, processLogs: [{ time: '2026-06-20 14:00', operator: '李四', fromStatus: '待处理', toStatus: '处理中', notes: '确认为固件bug，申请补丁' }, { time: '2026-06-22 10:00', operator: '李四', fromStatus: '处理中', toStatus: '已关闭', notes: '固件补丁已推送，功能验证通过' }] },
  { id: 'QI-007', deviceId: 'DEV-024', deviceSN: 'SN-DEV-024', deviceName: 'AlphaBot 1', locationId: 'LOC-006', projectId: 'PROJ-003', issueDesc: 'B区安检通道附近LIDAR点云数据丢失，影响避障', reporterId: 'user-wangwu', reporterName: '王五', reportTime: '2026-06-22 10:00', status: '待处理', source: '扫码上报', sourceStage: '在线运营', issueType: '通信异常', severity: '高', owner: '王五', linkedWorkOrder: false, processLogs: [] },
  { id: 'QI-008', deviceId: 'DEV-027', deviceSN: 'SN-DEV-027', deviceName: 'AlphaBot 1', locationId: 'LOC-001', projectId: 'PROJ-001', issueDesc: '货架扫描识别率下降，特定条形码无法读取', reporterId: 'user-lisi', reporterName: '李四', reportTime: '2026-06-19 14:00', status: '处理中', source: '手动录入', sourceStage: '在线运营', issueType: '功能异常', severity: '高', owner: '李四', linkedWorkOrder: false, processLogs: [{ time: '2026-06-19 16:00', operator: '张三', fromStatus: '待处理', toStatus: '处理中', notes: '摄像头镜头有污染，清洁后部分改善，继续观察' }] },
  { id: 'QI-009', deviceId: 'DEV-028', deviceSN: 'SN-DEV-028', deviceName: 'AlphaBot 1', locationId: 'LOC-001', projectId: 'PROJ-001', issueDesc: '设备在湿滑地面行进时偶发打滑，里程计偏差大', reporterId: 'user-zhaoliu', reporterName: '赵六', reportTime: '2026-06-18 09:30', status: '已关闭', source: '扫码上报', sourceStage: '在线运营', issueType: '功能异常', severity: '中', owner: '赵六', linkedWorkOrder: false, processLogs: [{ time: '2026-06-18 11:00', operator: '王五', fromStatus: '待处理', toStatus: '处理中', notes: '底盘轮胎磨损，已申请更换' }, { time: '2026-06-20 15:00', operator: '王五', fromStatus: '处理中', toStatus: '已关闭', notes: '轮胎更换完成，测试里程计误差在允许范围内' }] },
  { id: 'QI-010', deviceId: 'DEV-011', deviceSN: 'SN-DEV-011', deviceName: 'AlphaBot 1', locationId: 'LOC-003', projectId: 'PROJ-002', issueDesc: '机器人语音播报功能异常，提示音模糊', reporterId: 'user-zhangsan', reporterName: '张三', reportTime: '2026-06-17 15:20', status: '已关闭', source: '手动录入', sourceStage: '在线运营', issueType: '功能异常', severity: '中', owner: '张三', linkedWorkOrder: false, processLogs: [{ time: '2026-06-17 17:00', operator: '赵六', fromStatus: '待处理', toStatus: '处理中', notes: '扬声器积灰，清洁后恢复正常' }, { time: '2026-06-18 09:00', operator: '赵六', fromStatus: '处理中', toStatus: '已关闭', notes: '持续监测24小时，问题未复现' }] },
  { id: 'QI-011', deviceId: 'DEV-024', deviceSN: 'SN-DEV-024', deviceName: 'AlphaBot 1', locationId: 'LOC-006', projectId: 'PROJ-003', issueDesc: '设备在人流高峰期响应指令延迟超过3秒', reporterId: 'user-lisi', reporterName: '李四', reportTime: '2026-06-22 11:45', status: '待处理', source: '扫码上报', sourceStage: '在线运营', issueType: '性能不达标', severity: '中', owner: '李四', linkedWorkOrder: false, processLogs: [] },
  { id: 'QI-012', deviceId: 'DEV-009', deviceSN: 'SN-DEV-009', deviceName: 'AlphaBot 1', locationId: 'LOC-004', projectId: 'PROJ-002', issueDesc: '地图更新后设备在旧路径巡逻，需重新配置路线', reporterId: 'user-wangwu', reporterName: '王五', reportTime: '2026-06-16 10:00', status: '已关闭', source: '手动录入', sourceStage: '在线运营', issueType: '功能异常', severity: '中', owner: '王五', linkedWorkOrder: false, processLogs: [{ time: '2026-06-16 14:00', operator: '李四', fromStatus: '待处理', toStatus: '处理中', notes: '重新下发任务地图' }, { time: '2026-06-17 09:00', operator: '李四', fromStatus: '处理中', toStatus: '已关闭', notes: '路线配置完成，验证通过' }] },
];
