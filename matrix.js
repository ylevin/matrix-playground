class Matrix {
    constructor(values) {
        this.values = values
    }

    translate(point) {
        return [
            this.translateX(point[0], point[1]),
            this.translateY(point[0], point[1])
        ]
    }

    translateX(x, y) {
        return this.values[0][0] * x + this.values[0][1] * y
    }

    translateY(x, y) {
        return this.values[1][0] * x + this.values[1][1] * y
    }

    set(matrix) {
        this.values = matrix.values
    }

    transpose() {
        let values = this.values;
        return new Matrix([
            [values[0][0], values[1][0]],
            [values[0][1], values[1][1]]
        ])
    }

    rotate(cos, sin) {
        let values = this.values;
        let x1 = values[0][0];
        let y1 = values[1][0];
        let x2 = values[0][1];
        let y2 = values[1][1];
        values[0][0] = x1 * cos - y1 * sin;
        values[1][0] = x1 * sin + y1 * cos;
        values[0][1] = x2 * cos - y2 * sin;
        values[1][1] = x2 * sin + y2 * cos
    }

    det() {
        let values = this.values;
        return values[0][0] * values[1][1] - values[1][0] * values[0][1]
    }

    dot(matrix) {
        let values = this.values;
        return new Matrix([
            [
                values[0][0] * matrix.values[0][0] + values[0][1] * matrix.values[1][0],
                values[0][0] * matrix.values[0][1] + values[0][1] * matrix.values[1][1]
            ], [
                values[1][0] * matrix.values[0][0] + values[1][1] * matrix.values[1][0],
                values[1][0] * matrix.values[0][1] + values[1][1] * matrix.values[1][1]
            ]
        ])
    }

    svd() {
        let a = this.values[0][0];
        let b = this.values[0][1];
        let c = this.values[1][0];
        let d = this.values[1][1];

        let f = a * a + b * b - c * c - d * d;

        let theta = Math.atan2(2 * a * c + 2 * b * d, f) / 2;
        let u = new Matrix([[Math.cos(theta), -Math.sin(theta)],
            [Math.sin(theta), Math.cos(theta)]]);

        let g = a * c + b * d;

        let s1 = a * a + b * b + c * c + d * d;
        let s2 = Math.sqrt(f * f + 4 * g * g);

        let sigma1 = Math.sqrt((s1 + s2) / 2);
        let sigma2 = Math.sqrt((s1 - s2) / 2);

        let sigma = new Matrix([[sigma1, 0], [0, sigma2]]);

        let phi = Math.atan2(2 * a * b + 2 * c * d, a * a - b * b + c * c - d * d) / 2;

        let s11 = (a * Math.cos(theta) + c * Math.sin(theta)) * Math.cos(phi) +
            (b * Math.cos(theta) + d * Math.sin(theta)) * Math.sin(phi);
        let s22 = (a * Math.sin(theta) + c * Math.cos(theta)) * Math.sin(phi) +
            (-b * Math.sin(theta) + d * Math.cos(theta)) * Math.cos(phi);

        let v = new Matrix([[Math.sign(s11) * Math.cos(phi), -Math.sign(s22) * Math.sin(phi)],
            [Math.sign(s11) * Math.sin(phi), Math.sign(s22) * Math.cos(phi)]]);

        return [u, sigma, v]
    }

    ed() {
        let a = this.values[0][0];
        let b = this.values[0][1];
        let c = this.values[1][0];
        let d = this.values[1][1];
        let t = a + d;
        let det = this.det();
        let sDet = t * t / 4 - det;
        let term = Math.sqrt(sDet);
        let l1 = t / 2 + term;
        let l2 = t / 2 - term;

        let ratio1 = 1;
        let ratio2 = 1;

        if (Math.abs(b) > Math.abs(c)) {
            ratio1 = b / (l1 - a);
            ratio2 = b / (l2 - a);
        } else {
            ratio1 = (l1 - d) / c;
            ratio2 = (l2 - d) / c;
        }

        let x1ev = 1 / Math.sqrt(1 + 1 / ratio1 / ratio1);
        let y1ev = x1ev / ratio1;
        let x2ev = 1 / Math.sqrt(1 + 1 / ratio2 / ratio2);
        let y2ev = x2ev / ratio2;

        let eVal = new Matrix([[l1, 0], [0, l2]]);
        let eVec = new Matrix([[x1ev, x2ev], [y1ev, y2ev]]);

        return [eVec, eVal]
    }

    inverse() {
        let a = this.values[0][0];
        let b = this.values[0][1];
        let c = this.values[1][0];
        let d = this.values[1][1];
        let det = this.det();
        return new Matrix([[d / det, -b / det], [-c / det, a / det]])
    }
}

const IDENTITY = new Matrix([[1, 0], [0, 1]]);