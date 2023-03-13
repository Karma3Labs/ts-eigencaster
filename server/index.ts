import express, { Request, Response } from 'express'
import Recommender from '../recommender'
import { getStrategyIdFromQueryParams } from './utils'

const app = express()
const PORT = 8080

export default (recommender: Recommender) => {
	app.get('/rankings', async (req: Request, res: Response) => {
		const limit = req.query.limit ? +req.query.limit : 50
		const offset = req.query.offset ? +req.query.offset : 0
		let strategyId: number

		try {
			strategyId = await getStrategyIdFromQueryParams(req.query)
		}
		catch (e: any) {
			return res.status(400).send(e.message)
		}
		console.log(`Recommending rankings in range [${offset}, ${offset + limit}]`)

		try {
			const globaltrust = await Recommender.getGlobaltrustByStrategyId(strategyId, offset, limit)
			const profiles = globaltrust.map((obj) => {
				return {
					id: obj.i,
					username: obj.username,
					value: obj.v,
					rank: obj.rank
				}
			})

			return res.send(globaltrust)
		} 
		catch (e: any) {
			console.log(`Error in /rankings for strategyId: ${strategyId}`, e)
			return res.status(500).send('Could not get rankings')
		}
	})

	// app.get('/suggest_casts', async (req: Request, res: Response) => {
	// 	try {
	// 		const fid = await getFidFromQueryParams(req.query)
	// 		console.log('Suggesting profiles for fid:', fid)

	// 		const casts = await recommender.recommendCasts(fid, 100)
	// 		res.send(casts)
	// 	}
	// 	catch (e: unknown) {
	// 		if (e instanceof Error) {
	// 			console.log(`[SERVER] ${e.message} for input:`, req.query)
	// 			return res.status(400).send(e.message) //TODO: Parameterize HTTP codes
	// 		}
	// 	}
	// })

	// app.get('/rankings', async (req: Request, res: Response) => {
	// 	try {
	// 		// @ts-ignore
	// 		const limit = +req.query.limit || 100
	// 		// @ts-ignore
	// 		const offset = +req.query.offset || 0
	// 		const pretrustStrategy = await getPretrustFromQueryParams(req.query)
	// 		console.log(offset, limit)

	// 		const ids = await Recommender.getGlobaltrusts(pretrustStrategy, recommender.localtrust, 0.5, recommender.fids, recommender.follows)
	// 		console.log(ids)
	// 		const profiles = await getProfilesFromIds(ids.slice(offset, limit), offset)

	// 		console.log('Calculating rankings for pretrust:', req.query.pretrust, 'and localtrust:', req.query.localtrust)

	// 		res.send(profiles)
	// 	}
	// 	catch (e: unknown) {
	// 		if (e instanceof Error) {
	// 			console.log(`[SERVER] ${e.message} for input:`, req.query)
	// 			return res.status(400).send(e.message) //TODO: Parameterize HTTP codes
	// 		}
	// 	}
	// })

	app.listen(PORT, () => {
		console.log(`[SERVER] Server listening on port ${PORT}`)
	})
}