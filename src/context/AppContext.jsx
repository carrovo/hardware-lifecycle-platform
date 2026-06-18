import { createContext, useContext, useReducer } from 'react';
import {
  materials as initMaterials,
  devices as initDevices,
  testRecords as initTestRecords,
  deviceTypes as initDeviceTypes,
  moduleTypes as initModuleTypes,
  productionPlans as initProductionPlans,
  operationLogs as initOperationLogs,
} from '../data/mockData';

const AppContext = createContext(null);

const initialState = {
  materials: initMaterials,
  devices: initDevices,
  testRecords: initTestRecords,
  deviceTypes: initDeviceTypes,
  moduleTypes: initModuleTypes,
  productionPlans: initProductionPlans,
  operationLogs: initOperationLogs,
  currentUser: '张三',
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };

    case 'ADD_MATERIAL':
      return { ...state, materials: [...state.materials, action.payload] };

    case 'UPDATE_MATERIAL':
      return {
        ...state,
        materials: state.materials.map((m) =>
          m.id === action.payload.id ? { ...m, ...action.payload } : m
        ),
      };

    case 'ADD_DEVICE':
      return { ...state, devices: [...state.devices, action.payload] };

    case 'UPDATE_DEVICE':
      return {
        ...state,
        devices: state.devices.map((d) =>
          d.id === action.payload.id ? { ...d, ...action.payload } : d
        ),
      };

    case 'ADD_TEST_RECORD':
      return { ...state, testRecords: [...state.testRecords, action.payload] };

    case 'UPDATE_TEST_RECORD':
      return {
        ...state,
        testRecords: state.testRecords.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload } : t
        ),
      };

    case 'ADD_OPERATION_LOG':
      return { ...state, operationLogs: [...state.operationLogs, action.payload] };

    case 'ADD_PRODUCTION_PLAN':
      return { ...state, productionPlans: [...state.productionPlans, action.payload] };

    case 'UPDATE_PRODUCTION_PLAN':
      return {
        ...state,
        productionPlans: state.productionPlans.map((p) =>
          p.id === action.payload.id ? { ...p, ...action.payload } : p
        ),
      };

    case 'ADD_DEVICE_TYPE':
      return { ...state, deviceTypes: [...state.deviceTypes, action.payload] };

    case 'ADD_MODULE_TYPE':
      return { ...state, moduleTypes: [...state.moduleTypes, action.payload] };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
