import express, { Request, Response } from 'express'
import recommend from '../recommender/eigentrust'
import { getUsers, db } from './db'
import { utils } from 'ethers'
const { isAddress } = utils

const app = express()
const PORT = 8080

app.get('/suggest_profiles', async (req: Request, res: Response) => {
	if (!req.query.address || !isAddress(req.query.address as string)) {
		res.status(400).send('Invalid address') ;
		return
	}
	console.log('Suggesting for', req.query.address)

	const suggestions = await recommend(req.query.address as string)
	const users = await getUsers(suggestions.map((s: any) => s[0]));
	console.log('Fetched users', users)
	res.send(users)
})

app.get('/suggest_casts', async (req: Request, res: Response) => {
	// if (!req.query.address || !isAddress(req.query.address as string)) {
	// 	res.status(400).send('Invalid address') ;
	// 	return
	// }
	// console.log('Suggesting for', req.query.address)

	const casts = await db('casts').select().limit(10);
	console.log('Fetched casts', casts)
	res.send(casts)
})


app.listen(PORT, () => {
	console.log(`Magic is happening on port: ${PORT}`)
})