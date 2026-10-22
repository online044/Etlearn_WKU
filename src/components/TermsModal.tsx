import React from 'react';
import LegalPrivacyTermsModal, { LegalModalProps } from './LegalPrivacyTermsModal';

export interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'am';
  initialTab?: 'terms' | 'privacy';
  onAcceptAndClose?: () => void;
}

export default function TermsModal(props: TermsModalProps) {
  return <LegalPrivacyTermsModal {...props} />;
}
