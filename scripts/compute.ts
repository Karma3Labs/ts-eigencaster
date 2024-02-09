import Recommender from '../recommender'
import { getAllStrategies } from '../recommender/utils'
import { getLogger } from '../logger'

const logger = getLogger("compute");

const main = async () => {
	console.time('Compute')
	const strategies = getAllStrategies()
	for (const { strategy_id, pretrust, localtrust, alpha } of strategies) {
		logger.info(`Recalculating with [${pretrust},${localtrust},${alpha}]`)

		console.time('recalculation')
		const recommender = new Recommender()
		await recommender.recalculate(strategy_id)
		console.timeEnd('recalculation')
		logger.info(`Done recalculating with [${pretrust},${localtrust},${alpha}]`)

	}
	console.timeEnd('Compute')
}

main().then(() => {
	logger.info("Done!")
	process.exit()
})
