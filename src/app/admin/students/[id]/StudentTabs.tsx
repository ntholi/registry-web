'use client';

import { Tabs, TabsList, TabsPanel, TabsTab } from '@mantine/core';
import { useEffect, useState } from 'react';
import StudentView from './StudentView';
import AcademicsView from './AcademicsView';
import RegistrationView from './RegistrationView';
import { getStudent } from '@/server/students/actions';
import { getRegistrationRequestsByStudent } from '@/server/registration-requests/actions';

type StudentTabsProps = {
  student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
  showRegistrationTab: boolean;
  registrationRequests: Awaited<
    ReturnType<typeof getRegistrationRequestsByStudent>
  >;
};

export function StudentTabs({
  student,
  showRegistrationTab,
  registrationRequests,
}: StudentTabsProps) {
  const [activeTab, setActiveTab] = useState<string | null>('academics');

  useEffect(() => {
    const savedTab = localStorage.getItem('studentDetailsTab');
    if (savedTab) {
      setActiveTab(savedTab);
    }
  }, []);

  const handleTabChange = (value: string | null) => {
    if (value) {
      setActiveTab(value);
      localStorage.setItem('studentDetailsTab', value);
    }
  };

  return (
    <Tabs
      value={activeTab}
      onChange={handleTabChange}
      variant='outline'
      mt={'xl'}
    >
      <TabsList>
        <TabsTab value='academics'>Academics</TabsTab>
        <TabsTab value='info'>Student</TabsTab>
        {showRegistrationTab && (
          <TabsTab value='registration'>Registration</TabsTab>
        )}
      </TabsList>
      <TabsPanel value='academics' pt={'xl'} p={'sm'}>
        <AcademicsView student={student} showMarks />
      </TabsPanel>
      <TabsPanel value='info' pt={'xl'} p={'sm'}>
        <StudentView student={student} />
      </TabsPanel>
      <TabsPanel value='registration' pt={'xl'} p={'sm'}>
        <RegistrationView registrationRequests={registrationRequests} />
      </TabsPanel>
    </Tabs>
  );
}
