import $ from "jquery";

let canvasWidth = 100;
let canvasHeight = 100;

//描画中のキャンバス
class DrawingCanvas {
    public element: HTMLCanvasElement;
    public ctx2d: CanvasRenderingContext2D;

    constructor(element: HTMLCanvasElement) {
        this.element = element;
        this.ctx2d = element.getContext('2d')!;
    }

    clear() {
        this.ctx2d.clearRect(0, 0, canvasWidth, canvasHeight);
    }
}
let drawingCanvas: DrawingCanvas;
$(function () {
    drawingCanvas = new DrawingCanvas(<HTMLCanvasElement>document.getElementById('drawing-canvas'));
});

//ペン描画のキャンバス
class PenCanvas {
    public static readonly penSize: number = 5;
    static readonly style: string = "rgba(10, 10, 10, 1)";
    static readonly minMove: number = 5; //パスを追加するときの最低移動量

    public element: HTMLCanvasElement;
    public ctx2d: CanvasRenderingContext2D;

    private isDown: boolean = false;
    private penPath: [x: number, y: number][] = [];

    constructor(element: HTMLCanvasElement) {
        this.element = element;
        this.ctx2d = element.getContext('2d')!;
    }

    render() {
        this.ctx2d.beginPath();
        this.ctx2d.moveTo(this.penPath[0][0], this.penPath[0][1]);
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
        this.penPath = [[x, y]];
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
            this.penPath = [];
            this.isDown = false;
            return;
        }
        this.penPath.push([x, y]);
        this.clear();
        this.render();

        penCanvasFinish();

        this.cancel();
    }

    cancel() {
        this.clear();
        this.penPath = [];
        this.isDown = false;
    }

    clear() {
        this.ctx2d.clearRect(0, 0, canvasWidth, canvasHeight);
    }
}
let penCanvas: PenCanvas;
$(function () {
    penCanvas = new PenCanvas(<HTMLCanvasElement>document.getElementById('pen-canvas'));
});

//キー入力テキストボックス
class EditorTextarea {
    public element: HTMLTextAreaElement;

    public x: number = 0;
    public y: number = 0;

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
        editorTextareaFinish();
        this.cancel();
    }

    cancel() {
        this.element.style.visibility = "hidden";
        this.element.value = "";
    }
}
let editorTextarea: EditorTextarea;
$(function () {
    editorTextarea = new EditorTextarea(<HTMLTextAreaElement>document.getElementById('editor-textarea'));
});

$("#editor-textarea")
    .on("keydown", function (e) {
        if ((e.ctrlKey || e.shiftKey) && e.key == "Enter") {
            e.preventDefault();
            editorTextarea.hide();
        }
    });

$("textarea.autosize")
    .height(30)//init
    .css("lineHeight", "20px")//init
    .on("input", function (e) {
        if (e.target.scrollHeight > e.target.offsetHeight) {
            $(e.target).height(e.target.scrollHeight);
        } else {
            var lineHeight = Number($(e.target).css("lineHeight").split("px")[0]);
            while (true) {
                $(e.target).height($(e.target).height()! - lineHeight);
                if (e.target.scrollHeight > e.target.offsetHeight) {
                    $(e.target).height(e.target.scrollHeight);
                    break;
                }
            }
        }
    });

//範囲選択
class SelectionRect {
    public element: HTMLDivElement;

    private isSelecting: boolean = false;

    public beginX: number = 0;
    public beginY: number = 0;
    public endX: number = 0;
    public endY: number = 0;

    constructor(element: HTMLDivElement) {
        this.element = element;
    }

    cancel() {
        this.element.style.visibility = "hidden";
        this.isSelecting = false;
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
        if(!this.isSelecting)
        {
            return;
        }
        this.endX = x;
        this.endY = y;
        this.element.style.left = Math.min(this.beginX, this.endX) + "px";
        this.element.style.top = Math.min(this.beginY, this.endY) + "px";
        this.element.style.width = Math.abs(this.endX - this.beginX) + "px";
        this.element.style.height = Math.abs(this.endY - this.beginY) + "px";
    }

    hide(x: number, y: number) {
        if(!this.isSelecting)
        {
            return;
        }
        selectionRectFinish();
        this.cancel();
    }
}
let selectionRect: SelectionRect;
$(function () {
    selectionRect = new SelectionRect(<HTMLDivElement>document.getElementById('selection-rect'));
});

//ペン入力終了時
function penCanvasFinish() {
    drawingCanvas.ctx2d.drawImage(penCanvas.element, 0, 0);
}

//テキストボックス入力終了時
function editorTextareaFinish() {
    if (editorTextarea.element.value) {
        var fontArgs = drawingCanvas.ctx2d.font.split(' ');
        var newSize = '1rem';
        drawingCanvas.ctx2d.font = newSize + ' ' + fontArgs[fontArgs.length - 1];
        drawingCanvas.ctx2d.fillText(editorTextarea.element.value, editorTextarea.x, editorTextarea.y);
    }
}

//範囲選択終了時
function selectionRectFinish() {

}

//キャンバス関係

function updateCanvasSize() {
    let editorArea = $("#editor-area");
    canvasWidth = Math.max(canvasWidth, editorArea.width()!);
    canvasHeight = Math.max(canvasHeight, editorArea.height()!);

    drawingCanvas.element.width = canvasWidth;
    drawingCanvas.element.height = canvasHeight;
    penCanvas.element.width = canvasWidth;
    penCanvas.element.height = canvasHeight;

    penCanvas.ctx2d.lineWidth = PenCanvas.penSize;
    penCanvas.ctx2d.strokeStyle = PenCanvas.style;
    penCanvas.ctx2d.lineCap = 'round';
}

//マウスイベントを親に伝えない
$(".stop-propagation")
    .on("click dblclick mousedown", function (e) {
        e.stopPropagation();
    });

//マウス操作
$("#editor-area")
    .on("mousedown", function (e) {
        editorTextarea.hide();
        if (e.shiftKey) {
            selectionRect.show(e.offsetX, e.offsetY);
        }
        else {
            penCanvas.down(e.offsetX, e.offsetY);
        }
    }).on("mousemove", function (e) {
        penCanvas?.move(e.offsetX, e.offsetY);
        selectionRect?.move(e.offsetX, e.offsetY);
    }).on("mouseup", function (e) {
        penCanvas.up(e.offsetX, e.offsetY);
        selectionRect.hide(e.offsetX, e.offsetY);
    }).on("dblclick", function (e) {
        penCanvas.cancel();
        editorTextarea.show(e.offsetX, e.offsetY);
    });

//DOMが読み込まれるときに実行
$(function () {
    editorTextarea.cancel();
    updateCanvasSize();
});

//ウィンドウの大きさが変わったときに実行
$(window).on("resize", function () {
    updateCanvasSize();
});