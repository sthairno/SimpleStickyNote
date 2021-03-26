import { Path } from "./Path";

const PIdiv2 = Math.PI / 2;

/**
 * 点群の中心点,傾きを計算
 * @param x 中心点のx座標
 * @param y 中心点のy座標
 * @param deg X軸からの角度(-π/2~π/2)
 */
 function calcCenterAndDegree(path: Path, begin: number | null = null, end: number | null = null): [x: number, y: number, deg: number] {
    if (!begin) {
        begin = 0;
    }
    if (!end) {
        end = path.length - 1;
    }

    let sliced = path.slice(begin, end);

    let sum_XY = sliced.reduce((prev, current) => {
        return [prev[0] + current[0], prev[1] + current[1]];
    });
    let avg_X = sum_XY[0] / sliced.length, avg_Y = sum_XY[1] / sliced.length;

    let centered_XY = sliced.map((value) => {
        return [value[0] - avg_X, value[1] - avg_Y];
    });

    let avg_XmulY = centered_XY.map((value) => {
        return value[0] * value[1];
    }).reduce((prev, current) => {
        return prev + current;
    }) / centered_XY.length;

    let avg_X2 = centered_XY.map((value) => {
        return value[0] ** 2;
    }).reduce((prev, current) => {
        return prev + current;
    }) / centered_XY.length;

    //傾きが-1以上1以下の場合
    if (Math.abs(avg_XmulY) <= Math.abs(avg_X2)) {
        return [avg_X, avg_Y, Math.atan2(avg_XmulY, avg_X2)];
    }

    //それ以外の場合
    //傾きが無限大になる可能性があるため、X軸Y軸を置き換えて計算

    let avg_Y2 = centered_XY.map((value) => {
        return value[0] ** 2;
    }).reduce((prev, current) => {
        return prev + current;
    }) / centered_XY.length;

    return [avg_X, avg_Y, Math.atan2(avg_XmulY, avg_Y2)];
}

enum Axis {
    //水平
    Horizontal,
    //垂直
    Vertical
}

export class RectDetector {
    static readonly samplePathCnt: number = 30; //傾きを計算するサンプルの数
    static readonly stepPathCnt: number = 1; //移動量
    static readonly thresholdDegree: number = 0.16; //水平,垂直を判定する角度のしきい値
    static readonly rectPadding: number = 5; //検出した四角形のpadding

    private sides: [axis: Axis, cx: number, cy: number, deg: number][] = [];
    private nextAxis: Axis = -1;

    private checkHorizontalSlope(deg: number): boolean {
        return -RectDetector.thresholdDegree <= deg && deg <= RectDetector.thresholdDegree;
    }

    private checkVerticalSlope(deg: number): boolean {
        return (-PIdiv2 <= deg && deg <= -PIdiv2 + RectDetector.thresholdDegree) ||
            (PIdiv2 - RectDetector.thresholdDegree <= deg && deg <= PIdiv2);
    }

    private checkSlope(deg: number): boolean {
        switch (this.nextAxis) {
            case Axis.Horizontal:
                return this.checkHorizontalSlope(deg);
            case Axis.Vertical:
                return this.checkVerticalSlope(deg);
        }
        return false;
    }

    private changeNextAxis() {
        switch (this.nextAxis) {
            case Axis.Horizontal:
                this.nextAxis = Axis.Vertical;
                break;
            case Axis.Vertical:
                this.nextAxis = Axis.Horizontal;
                break;
        }
    }

    public detect(path: Path): [startX: number, startY: number, endX: number, endY: number] | null {
        //短すぎるパスは判定しない
        if (path.length < RectDetector.samplePathCnt * 4) {
            return null;
        }

        this.sides = [];
        let [cx, cy, deg] = calcCenterAndDegree(path, 0, RectDetector.samplePathCnt);
        if (this.checkHorizontalSlope(deg)) {
            this.sides.push([Axis.Horizontal, path.atX(0), path.atY(0), deg]);
            this.nextAxis = Axis.Vertical;
        }
        else if (this.checkVerticalSlope(deg)) {
            this.sides.push([Axis.Vertical, path.atX(0), path.atY(0), deg]);
            this.nextAxis = Axis.Horizontal;
        }
        else {
            return null;
        }

        for (let idx = RectDetector.stepPathCnt; idx < path.length; idx += RectDetector.stepPathCnt) {
            let [cx, cy, deg] = calcCenterAndDegree(path, idx, idx + RectDetector.samplePathCnt);
            if (this.checkSlope(deg)) {
                this.sides.push([this.nextAxis, path.atX(idx), path.atY(idx), deg]);
                if (this.sides.length >= 4) {
                    break;
                }
                this.changeNextAxis();
            }
        }
        if (this.sides.length < 4) {
            return null;
        }

        let result = path.reduce<[startX: number, startY: number, endX: number, endY: number]>((result, point) => {
            return [Math.min(result[0], point[0]), Math.min(result[1], point[1]), Math.max(result[2], point[0]), Math.max(result[3], point[1])];
        }, [Number.MAX_VALUE, Number.MAX_VALUE, Number.MIN_VALUE, Number.MIN_VALUE]);
        result[0] -= RectDetector.rectPadding;
        result[1] -= RectDetector.rectPadding;
        result[2] += RectDetector.rectPadding;
        result[3] += RectDetector.rectPadding;

        return result;
    }
}
