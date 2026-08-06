import bash from '@shikijs/langs/bash';
import glsl from '@shikijs/langs/glsl';
import tsx from '@shikijs/langs/tsx';
import materialThemePalenight from '@shikijs/themes/material-theme-palenight';
import type { Element, ElementContent } from 'hast';
import { createHighlighterCoreSync, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import type { ShikiTransformer } from 'shiki/types';

/**
 * 代码高亮用的精简 Shiki 实例。
 *
 * 【为什么不用 rehype-pretty-code + shiki 完整包】
 * rehype-pretty-code 顶部是静态的 `import { getSingletonHighlighter } from 'shiki'`，
 * 而 shiki 主入口会把 200 多种语言语法和全部内置主题都挂进模块图。
 * 实测（esbuild 打包）这条链单独就是 10.15 MB / gzip 1.74 MB，
 * 直接把 Cloudflare Workers 产物顶过了免费版 3 MiB 上限：
 *     Your Worker exceeded the size limit of 3 MiB. [code: 10027]
 * 注意：只覆盖 rehype-pretty-code 的 getHighlighter 选项是**没用**的 —— 那只换掉
 * 运行时用的实例，静态 import 该拖进来的照样拖进来（这一点踩过）。
 * 必须换成 @shikijs/rehype/core，它只接收一个现成的 highlighter，不碰完整包。
 * 换完同一套口径实测是 0.61 MB / gzip 0.11 MB。
 *
 * 【为什么用 JS 正则引擎】
 * Shiki 默认的 Oniguruma 引擎是一份 WASM 二进制，在 Workers 里同样计入脚本体积。
 * JS 引擎是纯 JS 实现，省掉这份 WASM。
 */

/** 必须与 globals.css 里代码块的深色配色相匹配 */
export const SHIKI_THEME = 'material-theme-palenight';

/**
 * 文章里实际用到的代码语言白名单。
 *
 * 【写文章用了新语言时要改这里】
 * 清单外的语言不会让构建失败（下面配了 fallbackLanguage: 'plaintext' 兜底），
 * 但那段代码会**没有配色**。所以加新语言时：
 *   1. 从 '@shikijs/langs/<语言名>' import 进来
 *   2. 加进下面的数组
 * 依赖语法会自动跟着走，不用手动补 —— 例如 glsl 模块 export 的就是 [...c, glsl]，
 * bash 则是 shellscript 的别名。
 */
const LANGS = [glsl, tsx, bash];

/** 构建期每个代码块都会取一次实例，缓存住避免重复初始化语法 */
let cached: HighlighterCore | null = null;

export function getSlimHighlighter(): HighlighterCore {
  cached ??= createHighlighterCoreSync({
    themes: [materialThemePalenight],
    langs: LANGS,
    engine: createJavaScriptRegexEngine(),
  });
  return cached;
}

/**
 * 解析代码围栏后面的 meta 串，取出 ```glsl title="..." 里的标题。
 * 返回值会被合并进 transformer 能读到的 this.options.meta。
 */
export function parseCodeMeta(metaString: string): Record<string, unknown> {
  const title = /title="([^"]*)"/.exec(metaString)?.[1];
  return title ? { title } : {};
}

/**
 * 复刻 rehype-pretty-code 的输出结构，好让 globals.css 里已有的选择器继续生效，
 * 换插件后视觉零变化：
 *   1. 【所有】代码块都包一层 figure[data-rehype-pretty-code-figure]
 *      —— 对应 .mdx-body figure[...] { margin-top: 1.6em }，
 *      只给带标题的包会让其余代码块的上边距变掉
 *   2. title="..." 额外插一个 figcaption[data-rehype-pretty-code-title]
 *      —— 对应 .mdx-body [data-rehype-pretty-code-title] 和它的 + pre 圆角衔接
 *   3. keepBackground: false —— 去掉主题注入的行内背景/前景色，
 *      配色统一交给 .mdx-body pre 控制
 *   4. 去掉 <pre> 上的 title 属性 —— meta 里的 title 会被带成 HTML 属性，
 *      导致鼠标悬停弹出原生 tooltip，原来没有这个行为
 */
export const codeTitleTransformer: ShikiTransformer = {
  name: 'mdx-code-figure',

  pre(node) {
    delete node.properties.style;
    delete node.properties.title;
  },

  root(hast) {
    const title = this.options.meta?.title;
    const hasTitle = typeof title === 'string' && title.length > 0;

    const caption: Element[] = hasTitle
      ? [
          {
            type: 'element',
            tagName: 'figcaption',
            properties: {
              'data-rehype-pretty-code-title': '',
              'data-language': this.options.lang,
            },
            children: [{ type: 'text', value: title }],
          },
        ]
      : [];

    const figure: Element = {
      type: 'element',
      tagName: 'figure',
      properties: { 'data-rehype-pretty-code-figure': '' },
      children: [
        ...caption,
        // 此处只可能是 codeToHast 产出的 <pre> 元素，不含 doctype 之类
        ...(hast.children as ElementContent[]),
      ],
    };

    hast.children = [figure];
  },
};
