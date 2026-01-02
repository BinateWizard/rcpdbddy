/**
 * Alert Utilities
 * 
 * Helper functions for alert system operations
 */

import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from 'firebase/firestore';

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertType = 'npk_low' | 'npk_high' | 'device_offline' | 'water_level' | 'anomaly';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  type: AlertType;
  message: string;
  createdAt: Timestamp | null;
  read: boolean;
  acknowledged: boolean;
  [key: string]: unknown;
}

/**
 * Get recent alerts for a field
 */
export async function getRecentAlerts(fieldId: string, maxResults = 10): Promise<Alert[]> {
  try {
    const alertsRef = collection(db, 'alerts', fieldId, 'alerts');
    const q = query(alertsRef, orderBy('createdAt', 'desc'), limit(maxResults));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Alert));
  } catch (error) {
    console.error('Error fetching recent alerts:', error);
    return [];
  }
}

/**
 * Get unacknowledged critical alerts
 */
export async function getCriticalAlerts(fieldId: string): Promise<Alert[]> {
  try {
    const alertsRef = collection(db, 'alerts', fieldId, 'alerts');
    const q = query(
      alertsRef,
      where('severity', '==', 'critical'),
      where('acknowledged', '==', false),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Alert));
  } catch (error) {
    console.error('Error fetching critical alerts:', error);
    return [];
  }
}

/**
 * Get alerts by type
 */
export async function getAlertsByType(fieldId: string, type: AlertType): Promise<Alert[]> {
  try {
    const alertsRef = collection(db, 'alerts', fieldId, 'alerts');
    const q = query(alertsRef, where('type', '==', type), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Alert));
  } catch (error) {
    console.error(`Error fetching ${type} alerts:`, error);
    return [];
  }
}

/**
 * Get alerts for a specific device
 */
export async function getDeviceAlerts(fieldId: string, deviceId: string): Promise<Alert[]> {
  try {
    const alertsRef = collection(db, 'alerts', fieldId, 'alerts');
    const q = query(alertsRef, where('deviceId', '==', deviceId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Alert));
  } catch (error) {
    console.error('Error fetching device alerts:', error);
    return [];
  }
}

/**
 * Get alerts for a specific paddy
 */
export async function getPaddyAlerts(fieldId: string, paddyId: string): Promise<Alert[]> {
  try {
    const alertsRef = collection(db, 'alerts', fieldId, 'alerts');
    const q = query(alertsRef, where('paddyId', '==', paddyId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Alert));
  } catch (error) {
    console.error('Error fetching paddy alerts:', error);
    return [];
  }
}

/**
 * Count alerts by severity and acknowledgement
 */
export async function getAlertStats(fieldId: string) {
  try {
    const alerts = await getRecentAlerts(fieldId, 1000);

    return {
      total: alerts.length,
      critical: alerts.filter((a) => a.severity === 'critical').length,
      warning: alerts.filter((a) => a.severity === 'warning').length,
      info: alerts.filter((a) => a.severity === 'info').length,
      unread: alerts.filter((a) => !a.read).length,
      unacknowledged: alerts.filter((a) => !a.acknowledged).length,
    };
  } catch (error) {
    console.error('Error calculating alert stats:', error);
    return {
      total: 0,
      critical: 0,
      warning: 0,
      info: 0,
      unread: 0,
      unacknowledged: 0,
    };
  }
}

/**
 * Format alert message with detail
 */
export function formatAlertMessage(alert: any): string {
  const parts: string[] = [];

  if (alert.element) {
    parts.push(alert.element.toUpperCase());
  }

  if (alert.value !== undefined && alert.threshold !== undefined) {
    parts.push(`${alert.value.toFixed(1)} (threshold: ${alert.threshold})`);
  }

  if (alert.message) {
    return alert.message;
  }

  return parts.length > 0 ? parts.join(' - ') : alert.type;
}

/**
 * Get color for alert severity
 */
export function getSeverityColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical':
      return '#dc2626'; // red-600
    case 'warning':
      return '#ea580c'; // orange-600
    case 'info':
      return '#2563eb'; // blue-600
  }
}

/**
 * Get background color for alert severity
 */
export function getSeverityBgColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-50 border-red-200';
    case 'warning':
      return 'bg-orange-50 border-orange-200';
    case 'info':
      return 'bg-blue-50 border-blue-200';
  }
}

/**
 * Get text color for alert severity
 */
export function getSeverityTextColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical':
      return 'text-red-700';
    case 'warning':
      return 'text-orange-700';
    case 'info':
      return 'text-blue-700';
  }
}

/**
 * Check if alert should auto-dismiss based on type
 */
export function shouldAutoDismiss(alertType: AlertType): boolean {
  // Device offline alerts should not auto-dismiss
  // NPK threshold violations should not auto-dismiss
  // Only dismiss if conditions improve
  return false;
}

/**
 * Get alert icon emoji
 */
export function getAlertIcon(severity: AlertSeverity, type: AlertType): string {
  if (severity === 'critical') {
    return '🚨';
  }

  switch (type) {
    case 'npk_low':
      return '📉';
    case 'npk_high':
      return '📈';
    case 'device_offline':
      return '📡';
    case 'water_level':
      return '💧';
    case 'anomaly':
      return '⚠️';
    default:
      return '❗';
  }
}

/**
 * Suggested action for alert
 */
export function getSuggestedAction(type: AlertType): string {
  switch (type) {
    case 'npk_low':
      return 'Add fertilizer to increase nutrient levels';
    case 'npk_high':
      return 'Reduce fertilizer application or flush field';
    case 'device_offline':
      return 'Check device connection and power supply';
    case 'water_level':
      return 'Adjust irrigation or check water pump';
    case 'anomaly':
      return 'Review readings for potential sensor malfunction';
    default:
      return 'Take appropriate action';
  }
}
