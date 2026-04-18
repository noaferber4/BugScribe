import type { Template, TemplateField } from '../types';

const SEVERITY_FIELD: TemplateField = {
  id: 'severity',
  label: 'Severity',
  type: 'select',
  required: false,
  options: [
    { label: 'Critical', value: 'critical' },
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' },
  ],
};

const BASE_FIELDS: TemplateField[] = [
  {
    id: 'title',
    label: 'Bug Title',
    type: 'text',
    placeholder: 'Short, descriptive title',
    required: true,
  },
  SEVERITY_FIELD,
  {
    id: 'description',
    label: 'Description',
    type: 'textarea',
    placeholder: 'Describe the bug in detail...',
    required: true,
  },
  {
    id: 'steps_to_reproduce',
    label: 'Steps to Reproduce',
    type: 'textarea',
    placeholder: '1. Go to...\n2. Click on...\n3. Observe...',
    required: true,
  },
  {
    id: 'expected_result',
    label: 'Expected Result',
    type: 'textarea',
    placeholder: 'What should happen?',
    required: true,
  },
  {
    id: 'actual_result',
    label: 'Actual Result',
    type: 'textarea',
    placeholder: 'What actually happened?',
    required: true,
  },
  {
    id: 'environment',
    label: 'Environment',
    type: 'text',
    placeholder: 'e.g., Chrome 120, macOS 14, v2.3.1',
    required: false,
  },
  {
    id: 'logs',
    label: 'Logs / Attachments',
    type: 'file',
    placeholder: 'Attach images, videos, or log files...',
    required: false,
  },
];

export const BUILTIN_TEMPLATES: Template[] = [
  {
    id: 'general-bug',
    name: 'General Bug',
    description: 'Standard bug report for most issues',
    source: 'builtin',
    fields: BASE_FIELDS,
  },
  {
    id: 'ui-visual',
    name: 'UI / Visual Issue',
    description: 'Visual bugs, layout problems, accessibility issues',
    source: 'builtin',
    fields: [
      ...BASE_FIELDS,
      {
        id: 'browser_os',
        label: 'Browser & OS',
        type: 'text',
        placeholder: 'e.g., Chrome 120 on Windows 11',
        required: true,
      },
      {
        id: 'screen_resolution',
        label: 'Screen Resolution',
        type: 'text',
        placeholder: 'e.g., 1920x1080',
        required: false,
      },
      {
        id: 'accessibility_impact',
        label: 'Accessibility Impact',
        type: 'select',
        required: false,
        options: [
          { label: 'None', value: 'none' },
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
        ],
      },
    ],
  },
];
