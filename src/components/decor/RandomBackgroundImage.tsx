'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { themeConfig } from '@/config/theme';

/**
 * 从候选图里随机选一张背景图。
 *
 * 必须是客户端组件：随机结果要在浏览器里算，才能保证"每次进入页面"都可能不一样。
 * 服务端渲染阶段先不出图（避免选中的图和客户端不一致导致 hydration 报错），
 * 挂载后选好图立刻淡入，肉眼看不出延迟。
 */
export function RandomBackgroundImage() {
  const { images, imageOpacity, imageBlur } = themeConfig.background;
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (images.length === 0) return;
    // 随机结果只能在挂载后才知道：服务端先渲染"无图"，挂载后再补上，
    // 这样服务端与客户端首次渲染的输出一致，不会触发 hydration 报错。
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 客户端专属渲染的标准写法
    setSrc(images[Math.floor(Math.random() * images.length)] ?? null);
  }, [images]);

  if (images.length === 0 || !src) return null;

  return (
    <Image
      src={src}
      alt=""
      fill
      priority
      sizes="100vw"
      className="object-cover transition-opacity duration-700 ease-idol"
      style={{
        opacity: imageOpacity,
        filter: imageBlur > 0 ? `blur(${imageBlur}px)` : undefined,
        transform: imageBlur > 0 ? 'scale(1.05)' : undefined,
      }}
    />
  );
}
