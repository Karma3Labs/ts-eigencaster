import express, { Request, Response } from 'express'
import { utils } from 'ethers'
import Recommender from '../recommender/base'
import { getAddress, userExists } from './db'
import { getAddressFromQueryParams } from './utils'

const { isAddress } = utils

const app = express()
const PORT = 8080

export default (recommender: Recommender) => {
	app.get('/suggest_profiles', async (req: Request, res: Response) => {
		try {
			const address = await getAddressFromQueryParams(req.query)
			console.log('Suggesting profiles for', address)

			const users = await recommender.recommendUsers(address)
			res.send(users)
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
			const address = await getAddressFromQueryParams(req.query)
			console.log('Suggesting profiles for', address)

			const casts = await recommender.recommendCasts(address, 100)
			res.send(casts)
		}
		catch (e: unknown) {
			if (e instanceof Error) {
				console.log(`[SERVER] ${e.message} for input:`, req.query)
				return res.status(400).send(e.message) //TODO: Parameterize HTTP codes
			}
		}
	})

	app.listen(PORT, async () => {
		recommender = new Recommender()
		await recommender.init()

		console.log(`Magic is happening on port: ${PORT}`)
	})
}