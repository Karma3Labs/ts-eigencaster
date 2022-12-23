
import yargs from 'yargs'
import path from 'path'
import fs from 'fs'
import Recommender from '../recommender/base'
import serve from '../server/index'

const main = async () => {
  const argv = yargs
    .scriptName("./scripts/start-server.ts")
    .usage('$0 [args]')
    .option('recommender', {
        alias: 'r',
        describe: 'Recommender file that should be used to generate pretrust and localtrust. The filename should exist in the recommender/ folder',
        type: 'string',
        default: 'followsPretrust',
    }) 
    .help()
    .argv as { recommender: string }

  const filename = path.join(__dirname, '../recommender', argv.recommender + '.js')

  console.log(`Using recomender from ${filename}`)

  if (!fs.existsSync(filename)) {
    console.log('The provided recommender does not exist');
    process.exit()
  }

  const RecommenderClass = (await import(filename)).default
  const recommender = new RecommenderClass() as Recommender

  serve(recommender)
}

main()