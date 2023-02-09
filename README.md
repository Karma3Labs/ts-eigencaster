Karma3 Labs is building a ranking and reputation infrastructure for web3 using the EigenTrust algorithm. 

## EigenTrust APIs for Farcaster Developers

We’ve created EigenTrust APIs which Farcaster developers can use to create a **ranking and recommendation system** for People, Casts or any other attributes in their respective front-ends/clients/services.

To know more about how EigenTrust algorithm works in the web3 social or Farcaster context, you can read our v1 docs [here.](https://karma3-labs.gitbook.io/karma3labs/eigentrust/example-use-case) Also check out our developer [**tutorial video**](https://drive.google.com/file/u/2/d/1j8fDxdt7CNlk1DH5i7k_3Fth75xfsxOL/view?usp=sharing).

**ts-farcaster** abstracts EigenTrust implementation details away from developers by wrapping the core EigenTrust API with the necessary pre-/post-processing steps, so Farcaster clients don’t have to speak in EigenTrust terms such as local trust, pre-trust, and alpha/epsilon parameters. 

Here’s an overview of key concepts involved in EigenTrust compute rankings, you can also read the [**details on the core concepts**](https://karma3-labs.gitbook.io/karma3labs/eigentrust/core-concepts).

**Pre-trust (or seed) Peers:** These are the profiles you’d like to consider trustworthy. This variable allows for configuring how much trust you place in some or all of the profiles in the network. 

We have created 3 strategies for you to use, you can configure the parameters based on your choice:

1. Pre-trust all profiles equally
2. Pre-trust some trustworthy profiles (eg: First 50 profiles)
3. Pre-trust the profiles you already follow 

**Local trust:** This is the primary input for EigenTrust and lets you decide the trust or reputation link between any two profiles. 

We have created 2 strategies for you to use, you can configure the parameters based on your choice or create a new strategy:

1. Reputation of a profile is dependent on whether you ‘follow’ that profile directly or indirectly.
2. Reputation of a profile is dependent on a linear combination of ‘follow’+ ‘mention’+’recast’+’reply’ 

**Pre-trust Confidence Level (’a’ value):** This value assigns a weight to the pre-trust or seed peers in the output of the ranking. This value can be between 0 and 1. We have set it at 0.8 as default.

**What can you do with our API?**

1. Create your own configurable **Global profile rankings** which can help with identifying most popular as well as potentially sybil profiles. This information can help power your content or feed recommendations for users.
2. Create a **Personalized recommendation system** for People to Follow, Casts and other popular context based on individual social graphs. This can enable more relevant and contextual user-experiences for clients. Our demo front-end ([Eigencaster](https://github.com/Karma3Labs/eigencaster)) showcases this feature. 

# Farcaster Recommender

## Installation

- Pull and run the populated database the from Docker Hub (replace `<pgpass>` with a random password for the `postgres` database user):

  ```sh
  docker pull karma3labs/farcaster_db
  docker run --name farcaster_db --publish 5432:5432 --detach --env POSTGRES_PASSWORD=<pgpass> karma3labs/farcaster_db
  ```
  
- Configure:
  ```sh
  cp -n .env.template .env
  vim .env
  ```
  - Fill the .env file with the database credentials, along with the go-eigentrust API URL.
    - For the Docker container the default database credentials are `postgres`/`<pgpass>` (replace with the password chosen above)
    - For the `EIGENTRUST_API` you can either call the hosted service at `https://api.k3l.io/basic/v1/` or self-host it using [this repo](https://github.com/Karma3Labs/go-eigentrust).

## Running your own Global Profile Ranking and Personalized Recommendation Algorithms

- Pick a pre-trust (seed) strategy from the existing ones or create a new one on the file: `./recommender/strategies/pretrust.ts`. The existing pretrust strategies are:
  | Key | Description |
  | --- | --- |
  | `pretrustAllEqually` (default) | This strategy doesn't pretrust any users. Since this is a non-personalized strategy, the eigentrust API will be called once on the initialization and the recommendation will be the same, no matter which user called the recommendation. |
  | `pretrustSpecificHandles` | This strategy pretrusts only specific and hardcoded handles in the pretrust file (see the pretrustSpecificHandles function). Again, this is a non-personalized strategy, thus the globalTrust will be calculated once and will be the same for each user. |
  | `pretrustFollowersOfHandle` | This strategy pretrusts the followers of the user that requested the recommendation. Since this is a personalized strategy, the Eigentrust globalTrust will be calculated on every request, and will return a different globalTrust for each different user |
- Pick a localtrust strategy from the existing ones or crete a new one on the file: `./recommender/strategies/pretrust.ts`. The existing strategies are:
  | Key | Description |
  | `existingConnections` (default) | This strategy creates a graph of edges with weight 1 from a follower to a followee. |
  | `enhancedConnections` | This strategy calculates the localtrust graph by enhancing the follow edges with mentions, recasts, replies and likes. |
- Run `yarn serve --pretrust <your_strategy>`
- The server will start on port 8080. Call the API by passing as a query param the `fid` or the `address` or the `username` of a given user. Examples:
  ```curl 'http://localhost:8080/suggest?username=dwr'```
  ```curl 'http://localhost:8080/suggest?address=0xea384b570a23e806a38148e87e6177028afdbae5'```
  ```curl 'http://localhost:8080/suggest?fid=1'```

## Generating global trust values in CSV

- For generating all global trust values in a CSV, just run `yarn global-trust`.
- The script will generate a `globaltrust.csv` file in the root directory of the project.
- Feel free to adjust the pre-/local trust strategies using the `-pretrust`/`-localtrust` arguments. Note: Since the EigenTrust calculation will be done once, you should use a pretrust strategy that is not personalized.
- For more info run `yarn global-trust --help`

## Populating the database manually

- Download the [database dump](https://karma3labs.s3.amazonaws.com/farcaster.sql.gz)
- `cat farcaster.sql.gz | gunzip | psql -h localhost -U postgres -W -d farcaster`
