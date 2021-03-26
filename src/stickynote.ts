import $ from "jquery";

export class StickyNote {
    public element: HTMLDivElement;
    public image: HTMLImageElement;
    public closeBtn: HTMLButtonElement;
    public id: string | null = null;

    public onClose: Function | null = null;

    setImage(src: string) {
        this.image.src = src;
    }

    getImage(): string {
        return this.image.src;
    }

    constructor(element: HTMLDivElement) {
        this.element = element;
        this.image = element.querySelector("#stickynote-image")!;
        this.closeBtn = element.querySelector("#stickynote-close")!;

        this.closeBtn.onclick = (e) => {
            if(this.onClose)
            {
                this.onClose();
            }
        };
    }
}

export class StickyNoteGenerator {
    public template: HTMLTemplateElement;

    generate(image: string): StickyNote {
        let element = <HTMLDivElement>this.template.content.cloneNode(true);
        let note = new StickyNote(element);

        note.setImage(image);

        return note;
    }

    constructor(template: HTMLTemplateElement) {
        this.template = template;
    }
}

export let stickyNoteGenerator: StickyNoteGenerator;
$(function () {
    stickyNoteGenerator = new StickyNoteGenerator(<HTMLTemplateElement>document.getElementById('stickynote-template'));
});