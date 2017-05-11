import chaiHttp from "chai-http";
import chai from "chai";
import { Token } from "../../src/models";
import prepareMockServer from '../util/prepare-mock-server';
import logger from '../../src/logger'

chai.use(chaiHttp);
const request = chai.request;
const expect = chai.expect;

describe('OAuth server integration tests for /auth/authenticate endpoint', () => {

  let server;
  before(async () => {
    try {
      server = await prepareMockServer();
    } catch(err) {
      logger.error(err);
    }
  });

  describe('Incorrect request types to /auth/authenticate', () => {
    it('should return 404 for post requests', async () => {
      try {
        await request(server)
            .post('/auth/authenticate');
      } catch (err) {
        expect(err.response).to.have.status(404);
      }
    });

    it('should return 404 for put requests', async () => {
      try {
        await request(server)
            .put('/auth/authenticate');
      } catch (err) {
        expect(err.response).to.have.status(404);
      }
    });

    it('should return 404 for delete requests', async () => {
      try {
        await request(server)
            .del('/auth/authenticate');
      } catch (err) {
        expect(err.response).to.have.status(404);
      }
    });
  });

  describe('200 Okay valid authenticated requests', () => {
    it('should return 200 if token is valid', async () => {
      try {
        const token = await getValidToken();
        await request(server)
            .get('/auth/authenticate')
            .set('Authorization', `${token.token_type} ${token.access_token}`)
      } catch (err) {
        expect(err.response).to.have.status(200);
      }
    });

    it('should return 200 if token is requested multiple times and last token is used', async () => {
      try {
        const token0 = await getValidToken();
        const token1 = await getValidToken();
        const token2 = await getValidToken();
        await request(server)
            .get('/auth/authenticate')
            .set('Authorization', `${token2.token_type} ${token2.access_token}`)
      } catch (err) {
        expect(err.response).to.have.status(200);
      }
    });
  });

  describe('400 Bad Request responses', () => {

    it('should return 400 if missing Bearer prefix', async () => {
      try {
        await request(server)
            .get('/auth/authenticate')
            .set('Authorization', 'invalidToken123');
      } catch (err) {
        expect(err.response).to.have.status(400);
      }
    });

    it('should return 400 if token field is null', async () => {
      try {
        await request(server)
            .get('/auth/authenticate')
            .set('Authorization', null);
      } catch (err) {
        expect(err.response).to.have.status(400);
      }
    });

    it('should return 400 if token is empty', async () => {
      try {
        await request(server)
            .get('/auth/authenticate')
            .set('Authorization', 'Bearer');
      } catch (err) {
        expect(err.response).to.have.status(400);
      }
    });
  });

  describe('401 Unauthorized responses', () => {

    it('should return 401 if missing authorization header', async () => {
      try {
        await request(server)
            .get('/auth/authenticate');
      } catch (err) {
        expect(err.response).to.have.status(401);
      }
    });

    it('should return 401 if valid token but authorization header is wrong', async () => {
      try {
        const token = await getValidToken();
        await request(server)
            .get('/auth/authenticate')
            .set('Authorize', `${token.token_type} ${token.access_token}`);
      } catch (err) {
        expect(err.response).to.have.status(401);
      }
    });

    it('should return 401 if token field is empty string', async () => {
      try {
        await request(server)
            .get('/auth/authenticate')
            .set('Authorization', '');
      } catch (err) {
        expect(err.response).to.have.status(401);
      }
    });

    it('should return 401 if token is invalid', async () => {
      try {
        await request(server)
            .get('/auth/authenticate')
            .set('Authorization', 'Bearer invalidToken123');
      } catch (err) {
        expect(err.response).to.have.status(401);
      }
    });

    it('should return 401 if token is expired', async () => {
      try {
        const token = await getValidToken();
        const tokenToExpire = await Token.findOne({accessToken: token.access_token});
        tokenToExpire.accessTokenExpiresAt = new Date();
        await tokenToExpire.save();
        await request(server)
            .get('/auth/authenticate')
            .set('Authorization', `${token.token_type} ${token.access_token}`);
      } catch (err) {
        expect(err.response).to.have.status(401);
      }
    });

    it('should return 401 if token is requested multiple times and first token is used', async () => {
      try {
        const token0 = await getValidToken();
        const token1 = await getValidToken();
        const token2 = await getValidToken();
        await request(server)
            .get('/auth/authenticate')
            .set('Authorization', `${token0.token_type} ${token0.access_token}`)
      } catch (err) {
        expect(err.response).to.have.status(401);
      }
    });

    it('should return 401 if token is requested multiple times and second token is used', async () => {
      try {
        const token0 = await getValidToken();
        const token1 = await getValidToken();
        const token2 = await getValidToken();
        await request(server)
            .get('/auth/authenticate')
            .set('Authorization', `${token1.token_type} ${token1.access_token}`)
      } catch (err) {
        expect(err.response).to.have.status(401);
      }
    });
  });

  /**
   * Constructs valid request to /auth/token and returns token response
   */
  async function getValidToken(grantType = 'client_credentials', scope) {
    try {
      const validPostBody = {
        grant_type: grantType,
        scope
      };
      const res = await request(server)
          .post('/auth/token')
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .auth('12345', '12345')
          .send(validPostBody);
      expect(res.body.access_token).to.be.ok;
      expect(res.body.expires_in).to.be.ok;
      expect(res.body.scope).to.be.ok;
      expect(res.body.token_type).to.be.ok;
      expect(res.body.scope).to.be.an.instanceof(Array);
      expect(res.body.token_type).to.equal('Bearer');
      return res.body;
    } catch (err) {
      chai.assert(false);
    }
  }
});