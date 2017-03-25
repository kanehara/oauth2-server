# Node OAuth2 Server Implementation

An Express OAuth2 server implementing [node-oauth2-server](https://www.npmjs.com/package/node-oauth2-server)
using the [express wrapper](https://github.com/oauthjs/express-oauth-server)

## Overview

There are not many good examples online of implementing the node-oauth2-server package.  The few examples that are 
available are heavily bloated and difficult to comb through.

This package provides a quick out-of-box foundation for an ouath2 Express server. This package is purposefully minimal 
and structured flat so it can be easily extended for robust, custom oAuth2 server implementations.

## Features

* ES6 via Babel
* Morgan + Winston logging
* Mongoose integration
* Dockerfile

## Installation

#### Yarn:
```
yarn
npm start
```

#### NPM:
```
npm install
npm start
```

## Configuration

Connections to Mongo via Mongoose is managed inside of `src/config.js`

## Endpoints
```
/               Unprotected "Hello world" response
/healthz        Health check
/secret         Protected endpoint
```