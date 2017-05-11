import chaiHttp from "chai-http";
import chai from "chai";
import { clientCredentials } from '../util/load-demo-client'
import prepareMockServer from '../util/prepare-mock-server';
import logger from '../../src/logger'

chai.use(chaiHttp);
const request = chai.request;
const expect = chai.expect;

describe('OAuth server integration tests for /auth/token endpoint', () => {

  let server;
  before(async () => {
    try {
      server = await prepareMockServer();
    } catch(err) {
      logger.error(err);
    }
  });

  describe('Incorrect request types to /auth/token', () => {
    it('should return 404 for get requests', async () => {
      try {
        await request(server)
            .get('/auth/token');
      } catch (err) {
        expect(err.response).to.have.status(404);
      }
    });

    it('should return 404 for put requests', async () => {
      try {
        request(server)
            .put('/auth/token')
            .send({evil: 'muahaha'});
      } catch (err) {
        expect(err.response).to.have.status(404);
      }
    });

    it('should return 404 for delete requests', async () => {
      try {
        await request(server)
            .del('/auth/token');
      } catch (err) {
        expect(err.response).to.have.status(404);
      }
    });
  });

  const validPostBody = {
    grant_type: 'client_credentials',
  };

  describe('200 Okay valid responses yield tokens', () => {
    it('should return token for valid requests', async function () {
      try {
        const res = await request(server)
            .post('/auth/token')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .auth(clientCredentials.clientId, clientCredentials.clientSecret)
            .send(validPostBody);
        expect(res.body.access_token).to.be.ok;
        expect(res.body.expires_in).to.be.ok;
        expect(res.body.scope).to.be.ok;
        expect(res.body.token_type).to.be.ok;
        expect(res.body.scope).to.be.an.instanceof(Array);
        expect(res.body.token_type).to.equal('Bearer');
      } catch (err) {
        chai.assert(false);
      }
    });

    it('should return scope with token if requested validly', async () => {
      try {
        const res = await request(server)
            .post('/auth/token')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .auth(clientCredentials.clientId, clientCredentials.clientSecret)
            .send({grant_type: 'client_credentials', scope: 'all'});
        expect(res.body.access_token).to.be.ok;
        expect(res.body.expires_in).to.be.ok;
        expect(res.body.scope).to.be.ok;
        expect(res.body.token_type).to.be.ok;
        expect(res.body.scope).to.be.an.instanceof(Array);
        expect(res.body.scope[0]).to.equal('all');
        expect(res.body.token_type).to.equal('Bearer');
      } catch (err) {
        chai.assert(false);
      }
    });
  });

  describe('400 Bad Request responses', () => {
    it('should return 400 for vanilla post requests', async () => {
      try {
        await request(server)
            .post('/auth/token');
      } catch (err) {
        expect(err.response).to.have.status(400);
      }
    });

    it('should return 400 for requests missing application/x-www-form-urlencoded Content-Type header', async () => {
      try {
        await request(server)
            .post('/auth/token')
            .set('Content-Type', 'application/json')
            .auth(clientCredentials.clientId, clientCredentials.clientSecret)
            .send(validPostBody);
      } catch (err) {
        expect(err.response).to.have.status(400);
      }
    });

    it('should return 400 for requests with empty client id', async () => {
      try {
        await request(server)
            .post('/auth/token')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .auth('', clientCredentials.clientSecret)
            .send(validPostBody);
      } catch (err) {
        expect(err.response).to.have.status(400);
      }
    });

    it('should return 400 for requests missing grant_type in body', async () => {
      try {
        await request(server)
            .post('/auth/token')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .auth(clientCredentials.clientId, clientCredentials.clientSecret)
            .send({scope: 'all'});
      } catch (err) {
        expect(err.response).to.have.status(400);
      }
    });

    it('should return 400 for requests with wrong grant_type in body', async () => {
      try {
        await request(server)
            .post('/auth/token')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .auth(clientCredentials.clientId, clientCredentials.clientSecret)
            .send({grant_type: 'authorization_code'});
      } catch (err) {
        expect(err.response).to.have.status(400);
      }
    });

    it('should return 400 for requests with invalid grant_type in body', async () => {
      try {
        await request(server)
            .post('/auth/token')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .auth(clientCredentials.clientId, clientCredentials.clientSecret)
            .send({grant_type: '12345'});
      } catch (err) {
        expect(err.response).to.have.status(400);
      }
    });
  });

  describe('401 Unauthorized responses', () => {
    it('should return 401 if incorrect scope requested', async () => {
      try {
        await request(server)
            .post('/auth/token')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .auth(clientCredentials.clientId, clientCredentials.clientSecret)
            .send({grant_type: 'client_credentials', scope: 'superadmin'});
      } catch (err) {
        expect(err.response).to.have.status(400);
      }
    });

    it('should return 401 for requests with invalid client id', async () => {
      try {
        await request(server)
            .post('/auth/token')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .auth('xyz', clientCredentials.clientSecret)
            .send(validPostBody);
      } catch (err) {
        expect(err.response).to.have.status(401);
      }
    });

    it('should return 401 for requests with invalid client secret', async () => {
      try {
        await request(server)
            .post('/auth/token')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .auth(clientCredentials.clientId, 'xyz')
            .send(validPostBody);
      } catch (err) {
        expect(err.response).to.have.status(401);
      }
    });

    it('should return 401 for requests with null client secret', async () => {
      try {
        await request(server)
            .post('/auth/token')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .auth(clientCredentials.clientId, null)
            .send(validPostBody);
      } catch (err) {
        expect(err.response).to.have.status(401);
      }
    });

    it('should return 401 for requests with invalid client credentials', async () => {
      try {
        await request(server)
            .post('/auth/token')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .auth('KingJellyBean', 'Hehehe')
            .send(validPostBody);
      } catch (err) {
        expect(err.response).to.have.status(401);
      }
    });
  });
});