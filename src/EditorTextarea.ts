
//キー入力テキストボックス
export class EditorTextarea {
    public element: HTMLTextAreaElement;

    public x: number = 0;
    public y: number = 0;

    public onFinish: Function | null = null;

    constructor(element: HTMLTextAreaElement) {
        this.element = element;
    }

    show(x: number, y: number) {
        this.x = x;
        this.y = y;

        this.element.style.left = x + "px";
        this.element.style.top = y + "px";
        this.element.style.visibility = "visible";
        this.element.value = "";

        this.element.focus();
    }

    hide() {
        if(this.onFinish)
        {
            this.onFinish();
        }
        this.cancel();
    }

    cancel() {
        this.element.style.visibility = "hidden";
        this.element.value = "";
    }
}
