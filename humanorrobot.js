// Game data.
//
// TODO: load from an external JSON
const data = {
    "shakespeare": {
        "human": {
            "samples": Extracts['human']
        },
        "opponents": {
            "alpha": { "samples": Extracts['alpha'] },
            "bravo": { "samples": Extracts['bravo'] },
            "charlie": { "samples": Extracts['charlie'] },
            "delta": { "samples": Extracts['delta'] }
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
        'robot': 0,
        'opponents': {}
    },
    'gamesPlayed': {
        'human': 0,
        'opponents': {}
    }
};

// Mutable round state.
//
var round = {
    'ishuman': true,
    'opponent': null // Name of robot opponent
};


var newGame = function(game) {
    var initScore = 1000;

    state['game'] = game;
    state['round'] = 0;
    state['scores']['player'] = initScore;
    state['scores']['human'] = initScore;
    state['scores']['robot'] = initScore;

    // Populate opponent scores:
    state['scores']['opponents'] = {};
    for (var opponent in data[state['game']]['opponents']) {
        state['scores']['opponents'][opponent] = initScore;
    }

    state['gamesPlayed']['human'] = 0;
    state['gamesPlayed']['opponents'] = {};
    for (var opponent in data[state['game']]['opponents']) {
        state['gamesPlayed']['opponents'][opponent] = 0;
    }

    newRound(true);
};


var newRound = function(forceHuman) {
    state['round'] += 1;
    displayRound(state['round']);

    round['ishuman'] = forceHuman ? true : Math.random() < .5;

    var nextExtract = ''
    if (round['ishuman']) {
        var i = Math.floor(Math.random() * data[state['game']]['human']['samples'].length);
        nextExtract = [i];
        round['opponent'] = null;
    } else {
        var opponents = Object.keys(data[state['game']]['opponents']);

        // TODO: Non-uniform opponent selection
        var i = Math.floor(Math.random() * opponents.length);
        var opponent_name = opponents[i];
        var opponent = data[state['game']]['opponents'][opponent_name];
        round['opponent'] = opponent_name;

        // TODO: Remove sample from selection
        i = Math.floor(Math.random() * opponent['samples'].length);
        nextExtract = opponent['samples'][i];
    }
    $('#arena').html(nextExtract);

    var msg = 'New round! human: ' + round['ishuman'];
    if (!round['ishuman'])
        msg += ', opponent = ' + round['opponent'];
    console.log(msg);
};

var playerLostToHuman = function() {
    var newPlayerScore = Elo.getNewRating(state['scores']['player'], state['scores']['human'], 0);
    var newHumanScore = Elo.getNewRating(state['scores']['human'], state['scores']['player'], 1);

    state['scores']['player'] = newPlayerScore;
    state['scores']['human'] = newHumanScore;
    state['gamesPlayed']['human'] += 1;

    displayScores(state['scores']['player'],
                  state['scores']['human'],
                  state['scores']['robot']);
    displayIncorrect();
};

var playerWonAgainstHuman = function() {
    var newPlayerScore = Elo.getNewRating(state['scores']['player'], state['scores']['human'], 1);
    var newHumanScore = Elo.getNewRating(state['scores']['human'], state['scores']['player'], 0);

    state['scores']['player'] = newPlayerScore;
    state['scores']['human'] = newHumanScore;
    state['gamesPlayed']['human'] += 1;

    displayScores(state['scores']['player'],
                  state['scores']['human'],
                  state['scores']['robot']);
    displayCorrect();
};

var playerLostToRobot = function() {
    var newPlayerScore = Elo.getNewRating(
        state['scores']['player'], state['scores']['robot'], 0);
    var newRobotScore = Elo.getNewRating(
        state['scores']['robot'], state['scores']['player'], 1);
    var newOpponentScore = Elo.getNewRating(
        state['scores']['opponents'][round['opponent']],
        state['scores']['player'], 1);
    state['scores']['opponents'][round['opponent']] = newOpponentScore;

    state['scores']['player'] = newPlayerScore;
    state['scores']['robot'] = newRobotScore;
    state['gamesPlayed']['opponents'][round['opponent']] += 1;

    displayScores(state['scores']['player'],
                  state['scores']['human'],
                  state['scores']['robot']);
    displayIncorrect();
};

var playerWonAgainstRobot = function() {
    var newPlayerScore = Elo.getNewRating(
        state['scores']['player'], state['scores']['robot'], 1);
    var newRobotScore = Elo.getNewRating(
        state['scores']['robot'], state['scores']['player'], 0);
    var newOpponentScore = Elo.getNewRating(
        state['scores']['opponents'][round['opponent']],
        state['scores']['player'], 0);
    state['scores']['opponents'][round['opponent']] = newOpponentScore;

    state['scores']['player'] = newPlayerScore;
    state['scores']['robot'] = newRobotScore;
    state['gamesPlayed']['opponents'][round['opponent']] += 1;

    displayScores(state['scores']['player'],
                  state['scores']['human'],
                  state['scores']['robot']);
    displayCorrect();
};

var displayCorrect = function() {
    $('#incorrect').hide();
    $('#correct').show();
    $('#correct').fadeOut(1000);
};

var displayIncorrect = function() {
    $('#correct').hide();
    $('#incorrect').show();
    $('#incorrect').fadeOut(1000);
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

    console.log('Scores: ');
    console.log('    player = ' + state['scores']['player']);
    console.log('    human = ' + state['scores']['human'] + ' (' +
                state['gamesPlayed']['human'] +' rounds)');
    for (var opponent in data[state['game']]['opponents']) {
        console.log('    ' + opponent + ' = ' +
                    state['scores']['opponents'][opponent] + ' (' +
                    state['gamesPlayed']['opponents'][opponent] +' rounds)');
    }
};

$('#human').click(function() {
    if (round['ishuman'])
        playerWonAgainstHuman();
    else
        playerLostToRobot();
    newRound();
});

$('#robot').click(function() {
    if (round['ishuman'])
        playerLostToHuman();
    else
        playerWonAgainstRobot();
    newRound();
});


// TODO: Select from list.
newGame('shakespeare');
