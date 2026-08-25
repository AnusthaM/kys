import {Control} from "react-hook-form"
import { KycFormValue } from './kyc-schema';

export interface CameraCaptureDialogProps{
    open: boolean;
    onOpenChange: (open: boolean) => void
    onCapture: (file: File) => void;
    fileName? : string
}

export interface DocumentUploadFieldProps {
  label: string;
  value?: File;
  onChange: (file?: File) => void;
  allowCamera?: boolean;
  error?: string;
}

export interface DocumentEntryProps {
  control: Control<KycFormValue>;
  index: number;
  usedTypes: string[];
  onRemove: () => void;
}
