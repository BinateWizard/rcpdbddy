'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function CreateTestDevices() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [createdDevices, setCreatedDevices] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const createDevices = async () => {
    setLoading(true);
    setStatus('Creating test devices...');
    setShowSuccess(false);
    const devices: string[] = [];

    try {
      // Create DEVICE_0001
      await setDoc(doc(db, 'devices', 'DEVICE_0001'), {
        deviceId: 'DEVICE_0001',
        name: 'Test Device 1',
        status: 'available',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      devices.push('DEVICE_0001');
      setStatus(prev => prev + '\n✅ Created DEVICE_0001');

      // Create DEVICE_0002
      await setDoc(doc(db, 'devices', 'DEVICE_0002'), {
        deviceId: 'DEVICE_0002',
        name: 'Test Device 2',
        status: 'available',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      devices.push('DEVICE_0002');
      setStatus(prev => prev + '\n✅ Created DEVICE_0002');

      // Create DEVICE_0003
      await setDoc(doc(db, 'devices', 'DEVICE_0003'), {
        deviceId: 'DEVICE_0003',
        name: 'Test Device 3',
        status: 'available',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      devices.push('DEVICE_0003');
      setStatus(prev => prev + '\n✅ Created DEVICE_0003');

      setCreatedDevices(devices);
      setStatus(prev => prev + '\n\n✨ All test devices created successfully!\n\nYou can now use these device IDs:\n  - DEVICE_0001\n  - DEVICE_0002\n  - DEVICE_0003');
      setShowSuccess(true);
    } catch (error: any) {
      setStatus(prev => prev + `\n\n❌ Error: ${error.message}. Please try again or check console for details.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Create Test Devices</h1>
        <p className="text-gray-600 mb-6">
          This will create test devices in Firestore for development purposes.
        </p>

        <button
          onClick={createDevices}
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          title="Create 3 test devices in Firestore (HCI Rule 8: Clear action)"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Creating devices...</span>
            </>
          ) : (
            'Create Test Devices'
          )}
        </button>

        {showSuccess && (
          <div className="mt-4 p-4 bg-green-100 border-2 border-green-500 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✓</span>
              <span className="font-semibold text-green-800">
                Successfully created {createdDevices.length} test device(s)!
              </span>
            </div>
          </div>
        )}

        {status && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
              {status}
            </pre>
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> After creating the devices, you should remove the device creation permission from your Firestore rules for security.
          </p>
        </div>
      </div>
    </div>
  );
}
