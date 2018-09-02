const BACKGROUND_COLOR = '#000';
const BASE_GRID_COLOR = '#00f';
const GRID_COLOR = '#090';
const CIRCLE_COLOR = '#bbb';
const X_VECTOR_COLOR = '#f6f';
const Y_VECTOR_COLOR = '#f66';

const UI_DISTANCE_THRESHOLD = 20;

const ARROW_SIZE = 10;
const ARROW_ANGLE = 30 * Math.PI / 180;
const ARROW_ANGLE_SIN = Math.sin(ARROW_ANGLE);
const ARROW_ANGLE_COS = Math.cos(ARROW_ANGLE);

function freeUpdateMatrix(matrix, id, lx, ly, dx, dy) {
    let values = matrix.values;
    values[0][id] += dx;
    values[1][id] += dy
}

function rotateUpdateMatrix(matrix, id, lx, ly, dx, dy) {
    let lenA = Math.hypot(lx, ly);
    let lenB = Math.hypot(lx + dx, ly + dy);
    matrix.rotate(lx / lenA, -ly / lenA);
    matrix.rotate((lx + dx) / lenB, (ly + dy) / lenB)
}

function scaleUpdateMatrix(matrix, id, lx, ly, dx, dy) {
    let scale = Math.hypot(dx + lx, dy + ly) / Math.hypot(lx, ly);
    matrix.values[0][id] = matrix.values[0][id] * scale;
    matrix.values[1][id] = matrix.values[1][id] * scale
}

class MatrixUI {
    constructor(matrix, max) {
        this.matrix = matrix;
        this.max = max;
        this.listeners = [];
        this.listenerId = 0;
        this.lock = false;
        this.updateMatrix = freeUpdateMatrix
    }

    addListener(onChange) {
        let listener = {};
        listener.id = this.listenerId++;
        listener.onChange = onChange;
        this.listeners.push(listener);
        return listener.id
    }

    removeListener(id) {
        for (let i = 0; i < this.listeners.length; i++) {
            if (this.listeners[i].id === id) {
                this.listeners.splice(i, 1);
                break
            }
        }
    }

    clearListeners() {
        this.listeners = []
    }

    setUpdateMatrixFn(fn) {
        this.updateMatrix = fn
    }

    onChange() {
        this.draw();
        this.lock = true;
        try {
            for (let i = 0; i < this.listeners.length; i++) {
                this.listeners[i].onChange()
            }
        } finally {
            this.lock = false
        }
    }

    set(matrix) {
        if (!this.lock) {
            this.matrix.set(matrix);
            this.onChange()
        }
    }

    setView(context, x, y, size) {
        this.context = context;
        this.pos = [x, y];
        this.size = size
    }

    draw() {
        let context = this.context;
        context.save();
        context.beginPath();
        context.rect(this.pos[0], this.pos[1], this.size, this.size);
        context.clip();
        context.fillStyle = BACKGROUND_COLOR;
        context.fillRect(this.pos[0], this.pos[1], this.size, this.size);
        context.lineWidth = 1;
        context.strokeStyle = BASE_GRID_COLOR;
        this.drawGrid(context, IDENTITY);
        context.strokeStyle = GRID_COLOR;
        this.drawGrid(context, this.matrix);
        context.strokeStyle = CIRCLE_COLOR;
        this.drawCircle(context, this.matrix);
        context.lineWidth = 3;
        context.strokeStyle = X_VECTOR_COLOR;
        this.drawVector(context, this.matrix.values[0][0],
            this.matrix.values[1][0]);
        context.strokeStyle = Y_VECTOR_COLOR;
        this.drawVector(context, this.matrix.values[0][1],
            this.matrix.values[1][1]);
        context.restore()
    }

    createCanvas(size) {
        this.canvas = document.createElement('canvas');
        this.applyCanvas(this.canvas, size);
        return this.canvas
    }

    applyCanvas(canvas, size) {
        canvas.width = size;
        canvas.height = size;
        let context = canvas.getContext('2d');
        this.setView(context, 0, 0, size);
        this.connectCanvas(canvas)
    }

    connectCanvas(canvas) {
        let ui = this;
        canvas.addEventListener('mousedown', function (e) {
            let x = e.pageX - this.offsetLeft;
            let y = e.pageY - this.offsetTop;
            ui.press(x, y)
        });

        canvas.addEventListener('mouseup', function () {
            ui.release()
        });

        canvas.addEventListener('mousemove', function (e) {
            let x = e.pageX - this.offsetLeft;
            let y = e.pageY - this.offsetTop;
            ui.move(x, y)
        })
    }

    press(x, y) {
        let localX = x - (this.pos[0] + this.size / 2);
        let localY = (this.pos[1] + this.size / 2) - y;
        let cellSize = this.size / this.max;

        let dist0 = Math.hypot(localX - this.matrix.values[0][0] * cellSize,
            localY - this.matrix.values[1][0] * cellSize);

        let dist1 = Math.hypot(localX - this.matrix.values[0][1] * cellSize,
            localY - this.matrix.values[1][1] * cellSize);

        if (dist0 < dist1 && dist0 < UI_DISTANCE_THRESHOLD) {
            this.selected = true;
            this.id = 0
        } else if (dist1 < dist0 && dist1 < UI_DISTANCE_THRESHOLD) {
            this.selected = true;
            this.id = 1
        }
        this.lastX = localX;
        this.lastY = localY
    }

    release() {
        this.selected = false
    }

    move(x, y) {
        let localX = x - (this.pos[0] + this.size / 2);
        let localY = (this.pos[1] + this.size / 2) - y;

        if (this.selected) {
            let cellSize = this.size / this.max;
            let lx = this.lastX / cellSize;
            let ly = this.lastY / cellSize;
            let dx = (localX - this.lastX) / cellSize;
            let dy = (localY - this.lastY) / cellSize;
            this.updateMatrix(this.matrix, this.id, lx, ly, dx, dy);
            this.onChange()
        }
        this.lastX = localX;
        this.lastY = localY
    }

    drawGrid(context, matrix) {
        let size = this.size;
        let cellSize = this.size / this.max;
        let halfSize = this.size / 2;
        let cx = this.pos[0] + halfSize;
        let cy = this.pos[1] + halfSize;

        context.beginPath();

        context.moveTo(cx + matrix.translateX(0, -size),
            cy - matrix.translateY(0, -size));
        context.lineTo(cx + matrix.translateX(0, size),
            cy - matrix.translateY(0, size));

        context.moveTo(cx + matrix.translateX(-size, 0),
            cy - matrix.translateY(-size, 0));
        context.lineTo(cx + matrix.translateX(size, 0),
            cy - matrix.translateY(size, 0));

        for (let i = 0; i <= this.max; i++) {
            let level = i * cellSize;
            context.moveTo(cx + matrix.translateX(level, -size),
                cy - matrix.translateY(level, -size));
            context.lineTo(cx + matrix.translateX(level, size),
                cy - matrix.translateY(level, size));

            context.moveTo(cx + matrix.translateX(-level, -size),
                cy - matrix.translateY(-level, -size));
            context.lineTo(cx + matrix.translateX(-level, size),
                cy - matrix.translateY(-level, size));

            context.moveTo(cx + matrix.translateX(-size, level),
                cy - matrix.translateY(-size, level));
            context.lineTo(cx + matrix.translateX(size, level),
                cy - matrix.translateY(size, level));

            context.moveTo(cx + matrix.translateX(-size, -level),
                cy - matrix.translateY(-size, -level));
            context.lineTo(cx + matrix.translateX(size, -level),
                cy - matrix.translateY(size, -level))
        }

        context.stroke()
    }

    drawCircle(context, matrix) {
        let count = this.size;
        let cellSize = this.size / this.max;
        let centerX = this.pos[0] + this.size / 2;
        let centerY = this.pos[1] + this.size / 2;
        let radStep = Math.PI * 2 / count;
        context.beginPath();
        context.moveTo(centerX + matrix.translateX(cellSize, 0),
            centerY - matrix.translateY(cellSize, 0));
        for (let i = 1; i <= count; i++) {
            let x = cellSize * Math.cos(radStep * i);
            let y = cellSize * Math.sin(radStep * i);
            context.lineTo(centerX + matrix.translateX(x, y),
                centerY - matrix.translateY(x, y))
        }
        context.closePath();
        context.stroke()
    }

    drawVector(context, vecX, vecY) {
        let cellSize = this.size / this.max;
        let centerX = this.pos[0] + this.size / 2;
        let centerY = this.pos[1] + this.size / 2;

        let sVecX = vecX * cellSize;
        let sVecY = vecY * cellSize;
        let sVecLen = Math.hypot(sVecX, sVecY);
        let nVecX = sVecX / sVecLen;
        let nVecY = sVecY / sVecLen;

        let arrowSize = Math.min(sVecLen, ARROW_SIZE);

        let arrowVecX1 = ARROW_ANGLE_COS * nVecX - ARROW_ANGLE_SIN * nVecY;
        let arrowVecY1 = ARROW_ANGLE_SIN * nVecX + ARROW_ANGLE_COS * nVecY;

        let arrowVecX2 = ARROW_ANGLE_COS * nVecX + ARROW_ANGLE_SIN * nVecY;
        let arrowVecY2 = -ARROW_ANGLE_SIN * nVecX + ARROW_ANGLE_COS * nVecY;

        arrowVecX1 *= arrowSize;
        arrowVecY1 *= arrowSize;
        arrowVecX2 *= arrowSize;
        arrowVecY2 *= arrowSize;

        context.beginPath();
        context.moveTo(centerX, centerY);
        context.lineTo(centerX + sVecX, centerY - sVecY);

        context.moveTo(centerX + sVecX - arrowVecX1, centerY - sVecY + arrowVecY1);
        context.lineTo(centerX + sVecX, centerY - sVecY);
        context.lineTo(centerX + sVecX - arrowVecX2, centerY - sVecY + arrowVecY2);

        context.stroke()
    }
}
