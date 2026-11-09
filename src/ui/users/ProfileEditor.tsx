'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { PublicUser } from '@/shared/api-types';
import {
  profileFieldsSchema,
  type ProfileFields,
} from '@/shared/schemas/users';
import { TextField } from '@/ui/primitives/TextField';
import { Button } from '@/ui/primitives/Button';
import { type ProfileBody, usersApi } from './users-api';
import type { RunAction } from './users-queries';

type ProfileEditorProps = {
  user: PublicUser;
  pending: boolean;
  run: RunAction;
  onSaved: () => void;
  onCancel: () => void;
};

export function ProfileEditor({
  user,
  pending,
  run,
  onSaved,
  onCancel,
}: ProfileEditorProps) {
  const form = useForm<ProfileFields>({
    resolver: zodResolver(profileFieldsSchema),
    defaultValues: { fullName: user.fullName, email: user.email },
  });
  const { errors, isDirty, dirtyFields } = form.formState;

  async function save(values: ProfileFields) {
    const body: ProfileBody = {};
    if (dirtyFields.fullName) body.fullName = values.fullName;
    if (dirtyFields.email) body.email = values.email;
    if (await run(() => usersApi.updateProfile(user.id, body))) onSaved();
  }

  return (
    <td colSpan={2}>
      <form
        className="form-actions"
        noValidate
        onSubmit={(event) => void form.handleSubmit(save)(event)}
      >
        <TextField
          label="Full name"
          labelHidden
          size="sm"
          error={errors.fullName?.message}
          {...form.register('fullName')}
        />
        <TextField
          label="Email"
          labelHidden
          size="sm"
          type="email"
          error={errors.email?.message}
          {...form.register('email')}
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          pending={pending}
          disabled={!isDirty}
        >
          Save
        </Button>
        <Button size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </form>
    </td>
  );
}
