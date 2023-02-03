import yargs from 'yargs'
import path from 'path'
import fs from 'fs'
import Recommender from '../recommender'
import { strategies as ptStrategies } from '../recommender/strategies/pretrust'
import { strategies as ltStrategies } from '../recommender/strategies/localtrust'
import { db } from '../server/db'

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
	if (pretrustStrategy.personalized) {
		console.error(`Pretrust strategy: ${argv.pretrust_strategy} is personalized`)
		process.exit(1)
	}

	console.log('Using pretrust strategy:', argv.pretrust_strategy)

	if (!ltStrategies[argv.localtrust_strategy]) {
		console.error(`Localtrust strategy: ${argv.localtrust_strategy} does not exist`)
		process.exit(1)
	}
	const localtrustStrategy = ltStrategies[argv.localtrust_strategy]
	console.log('Using localtrust strategy:', argv.localtrust_strategy)

	console.log("Calculating recommendation")
	const recommender = new Recommender(pretrustStrategy, localtrustStrategy)
	await recommender.load()
	const globalTrust = recommender.globaltrust

	console.log("Populating with usernames")
	const usernames = await db('profiles').select('fid', 'username')
	const usernamesMap: Record<number, string> = {}
	for (const {fid, username} of usernames) {
		usernamesMap[+fid] = username
	}

	console.log("Sorting descending by global trust")
	const gtEntries = globalTrust.map(({ i, v } ) => [i, v])
	gtEntries.sort((a: any, b: any) => b[1] - a[1])

	console.log("Writing to csv")
	let csv = 'fid,username,globalTrust\n'
	csv += gtEntries.map((gt) => `${gt[0]},${usernamesMap[gt[0]]},${gt[1]}`).join('\n')
	fs.writeFileSync(path.join(__dirname, '../../globaltrust.csv'), csv)

	console.log('Done! (see globaltrust.csv)')
	process.exit()
}

main()