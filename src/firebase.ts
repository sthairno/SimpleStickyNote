import $ from "jquery";
import firebase from "firebase/app";
import "firebase/firestore"

import { StickyNote, stickyNoteGenerator } from "./stickynote";

export let stickyNotes: StickyNote[] = [];
let stickynoteArea: HTMLElement;
$(function () {
    stickynoteArea = <HTMLElement>document.getElementById('stickynote-area');
});

var firebaseConfig = {
    apiKey: "AIzaSyCOnwajWf_vAFkUS4z6oXJdAmhcQEysn3I",
    authDomain: "simplestickynote.firebaseapp.com",
    projectId: "simplestickynote",
    storageBucket: "simplestickynote.appspot.com",
    messagingSenderId: "966043568574",
    appId: "1:966043568574:web:75cd1b7df71697543c51ef",
    measurementId: "G-QL3XLDJPDG"
};

let firestore: firebase.firestore.Firestore;

$(function() {
    firebase.initializeApp(firebaseConfig);
    firestore = firebase.firestore();
})

interface StickyNoteData {
    image: string;
    createdDate: Date;
}

function clearAllStickyNotes()
{
    stickynoteArea.textContent = "";
    stickyNotes.length = 0;
}

export async function updateAllStickyNotes()
{
    clearAllStickyNotes();
    let result = await firestore.collection("stickynotes").orderBy("createdDate").get();
    result.forEach((doc) => {
        let data = <StickyNoteData>doc.data();
        let stickynote = stickyNoteGenerator.generate(data.image);
        stickynote.id = doc.id;
        stickynote.onClose = () => {
            deleteStickyNote(stickynote);
        };

        stickynoteArea.append(stickynote.element);
        //stickynote.elementを再定義
        let elements = stickynoteArea.querySelectorAll(".stickynote");
        stickynote.element = <HTMLDivElement>(elements[elements.length - 1]);

        stickyNotes.push(stickynote);
        console.log(stickynote);
    });
}

export async function uploadStickyNote(stickynote: StickyNote)
{
    let data: StickyNoteData = {
        image: stickynote.getImage(),
        createdDate: new Date()
    };
    let result = await firestore.collection("stickynotes").add(data);
    stickynote.id = result.id;
    console.log("付箋をアップロード: ", result.id);

    stickynoteArea.append(stickynote.element);
    //stickynote.elementを再定義
    let elements = stickynoteArea.querySelectorAll(".stickynote");
    stickynote.element = <HTMLDivElement>(elements[elements.length - 1]);
    
    stickyNotes.push(stickynote);
    console.log(stickynote);
}

export async function deleteStickyNote(stickynote: StickyNote) {
    if(stickynote.id)
    {
        await firestore.collection("stickynotes").doc(stickynote.id).delete();
        stickyNotes.forEach((item, idx) => {
            if(item == stickynote) {
                stickyNotes.splice(idx, 1);
            }
        });
        console.log("付箋を削除: ", stickynote.id);

        stickynoteArea.removeChild(stickynote.element);
    }
}
