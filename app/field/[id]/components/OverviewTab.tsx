'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getVarietyByName } from '@/lib/utils/varietyHelpers';
import { 
  getDaysSincePlanting, 
  getCurrentStage, 
  getExpectedHarvestDate, 
  getGrowthProgress 
} from '@/lib/utils/stageCalculator';
import { VARIETY_ACTIVITY_TRIGGERS } from '@/lib/data/activityTriggers';
import { PRE_PLANTING_ACTIVITIES } from '@/lib/data/activities';

// Helper function to sanitize stage names for Firebase paths
const sanitizeStageName = (stageName: string) => {
  return stageName.replace(/\//g, '-').replace(/\s+/g, '-').toLowerCase();
};

interface OverviewTabProps {
  field: any;
  paddies: any[];
}

export function OverviewTab({ field, paddies }: OverviewTabProps) {
  const { user } = useAuth();
  const [completedTasks, setCompletedTasks] = useState<{ [key: string]: boolean }>({});
  const [loadingTasks, setLoadingTasks] = useState(true);

  if (!field) return null;

  const variety = getVarietyByName(field.riceVariety);
  
  if (!variety) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <p className="text-red-600">Rice variety data not found</p>
      </div>
    );
  }
  
  const daysSincePlanting = getDaysSincePlanting(field.startDay);
  const plantingMethod = field.plantingMethod || 'transplant';
  const currentStage = getCurrentStage(variety, daysSincePlanting);
  const expectedHarvest = getExpectedHarvestDate(field.startDay, variety);
  const progress = getGrowthProgress(variety, daysSincePlanting);

  const prePlantingActivities = plantingMethod === 'transplant' 
    ? PRE_PLANTING_ACTIVITIES.map(activity => ({
        ...activity,
        day: activity.day,
        _isPrePlanting: true
      }))
    : [];

  const regularActivities = variety.activities
    .filter(activity => 
      activity.day >= daysSincePlanting && 
      activity.day <= (currentStage?.endDay || daysSincePlanting + 7)
    )
    .sort((a, b) => a.day - b.day);

  const allActivities = [
    ...(plantingMethod === 'transplant' ? prePlantingActivities : []),
    ...regularActivities
  ].sort((a, b) => a.day - b.day);

  const currentAndUpcomingActivities = allActivities.filter(activity => {
    const isPrePlanting = (activity as any)._isPrePlanting;
    
    if (isPrePlanting) {
      return true;
    } else {
      return activity.day >= daysSincePlanting && 
             activity.day <= (currentStage?.endDay || daysSincePlanting + 7);
    }
  }).sort((a, b) => a.day - b.day);

  const varietyTriggers = VARIETY_ACTIVITY_TRIGGERS[field.riceVariety] || [];
  const currentTriggers = varietyTriggers.filter(t => t.stage === currentStage?.name);

  useEffect(() => {
    const loadCompletedTasks = async () => {
      if (!user || !field.id || !currentStage) {
        setLoadingTasks(false);
        return;
      }
      
      try {
        const sanitizedStageName = sanitizeStageName(currentStage.name);
        const tasksPath = `users/${user.uid}/fields/${field.id}/tasks/${sanitizedStageName}`;
        console.log('Loading tasks from:', tasksPath);
        const tasksRef = doc(db, 'users', user.uid, 'fields', field.id, 'tasks', sanitizedStageName);
        const tasksSnap = await getDoc(tasksRef);
        
        if (tasksSnap.exists()) {
          console.log('Tasks loaded successfully');
          setCompletedTasks(tasksSnap.data().completed || {});
        } else {
          console.log('No existing tasks document found (this is normal for first time)');
        }
      } catch (error: any) {
        console.error('Error loading tasks:', error);
        console.error('Error code:', error?.code);
        if (error?.code === 'permission-denied') {
          console.error('PERMISSION DENIED: Check Firestore rules for tasks subcollection');
        }
      } finally {
        setLoadingTasks(false);
      }
    };

    loadCompletedTasks();
  }, [user, field.id, currentStage?.name]);

  const toggleTask = async (taskKey: string) => {
    if (!user || !field.id || !currentStage) return;

    const newCompletedTasks = {
      ...completedTasks,
      [taskKey]: !completedTasks[taskKey]
    };

    setCompletedTasks(newCompletedTasks);

    try {
      const sanitizedStageName = sanitizeStageName(currentStage.name);
      const tasksRef = doc(db, 'users', user.uid, 'fields', field.id, 'tasks', sanitizedStageName);
      await setDoc(tasksRef, {
        completed: newCompletedTasks,
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving task:', error);
      setCompletedTasks(completedTasks);
    }
  };

  return (
    <div className="space-y-6">
      {/* Growth Progress Bar */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Growth Progress</h2>
          <div className="text-right">
            <p className="text-sm text-gray-600">Expected Harvest</p>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(expectedHarvest).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="mb-2">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <div className="text-right">
            <p className="text-lg font-bold text-green-600">
              {daysSincePlanting} / {variety.maturityDays.max || 130}
            </p>
            <p className="text-xs text-gray-500">days</p>
          </div>
        </div>

        {currentStage && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse" />
              <h3 className="font-semibold text-green-900">Current Stage: {currentStage.name}</h3>
            </div>
            <p className="text-sm text-green-800">
              Day {currentStage.startDay} - {currentStage.endDay} of growth cycle
            </p>
          </div>
        )}
      </div>

      {/* Activities & Tasks */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Activities & Tasks</h2>
        
        {currentTriggers.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Variety-Specific Notes</h3>
            <div className="space-y-2">
              {currentTriggers.map((trigger, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    trigger.type === 'warning' ? 'bg-red-50 border-red-200' :
                    trigger.type === 'precaution' ? 'bg-yellow-50 border-yellow-200' :
                    trigger.type === 'optional' ? 'bg-blue-50 border-blue-200' :
                    'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">
                      {trigger.type === 'warning' ? '⚠️' :
                       trigger.type === 'precaution' ? '⚡' :
                       trigger.type === 'optional' ? '💡' : '👀'}
                    </span>
                    <p className="text-sm text-gray-800">{trigger.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentAndUpcomingActivities.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                {daysSincePlanting < 0 ? 'Pre-Planting & Upcoming Activities' : 
                 daysSincePlanting === 0 ? 'Today & Upcoming Activities' :
                 'Activities & Tasks'}
              </h3>
              <span className="text-xs text-gray-500">
                {Object.values(completedTasks).filter(Boolean).length} / {currentAndUpcomingActivities.length} completed
              </span>
            </div>
            {currentAndUpcomingActivities.map((activity, index) => {
              const taskKey = `day-${activity.day}-${index}`;
              const isCompleted = Boolean(completedTasks[taskKey]);
              const isPrePlanting = (activity as any)._isPrePlanting;
              const daysDiff = activity.day - daysSincePlanting;
              const isPast = daysDiff < 0;
              const isToday = daysDiff === 0;
              
              const displayDay = isPrePlanting 
                ? `${Math.abs(activity.day)} days before transplant`
                : activity.day;
              
              return (
                <div 
                  key={index} 
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
                    isCompleted 
                      ? 'bg-green-50 hover:bg-green-100 border border-green-200' 
                      : isToday 
                      ? 'bg-yellow-50 hover:bg-yellow-100 border border-yellow-300'
                      : isPrePlanting
                      ? 'bg-purple-50 hover:bg-purple-100 border border-purple-200'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => !loadingTasks && toggleTask(taskKey)}
                >
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={() => toggleTask(taskKey)}
                    onClick={(e) => e.stopPropagation()}
                    disabled={loadingTasks}
                    className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500 cursor-pointer disabled:opacity-50"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        isToday ? 'bg-yellow-200 text-yellow-900' :
                        isPast ? 'bg-red-100 text-red-700' :
                        isPrePlanting && isPast ? 'bg-purple-100 text-purple-700' :
                        isPrePlanting ? 'bg-purple-200 text-purple-900' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {isToday ? 'TODAY' : 
                         isPrePlanting && isPast ? `${displayDay} (completed)` :
                         isPrePlanting ? displayDay :
                         isPast ? `Day ${activity.day} (${Math.abs(daysDiff)} days ago)` : 
                         `Day ${activity.day} (in ${daysDiff} days)`}
                      </span>
                      {activity.type && (
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700 capitalize">
                          {activity.type.replace('-', ' ')}
                        </span>
                      )}
                      {isPrePlanting && (
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                          Pre-Planting
                        </span>
                      )}
                    </div>
                    <p className={`font-medium ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                      {activity.action}
                    </p>
                    <div className="mt-2 space-y-1">
                      {activity.water && (
                        <p className={`text-sm ${isCompleted ? 'text-gray-400' : 'text-blue-700'}`}>
                          💧 {activity.water}
                        </p>
                      )}
                      {activity.fertilizer && (
                        <p className={`text-sm ${isCompleted ? 'text-gray-400' : 'text-green-700'}`}>
                          🌾 {activity.fertilizer}
                        </p>
                      )}
                      {activity.notes && (
                        <p className={`text-sm ${isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                          ℹ️ {activity.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No upcoming activities</p>
        )}
      </div>

      {/* Growth Stages */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Growth Stages</h2>
        <div className="space-y-2">
          {variety?.growthStages?.map((stage, index) => {
            const isPassed = daysSincePlanting > stage.endDay;
            const isCurrent = daysSincePlanting >= stage.startDay && daysSincePlanting <= stage.endDay;
            
            return (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  isCurrent ? 'bg-green-50 border-green-300' :
                  isPassed ? 'bg-gray-50 border-gray-200' :
                  'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isPassed ? 'bg-green-600' :
                      isCurrent ? 'bg-green-600 animate-pulse' :
                      'bg-gray-300'
                    }`}
                  />
                  <span className={`font-medium ${
                    isCurrent ? 'text-green-900' : 'text-gray-900'
                  }`}>
                    {stage.name}
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  {stage.startDay}-{stage.endDay} days
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
