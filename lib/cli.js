const path = require('path')

const yargs = require('yargs')
const log = require('fancy-log')
const vfs = require('vinyl-fs')
const through2 = require('through2')
const chalk = require('chalk')
const existsPath = require('path-exists')
const execa = require('execa')
const slugify = require('slugify')
const template = require('gulp-template')

const templates = {
  javascript: path.resolve(__dirname, '../templates/javascript')
}

module.exports = function run (argv) {
  const options = yargs
    .usage('$0 <directory>', 'creates a npm package in the given directory', (yyargs) => {
      yyargs.positional('directory', {
        type: 'string',
        describe: 'directory path to create npm package in'
      })
    })
    .parse(argv)

  const packageName = slugify(path.basename(options.directory))
  vfs
    .src(path.join(templates.javascript, '**', '*'))
    .pipe(template({ packageName }))
    .pipe(throughOperationLogger(options.directory))
    .pipe(vfs.dest(options.directory))
    .on('end', () => {
      execa.sync('npm', ['install'], { stdio: 'inherit', cwd: path.resolve(options.directory) })
    })
}

function throughOperationLogger (directory) {
  return through2.obj((obj, encoding, done) => {
    const fileName = obj.relative
    const relativeDirectory = path.relative(process.cwd(), directory)
    const newFilePath = path.join(relativeDirectory, fileName)
    const operations = {
      create: chalk.cyan('create'),
      overwrite: chalk.yellow('overwrite')
    }
    const operation = existsPath.sync(newFilePath) ? operations.overwrite : operations.create

    log.info(operation, newFilePath)

    done(null, obj)
  })
}
