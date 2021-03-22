import $ from "jquery";

let canvasWidth = 100;
let canvasHeight = 100;

class Path extends Array<[x: number, y: number]> {
    at(idx: number): [x: number, y: number] {
        return this[idx];
    }

    atX(idx: number): number {
        return this.at(idx)[0];
    }
    
    atY(idx: number): number {
        return this.at(idx)[1];
    }

    pushXY(x: number, y: number) {
        this.push([x, y]);
    }
    
    clear() {
        this.length = 0;
    }
}

/**
 * 点群の中心点,傾きを計算
 */
function calcCenterAndSlope(path: Path, begin: number | null = null, end: number | null = null): [x: number, y: number, slope: number]
{
    if(!begin)
    {
        begin = 0;
    }
    if(!end)
    {
        end = path.length - 1;
    }
    
    let sum_XY = path.reduce((prev, current) => {
        return [prev[0] + current[0], prev[1] + current[1]];
    });
    let avg_X = sum_XY[0] / path.length, avg_Y = sum_XY[1] / path.length;

    let centered_XY = path.map((value) => {
        return [value[0] - avg_X, value[1] - avg_Y];
    });

    let avg_XmulY = centered_XY.map((value) => {
        return value[0] * value[1];
    }).reduce((prev, current) => {
        return prev + current;
    }) / centered_XY.length;

    let avg_X2 = centered_XY.map((value) => {
        return value[0]**2;
    }).reduce((prev, current) => {
        return prev + current;
    }) / centered_XY.length;

    return [avg_X, avg_Y, avg_XmulY / avg_X2];
}

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
    public penPath: Path = new Path();

    private isDown: boolean = false;

    constructor(element: HTMLCanvasElement) {
        this.element = element;
        this.ctx2d = element.getContext('2d')!;
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

        penCanvasFinish();

        this.cancel();
    }

    cancel() {
        this.clear();
        this.penPath.clear();
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
        if(this.getWidth() > 0 && this.getHeight() > 0)
        {
            selectionRectFinish();
        }
        this.cancel();
    }
}
let selectionRect: SelectionRect;
$(function () {
    selectionRect = new SelectionRect(<HTMLDivElement>document.getElementById('selection-rect'));
});

//付箋

class StickyNote {
    public element: HTMLDivElement;
    public image: HTMLImageElement;

    setImage(src: string) {
        this.image.src = src;
    }

    constructor(element: HTMLDivElement) {
        this.element = element;
        this.image = element.querySelector("#stickynote-image")!;
    }
}

class StickyNoteGnerator {
    public template: HTMLTemplateElement;

    generate(image: string) {
        let element = <HTMLDivElement>this.template.content.cloneNode(true);
        let note = new StickyNote(element);

        note.setImage(image);

        return note;
    }

    constructor(template: HTMLTemplateElement) {
        this.template = template;
    }
}
let stickyNoteGnerator: StickyNoteGnerator;
$(function () {
    stickyNoteGnerator = new StickyNoteGnerator(<HTMLTemplateElement>document.getElementById('stickynote-template'));
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
    let tmpCnavas = document.createElement("canvas");
    tmpCnavas.width = selectionRect.getWidth();
    tmpCnavas.height = selectionRect.getHeight();
    tmpCnavas.getContext("2d")?.putImageData(
        drawingCanvas.ctx2d.getImageData(selectionRect.getStartX(), selectionRect.getStartY(), selectionRect.getWidth(), selectionRect.getHeight()),
        0, 0);
    drawingCanvas.ctx2d.clearRect(selectionRect.getStartX(), selectionRect.getStartY(), selectionRect.getWidth(), selectionRect.getHeight());
    $("#stickynote-area").append(stickyNoteGnerator.generate(tmpCnavas.toDataURL()).element);
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