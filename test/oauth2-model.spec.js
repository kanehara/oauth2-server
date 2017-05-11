import modelFactory from '../src/oauth2-model-factory';
const model = modelFactory();
import sinon from 'sinon';
import chai from 'chai';
import {Client, Token, User} from '../src/models';
const expect = chai.expect;

describe('oauth2-model test', () => {
  describe('#getAccessToken', () => {
    let tokenFindOneStub, sandbox;
    before(() => {
      sandbox = sinon.sandbox.create();
      tokenFindOneStub = sandbox.stub(Token, "findOne");
    });

    after(() => {
      sandbox.restore();
    });

    it('should return Token if found', async () => {
      const expirationDate = new Date();
      expirationDate.setSeconds(expirationDate.getSeconds() + 30);
      const mockToken = { accessToken: 'weee', accessTokenExpiresAt: expirationDate };
      tokenFindOneStub.returns(Promise.resolve(mockToken));

      const result = await model.getAccessToken('');
      expect(result).to.deep.equal(mockToken);
    });

    it('should return falsey if Token is false', async () => {
      tokenFindOneStub.returns(Promise.resolve(false));
      const result = await model.getAccessToken('');
      expect(result).to.not.be.ok;
    });

    it('should return falsey if Token is undefined', async () => {
      tokenFindOneStub.returns(Promise.resolve(undefined));
      const result = await model.getAccessToken('');
      expect(result).to.not.be.ok;
    });

    it('should return falsey if Token is null', async () => {
      tokenFindOneStub.returns(Promise.resolve(null));
      const result = await model.getAccessToken('');
      expect(result).to.not.be.ok;
    });

    it('should return falsey if Exception encountered querying Mongo', async () => {
      tokenFindOneStub.rejects();
      const result = await model.getAccessToken('');
      expect(result).to.not.be.ok;
    });

    it('should return falsey if token is found but does not have an expiration date', async () => {
      tokenFindOneStub.returns(Promise.resolve({ accessToken: '123' }));
      const result = await model.getAccessToken('');
      expect(result).to.not.be.ok;
    });

    it('should return falsey if token is found but expired', async () => {
      const expirationDate = new Date();
      expirationDate.setSeconds(expirationDate.getSeconds() - 1)
      const mockToken = {
        accessToken: '123',
        accessTokenExpiresAt: expirationDate
      };
      tokenFindOneStub.returns(Promise.resolve(mockToken));
      const result = await model.getAccessToken('');
      expect(result).to.not.be.ok;
    });
  });

  describe('#getClient', () => {
    let clientFindOneStub, sandbox;
    before(() => {
      sandbox = sinon.sandbox.create();
      clientFindOneStub = sandbox.stub(Client, "findOne");
    });

    after(() => {
      sandbox.restore();
    });

    it('should return Client if found', async () => {
      const mockClient = { username: 'birdperson', password: 'Tammy' };
      clientFindOneStub.returns(Promise.resolve(mockClient));

      let result = await model.getClient('', '');
      expect(result).to.deep.equal(mockClient);
    });

    it('should return falsey if Client is false', async () => {
      clientFindOneStub.returns(Promise.resolve(false));
      const result = await model.getClient('', '');
      expect(result).to.not.be.ok;
    });

    it('should return falsey if Client is false', async () => {
      clientFindOneStub.returns(Promise.resolve(undefined));
      const result = await model.getClient('', '');
      expect(result).to.not.be.ok;
    });

    it('should return falsey if Client is false', async () => {
      clientFindOneStub.returns(Promise.resolve(null));
      const result = await model.getClient('', '');
      expect(result).to.not.be.ok;
    });

    it ('should return falsey if Exception encountered querying Mongo', async () => {
      clientFindOneStub.rejects();
      let result = await model.getClient('', '');
      expect(result).to.not.be.ok;
    })
  });

  describe('#getUserFromClient', () => {
    let clientFindOneStub, populateStub, sandbox;
    before(() => {
      sandbox = sinon.sandbox.create();
      clientFindOneStub = sandbox.stub(Client, 'findOne');
      populateStub = sandbox.stub();
      clientFindOneStub.returns({populate: populateStub});
    });

    after(() => {
      sandbox.restore();
    });

    it('should return falsey if Client is null', async () => {
      populateStub.returns(Promise.resolve(null));
      const user = await model.getUserFromClient('', '');
      expect(user).to.not.be.ok;
    });

    it('should return falsey if Client is undefined', async () => {
      populateStub.returns(Promise.resolve(undefined));
      const user = await model.getUserFromClient('', '');
      !expect(user).to.not.be.ok;
    });

    it('should return falsey if Client User instance is null', async () => {
      populateStub.returns(Promise.resolve({ user: null }));
      const user = await model.getUserFromClient('', '');
      expect(user).to.not.be.ok;
    });

    it('should return falsey if Client User instance is undefined', async () => {
      populateStub.returns(Promise.resolve({ user: undefined }));
      const user = await model.getUserFromClient('', '');
      expect(user).to.not.be.ok;
    });

    it('should return Client\'s User instance if it exists', async () => {
      const mockUser = {id: '123'};
      populateStub.returns(Promise.resolve({ user: mockUser }));
      const user = await model.getUserFromClient('', '');
      expect(user).to.deep.equal(mockUser);
    });
  });

  describe('#saveToken', () => {
    const mockToken = {
      accessToken: '123',
      accessTokenExpiresAt: new Date('01/01/18'),
      scope: ['admin'],
      save: () => {}
    };

    let tokenFindStub, tokenSaveStub, sandbox;

    beforeEach(() => {
      sandbox = sinon.sandbox.create();
      tokenFindStub = sandbox.stub(Token, "find");
      tokenSaveStub = sandbox.stub(Token.prototype, "save");
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should call #revokeToken only if valid token is found for Client', async() => {
      const revokeTokenSpy = sandbox.spy();
      sandbox.stub(mockToken, "save");
      tokenFindStub.returns(Promise.resolve([mockToken]));
      await modelFactory(undefined, revokeTokenSpy).saveToken('', '', '');
      chai.assert(revokeTokenSpy.calledOnce);
    });

    it('should call #revokeToken for each valid token found for Client (should not happen in production)', async() => {
      const revokeTokenSpy = sandbox.spy(model, "revokeToken");
      sandbox.stub(mockToken, "save");
      tokenFindStub.returns(Promise.resolve([mockToken, mockToken, mockToken]));
      await modelFactory(undefined, revokeTokenSpy).saveToken('', '', '');
      chai.assert(revokeTokenSpy.calledThrice);
    });

    it('should not call #revokeToken if valid token is not found for Client', async() => {
      const revokeTokenSpy = sandbox.spy(model, "revokeToken");
      sandbox.stub(mockToken, "save");
      tokenFindStub.returns(Promise.resolve(undefined));
      expect(await modelFactory(undefined, revokeTokenSpy).saveToken('', '', '')).to.not.be.ok;
      chai.assert(revokeTokenSpy.notCalled);
    });

    it('should return falsey if Token query throws exception', async() => {
      tokenFindStub.throws();
      expect(await model.saveToken('', '', '')).to.not.be.ok;
    });

    it('should return saved Token on success', async() => {
      tokenSaveStub.returns(mockToken);
      expect(await model.saveToken('','','')).to.deep.equal(mockToken);
    });

    it('should return falsey on failure to save Token', async() => {
      tokenSaveStub.rejects();
      expect(await model.saveToken('','','')).to.not.be.ok;
    });

    it('should return falsey if saving Token fails', async() => {
      tokenSaveStub.rejects();
      expect(await model.saveToken('', '', '')).to.not.be.ok;
    });
  });

  describe('#revokeToken', () => {
    const dateInFuture = new Date();
    dateInFuture.setHours(dateInFuture.getHours() + 2);
    const mockToken = {
      accessTokenExpiresAt: dateInFuture,
      save: () => {}
    };

    let tokenSaveStub, sandbox;
    before(() => {
      sandbox = sinon.sandbox.create();
      tokenSaveStub = sandbox.stub(mockToken, "save");
    });

    after(() => {
      sandbox.restore();
    });

    it('should return falsey if saving token throws exception', async() => {
      tokenSaveStub.rejects();
      expect(await model.revokeToken(mockToken)).to.not.be.ok;
    });

    it('should return falsey if saving token returns false', async() => {
      tokenSaveStub.returns(false);
      expect(await model.revokeToken(mockToken)).to.not.be.ok;
    });

    it('should return falsey if saving token returns null', async() => {
      tokenSaveStub.returns(null);
      expect(await model.revokeToken(mockToken)).to.not.be.ok;
    });

    it('should return false if saving token returns undefined', async() => {
      tokenSaveStub.returns(undefined);
      expect(await model.revokeToken(mockToken)).to.not.be.ok;
    });

    it('should return expired token if updating token succeeds', async() => {
      tokenSaveStub.returns(Promise.resolve(mockToken));
      const revokedToken = await model.revokeToken(mockToken);
      expect(revokedToken).to.be.ok;
      expect(revokedToken.accessTokenExpiresAt).to.be.lessThan(new Date());
    });
  });

  describe('#validateScope', () => {
    let userFindOneStub, mockUser, sandbox;
    before(() => {
      sandbox = sinon.sandbox.create();
      userFindOneStub = sandbox.stub(User, "findOne");
      mockUser = { userId: 'mockId' };
    });

    after(() => {
      sandbox.restore();
    });

    it('should return false if user is null', () => {
      const result = model.validateScope(null, {}, null);
      expect(result).to.equal(false);
    });

    it('should return false if user is undefined', () => {
      const result = model.validateScope(undefined, {}, null);
      expect(result).to.equal(false);
    });

    it('should return false if user is 0', () => {
      const result = model.validateScope(0, {}, null);
      expect(result).to.equal(false);
    });

    it('should return false if user is empty string', () => {
      const result = model.validateScope('', {}, null);
      expect(result).to.equal(false);
    });

    it('should return false if user is NaN', () => {
      const result = model.validateScope(NaN, {}, null);
      expect(result).to.equal(false);
    });

    it('should return falsey if user is not found in db', async() => {
      userFindOneStub.returns(Promise.resolve(undefined));
      let result = await model.validateScope(mockUser, {}, null);
      expect(result).to.equal(false);
    });

    it('should return empty array if user is found and requested scopes is null', async () => {
      userFindOneStub.returns(Promise.resolve(mockUser));
      let result = await model.validateScope(mockUser, {}, null);
      expect(result).to.eql([]);
    });

    it('should return empty array if user is found and requested scopes is undefined', async () => {
      userFindOneStub.returns(Promise.resolve(mockUser));
      let result = await model.validateScope(mockUser, {}, undefined);
      expect(result).to.eql([]);
    });

    it('should return empty array if user is found and requested scopes is empty array', async () => {
      userFindOneStub.returns(Promise.resolve(mockUser));
      let result = await model.validateScope(mockUser, {}, []);
      expect(result).to.eql([]);
    });

    it('should return token scopes if user has all required scopes', async () => {
      const mockUserWithScopes = Object.assign({
        scope: ['admin', 'admin2']
      }, mockUser);
      userFindOneStub.returns(Promise.resolve(mockUserWithScopes));
      let result = await model.validateScope(mockUserWithScopes, {}, 'admin,admin2');
      expect(result).to.eql(['admin', 'admin2']);
    });

    it('should only return token scopes in request if user has more than required scopes', async () => {
      const mockUserWithScopes = Object.assign({
        scope: ['admin', 'admin2', 'extraScope']
      }, mockUser);
      userFindOneStub.returns(Promise.resolve(mockUserWithScopes));
      let result = await model.validateScope(mockUserWithScopes, {}, 'admin,admin2');
      expect(result).to.be.eql(['admin', 'admin2']);
    });

    it('should return falsey if user only has subset of required scopes', async () => {
      const mockUserWithScopes = Object.assign({
        scope: ['admin', 'extraScope']
      }, mockUser);
      userFindOneStub.returns(Promise.resolve(mockUserWithScopes));
      let result = await model.validateScope(mockUserWithScopes, {}, 'admin,admin2');
      expect(result).to.not.be.ok;
    });

    it('should return falsey if Exception encountered trying to find User', async () => {
      userFindOneStub.rejects();
      let result = await model.validateScope(mockUser, {}, null);
      expect(result).to.not.be.ok;
    })
  });

});