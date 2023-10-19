import { config } from '../recommender/config'; // Adjust the path to where your config file is located
import { getDB } from "../utils";

export const db = getDB()

async function updateConfig() {
  const currentDate = new Date();

  for (const [strategy_name, strategy_config] of config.rankingStrategies) {
    // Try to update the record
    const updatedRows = await db('globaltrust_config')
      .where({
        strategy_id: strategy_config.strategy_id,
        date: currentDate
      })
      .update({
        strategy_name,
        pretrust: strategy_config.pretrust,
        localtrust: strategy_config.localtrust,
        alpha: strategy_config.alpha,
      });

    // If no row was updated, insert a new one
    if (!updatedRows) {
      await db('globaltrust_config').insert({
        strategy_id: strategy_config.strategy_id,
        strategy_name,
        pretrust: strategy_config.pretrust,
        localtrust: strategy_config.localtrust,
        alpha: strategy_config.alpha,
        date: currentDate
      });
    }
  }

  console.log('Configurations updated successfully in the database.');
}

function main() {
  updateConfig()
    .then(() => process.exit())
    .catch(error => {
      console.error('Error updating configurations:', error);
      process.exit(1);
    });
}

main();
