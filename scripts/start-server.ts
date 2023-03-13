import Recommender from '../recommender'
import serve from '../server/index'

const main = async () => {
	const recommender = new Recommender()
	serve(recommender)
}

main()
