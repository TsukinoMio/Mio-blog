'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * 从搜索结果点进文章时，把关键词在正文里标出来，并滚到点中的那一处。
 *
 * 用 ?q=关键词&i=第几处 传参（见 components/layout/SearchBox.tsx）。
 * 页面上会把**所有**出现的地方都标黄，再滚到第 i 处 —— 全标出来的好处是，
 * 即使序号因为某些原因对不齐，读者也能一眼看到文章里所有相关的位置。
 */

const MARK_CLASS = 'search-hit';
const CURRENT_CLASS = 'search-hit-current';

/** 把正文里所有出现关键词的地方套上 <mark>，按出现顺序返回 */
function highlightAll(root: Element, keyword: string): HTMLElement[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      // 代码块和公式跳过 —— 搜索索引里的正文也剔除了这两块，
      // 两边保持一致，"第几处"才对得上
      if (parent.closest('pre, .katex')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

  const marks: HTMLElement[] = [];
  const lowerKeyword = keyword.toLowerCase();

  for (const node of textNodes) {
    const text = node.nodeValue ?? '';
    const lowerText = text.toLowerCase();
    if (!lowerText.includes(lowerKeyword)) continue;

    const fragment = document.createDocumentFragment();
    let cursor = 0;
    let index = lowerText.indexOf(lowerKeyword);

    while (index !== -1) {
      if (index > cursor) {
        fragment.appendChild(document.createTextNode(text.slice(cursor, index)));
      }

      const mark = document.createElement('mark');
      mark.className = MARK_CLASS;
      mark.textContent = text.slice(index, index + keyword.length);
      fragment.appendChild(mark);
      marks.push(mark);

      cursor = index + keyword.length;
      index = lowerText.indexOf(lowerKeyword, cursor);
    }

    if (cursor < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(cursor)));
    }

    node.parentNode?.replaceChild(fragment, node);
  }

  return marks;
}

/** 还原：把 <mark> 换回纯文本，相邻文本节点合并回去 */
function clearHighlights(root: Element) {
  root.querySelectorAll(`mark.${MARK_CLASS}`).forEach((mark) => {
    mark.replaceWith(document.createTextNode(mark.textContent ?? ''));
  });
  root.normalize();
}

export function SearchHighlighter() {
  const params = useSearchParams();
  const keyword = params.get('q')?.trim() ?? '';
  const target = Number.parseInt(params.get('i') ?? '0', 10);

  useEffect(() => {
    if (!keyword) return;

    const root = document.querySelector('.mdx-body');
    if (!root) return;

    const marks = highlightAll(root, keyword);
    if (marks.length === 0) return;

    const index = Math.min(Math.max(Number.isNaN(target) ? 0 : target, 0), marks.length - 1);
    const current = marks[index];
    if (!current) return;

    current.classList.add(CURRENT_CLASS);

    const scrollToCurrent = () => current.scrollIntoView({ block: 'center', behavior: 'smooth' });

    scrollToCurrent();

    // 正文里的图片是懒加载的，加载完会把内容往下顶，
    // 所以等图片都就位之后再校正一次位置
    const images = [...root.querySelectorAll('img')];
    const pending = images.filter((image) => !image.complete);
    let settled = pending.length;
    let timer = 0;

    const onImageSettled = () => {
      settled -= 1;
      if (settled <= 0) timer = window.setTimeout(scrollToCurrent, 80);
    };

    pending.forEach((image) => {
      image.addEventListener('load', onImageSettled, { once: true });
      image.addEventListener('error', onImageSettled, { once: true });
    });

    return () => {
      if (timer) window.clearTimeout(timer);
      pending.forEach((image) => {
        image.removeEventListener('load', onImageSettled);
        image.removeEventListener('error', onImageSettled);
      });
      clearHighlights(root);
    };
  }, [keyword, target]);

  return null;
}
