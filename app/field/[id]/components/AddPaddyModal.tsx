'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface AddPaddyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    paddyName: string;
    paddyDescription: string;
    deviceId: string;
  }) => Promise<void>;
  isVerifying: boolean;
}

export function AddPaddyModal({ isOpen, onClose, onSubmit, isVerifying }: AddPaddyModalProps) {
  const [paddyName, setPaddyName] = useState("");
  const [paddyDescription, setPaddyDescription] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleClose = () => {
    setErrors({});
    setPaddyName("");
    setPaddyDescription("");
    setDeviceId("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: {[key: string]: string} = {};
    
    if (!paddyName.trim()) newErrors.paddyName = "Please enter a paddy name";
    if (!deviceId.trim()) {
      newErrors.deviceId = "Please enter a device ID";
    } else {
      const deviceIdPattern = /^DEVICE_\d{4}$/;
      if (!deviceIdPattern.test(deviceId)) {
        newErrors.deviceId = "Invalid format. Use DEVICE_0001 format";
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit({
        paddyName,
        paddyDescription,
        deviceId
      });
      handleClose();
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to add paddy' });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Glassmorphism Overlay */}
      <div 
        onClick={handleClose}
        className="fixed inset-0 backdrop-blur-sm bg-black/20 z-40 transition-all"
      />
      
      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
        <div className="bg-white rounded-t-3xl shadow-2xl h-[70vh] flex flex-col border-t-4 border-green-500">
          {/* Handle Bar */}
          <div className="flex justify-center pt-3 pb-4">
            <div className="w-12 h-1.5 bg-green-300 rounded-full" />
          </div>
          
          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Paddy</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paddy Name
                </label>
                <input
                  type="text"
                  value={paddyName}
                  onChange={(e) => {
                    setPaddyName(e.target.value);
                    setErrors(prev => ({...prev, paddyName: ""}));
                  }}
                  placeholder="e.g., North Paddy"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900 ${
                    errors.paddyName ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.paddyName && (
                  <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.paddyName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={paddyDescription}
                  onChange={(e) => setPaddyDescription(e.target.value)}
                  placeholder="Add any notes about this paddy"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device ID
                </label>
                <input
                  type="text"
                  value={deviceId}
                  onChange={(e) => {
                    setDeviceId(e.target.value.toUpperCase());
                    setErrors(prev => ({...prev, deviceId: ""}));
                  }}
                  placeholder="DEVICE_0001"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono bg-white text-gray-900 ${
                    errors.deviceId ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.deviceId && (
                  <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.deviceId}
                  </p>
                )}
                <p className="mt-1.5 text-xs text-gray-500">Format: DEVICE_0001</p>
              </div>

              {/* Boundary Mapping Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">📍 Boundary Mapping Required</h4>
                    <p className="text-sm text-blue-800">
                      After adding this paddy, you'll be redirected to map its boundary by plotting GPS points. This will automatically calculate the accurate area.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 active:scale-95 transition-all font-bold shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  {isVerifying ? 'Adding...' : 'Add Paddy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
