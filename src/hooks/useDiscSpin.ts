'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePlayer } from '@/providers/PlayerProvider';

/**
 * 唱片旋转。返回一个 ref，挂到要旋转的元素上即可。
 * 元素本身要一直带着旋转动画的 class（别用条件类名开关它，
 * 因为移除动画类会让 transform 立刻弹回 0°）。
 *
 * 两个实现要点：
 *
 * 1. 用 Web Animations API 而不是改 CSS 的 animation-delay：
 *    animation-delay 是相对元素"自身动画起点"的偏移，不是绝对相位 ——
 *    挂载久的元素会多算进 (现在 - 挂载时刻)，刚挂载的没有，两处角度就对不上。
 *    animation.currentTime 则是绝对的时间轴位置，跟元素何时挂载无关。
 *    另外 animation.pause() 会冻结在当前角度，play() 从原地继续。
 *
 * 2. 用回调 ref 而不是普通 ref + useEffect：
 *    收起态的小圆钮和展开态的封面是两个不同节点，切换时 isPlaying 往往没变，
 *    只靠 useEffect(deps) 是不会重跑的，新节点就永远同步不上。
 *    回调 ref 在元素挂载的那一刻触发，正好补上这个时机。
 */
export function useDiscSpin<T extends HTMLElement>() {
  const { isPlaying, getRotationSeconds } = usePlayer();
  const elementRef = useRef<T | null>(null);

  const sync = useCallback(
    (element: T | null) => {
      if (!element) return;

      const attempt = (times: number) => {
        // 读一次计算样式，逼浏览器把样式算完 ——
        // 刚挂载的节点在这一刻可能还没生成动画对象
        void getComputedStyle(element).animationName;

        const animation = element
          .getAnimations()
          .find((item) => 'animationName' in item && item.animationName === 'spin');

        if (!animation) {
          // 拿不到就下一帧再试，试几次还没有就放弃，避免空转
          if (times < 5) requestAnimationFrame(() => attempt(times + 1));
          return;
        }

        // 无限循环的动画可以把 currentTime 设成超过一轮时长的值，会自动取余
        animation.currentTime = getRotationSeconds() * 1000;
        if (isPlaying) animation.play();
        else animation.pause();
      };

      attempt(0);
    },
    [isPlaying, getRotationSeconds],
  );

  /** 元素挂载（或被换成另一个节点）时立刻对齐角度 */
  const ref = useCallback(
    (node: T | null) => {
      elementRef.current = node;
      sync(node);
    },
    [sync],
  );

  /** 播放状态变化时对齐 */
  useEffect(() => {
    sync(elementRef.current);
  }, [sync]);

  return ref;
}
