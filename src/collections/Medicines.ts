import type { CollectionConfig } from 'payload'

export const Medicines: CollectionConfig = {
  slug: 'medicines',
  admin: {
    useAsTitle: 'brandName',
    defaultColumns: ['brandName', 'genericName', 'strength', 'formulation', 'category'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user && (user as any).role !== 'patient'),
    update: ({ req: { user } }) => Boolean(user && (user as any).role !== 'patient'),
    delete: ({ req: { user } }) => Boolean(user && ((user as any).role === 'superAdmin' || (user as any).role === 'owner')),
  },
  fields: [
    {
      name: 'brandName',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'genericName',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'category',
      type: 'text',
      index: true,
    },
    {
      name: 'formulation',
      type: 'text',
    },
    {
      name: 'strength',
      type: 'text',
    },
    {
      name: 'defaultFrequency',
      type: 'text',
    },
    {
      name: 'defaultDurationDays',
      type: 'number',
    },
  ],
}
