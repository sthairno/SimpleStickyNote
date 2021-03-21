import $ from "jquery";

let canvasWidth = 100;
let canvasHeight = 100;

//描画中のキャンバス
let drawingCanvas: HTMLCanvasElement;
let drawingCanvas2d: CanvasRenderingContext2D;
$(function () {
    drawingCanvas = <HTMLCanvasElement>document.getElementById('drawing-canvas');
    drawingCanvas2d = drawingCanvas.getContext('2d')!;
});

//ペン描画のキャンバス
let penCanvas: HTMLCanvasElement;
let penCanvas2d: CanvasRenderingContext2D;
$(function () {
    penCanvas = <HTMLCanvasElement>document.getElementById('pen-canvas');
    penCanvas2d = penCanvas.getContext('2d')!;
});

let penDownFlg = false;
let penPath: [x: number, y: number][];
const penSize: number = 5;
const penStyle: string = "rgba(10, 10, 10, 1)";
const penMoveParam: number = 5; //パスを追加するときの最低移動量

//キー入力テキストボックス
let editorTextarea: HTMLTextAreaElement;
$(function () {
    editorTextarea = <HTMLTextAreaElement>document.getElementById('editor-textarea');
});
let editorTextareaX: number = 0;
let editorTextareaY: number = 0;

//キャンバス関係

function updateCanvasSize() {
    let editorArea = $(".editor-area");
    canvasWidth = Math.max(canvasWidth, editorArea.width()!);
    canvasHeight = Math.max(canvasHeight, editorArea.height()!);

    drawingCanvas.width = canvasWidth;
    drawingCanvas.height = canvasHeight;
    penCanvas.width = canvasWidth;
    penCanvas.height = canvasHeight;

    penCanvas2d.lineWidth = penSize;
    penCanvas2d.strokeStyle = penStyle;
    penCanvas2d.lineCap = 'round';
}

function clearDrawingCanvas() {
    drawingCanvas2d.clearRect(0, 0, canvasWidth, canvasHeight);
}

function clearPenCanvas() {
    penCanvas2d.clearRect(0, 0, canvasWidth, canvasHeight);
}

//ペン描画

function penRender() {
    penCanvas2d.beginPath();
    penCanvas2d.moveTo(penPath[0][0], penPath[0][1]);
    penPath.forEach((pos, idx) => {
        if (idx == 0) {
            return;
        }
        penCanvas2d.lineTo(pos[0], pos[1]);
    });
    penCanvas2d.stroke();
}

function penFinish() {
    drawingCanvas2d.drawImage(penCanvas, 0, 0);
}

function penDown(x: number, y: number) {
    penDownFlg = true;
    penPath = [[x, y]];
    clearPenCanvas();
}

function penMove(x: number, y: number) {
    if (!penDownFlg) {
        return;
    }
    let prevPos = penPath[penPath.length - 1];
    if (Math.pow(x - prevPos[0], 2) + Math.pow(y - prevPos[1], 2) < Math.pow(penMoveParam, 2)) {
        return;
    }
    penPath.push([x, y]);
    clearPenCanvas();
    penRender();
}

function penUp(x: number, y: number) {
    if (!penDownFlg) {
        return;
    }
    if (penPath.length == 1) {
        penPath = [];
        penDownFlg = false;
        return;
    }
    penPath.push([x, y]);
    clearPenCanvas();
    penRender();

    penFinish();

    penCancel();
}

function penCancel() {
    clearPenCanvas();
    penPath = [];
    penDownFlg = false;
}

//テキストボックス

function textBoxFinish() {
    if(editorTextarea.value)
    {
        var fontArgs = drawingCanvas2d.font.split(' ');
        var newSize = '1rem';
        drawingCanvas2d.font = newSize + ' ' + fontArgs[fontArgs.length - 1];
        drawingCanvas2d.fillText(editorTextarea.value, editorTextareaX, editorTextareaY);
    }
}

function textBoxShow(x: number, y: number) {
    editorTextareaX = x;
    editorTextareaY = y;

    editorTextarea.style.left = x + "px";
    editorTextarea.style.top = y + "px";
    editorTextarea.style.visibility = "visible";
    editorTextarea.value = "";

    editorTextarea.focus();
}

function textBoxHide() {
    textBoxFinish();
    textBoxCancel();
}

function textBoxCancel() {
    editorTextarea.style.visibility = "hidden";
    editorTextarea.value = "";
}

$("#editor-textarea")
    .on("keydown", function (e) {
        if((e.ctrlKey || e.shiftKey) && e.key == "Enter")
        {
            e.preventDefault();
            textBoxHide();
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

$(".stop-propagation")
    .on("click dblclick mousedown", function (e) {
        e.stopPropagation();
    });

//マウス操作
$(".editor-area")
    .on("mousedown", function (e) {
        textBoxHide();
        penDown(e.offsetX, e.offsetY);
    }).on("mousemove", function (e) {
        penMove(e.offsetX, e.offsetY);
    }).on("mouseup", function (e) {
        penUp(e.offsetX, e.offsetY);
    }).on("dblclick", function (e) {
        penCancel();
        textBoxShow(e.offsetX, e.offsetY);
    });

//DOMが読み込まれるときに実行
$(function () {
    textBoxHide();
    updateCanvasSize();
});

//ウィンドウの大きさが変わったときに実行
$(window).on("resize", function () {
    updateCanvasSize();
});