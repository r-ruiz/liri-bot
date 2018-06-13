//Setting up the environment with all required files

require("dotenv").config();
var keys = require("./keys.js");
var fs = require("fs");
var Twitter = require("twitter");
var Spotify = require("node-spotify-api");
var inquirer = require("inquirer");
var request = require("request");
var twitterClient = new Twitter(keys.twitter);
var spotifyClient = new Spotify(keys.spotify);
var totalTweets = 20;
var twitterName = "Ruben_R";
var song = "";
var movie = "";
// for callback error when writing to file
const cb = (err) => { if(err) console.error(err); } 

// Allow the user to go back to the main menu
var tryAgain = function(){
    console.log(" ");
    console.log("--------------------------------\n");
    inquirer.prompt([
        {   type: "confirm",
            name: "attempt",
            message: "Would you like to return to the Choice Menu?"
        }
    ]).then(function(answer){
        
        var choice = answer.attempt;
        if (choice){
            selectOption();
        }
        else{
            console.log("Goodbye");
        }
    })
}

//Use inquirer to offer choices to the user
var selectOption = function(){
    console.log("\n----=:[ Choice Menu ]:=----\n");
    // Build a menu using inquirer package
    inquirer.prompt([
        {
            name: "options",
            type: "list",
            message: "Select what you would like to do:",
            choices: [
                "Tweets",
                "Spotify",
                "Movies",
                "Load-file",
                "Quit"
            ]
        }
    ]).then(function(answer){
        var choice = answer.options;

        // Run the function based on user input
        switch(choice){
            case "Tweets":
                console.log("----=:[ Twitter ]:=----\n");
                myTweets();
            break;

            case "Spotify":
                console.log("----=:[ Spotify ]:=----\n");
                mySong();
            break;

            case "Movies":
                console.log("----=:[ Movies ]:=---- \n");
                myMovie();
            break;

            case "Load-file":
                console.log(" ");
                console.log("Reading random.txt file");
                console.log("--------------------------------\n");
                myRandom();
            break;

            case "Quit":
                console.log("Goodbye");
            break;
        }
    })
}

function myTweets(){
    var counter = 1;
    //Display last 20 Tweets
    var params = {screen_name: twitterName, count: totalTweets};
    var showTweets = "";
    twitterClient.get("statuses/user_timeline", params, function(error, tweets){
        if(error){
            //add to log file
            fs.appendFile("log.txt", "----------------------------------------------------=:[ Error ]:=----------------------------------------------------\n", cb);
            fs.appendFile("log.txt", error + "\n", cb);
            return(error);
        }
        console.log(" ");
        console.log("Tweets by " + twitterName + ":");
        console.log("--------------------------------\n");
        for(var i = 0; i < tweets.length; i++){
            var date = tweets[i].created_at;
            var tweetList = "Tweet #"+ (counter+i) + " was created on " + date.substring(0, 19) + ": " + tweets[i].text;
            console.log(tweetList + "\n");
            showTweets += tweetList + "\n";
        }
        //add to log file
        fs.appendFile("log.txt", "----------------------------------------------------=:[ List of Tweets ]:=----------------------------------------------------\n", cb);
        fs.appendFile("log.txt", showTweets + "\n", cb);
        tryAgain();
    });
}

//Allow user to type the song of their choice
function mySong(){
    inquirer.prompt([
        {
            message: "Enter the song you want to look up:",
            type: "input",
            name: "song"
        }
    ]).then(function(answer){
        song = answer.song;
        // console.log("song selected: " + song);
        if (song === ""){
            song = "The Sign Ace Of Base";
        }
        spotifyStuff();
    })
}

//Allow user to type the movie of their choice
function myMovie() {
    // console.log("OMDB!");
    inquirer.prompt([
        {
            message: "Enter the movie you want to look up:",
            type: "input",
            name: "movie"
        }
    ]).then(function(answer){
        movie = answer.movie;
        // console.log("movie selected: " + movie);
        if (movie === ""){
            movie = "Mr. Nobody";
        }
        movieStuff();
    })
}

// Run a lookup using a file instead of user input
function myRandom(){
    // console.log("Random!");
    fs.readFile("./random.txt", (error, data) => {
		if (error) {
			throw error
		};
        // Grab the text and put it into an array  
        var randomText = data.toString().split(',');
        // set the choice type
        var choice = randomText[0];
        switch(choice){
            case "spotify":
                console.log("----=:[ Spotify ]:=----\n");
                song = randomText[1];
                spotifyStuff();
            break;

            case "film":
                console.log("----=:[ Movies ]:=---- \n");
                movie = randomText[1];
                movieStuff();
            break;
        }
    });
}

//Call Spotify API and perform a look up based on user/text input
function spotifyStuff(){
    spotifyClient.search({type: 'track', query: song}, function(error, data){
        if(!error){
            var songData = data.tracks.items[0];
            console.log(" ");
            console.log("Song information for '" + song + "':");
            console.log("--------------------------------\n");
            console.log("Artist: " + songData.artists[0].name);
            console.log("Song: " + songData.name);
            console.log("Album: " + songData.album.name);
            console.log("Preview URL: " + songData.preview_url);
        } 
        else {
            console.log('Error occurred.');
            fs.appendFile("log.txt", "----------------------------------------------------=:[ Error ]:=----------------------------------------------------\n", cb);
            fs.appendFile("log.txt", error + "\n", cb);
        }
         //add to log file
         fs.appendFile("log.txt", "----------------------------------------------------=:[ Song Info ]:=----------------------------------------------------\n", cb);
         fs.appendFile("log.txt", songData.artists[0].name + "\n", cb);
         fs.appendFile("log.txt", songData.name + "\n", cb);
         fs.appendFile("log.txt", songData.album.name + "\n", cb);
         fs.appendFile("log.txt", songData.preview_url + "\n", cb);
         tryAgain();
    });
}

//Call OMDB API and perfom a look up based on user/text input
function movieStuff(){
    var queryUrl = "http://www.omdbapi.com/?t=" + movie + "&apikey=trilogy&plot=full&tomatoes=true&r=json";
    // Use the Request Node Package to pull from the OMDB API
    request(queryUrl, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            console.log(" ");
            console.log("Movie information for '" + movie + "':");
            console.log("--------------------------------\n");
            console.log("Title: " + JSON.parse(body).Title);
            console.log("The move was released in " + JSON.parse(body).Year);
            console.log("The movie's IMDB rating is: " + JSON.parse(body).imdbRating);
            console.log("The movie's Rotten Tomatoes rating is: " + JSON.parse(body).Ratings[1].Value);
            console.log("County the movie was produced in: " + JSON.parse(body).Country);
            console.log("Movie language: " + JSON.parse(body).Language);
            console.log("Plot of the movie: " + JSON.parse(body).Plot);
            console.log("Actors: " + JSON.parse(body).Actors);

            //write to log.txt
            fs.appendFile("log.txt", "----------------------------------------------------=:[ Movie Info ]:=----------------------------------------------------\n", cb);
            fs.appendFile("log.txt", "Title: " + JSON.parse(body).Title + "\n", cb);
            fs.appendFile("log.txt", "The move was released in " + JSON.parse(body).Year + "\n", cb);
            fs.appendFile("log.txt", "The movie's IMDB rating is: " + JSON.parse(body).imdbRating + "\n", cb);
            fs.appendFile("log.txt", "The movie's Rotten Tomatoes rating is: " + JSON.parse(body).Ratings[1].Value + "\n", cb);
            fs.appendFile("log.txt", "County the movie was produced in: " + JSON.parse(body).Country + "\n", cb);
            fs.appendFile("log.txt", "Movie language: " + JSON.parse(body).Language + "\n", cb);
            fs.appendFile("log.txt", "Plot of the movie: " + JSON.parse(body).Plot + "\n", cb);
            fs.appendFile("log.txt", "Actors: " + JSON.parse(body).Actors + "\n", cb);
            tryAgain();
        } else {
            console.log("Error: "+ error);
            fs.appendFile("log.txt", "----------------------------------------------------=:[ Error ]:=----------------------------------------------------\n", cb);
            fs.appendFile("log.txt", error + "\n", cb);
        }
    })
}

selectOption();