
import express, { Application } from "express";
import * as core from "express-serve-static-core";

var app = express();

interface GameConfig {
    panelSize: { width: number, height: number }
    renderCli: boolean;
}

interface BallLocation {
    x: number;
    y: number;
}

interface BallMovement {
    x: number;
    y: number;
}

interface GameState {
    balls: { l: BallLocation, m: BallMovement }[];
    numDisplays: number;
    width: number;
    height: number;
}

interface PanelConfig {
    offsetX: number;
    offsetY: number;
}

const config: GameConfig = {
    panelSize: { width: 32, height: 9 },
    renderCli: false,
}

const addBall = () => {
    state.balls.push({
        l: {
            x: Math.floor(Math.random() * state.width),
            y: Math.floor(Math.random() * state.height),

        },
        m: {
            x: 1,
            y: 1
        }
    });
}
const state: GameState = {
    balls: [],
    numDisplays: 0,
    width: 0,
    height: 0
}

const isDisplaceable = (axis: 'x' | 'y', s: number, l: BallLocation, m: BallMovement) => {
    if (s > 0) {
        // positive movement possible?
        return l[axis] + m[axis] < (axis === 'x' ? state.width : state.height);
    } else {
        // negative movement possible?
        return l[axis] + m[axis] >= 0;
    }
}

const move = (axis: 'x' | 'y', l: BallLocation, m: BallMovement) => {
    var s = m[axis];
    var bounced = false;

    // find the largest increment to hit the wall
    while (!isDisplaceable(axis, s, l, m) && s != 0) {
        if (m[axis] > 0) {
            s--;
            bounced = true;
        } else if (m[axis] < 0) {
            s++;
            bounced = true;
        }
    }

    if (s == 0) {
        bounced = true;
    }

    // move
    l[axis] = l[axis] + s;

    if (bounced) {
        // flip direction
        m[axis] *= -1;
    }
}
const drawGame = () => {
    console.log("");

    var line = "";
    for (var x = 0; x < state.width + 2; x++) {
        line += "_";
    }
    console.log(line);

    for (var y = 0; y < state.height; y++) {
        line = "|";
        for (var x = 0; x < state.width; x++) {
            var hasBall = false;
            for (var b = 0; b < state.balls.length; b++) {
                if (x == state.balls[b].l.x && y === state.balls[b].l.y) {
                    hasBall = true;
                    break;
                }
            }
            line += hasBall ? "0" : ".";

        }
        line += "|";
        console.log(line);
    }

    line = "";
    for (var x = 0; x < state.width + 2; x++) {
        line += "-";
    }

    console.log(line);
}
const gameTick = () => {
    // move balls along axis if there are panels
    if (state.width && state.height) {
        state.balls.forEach(ball => {
            move('x', ball.l, ball.m);
            move('y', ball.l, ball.m);
        });
    }

    if (config.renderCli) {
        drawGame();
    }
}

app.get('/register', (req: core.Request, res: core.Response) => {

    // add panels from top to bottom
    const panelConfig: PanelConfig = {
        offsetX: 0,
        offsetY: config.panelSize.height * state.numDisplays
    }

    // resize screen
    state.width = config.panelSize.width;
    state.height += config.panelSize.height;

    state.numDisplays++;
    console.log("Registered display", state.numDisplays, "with", panelConfig);
    res.send(panelConfig);
});

app.get('/balls', (req: core.Request, res: core.Response) => {
    res.send(state.balls.map(locSpeed => locSpeed.l));
});

app.get('/addball', (req: core.Request, res: core.Response) => {
    addBall();
    res.send({ balls: state.balls.length });
});

app.get('/renderCli', (req: core.Request, res: core.Response) => {
    config.renderCli = !config.renderCli;
    res.send(config.renderCli);
});

addBall();

app.listen(4444, () => {
    console.log('goto: http://localhost:4444/balls');

    var interval = setInterval(() => gameTick(), 100);
});

