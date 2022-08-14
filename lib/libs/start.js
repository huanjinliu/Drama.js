const shell = require('shelljs');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const { createTask, readAllExamples } = require('../utils/index.js');

const __workplace = path.join(__dirname, '../..');

/**
 * 打开具体示例网页
 */
module.exports = (program) => {
  program
    .command('start [name]')
    .description('Enter the path to start your example')
    .action(async (name) => {
      // 跑单一示例服务
      const runExampleServer = (name) => {
        createTask((spinner) => {
          const startPath = path.join(__workplace, 'example', name, 'index.html');
          const stat = fs.statSync(startPath);
          if (stat) {
            const dramaDevPath = path.relative(__workplace, startPath);
            const task = `npx cross-env DRAMA_DEV_PATH=${dramaDevPath} rollup --config --watch`;

            spinner.success();

            if (shell.exec(task).code !== 0) {
              throw Error(`Error: ${name} run error !`);
            }
          }
        }, 'run service');
      };

      // 创建新示例
      const createExample = () => {
        inquirer
          .prompt([
            {
              type: 'input', // 类型
              name: 'exampleName', // 字段名称，在then里可以打印出来
              message: 'new example name:', // 提示信息
            },
          ])
          .then((result) => {
            const task = `drama init ${result.exampleName}`;

            if (shell.exec(task).code === 0) {
              runExampleServer(result.exampleName);
            }
          });
      };

      // 选择示例
      const chooseExample = async () => {
        // 取得所有有效示例
        const exampleNames = await createTask(async () => {
          const exampleDirPath = path.join(__workplace, 'example');

          if (!fs.existsSync(exampleDirPath)) fs.mkdirSync(exampleDirPath);

          return readAllExamples('example');
        }, 'Check existing examples');

        inquirer
          .prompt([
            {
              type: 'list',
              name: 'choice',
              message: 'Choose an existing example:',
              default: exampleNames.length ? 0 : -1,
              choices: [
                ...exampleNames.map((name) => ({ value: name, name })),
                { value: -1, name: 'create new example' },
              ],
            },
          ])
          .then(({ choice }) => {
            if (choice === -1) createExample();
            else runExampleServer(choice);
          });
      };

      if (name) runExampleServer(name);
      else chooseExample();
    });
};
