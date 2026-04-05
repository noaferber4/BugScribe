export type FieldType = 'text' | 'textarea' | 'select' | 'multi-select' | 'file';
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

export type FormValues = Record<string, string | string[]>;

export interface AnalyzeRequest {
  templateId: string;
  templateName: string;
  fields: TemplateField[];
  formValues?: FormValues;
  freeText?: string;
  mode: InputMode;
}
