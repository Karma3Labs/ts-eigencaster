#!/bin/bash
sudo systemctl stop ts-eigencaster
docker container rm ts-eigencaster
docker image rm ts-eigencaster
docker build . -t ts-eigencaster
sudo systemctl start ts-eigencaster
sudo journalctl -u ts-eigencaster -f -n20
