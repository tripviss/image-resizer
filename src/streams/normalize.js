'use strict';

var sharp  = require('sharp');
var env    = require('../config/environment_vars');
var map    = require('map-stream');


module.exports = function () {

  return map( function (image, callback) {
    var normalizedFormat, r;

    // pass through if there is an error
    if (image.isError()) {
      return callback(null, image);
    }

    // let this pass through if we are requesting the metadata as JSON
    if (image.modifiers.action === 'json'){
      image.log.log('normalize: json metadata call');
      return callback(null, image);
    }

    switch (image.format) {
      case 'tiff':
        normalizedFormat = 'png';
        break;
      case 'gif':
        normalizedFormat = 'png';
        break;
      default:
        normalizedFormat = null;
        break;
    }

    if (normalizedFormat === null) {
      image.log.log('normalize:', image.log.colors.bold('no normalize'));
      return callback(null, image);
    }

    image.log.time('normalize:' + normalizedFormat);

    r = sharp(image.contents);

    r.toFormat(normalizedFormat);

    // write out the normalized image to buffer and pass it on
    r.toBuffer( function (err, buffer) {
      if (err) {
        image.log.error('normalize error', err);
        image.error = new Error(err);
      }
      else {
        image.contents = buffer;
      }

      image.log.timeEnd('normalize:' + normalizedFormat);
      callback(null, image);
    });
  });

};
