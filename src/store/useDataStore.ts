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
  loadingProgress: number;
  loadingMessage: string;
  refreshData: () => Promise<void>;
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
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Memulakan persediaan sistem...");

  const [isAdmin, setIsAdmin] = useState(() => {
    return sessionStorage.getItem('saias_is_admin') === 'true';
  });

  // Fetch data from Google Apps Script database
  const refreshData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const remoteData = await loadInitialData((progress, message) => {
        setLoadingProgress(progress);
        setLoadingMessage(message);
      });

      setData(prev => {
        // Smart merge / dedup for teachers
        const teachersMap = new Map<string, Teacher>();
        remoteData.teachers.forEach(t => {
          if (t && t.name) teachersMap.set(t.name.toLowerCase().trim(), t);
        });
        (prev.teachers || []).forEach(t => {
          if (t && t.name && !teachersMap.has(t.name.toLowerCase().trim())) {
            teachersMap.set(t.name.toLowerCase().trim(), t);
          }
        });

        // Smart merge / dedup for subjects
        const subjectsMap = new Map<string, TeacherSubject>();
        remoteData.subjects.forEach(s => {
          const key = `${s.teacherId}_${s.kelas}_${s.mataPelajaran}_${s.pbdType}`;
          subjectsMap.set(key, s);
        });
        (prev.subjects || []).forEach(s => {
          const key = `${s.teacherId}_${s.kelas}_${s.mataPelajaran}_${s.pbdType}`;
          if (!subjectsMap.has(key)) {
            subjectsMap.set(key, s);
          }
        });

        // Smart merge / dedup for interventions
        const interventionsMap = new Map<string, Intervention>();
        remoteData.interventions.forEach(i => {
          interventionsMap.set(String(i.id), i);
        });
        (prev.interventions || []).forEach(i => {
          if (!interventionsMap.has(String(i.id))) {
            interventionsMap.set(String(i.id), i);
          }
        });

        // Smart merge / dedup for studentsPBD
        const pbdMap = new Map<string, StudentPBD>();
        remoteData.studentsPBD.forEach(p => {
          const key = `${p.pbdType}_${p.kelas}_${p.nama}`;
          pbdMap.set(key, p);
        });
        (prev.studentsPBD || []).forEach(p => {
          const key = `${p.pbdType}_${p.kelas}_${p.nama}`;
          if (!pbdMap.has(key)) {
            pbdMap.set(key, p);
          }
        });

        return {
          ...prev,
          teachers: Array.from(teachersMap.values()),
          subjects: Array.from(subjectsMap.values()),
          interventions: Array.from(interventionsMap.values()),
          studentsPBD: Array.from(pbdMap.values())
        };
      });
    } catch (err) {
      console.error("Failed to fetch GAS data", err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Save to local storage whenever data changes (as offline fallback)
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
    postSheetData('add', 'Teachers', teacher);
  }, []);

  const updateTeacher = useCallback((teacher: Teacher) => {
    setData(prev => ({
      ...prev,
      teachers: prev.teachers.map(t => String(t.id) === String(teacher.id) ? teacher : t)
    }));
    postSheetData('update', 'Teachers', teacher);
  }, []);

  const deleteTeacher = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      teachers: prev.teachers.filter(t => String(t.id) !== String(id)),
      subjects: prev.subjects.filter(s => String(s.teacherId) !== String(id)), // cascade
      interventions: prev.interventions.filter(i => String(i.teacherId) !== String(id)) // cascade
    }));
    postSheetData('delete', 'Teachers', { id });
  }, []);

  const addSubject = useCallback((subject: TeacherSubject) => {
    setData(prev => ({ ...prev, subjects: [...prev.subjects, subject] }));
    postSheetData('add', 'Subjects', subject);
  }, []);

  const deleteSubject = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => String(s.id) !== String(id))
    }));
    postSheetData('delete', 'Subjects', { id });
  }, []);

  const addIntervention = useCallback((intervention: Intervention) => {
    setData(prev => ({ ...prev, interventions: [...prev.interventions, intervention] }));
    postSheetData('add', 'Interventions', intervention);
  }, []);

  const updateIntervention = useCallback((intervention: Intervention) => {
    setData(prev => ({
      ...prev,
      interventions: prev.interventions.map(i => String(i.id) === String(intervention.id) ? intervention : i)
    }));
    postSheetData('update', 'Interventions', intervention);
  }, []);

  const deleteIntervention = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      interventions: prev.interventions.filter(i => String(i.id) !== String(id))
    }));
    postSheetData('delete', 'Interventions', { id });
  }, []);

  const uploadPBDData = useCallback(async (newData: StudentPBD[]) => {
    if (!newData || newData.length === 0) return;

    const newClasses = [...new Set(newData.map(d => d.kelas))];
    const newType = newData[0]?.pbdType;
    
    // Optimistic update
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

    // Remote sync
    for (const kelas of newClasses) {
      // 1. Delete class data before adding new (replace action)
      await postSheetData('deleteClassPBD', 'PBD_Data', { pbdType: newType, kelas });
      
      const classData = newData.filter(d => d.kelas === kelas);
      if (classData.length > 0) {
        // 2. Add new batch
        await postSheetData('addBatch', 'PBD_Data', classData);
      }
    }
  }, []);

  const deletePBDClass = useCallback((pbdType: 'PBD Pertengahan' | 'PBD Akhir', kelas: string) => {
    setData(prev => {
      const prevPBD = prev.studentsPBD || [];
      return {
        ...prev,
        studentsPBD: prevPBD.filter(p => !(p.pbdType === pbdType && p.kelas === kelas))
      };
    });
    
    postSheetData('deleteClassPBD', 'PBD_Data', { pbdType, kelas });
  }, []);

  const updatePbdControl = useCallback((control: { pbd1Open: boolean; pbd2Open: boolean }) => {
    setData(prev => ({ ...prev, pbdControl: control }));
    // Note: Assuming there is a 'saveControlSettings' action or similar in GAS. 
    // Wait, GAS backend may not have this, so it will only persist locally if offline.
    // If we wanted remote persistence, we'd need another sheet or something. 
    // For now logging it locally / updating state is the instruction.
  }, []);

  return {
    ...data,
    isAdmin,
    isLoadingData,
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
