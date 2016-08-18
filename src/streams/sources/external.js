// Fetches an image from an external URL

'use strict';

var string, stream, util, request;

string  = require('../../utils/string');
stream  = require('stream');
util    = require('util');
request = require('request');

function contentLength(bufs){
  return bufs.reduce(function(sum, buf){
    return sum + buf.length;
  }, 0);
}

function External(image, key, prefix){
  var regexMatch;

  /* jshint validthis:true */
  if (!(this instanceof External)){
    return new External(image, key, prefix);
  }
  stream.Readable.call(this, { objectMode : true });
  this.image = image;
  this.ended = false;
  this.key = key;
  if ((regexMatch = prefix.match(string.REGEX_LITERAL_REGEX)) !== null) {
    this.pattern = new RegExp(regexMatch[1], regexMatch[2]);
  } else {
    this.prefix = prefix;
  }
}

util.inherits(External, stream.Readable);

External.prototype._read = function(){
  var _this = this,
    url,
    imgStream,
    bufs = [];

  if ( this.ended ){ return; }

  // pass through if there is an error on the image object
  if (this.image.isError()){
    this.ended = true;
    this.push(this.image);
    return this.push(null);
  }

  if (this.pattern) {
    url = this.image.path;

    if (!this.pattern.test(url)) {
      this.image.error = new Error('URL "' + url + '" does not match pattern');
      this.ended = true;
      this.push(this.image);
      return this.push(null);
    }
  } else {
    url = this.prefix + '/' + this.image.path;
  }

  this.image.log.time('source:' + this.key);

  imgStream = request.get(url);
  imgStream.on('data', function(d){ bufs.push(d); });
  imgStream.on('error', function(err){
    _this.image.error = new Error(err);
  });
  imgStream.on('response', function(response) {
    if (response.statusCode !== 200) {
      _this.image.error = new Error('Error ' + response.statusCode + ':');
    }
  });
  imgStream.on('end', function(){
    _this.image.log.timeEnd('source:' + _this.key);
    if(_this.image.isError()) {
      _this.image.error.message += Buffer.concat(bufs);
    } else {
      _this.image.contents = Buffer.concat(bufs);
      _this.image.originalContentLength = contentLength(bufs);
    }
    _this.ended = true;
    _this.push(_this.image);
    _this.push(null);
  });

};


module.exports = External;