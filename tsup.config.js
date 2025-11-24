import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'index': 'src/index.js',
    'validator/index': 'src/validator/index.js',
    'editor/monaco/index': 'src/editor/monaco/index.js',
    'editor/wang-prism': 'src/editor/wang-prism.js',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  clean: true,
  outDir: 'dist',
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
});
