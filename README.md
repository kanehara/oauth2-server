# Node OAuth2 Server Implementation

An Express OAuth2 server implementing [node-oauth2-server](https://www.npmjs.com/package/node-oauth2-server)
using the [express wrapper](https://github.com/oauthjs/express-oauth-server)

## Overview

There are not many good examples online of implementing the node-oauth2-server package.  The few examples that are 
available are heavily bloated and difficult to comb through.

This package provides a quick out-of-box foundation for an ouath2 Express server. This package is purposefully minimal 
and structured flat so it can be easily extended for robust, custom oAuth2 server implementations.

Currently only supports client credentials grant.

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

Connections to Mongo via Mongoose is managed inside of `local-properties.json`.
Modify to point to a valid Mongo connection.

This is loaded through the `CONFIG_PATH` environment variable.  In a deployed environment,
this should be set to the location of the Docker container's configuration JSON file.

## Endpoints
```
/                   Unprotected "Hello world" response
/healthz            Health check
/auth/token         Retrieve token with client credentials
/auth/authenticate  Authenticate tokens
```

## Testing

```
npm test
```
This will create a mocha report with [mochawesome](https://github.com/adamgruber/mochawesome)

## Loading OAuth2 DB

After modifying `local-properties.json` to point to a valid Mongo connection,
the following script will load data.

1. Clients
    * `npm run db:create:client <client-name>`
        * REQUIRED: `client-name` - Canonical name to associate with client
        
# Auth Server API
Interacting with the Auth Server

## Overview 

For more on the OAuth2 spec:
[OAuth2 Spec](https://tools.ietf.org/html/rfc6749)

## Request a token

***This server currently only supports `client_credentials` grant types.***

### Client Credentials

[Client Credentials Grant Spec](https://tools.ietf.org/html/rfc6749#section-4.4)


#### 1. Retrieve a Client's client ID and client secret from Mongo

* `{client id}` will refer to Client ID in later steps  
* `{client secret}` will refer to Client secret in later steps

#### 2. Request token

* **URL**

  `/auth/token`

* **Method**

  `POST`

* **Body**
  * **Required:**
      * `grant_type[string]` Value **MUST** be set to 'client_credentials' 
          * Specifies the OAuth2 grant type
  * Optional:
      * `scope=[string]` 
          * Space delimited scopes to attach to token if authorized
         (for more see: [token scopes](https://tools.ietf.org/html/rfc6749#section-3.3))
  * **Example**
  
      ```json
      {
        "grant_type": "client_credentials",
        "scope": "admin"
      }
      ```

* **Success Response**
  * **Code:** 200
  * **Body Example:**

      ```json
      {
        "access_token": "ad7f3dcb56d2cde4dddd6ae2799243c7c505a9b3",
        "token_type": "Bearer",
        "expires_in": 3599,
        "scope": []
      }
      ```
      
      `access_token` The access token to use in requests to Vodori API's
      
      `token_type` The access token type which should be prepended to the authorization header value when using token
      
      `expires_in` The number of seconds until token expires.  ***Client must manage token re-retrieval.*** 
      
      `scope` Array of scopes assigned to token if applicable
      
* **Error Response**
  * **400 Invalid Request**
      * **Code:** 400
      * **Body Example**:
      
          ```json
          {
            "error": "invalid_request",
            "error_description": "Invalid request: content must be application/x-www-form-urlencoded"
          }
          ```
          
  * **401 Unauthorized**
      * **Code:** 401
      * **Body Example:**
      
          ```json
              {
                "error": "invalid_client",
                "error_description": "Invalid client: client is invalid"
              }
          ```
          
* **Sample**

  ```bash
  curl -X POST -H "Content-Type: application/x-www-form-urlencoded" -u 12345:12345 -d "grant_type=client_credentials&scope=all" http://localhost:3000/auth/token
  ```

#### 3. Using token



* **Example**

    Assuming the following:
    * `0123456789` The token retrieved from auth server
    * `Bearer` The token type retrieved from auth server
    * `https://www.dummy.someapi.com/get/documents/12345` Dummy REST API endpoint

    Curl command:
    
    ```bash
    curl -X GET -H "Authorization: Bearer 0123456789" https://www.dummy.someapi.com/get/documents/12345
    ```