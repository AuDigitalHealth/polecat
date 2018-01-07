#!/bin/bash

ssh $DEPLOY_USER@$SERVER_HOSTNAME "cd $DEPLOY_DIRECTORY && docker-compose pull johngrimes/polecat && docker-compose up -d"
