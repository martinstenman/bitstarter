#!/user/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/
var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
	    var instr = infile.toString();
	    if(!fs.existsSync(instr)){
		console.log("%s does not exist. Exiting.", instr)
		process.exit(1);
	    }
    return instr;
};

 var response2htmlfile = function(result, response) {
      if (result instanceof Error) {
            console.error('Error: ' + util.format(response.message));
        } else {
            return result;
        }
    };
    
var cheerioHtmlFile = function(htmlfile){
    return cheerio.load(fs.readFileSync(htmlfile));
};
var loadChecks = function(checksfile){
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile){
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({})
};

var doStuff = function(file,checks){
    var checkJson = checkHtmlFile(file, checks);
    var outJson = JSON.stringify(checkJson,null,4);
    console.log(outJson);
}

var buildfn = function(url, checks) {
    var response2doStuff = function(result, response) {
        if (result instanceof Error) {
            console.error('Error: ' + util.format(response.message));
        } else {
            //console.error("Checked %s", url);
	    fs.writeFileSync('index2.html', result);
	    doStuff('index2.html',checks)
        }
    };
    return response2doStuff;
};

if(require.main == module){
    program
	.option('-c, --checks <check_file>','Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
	.option('-f, --file <html_file>','Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url>','URL to index.html')
	.parse(process.argv);
    
    if (program.url){
	//console.log(program.url);
	var url = program.url;
	var response2doStuff = buildfn(program.url, program.checks);
	rest.get(url).on('complete', response2doStuff);
	}else{
    var doStuff = doStuff(program.file, program.checks);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}

