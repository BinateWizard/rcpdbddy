import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';

interface TrendsChartProps {
  logs: Array<{
    timestamp: Date | number;
    nitrogen?: number;
    phosphorus?: number;
    potassium?: number;
  }>;
}

export function TrendsChart({ logs }: TrendsChartProps) {
  const data = useMemo(() => {
    // Ensure chronological order (oldest → newest)
    const ordered = [...logs].sort((a, b) => {
      const aTime = typeof a.timestamp === 'number' ? a.timestamp : a.timestamp?.getTime?.() || 0;
      const bTime = typeof b.timestamp === 'number' ? b.timestamp : b.timestamp?.getTime?.() || 0;
      return aTime - bTime;
    });
    const labels = ordered.map((l) => {
      let dateObj: Date;
      if (typeof l.timestamp === 'number') {
        dateObj = new Date(l.timestamp < 1e12 ? l.timestamp * 1000 : l.timestamp);
      } else {
        dateObj = l.timestamp;
      }
      return dateObj.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    });

    return {
      labels,
      datasets: [
        {
          label: 'Nitrogen (mg/kg)',
          data: ordered.map((l) => l.nitrogen ?? null),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.2)',
          tension: 0.3,
          spanGaps: true,
        },
        {
          label: 'Phosphorus (mg/kg)',
          data: ordered.map((l) => l.phosphorus ?? null),
          borderColor: '#7c3aed',
          backgroundColor: 'rgba(124, 58, 237, 0.2)',
          tension: 0.3,
          spanGaps: true,
        },
        {
          label: 'Potassium (mg/kg)',
          data: ordered.map((l) => l.potassium ?? null),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.2)',
          tension: 0.3,
          spanGaps: true,
        },
      ],
    };
  }, [logs]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 750,
    },
    plugins: {
      legend: { position: 'top' as const },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'mg/kg' } },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
  };

  return (
    <div className="ui-chart">
      <Line data={data} options={options} />
    </div>
  );
}
