// Per-persona dashboard content. These map to the BFR module list and will be
// fleshed out into real screens in later phases; for now they render the shell
// with the modules each persona will get.
import React from 'react';

import { DashboardShell } from './Dashboard';

export function ParentHome() {
  return (
    <DashboardShell
      title="Your athlete"
      modules={[
        { title: 'Linked Athlete', desc: 'Read-only dashboard access (₹20/mo)' },
        { title: 'Attendance', desc: "View your child's attendance", soon: true },
        { title: 'Evaluations & Diary', desc: 'Progress and training diary (read-only)', soon: true },
      ]}
    />
  );
}

export function ExpertHome() {
  return (
    <DashboardShell
      title="Expert workspace"
      modules={[
        { title: 'My Profile', desc: 'Degree, experience, service history, bio' },
        { title: 'Consultations', desc: 'Bookings & marketplace (platform fees apply)', soon: true },
      ]}
    />
  );
}
