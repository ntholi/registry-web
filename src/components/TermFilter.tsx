'use client';

import { findAllTerms } from '@/server/terms/actions';
import {
  ActionIcon,
  Button,
  Modal,
  Select,
  Stack,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFilter } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

interface TermFilterProps {
  onTermChange: (termId: number | null) => void;
  selectedTermId?: number | null;
  label?: string;
  size?: number;
  color?: string;
  variant?: string;
}

type Term = {
  id: number;
  name: string;
  isActive: boolean;
};

export default function TermFilter({
  onTermChange,
  selectedTermId,
  label = 'Filter by term',
  size = 16,
  color = 'blue',
  variant = 'default',
}: TermFilterProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(
    selectedTermId?.toString() || null
  );

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        setLoading(true);
        const allTerms = (await findAllTerms()).items;
        setTerms(allTerms);

        if (!selectedTermId && allTerms.length > 0) {
          const activeTerm = allTerms.find((term) => term.isActive);
          if (activeTerm) {
            setSelectedTerm(activeTerm.id.toString());
            onTermChange(activeTerm.id);
          }
        }
      } catch (error) {
        console.error('Error fetching terms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, [selectedTermId, onTermChange]);

  const handleApplyFilter = () => {
    const termId = selectedTerm ? parseInt(selectedTerm) : null;
    onTermChange(termId);
    close();
  };

  const termOptions = terms.map((term) => ({
    value: term.id.toString(),
    label: term.name + (term.isActive ? ' (Current)' : ''),
  }));

  const currentTerm = terms.find((term) => term.isActive);
  const isCurrentTermSelected =
    currentTerm && selectedTerm === currentTerm.id.toString();
  const buttonVariant = isCurrentTermSelected ? variant : 'white';

  return (
    <>
      <Tooltip label={label}>
        <ActionIcon
          variant={buttonVariant}
          color={color}
          onClick={open}
          size={'input-sm'}
          loading={loading}
        >
          <IconFilter size={size} />
        </ActionIcon>
      </Tooltip>

      <Modal opened={opened} onClose={close} title='Filter by Term' size='sm'>
        <Stack gap='md'>
          <Select
            label='Select Term'
            placeholder='Choose a term'
            data={termOptions}
            value={selectedTerm}
            onChange={setSelectedTerm}
            searchable
            clearable
            allowDeselect
          />

          <Button onClick={handleApplyFilter} fullWidth>
            Apply Filter
          </Button>
        </Stack>
      </Modal>
    </>
  );
}
