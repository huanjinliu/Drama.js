#!/usr/bin/env node
const { program } = require('commander');
const shell = require('shelljs');
const fs = require('fs');
const path = require('path');

// 反正exec执行出现乱码
shell.exec('chcp 65001');

program
  .name('drama')
  .description('CLI for easy development and debugging of Drama.js')
  .version('0.1.0', '-v, --version');

program
  .command('list')
  .description('Open the collection site with all the examples')
  .action(() => {
    fs.stat(path.join(__dirname, '..', '/example/index.html'), (err) => {
      if (err) {
        shell.echo(`Error: missing entry file (example/index.html) !`);
        return;
      }

      const task = `npx cross-env DRAMA_DEV_PATH=example/index.html rollup --config --watch`;
      if (shell.exec(task).code !== 0) {
        shell.echo(`Error: build error !`);
        shell.exit(1);
      }
    });
  });

program
  .command('start <name>')
  .description('Enter the path to start your example')
  .action((name) => {
    const startPath = path.join(__dirname, '../example', name, 'index.html');
    fs.stat(startPath, (err) => {
      if (err) {
        shell.echo(`Error: No such example named ${name} or missing entry file (index.html) !`);
        return;
      }

      const dramaDevPath = path.relative(path.join(__dirname, '..'), startPath);
      const task = `npx cross-env DRAMA_DEV_PATH=${dramaDevPath} rollup --config --watch`;
      if (shell.exec(task).code !== 0) {
        shell.echo(`Error: ${name} build error !`);
        shell.exit(1);
      }
    });
  });

program.parse(process.argv);
