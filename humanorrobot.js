// Game data.
//
// TODO: load from an external JSON
const data = {
    "shakespeare": {
        "human": {
            "samples": human_extracts
        },
        "opponents": {
            "alpha": {
                "samples": robot_extracts
            }
        }
    }
};

// Mutable game state.
//
var state = {
    'game': null,
    'round': 0,  // round counter
    'scores': {
        'player': 0,
        'human': 0,
        'robot': 0
    }
}

// Mutable round state.
//
var round = {
    'ishuman': true,
}


var newGame = function(game) {
    state['game'] = game;
    state['round'] = 0;
    state['scores']['player'] = 1000;
    state['scores']['human'] = 1000;
    state['scores']['robot'] = 1000;
    newRound(true);
};


var newRound = function(forceHuman) {
    state['round'] += 1;
    displayRound(state['round']);

    round['isthuman'] = forceHuman ? true : Math.random() < .5;

    var nextExtract = ''
    if (round['isthuman']) {
        var i = Math.floor(Math.random() * human_extracts.length);
        nextExtract = human_extracts[i];
    } else {
        var opponents = Object.keys(data[state['game']]['opponents']);

        // TODO: Non-uniform opponent selection
        var i = Math.floor(Math.random() * opponents.length);
        var key = opponents[i];
        var opponent = data[state['game']]['opponents'][key];

        // TODO: Remove sample from selection
        i = Math.floor(Math.random() * opponent['samples'].length);
        nextExtract = opponent['samples'][i];
    }
    $('#arena').html(nextExtract);

    console.log('New game! human: ' + round['isthuman']);
};

var playerLostToHuman = function() {
    var newPlayerScore = Elo.getNewRating(state['scores']['player'], state['scores']['human'], 0);
    var newHumanScore = Elo.getNewRating(state['scores']['human'], state['scores']['player'], 1);

    state['scores']['player'] = newPlayerScore;
    state['scores']['human'] = newHumanScore;

    displayScores(state['scores']['player'], state['scores']['human'], state['scores']['robot']);
    displayIncorrect();
};

var playerWonAgainstHuman = function() {
    var newPlayerScore = Elo.getNewRating(state['scores']['player'], state['scores']['human'], 1);
    var newHumanScore = Elo.getNewRating(state['scores']['human'], state['scores']['player'], 0);

    state['scores']['player'] = newPlayerScore;
    state['scores']['human'] = newHumanScore;

    displayScores(state['scores']['player'], state['scores']['human'], state['scores']['robot']);
    displayCorrect();
};

var playerLostToRobot = function() {
    var newPlayerScore = Elo.getNewRating(state['scores']['player'], state['scores']['robot'], 0);
    var newRobotScore = Elo.getNewRating(state['scores']['robot'], state['scores']['player'], 1);

    state['scores']['player'] = newPlayerScore;
    state['scores']['robot'] = newRobotScore;

    displayScores(state['scores']['player'], state['scores']['human'], state['scores']['robot']);
    displayIncorrect();
};

var playerWonAgainstRobot = function() {
    var newPlayerScore = Elo.getNewRating(state['scores']['player'], state['scores']['robot'], 1);
    var newRobotScore = Elo.getNewRating(state['scores']['robot'], state['scores']['player'], 0);

    state['scores']['player'] = newPlayerScore;
    state['scores']['robot'] = newRobotScore;

    displayScores(state['scores']['player'], state['scores']['human'], state['scores']['robot']);
    displayCorrect();
};

var displayCorrect = function() {
    $('#incorrect').hide();
    $('#correct').show();
    $('#correct').fadeOut('slow');
};

var displayIncorrect = function() {
    $('#correct').hide();
    $('#incorrect').show();
    $('#incorrect').fadeOut('slow');
};

var displayRound = function(round) {
    $('#round-count').text(round);
};

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
    if (round['isthuman'])
        playerWonAgainstHuman();
    else
        playerLostToRobot();
    newRound();
});

$('#robot').click(function() {
    if (round['isthuman'])
        playerLostToHuman();
    else
        playerWonAgainstRobot();
    newRound();
});


// TODO: Select from list.
newGame('shakespeare');
