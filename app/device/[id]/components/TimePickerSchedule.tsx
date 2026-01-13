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
        <h2 className="text-lg font-semibold">Schedule</h2>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setEditId(null); setSelectedTime(''); }}>
          Add Schedule
        </button>
      </div>
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4 border-b">Time</th>
            <th className="py-2 px-4 border-b">Edit</th>
            <th className="py-2 px-4 border-b">Delete</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map(s => (
            <tr key={s.key} className="text-center">
              <td className="py-2 px-4 border-b">{s.time}</td>
              <td className="py-2 px-4 border-b">
                <button className="btn btn-sm btn-secondary" onClick={() => openEdit(s.key, s.time)}>Edit</button>
              </td>
              <td className="py-2 px-4 border-b">
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.key)}>Delete</button>
              </td>
            </tr>
          ))}



          {schedules.length === 0 && (
            <tr><td colSpan={3} className="py-4 text-gray-400">No schedules yet.</td></tr>
          )}
        </tbody>
      </table>
      <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if (!open) { setEditId(null); setSelectedTime(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Schedule' : 'Add Schedule'}</DialogTitle>
          </DialogHeader>
          <select
            className="w-full border rounded p-2 mb-4"
            value={selectedTime}
            onChange={e => setSelectedTime(e.target.value)}
          >
            <option value="">Select time</option>
            {getTimeOptions().map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <DialogFooter>
            <button
              className="btn btn-primary w-full"
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
