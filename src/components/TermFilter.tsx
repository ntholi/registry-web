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
import { useAtom } from 'jotai';
import { selectedTermAtom, type Term } from '@/atoms/termAtoms';

interface TermFilterProps {
  onTermChange?: (termId: number | null) => void;
  label?: string;
  size?: number;
  color?: string;
  variant?: string;
}

export default function TermFilter({
  onTermChange,
  label = 'Filter by term',
  size = 16,
  color = 'blue',
  variant = 'default',
}: TermFilterProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTerm, setSelectedTerm] = useAtom(selectedTermAtom);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        setLoading(true);
        const allTerms = (await findAllTerms()).items;
        setTerms(allTerms);

        if (!selectedTerm && allTerms.length > 0) {
          const activeTerm = allTerms.find((term) => term.isActive);
          if (activeTerm) {
            setSelectedTerm(activeTerm.id);
            onTermChange?.(activeTerm.id);
          }
        }
      } catch (error) {
        console.error('Error fetching terms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, [selectedTerm, onTermChange, setSelectedTerm]);

  const handleApplyFilter = () => {
    onTermChange?.(selectedTerm || null);
    close();
  };

  const handleTermSelect = (termId: string | null) => {
    if (termId) {
      setSelectedTerm(parseInt(termId));
    } else {
      setSelectedTerm(null);
    }
  };

  const termOptions = terms.map((term) => ({
    value: term.id.toString(),
    label: term.name + (term.isActive ? ' (Current)' : ''),
  }));

  const currentTerm = terms.find((term) => term.isActive);
  const isCurrentTermSelected = currentTerm && selectedTerm === currentTerm.id;

  return (
    <>
      <Tooltip label={label}>
        <ActionIcon
          variant={loading || isCurrentTermSelected ? variant : 'white'}
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
            value={selectedTerm?.toString() || null}
            onChange={handleTermSelect}
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
