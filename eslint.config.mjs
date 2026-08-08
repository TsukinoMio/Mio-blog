import coreWebVitals from 'eslint-config-next/core-web-vitals';

const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'next-env.d.ts',
      // ESLint 9 的 flat config 不会自动读 .gitignore，这两个目录得单独写。
      // 不写的话 `eslint .` 会去解析 Obsidian 插件打包好的 main.js（单个 810 KB，
      // 会打印 BABEL deoptimise 警告），以及素材暂存区里的东西 —— 纯属浪费。
      '.obsidian/**',
      'MioSrc/**',
      '.open-next/**',
      '.wrangler/**',
    ],
  },
  ...coreWebVitals,
];

export default config;
