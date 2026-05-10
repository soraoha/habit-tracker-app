import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';

export type Record = {
  habitId: string;
  date: string;
  completed: boolean;
};

export function useRecords(userId: string | undefined, month?: string) {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    let q = query(collection(db, `users/${userId}/records`));
    if (month) {
      // month = "YYYY-MM"
      q = query(
        collection(db, `users/${userId}/records`),
        where('date', '>=', `${month}-01`),
        where('date', '<=', `${month}-31`)
      );
    }
    const snapshot = await getDocs(q);
    setRecords(snapshot.docs.map((d) => d.data() as Record));
    setLoading(false);
  }, [userId, month]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const toggleRecord = async (habitId: string, date: string, completed: boolean) => {
    if (!userId) return;
    const recordId = `${habitId}_${date}`;
    await setDoc(doc(db, `users/${userId}/records/${recordId}`), {
      habitId,
      date,
      completed,
    });
    await fetchRecords();
  };

  return { records, loading, toggleRecord, refetch: fetchRecords };
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function currentMonth(): string {
  return today().slice(0, 7);
}
