'use strict';

const env    = require('../../config/environment_vars');
const Storage = require('@google-cloud/storage');
const stream = require('stream');
const util   = require('util');

const storage = Storage({
    projectId: env.GCLOUD_PROJECT
});

const bucket = storage.bucket(env.CLOUD_BUCKET);

function gcpStream(image){
  /* jshint validthis:true */
  if (!(this instanceof gcpStream)){
    return new gcpStream(image);
  }
  stream.Readable.call(this, { objectMode : true });
  this.image = image;
  this.ended = false;
}

util.inherits(gcpStream, stream.Readable);

gcpStream.prototype._read = function(){
  var _this = this;

  if ( this.ended ){ return; }

  // pass through if there is an error on the image object
  if (this.image.isError()){
    this.ended = true;
    this.push(this.image);
    return this.push(null);
  }

  this.image.log.time('source:gcp');

  const imgPath = this.image.path.replace(/^\//,'');

  storage
  .bucket(env.CLOUD_BUCKET)
  .file(imgPath)
  .download(function(err, data){
    _this.image.log.timeEnd('source:gcp');

    // if there is an error store it on the image object and pass it along
    if (err) {
      _this.image.error = err;
    }

    // if not store the image buffer
    else {
      _this.image.contents = data;
      _this.image.originalContentLength = data.length;
    }

    _this.ended = true;
    _this.push(_this.image);
    _this.push(null);
  });
};

module.exports = gcpStream;
