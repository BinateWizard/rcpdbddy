import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Schedule {
  key: string;
  time: string; // 24-hour format, e.g. "13:00"
}

interface TimePickerScheduleProps {
  userId: string;
  farmId: string;
  deviceId: string;
}

const getTimeOptions = () => {
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      times.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }
  return times;
};

const TimePickerSchedule: React.FC<TimePickerScheduleProps> = ({ userId, farmId, deviceId }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const fetchSchedules = async () => {
    setLoading(true);
    const ref = doc(db, `schedules/${userId}/farm/${farmId}/devices/${deviceId}`);
    const snap = await getDoc(ref);
    const data: Schedule[] = [];
    if (snap.exists()) {
      const docData = snap.data();
      Object.entries(docData).forEach(([key, time]) => {
        data.push({ key, time: time as string });
      });
    }
    setSchedules(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSchedules();
    // eslint-disable-next-line
  }, []);

  const handleAdd = async () => {
    if (!selectedTime) return;
    // Only allow 1 hour intervals
    const exists = schedules.some(s => Math.abs(timeToMinutes(s.time) - timeToMinutes(selectedTime)) < 60);
    if (exists) {
      alert('Schedules must be at least 1 hour apart.');
      return;
    }
    const ref = doc(db, `schedules/${userId}/farm/${farmId}/devices/${deviceId}`);
    // Find next available key
    let idx = 1;
    while (schedules.find(s => s.key === `sched${idx}`)) idx++;
    const key = `sched${idx}`;
    await setDoc(ref, { [key]: selectedTime }, { merge: true });
    setShowModal(false);
    setSelectedTime('');
    fetchSchedules();
  };

  const handleDelete = async (key: string) => {
    const ref = doc(db, `schedules/${userId}/farm/${farmId}/devices/${deviceId}`);
    await updateDoc(ref, { [key]: deleteField() });
    fetchSchedules();
  };

  const handleEdit = async () => {
    if (!editId || !selectedTime) return;
    const ref = doc(db, `schedules/${userId}/farm/${farmId}/devices/${deviceId}`);
    await updateDoc(ref, { [editId]: selectedTime });
    setEditId(null);
    setShowModal(false);
    setSelectedTime('');
    fetchSchedules();
  };

  const openEdit = (key: string, time: string) => {
    setEditId(key);
    setSelectedTime(time);
    setShowModal(true);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Schedule</h2>
        <button
          type="button"
          className="bg-green-600 text-white font-bold px-5 py-2 rounded-lg shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 hover:bg-green-700 active:bg-green-800 text-base"
          style={{ minWidth: '140px' }}
          onClick={() => { setShowModal(true); setEditId(null); setSelectedTime(''); }}
        >
          Add Schedule
        </button>
      </div>
      <table className="min-w-full border">
        <thead>
          <tr className="bg-green-50">
            <th className="py-2 px-4 border-b text-left text-green-800 font-semibold">Time</th>
            <th className="py-2 px-4 border-b text-center text-gray-700 font-semibold">Edit</th>
            <th className="py-2 px-4 border-b text-center text-gray-700 font-semibold">Delete</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map(s => (
            <tr key={s.key} className="text-center bg-white hover:bg-green-50 transition-colors">
              <td className="py-2 px-4 border-b text-green-700 font-mono text-base">{s.time}</td>
              <td className="py-2 px-4 border-b">
                <button className="btn btn-sm btn-secondary text-gray-800 font-medium" onClick={() => openEdit(s.key, s.time)}>Edit</button>
              </td>
              <td className="py-2 px-4 border-b">
                <button className="btn btn-sm btn-danger text-red-700 font-medium" onClick={() => handleDelete(s.key)}>Delete</button>
              </td>
            </tr>
          ))}

          {schedules.length === 0 && (
            <tr><td colSpan={3} className="py-4 text-gray-400 text-center">No schedules yet.</td></tr>
          )}
        </tbody>
      </table>
      <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if (!open) { setEditId(null); setSelectedTime(''); } }}>
        <DialogContent className="bg-white border-2 border-green-400 rounded-2xl shadow-xl p-8">
          <DialogHeader>
            <DialogTitle className="text-green-700 text-xl font-bold mb-4">{editId ? 'Edit Schedule' : 'Add Schedule'}</DialogTitle>
          </DialogHeader>
          <div className="mb-6">
            <div className="mb-2 text-gray-700 font-medium">Select time</div>
            <div className="grid grid-cols-4 gap-2">
              {getTimeOptions().map(t => (
                <button
                  key={t}
                  type="button"
                  className={`px-3 py-2 rounded-lg border-2 font-mono text-base transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2
                    ${selectedTime === t ? 'bg-green-600 text-white border-green-600' : 'bg-white text-green-700 border-green-300 hover:bg-green-50'}`}
                  onClick={() => setSelectedTime(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <button
              className="bg-green-600 hover:bg-green-700 active:bg-green-800 w-full text-white font-bold py-2 rounded-lg shadow-md transition-colors text-base"
              onClick={editId ? handleEdit : handleAdd}
              disabled={!selectedTime}
            >
              {editId ? 'Save Changes' : 'Add'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



// Helper to convert HH:mm to minutes
function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export default TimePickerSchedule;
