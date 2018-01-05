#!/bin/bash

(umask 077 ; echo $DEPLOY_SSH_KEY | base64 --decode > ~/.ssh/id_rsa)
ssh $DEPLOY_USER@$SERVER_HOSTNAME 'docker-compose pull johngrimes/polecat && docker-compose up -d'
