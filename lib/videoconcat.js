'use strict';

let tmp = require('tmp');
let fext = require('file-extension');
let fs = require('fs');
let shelljs = require('shelljs');

module.exports = function () {

	let that = null;
	let clips = [];
	let outputFileName = tmp.tmpNameSync({
		prefix: 'video-output-',
    postfix: '.mp4'
	});

	function setClips(_clips) {
		if (Array.isArray(_clips)) {
			clips = _clips;
		} else {
			throw new Error('Expected parameter to be of type `Array`');
		}
		return that;
	}

	function setOutput(fileName) {
    
		if (fileName) {
      
			outputFileName = fileName;
		}
    return that;
	}

  /**
   * concatenates clips together using a fileList
   * @param  {string} spec.fileList Address of a text file containing filenames of the clips
   * @return {[type]}      [description]
   */
  function concatClips(spec) {
    
    return new Promise((resolve, reject) => {
      let child = shelljs.exec(`ffmpeg -f concat -i ${spec.fileList} -c copy ${outputFileName}`, { async: true, silent: true });

      child.on('exit', (code, signal) => {
        
        if (code === 0) {
          resolve(outputFileName);
        } else {
          reject();
        }
      });
    });
  }

  function escapePath(pathString) {
    return pathString.replace(/\\/g, '\\\\');
  }

  function getLineForClip(clip) {
    return `file ${escapePath(clip.fileName)}`;
  }

  function getTextForClips(clips) {
    return clips.map(getLineForClip).join('\n');
  }

  function doConcat() {


    let fileListText = getTextForClips(clips);

    let fileListFilename = tmp.tmpNameSync({
      postfix: '.txt'
    });

    fs.writeFileSync(fileListFilename, fileListText, 'utf8');

    return concatClips({
      fileList: fileListFilename,
    });
  }

	that = Object.create({
		clips: setClips,
		output: setOutput,
		concat: doConcat,
	});

	return that;
}