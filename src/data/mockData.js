// Mock Data for Hardware Lifecycle Management Platform

export const USERS = ['张三', '李四', '王五', '赵六'];

export const MATERIAL_CATEGORIES = ['底盘', '机械臂', '电机', '末端', '全身相机', '预控'];

export const moduleTypes = [
  { id: 'MT-001', name: '标准底盘', category: '底盘', specs: '承重≥80kg，驱动轮径200mm', urdf: 'chassis_v2.urdf', active: true },
  { id: 'MT-002', name: '双自由度机械臂', category: '机械臂', specs: '臂展800mm，负载5kg', urdf: 'arm_v3.urdf', active: true },
  { id: 'MT-003', name: '伺服电机模组', category: '电机', specs: '额定转矩8N·m，编码器17bit', urdf: 'motor_v1.urdf', active: true },
  { id: 'MT-004', name: '柔性末端执行器', category: '末端', specs: '夹持力0-50N，精度±0.5mm', urdf: 'end_effector_v2.urdf', active: true },
  { id: 'MT-005', name: '全身视觉相机', category: '全身相机', specs: '1080P@60fps，FOV 120°', urdf: 'camera_v1.urdf', active: true },
  { id: 'MT-006', name: '预控计算模组', category: '预控', specs: 'ARM Cortex-A72，8GB RAM', urdf: 'precontrol_v2.urdf', active: true },
];

export const deviceTypes = [
  {
    id: 'DT-001',
    name: 'RoboArm-X1',
    urdf: 'roboarm_x1.urdf',
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
    name: 'RoboArm-X2',
    urdf: 'roboarm_x2.urdf',
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
      { id: 's12', slotName: '头部相机槁位', moduleTypeId: 'MT-005', quantity: 1 },
      { id: 's13', slotName: '胸部相机槁位', moduleTypeId: 'MT-005', quantity: 1 },
      { id: 's14', slotName: '腰部相机槁位', moduleTypeId: 'MT-005', quantity: 1 },
      { id: 's15', slotName: '预控槁位', moduleTypeId: 'MT-006', quantity: 1 },
    ],
  },
];

export const materials = [
  { id: 'MAT-001', sn: 'SN-CHASSIS-001', category: '底盘', model: 'CH-2024-A', batchNo: 'BATCH-2024-001', supplier: '供应商A', quantity: 1, inspectionResult: '合格', inspector: '张三', inspectionTime: '2026-05-01 09:30', status: '已占用', notes: '' },
  { id: 'MAT-002', sn: 'SN-CHASSIS-002', category: '底盘', model: 'CH-2024-A', batchNo: 'BATCH-2024-001', supplier: '供应商A', quantity: 1, inspectionResult: '合格', inspector: '张三', inspectionTime: '2026-05-01 09:45', status: '已占用', notes: '' },
  { id: 'MAT-003', sn: 'SN-ARM-001', category: '机械臂', model: 'ARM-2024-B', batchNo: 'BATCH-2024-002', supplier: '供应商B', quantity: 1, inspectionResult: '合格', inspector: '李四', inspectionTime: '2026-05-02 10:00', status: '已占用', notes: '' },
  { id: 'MAT-004', sn: 'SN-ARM-002', category: '机械臂', model: 'ARM-2024-B', batchNo: 'BATCH-2024-002', supplier: '供应商B', quantity: 1, inspectionResult: '合格', inspector: '李四', inspectionTime: '2026-05-02 10:15', status: '待装配', notes: '' },
  { id: 'MAT-005', sn: 'SN-ARM-003', category: '机械臂', model: 'ARM-2024-B', batchNo: 'BATCH-2024-002', supplier: '供应商B', quantity: 1, inspectionResult: '不合格', inspector: '李四', inspectionTime: '2026-05-02 10:30', status: '退货换货', notes: '外壳有裂纹' },
  { id: 'MAT-006', sn: 'SN-MOTOR-001', category: '电机', model: 'MTR-2024-C', batchNo: 'BATCH-2024-003', supplier: '供应商C', quantity: 1, inspectionResult: '合格', inspector: '王五', inspectionTime: '2026-05-03 08:30', status: '已占用', notes: '' },
  { id: 'MAT-007', sn: 'SN-MOTOR-002', category: '电机', model: 'MTR-2024-C', batchNo: 'BATCH-2024-003', supplier: '供应商C', quantity: 1, inspectionResult: '合格', inspector: '王五', inspectionTime: '2026-05-03 08:45', status: '待装配', notes: '' },
  { id: 'MAT-008', sn: 'SN-MOTOR-003', category: '电机', model: 'MTR-2024-C', batchNo: 'BATCH-2024-003', supplier: '供应商C', quantity: 1, inspectionResult: '特批使用', inspector: '赵六', inspectionTime: '2026-05-03 09:00', status: '待装配', notes: '噪音略高，特批使用' },
  { id: 'MAT-009', sn: 'SN-END-001', category: '末端', model: 'END-2024-D', batchNo: 'BATCH-2024-004', supplier: '供应商D', quantity: 1, inspectionResult: '合格', inspector: '张三', inspectionTime: '2026-05-04 09:00', status: '已占用', notes: '' },
  { id: 'MAT-010', sn: 'SN-END-002', category: '末端', model: 'END-2024-D', batchNo: 'BATCH-2024-004', supplier: '供应商D', quantity: 1, inspectionResult: '合格', inspector: '张三', inspectionTime: '2026-05-04 09:15', status: '待装配', notes: '' },
  { id: 'MAT-011', sn: 'SN-CAM-001', category: '全身相机', model: 'CAM-2024-E', batchNo: 'BATCH-2024-005', supplier: '供应商E', quantity: 1, inspectionResult: '合格', inspector: '李四', inspectionTime: '2026-05-05 10:00', status: '已占用', notes: '' },
  { id: 'MAT-012', sn: 'SN-CAM-002', category: '全身相机', model: 'CAM-2024-E', batchNo: 'BATCH-2024-005', supplier: '供应商E', quantity: 1, inspectionResult: '不合格', inspector: '李四', inspectionTime: '2026-05-05 10:20', status: '退货换货', notes: '图像传感器损坏' },
  { id: 'MAT-013', sn: 'SN-CTRL-001', category: '预控', model: 'CTRL-2024-F', batchNo: 'BATCH-2024-006', supplier: '供应商F', quantity: 1, inspectionResult: '合格', inspector: '王五', inspectionTime: '2026-05-06 08:00', status: '已占用', notes: '' },
  { id: 'MAT-014', sn: 'SN-CTRL-002', category: '预控', model: 'CTRL-2024-F', batchNo: 'BATCH-2024-006', supplier: '供应商F', quantity: 1, inspectionResult: '合格', inspector: '王五', inspectionTime: '2026-05-06 08:30', status: '待装配', notes: '' },
  { id: 'MAT-015', sn: 'SN-MOTOR-004', category: '电机', model: 'MTR-2024-C', batchNo: 'BATCH-2024-007', supplier: '供应商C', quantity: 1, inspectionResult: '合格', inspector: '赵六', inspectionTime: '2026-05-07 09:00', status: '待装配', notes: '' },
  { id: 'MAT-016', sn: 'SN-MOTOR-005', category: '电机', model: 'MTR-2024-C', batchNo: 'BATCH-2024-007', supplier: '供应商C', quantity: 1, inspectionResult: '合格', inspector: '赵六', inspectionTime: '2026-05-07 09:10', status: '已占用', notes: '' },
  { id: 'MAT-017', sn: 'SN-MOTOR-006', category: '电机', model: 'MTR-2024-C', batchNo: 'BATCH-2024-007', supplier: '供应商C', quantity: 1, inspectionResult: '合格', inspector: '赵六', inspectionTime: '2026-05-07 09:20', status: '已占用', notes: '' },
  { id: 'MAT-018', sn: 'SN-CHASSIS-003', category: '底盘', model: 'CH-2024-A', batchNo: 'BATCH-2024-008', supplier: '供应商A', quantity: 1, inspectionResult: '合格', inspector: '张三', inspectionTime: '2026-05-10 09:00', status: '已占用', notes: '' },
  { id: 'MAT-019', sn: 'SN-ARM-004', category: '机械臂', model: 'ARM-2024-B', batchNo: 'BATCH-2024-008', supplier: '供应商B', quantity: 1, inspectionResult: '合格', inspector: '李四', inspectionTime: '2026-05-10 09:30', status: '已占用', notes: '' },
  { id: 'MAT-020', sn: 'SN-ARM-005', category: '机械臂', model: 'ARM-2024-B', batchNo: 'BATCH-2024-008', supplier: '供应商B', quantity: 1, inspectionResult: '合格', inspector: '李四', inspectionTime: '2026-05-10 09:45', status: '已占用', notes: '' },
];

export const devices = [
  { id: 'DEV-001', sn: 'SN-DEV-001', deviceTypeId: 'DT-001', status: '装配中', assembler: '张三', assemblyTime: '2026-06-18 10:00', photoName: 'assembly_dev001.jpg', usedMaterials: [], createdAt: '2026-06-18 10:00', updatedAt: '2026-06-18 10:00' },
  { id: 'DEV-002', sn: 'SN-DEV-002', deviceTypeId: 'DT-001', status: '功能测试中', assembler: '李四', assemblyTime: '2026-06-16 14:00', photoName: 'assembly_dev002.jpg', usedMaterials: [{ materialId: 'MAT-001', moduleTypeId: 'MT-001' }, { materialId: 'MAT-003', moduleTypeId: 'MT-002' }], createdAt: '2026-06-16 14:00', updatedAt: '2026-06-17 09:00' },
  { id: 'DEV-003', sn: 'SN-DEV-003', deviceTypeId: 'DT-001', status: '老化测试中', assembler: '王五', assemblyTime: '2026-06-14 09:00', photoName: 'assembly_dev003.jpg', usedMaterials: [{ materialId: 'MAT-006', moduleTypeId: 'MT-003' }, { materialId: 'MAT-009', moduleTypeId: 'MT-004' }], createdAt: '2026-06-14 09:00', updatedAt: '2026-06-16 15:00' },
  { id: 'DEV-004', sn: 'SN-DEV-004', deviceTypeId: 'DT-002', status: '终测中', assembler: '赵六', assemblyTime: '2026-06-10 08:00', photoName: 'assembly_dev004.jpg', usedMaterials: [{ materialId: 'MAT-013', moduleTypeId: 'MT-006' }], createdAt: '2026-06-10 08:00', updatedAt: '2026-06-17 08:00' },
  { id: 'DEV-005', sn: 'SN-DEV-005', deviceTypeId: 'DT-002', status: '待分配项目', assembler: '张三', assemblyTime: '2026-06-01 10:00', photoName: 'assembly_dev005.jpg', usedMaterials: [{ materialId: 'MAT-002', moduleTypeId: 'MT-001' }, { materialId: 'MAT-019', moduleTypeId: 'MT-002' }, { materialId: 'MAT-020', moduleTypeId: 'MT-002' }, { materialId: 'MAT-006', moduleTypeId: 'MT-003' }, { materialId: 'MAT-016', moduleTypeId: 'MT-003' }, { materialId: 'MAT-017', moduleTypeId: 'MT-003' }, { materialId: 'MAT-009', moduleTypeId: 'MT-004' }, { materialId: 'MAT-013', moduleTypeId: 'MT-006' }], createdAt: '2026-06-01 10:00', updatedAt: '2026-06-08 16:00' },
  { id: 'DEV-006', sn: 'SN-DEV-006', deviceTypeId: 'DT-001', status: '待分配项目', assembler: '李四', assemblyTime: '2026-05-28 09:00', photoName: 'assembly_dev006.jpg', usedMaterials: [{ materialId: 'MAT-001', moduleTypeId: 'MT-001' }, { materialId: 'MAT-003', moduleTypeId: 'MT-002' }, { materialId: 'MAT-018', moduleTypeId: 'MT-001' }, { materialId: 'MAT-011', moduleTypeId: 'MT-005' }], createdAt: '2026-05-28 09:00', updatedAt: '2026-06-05 10:00' },
  { id: 'DEV-007', sn: 'SN-DEV-007', deviceTypeId: 'DT-001', status: '已分配项目', assembler: '王五', assemblyTime: '2026-05-20 10:00', photoName: 'assembly_dev007.jpg', usedMaterials: [{ materialId: 'MAT-002', moduleTypeId: 'MT-001' }, { materialId: 'MAT-004', moduleTypeId: 'MT-002' }], projectId: 'PROJ-001', createdAt: '2026-05-20 10:00', updatedAt: '2026-06-10 09:00' },
  { id: 'DEV-008', sn: 'SN-DEV-008', deviceTypeId: 'DT-002', status: '已分配项目', assembler: '赵六', assemblyTime: '2026-05-18 09:00', photoName: 'assembly_dev008.jpg', usedMaterials: [{ materialId: 'MAT-011', moduleTypeId: 'MT-005' }, { materialId: 'MAT-013', moduleTypeId: 'MT-006' }], projectId: 'PROJ-001', createdAt: '2026-05-18 09:00', updatedAt: '2026-06-10 09:30' },
  { id: 'DEV-009', sn: 'SN-DEV-009', deviceTypeId: 'DT-001', status: '已分配项目', assembler: '张三', assemblyTime: '2026-05-15 10:00', photoName: 'assembly_dev009.jpg', usedMaterials: [{ materialId: 'MAT-018', moduleTypeId: 'MT-001' }, { materialId: 'MAT-019', moduleTypeId: 'MT-002' }], projectId: 'PROJ-002', createdAt: '2026-05-15 10:00', updatedAt: '2026-06-12 10:00' },
  { id: 'DEV-010', sn: 'SN-DEV-010', deviceTypeId: 'DT-002', status: '在线运营', assembler: '李四', assemblyTime: '2026-04-20 09:00', photoName: 'assembly_dev010.jpg', usedMaterials: [{ materialId: 'MAT-016', moduleTypeId: 'MT-003' }, { materialId: 'MAT-017', moduleTypeId: 'MT-003' }], projectId: 'PROJ-001', batteryPercent: 87, storagePercent: 42, lastHeartbeat: '2026-06-21 08:55', online: true, createdAt: '2026-04-20 09:00', updatedAt: '2026-06-21 08:55' },
  { id: 'DEV-011', sn: 'SN-DEV-011', deviceTypeId: 'DT-001', status: '在线运营', assembler: '王五', assemblyTime: '2026-04-15 10:00', photoName: 'assembly_dev011.jpg', usedMaterials: [{ materialId: 'MAT-006', moduleTypeId: 'MT-003' }], projectId: 'PROJ-002', batteryPercent: 62, storagePercent: 71, lastHeartbeat: '2026-06-21 07:30', online: true, createdAt: '2026-04-15 10:00', updatedAt: '2026-06-21 07:30' },
  { id: 'DEV-012', sn: 'SN-DEV-012', deviceTypeId: 'DT-002', status: '在线运营', assembler: '赵六', assemblyTime: '2026-04-10 09:00', photoName: 'assembly_dev012.jpg', usedMaterials: [{ materialId: 'MAT-009', moduleTypeId: 'MT-004' }], projectId: 'PROJ-003', batteryPercent: 15, storagePercent: 88, lastHeartbeat: '2026-06-20 23:10', online: false, createdAt: '2026-04-10 09:00', updatedAt: '2026-06-20 23:10' },
  { id: 'DEV-013', sn: 'SN-DEV-013', deviceTypeId: 'DT-001', status: '在线运营', assembler: '张三', assemblyTime: '2026-03-25 10:00', photoName: 'assembly_dev013.jpg', usedMaterials: [], projectId: 'PROJ-001', batteryPercent: 93, storagePercent: 30, lastHeartbeat: '2026-06-21 09:02', online: true, createdAt: '2026-03-25 10:00', updatedAt: '2026-06-21 09:02' },
  { id: 'DEV-014', sn: 'SN-DEV-014', deviceTypeId: 'DT-002', status: '退役', assembler: '李四', assemblyTime: '2026-01-10 09:00', photoName: 'assembly_dev014.jpg', usedMaterials: [], projectId: 'PROJ-002', createdAt: '2026-01-10 09:00', updatedAt: '2026-05-30 14:00' },
  { id: 'DEV-015', sn: 'SN-DEV-015', deviceTypeId: 'DT-001', status: '退役', assembler: '王五', assemblyTime: '2026-01-05 09:00', photoName: 'assembly_dev015.jpg', usedMaterials: [], projectId: 'PROJ-003', createdAt: '2026-01-05 09:00', updatedAt: '2026-06-01 10:00' },
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
  { id: 'TEST-017', deviceId: 'DEV-008', testType: '功能测试', result: '合格', operator: '赵六', testTime: '2026-05-20 10:00', reportFile: 'func_test_dev008.pdf', notes: '', status: '有效' },
  { id: 'TEST-018', deviceId: 'DEV-008', testType: '老化测试', result: '合格', operator: '张三', testTime: '2026-05-22 08:00', reportFile: 'burn_test_dev008.pdf', notes: '', duration: '72小时', peakTemp: '67°C', anomalyCount: 0, status: '有效' },
  { id: 'TEST-019', deviceId: 'DEV-008', testType: '终测', result: '合格', operator: '李四', testTime: '2026-05-24 09:00', reportFile: 'final_test_dev008.pdf', notes: '', status: '有效' },
  { id: 'TEST-020', deviceId: 'DEV-009', testType: '功能测试', result: '合格', operator: '王五', testTime: '2026-05-17 10:00', reportFile: 'func_test_dev009.pdf', notes: '', status: '有效' },
  { id: 'TEST-021', deviceId: 'DEV-009', testType: '老化测试', result: '不合格', operator: '赵六', testTime: '2026-05-19 08:00', reportFile: 'burn_test_dev009_v1.pdf', notes: '电机过热', duration: '24小时', peakTemp: '91°C', anomalyCount: 5, status: '有效' },
  { id: 'TEST-022', deviceId: 'DEV-009', testType: '老化测试', result: '合格', operator: '赵六', testTime: '2026-05-21 08:00', reportFile: 'burn_test_dev009_v2.pdf', notes: '更换散热后通过', duration: '72小时', peakTemp: '71°C', anomalyCount: 0, status: '有效' },
  { id: 'TEST-023', deviceId: 'DEV-009', testType: '终测', result: '合格', operator: '张三', testTime: '2026-05-23 09:00', reportFile: 'final_test_dev009.pdf', notes: '', status: '有效' },
  { id: 'TEST-024', deviceId: 'DEV-010', testType: '终测', result: '合格', operator: '李四', testTime: '2026-04-18 10:00', reportFile: 'final_test_dev010.pdf', notes: '', status: '有效' },
  { id: 'TEST-025', deviceId: 'DEV-011', testType: '终测', result: '合格', operator: '王五', testTime: '2026-04-13 10:00', reportFile: 'final_test_dev011.pdf', notes: '', status: '有效' },
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
  { id: 'LOG-010', deviceId: 'DEV-010', operator: '张三', timestamp: '2026-04-22 10:00', actionType: '上线运营', fromStatus: '已分配项目', toStatus: '在线运营', notes: '现场安装完成，上线运营' },
  { id: 'LOG-011', deviceId: 'DEV-014', operator: '李四', timestamp: '2026-05-30 14:00', actionType: '退役', fromStatus: '在线运营', toStatus: '退役', notes: '使用年限到期，正式退役' },
];

export const productionPlans = [
  { id: 'PLAN-001', date: '2026-06-01', target: 3, actual: 3, project: '项目A', notes: '' },
  { id: 'PLAN-002', date: '2026-06-02', target: 4, actual: 3, project: '项目A', notes: '一台因零件缺货延期' },
  { id: 'PLAN-003', date: '2026-06-03', target: 4, actual: 4, project: '项目B', notes: '' },
  { id: 'PLAN-004', date: '2026-06-04', target: 5, actual: 5, project: '项目B', notes: '' },
  { id: 'PLAN-005', date: '2026-06-05', target: 3, actual: 2, project: '项目A', notes: '设备故障影响产能' },
  { id: 'PLAN-006', date: '2026-06-06', target: 4, actual: 4, project: '项目C', notes: '' },
  { id: 'PLAN-007', date: '2026-06-09', target: 4, actual: 3, project: '项目C', notes: '' },
  { id: 'PLAN-008', date: '2026-06-10', target: 5, actual: 4, project: '项目B', notes: '' },
  { id: 'PLAN-009', date: '2026-06-11', target: 4, actual: 4, project: '项目A', notes: '' },
  { id: 'PLAN-010', date: '2026-06-16', target: 3, actual: 2, project: '项目A', notes: '' },
  { id: 'PLAN-011', date: '2026-06-17', target: 4, actual: 3, project: '项目B', notes: '加急补单' },
  { id: 'PLAN-012', date: '2026-06-18', target: 2, actual: 1, project: '项目C', notes: '' },
  { id: 'PLAN-013', date: '2026-06-21', target: 4, actual: 0, project: '项目A', notes: '' },
  { id: 'PLAN-014', date: '2026-06-22', target: 3, actual: 0, project: '项目C', notes: '新增订单' },
];

export const materialBatches = [
  { id: 'BATCH-001', batchNo: 'BATCH-2024-001', category: '底盘', model: 'CH-2024-A', supplier: '供应商A', quantity: 2, inspector: '张三', inspectionTime: '2026-05-01 09:30', notes: '', items: [{ id: 'MAT-001', sn: 'SN-CHASSIS-001', result: '合格', status: '已占用', notes: '' }, { id: 'MAT-002', sn: 'SN-CHASSIS-002', result: '合格', status: '已占用', notes: '' }] },
  { id: 'BATCH-002', batchNo: 'BATCH-2024-002', category: '机械臂', model: 'ARM-2024-B', supplier: '供应商B', quantity: 3, inspector: '李四', inspectionTime: '2026-05-02 10:00', notes: '', items: [{ id: 'MAT-003', sn: 'SN-ARM-001', result: '合格', status: '已占用', notes: '' }, { id: 'MAT-004', sn: 'SN-ARM-002', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-005', sn: 'SN-ARM-003', result: '不合格', status: '退货换货', notes: '外壳有裂纹' }] },
  { id: 'BATCH-003', batchNo: 'BATCH-2024-003', category: '电机', model: 'MTR-2024-C', supplier: '供应商C', quantity: 3, inspector: '王五', inspectionTime: '2026-05-03 08:30', notes: '', items: [{ id: 'MAT-006', sn: 'SN-MOTOR-001', result: '合格', status: '已占用', notes: '' }, { id: 'MAT-007', sn: 'SN-MOTOR-002', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-008', sn: 'SN-MOTOR-003', result: '特批使用', status: '待装配', notes: '噪音略高，特批使用' }] },
  { id: 'BATCH-004', batchNo: 'BATCH-2024-004', category: '末端', model: 'END-2024-D', supplier: '供应商D', quantity: 2, inspector: '张三', inspectionTime: '2026-05-04 09:00', notes: '', items: [{ id: 'MAT-009', sn: 'SN-END-001', result: '合格', status: '已占用', notes: '' }, { id: 'MAT-010', sn: 'SN-END-002', result: '合格', status: '待装配', notes: '' }] },
  { id: 'BATCH-005', batchNo: 'BATCH-2024-005', category: '全身相机', model: 'CAM-2024-E', supplier: '供应商E', quantity: 2, inspector: '李四', inspectionTime: '2026-05-05 10:00', notes: '', items: [{ id: 'MAT-011', sn: 'SN-CAM-001', result: '合格', status: '已占用', notes: '' }, { id: 'MAT-012', sn: 'SN-CAM-002', result: '不合格', status: '退货换货', notes: '图像传感器损坏' }] },
  { id: 'BATCH-006', batchNo: 'BATCH-2024-006', category: '预控', model: 'CTRL-2024-F', supplier: '供应商F', quantity: 2, inspector: '王五', inspectionTime: '2026-05-06 08:00', notes: '', items: [{ id: 'MAT-013', sn: 'SN-CTRL-001', result: '合格', status: '已占用', notes: '' }, { id: 'MAT-014', sn: 'SN-CTRL-002', result: '合格', status: '待装配', notes: '' }] },
  { id: 'BATCH-007', batchNo: 'BATCH-2024-007', category: '电机', model: 'MTR-2024-C', supplier: '供应商C', quantity: 3, inspector: '赵六', inspectionTime: '2026-05-07 09:00', notes: '', items: [{ id: 'MAT-015', sn: 'SN-MOTOR-004', result: '合格', status: '待装配', notes: '' }, { id: 'MAT-016', sn: 'SN-MOTOR-005', result: '合格', status: '已占用', notes: '' }, { id: 'MAT-017', sn: 'SN-MOTOR-006', result: '合格', status: '已占用', notes: '' }] },
  { id: 'BATCH-008', batchNo: 'BATCH-2024-008', category: '底盘', model: 'CH-2024-A', supplier: '供应商A', quantity: 3, inspector: '张三', inspectionTime: '2026-05-10 09:00', notes: '', items: [{ id: 'MAT-018', sn: 'SN-CHASSIS-003', result: '合格', status: '已占用', notes: '' }, { id: 'MAT-019', sn: 'SN-ARM-004', result: '合格', status: '已占用', notes: '' }, { id: 'MAT-020', sn: 'SN-ARM-005', result: '合格', status: '已占用', notes: '' }] },
];

// ============ Part2 & Part3 Data ============

export const projects = [
  { id: 'PROJ-001', name: '智慧工厂机器人项目', client: '宁德新能源科技有限公司', contactPerson: '刘总', contactPhone: '13800138001', background: '为宁德工厂引入智能搬运机器人，提升生产线自动化水平，降低人力成本约30%。', notes: '优先保障A栋产线交付', targetCount: 5, manager: '张三', createdAt: '2026-05-15 09:00', updatedAt: '2026-06-10 10:00' },
  { id: 'PROJ-002', name: '医疗配送机器人项目', client: '北京协和医院', contactPerson: '王主任', contactPhone: '13900139002', background: '部署智能配送机器人于住院部，实现药品、标本、餐食的自动化配送，减少交叉感染风险。', notes: '需满足医疗级别EMC认证', targetCount: 3, manager: '李四', createdAt: '2026-05-20 10:00', updatedAt: '2026-06-12 09:00' },
  { id: 'PROJ-003', name: '港口巡检机器人项目', client: '上海港务集团', contactPerson: '陈经理', contactPhone: '13700137003', background: '替代人工进行集装箱区域巡检，覆盖防火、防盗、设备状态监测等功能。', notes: '防护等级需IP65以上', targetCount: 4, manager: '王五', createdAt: '2026-06-01 10:00', updatedAt: '2026-06-18 14:00' },
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
  { id: 'DELIV-002', deviceId: 'DEV-008', projectId: 'PROJ-001', stage: '出厂检验', result: '合格', operator: '张三', recordTime: '2026-06-10 15:00', notes: '', address: '' },
  { id: 'DELIV-003', deviceId: 'DEV-009', projectId: 'PROJ-002', stage: '出厂检验', result: '合格', operator: '李四', recordTime: '2026-06-12 11:00', notes: '医疗EMC认证通过', address: '' },
  { id: 'DELIV-004', deviceId: 'DEV-007', projectId: 'PROJ-001', stage: '现场安装调试', result: '通过', operator: '王五', recordTime: '2026-06-15 10:00', notes: '安装顺利，调试完成', address: '宁德市蕉城区工厂A栋' },
  { id: 'DELIV-005', deviceId: 'DEV-008', projectId: 'PROJ-001', stage: '现场安装调试', result: '未通过', operator: '王五', recordTime: '2026-06-15 14:00', notes: '网络配置异常，需重新配置', address: '宁德市蕉城区工厂A栋' },
  { id: 'DELIV-006', deviceId: 'DEV-008', projectId: 'PROJ-001', stage: '现场安装调试', result: '通过', operator: '王五', recordTime: '2026-06-16 09:00', notes: '重新配置后通过', address: '宁德市蕉城区工厂A栋' },
  { id: 'DELIV-007', deviceId: 'DEV-009', projectId: 'PROJ-002', stage: '现场安装调试', result: '通过', operator: '赵六', recordTime: '2026-06-17 11:00', notes: '医院环境调试完成', address: '北京市东城区协和医院住院部' },
  { id: 'DELIV-008', deviceId: 'DEV-007', projectId: 'PROJ-001', stage: '客户验收', result: '通过', operator: '张三', recordTime: '2026-06-18 15:00', notes: '客户满意，签署验收单', address: '宁德市蕉城区工厂A栋' },
  { id: 'DELIV-009', deviceId: 'DEV-012', projectId: 'PROJ-003', stage: '出厂检验', result: '合格', operator: '王五', recordTime: '2026-04-09 11:00', notes: '防护等级IP65验证通过', address: '' },
];

export const alerts = [
  { id: 'ALERT-001', deviceId: 'DEV-010', projectId: 'PROJ-001', deviceSN: 'SN-DEV-010', alertTime: '2026-06-19 03:22', source: '系统自动', severity: '轻微', description: '电池电量低于20%，建议及时充电', status: '已处理', resolvedBy: '张三', resolvedAt: '2026-06-19 08:30', workOrderId: null },
  { id: 'ALERT-002', deviceId: 'DEV-012', projectId: 'PROJ-003', deviceSN: 'SN-DEV-012', alertTime: '2026-06-20 14:15', source: '系统自动', severity: '严重', description: '关节3电机过热，温度达到92°C，超过阈值', status: '待处理', resolvedBy: null, resolvedAt: null, workOrderId: 'WO-001' },
  { id: 'ALERT-003', deviceId: 'DEV-011', projectId: 'PROJ-002', deviceSN: 'SN-DEV-011', alertTime: '2026-06-20 22:40', source: '系统自动', severity: '轻微', description: '存储空间使用率超过70%，建议清理日志', status: '待处理', resolvedBy: null, resolvedAt: null, workOrderId: null },
  { id: 'ALERT-004', deviceId: 'DEV-013', projectId: 'PROJ-001', deviceSN: 'SN-DEV-013', alertTime: '2026-06-21 01:05', source: '系统自动', severity: '严重', description: '预控模组通信中断超过5分钟', status: '待处理', resolvedBy: null, resolvedAt: null, workOrderId: 'WO-002' },
  { id: 'ALERT-005', deviceId: 'DEV-010', projectId: 'PROJ-001', deviceSN: 'SN-DEV-010', alertTime: '2026-06-18 11:30', source: '人工上报', severity: '轻微', description: '末端执行器抓取精度下降，误差约±2mm', status: '已处理', resolvedBy: '李四', resolvedAt: '2026-06-18 16:00', workOrderId: null },
  { id: 'ALERT-006', deviceId: 'DEV-012', projectId: 'PROJ-003', deviceSN: 'SN-DEV-012', alertTime: '2026-06-21 07:55', source: '人工上报', severity: '严重', description: '设备离线超过8小时，现场人员无法连接', status: '待处理', resolvedBy: null, resolvedAt: null, workOrderId: 'WO-003' },
];

export const workOrders = [
  { id: 'WO-001', deviceId: 'DEV-012', deviceSN: 'SN-DEV-012', projectId: 'PROJ-003', description: '关节3电机过热，温度达92°C，需检查散热系统及电机状态', severity: '高', status: '处理中', assignedTo: '王五', createdAt: '2026-06-20 14:30', updatedAt: '2026-06-20 16:00', closedAt: null, repairActions: '已到现场，正在拆除散热模组检查', replacedModules: [], recheckResult: null, notes: '散热风扇异物堵塞' },
  { id: 'WO-002', deviceId: 'DEV-013', deviceSN: 'SN-DEV-013', projectId: 'PROJ-001', description: '预控模组通信中断，设备无法接收指令', severity: '高', status: '待处理', assignedTo: '赵六', createdAt: '2026-06-21 01:10', updatedAt: '2026-06-21 01:10', closedAt: null, repairActions: '', replacedModules: [], recheckResult: null, notes: '' },
  { id: 'WO-003', deviceId: 'DEV-012', deviceSN: 'SN-DEV-012', projectId: 'PROJ-003', description: '设备离线，网络模块故障，需更换', severity: '高', status: '处理中', assignedTo: '李四', createdAt: '2026-06-21 08:00', updatedAt: '2026-06-21 09:00', closedAt: null, repairActions: '已确认网络模块损坏，准备更换', replacedModules: [{ removedMaterialId: 'MAT-013', addedMaterialId: 'MAT-014', moduleTypeId: 'MT-006' }], recheckResult: null, notes: '网口物理损坏，可能为进水导致' },
  { id: 'WO-004', deviceId: 'DEV-010', deviceSN: 'SN-DEV-010', projectId: 'PROJ-001', description: '末端执行器抓取精度异常，超出允许误差范围', severity: '中', status: '已关闭', assignedTo: '李四', createdAt: '2026-06-18 12:00', updatedAt: '2026-06-18 17:00', closedAt: '2026-06-18 17:00', repairActions: '重新标定末端执行器，精度恢复正常', replacedModules: [], recheckResult: '合格', notes: '标定参数偏移，已重置' },
  { id: 'WO-005', deviceId: 'DEV-011', deviceSN: 'SN-DEV-011', projectId: 'PROJ-002', description: '导航地图更新失败，设备反复回到原点', severity: '低', status: '已关闭', assignedTo: '张三', createdAt: '2026-06-15 09:00', updatedAt: '2026-06-15 14:00', closedAt: '2026-06-15 14:00', repairActions: '远程推送新地图固件，重新建图完成', replacedModules: [], recheckResult: '合格', recheckPerson: '李四', notes: '固件版本不兼容导致' },
  { id: 'WO-006', deviceId: 'DEV-013', deviceSN: 'SN-DEV-013', projectId: 'PROJ-001', description: '机械臂关节2抖动明显，定位精度异常，误差超出允许范围±3mm', severity: '中', status: '复检中', assignedTo: '王五', recheckPerson: '李四', createdAt: '2026-06-21 10:00', updatedAt: '2026-06-21 14:30', closedAt: null, repairActions: '重新校准关节电机编码器，调整PID参数，更换磨损轴承衬套', replacedModules: [], recheckResult: null, notes: '关节2齿轮轻微磨损，已调整间隙' },
];

export const retirements = [
  { id: 'RET-001', deviceId: 'DEV-014', deviceSN: 'SN-DEV-014', reason: '使用年限超过3年，电机磨损严重，维修成本超过整机价值的60%，决定退役', retiredAt: '2026-05-30 14:00', operator: '李四' },
  { id: 'RET-002', deviceId: 'DEV-015', deviceSN: 'SN-DEV-015', reason: '项目结束，设备长期闲置，经评估无转项目价值，按规程退役', retiredAt: '2026-06-01 10:00', operator: '王五' },
];

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

export const FEISHU_USERS = [
  { id: 'u1', name: '张三', avatar: 'Z', dept: '制造部', role: '装配工' },
  { id: 'u2', name: '李四', avatar: 'L', dept: '质检部', role: '质检员' },
  { id: 'u3', name: '王五', avatar: 'W', dept: '测试部', role: '测试员' },
  { id: 'u4', name: '赵六', avatar: 'Z', dept: '运维部', role: '运维工程师' },
  { id: 'u5', name: '陈厂长', avatar: 'C', dept: '管理部', role: '厂长' },
  { id: 'u6', name: '刘项目', avatar: 'L', dept: '项目部', role: '项目负责人' },
];

export const ROLES_LIST = [
  '质检员', '装配工', '测试员', '运维工程师', '项目负责人', '厂长', '维修工程师', '管理员',
];

export const ROLE_NAV_PERMISSIONS = {
  '质检员':     ['/dashboard', '/materials', '/tests', '/devices'],
  '装配工':     ['/dashboard', '/assembly', '/devices', '/materials'],
  '测试员':     ['/dashboard', '/tests', '/devices'],
  '运维工程师':  ['/dashboard', '/operations', '/alerts', '/work-orders', '/devices', '/delivery'],
  '项目负责人':  ['/dashboard', '/projects', '/device-allocation', '/delivery', '/devices', '/production-plan'],
  '厂长':       ['/dashboard', '/materials', '/assembly', '/tests', '/devices', '/production-plan', '/device-types', '/projects', '/device-allocation', '/delivery', '/operations', '/alerts', '/work-orders', '/retirement'],
  '维修工程师':  ['/dashboard', '/work-orders', '/devices'],
  '管理员':     ['/dashboard', '/materials', '/assembly', '/tests', '/devices', '/production-plan', '/device-types', '/projects', '/device-allocation', '/delivery', '/operations', '/alerts', '/work-orders', '/retirement', '/users', '/roles'],
};

export const ROLE_ACTION_PERMISSIONS = {
  '质检员':     ['add_material_batch', 'void_test_record', 'recheck_work_order'],
  '装配工':     ['add_assembly'],
  '测试员':     ['add_test_record', 'void_test_record'],
  '运维工程师':  ['add_work_order', 'update_alert', 'add_delivery', 'update_work_order'],
  '项目负责人':  ['add_project', 'add_device_allocation', 'add_delivery', 'void_project'],
  '厂长':       ['add_material_batch', 'add_assembly', 'add_test_record', 'void_test_record', 'add_production_plan', 'add_project', 'add_device_allocation', 'add_delivery', 'add_work_order', 'add_retirement', 'add_device_type', 'add_module_type', 'edit_device_type', 'edit_module_type', 'void_project', 'update_work_order', 'recheck_work_order'],
  '维修工程师':  ['add_work_order', 'update_work_order'],
  '管理员':     ['add_material_batch', 'add_assembly', 'add_test_record', 'void_test_record', 'add_production_plan', 'add_project', 'add_device_allocation', 'add_delivery', 'add_work_order', 'add_retirement', 'add_device_type', 'add_module_type', 'edit_device_type', 'edit_module_type', 'void_project', 'manage_users', 'manage_roles', 'update_work_order', 'recheck_work_order'],
};
