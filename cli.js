#!/usr/bin/env node
'use strict';

const meow = require('meow');
const exportGpx = require('./index');

const cli = meow(`
	Usage
    $ runtastic-gpx <json-export> <output> --tcx --gpx

	Examples
	  $ runtastic-gpx ~/Desktop/export-20190101-000 ~/Downloads/export
	  $ runtastic-gpx ~/Desktop/export-20190101-000
`);

if (cli.input.length === 0) {
  cli.showHelp();
} else {
  exportGpx(cli.input.map(path => path.replace(/\/$/, '')), cli.flags);
}
