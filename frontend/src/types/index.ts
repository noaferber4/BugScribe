export type FieldType = 'text' | 'textarea' | 'select' | 'multi-select' | 'file';
export type TemplateSource = 'builtin' | 'custom';
export type InputMode = 'structured' | 'freetext';

export interface FieldOption {
  label: string;
  value: string;
}

export interface TemplateField {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required: boolean;
  options?: FieldOption[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  source: TemplateSource;
  fields: TemplateField[];
  createdAt?: string;
}

export type FormValues = Record<string, string | string[]>;

export interface AnalyzeRequest {
  templateId: string;
  templateName: string;
  fields: TemplateField[];
  formValues?: FormValues;
  freeText?: string;
  mode: InputMode;
}

export interface AnalyzeResponse {
  report: string;
}

export interface CustomTemplatesStore {
  version: 1;
  templates: Template[];
}
