import { ActionIcon, Text, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFilter } from '@tabler/icons-react';
import { Modal } from '@mantine/core';
import React from 'react';

export default function StudentsFilter() {
  const [opened, { toggle }] = useDisclosure(false);
  return (
    <>
      <Tooltip label='Filter Students' color='gray'>
        <ActionIcon variant='outline' size={33} onClick={toggle}>
          <IconFilter size={'1rem'} />
        </ActionIcon>
      </Tooltip>
      <Modal opened={opened} onClose={toggle} title='Filter'>
        <Text>Filter</Text>
      </Modal>
    </>
  );
}
