// Game data.
//
// TODO: load from an external JSON
const data = {
    "shakespeare": {
        "name": "Shakespeare or Robot?",
        "preamble": "In this game you will be shown a series of texts. Your goal is to determine, for each, whether the text came from a human (William Shakespeare) or a robot.",
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
    'opponent': null, // Name of robot opponent
    'extract': null
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
        nextExtract = data[state['game']]['human']['samples'][i];
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
    round['extract'] = nextExtract;
    $('#arena').html(round['extract']);

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

    displayIncorrect();
};

var playerWonAgainstHuman = function() {
    var newPlayerScore = Elo.getNewRating(state['scores']['player'], state['scores']['human'], 1);
    var newHumanScore = Elo.getNewRating(state['scores']['human'], state['scores']['player'], 0);

    state['scores']['player'] = newPlayerScore;
    state['scores']['human'] = newHumanScore;
    state['gamesPlayed']['human'] += 1;

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

    displayCorrect();
};

var endRound = function() {
    var giveaway = getGiveawayText();
    if (giveaway) {
        var idx = round['extract'].indexOf(giveaway);
        console.log('giveaway: ' + giveaway);
        console.log('STARTING AT: ' + idx);
    }

    // reset giveaway:
    document.getSelection().removeAllRanges();
    $('#giveaway').hide();

    displayScores(state['scores']['player'],
                  state['scores']['human'],
                  state['scores']['robot']);
};

var displayCorrect = function() {
    $('#correct').stop();
    $('#incorrect').stop();

    $('#incorrect').hide();
    $('#correct').show();
    $('#correct').css('opacity', 1.0);
    $('#correct').fadeOut(2000);
};

var displayIncorrect = function() {
    $('#correct').stop();
    $('#incorrect').stop();

    $('#correct').hide();
    $('#incorrect').show();
    $('#incorrect').css('opacity', 1.0);
    $('#incorrect').fadeOut(2000);
};

var getSelectionText = function() {
    var text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }
    return text;
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

// The giveaway

var getSelectedText = function() {
    var text = "";
    if (typeof window.getSelection != "undefined") {
        text = window.getSelection().toString();
    } else if (typeof document.selection != "undefined" && document.selection.type == "Text") {
        text = document.selection.createRange().text;
    }
    return text;
};

var getSelectionParentElement = function() {
    var parentEl = null, sel;
    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.rangeCount) {
            parentEl = sel.getRangeAt(0).commonAncestorContainer;
            if (parentEl.nodeType != 1)
                parentEl = parentEl.parentNode;
        }
    } else if ( (sel = document.selection) && sel.type != "Control") {
        parentEl = sel.createRange().parentElement();
    }

    return parentEl;
};

var getGiveawayText = function() {
    var parentEl = getSelectionParentElement();

    if (parentEl && parentEl.id === 'arena')
        return getSelectedText();
    else
        return null;
};

var giveawayPopoverCb = function() {
    var giveaway = getGiveawayText()
    if (giveaway) {
        $('#giveaway').css('display', 'block');
        $('#giveaway').css('position', 'absolute');
        $('#giveaway').css('left', event.clientX + 10);
        $('#giveaway').css('top', event.clientY + 15);
    } else {
        $('#giveaway').css('display', 'none');
    }
};

document.onmouseup = giveawayPopoverCb;
document.onkeyup = giveawayPopoverCb;


$('#human').click(function() {
    if (round['ishuman'])
        playerWonAgainstHuman();
    else
        playerLostToRobot();

    endRound();
    newRound();
});

$('#robot').click(function() {

    if (round['ishuman'])
        playerLostToHuman();
    else
        playerWonAgainstRobot();

    endRound();
    newRound();
});

$('#start').click(function() {
    $('.preamble').hide();
    $('.row.scoreboard').show();
    $('.arena').show();

    newGame('shakespeare');
});

var startGame = function(game) {
    $('.preamble .title').text(data[game]['name']);
    $('.preamble .intro').html(data[game]['preamble']);
};

startGame('shakespeare');
