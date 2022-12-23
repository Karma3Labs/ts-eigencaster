import express, { Request, Response } from 'express'
import { utils } from 'ethers'
import Recommender from '../recommender/base'

const { isAddress } = utils

const app = express()
const PORT = 8080

export default (recommender: Recommender) => {
	app.get('/suggest_profiles', async (req: Request, res: Response) => {
		if (!req.query.address || !isAddress(req.query.address as string)) {
			res.status(400).send('Invalid address') 
			return
		}
		console.log('Suggesting users for', req.query.address)

		const users = await recommender.recommendUsers(req.query.address as string)
		res.send(users)
	})

	app.get('/suggest_casts', async (req: Request, res: Response) => {
		if (!req.query.address || !isAddress(req.query.address as string)) {
			res.status(400).send('Invalid address') 
			return
		}
		console.log('Suggesting casts for', req.query.address)

		const casts = await recommender.recommendCasts(req.query.address as string)
		res.send(casts)
	})

	app.listen(PORT, async () => {
		recommender = new Recommender()
		await recommender.init()

		console.log(`Magic is happening on port: ${PORT}`)
	})
}