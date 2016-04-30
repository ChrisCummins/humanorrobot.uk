// Game data.
//
// TODO: load from an external JSON
const GameData = {
    "shakespeare": {
        "modes": ["tt", "h2h"],
        "name": "Shakespeare or Robot?",
        "data_src": "the writings of William Shakespeare",
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
var GameState = {
    'id': null, // game name
    'mode': null, // supported values: {tt,h2h}
    'data': null, // GameData[id]
    'scores': {
        'player': 0,
        'human': 0,
        'robot': 0,
        'opponents': {}
    },
    'rounds_played': {
        'player': 0,
        'human': 0,
        'opponents': {}
    },
    'round': {}  // mutable round state
};


var newRound_h2h = function() {
    // console.log('DEBUG: newRound_h2h()');

    var forcehumanisA = GameState.rounds_played.player === 0;
    var humanisA = forcehumanisA ? true : Math.random() < .5;

    var i = Math.floor(Math.random() * GameState.data.human.samples.length);
    var nextHumanExtract = GameState.data.human.samples[i];

    var opponents = Object.keys(GameState.data.opponents);

    // TODO: Non-uniform opponent selection
    i = Math.floor(Math.random() * opponents.length);
    var opponent_name = opponents[i];
    GameState.round.opponent = opponent_name;

    var opponent = GameState.data.opponents[opponent_name];
    i = Math.floor(Math.random() * opponent.samples.length);
    var nextRobotExtract = opponent.samples[i];

    var nextA = humanisA ? nextHumanExtract : nextRobotExtract;
    var nextB = humanisA ? nextRobotExtract : nextHumanExtract;

    $('#arena-a').html(nextA);
    $('#arena-b').html(nextB);

    console.log('New round! human on left: ' + humanisA +
                ', opponent = ' + opponent_name);
};


var newRound_tt = function() {
    // console.log('DEBUG: newRound_tt()');

    var forceHuman = GameState.rounds_played.player === 0;

    var ishuman = forceHuman ? true : Math.random() < .5;
    GameState.round.ishuman = ishuman

    // TODO: Remove selected extracts from data
    if (ishuman) {
        var i = Math.floor(Math.random() * GameState.data.human.samples.length);
        GameState.round.extract = GameState.data.human.samples[i];
        GameState.round.opponent = null;
    } else {
        var opponents = Object.keys(GameState.data.opponents);

        // TODO: Non-uniform opponent selection
        var i = Math.floor(Math.random() * opponents.length);
        var opponent_name = opponents[i];
        GameState.round.opponent = opponent_name;

        var opponent = GameState.data.opponents[opponent_name];
        i = Math.floor(Math.random() * opponent.samples.length);
        GameState.round.extract = opponent.samples[i];
    }
    $('#arena').html(GameState.round.extract);

    var msg = 'New round! human: ' + ishuman;
    if (!ishuman)
        msg += ', opponent = ' + GameState.round.opponent;
    console.log(msg);
};

var newRound = function() {
    // console.log('DEBUG: newRound()');

    // Update GUI:
    displayRound(GameState.rounds_played.player + 1);

    var fn = window['newRound_' + GameState.mode];
    if (typeof fn === 'function')
        fn();
};


//
// Updates game scores and rounds_played counters.
//
var endRound_tt = function(btnId) {
    var playerLostToHuman = function() {
        var newPlayerScore = Elo.getNewRating(GameState.scores.player,
                                              GameState.scores.human, 0);
        var newHumanScore = Elo.getNewRating(GameState.scores.human,
                                             GameState.scores.player, 1);

        GameState.scores.player = newPlayerScore;
        GameState.scores.human = newHumanScore;
        GameState.rounds_played.human += 1;

        return false;
    };

    var playerWonAgainstHuman = function() {
        var newPlayerScore = Elo.getNewRating(GameState.scores.player,
                                              GameState.scores.human, 1);
        var newHumanScore = Elo.getNewRating(GameState.scores.human,
                                             GameState.scores.player, 0);

        GameState.scores.player = newPlayerScore;
        GameState.scores.human = newHumanScore;
        GameState.rounds_played.human += 1;

        return true;
    };

    var playerLostToRobot = function() {
        var newPlayerScore = Elo.getNewRating(
            GameState.scores.player, GameState.scores.robot, 0);
        var newRobotScore = Elo.getNewRating(
            GameState.scores.robot, GameState.scores.player, 1);
        var newOpponentScore = Elo.getNewRating(
            GameState.scores.opponents[GameState.round.opponent],
            GameState.scores.player, 1);
        GameState.scores.opponents[GameState.round.opponent] = newOpponentScore;

        GameState.scores.player = newPlayerScore;
        GameState.scores.robot = newRobotScore;
        GameState.rounds_played.opponents[GameState.round.opponent] += 1;

        return false;
    };

    var playerWonAgainstRobot = function() {
        var newPlayerScore = Elo.getNewRating(
            GameState.scores.player, GameState.scores.robot, 1);
        var newRobotScore = Elo.getNewRating(
            GameState.scores.robot, GameState.scores.player, 0);
        var newOpponentScore = Elo.getNewRating(
            GameState.scores.opponents[GameState.round.opponent],
            GameState.scores.player, 0);
        GameState.scores.opponents[GameState.round.opponent] = newOpponentScore;

        GameState.scores.player = newPlayerScore;
        GameState.scores.robot = newRobotScore;
        GameState.rounds_played.opponents[GameState.round.opponent] += 1;

        return true;
    };

    // console.log('DEBUG: endRound_tt()');

    if (btnId === 'human') {
        if (GameState.round.ishuman)
            return playerWonAgainstHuman();
        else
            return playerLostToRobot();
    } else if (btnId === 'robot') {
        if (GameState.round.ishuman)
            return playerLostToHuman();
        else
            return playerWonAgainstRobot();
    } else {
        throw 'endRound_tt(): unrecognised btn: ' + btnId;
    }
};


var endRound_h2h = function(btnId) {
    var playerLost = function() {
        var newPlayerScore = Elo.getNewRating(
            GameState.scores.player, GameState.scores.robot, 0);
        var newRobotScore = Elo.getNewRating(
            GameState.scores.robot, GameState.scores.player, 1);
        var newOpponentScore = Elo.getNewRating(
            GameState.scores.opponents[GameState.round.opponent],
            GameState.scores.player, 1);
        GameState.scores.opponents[GameState.round.opponent] = newOpponentScore;

        GameState.scores.player = newPlayerScore;
        GameState.scores.robot = newRobotScore;
        GameState.rounds_played.opponents[GameState.round.opponent] += 1;

        return false;
    };

    var playerWon = function() {
        var newPlayerScore = Elo.getNewRating(
            GameState.scores.player, GameState.scores.robot, 1);
        var newRobotScore = Elo.getNewRating(
            GameState.scores.robot, GameState.scores.player, 0);
        var newOpponentScore = Elo.getNewRating(
            GameState.scores.opponents[GameState.round.opponent],
            GameState.scores.player, 0);
        GameState.scores.opponents[GameState.round.opponent] = newOpponentScore;

        GameState.scores.player = newPlayerScore;
        GameState.scores.robot = newRobotScore;
        GameState.rounds_played.opponents[GameState.round.opponent] += 1;

        return true;
    };

    // console.log('DEBUG: endRound_h2h()');

    if (btnId === 'is-a-btn') {
        if (GameState.round.humanisA)
            return playerLost();
        else
            return playerWon();
    } else if (btnId === 'is-b-btn') {
        if (GameState.round.humanisA)
            return playerWon();
        else
            return playerLost();
    } else {
        throw 'endRound_h2h(): unrecognised btn: ' + btnId;
    }
};

var endRound = function(/* ID of the button pressed: */btnId) {
    // console.log('DEBUG: endRound()');

    var giveaway = getGiveawayText();
    if (giveaway) {
        try {  // TODO: Get extract indices
            var idx = RoundState['extract'].indexOf(giveaway);
            console.log('giveaway: ' + giveaway);
            console.log('STARTING AT: ' + idx);
        } catch (err) {
            console.log(err);
        }
    }

    var fn = window['endRound_' + GameState.mode];
    if (typeof fn === 'function')
        var playerWon = fn(btnId);

    GameState.rounds_played.player += 1;

    // Reset giveaway:
    document.getSelection().removeAllRanges();
    $('#giveaway').hide();

    // Update GUI:
    displayScores(GameState.scores.player,
                  GameState.scores.human,
                  GameState.scores.robot);
    var displayFeedback = playerWon ? displayCorrect : displayIncorrect;
    displayFeedback();
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
    $('#round_count').text(round);
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
    console.log('    player = ' + GameState.scores.player);
    console.log('    human = ' + GameState.scores.human + ' (' +
                GameState.rounds_played.human + ' rounds)');
    for (var opponent in GameState.data.opponents) {
        console.log('    ' + opponent + ' = ' +
                    GameState.scores.opponents[opponent] + ' (' +
                    GameState.rounds_played.opponents[opponent] +' rounds)');
    }
};

// The giveaway

var getSelectedText = function() {
    var text = "";
    if (typeof window.getSelection != "undefined") {
        text = window.getSelection().toString();
    } else if (typeof document.selection != "undefined" &&
               document.selection.type == "Text") {
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

    if (parentEl && (parentEl.id === 'arena' ||
                     parentEl.id === 'arena-a' ||
                     parentEl.id === 'arena-b'))
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


$('#human, #robot, #is-a-btn, #is-b-btn').click(function() {
    endRound(this.id);
    newRound();
});


/*
 * Callback fired once a user presses the preamble 'start' button.
 */
$('.game-start-btn').click(function() {
    // Prepare GUI:
    $('.scoreboard').show();
    var modeSel = '.' + GameState.mode;
    $(modeSel + ' .preamble').hide();
    $(modeSel + ' .arena').show();

    newRound();
});


var newGame_tt = function() {
    // console.log('DEBUG: newGame_tt()');

    GameState.round.ishuman = true;
    GameState.round.opponent = null;
    GameState.round.extract = null;
};


var newGame_h2h = function() {
    // console.log('DEBUG: newGame_h2h()');

    GameState.round.humanisA = true;
    GameState.round.opponent = null;
    GameState.round.extractA = null;
    GameState.round.extractB = null;
};


var newGame = function(game_id, mode) {
    // console.log('DEBUG: newGame()');

    game_id = game_id || 'shakespeare';
    mode = mode || 'tt';

    // Hide game elements:
    $('.scoreboard, .preamble, .arena').hide();

    if (!GameData[game_id])
        throw 'Invalid game id: ' + game_id;
    if (GameData[game_id].modes.indexOf(mode) < 0)
        throw 'Invalid game mode: ' + mode;

    var initScore = 1000;

    // Create Game state:
    GameState = {
        'id': game_id,
        'mode': mode,
        'data': GameData[game_id],
        'scores': {
            'player': initScore,
            'human': initScore,
            'robot': initScore,
            'opponents': {}
        },
        'rounds_played': {
            'player': 0,
            'human': 0,
            'opponents': {}
        },
        'round': {}
    }

    for (var opponent in GameState.data.opponents) {
        GameState.scores.opponents[opponent] = initScore;
        GameState.rounds_played.opponents[opponent] = 0;
    }

    // Update GUI
    var preambleSel = '.' + mode + ' .preamble';
    $(preambleSel + ' .title').text(GameState.data.name);
    $(preambleSel + ' .data-src').text(GameState.data.data_src);
    $(preambleSel).show();

    // Run mode-specific game set up, if there is one.
    var fn = window['newGame_' + mode];
    if (typeof fn === 'function')
        fn();
};
