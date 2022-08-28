#!/usr/bin/env node
const { program } = require('commander');
const shell = require('shelljs');
const addInit = require('./libs/init.js');
const addList = require('./libs/list.js');
const addStart = require('./libs/start.js');

/**
 * 防止exec执行出现乱码
 */
shell.exec('chcp 65001');

/**
 * drama命令行工具基本介绍
 */
program
  .name('drama')
  .description('CLI for easy development and debugging of Drama.js')
  .version('0.1.0', '-v, --version');

addInit(program);
addList(program);
addStart(program);

program.parse(process.argv);
