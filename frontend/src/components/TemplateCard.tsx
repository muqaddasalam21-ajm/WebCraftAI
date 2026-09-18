import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ArrowRight, Star, Download, Sparkles, ExternalLink } from 'lucide-react';
import { Template } from '../types';
import { Badge } from './Badge';
import { Button } from './Button';
import { Modal } from './Modal';

interface TemplateCardProps {
  template: Template;
  onUseTemplate?: (template: Template) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ template, onUseTemplate }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUseModalOpen, setIsUseModalOpen] = useState(false);

  return (
    <>
      <div className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-brand-300 transition-all duration-300 flex flex-col">
        {/* Visual Preview Container */}
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 border-b border-slate-100">
          <img
            src={template.image}
            alt={template.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3 backdrop-blur-xs">
            <Link
              to={`/dashboard/templates/${template.id}/preview`}
              target="_blank"
              className="px-3.5 py-1.5 bg-white/95 hover:bg-white text-slate-800 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 shadow-sm transition-all hover:scale-105"
            >
              <Eye className="w-3.5 h-3.5" />
              Live Demo
            </Link>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                if (onUseTemplate) onUseTemplate(template);
                else setIsUseModalOpen(true);
              }}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Use Template
            </Button>
          </div>

          {/* Badges on top */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/95 text-slate-800 shadow-sm backdrop-blur-md">
              {template.category}
            </span>
            {template.featured && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-brand-600 to-accent-pink text-white shadow-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Featured
              </span>
            )}
          </div>

          <div className="absolute top-3 right-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold shadow-sm ${
                template.isFree
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-900 text-white'
              }`}
            >
              {template.price}
            </span>
          </div>
        </div>

        {/* Details Content */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="font-bold text-slate-900 text-base group-hover:text-brand-600 transition-colors">
                {template.name}
              </h3>
            </div>
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
              {template.description}
            </p>
          </div>

          <div>
            {/* Rating & Stats */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500 mb-3">
              <div className="flex items-center gap-1 font-semibold text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{template.rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>{(template.downloads ?? template.downloadsCount ?? 0).toLocaleString()} uses</span>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewOpen(true)}
                leftIcon={<Eye className="w-3.5 h-3.5" />}
              >
                Preview
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (onUseTemplate) onUseTemplate(template);
                  else setIsUseModalOpen(true);
                }}
              >
                Use Template
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={template.name}
        subtitle={`${template.category} · ${template.price}`}
        maxWidth="4xl"
      >
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
            <img
              src={template.image}
              alt={template.name}
              className="w-full object-cover max-h-[460px]"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-sm text-slate-600 max-w-xl">{template.description}</p>
              <div className="flex gap-1.5 mt-2">
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="neutral" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={`/dashboard/templates/${template.id}/preview`}
                target="_blank"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 shadow-sm transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Live Demo
              </Link>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setIsPreviewOpen(false);
                  setIsUseModalOpen(true);
                }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Select Template
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Use Template Confirmation Modal */}
      <Modal
        isOpen={isUseModalOpen}
        onClose={() => setIsUseModalOpen(false)}
        title="Template Selected 🎉"
        subtitle={`Ready to customize ${template.name}`}
      >
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 text-brand-600 animate-bounce" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-base">{template.name}</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              In Phase 1, you can launch the **AI Agent** to customize sections, generate pages, and adjust colors for this template!
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsUseModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsUseModalOpen(false);
                window.location.href = '/dashboard/ai-agent';
              }}
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
            >
              Launch in AI Agent
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
