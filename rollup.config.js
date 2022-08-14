import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import clear from 'rollup-plugin-clear';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript';
import replace from 'rollup-plugin-replace';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import path from 'path';

export default () => {
  const configs = {
    input: 'src/index.ts', // 打包入口
    output: {
      // 打包出口
      file: 'dist/drama.js',
      // umd是兼容amd/cjs/iife的通用打包格式，适合浏览器
      format: 'umd',
      // cdn方式引入时挂载在window上面用的就是这个名字
      name: 'drama',
      // 是否打包sourceMap
      sourcemap: process.env.DRAMA_DEV_PATH !== undefined,
    },
    plugins: [
      // 清除原打包文件
      clear({
        targets: ['dist'],
      }),
      // 否则会报：process is not defined的错
      replace({
        preventAssignment: true,
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
      // 查找和打包node_modules中的第三方模块
      resolve(),
      // 将 CommonJS 转换成 ES2015 模块供 Rollup 处理
      commonjs(),
      // 解析TypeScript
      typescript(),
      // babel配置,编译es6
      babel({
        babelHelpers: 'bundled',
      }),
      // 压缩代码
      terser(),
    ],
  };

  // 如果当前是开发环境开启热更新服务
  if (process.env.DRAMA_DEV_PATH) {
    configs.watch = {
      include: 'src/**',
      clearScreen: true,
    };
    configs.plugins.push(
      // 启动服务器
      serve({
        open: true,
        openPage: path.join('/', process.env.DRAMA_DEV_PATH),
        port: 8080,
        // verbose: false,
      }),
      // 当目录中的文件发生变化时，刷新页面
      livereload({
        watch: ['dist', 'example'],
        verbose: false,
      })
    );
  }

  return configs;
};
