import {Control} from "react-hook-form"
import { KycFormValues } from './kyc-schema';

export interface CameraCaptureDialogProps{
    open: boolean;
    onOpenChange: (open: boolean) => void
    onCapture: (file: File) => void;
    fileName? : string
}

export interface DocumentUploadFieldProps {
  value?: File;
  onChange: (file?: File) => void;
  allowCamera?: boolean;
  accept?: string; // e.g. "image/*" or "application/pdf"
}


export interface DocumentEntryProps {
  control: Control<KycFormValues>;
  index: number;
  usedTypes: string[];
  onRemove: () => void;
}
