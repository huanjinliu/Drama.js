const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const { createSpinner } = require('nanospinner');

/**
 * 创建一个任务
 * @param {Function} task 任务执行函数
 * @param {string} description 任务描述
 */
// eslint-disable-next-line consistent-return
async function createTask(task, description) {
  const spinner = createSpinner(description).start();
  try {
    const result = await task(spinner);
    spinner.success();

    return result;
  } catch (err) {
    spinner.error({
      text: `${description}\n\n${err.message}`,
    });

    // shell.echo(err);
    shell.exit(1);
  }
}

/**
 * 获取全部示例
 * @param {String} examplePath 示例文件夹项目路径
 * @returns {Array<String>} 示例名列表
 */
function readAllExamples(examplePath = 'example') {
  const exampleDirPath = path.join(__dirname, '../..', examplePath);

  const exampleNames = fs.readdirSync(exampleDirPath).filter((dir) => {
    const examplePath = path.join(exampleDirPath, dir);
    const exampleStat = fs.statSync(examplePath);
    if (!exampleStat.isDirectory()) return false;
    return fs.existsSync(path.join(examplePath, 'index.html'));
  });

  return exampleNames;
}

/**
 * 模板内容注入
 * @param {String} template 模板内容
 * @param {Object} data 注入内容
 * @returns {String} 注入后内容
 */
function injectTemplate(template, data = {}) {
  if (typeof data !== 'object') return template;

  return Object.entries(data).reduce(
    (result, [key, value]) => result.replace(`{% ${key.toString()} %}`, value),
    template
  );
}

module.exports = {
  injectTemplate,
  createTask,
  readAllExamples,
};
