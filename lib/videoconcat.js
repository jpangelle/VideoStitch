'use strict';

let tmp = require('tmp');
let fs = require('fs');
let _ = require('lodash');
const { exec } = require('child_process')
const ffmpegPath = require('ffmpeg-static').path.replace('app.asar', 'app.asar.unpacked');

module.exports = function (spec) {

	let that = null;
	let clips = [];
	let outputFileName = tmp.tmpNameSync({
		prefix: 'video-output-',
    postfix: '.mp4'
	});

	spec = _.defaults(spec, {
    silent: true,
    overwrite: null
  });

  function handleOverwrite() {
    switch (spec.overwrite) {
      case true:
        return '-y'
      case false:
        return '-n'
      default:
        return ''
    }
  }

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
   * @param  {string} args.fileList Address of a text file containing filenames of the clips
   * @return {[type]}      [description]
   */
  function concatClips(args) {
    const overwrite = handleOverwrite();

    return new Promise((resolve, reject) => {
      let ffmpeg = `${ffmpegPath} -f concat -safe 0 -protocol_whitelist file,http,https,tcp,tls,crypto -i ${args.fileList} -c copy ${outputFileName} ${overwrite}`;
      let child = exec(ffmpeg, (error, stdout, stderr) => {

        if (error)
        {
          reject();
        } else {
          resolve(outputFileName);
        }
      });
    });
  }

  function escapePath(pathString) {
    return pathString.replace(/\\/g, '\\\\');
  }

  function getLineForClip(clip) {
    return `file '${escapePath(clip.fileName)}'`;
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
