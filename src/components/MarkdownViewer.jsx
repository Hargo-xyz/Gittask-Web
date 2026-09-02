// src/components/MarkdownViewer.jsx
'use client';

import { useEffect, useRef } from 'react';

/**
 * Helper Parser Markdown Sederhana & Aman ke HTML bergaya GitHub
 */
function parseMarkdownToHtml(md, owner, repo) {
  if (!md) return '';
  let html = md;

  // 1. Perbaiki URL Gambar Relatif ke Raw GitHub URL
  if (owner && repo) {
    const rawBaseUrl = `[https://raw.githubusercontent.com/$](https://raw.githubusercontent.com/$){owner}/${repo}/main/`;
    html = html.replace(/!\[(.*?)\]\(((?!\/|http).+?)\)/g, (match, alt, src) => {
      const cleanSrc = src.replace(/^\.\//, "");
      return `![${alt}](${rawBaseUrl}${cleanSrc})`;
    });
  }

  // 2. Format Code Blocks (```javascript ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<pre class="bg-[#161b22] border border-[#30363d] p-3 rounded-md overflow-x-auto my-3 font-mono text-xs text-[#e6edf3]"><code>${escapedCode}</code></pre>`;
  });

  // 3. Inline Code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code class="bg-[#161b22] border border-[#30363d] px-1.5 py-0.5 rounded text-xs text-[#79c0ff] font-mono">$1</code>');

  // 4. Headings (#, ##, ###)
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold text-white mt-5 mb-2 pb-1 border-b border-[#30363d]/50">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-base font-bold text-white mt-6 mb-3 pb-1 border-b border-[#30363d]">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-lg font-extrabold text-white mt-4 mb-4 pb-2 border-b border-[#30363d]">$1</h1>');

  // 5. Blockquotes (> quote)
  html = html.replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-[#30363d] pl-3 py-1 my-2 text-[#8b949e] italic">$1</blockquote>');

  // 6. Gambar Markdown ![alt](url) -> Renders Real <img>
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg border border-[#30363d] my-4 shadow-md cursor-pointer hover:opacity-90 transition-opacity md-img-preview" />');

  // 7. Links [text](url)
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#58a6ff] hover:underline font-medium">$1 ↗</a>');

  // 8. Teks Tebal & Miring (**bold**, *italic*)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

  // 9. Horizontal Line (---)
  html = html.replace(/^---$/gim, '<hr class="border-[#30363d] my-5" />');

  // 10. List Items (- item)
  html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li class="ml-4 list-disc text-[#c9d1d9] my-1">$1</li>');

  // 11. Paragraphs
  html = html.split('\n\n').map(p => {
    const trimmed = p.trim();
    if (
      trimmed.startsWith('<h') || 
      trimmed.startsWith('<pre') || 
      trimmed.startsWith('<blockquote') || 
      trimmed.startsWith('<li') || 
      trimmed.startsWith('<hr')
    ) {
      return p;
    }
    return `<p class="my-2 leading-relaxed text-[#c9d1d9]">${p}</p>`;
  }).join('\n');

  return html;
}

export default function MarkdownViewer({ content, owner, repo, setPreviewImage }) {
  const containerRef = useRef(null);
  const parsedHtml = parseMarkdownToHtml(content, owner, repo);

  // Event listener untuk klik gambar (Preview Zoom Modal)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !setPreviewImage) return;

    const handleImgClick = (e) => {
      if (e.target.tagName === 'IMG' && e.target.classList.contains('md-img-preview')) {
        setPreviewImage(e.target.src);
      }
    };

    container.addEventListener('click', handleImgClick);
    return () => container.removeEventListener('click', handleImgClick);
  }, [parsedHtml, setPreviewImage]);

  return (
    <div 
      ref={containerRef}
      className="markdown-body font-sans text-xs select-text leading-relaxed"
      dangerouslySetInnerHTML={{ __html: parsedHtml }}
    />
  );
}