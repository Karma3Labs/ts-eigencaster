import yargs from 'yargs'
import express, { Request, Response } from 'express'
import { getUsers, db } from './db'
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
		console.log('Suggesting for', req.query.address)

		const suggestions = await recommender.recommend(req.query.address as string)
		const users = await getUsers(suggestions)
		res.send(users)
	})

	//TODO: Implement this endpoint
	app.get('/suggest_casts', async (req: Request, res: Response) => {
		const casts = await db('casts').select().limit(10)
		res.send(casts)
	})

	app.listen(PORT, async () => {
		recommender = new Recommender()
		await recommender.init()

		console.log(`Magic is happening on port: ${PORT}`)
	})
}