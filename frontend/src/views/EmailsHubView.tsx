import React, { useState, useCallback } from 'react';
import { Mail, Layers } from 'lucide-react';
import { EmailCommunicationsView } from './EmailCommunicationsView';
import { TemplateGallery } from '../components/EmailBuilder/TemplateGallery';
import { TemplateEditor } from '../components/EmailBuilder/TemplateEditor';
import type { EmailTemplate } from '../services/networkService';

export interface EmailsHubViewProps {
  supplierId: string;
  accountName?: string;
  emailAddress?: string;
}

type HubTab = 'inbox' | 'templates';
type TemplateView =
  | { mode: 'gallery'; templates?: EmailTemplate[] }
  | { mode: 'editor'; template?: EmailTemplate };

export const EmailsHubView: React.FC<EmailsHubViewProps> = ({
  supplierId,
  accountName,
  emailAddress,
}) => {
  const [activeHubTab, setActiveHubTab] = useState<HubTab>('inbox');
  const [templateView, setTemplateView] = useState<TemplateView>({ mode: 'gallery' });

  const handleNewTemplate = useCallback(() => {
    setTemplateView({ mode: 'editor', template: undefined });
  }, []);

  const handleEditTemplate = useCallback((tpl: EmailTemplate) => {
    setTemplateView({ mode: 'editor', template: tpl });
  }, []);

  const handleEditorBack = useCallback(() => {
    setTemplateView({ mode: 'gallery' });
  }, []);

  const handleEditorSaved = useCallback((refreshed: EmailTemplate[]) => {
    setTemplateView({ mode: 'gallery', templates: refreshed });
  }, []);

  return (
    <div className="emails-hub-view" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sub-tab bar */}
      <div
        className="emails-hub-tabs"
        style={{
          display: 'flex',
          gap: '4px',
          padding: '12px 16px 0',
          borderBottom: '1px solid hsl(var(--border))',
          background: 'hsl(var(--surface))',
        }}
      >
        <button
          onClick={() => setActiveHubTab('inbox')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            border: 'none',
            borderBottom: activeHubTab === 'inbox' ? '2px solid hsl(var(--primary))' : '2px solid transparent',
            background: 'none',
            color: activeHubTab === 'inbox' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
            cursor: 'pointer',
            fontWeight: activeHubTab === 'inbox' ? 600 : 400,
            fontSize: '0.875rem',
            transition: 'color 0.15s, border-color 0.15s',
          }}
        >
          <Mail size={15} />
          Inbox
        </button>

        <button
          onClick={() => setActiveHubTab('templates')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            border: 'none',
            borderBottom: activeHubTab === 'templates' ? '2px solid hsl(var(--primary))' : '2px solid transparent',
            background: 'none',
            color: activeHubTab === 'templates' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
            cursor: 'pointer',
            fontWeight: activeHubTab === 'templates' ? 600 : 400,
            fontSize: '0.875rem',
            transition: 'color 0.15s, border-color 0.15s',
          }}
        >
          <Layers size={15} />
          Templates
        </button>
      </div>

      {/* Sub-tab content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeHubTab === 'inbox' && (
          <EmailCommunicationsView
            supplierId={supplierId}
            accountName={accountName}
            emailAddress={emailAddress}
          />
        )}

        {activeHubTab === 'templates' && templateView.mode === 'gallery' && (
          <TemplateGallery
            supplierId={supplierId}
            onNew={handleNewTemplate}
            onEdit={handleEditTemplate}
            initialTemplates={templateView.templates}
          />
        )}

        {activeHubTab === 'templates' && templateView.mode === 'editor' && (
          <TemplateEditor
            supplierId={supplierId}
            template={templateView.template}
            onBack={handleEditorBack}
            onSaved={handleEditorSaved}
          />
        )}
      </div>
    </div>
  );
};
