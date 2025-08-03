'use client';

import { Modal, Tabs } from '@mantine/core';
import { useState } from 'react';
import RegistrationRequestForm from './RegistrationRequestForm';
import AcademicsView from '../AcademicsView';
import StructureView from './StructureView';

type Props = {
  opened: boolean;
  onClose: () => void;
  stdNo: number;
};

export default function RegistrationModal({ opened, onClose, stdNo }: Props) {
  const [activeTab, setActiveTab] = useState<string | null>('registration');

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title='Student Registration'
      size='60vw'
      centered
      closeOnEscape
    >
      <Tabs value={activeTab} onChange={setActiveTab} variant='outline'>
        <Tabs.List>
          <Tabs.Tab value='registration'>Registration Request</Tabs.Tab>
          <Tabs.Tab value='academics'>Academic History</Tabs.Tab>
          <Tabs.Tab value='structure'>Program Structure</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value='registration' pt='md'>
          <RegistrationRequestForm stdNo={stdNo} />
        </Tabs.Panel>

        <Tabs.Panel value='academics' pt='md'>
          <AcademicsView
            mih='80vh'
            stdNo={stdNo}
            showMarks
            isActive={activeTab === 'academics'}
          />
        </Tabs.Panel>

        <Tabs.Panel value='structure' pt='md'>
          <StructureView stdNo={stdNo} isActive={activeTab === 'structure'} />
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}
