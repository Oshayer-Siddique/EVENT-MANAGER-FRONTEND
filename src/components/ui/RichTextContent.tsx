'use client';

import { useMemo } from 'react';
import DOMPurify from 'dompurify';

interface RichTextContentProps {
  content?: string | null;
  className?: string;
  emptyFallback?: string;
}

export const RichTextContent = ({ content, className, emptyFallback }: RichTextContentProps) => {
  const sanitized = useMemo(() => {
    if (!content) {
      return '';
    }
    return DOMPurify.sanitize(content);
  }, [content]);

  if (!sanitized) {
    if (!emptyFallback) {
      return null;
    }

    const fallbackClassName = className ?? 'text-sm text-slate-500';
    return <p className={fallbackClassName}>{emptyFallback}</p>;
  }

  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitized }} />;
};

export default RichTextContent;
