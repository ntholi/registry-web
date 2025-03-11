import { modules } from '@/db/schema';
import {
  ActionIcon,
  Button,
  Modal,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { ReactNode, useState } from 'react';

type Module = typeof modules.$inferSelect;

interface ModulesDialogProps {
  onAddModule: (module: Module) => void;
  modules: Module[];
  isLoading: boolean;
  selectedModules: { id: number }[];
  disabled?: boolean;
  children?: ReactNode;
}

export default function ModulesDialog({
  onAddModule,
  modules: availableModules,
  isLoading,
  selectedModules,
  disabled = false,
  children,
}: ModulesDialogProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredModules = availableModules
    ? availableModules.filter(
        (mod) =>
          mod.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          mod.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  const handleAddModule = (module: Module) => {
    onAddModule(module);
    close();
  };

  return (
    <>
      {children ? (
        <div onClick={disabled ? undefined : open}>{children}</div>
      ) : (
        <ActionIcon onClick={open} disabled={disabled}>
          <IconPlus size='1rem' />
        </ActionIcon>
      )}

      <Modal opened={opened} onClose={close} title='Select Module' size='lg'>
        <Stack>
          <TextInput
            placeholder='Search modules...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftSection={<IconSearch size='1rem' />}
          />

          <Paper style={{ maxHeight: '400px', overflow: 'auto' }}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Code</Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Credits</Table.Th>
                  <Table.Th>Action</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {isLoading ? (
                  <Table.Tr>
                    <Table.Td colSpan={5} align='center'>
                      <Text>Loading modules...</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : filteredModules.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={5} align='center'>
                      <Text c='dimmed'>No modules found</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  filteredModules.map((module) => (
                    <Table.Tr key={module.id}>
                      <Table.Td>{module.code}</Table.Td>
                      <Table.Td>{module.name}</Table.Td>
                      <Table.Td>{module.type}</Table.Td>
                      <Table.Td>{module.credits}</Table.Td>
                      <Table.Td>
                        <Button
                          size='xs'
                          variant='light'
                          onClick={() => handleAddModule(module)}
                          disabled={selectedModules.some(
                            (m) => m.id === module.id,
                          )}
                        >
                          {selectedModules.some((m) => m.id === module.id)
                            ? 'Added'
                            : 'Add'}
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Stack>
      </Modal>
    </>
  );
}
