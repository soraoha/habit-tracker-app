import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';

export type Habit = {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  order: number;
  createdAt: string;
};

export function useHabits(userId: string | undefined) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHabits = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const snapshot = await getDocs(
      query(collection(db, `users/${userId}/habits`))
    );
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Habit));
    data.sort((a, b) => a.order - b.order);
    setHabits(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const addHabit = async (name: string, color = '#4A90E2') => {
    if (!userId) return;
    await addDoc(collection(db, `users/${userId}/habits`), {
      name,
      color,
      isActive: true,
      order: habits.length,
      createdAt: serverTimestamp(),
    });
    await fetchHabits();
  };

  const updateHabit = async (id: string, updates: Partial<Omit<Habit, 'id'>>) => {
    if (!userId) return;
    await updateDoc(doc(db, `users/${userId}/habits/${id}`), updates);
    await fetchHabits();
  };

  const deleteHabit = async (habitId: string) => {
    if (!userId) return;
    // 関連 records を 400件単位の batch で削除
    const related = await getDocs(
      query(collection(db, `users/${userId}/records`), where('habitId', '==', habitId))
    );
    const allDocs = related.docs;
    for (let i = 0; i < allDocs.length; i += 400) {
      const batch = writeBatch(db);
      allDocs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    await deleteDoc(doc(db, `users/${userId}/habits/${habitId}`));
    await fetchHabits();
  };

  return { habits, loading, addHabit, updateHabit, deleteHabit, refetch: fetchHabits };
}
