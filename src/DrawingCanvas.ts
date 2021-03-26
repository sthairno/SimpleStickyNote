
//描画中のキャンバス
export class DrawingCanvas {
    public element: HTMLCanvasElement;
    public ctx2d: CanvasRenderingContext2D;

    constructor(element: HTMLCanvasElement) {
        this.element = element;
        this.ctx2d = element.getContext('2d')!;
    }

    setSize(width: number, height: number)
    {
        this.element.width = width;
        this.element.height = height;
    }

    clear() {
        this.ctx2d.clearRect(0, 0, this.element.width, this.element.height);
    }
}
