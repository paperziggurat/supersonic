//TODO: Package dependencies, including NPM stuff and mplayer
var blessed = require('blessed');
var request = require('request');
var fs = require('fs');
var sys = require('sys');
var exec = require('child_process').exec;
var reqload  = {
        u: process.argv[2],
        p: process.argv[3],
        v: '1.10.2',
        c: 'cliplayer',
        f: 'json'
};

var host = ''; //This is just the IP at which my stream was located.  Will differ until static is set up.
var artists = [];

var screen = blessed.screen();
var box = blessed.box({
    top: 'center',
    left: 'center',
    width: '50%',
    height: '20%',
    content: '',
    tags: true,
    border: {
        type: 'line'
    },
    style: {
	fg: 'white',
        bg: 'black',
        border: {
	    fg: '#f0f0f0'
	},
        hover: {
	    bg: 'green'
	}
    }
});

function main(){
    populateIndexes();  
}

function getNowPlaying(){ 
    request({	
        method: 'POST',
    	uri: 'http://' + host + ':4040/rest/getNowPlaying.view',
        form: reqload
    }, function(error, response, body){
	       var bodyfinal = JSON.parse(body);
	       box.insertLine(1, bodyfinal['subsonic-response'].nowPlaying['entry'].artist + " - " + bodyfinal['subsonic-response'].nowPlaying['entry'].title);
	       screen.render();
	});
}

function getMusicDirectory(){
    reqload.id = '3';
    request({
        method: 'POST',
        uri: 'http://' + host + ':4040/rest/getMusicDirectory.view',
        form: reqload
    }, function(error, response, body){
        console.log(body);
    });
}


function populateIndexes(){
    request({
        method: 'POST',
        uri: 'http://' + host + ':4040/rest/getIndexes.view',
        form: reqload,
    }, function(error, response, body){
        //console.log(body);
        var bodyfinal = JSON.parse(body);
        var groups = bodyfinal['subsonic-response'].indexes['index'];
        for (group in groups){ //Get group first letter from each artist group in library
            console.log(groups[group].name);
            //TODO: Add artist from each group name into artist array
        }
    });
}

function openStream(id, callback){
    reqload.id = id;
    request({
        method: 'POST',
        uri: 'http://' + host + ':4040/rest/stream.view',
        form: reqload,
    }, function(error, response, body){
           exec('mkfifo /tmp/fifo', puts); //Create named pipe file that mplayer can target
    }).pipe(fs.createWriteStream('tmp/fifo'));
    setTimeout(callback, 3000);
}

//TODO: Run mplayer in slave mode
function play(){
    exec('mplayer tmp/fifo', puts); //Point mplayer to play from named pipe
}

screen.append(box);
screen.render();
//openStream(13, play);

screen.key(['escape', 'q', 'C-c'], function(ch, key){
    return process.exit(0);
});

function puts(error, stdout, stderr){
    sys.puts(stdout)
}

main();




