import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Teacher, TeacherSubject, Intervention, StudentPBD } from '../types';
import { loadInitialData, postSheetData } from '../lib/gasApi';

interface AppState {
  teachers: Teacher[];
  subjects: TeacherSubject[];
  interventions: Intervention[];
  studentsPBD: StudentPBD[];
  pbdControl: { pbd1Open: boolean; pbd2Open: boolean };
  isAdmin: boolean;
  isLoadingData: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  loadingProgress: number;
  loadingMessage: string;
  refreshData: (showBlockingLoader?: boolean) => Promise<void>;
  loginAdmin: (user: string, pass: string) => boolean;
  logoutAdmin: () => void;
  addTeacher: (teacher: Teacher) => void;
  updateTeacher: (teacher: Teacher) => void;
  deleteTeacher: (id: string) => void;
  addSubject: (subject: TeacherSubject) => void;
  deleteSubject: (id: string) => void;
  addIntervention: (intervention: Intervention) => void;
  updateIntervention: (intervention: Intervention) => void;
  deleteIntervention: (id: string) => void;
  uploadPBDData: (data: StudentPBD[]) => void;
  deletePBDClass: (pbdType: 'PBD Pertengahan' | 'PBD Akhir', kelas: string) => void;
  updatePbdControl: (control: { pbd1Open: boolean; pbd2Open: boolean }) => void;
}

const STORAGE_KEY = 'saias_data';

const getInitialState = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Ensure new properties exist even if loading from old local storage
      return {
        teachers: parsed.teachers || [],
        subjects: parsed.subjects || [],
        interventions: parsed.interventions || [],
        studentsPBD: parsed.studentsPBD || [],
        pbdControl: parsed.pbdControl || { pbd1Open: true, pbd2Open: true },
      };
    } catch (e) {
      console.error("Error parsing stored data", e);
    }
  }
  return {
    teachers: [],
    subjects: [],
    interventions: [],
    studentsPBD: [],
    pbdControl: { pbd1Open: true, pbd2Open: true },
  };
};

export const useDataStoreValue = () => {
  const [data, setData] = useState<{
    teachers: Teacher[];
    subjects: TeacherSubject[];
    interventions: Intervention[];
    studentsPBD: StudentPBD[];
    pbdControl: { pbd1Open: boolean; pbd2Open: boolean };
  }>(getInitialState);
  
  // Only show blocking loader on initial startup IF there is no local cache
  const [isLoadingData, setIsLoadingData] = useState(() => {
    const initial = getInitialState();
    const hasData = (initial.teachers.length > 0 || initial.interventions.length > 0 || initial.studentsPBD.length > 0);
    return !hasData;
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Memulakan persediaan sistem...");

  const [isAdmin, setIsAdmin] = useState(() => {
    return sessionStorage.getItem('saias_is_admin') === 'true';
  });

  // Helper for non-blocking background database sync
  const runBackgroundSync = useCallback(async (syncFn: () => Promise<any>) => {
    setIsSyncing(true);
    try {
      await syncFn();
      setLastSyncTime(new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error("Background sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Fetch data from Google Apps Script database
  const refreshData = useCallback(async (showBlockingLoader = false) => {
    if (showBlockingLoader) {
      setIsLoadingData(true);
    }
    setIsSyncing(true);
    try {
      const remoteData = await loadInitialData((progress, message) => {
        setLoadingProgress(progress);
        setLoadingMessage(message);
      });

      setData(prev => {
        // Update store with latest database state directly to remain 100% in sync with Google Sheets
        return {
          ...prev,
          teachers: remoteData.teachers,
          subjects: remoteData.subjects,
          interventions: remoteData.interventions,
          studentsPBD: remoteData.studentsPBD
        };
      });
      setLastSyncTime(new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error("Failed to fetch GAS data", err);
    } finally {
      setIsLoadingData(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Save to local storage whenever data changes (instant offline & cache persistence)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const loginAdmin = useCallback((username: string, pass: string) => {
    if (username === 'admin' && pass === '5315') {
      setIsAdmin(true);
      sessionStorage.setItem('saias_is_admin', 'true');
      return true;
    }
    return false;
  }, []);

  const logoutAdmin = useCallback(() => {
    setIsAdmin(false);
    sessionStorage.removeItem('saias_is_admin');
  }, []);

  const addTeacher = useCallback((teacher: Teacher) => {
    setData(prev => ({ ...prev, teachers: [...prev.teachers, teacher] }));
    runBackgroundSync(() => postSheetData('add', 'Teachers', teacher));
  }, [runBackgroundSync]);

  const updateTeacher = useCallback((teacher: Teacher) => {
    setData(prev => ({
      ...prev,
      teachers: prev.teachers.map(t => String(t.id) === String(teacher.id) ? teacher : t)
    }));
    runBackgroundSync(() => postSheetData('update', 'Teachers', teacher));
  }, [runBackgroundSync]);

  const deleteTeacher = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      teachers: prev.teachers.filter(t => String(t.id) !== String(id)),
      subjects: prev.subjects.filter(s => String(s.teacherId) !== String(id)), // cascade
      interventions: prev.interventions.filter(i => String(i.teacherId) !== String(id)) // cascade
    }));
    runBackgroundSync(() => postSheetData('delete', 'Teachers', { id }));
  }, [runBackgroundSync]);

  const addSubject = useCallback((subject: TeacherSubject) => {
    setData(prev => ({ ...prev, subjects: [...prev.subjects, subject] }));
    runBackgroundSync(() => postSheetData('add', 'Subjects', subject));
  }, [runBackgroundSync]);

  const deleteSubject = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => String(s.id) !== String(id))
    }));
    runBackgroundSync(() => postSheetData('delete', 'Subjects', { id }));
  }, [runBackgroundSync]);

  const addIntervention = useCallback((intervention: Intervention) => {
    setData(prev => ({ ...prev, interventions: [...prev.interventions, intervention] }));
    runBackgroundSync(() => postSheetData('add', 'Interventions', intervention));
  }, [runBackgroundSync]);

  const updateIntervention = useCallback((intervention: Intervention) => {
    setData(prev => ({
      ...prev,
      interventions: prev.interventions.map(i => String(i.id) === String(intervention.id) ? intervention : i)
    }));
    runBackgroundSync(() => postSheetData('update', 'Interventions', intervention));
  }, [runBackgroundSync]);

  const deleteIntervention = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      interventions: prev.interventions.filter(i => String(i.id) !== String(id))
    }));
    runBackgroundSync(() => postSheetData('delete', 'Interventions', { id }));
  }, [runBackgroundSync]);

  const uploadPBDData = useCallback((newData: StudentPBD[]) => {
    if (!newData || newData.length === 0) return;

    const newClasses = [...new Set(newData.map(d => d.kelas))];
    const newType = newData[0]?.pbdType;
    
    // Instant Optimistic Cache & State Update
    setData(prev => {
      const prevPBD = prev.studentsPBD || [];
      const filteredOld = prevPBD.filter(
        p => !(p.pbdType === newType && newClasses.includes(p.kelas))
      );
      return {
        ...prev,
        studentsPBD: [...filteredOld, ...newData]
      };
    });

    // Remote sync in background
    runBackgroundSync(async () => {
      for (const kelas of newClasses) {
        await postSheetData('deleteClassPBD', 'PBD_Data', { pbdType: newType, kelas });
        const classData = newData.filter(d => d.kelas === kelas);
        if (classData.length > 0) {
          await postSheetData('addBatch', 'PBD_Data', classData);
        }
      }
    });
  }, [runBackgroundSync]);

  const deletePBDClass = useCallback((pbdType: 'PBD Pertengahan' | 'PBD Akhir', kelas: string) => {
    setData(prev => {
      const prevPBD = prev.studentsPBD || [];
      return {
        ...prev,
        studentsPBD: prevPBD.filter(p => !(p.pbdType === pbdType && p.kelas === kelas))
      };
    });
    
    runBackgroundSync(() => postSheetData('deleteClassPBD', 'PBD_Data', { pbdType, kelas }));
  }, [runBackgroundSync]);

  const updatePbdControl = useCallback((control: { pbd1Open: boolean; pbd2Open: boolean }) => {
    setData(prev => ({ ...prev, pbdControl: control }));
  }, []);

  return {
    ...data,
    isAdmin,
    isLoadingData,
    isSyncing,
    lastSyncTime,
    loadingProgress,
    loadingMessage,
    refreshData,
    loginAdmin,
    logoutAdmin,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    addSubject,
    deleteSubject,
    addIntervention,
    updateIntervention,
    deleteIntervention,
    uploadPBDData,
    deletePBDClass,
    updatePbdControl
  };
};

export const DataStoreContext = createContext<ReturnType<typeof useDataStoreValue> | null>(null);

export const useDataStore = () => {
  const context = useContext(DataStoreContext);
  if (!context) {
    throw new Error('useDataStore must be used within a DataStoreProvider');
  }
  return context;
};
