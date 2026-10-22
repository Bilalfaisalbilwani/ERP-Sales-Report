import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ReportS1 } from './pages/sales/ReportS1';
import { ReportS2 } from './pages/sales/ReportS2';
import { ReportS3 } from './pages/sales/ReportS3';
import { ReportS4 } from './pages/sales/ReportS4';
import { ReportS5 } from './pages/sales/ReportS5';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/sales/s1" replace />} />
          <Route path="sales" element={<Navigate to="/sales/s1" replace />} />
          <Route path="sales/s1" element={<ReportS1 />} />
          <Route path="sales/s2" element={<ReportS2 />} />
          <Route path="sales/s3" element={<ReportS3 />} />
          <Route path="sales/s4" element={<ReportS4 />} />
          <Route path="sales/s5" element={<ReportS5 />} />
          <Route path="*" element={<Navigate to="/sales/s1" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
