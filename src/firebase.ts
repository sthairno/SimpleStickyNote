import $ from "jquery";
import firebase from "firebase/app";
import "firebase/firestore"

import { StickyNote, stickyNoteGenerator, stickyNotes } from "./stickynote";

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
    $("#stickynote-area").text('');
    stickyNotes.length = 0;
}

export async function updateAllStickyNotes()
{
    clearAllStickyNotes();
    let result = await firestore.collection("stickynotes").orderBy("createdDate").get();
    result.forEach((doc) => {
        let data = <StickyNoteData>doc.data();
        let stickynote = stickyNoteGenerator.generate(data.image);

        $("#stickynote-area").append(stickynote.element);
        stickyNotes.push(stickynote);
    });
}

export async function uploadStickyNote(stickynote: StickyNote)
{
    let data: StickyNoteData = {
        image: stickynote.getImage(),
        createdDate: new Date()
    };
    let result = await firestore.collection("stickynotes").add(data);
    console.log("付箋をアップロード: ", result.id);
}

export async function deleteStickyNote(stickynote: StickyNote) {
    if(stickynote.id)
    {
        await firestore.collection("stickynotes").doc(stickynote.id).delete();
        console.log("付箋を削除: ", stickynote.id);
    }
}
