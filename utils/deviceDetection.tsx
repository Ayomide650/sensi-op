import { DeviceInfo } from '../types';
import { deviceDatabase } from '../data/deviceDatabase';

export const detectDevice = async (): Promise<DeviceInfo | null> => {
  try {
    const userAgent = navigator.userAgent;
    
    // Try to detect device from user agent
    if (/iPhone/.test(userAgent)) {
      const model = extractiPhoneModel(userAgent);
      if (model && deviceDatabase[model]) {
        return {
          name: model,
          ...deviceDatabase[model],
          detectionMethod: 'auto'
        };
      }
    }

    // For Android devices, detection is more complex
    // Return null for manual selection
    return null;
  } catch (error) {
    console.error('Device detection failed:', error);
    return null;
  }
};

const extractiPhoneModel = (userAgent: string): string | null => {
  const match = userAgent.match(/iPhone OS (\d+)_(\d+)/);
  if (match) {
    // This is a simplified mapping - in reality, you'd need a more comprehensive database
    return 'iPhone'; // Generic iPhone for now
  }
  return null;
};

export const searchDevices = (query: string): string[] => {
  const lowercaseQuery = query.toLowerCase();
  return Object.keys(deviceDatabase).filter(device =>
    device.toLowerCase().includes(lowercaseQuery)
  ).slice(0, 10); // Limit to 10 results
};

export const getDeviceInfo = (deviceName: string): DeviceInfo | null => {
  if (deviceDatabase[deviceName]) {
    return {
      name: deviceName,
      ...deviceDatabase[deviceName]
    };
  }
  return null;
};

export const fetchDetailedSpecs = async (deviceSlug: string): Promise<DeviceInfo | null> => {
  // This would integrate with an external API like GSMarena
  // For now, return null as fallback
  return null;
};

export const getDevicesByBrand = (brand: string): string[] => {
  return Object.keys(deviceDatabase).filter(device => {
    const deviceInfo = deviceDatabase[device];
    return deviceInfo.brand?.toLowerCase() === brand.toLowerCase();
  });
};

export const calculateDeviceScore = (device: DeviceInfo): number => {
  const screenWeight = 0.15;
  const refreshWeight = 0.25;
  const touchWeight = 0.20;
  const processorWeight = 0.20;
  const gpuWeight = 0.20;

  const screenScore = Math.min(100, (device.screenSize / 7) * 100);
  const refreshScore = Math.min(100, (device.refreshRate / 120) * 100);
  const touchScore = Math.min(100, (device.touchSamplingRate / 240) * 100);

  return Math.round(
    screenScore * screenWeight +
    refreshScore * refreshWeight +
    touchScore * touchWeight +
    device.processorScore * processorWeight +
    device.gpuScore * gpuWeight
  );
};
