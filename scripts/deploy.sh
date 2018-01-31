#!/bin/bash

ssh $DEPLOY_USER@$SERVER_HOSTNAME "cd $DEPLOY_DIRECTORY && docker login -u $DOCKER_USER -p $DOCKER_PASSWORD && docker-compose pull polecat && docker logout && docker-compose up -d"
