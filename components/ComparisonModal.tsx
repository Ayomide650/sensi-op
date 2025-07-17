import React, { useState } from 'react';
import { X, BarChart3, Search, Smartphone } from 'lucide-react';
import { DeviceInfo } from '../types';
import { searchDevices, getDeviceInfo, calculateDeviceScore } from '../utils/deviceDetection';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ComparisonModal: React.FC<ComparisonModalProps> = ({ isOpen, onClose }) => {
  const [device1Query, setDevice1Query] = useState('');
  const [device2Query, setDevice2Query] = useState('');
  const [device1Results, setDevice1Results] = useState<string[]>([]);
  const [device2Results, setDevice2Results] = useState<string[]>([]);
  const [selectedDevice1, setSelectedDevice1] = useState<DeviceInfo | null>(null);
  const [selectedDevice2, setSelectedDevice2] = useState<DeviceInfo | null>(null);

  React.useEffect(() => {
    if (device1Query.length > 2) {
      setDevice1Results(searchDevices(device1Query));
    } else {
      setDevice1Results([]);
    }
  }, [device1Query]);

  React.useEffect(() => {
    if (device2Query.length > 2) {
      setDevice2Results(searchDevices(device2Query));
    } else {
      setDevice2Results([]);
    }
  }, [device2Query]);

  const handleDevice1Select = (deviceName: string) => {
    const device = getDeviceInfo(deviceName);
    if (device) {
      setSelectedDevice1(device);
      setDevice1Query(deviceName);
      setDevice1Results([]);
    }
  };

  const handleDevice2Select = (deviceName: string) => {
    const device = getDeviceInfo(deviceName);
    if (device) {
      setSelectedDevice2(device);
      setDevice2Query(deviceName);
      setDevice2Results([]);
    }
  };

  const getPercentageBar = (value: number, maxValue: number) => {
    const percentage = (value / maxValue) * 100;
    return (
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-10">
          {Math.round(percentage)}%
        </span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Device Comparison</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Device 1 Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              First Device
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={device1Query}
                onChange={(e) => setDevice1Query(e.target.value)}
                placeholder="Search first device..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              />
              
              {device1Results.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {device1Results.map((device) => (
                    <button
                      key={device}
                      onClick={() => handleDevice1Select(device)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-b-0 text-gray-800 dark:text-white"
                    >
                      {device}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Device 2 Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Second Device
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={device2Query}
                onChange={(e) => setDevice2Query(e.target.value)}
                placeholder="Search second device..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              />
              
              {device2Results.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {device2Results.map((device) => (
                    <button
                      key={device}
                      onClick={() => handleDevice2Select(device)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-b-0 text-gray-800 dark:text-white"
                    >
                      {device}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comparison Results */}
        {selectedDevice1 && selectedDevice2 && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Device 1 Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                    {selectedDevice1.name}
                  </h3>
                </div>
                <div className="text-center mb-3">
                  <div className="text-2xl font-bold text-blue-600">
                    {calculateDeviceScore(selectedDevice1)}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Overall Score</div>
                </div>
              </div>

              {/* Device 2 Info */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Smartphone className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-800 dark:text-green-200">
                    {selectedDevice2.name}
                  </h3>
                </div>
                <div className="text-center mb-3">
                  <div className="text-2xl font-bold text-green-600">
                    {calculateDeviceScore(selectedDevice2)}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">Overall Score</div>
                </div>
              </div>
            </div>

            {/* Detailed Comparison */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-4">Detailed Comparison</h4>
              <div className="space-y-4">
                {[
                  { label: 'Screen Size', key: 'screenSize', unit: '"', max: 8 },
                  { label: 'Refresh Rate', key: 'refreshRate', unit: 'Hz', max: 120 },
                  { label: 'Touch Sampling', key: 'touchSamplingRate', unit: 'Hz', max: 300 },
                  { label: 'Processor Score', key: 'processorScore', unit: '/100', max: 100 },
                  { label: 'GPU Score', key: 'gpuScore', unit: '/100', max: 100 }
                ].map(({ label, key, unit, max }) => (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
                      <div className="flex space-x-4 text-sm">
                        <span className="text-blue-600 font-medium">
                          {selectedDevice1[key as keyof DeviceInfo]}{unit}
                        </span>
                        <span className="text-green-600 font-medium">
                          {selectedDevice2[key as keyof DeviceInfo]}{unit}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        {getPercentageBar(selectedDevice1[key as keyof DeviceInfo] as number, max)}
                      </div>
                      <div>
                        {getPercentageBar(selectedDevice2[key as keyof DeviceInfo] as number, max)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonModal;
