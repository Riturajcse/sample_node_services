var memcachedClient = require('./index').memcachedClient;
var db_mysql = require('./index.js').db_mysql;
var db_neo4j = require('./index.js').db_neo4j;
var db_postgres = require('./index.js').db_postgres;
var rabbit_send = require('./index.js').rabbit_send;
var rabbit_receive = require('./index.js').rabbit_receive;
var chai = require("chai");
var expect = chai.expect;
var superagent = require("superagent");
var should = require("should");

/* ================= memcached =================*/
describe('Memcached', function () {
  it('sets, then gets a key/value pair',
    function (done) {
      memcachedClient.set('foo', 'bar');
      memcachedClient.get('foo',
        function (err, value, key) {
          console.log(value.toString());
          value.toString().should.equal('bar');
          done();
        }
      );
    }
  );
});

/* ================= mongo =================*/
describe("Index", function () {
  it("renders HTML", function (done) {
    superagent.get("http://localhost:3000/")
      .end(function (e, res) {
        (e === null).should.equal(true);
        res.text.should.equal("Hey buddy!");
        done();
      });
  });
});

describe("Persistence", function () {
  it("should create a thing", function (done) {
    superagent.get("http://localhost:3000/doobie")
      .end(function (e, res) {
        (e === null).should.equal(true);
        var response = res.body;
        expect(response.created).to.equal(true);
        done();
      });
  });
  it("should retrieve a thing", function (done) {
    superagent.get("http://localhost:3000/doobie")
      .end(function (e, res) {
        (e === null).should.equal(true);
        var response = res.body;
        expect(response.created).to.equal(false);
        response = response.returnObj;
        response.should.have.property("name", "doobie");
        done();
      });
  });
});

/* ================= mysql =================*/
describe('MySql Database', function () {
  it('should create the things table', function () {
    db_mysql.schema.hasTable('things').then(function (exists) {
      expect(exists).to.equal(true);
    });
  });
  it('should save a new name', function () {
    db_mysql('things')
      .insert({ name: 'Johnson' })
      .exec(function (err) {
        expect(err).to.equal(null);
      });
  });
  it('should retrieve that name', function () {
    db_mysql('things')
      .where({ name: 'Johnson' })
      .select('name')
      .then(function (name) {
        expect(name[0].name).to.equal('Johnson');
      });
  });
});

/* ================= neo4j =================*/
describe('Neo4j database', function () {
  it('should save a node', function () {
    var node = db_neo4j.createNode({ name: 'test' });
    node.save(function (err, node) {
      expect(err).to.equal(null);
      expect(node).to.have.property('id');
    });
  });
  it('should retrieve a node', function () {
    db_neo4j.getIndexedNodes('node_auto_index', 'name', 'test', function (nodes) {
      expect(nodes).to.be.an('array');
      expect(nodes.length).to.equal(1);
      expect(nodes[0].name).to.equal('test');
    });
  });
});

/* ================= postgres =================*/
describe('Postgres Database', function () {
  this.timeout(3000);
  beforeEach(function (done) {
    setTimeout(function () {
      done();
    }, 1000);
  });
  it('should create a table', function (done) {
    db_postgres.schema.hasTable('things').then(function (exists) {
      if (!exists) {
        db_postgres.schema.createTable('things', function (table) {
          table.string('name');
        }).then(function () {
          done();
        });
      } else {
        done();
      }
    });
  });
  it('should save a new name', function (done) {
    db_postgres('things')
      .insert({ name: 'Johnson' })
      .exec(function (err) {
        expect(err).to.equal(null);
        done();
      });
  });
  it('should retrieve that name', function (done) {
    db_postgres('things')
      .select()
      .then(function (docs) {
        expect(docs[0].name).to.equal('Johnson');
        done();
      });
  });
});

/* ================= rabbitMQ =================*/
describe('RabbitMQ',
  function () {
    it('should send a message',
      function (done) {
        rabbit_send(
          function(err, sentMessage) {
            expect(sentMessage).to.equal('sent message');
            done();
          }
        );
      }
    );
    it('should receive a message',
      function (done) {
        rabbit_receive(
          function(err, receivedMessage) {
            expect(receivedMessage).to.equal('Hello World!');
            done();
          }
        );
      }
    );
  }
);
