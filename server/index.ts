import express, { Request, Response } from 'express'
import Recommender from '../recommender'
import { getFidFromQueryParams, getProfilesFromIds, getPretrustFromQueryParams } from './utils'

const app = express()
const PORT = 8080

export default (recommender: Recommender) => {
	app.get('/suggest_profiles', async (req: Request, res: Response) => {
		try {
			const fid = await getFidFromQueryParams(req.query)
			console.log('Suggesting profiles for fid:', fid)

			const profiles = await recommender.recommendProfiles(fid, 100, req.query.includeFollowing == 'on' || false)
			res.send(profiles)
		}
		catch (e: unknown) {
			if (e instanceof Error) {
				console.log(`[SERVER] ${e.message} for input:`, req.query)
				return res.status(400).send(e.message) //TODO: Parameterize HTTP codes
			}
		}
	})

	app.get('/suggest_casts', async (req: Request, res: Response) => {
		try {
			const fid = await getFidFromQueryParams(req.query)
			console.log('Suggesting profiles for fid:', fid)

			const casts = await recommender.recommendCasts(fid, 100)
			res.send(casts)
		}
		catch (e: unknown) {
			if (e instanceof Error) {
				console.log(`[SERVER] ${e.message} for input:`, req.query)
				return res.status(400).send(e.message) //TODO: Parameterize HTTP codes
			}
		}
	})

	app.get('/rankings', async (req: Request, res: Response) => {
		try {
			// @ts-ignore
			const limit = +req.query.limit || 100
			// @ts-ignore
			const offset = +req.query.offset || 0
			const pretrustStrategy = await getPretrustFromQueryParams(req.query)
			console.log(offset, limit)

			const ids = await Recommender.getGlobaltrusts(pretrustStrategy, recommender.localtrust, 0.5, recommender.fids, recommender.follows)
			console.log(ids)
			const profiles = await getProfilesFromIds(ids.slice(offset, limit), offset)

			console.log('Calculating rankings for pretrust:', req.query.pretrust, 'and localtrust:', req.query.localtrust)

			res.send(profiles)
		}
		catch (e: unknown) {
			if (e instanceof Error) {
				console.log(`[SERVER] ${e.message} for input:`, req.query)
				return res.status(400).send(e.message) //TODO: Parameterize HTTP codes
			}
		}
	})

	app.listen(PORT, async () => {
		await recommender.load()
		setTimeout(
			async () => {
				console.log("Recalculating eigentrust")
				await recommender.load()
			},
		1000 * 60 * 10) // 10 minutes

		console.log(`Magic is happening on port: ${PORT}`)
	})
}