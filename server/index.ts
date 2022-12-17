import express, { Request, Response } from 'express'
import recommend from '../recommender/eigentrust'
import { getUsers } from './db'
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
	res.send(users)
})

app.listen(PORT, () => {
	console.log(`Magic is happening on port: ${PORT}`)
})