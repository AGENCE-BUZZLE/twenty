import { type BuzzleWorkspaceTemplate } from 'src/engine/core-modules/buzzle-admin/types/buzzle-workspace-template.type';

// Pipeline lead standard pour campagnes Google Ads.
// Convient à artisans, restaurants, prestataires de service :
// tous les métiers où un lead entre par un formulaire LP puis se
// qualifie sur un devis puis se transforme en client signé.

export const leadsGoogleAdsTemplate: BuzzleWorkspaceTemplate = {
  id: 'leads-google-ads',
  name: 'Leads Google Ads',
  description:
    'Pipeline lead standard pour campagne Google Ads avec push OCT automatique sur changement de statut (Devis envoyé → Qualified Lead, Signé → Purchase).',
  version: '1.0.0',
  objects: [
    {
      nameSingular: 'contact',
      namePlural: 'contacts',
      labelSingular: 'Contact',
      labelPlural: 'Contacts',
      icon: 'IconUserPlus',
      description: 'Contacts entrants depuis Google Ads',
      fields: [
        {
          name: 'fullName',
          label: 'Nom',
          type: 'FULL_NAME',
          required: true,
          clientPermission: 'read',
        },
        {
          name: 'phone',
          label: 'Téléphone',
          type: 'PHONE',
          required: true,
          clientPermission: 'read',
        },
        {
          name: 'email',
          label: 'Email',
          type: 'EMAIL',
          clientPermission: 'read',
        },
        {
          name: 'message',
          label: 'Message',
          type: 'TEXT',
          clientPermission: 'read',
        },
        {
          name: 'notes',
          label: 'Notes internes',
          type: 'RICH_TEXT',
          clientPermission: 'update',
        },
        {
          name: 'quoteAmount',
          label: 'Montant du devis',
          type: 'CURRENCY',
          clientPermission: 'update',
        },
        {
          name: 'status',
          label: 'Statut',
          type: 'SELECT',
          required: true,
          clientPermission: 'update',
          options: [
            { label: 'Nouveau', value: 'NEW', color: 'blue', position: 0 },
            { label: 'Devis envoyé', value: 'QUOTED', color: 'purple', position: 1 },
            { label: 'Validé', value: 'VALIDATED', color: 'green', position: 2 },
            { label: 'Annulé', value: 'CANCELLED', color: 'gray', position: 3 },
            { label: 'Hors sujet', value: 'OFF_TOPIC', color: 'red', position: 4 },
          ],
        },
        // Champs cachés - stockés pour OCT, invisibles côté client
        {
          name: 'gclid',
          label: 'Google Click ID',
          type: 'TEXT',
          isHidden: true,
          clientPermission: 'hidden',
        },
        {
          name: 'fbclid',
          label: 'Facebook Click ID',
          type: 'TEXT',
          isHidden: true,
          clientPermission: 'hidden',
        },
        {
          name: 'utmSource',
          label: 'UTM Source',
          type: 'TEXT',
          isHidden: true,
          clientPermission: 'hidden',
        },
        {
          name: 'utmMedium',
          label: 'UTM Medium',
          type: 'TEXT',
          isHidden: true,
          clientPermission: 'hidden',
        },
        {
          name: 'utmCampaign',
          label: 'UTM Campaign',
          type: 'TEXT',
          isHidden: true,
          clientPermission: 'hidden',
        },
        {
          name: 'octPushedAt',
          label: 'OCT pushed at',
          type: 'DATE_TIME',
          isHidden: true,
          clientPermission: 'hidden',
        },
        {
          name: 'octPlatform',
          label: 'OCT platform',
          type: 'TEXT',
          isHidden: true,
          clientPermission: 'hidden',
        },
      ],
    },
  ],
  views: [
    {
      objectNameSingular: 'contact',
      name: 'Mes prospects',
      type: 'table',
      visibleFields: [
        'fullName',
        'phone',
        'email',
        'status',
        'quoteAmount',
        'notes',
      ],
    },
    {
      objectNameSingular: 'contact',
      name: 'Pipeline',
      type: 'kanban',
      groupByFieldName: 'status',
      visibleFields: ['fullName', 'phone', 'quoteAmount'],
    },
  ],
  webhooks: [
    {
      name: 'OCT push to n8n',
      urlTemplate: 'https://n8n.agence-buzzle.com/webhook/crm-oct/{{workspaceId}}',
      operation: 'update',
      objectNameSingular: 'contact',
      onlyIfFieldChanged: 'status',
    },
  ],
  hiddenTwentyObjects: [
    'company',
    'person',
    'opportunity',
    'task',
    'note',
    'pet',
    'rocket',
    'survey',
    'petCareAgreement',
    'employmentHistory',
    'starHistory',
  ],
  roles: [
    {
      name: 'buzzle-client-viewer',
      label: 'Client Buzzle',
      description:
        'Rôle client : voit ses contacts, peut mettre à jour statut/notes/montant, ne peut pas créer ni supprimer.',
      canReadAllRecords: true,
      canUpdateAllRecords: false,
      canDeleteAllRecords: false,
      canCreateRecords: false,
      canAccessSettings: false,
      fieldRestrictions: {
        contact: {
          updatable: ['status', 'notes', 'quoteAmount'],
          visible: [
            'fullName',
            'phone',
            'email',
            'message',
            'notes',
            'quoteAmount',
            'status',
          ],
        },
      },
    },
  ],
};
