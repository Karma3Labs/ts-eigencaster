import yargs from 'yargs'
import Recommender from '../recommender'
import serve from '../server/index'
import { strategies as ptStrategies } from '../recommender/strategies/pretrust'
import { strategies as ltStrategies } from '../recommender/strategies/localtrust'

const main = async () => {
	const argv = yargs
		.scriptName("./scripts/start-server.ts")
		.usage('$0 [args]')
		.option('pretrust', {
			alias: 'p',
			describe: 'Strategy that should be used to generate pretrust. The strategy should exist in recommender/strategies/pretrust.ts file',
			type: 'string',
			default: 'pretrustAllEqually',
		}) 
		.option('localtrust', {
			alias: 'l',
			describe: 'Strategy that should be used to generate localtrust. The strategy should exist in recommender/strategies/localtrust.ts file',
			type: 'string',
			default: 'enhancedConnections',
		}) 
		.option('alpha', {
			alias: 'a',
			describe: 'A weight denoting how much the pretrust should affect the final trust',
			type: 'number',
			default: 0.5,
		})
		.help()
		.argv as { pretrust: string, localtrust: string, alpha: number }

	if (!ptStrategies[argv.pretrust]) {
		console.error(`Pretrust strategy: ${argv.pretrust} does not exist`)
		process.exit(1)
	}
	const pretrustStrategy = ptStrategies[argv.pretrust]
	console.log('Using pretrust strategy:', argv.pretrust)

	if (!ltStrategies[argv.localtrust]) {
		console.error(`Localtrust strategy: ${argv.localtrust} does not exist`)
		process.exit(1)
	}
	const localtrustStrategy = ltStrategies[argv.localtrust]
	console.log('Using localtrust strategy:', argv.localtrust)

	const recommender = new Recommender(pretrustStrategy, localtrustStrategy, argv.alpha)
	serve(recommender)
}

main()
