import express, { Request, Response } from 'express'
import Recommender from '../recommender'
import { getFidFromQueryParams, getStrategyIdFromQueryParams } from './utils'

const app = express()
const PORT = 9080

export default () => {
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
		console.log(`Recommending rankings in range [${offset}, ${offset + limit}] for strategy ${strategyId}`)

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

			return res.send(profiles)
		} 
		catch (e: any) {
			console.log(`Error in /rankings for strategyId: ${strategyId}`, e)
			return res.status(500).send('Could not get rankings')
		}
	})

	app.get('/rankings_count', async (req: Request, res: Response) => {
		let strategyId: number

		try {
			strategyId = await getStrategyIdFromQueryParams(req.query)
		}
		catch (e: any) {
			return res.status(400).send(e.message)
		}
		console.log(`Recommeding rankings count for strategyId: ${strategyId}`)

		try {
			const count = await Recommender.getGlobaltrustLength(strategyId)
			return res.send({ count })
		}
		catch (e: any) {
			console.error(`Error in /rankings_count for strategyId: ${strategyId}`, e)
			res.status(500).send('Could not get rankings count')
		}
	})


	app.get('/ranking_index', async (req: Request, res: Response) => {
		let fid: number, strategyId: number

		try {
			fid = await getFidFromQueryParams(req.query)
			strategyId = await getStrategyIdFromQueryParams(req.query)
		}
		catch (e: any) {
			return res.status(400).send(e.message)
		}
		console.log(`Recommeding ranking index for fid: ${fid} and strategyId: ${strategyId}`)

		try {
			const rank = await Recommender.getRankOfUser(strategyId, fid);
			return res.send({ rank })
		}
		catch (e: any) {
			console.error(`Error in /ranking_index for handle: ${fid} and strategyId: ${strategyId}`, e)
			res.status(500).send('Could not get ranking index')
		}
	})


	app.listen(PORT, () => {
		console.log(`[SERVER] Server listening on port ${PORT}`)
	})
}