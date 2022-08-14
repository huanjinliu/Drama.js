const shell = require('shelljs');
const fs = require('fs');
const path = require('path');
const { createTask, injectTemplate, readAllExamples } = require('../utils/index.js');

const __workplace = path.join(__dirname, '../..');

/**
 * 打开示例合集网页
 */
module.exports = (program) => {
  program
    .command('list')
    .description('Open the collection site with all the examples')
    .action(async () => {
      const exampleDirPath = path.join(__workplace, 'example');

      const templateHtml = await createTask(async () => {
        if (!fs.existsSync(exampleDirPath)) fs.mkdirSync(exampleDirPath);

        return fs.readFileSync(path.join(__workplace, `lib/static/list-template.html`));
      }, 'Find/Create the example folder');

      const exampleNames = await createTask(async () => {
        return readAllExamples('example');
      }, 'Check existing examples');

      await createTask(async () => {
        const htmlContent = injectTemplate(templateHtml.toString(), {
          examples: exampleNames.reduce((content, name, index) => {
            const html = fs.readFileSync(path.join(exampleDirPath, name, 'index.html'));
            const titleMatchs = html.toString().match(/<title>(.*)<\/title>/);
            const title = titleMatchs ? titleMatchs[1].trim() : name;
            const linkStr = `<a href="./${name}/index.html" target="_block">${title}</a>`;
            return index === 0 ? linkStr : `${content}\n      ${linkStr}`;
          }, ''),
        });

        fs.writeFileSync(path.join(exampleDirPath, 'index.html'), htmlContent);
      }, 'Generate example collection HTML file');

      const task = `npx cross-env DRAMA_DEV_PATH=example/index.html rollup --config --watch`;

      if (shell.exec(task).code !== 0) {
        shell.echo(`Error: build error !`);
        shell.exit(1);
      }
    });
};
