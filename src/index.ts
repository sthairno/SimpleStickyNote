import $ from "jquery";
import { stickyNoteGenerator } from "./stickynote";
import { uploadStickyNote, deleteStickyNote } from "./firebase";
import { DrawingCanvas } from "./DrawingCanvas";
import { PenCanvas } from "./PenCanvas";
import { EditorTextarea } from "./EditorTextarea";
import { SelectionRect } from "./SelectionRect";
import { RectDetector } from "./RectDetector";

let canvasWidth = 100;
let canvasHeight = 100;

let drawingCanvas: DrawingCanvas;
$(function () {
    drawingCanvas = new DrawingCanvas(<HTMLCanvasElement>document.getElementById('drawing-canvas'));
});

let penCanvas: PenCanvas;
$(function () {
    penCanvas = new PenCanvas(<HTMLCanvasElement>document.getElementById('pen-canvas'));
    penCanvas.onFinish = penCanvasFinish;
});

let editorTextarea: EditorTextarea;
$(function () {
    editorTextarea = new EditorTextarea(<HTMLTextAreaElement>document.getElementById('editor-textarea'));
    editorTextarea.onFinish = editorTextareaFinish;
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

let selectionRect: SelectionRect;
$(function () {
    selectionRect = new SelectionRect(<HTMLDivElement>document.getElementById('selection-rect'));
    selectionRect.onFinish = selectionRectFinish;
});

//付箋

let rectDetector = new RectDetector();

//付箋の作成
function createStickyNote(x: number, y: number, width: number, height: number) {
    let tmpCnavas = document.createElement("canvas");
    tmpCnavas.width = width;
    tmpCnavas.height = height;
    tmpCnavas.getContext("2d")?.putImageData(
        drawingCanvas.ctx2d.getImageData(x, y, width, height),
        0, 0);
    drawingCanvas.ctx2d.clearRect(x, y, width, height);
    let stickynote = stickyNoteGenerator.generate(tmpCnavas.toDataURL());
    stickynote.onClose = () => {
        deleteStickyNote(stickynote);
    };

    uploadStickyNote(stickynote);
}

//ペン入力終了時
function penCanvasFinish() {
    let result = rectDetector.detect(penCanvas.penPath);
    if (result) {
        let [startX, startY, endX, endY] = result;
        createStickyNote(startX, startY, endX - startX, endY - startY);
    }
    else {
        drawingCanvas.ctx2d.drawImage(penCanvas.element, 0, 0);
    }
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
    createStickyNote(selectionRect.getStartX(), selectionRect.getStartY(), selectionRect.getWidth(), selectionRect.getHeight());
}

//キャンバス関係

function updateCanvasSize() {
    let editorArea = $("#editor-area");
    canvasWidth = Math.max(canvasWidth, editorArea.width()!);
    canvasHeight = Math.max(canvasHeight, editorArea.height()!);

    drawingCanvas.setSize(canvasWidth, canvasHeight);
    penCanvas.setSize(canvasWidth, canvasHeight);

    penCanvas.ctx2d.lineWidth = PenCanvas.penSize;
    penCanvas.ctx2d.strokeStyle = PenCanvas.style;
    penCanvas.ctx2d.lineCap = 'round';
}

//マウスイベントを親に伝えない
$(".stop-propagation")
    .on("click dblclick mousedown", function (e) {
        e.stopPropagation();
    });

//マウス,タッチ操作

let isTouch: boolean = false;

$(function () {
    $("#editor-area")
        .on("touchstart", function (e) {
            isTouch = true;
            editorTextarea.hide();
            penCanvas.down(e.changedTouches[0].pageX, e.changedTouches[0].pageY);
        }).on("touchmove", function (e) {
            penCanvas?.move(e.changedTouches[0].pageX, e.changedTouches[0].pageY);
        }).on("touchend", function (e) {
            isTouch = false;
            penCanvas.up(e.changedTouches[0].pageX, e.changedTouches[0].pageY);
        }).on("mousedown", function (e) {
            if (!isTouch) {
                editorTextarea.hide();
                if (e.shiftKey) {
                    selectionRect.show(e.offsetX, e.offsetY);
                }
                else {
                    penCanvas.down(e.offsetX, e.offsetY);
                }
            }
        }).on("mousemove", function (e) {
            if (!isTouch) {
                penCanvas?.move(e.offsetX, e.offsetY);
                selectionRect?.move(e.offsetX, e.offsetY);
            }
        }).on("mouseup", function (e) {
            if (!isTouch) {
                penCanvas.up(e.offsetX, e.offsetY);
                selectionRect.hide(e.offsetX, e.offsetY);
            }
        }).on("dblclick", function (e) {
            penCanvas.cancel();
            editorTextarea.show(e.offsetX, e.offsetY);
        });
    
    $("#fullscreen-switch-btn")
        .on("click", function(e) {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
              if (document.exitFullscreen) {
                document.exitFullscreen();
              }
            }
        });
    
    $("#canvas-clear-btn")
        .on("click", function(e) {
            drawingCanvas.clear();
        });
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