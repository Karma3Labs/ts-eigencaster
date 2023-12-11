#!/bin/bash
###
# Run this script from the repo's home directory
###
source ./.env
HOME_DIR=${HOME_DIR:-$PWD}
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_USERNAME=${DB_USERNAME:-"postgres"}
DB_PASSWORD=${DB_PASSWORD:-"password"}
DB_NAME=${DB_NAME:-"postgres"}

sudo mkir -p /var/log/ts-eigencaster
sudo chown $(whoami): /var/log/ts-eigencaster

(crontab -l 2>/dev/null; echo "15 */6 * * * date >> /var/log/ts-eigencaster/yarn-compute.log; cd $HOME_DIR/ts-eigencaster; yarn compute >> /var/log/ts-eigencaster/yarn-compute.log 2>&1") | crontab -
(crontab -l 2>/dev/null; echo "00 */6 * * * source /usr/bin/psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_NAME -c "REFRESH MATERIALIZED VIEW mv_follow_links;"") | crontab -
