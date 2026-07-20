import React from 'react';
import { AwardModal } from './AwardModal';
import { EmailSentVisualizer } from './EmailSentVisualizer';

export const GlobalModals: React.FC = () => {
  return (
    <>
      <AwardModal />
      <EmailSentVisualizer />
    </>
  );
};
