import React, { createContext, useContext, useState } from 'react';
import { today } from '@/hooks/useRecords';

type SelectedDateContextType = {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
};

const SelectedDateContext = createContext<SelectedDateContextType | null>(null);

export function SelectedDateProvider({ children }: { children: React.ReactNode }) {
  const [selectedDate, setSelectedDate] = useState(today());
  return (
    <SelectedDateContext.Provider value={{ selectedDate, setSelectedDate }}>
      {children}
    </SelectedDateContext.Provider>
  );
}

export function useSelectedDate() {
  const ctx = useContext(SelectedDateContext);
  if (!ctx) throw new Error('useSelectedDate must be used within SelectedDateProvider');
  return ctx;
}
