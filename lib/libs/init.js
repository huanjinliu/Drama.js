const fs = require('fs');
const path = require('path');
const { createTask, injectTemplate } = require('../utils/index.js');

const __workplace = path.join(__dirname, '../..');

/**
 * 初始化一个新的可视化示例
 */
module.exports = (program) => {
  program
    .command('init <name>')
    .description('Use Cli to initiate a new example')
    .action(async (name) => {
      const exampleHtmlPath = path.join(__workplace, 'example', name, 'index.html');

      await createTask(async () => {
        if (fs.existsSync(exampleHtmlPath)) {
          throw Error(`Error: The example already exists, start it with 'drama start ${name}'!`);
        }
        if (!/^[a-z]\w+(-\w+)*$/.test(name)) {
          throw Error(`Error: Please use kebab-case!`);
        }
        const templateHtml = fs.readFileSync(
          path.join(__workplace, `lib/static/example-template.html`)
        );
        const content = templateHtml.toString();
        // 向模板注入内容
        const newContent = injectTemplate(content, { title: name });

        fs.mkdirSync(path.dirname(exampleHtmlPath));

        fs.writeFileSync(exampleHtmlPath, newContent);
      }, 'Initiate a new example');
    });
};
