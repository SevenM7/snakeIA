var Direction = { UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3 };

var state = {
    pause: false,
    gameover: false
};

var config = {
    width: 800,
    height: 600
};

var configMap = {
    mapPosition: {
        x: 10,
        y: 10
    },
    size: {
        width: 50,
        height: 50
    },
    rectSize : 10
};

var snake = {
    size: 20,
    body: [{x: 10, y: 10}, {x: 11, y: 10}, {x: 12, y: 10}],
    direction: Direction.LEFT,
    velocity: 10,
    food : {
    },
    points : 0,
    brain : new BrainSnake()
};

var map = [];

var timeInit = Date.now();

function instanceGame() {
    // Instance Map

    snake.brain.init();
    snake.brain.mutation(0.3);

    for (let y = 0; y < configMap.size.height; y++) {
        map[y] = new Array(configMap.size.width)
    }

    generatorNewFood();
}

function init() {
    let canvas = document.getElementById('canvas');

    canvas.width = config.width;
    canvas.height = config.height;

    let context = canvas.getContext('2d');

    // event listener
    document.addEventListener('keydown', keydown);

    instanceGame();

    setInterval(function() {
        if (!state.pause) {
            if (snake.velocity++ > 5) {
                snake.velocity = 0;
                update(context);
            }
        }
    }, 1);

    setInterval(function () {
        draw(context)
    }, 1);
}

function keydown(event) {
    let moved = false;

    switch (event.keyCode) {
        case 32:
            state.pause = !state.pause;
            break;
        case 38:
            moved = moveSnake(Direction.UP);
            break;
        case 39:
            moved = moveSnake(Direction.RIGHT);
            break;
        case 37:
            moved = moveSnake(Direction.LEFT);
            break;
        case 40:
            moved = moveSnake(Direction.DOWN);
            break;
    }

    if (moved) {
        //change direction
        snake.velocity = 0;
        update();
    }
}

function moveSnake(direction) {
    if (snake.direction === direction) {
        return false
    }

    let notMoveWhen = {};

    notMoveWhen[Direction.DOWN] = Direction.UP;
    notMoveWhen[Direction.UP] = Direction.DOWN;
    notMoveWhen[Direction.RIGHT] = Direction.LEFT;
    notMoveWhen[Direction.LEFT] = Direction.RIGHT;

    if (notMoveWhen[direction] !== snake.direction) {
        snake.direction = direction;
        return true
    }

    return false;
}

function update() {
    if(state.gameover) {
        return
    }

    callBrain();

    let bodyBackup = [];

    for (let i in snake.body) {
        let part = snake.body[i];
        bodyBackup[i] = { x: part.x, y: part.y };
    }


    for (let i = snake.body.length - 1; i > 0; i--) {
        snake.body[i].x = snake.body[i - 1].x;
        snake.body[i].y = snake.body[i - 1].y;
    }

    switch (snake.direction) {
        case Direction.UP:
            snake.body[0].y--;
            break;
        case Direction.DOWN:
            snake.body[0].y++;
            break;
        case Direction.RIGHT:
            snake.body[0].x++;
            break;
        case Direction.LEFT:
            snake.body[0].x--;
            break;
    }

    if (colisitionFood()) {
        generatorNewFood();
        incrementSnake();
    }

    if (colisitionCheck()) {
        state.gameover = true;
        snake.body = bodyBackup;
        console.log('Game Over!!!')
    }
}

function resetGame() {
    snake.body = [{x: 10, y: 10}, {x: 11, y: 10}, {x: 12, y: 10}];
    snake.direction = Direction.LEFT;
    state.gameover = false;
    generatorNewFood();
}

function muteSnake() {
    snake.brain.mutation(0.2);
    snake.brain.reset();
    resetGame();
}

function callBrain() {
    snake.brain.input[0].value = Date.now();
    snake.brain.input[1].value = snake.body[0].x;
    snake.brain.input[2].value = snake.body[0].y;
    snake.brain.input[3].value = snake.food.x;
    snake.brain.input[4].value = snake.food.y;
    snake.brain.input[4].value = snake.direction

    snake.brain.processInput();

    let outputs = snake.brain.getOutput();

    console.log(outputs)

    if (outputs[0] < 1) {
        if (moveSnake(Direction.DOWN)) {
            return;
        }
    }

    if (outputs[0] >= 1) {
        if (moveSnake(Direction.UP)) {
            return;
        }
    }

    if (outputs[1] < 1) {
        if (moveSnake(Direction.RIGHT)) {
            return;
        }
    }

    if (outputs[1] >= 1) {
        if (moveSnake(Direction.LEFT)) {
            return;
        }
    }
}

function colisitionCheck() {
    // check colisition with self body
    for (let i = 2; i < snake.body.length; i++) {
        if (snake.body[i].x === snake.body[0].x
            && snake.body[i].y === snake.body[0].y) {
            return true;
        }
    }

    return (snake.body[0].x >= configMap.size.width)
        || (snake.body[0].y >= configMap.size.height)
        || (snake.body[0].x < 0
        || (snake.body[0].y < 0));
}

function colisitionFood() {
    for (let i in snake.body) {
        let part = snake.body[i];

        if (part.x === snake.food.x && part.y === snake.food.y) {
            return true
        }
    }

    return false
}

function getTime() {
    return Date.now() - timeInit;
}

function generatorNewFood() {
    let x = (Math.random() * configMap.size.width) >> 0;
    let y = (Math.random() * configMap.size.height) >> 0;

    snake.food = {x, y};

    if (colisitionFood()) {
        generatorNewFood();
    }
}

function incrementSnake() {
    let lastPart = snake.body[snake.body.length - 1];
    snake.body.push({x: lastPart.x, y: lastPart.y});
}

function draw(context) {
    context.fillStyle = 'black';
    context.fillRect(0, 0, config.width, config.height);

    drawMap(context);
    drawSnake(context);
    drawFood(context);
}

function drawSnake(context) {
    for (let i in snake.body) {
        let part = snake.body[i];

        context.fillStyle = 'gray';
        let x = configMap.mapPosition.x + (part.x * configMap.rectSize);
        let y = configMap.mapPosition.y + (part.y * configMap.rectSize);
        context.fillRect(x + 1, y + 1, configMap.rectSize - 2, configMap.rectSize - 2)
    }
}

function drawFood(context) {
    context.fillStyle = 'blue';
    let x = configMap.mapPosition.x + (snake.food.x * configMap.rectSize);
    let y = configMap.mapPosition.y + (snake.food.y * configMap.rectSize);
    context.fillRect(x + 1, y + 1, configMap.rectSize - 2, configMap.rectSize - 2)
}

function drawMap(context) {
    context.strokeStyle = 'red';

    context.strokeRect(
        configMap.mapPosition.x,
        configMap.mapPosition.y,
        configMap.size.width * configMap.rectSize,
        configMap.size.height * configMap.rectSize
    );
}

init();

var limitCall = 200;
var callSize = 0;

function BrainSnake() {
    this.input = [

    ];

    this.hidden = [

    ];

    this.output = [

    ];

    function init() {
        this.input = [];

        for (let i = 0; i < 6; i++) {
            this.input[i] = new Neuros()
        }

        this.hidden = [];

        for (let i = 0; i < 1000; i++) {
            this.hidden[i] = new Neuros();
        }

        this.output = [];

        for (let i = 0; i < 2; i++) {
            this.output[i] = new Neuros()
        }
    }
    
    function mutation(rate) {
        // input
        this.input.forEach((neuros) => {
            if (Math.random() > rate) {
                return;
            }

            let connection = randomConnection();
            connection.node = this.hidden[(Math.random() * this.hidden.length) << 0];

            neuros.connections.push(connection)
        });

        // hidden
        this.hidden.forEach((neuros) => {
            if (Math.random() > rate) {
                return;
            }

            let connection = randomConnection();
            connection.node = this.hidden[(Math.random() * this.hidden.length) << 0];

            neuros.connections.push(connection)
        });

        this.output.forEach((neuros) => {
            if (Math.random() > rate) {
                return;
            }

            let connection = randomConnection();
            connection.node = neuros;
            this.hidden[(Math.random() * this.hidden.length) << 0].connections.push(connection)
        });

        this.input[(Math.random() * this.input.length) << 0].connections.filter(() => Math.random() <= 0.9 );
        this.hidden[(Math.random() * this.hidden.length) << 0].connections.filter(() => Math.random() <= 0.8 );
    }

    function randomConnection() {
        let connection = new Connection();
        connection.constante = (Math.random() * 2) - 1;
        connection.sign = (Math.random() * 4) << 0;

        return connection;
    }

    function processInput() {
        callSize = 0;
        this.input.forEach((neuros) => {
            neuros.processConnections();
        });
    }

    function reset() {
        this.input.forEach((neuros) => {
            neuros.value = 0
        });

        this.hidden.forEach((neuros) => {
            neuros.value = 0
        });

        this.output.forEach((neuros) => {
            neuros.value = 0
        });
    }

    function getOutput() {
        let outvar = [];

        this.output.forEach((neuros) => {
            outvar.push(sigmoid(neuros.value))
        });

        return outvar;
    }

    this.getOutput = getOutput;
    this.init = init;
    this.processInput = processInput;
    this.mutation = mutation;
    this.reset = reset;

}

function sigmoid(t) {
    return Math.exp(-t);
}


function Connection() {
    this.node = null;
    this.constante = 1;
    this.sign = 0;
}

function Neuros() {
    this.value = 0;
    this.connections = [];

    function processConnections() {
        let value = this.value;

        this.connections.forEach((connection) => {
            switch (connection.sign) {
                case 0:
                    connection.node.value += value + connection.constante;
                    break;

                case 1:
                    connection.node.value -= value + connection.constante;
                    break;

                case 2:
                    connection.node.value *= value + connection.constante;
                    break;

                case 3:
                    connection.node.value /= value + connection.constante;
                    break;
            }

            if (isNaN(connection.node.value) || !isFinite(connection.node.value)) {
                connection.node.value = 0;
            }

            if (connection.node.value === 0 || callSize++ >= limitCall) {
                return;
            }

            connection.node.processConnections();
        })
    }

    this.processConnections = processConnections;
}

document.getElementById('mutate').addEventListener('click', muteSnake)
document.getElementById('reset').addEventListener('click', resetGame)