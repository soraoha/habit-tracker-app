import React, { createContext, useContext, useState } from 'react';

type AddHabitContextType = {
  showAdd: boolean;
  openAdd: () => void;
  closeAdd: () => void;
};

const AddHabitContext = createContext<AddHabitContextType>({
  showAdd: false,
  openAdd: () => {},
  closeAdd: () => {},
});

export function useAddHabit() {
  return useContext(AddHabitContext);
}

export function AddHabitProvider({ children }: { children: React.ReactNode }) {
  const [showAdd, setShowAdd] = useState(false);
  return (
    <AddHabitContext.Provider
      value={{ showAdd, openAdd: () => setShowAdd(true), closeAdd: () => setShowAdd(false) }}
    >
      {children}
    </AddHabitContext.Provider>
  );
}
