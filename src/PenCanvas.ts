import { Path } from "./Path";

//ペン描画のキャンバス
export class PenCanvas {
    public static readonly penSize: number = 5;
    static readonly style: string = "rgba(10, 10, 10, 1)";
    static readonly minMove: number = 3; //パスを追加するときの最低移動量

    public element: HTMLCanvasElement;
    public ctx2d: CanvasRenderingContext2D;
    public penPath: Path = new Path();
    public onFinish: Function | null = null;

    private isDown: boolean = false;

    constructor(element: HTMLCanvasElement) {
        this.element = element;
        this.ctx2d = element.getContext('2d')!;
    }

    setSize(width: number, height: number)
    {
        this.element.width = width;
        this.element.height = height;
    }

    render() {
        this.ctx2d.beginPath();
        this.ctx2d.moveTo(this.penPath.atX(0), this.penPath.atY(1));
        this.penPath.forEach((pos, idx) => {
            if (idx == 0) {
                return;
            }
            this.ctx2d.lineTo(pos[0], pos[1]);
        });
        this.ctx2d.stroke();
    }

    down(x: number, y: number) {
        this.isDown = true;
        this.penPath.clear();
        this.penPath.pushXY(x, y);
        this.clear();
    }

    move(x: number, y: number) {
        if (!this.isDown) {
            return;
        }
        let prevPos = this.penPath[this.penPath.length - 1];
        if (Math.pow(x - prevPos[0], 2) + Math.pow(y - prevPos[1], 2) < Math.pow(PenCanvas.minMove, 2)) {
            return;
        }
        this.penPath.push([x, y]);
        this.clear();
        this.render();
    }

    up(x: number, y: number) {
        if (!this.isDown) {
            return;
        }
        if (this.penPath.length == 1) {
            this.penPath.clear();
            this.isDown = false;
            return;
        }
        this.penPath.push([x, y]);
        this.clear();
        this.render();

        if(this.onFinish)
        {
            this.onFinish();
        }

        this.cancel();
    }

    cancel() {
        this.clear();
        this.penPath.clear();
        this.isDown = false;
    }

    clear() {
        this.ctx2d.clearRect(0, 0, this.element.width, this.element.height);
    }
}
