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
	if (pretrustStrategy.personalized) {
		console.error(`Pretrust strategy: ${argv.pretrust} is personalized`)
		process.exit(1)
	}

	console.log('Using pretrust strategy:', argv.pretrust)

	if (!ltStrategies[argv.localtrust]) {
		console.error(`Localtrust strategy: ${argv.localtrust} does not exist`)
		process.exit(1)
	}
	const localtrustStrategy = ltStrategies[argv.localtrust]
	console.log('Using localtrust strategy:', argv.localtrust)

	console.log("Calculating recommendation with alpha", argv.alpha)
	const recommender = new Recommender(pretrustStrategy, localtrustStrategy, argv.alpha)
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