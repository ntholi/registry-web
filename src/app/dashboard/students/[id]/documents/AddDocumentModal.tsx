'use client';

import { useState } from 'react';
import {
  Modal,
  Button,
  Stack,
  Group,
  Select,
  Text,
  rem,
  Card,
} from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import { IconUpload, IconX, IconFile } from '@tabler/icons-react';
import { createDocument } from '@/server/documents/actions';
import { uploadDocument } from '@/lib/storage';
import { nanoid } from 'nanoid';

type AddDocumentModalProps = {
  opened: boolean;
  onClose: () => void;
  stdNo: number;
  onSuccess: () => void;
};

const documentTypes = [
  { value: 'transcript', label: 'Transcript' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'id', label: 'ID Document' },
  { value: 'medical', label: 'Medical Certificate' },
  { value: 'other', label: 'Other' },
];

export default function AddDocumentModal({
  opened,
  onClose,
  stdNo,
  onSuccess,
}: AddDocumentModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [type, setType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (files.length === 0) {
      notifications.show({
        title: 'Error',
        message: 'Please select a file to upload',
        color: 'red',
      });
      return;
    }

    try {
      setLoading(true);

      const file = files[0];
      const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const generatedFileName = `${nanoid()}.${ext}`;

      const uploadedPath = await uploadDocument(
        file,
        generatedFileName,
        'documents'
      );

      await createDocument({
        fileName: uploadedPath,
        type: type || undefined,
        stdNo,
      });

      notifications.show({
        title: 'Success',
        message: 'Document uploaded successfully',
        color: 'green',
      });

      setFiles([]);
      setType(null);
      onSuccess();
    } catch (error) {
      console.error('Error uploading document:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to upload document',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (!loading) {
      setFiles([]);
      setType(null);
      onClose();
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title='Upload Document'
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
    >
      <Stack gap='md'>
        <Select
          label='Document Type'
          placeholder='Select document type'
          value={type}
          onChange={setType}
          data={documentTypes}
          clearable
          disabled={loading}
        />

        <Card withBorder>
          <Dropzone
            onDrop={setFiles}
            maxFiles={1}
            accept={[
              MIME_TYPES.pdf,
              MIME_TYPES.png,
              MIME_TYPES.jpeg,
              MIME_TYPES.svg,
              MIME_TYPES.gif,
              MIME_TYPES.webp,
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ]}
            style={{ cursor: 'pointer' }}
            disabled={loading}
          >
            <Group
              justify='center'
              gap='xl'
              mih={220}
              style={{ pointerEvents: 'none' }}
            >
              <Dropzone.Accept>
                <IconUpload stroke={1.5} size={20} />
              </Dropzone.Accept>
              <Dropzone.Reject>
                <IconX
                  style={{
                    width: rem(52),
                    height: rem(52),
                    color: 'var(--mantine-color-red-6)',
                  }}
                  stroke={1.5}
                />
              </Dropzone.Reject>
              <Dropzone.Idle>
                <IconFile
                  style={{
                    width: rem(52),
                    height: rem(52),
                    color: 'var(--mantine-color-dimmed)',
                  }}
                  stroke={1.5}
                />
              </Dropzone.Idle>

              <div>
                <Text size='xl' inline>
                  Drag file here or click to select
                </Text>
                <Text size='sm' c='dimmed' inline mt={7}>
                  Attach one file at a time (PDF, Images, Word documents)
                </Text>
              </div>
            </Group>
          </Dropzone>
        </Card>

        {files.length > 0 && (
          <Text size='sm' c='dimmed'>
            Selected: {files[0].name}
          </Text>
        )}

        <Group justify='flex-end' mt='md'>
          <Button variant='subtle' onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            leftSection={<IconUpload size={16} />}
            onClick={handleSubmit}
            loading={loading}
            disabled={files.length === 0}
          >
            Upload
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
