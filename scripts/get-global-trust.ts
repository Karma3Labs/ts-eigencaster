import yargs from 'yargs'
import path from 'path'
import fs from 'fs'
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

	const strategy = await db('strategies')
		.where({ pretrust: argv.pretrust, localtrust: argv.localtrust, alpha: argv.alpha })
		.first('id')
	
	if (!strategy) {
		console.log("No strategy found for the given parameters.")
		return
	}

	const globaltrust = await db('globaltrust')
		.select('fid', 'username', 'v')
		.innerJoin('profiles', 'profiles.fid', 'globaltrust.i')
		.where({ strategyId: strategy.id })
		.orderBy('v', 'desc')

	if (globaltrust.length === 0) {
		console.log("No global trust found for the given parameters. Consider running `yarn compute`")
		return
	}

	let csv = 'fid,username,globalTrust\n'
	csv += globaltrust.map((r: any) => `${r.fid},${r.username},${r.v}`).join('\n')
	fs.writeFileSync(path.join(__dirname, '../../globaltrust.csv'), csv)

	console.log('Done! (see globaltrust.csv)')
	process.exit()
}

main()