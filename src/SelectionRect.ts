
//範囲選択
export class SelectionRect {
    public element: HTMLDivElement;

    private isSelecting: boolean = false;

    public beginX: number = 0;
    public beginY: number = 0;
    public endX: number = 0;
    public endY: number = 0;

    public onFinish: Function | null = null;

    constructor(element: HTMLDivElement) {
        this.element = element;
    }

    cancel() {
        this.element.style.visibility = "hidden";
        this.isSelecting = false;
    }

    getStartX(): number {
        return Math.min(this.beginX, this.endX);
    }

    getStartY(): number {
        return Math.min(this.beginY, this.endY);
    }

    getWidth(): number {
        return Math.abs(this.endX - this.beginX);
    }

    getHeight(): number {
        return Math.abs(this.endY - this.beginY);
    }

    show(x: number, y: number) {
        this.beginX = x;
        this.beginY = y;

        this.element.style.left = this.beginX + "px";
        this.element.style.top = this.beginY + "px";
        this.element.style.visibility = "visible";

        this.isSelecting = true;
    }

    move(x: number, y: number) {
        if (!this.isSelecting) {
            return;
        }
        this.endX = x;
        this.endY = y;
        this.element.style.left = this.getStartX() + "px";
        this.element.style.top = this.getStartY() + "px";
        this.element.style.width = this.getWidth() + "px";
        this.element.style.height = this.getHeight() + "px";
    }

    hide(x: number, y: number) {
        if (!this.isSelecting) {
            return;
        }
        if (this.getWidth() > 0 && this.getHeight() > 0) {
            if(this.onFinish)
            {
                this.onFinish();
            }
        }
        this.cancel();
    }
}
