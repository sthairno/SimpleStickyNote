
export class Path extends Array<[x: number, y: number]> {
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
