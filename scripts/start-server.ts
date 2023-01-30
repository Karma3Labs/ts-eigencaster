import yargs from 'yargs'
import path from 'path'
import fs from 'fs'
import Recommender from '../recommender'
import serve from '../server/index'
import { strategies as ptStrategies } from '../recommender/strategies/pretrust'
import { strategies as ltStrategies } from '../recommender/strategies/localtrust'

const main = async () => {
	const argv = yargs
		.scriptName("./scripts/start-server.ts")
		.usage('$0 [args]')
		.option('pretrust_strategy', {
			alias: 'p',
			describe: 'Strategy that should be used to generate pretrust. The strategy should exist in recommender/strategies/pretrust.ts file',
			type: 'string',
			default: 'pretrustAllEqually',
		}) 
		.option('localtrust_strategy', {
			alias: 'l',
			describe: 'Strategy that should be used to generate localtrust. The strategy should exist in recommender/strategies/localtrust.ts file',
			type: 'string',
			default: 'enhancedConnections',
		}) 
		.help()
		.argv as { pretrust_strategy: string, localtrust_strategy: string }

	if (!ptStrategies[argv.pretrust_strategy]) {
		console.error(`Pretrust strategy: ${argv.pretrust_strategy} does not exist`)
		process.exit(1)
	}
	const pretrustStrategy = ptStrategies[argv.pretrust_strategy]
	console.log('Using pretrust strategy:', argv.pretrust_strategy)

	if (!ltStrategies[argv.localtrust_strategy]) {
		console.error(`Localtrust strategy: ${argv.localtrust_strategy} does not exist`)
		process.exit(1)
	}
	const localtrustStrategy = ltStrategies[argv.localtrust_strategy]
	console.log('Using localtrust strategy:', argv.localtrust_strategy)

	const recommender = new Recommender()
	serve(recommender, pretrustStrategy, localtrustStrategy)
}

main()
