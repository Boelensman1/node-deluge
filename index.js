/**
 * Created by nusrathkhan on 2015/10/20.
 */
const http = require('http');
const zlib = require('zlib');
const schedule = require('node-schedule');
const Q = require('q');

module.exports = function deluge(hostname, password, port) {

  // INIT consts
  if(port == null) {
    port = 8112;
  }

  let counter;
  let authCookie = '';




  //update cookie every hour, as it expires
  const j = schedule.scheduleJob('0 * * * *', function() {
    auth(loggit);
  });

  function close() {
    j.cancel();
  }

  function getConfig() {
    const toR = Q.defer();
    const params = [];
    sendRequest('core.get_config', params, function(data) {
      if (data) {
        toR.resolve(data);
      } else {
        toR.reject(data);
      }
    });

    return toR.promise;
  }

  function listTorrents(torrentHashes) {
    const toR = Q.defer();
    const params = [torrentHashes, [
      'hash',
      'queue',
      'name',
      'total_size',
      'state',
      'progress',
      'num_seeds',
      'total_seeds',
      'num_peers',
      'total_peers',
      'download_payload_rate',
      'upload_payload_rate',
      'eta',
      'ratio',
      'distributed_copies',
      'is_auto_managed',
      'time_added',
      'tracker_host',
      'save_path',
      'total_done',
      'total_uploaded',
      'max_download_speed',
      'max_upload_speed',
      'seeds_peers_ratio',
    ],
    ];

    sendRequest('webapi.get_torrents', params, function(data) {
      if (data) {
        data.result.torrents = data.result.torrents.map(function(torrent) {
          const torrentFormatted = {};
          torrentFormatted[torrent.hash] = torrent;
          return torrentFormatted;
        });
        toR.resolve(data);
      } else {
        toR.reject(data);
      }
    });

    return toR.promise;
  }

  function addTorrent(content, location) {
    const toR = Q.defer();
    const params = [
      content,
      {
        download_location: location // eslint-disable-line
      },
    ];

    sendRequest('webapi.add_torrent', params, function(data) {
      if (data) {
        toR.resolve(data);
      } else {
        toR.reject(data);
      }
    });

    return toR.promise;
  }


  function getStatus(callback) {
    const toR = Q.defer();
    const params = [
      [
        'queue',
        'name',
        'total_size',
        'state',
        'progress',
        'num_seeds',
        'total_seeds',
        'num_peers',
        'total_peers',
        'download_payload_rate',
        'upload_payload_rate',
        'eta',
        'ratio',
        'distributed_copies',
        'is_auto_managed',
        'time_added',
        'tracker_host',
        'save_path',
        'total_done',
        'total_uploaded',
        'max_download_speed',
        'max_upload_speed',
        'seeds_peers_ratio',
      ],
      [

      ],
    ];

    sendRequest('web.update_ui', params, function(data) {
      if (data) {
        toR.resolve(data);
      } else {
        toR.reject(data);
      }
    });

    return toR.promise;
  }

  function loggit(data) {
    if(data.result == true) {
      console.log('Successfully authenticated with Deluge client!');
    } else {
      console.error('Deluge authentication failed!');
    }

  }


  function auth() {
    const toR = Q.defer();
    const params = [ password ];
    sendRequest('auth.login', params, function(res) {
      if (res && res.result) {
        toR.resolve(res);
      } else {
        toR.reject(res);
      }
    });

    return toR.promise;
  }

  function sendRequest(method, params, callback) {

    //setup our request payload from input params
    let payload = {
      'method': method,
      'params': params,
      'id': counter++,
    };

    //make payload a string for http request
    payload = JSON.stringify(payload);

    //set auth cookie if already authenticated
    let head;
    if(authCookie != '') {
      head = {
        'Cookie': authCookie,
      };
    }

    //setup our http request parameters
    const options = {
      hostname: hostname,
      port: port,
      path: '/json',
      method: 'POST',
      headers: head,
    };

    const req = http.request(options, function(res) {

      const gunzip = zlib.createGunzip();
      res.pipe(gunzip);

      if(authCookie == '') {
        authCookie = JSON.stringify(res.headers['set-cookie']).slice(2,50);
      }

      const buffer = [];
      gunzip.on('data', function(chunk) {
        buffer.push(chunk.toString());
      });
      gunzip.on('end', function() {
        callback(JSON.parse(buffer.join('')));
      });

    });

    //output http request errors to console
    req.on('error', function(e) {
      console.log('problem with request: ' + e.message);
    });

    // write data to request body
    req.write(payload);
    req.end();

  }

  return {
    getConfig: getConfig,
    getStatus: getStatus,
    addTorrent: addTorrent,
    listTorrents: listTorrents,
    auth: auth,
    close: close,
  };
};
