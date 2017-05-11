import chaiHttp from "chai-http";
import chai from "chai";
import prepareMockServer from '../util/prepare-mock-server';
import logger from '../../src/logger'

chai.use(chaiHttp);
const request = chai.request;
const expect = chai.expect;

/**
 * Integration tests for healthz endpoint
 */
describe('OAuth server health check integration tests for /healthz endpoint', () => {

  let server;
  before(async () => {
    try {
      server = await prepareMockServer();
    } catch(err) {
      logger.error(err);
    }
  });

  describe('Incorrect request types to /healthz', () => {
    it(`should return 200`, async () => {
      const res = await request(server)
          .get('/healthz');
      expect(res).to.have.status(200);
    });

    it(`should return 404 for put requests`, async () => {
      try {
        request(server)
            .put('/healthz')
            .send({evil: 'muahaha'});
      } catch (err) {
        expect(err.response).to.have.status(404);
      }
    });

    it(`should return 404 for post requests`, async () => {
      try {
        await request(server)
            .post('/healthz')
            .send({evil: 'muahaha'});
      } catch (err) {
        expect(err.response).to.have.status(404);
      }
    });
    it(`should return 404 for delete requests`, async () => {
      try {
        const res = await request(server)
            .del('/healthz');
      } catch (err) {
        expect(err.response).to.have.status(404);
      }
    });
  });

  describe('200 Okay response', () => {
    it(`should return 200`, async () => {
      const res = await request(server)
          .get('/healthz');
      expect(res).to.have.status(200);
    });
  });
});