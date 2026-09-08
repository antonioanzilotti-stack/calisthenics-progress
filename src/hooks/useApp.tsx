import {createContext, useContext, useEffect, useState, type ReactNode} from 'react';
import type {AppData} from '../types';
import {initialData, workouts} from '../data/defaults';
import {load, save} from '../storage/store';
import {localIso} from '../utils/trainingPlan';

type ContextValue = {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  clearAll: () => void;
  resetProgram: () => void;
};

const AppContext = createContext<ContextValue | null>(null);

export function AppProvider({children}: {children: ReactNode}) {
  const [data, setData] = useState(load);
  useEffect(() => {
    save(data);
    document.documentElement.dataset.theme = data.preferences.theme;
  }, [data]);

  const clearAll = () => setData(initialData());
  const resetProgram = () => setData(current => ({
    ...current,
    workouts,
    schedule: initialData().schedule,
    plannedDates: {},
    activeSession: null,
    preferences: {...current.preferences, programStartedAt: localIso()},
  }));

  return <AppContext.Provider value={{data, setData, clearAll, resetProgram}}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext)!;
