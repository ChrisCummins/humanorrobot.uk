var round = 0;
var ishuman = true;
var scorePlayer = 1000;
var scoreHuman = 1000;
var scoreRobot = 1000;

// GUI:

var updateScores = function(opponentIsHuman, playerWon) {
    if (opponentIsHuman) {
        var newPlayerScore = Elo.getNewRating(scorePlayer, scoreHuman,
                                              playerWon ? 1 : 0);
        var newHumanScore = Elo.getNewRating(scoreHuman, scorePlayer,
                                             playerWon ? 0 : 1);
        var newRobotScore = scoreRobot;
    } else {
        var newPlayerScore = Elo.getNewRating(scorePlayer, scoreRobot,
                                              playerWon ? 1 : 0);
        var newHumanScore = scoreHuman;
        var newRobotScore = Elo.getNewRating(scoreRobot, scorePlayer,
                                             playerWon ? 0 : 1);
    }

    scorePlayer = newPlayerScore;
    scoreHuman = newHumanScore;
    scoreRobot = newRobotScore;

    displayScores(scorePlayer, scoreHuman, scoreRobot);
};

var newGame = function(forceHuman) {
    round += 1;
    displayRound(round);

    ishuman = forceHuman ? true : Math.random() < .5;

    var nextExtract = ''
    if (ishuman) {
        var i = Math.floor(Math.random() * human_extracts.length);
        nextExtract = human_extracts[i];
    } else {
        var i = Math.floor(Math.random() * robot_extracts.length);
        nextExtract = robot_extracts[i];
    }
    $('#arena').html(nextExtract);

    console.log('New game! human: ' + ishuman);
};

var playerLostToHuman = function() {
    var newPlayerScore = Elo.getNewRating(scorePlayer, scoreHuman, 0);
    var newHumanScore = Elo.getNewRating(scoreHuman, scorePlayer, 1);

    scorePlayer = newPlayerScore;
    scoreHuman = newHumanScore;

    displayScores(scorePlayer, scoreHuman, scoreRobot);
};

var playerWonAgainstHuman = function() {
    var newPlayerScore = Elo.getNewRating(scorePlayer, scoreHuman, 1);
    var newHumanScore = Elo.getNewRating(scoreHuman, scorePlayer, 0);

    scorePlayer = newPlayerScore;
    scoreHuman = newHumanScore;

    displayScores(scorePlayer, scoreHuman, scoreRobot);
};

var playerLostToRobot = function() {
    var newPlayerScore = Elo.getNewRating(scorePlayer, scoreRobot, 0);
    var newRobotScore = Elo.getNewRating(scoreRobot, scorePlayer, 1);

    scorePlayer = newPlayerScore;
    scoreRobot = newRobotScore;

    displayScores(scorePlayer, scoreHuman, scoreRobot);
};

var playerWonAgainstRobot = function() {
    var newPlayerScore = Elo.getNewRating(scorePlayer, scoreRobot, 1);
    var newRobotScore = Elo.getNewRating(scoreRobot, scorePlayer, 0);

    scorePlayer = newPlayerScore;
    scoreRobot = newRobotScore;

    displayScores(scorePlayer, scoreHuman, scoreRobot);
};

// Game logic:

var displayRound = function(round) {
    $('#round-count').text(round);
}

var displayScores = function(scorePlayer, scoreHuman, scoreRobot) {
    $('#score-player').text(scorePlayer);
    // $('#score-human').text(scoreHuman);
    $('#score-robot').text(scoreRobot);

    if (scorePlayer > scoreRobot) {
        $('#score-player').addClass('winning');
        $('#score-player').removeClass('losing');

        $('#score-robot').addClass('losing');
        $('#score-robot').removeClass('winning');
    } else if (scorePlayer < scoreRobot) {
        $('#score-player').addClass('losing');
        $('#score-player').removeClass('winning');

        $('#score-robot').addClass('winning');
        $('#score-robot').removeClass('losing');
    } else {
        $('#score-player').removeClass('winning');
        $('#score-player').removeClass('losing');

        $('#score-robot').removeClass('winning');
        $('#score-robot').removeClass('losing');
    }

    console.log(scorePlayer, scoreHuman, scoreRobot);
};

$('#human').click(function() {
    if (ishuman)
        playerWonAgainstHuman();
    else
        playerLostToRobot();
    newGame();
});

$('#robot').click(function() {
    if (ishuman)
        playerLostToHuman();
    else
        playerWonAgainstRobot();
    newGame();
});

newGame(true);
