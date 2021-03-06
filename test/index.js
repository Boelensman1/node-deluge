const fs = require('fs');
const q = require('q');

const should = require('chai').should();
const deluge = require('../index')(
  'server',
  'pass',
  0000 // port
);

describe('#get_config', function() {
  it('gets the current status of the deluge client', function() {
    return deluge.auth().then(deluge.getConfig).then(function(data) {
      should.exist(data);
      data.should.be.an('object');
    });
  });
});

describe('#get_status', function() {
  it('gets the current config of the deluge client', function() {
    return deluge.auth().then(deluge.getStatus).then(function(data) {
      should.exist(data);
      data.should.be.an('object');
    });
  });
});

describe.only('#get_status', function() {
  it('gets the current config of the deluge client', function() {
    const ids = [
      '4e584a1c28cdceda23a119034096dc11adfaf38c',
      '041de3245a1649449c42069ed080cef340174317',
    ];

    return deluge.auth().then(function() {
      return deluge.listTorrents(ids).then(function(data) {
        should.exist(data);
        data.should.be.an('object');
        console.log(data.result.torrents);
      });
    });
  });
});

describe.skip('#add_torrent', function() {
  it('add a torrent to the deluge client', function() {
    this.timeout(10000);
    return new q.Promise(function(resolve, reject) {

      return deluge.auth().then(function() {
        const name = './torrentfile';
        return fs.readFile(name, function(err, torrent) {
          if (err) { throw err; };
          const torrentBase64 = torrent.toString('base64');
          return resolve(
            deluge.addTorrent(torrentBase64, 'location')
            .then(function(result) {
              result.should.be.an('object');
            })
          );
        });
      });
    });
  });
});
