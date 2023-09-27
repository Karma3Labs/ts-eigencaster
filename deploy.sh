#!/bin/bash

# build a new image
docker build . -t ts-eigencaster

# stop running container and delete it
sudo systemctl stop ts-eigencaster

# start container with new image
sudo systemctl start ts-eigencaster

# clean up old dangling images
docker image prune -f

# tail logs
sudo journalctl -u ts-eigencaster -f -n20
