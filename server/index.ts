import path from 'path'
import express, { Request, Response } from 'express'
import Recommender from '../recommender'
import { getFidFromQueryParams, getStrategyIdFromQueryParams } from './utils'
const promBundle = require("express-prom-bundle");

// TODO: Fix that ugly thingy
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const app = express()
const PORT = process.env.PORT || 8080

// Add the options to the prometheus middleware most option are for http_request_duration_seconds histogram metric
const metricsMiddleware = promBundle({
	includeMethod: true,
	includePath: true,
	includeStatusCode: true,
	includeUp: true,
	customLabels: { project_name: 'ts-eigencaster', project_type: 'test_metrics_labels' },
});

app.use(metricsMiddleware);


export default () => {
	app.get('/rankings', async (req: Request, res: Response) => {
		console.log(`Getting rankings for ${JSON.stringify(req.query)}`)
		const limit = req.query.limit ? +req.query.limit : 50
		const offset = req.query.offset ? +req.query.offset : 0
		let strategyId: number

		try {
			strategyId = await getStrategyIdFromQueryParams(req.query)
		}
		catch (e: any) {
			console.error(`Error in query ${JSON.stringify(req.query)}`, e.message)
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
					rank: obj.rank,
					following: obj.following,
					followers: obj.followers,
					likes: obj.likes,
					replies: obj.replies,
					recasts: obj.recasts,
					mentions: obj.mentions,
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
		console.log(`Getting rankings_count for ${JSON.stringify(req.query)}`)
		let strategyId: number

		try {
			strategyId = await getStrategyIdFromQueryParams(req.query)
		}
		catch (e: any) {
			console.error(`Error in query ${JSON.stringify(req.query)}`, e.message)
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
		console.log(`Getting ranking_index for ${JSON.stringify(req.query)}`)
		let fid: number, strategyId: number

		try {
			fid = await getFidFromQueryParams(req.query)
			strategyId = await getStrategyIdFromQueryParams(req.query)
		}
		catch (e: any) {
			console.error(`Error in query ${JSON.stringify(req.query)}`, e.message)
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