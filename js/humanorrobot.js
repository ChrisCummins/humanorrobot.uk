// Convert mode name into human-readable form.
var sanitizeModeName = function(mode, longName) {
    longName = longName || false;

    switch(mode) {
    case 'nitt':
        return longName ? 'Non-Interactive Turing Test ' : 'NITT';
    case 'abt':
        return longName ? 'A/B Test' : 'ABT';
    case 'aat':
        return longName ? 'A/A Test': 'AAT';
    case 'rabt':
        return longName ? 'Robot-only A/B Test' : 'RABT';
    case 'raat':
        return longName ? 'Robot-only A/A Test' : 'RABT';
    default:
        throw 'Unrecognised mode_id: ' + mode;
    }
};


var randomColorFactor = function() {
    return Math.round(Math.random() * 255);
};


var randomColor = function(opacity) {
    return 'rgba(' + randomColorFactor() + ','
        + randomColorFactor() + ',' + randomColorFactor() + ','
        + (opacity || '.3') + ')';
};


// Mutable game state.
//
var GameState = {
    'id': null, // game name
    'mode': null, // supported values: {nitt,abt,att,rabt,ratt}
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


//
// Given a list of opponent names, select the next opponent to compete
// against. The higher the opponent's score, the greater the chance of
// them being selected.
//
var nextOpponent = function(opponents) {
    opponents = opponents || Object.keys(GameState.data.opponents);
    var k, opponent, score;

    var sumScores = 0;
    for (k in opponents) {
        opponent = opponents[k];
        score = GameState.scores.opponents[opponent];
        sumScores += score * score;
    }

    var i = Math.floor(Math.random() * sumScores);
    var j = 0;
    for (k in opponents) {
        opponent = opponents[k];
        score = GameState.scores.opponents[opponent];
        j += score * score;
        if (j >= i)
            break;
    }

    return opponent;
};


var newRound_abt = function() {
    // console.log('DEBUG: newRound_abt()');

    var forcehumanisA = GameState.rounds_played.player === 0;
    var humanisA = forcehumanisA ? true : Math.random() < .5;
    GameState.round.humanisA = humanisA;

    var i = Math.floor(Math.random() * GameState.data.human.samples.length);
    var nextHumanExtract = GameState.data.human.samples[i];
    GameState.data.human.samples.splice(i, 1);

    var opponent_name = nextOpponent();
    GameState.round.opponent = opponent_name;

    var opponent = GameState.data.opponents[opponent_name];
    i = Math.floor(Math.random() * opponent.samples.length);
    var nextRobotExtract = opponent.samples[i];
    opponent.samples.splice(i, 1);

    var nextA = humanisA ? nextHumanExtract : nextRobotExtract;
    var nextB = humanisA ? nextRobotExtract : nextHumanExtract;

    $('#arena-a').html(nextA);
    $('#arena-b').html(nextB);

    console.log('New round! human on left: ' + humanisA +
                ', opponent = ' + opponent_name);
};


var newRound_rabt = function() {
    // console.log('DEBUG: newRound_rabt()');

    var opponents = Object.keys(GameState.data.opponents);

    // Opponent A:
    var opponentA_name = nextOpponent(opponents);
    GameState.round.opponentA = opponentA_name;
    var i = opponents.indexOf(opponentA_name);
    opponents.splice(i, 1);  // Remove opponent from list.
    var opponent = GameState.data.opponents[opponentA_name];

    // Extract A:
    i = Math.floor(Math.random() * opponent.samples.length);
    var opponentA_sample = opponent.samples[i];
    opponent.samples.splice(i, 1);
    GameState.round.extractA = opponentA_sample;

    // Opponent B:
    var opponentB_name = nextOpponent(opponents);
    GameState.round.opponentB = opponentB_name;
    opponent = GameState.data.opponents[opponentB_name];

    // Extract B:
    i = Math.floor(Math.random() * opponent.samples.length);
    var opponentB_sample = opponent.samples[i];
    opponent.samples.splice(i, 1);
    GameState.round.extractB = opponentB_sample;

    $('.rabt-arena-a').html(GameState.round.extractA);
    $('.rabt-arena-b').html(GameState.round.extractB);

    console.log('New round! left = ' + GameState.round.opponentA +
                ', right = ' + GameState.round.opponentB);
};


var newRound_nitt = function() {
    // console.log('DEBUG: newRound_nitt()');

    var forceHuman = GameState.rounds_played.player === 0;

    var ishuman = forceHuman ? true : Math.random() < .5;
    GameState.round.ishuman = ishuman

    if (ishuman) {
        var i = Math.floor(Math.random() * GameState.data.human.samples.length);
        GameState.round.extract = GameState.data.human.samples[i];
        GameState.data.human.samples.splice(i, 1);
        GameState.round.opponent = null;
    } else {
        var opponents = Object.keys(GameState.data.opponents);

        var opponent_name = nextOpponent();
        GameState.round.opponent = opponent_name;

        var opponent = GameState.data.opponents[opponent_name];
        i = Math.floor(Math.random() * opponent.samples.length);
        GameState.round.extract = opponent.samples[i];
        opponent.samples.splice(i, 1);
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
var endRound_nitt = function(btnId) {
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

    // console.log('DEBUG: endRound_nitt()');

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
        throw 'endRound_nitt(): unrecognised btn: ' + btnId;
    }
};


var endRound_abt = function(btnId) {
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

    // console.log('DEBUG: endRound_abt()');

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
        throw 'endRound_abt(): unrecognised btn: ' + btnId;
    }
};


var endRound_rabt = function(btnId) {
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

    // console.log('DEBUG: endRound_rabt()');

    var opA = GameState.round.opponentA;
    var opB = GameState.round.opponentB;

    if (btnId === 'is-a-btn') {
        var newAScore = Elo.getNewRating(
            GameState.scores.opponents[opA],
            GameState.scores.opponents[opB], 1);
        var newBScore = Elo.getNewRating(
            GameState.scores.opponents[opB],
            GameState.scores.opponents[opA], 0);
    } else if (btnId === 'is-b-btn') {
        var newAScore = Elo.getNewRating(
            GameState.scores.opponents[opA],
            GameState.scores.opponents[opB], 0);
        var newBScore = Elo.getNewRating(
            GameState.scores.opponents[opB],
            GameState.scores.opponents[opA], 1);
    } else {
        throw 'endRound_rabt(): unrecognised btn: ' + btnId;
    }

    GameState.scores.opponents[opA] = newAScore;
    GameState.scores.opponents[opB] = newBScore;

    GameState.rounds_played.opponents[opA] += 1;
    GameState.rounds_played.opponents[opB] += 1;

    return null; // Non-competitive game, no feedback to show.
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

    if (playerWon !== null) {
        var displayFeedback = playerWon ? displayCorrect : displayIncorrect;
        displayFeedback();
    }
    updateAnalytics();

    // TODO: Pause before proceeding to next round.
    newRound();
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


$('.game-end-rnd-btn').click(function() {
    endRound(this.id);
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


var newGame_nitt = function() {
    // console.log('DEBUG: newGame_nitt()');

    GameState.round.ishuman = true;
    GameState.round.opponent = null;
    GameState.round.extract = null;
};


var newGame_abt = function() {
    // console.log('DEBUG: newGame_abt()');

    GameState.round.humanisA = true;
    GameState.round.opponent = null;
    GameState.round.extractA = null;
    GameState.round.extractB = null;
};


var newGame_rabt = function() {
    // console.log('DEBUG: newGame_rabt()');

    GameState.round.opponentA = null;
    GameState.round.opponentB = null;
    GameState.round.extractA = null;
    GameState.round.extractB = null;
};


//
// Initialise analytics pane.
//
var initAnalytics = function() {
    var opponents = Object.keys(GameState.data.opponents).sort();

    //
    // Scores graph:
    //
    var datasets = [];
    for (var i = 0; i < opponents.length; i++) {
        datasets.push({
            label: opponents[i],
            data: [GameState.scores.opponents[opponents[i]]],
            fill: false
        });
    }
    var labels = [];
    for (var i = 0; i < datasets[0].data.length; i++)
        labels.push(i);

    window.ScoresConfig = {
        type: 'line',
        data: {
            labels: [],
            datasets: datasets
        },
        options: {
            responsive: true,
            legend: {
                display: false
                // position: 'top'
            },
            hover: {
                mode: 'label'
            },
            scales: {
                xAxes: [{
                    display: true,
                    scaleLabel: { display: false },
                    ticks: { display: false }
                }],
                yAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Score'
                    }
                }]
            },
            title: { display: false }
        }
    };

    var colors = [];
    $.each(window.ScoresConfig.data.datasets, function(i, dataset) {
        var background = randomColor(0.5);
        colors.push(background);
        dataset.borderColor = background;
        dataset.backgroundColor = background;
        dataset.pointBorderColor = background;
        dataset.pointBackgroundColor = background;
        dataset.pointBorderWidth = 1;
    });

    var ctx = $('.graph.scores');
    window.ScoresChart = new Chart(ctx, window.ScoresConfig);

    //
    // Rounds played graph:
    //
    var vals = [];
    for (var i = 0; i < opponents.length; i++)
        vals.push(0);

    window.RoundsConfig = {
        type: 'bar',
        data: {
            labels: opponents,
            datasets: [{
                label: 'Rounds played',
                data: vals,
                backgroundColor: colors[0] // TODO: Fix colors
            }]
        },
        options: {
            responsive: true,
            legend: {
                display: false
            },
            hover: {
                mode: 'label'
            },
            scales: {
                xAxes: [{
                    display: true,
                    scaleLabel: { display: false },
                    ticks: { display: true }
                }],
                yAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Rounds Played'
                    },
                    ticks: {
                        min: 0,
                        suggestedMax: 3
                    }
                }]
            },
            title: { display: false },
            animation: false
        }
    };

    var ctx = $('.graph.rounds-played');
    window.RoundsChart = new Chart(ctx, window.RoundsConfig);

    // for (i = 0; i < colors.length; i++)
};


//
// Update Analytics panel.
//
var updateAnalytics = function() {
    var opponents = Object.keys(GameState.data.opponents).sort();

    //
    // Scores graph:
    //
    var label = 'Round ' + GameState.rounds_played.player;
    window.ScoresConfig.data.labels.push(label);
    $.each(window.ScoresConfig.data.datasets, function(i, dataset) {
        var latest = GameState.scores.opponents[opponents[i]];
        dataset.data.push(latest);
    });
    window.ScoresChart.update();

    //
    // Rounds played graph:
    //
    var vals = [];
    for (var i = 0; i < opponents.length; i++) {
        vals.push(GameState.rounds_played.opponents[opponents[i]]);
    }

    window.RoundsConfig.data.datasets[0] = {
        label: 'Rounds played',
        data: vals
    };
    window.RoundsChart.update();
};


var newGame = function(game_id, mode) {
    // console.log('DEBUG: newGame()');

    game_id = game_id || 'shakespeare';
    mode = mode || 'nitt';

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

    // Set arena GUI formatting:
    $('.artifact').addClass(GameState.data.artifact_type);

    // Update GUI
    var modeSel = '.' + mode;
    $(modeSel).show();
    var preambleSel = modeSel + ' .preamble';
    $(preambleSel + ' .title').text(sanitizeModeName(mode, true));
    $(preambleSel + ' .data-src').text(GameState.data.data_src);
    $(preambleSel).show();

    initAnalytics();

    // Run mode-specific game set up, if there is one.
    var fn = window['newGame_' + mode];
    if (typeof fn === 'function')
        fn();
};
