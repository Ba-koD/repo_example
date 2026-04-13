#!/bin/sh
set -eu

: "${APP_ENV:=dev}"
: "${APP_DISPLAY_NAME:=Idea Dummy App}"
: "${PUBLIC_API_BASE_PATH:=/api}"
: "${PUBLIC_ENV_NAME:=${APP_ENV}}"

export APP_ENV
export APP_DISPLAY_NAME
export PUBLIC_API_BASE_PATH
export PUBLIC_ENV_NAME

envsubst '${APP_ENV} ${APP_DISPLAY_NAME} ${PUBLIC_API_BASE_PATH} ${PUBLIC_ENV_NAME}' \
  < /usr/share/nginx/html/config.js.template \
  > /usr/share/nginx/html/config.js

