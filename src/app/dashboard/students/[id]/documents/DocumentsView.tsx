'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStudentDocuments } from '@/server/documents/actions';
import {
  Stack,
  Button,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
  Group,
  ActionIcon,
  Tooltip,
  Paper,
  Box,
} from '@mantine/core';
import { IconPlus, IconDownload, IconTrash } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import { formatDate } from '@/lib/utils';
import AddDocumentModal from './AddDocumentModal';
import DeleteDocumentModal from './DeleteDocumentModal';

type DocumentsViewProps = {
  stdNo: number;
  isActive: boolean;
};

export default function DocumentsView({ stdNo, isActive }: DocumentsViewProps) {
  const { data: session } = useSession();
  const [addModalOpened, setAddModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{
    id: string;
    fileName: string;
  } | null>(null);

  const {
    data: documents,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['student-documents', stdNo],
    queryFn: () => getStudentDocuments(stdNo),
    enabled: isActive,
  });

  const canEdit =
    session?.user?.role === 'admin' || session?.user?.role === 'registry';

  const canView =
    session?.user?.role === 'admin' ||
    session?.user?.role === 'registry' ||
    session?.user?.role === 'finance' ||
    session?.user?.position === 'manager';

  if (!canView) {
    return (
      <Paper p='xl' withBorder>
        <Text c='dimmed'>You do not have permission to view documents.</Text>
      </Paper>
    );
  }

  function handleDownload(fileName: string) {
    const url = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${fileName}`;
    window.open(url, '_blank');
  }

  function handleDelete(id: string, fileName: string) {
    setSelectedDocument({ id, fileName });
    setDeleteModalOpened(true);
  }

  return (
    <Stack gap='md'>
      {canEdit && (
        <Box>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setAddModalOpened(true)}
          >
            Add Document
          </Button>
        </Box>
      )}

      {isLoading ? (
        <Text c='dimmed'>Loading documents...</Text>
      ) : !documents || documents.length === 0 ? (
        <Paper p='xl' withBorder>
          <Text c='dimmed' ta='center'>
            No documents found for this student.
          </Text>
        </Paper>
      ) : (
        <Paper withBorder>
          <Table highlightOnHover>
            <TableThead>
              <TableTr>
                <TableTh>Document Name</TableTh>
                <TableTh>Type</TableTh>
                <TableTh>Upload Date</TableTh>
                <TableTh>Actions</TableTh>
              </TableTr>
            </TableThead>
            <TableTbody>
              {documents.map((doc) => {
                const displayName =
                  doc.fileName.split('/').pop() || doc.fileName;
                return (
                  <TableTr key={doc.id}>
                    <TableTd>{displayName}</TableTd>
                    <TableTd>{doc.type || 'N/A'}</TableTd>
                    <TableTd>{formatDate(doc.createdAt)}</TableTd>
                    <TableTd>
                      <Group gap='xs'>
                        <Tooltip label='Download'>
                          <ActionIcon
                            variant='subtle'
                            color='blue'
                            onClick={() => handleDownload(doc.fileName)}
                          >
                            <IconDownload size={16} />
                          </ActionIcon>
                        </Tooltip>
                        {canEdit && (
                          <Tooltip label='Delete'>
                            <ActionIcon
                              variant='subtle'
                              color='red'
                              onClick={() => handleDelete(doc.id, doc.fileName)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </Group>
                    </TableTd>
                  </TableTr>
                );
              })}
            </TableTbody>
          </Table>
        </Paper>
      )}

      <AddDocumentModal
        opened={addModalOpened}
        onClose={() => setAddModalOpened(false)}
        stdNo={stdNo}
        onSuccess={() => {
          refetch();
          setAddModalOpened(false);
        }}
      />

      {selectedDocument && (
        <DeleteDocumentModal
          opened={deleteModalOpened}
          onClose={() => {
            setDeleteModalOpened(false);
            setSelectedDocument(null);
          }}
          document={selectedDocument}
          onSuccess={() => {
            refetch();
            setDeleteModalOpened(false);
            setSelectedDocument(null);
          }}
        />
      )}
    </Stack>
  );
}
