import Recommender from '../recommender'
import { getAllStrategies } from '../recommender/utils'

const main = async () => {
	const strategies = getAllStrategies()
	for (const { strategy_id, pretrust, localtrust, alpha } of strategies) {
		console.log(`Recalculating with [${pretrust},${localtrust},${alpha}]`)

		console.time('recalculation')
		const recommender = new Recommender()
		await recommender.recalculate(strategy_id)
		console.timeEnd('recalculation')
	}
}

main().then(() => {
	console.log("Done!")
	process.exit()
})
