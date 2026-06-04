import { defaultTemplates, NoteTemplate } from '../../utils/templates';
import { X } from 'lucide-react';

interface TemplateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: NoteTemplate) => void;
}

export function TemplateSelectorModal({ isOpen, onClose, onSelect }: TemplateSelectorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-0 border border-edge rounded-3xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col mx-4">
        <div className="flex items-center justify-between p-6 border-b border-edge bg-surface-1">
          <div>
            <h2 className="text-xl font-display font-semibold text-txt-primary">Create New Note</h2>
            <p className="text-sm text-txt-tertiary">Choose a template to get started quickly.</p>
          </div>
          <button onClick={onClose} className="btn-icon p-2 text-txt-tertiary hover:text-txt-primary">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-0">
          {defaultTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => {
                onSelect(template);
                onClose();
              }}
              className="flex flex-col text-left p-5 rounded-2xl border border-edge hover:border-brand-400 hover:bg-brand-500/5 transition-all group"
            >
              <div className="text-3xl mb-3">{template.icon}</div>
              <h3 className="font-semibold text-txt-primary mb-1 group-hover:text-brand-600 transition-colors">
                {template.name}
              </h3>
              <p className="text-sm text-txt-tertiary">
                {template.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
