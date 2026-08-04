import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataStoreContext, useDataStoreValue } from './store/useDataStore';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TeacherRegistration from './pages/TeacherRegistration';
import InterventionForm from './pages/InterventionForm';
import SubjectAnalysis from './pages/SubjectAnalysis';
import StudentAnalysis from './pages/StudentAnalysis';
import TopStudents from './pages/TopStudents';
import RootCauseAnalysis from './pages/RootCauseAnalysis';
import Reports from './pages/Reports';
import PrintAnalysis from './pages/PrintAnalysis';
import PanitiaIntervention from './pages/PanitiaIntervention';
import SystemSettings from './pages/SystemSettings';

export default function App() {
  const store = useDataStoreValue();

  return (
    <DataStoreContext.Provider value={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="teacher-registration" element={<TeacherRegistration />} />
            <Route path="intervention-form" element={<InterventionForm />} />
            <Route path="subject-analysis" element={<SubjectAnalysis />} />
            <Route path="student-analysis" element={<StudentAnalysis />} />
            <Route path="top-students" element={<TopStudents />} />
            <Route path="root-cause-analysis" element={<RootCauseAnalysis />} />
            <Route path="system-settings" element={<SystemSettings />} />
            <Route path="reports" element={<Reports />} />
            <Route path="print-analysis" element={<PrintAnalysis />} />
            <Route path="panitia-intervention" element={<PanitiaIntervention />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataStoreContext.Provider>
  );
}
