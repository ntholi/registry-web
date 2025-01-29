'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { createSignup } from '@/server/signups/actions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  stdNo: z.string().min(2, {
    message: 'Student number must be at least 2 characters.',
  }),
});

type SignupFormProps = {
  existingSignup?: {
    userId: string;
    name: string;
    stdNo: string;
    message?: string | null;
    createdAt?: number | null;
    updatedAt?: number | null;
  } | null;
  userId: string;
};

export function SignupForm({ existingSignup, userId }: SignupFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: existingSignup?.name || '',
      stdNo: existingSignup?.stdNo || '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      await createSignup({
        ...values,
        userId,
      });
      toast.success('Registration submitted successfully');
      router.refresh();
    } catch (error) {
      toast.error('Failed to submit registration');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormDescription>
                Enter your full name as it appears on your documents
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="stdNo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student Number</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 12345" {...field} />
              </FormControl>
              <FormDescription>
                Enter your student number if you have one
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {existingSignup?.message && (
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm">Status: {existingSignup.message}</p>
          </div>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {existingSignup ? 'Update Registration' : 'Submit Registration'}
        </Button>
      </form>
    </Form>
  );
}
