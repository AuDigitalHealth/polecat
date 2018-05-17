#!/bin/bash

ssh $DEPLOY_USER@$SERVER_HOSTNAME "cd $DEPLOY_DIRECTORY && docker-compose pull polecat && docker-compose up -d"
