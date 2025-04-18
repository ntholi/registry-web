'use client';
import { Button, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

export default function ModuleAssignModal() {
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <>
      <Button size='sm' variant='light' onClick={open}>
        Assign Module
      </Button>
      <Modal title='Assign Module' opened={opened} onClose={close}>
        <div>ModuleAssignModel</div>
      </Modal>
    </>
  );
}
