import $ from "jquery";
import { Modal } from "bootstrap";

//Firebase Firestore
import firebase from "firebase/app";
import "firebase/firestore"
//Firebase UI
import * as firebaseui from 'firebaseui'

import { StickyNote, stickyNoteGenerator } from "./stickynote";

export let stickyNotes: StickyNote[] = [];

interface UserData {
    images: string[];
}

interface StickyNoteData {
    image: string;
    createdDate: Date;
}

let stickynoteArea: HTMLElement;
let authModal: Modal;
$(function () {
    stickynoteArea = <HTMLElement>document.getElementById("stickynote-area");
    authModal = new Modal(document.getElementById("auth-modal")!, {
        backdrop: "static",
        keyboard: false
    });
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
var uiConfig: firebaseui.auth.Config = {
    signInOptions: [
        // Leave the lines as is for the providers you want to offer your users.
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID
    ],
    callbacks: {
        signInSuccessWithAuthResult: (result, redirectUrl) => {
            if (result.additionalUserInfo.isNewUser) {
                setUserData({ images: [] });
            }
            return false; //リダイレクトしない
        }
    },
    signInFlow: "popup"
};

let firestore: firebase.firestore.Firestore;

$(function () {
    firebase.initializeApp(firebaseConfig);

    let ui = new firebaseui.auth.AuthUI(firebase.auth());
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            console.log("Auth state changed: Signed In");
            authModal.hide();
            $("#user-btn").text(user.displayName ? user.displayName : "User");
            updateAllStickyNotes();
        } else {
            console.log("Auth state changed: Signed Out");
            ui.start('#firebaseui-auth-container', uiConfig);
            authModal.show();
        }
    });

    $("#logout-btn").on("click", (e) => {
        firebase.auth().signOut();
    });

    firestore = firebase.firestore();
})

async function getUserData(): Promise<UserData> {
    let result = await firestore.collection("users").doc(firebase.auth().currentUser?.uid).get();
    return <UserData>result.data();
}

async function setUserData(userdata: UserData) {
    await firestore.collection("users").doc(firebase.auth().currentUser?.uid).set(userdata);
}

function clearAllStickyNotes() {
    stickynoteArea.textContent = "";
    stickyNotes.length = 0;
}

export async function updateAllStickyNotes() {
    clearAllStickyNotes();
    let userdata = await getUserData();
    let stickynoteCollection = firestore.collection("stickynotes");
    userdata.images.map((stickynoteDoc) => {
        return stickynoteCollection.doc(stickynoteDoc).get()
    }).forEach(async (doc) => {
        let awaitDoc = await doc;
        let data = <StickyNoteData>awaitDoc.data();
        let stickynote = stickyNoteGenerator.generate(data.image);
        stickynote.id = awaitDoc.id;
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

export async function uploadStickyNote(stickynote: StickyNote) {
    let data: StickyNoteData = {
        image: stickynote.getImage(),
        createdDate: new Date()
    };
    let result = await firestore.collection("stickynotes").add(data);
    stickynote.id = result.id;

    //UserData更新
    let userdata = await getUserData();
    userdata.images.push(result.id);
    await setUserData(userdata);

    console.log("付箋をアップロード: ", result.id);

    stickynoteArea.append(stickynote.element);
    //stickynote.elementを再定義
    let elements = stickynoteArea.querySelectorAll(".stickynote");
    stickynote.element = <HTMLDivElement>(elements[elements.length - 1]);

    stickyNotes.push(stickynote);
    console.log(stickynote);
}

export async function deleteStickyNote(stickynote: StickyNote) {
    if (stickynote.id) {
        await firestore.collection("stickynotes").doc(stickynote.id).delete();
        stickyNotes.forEach((item, idx) => {
            if (item == stickynote) {
                stickyNotes.splice(idx, 1);
            }
        });

        //UserData更新
        let userdata = await getUserData();
        userdata.images = userdata.images.filter(img => img != stickynote.id);
        await setUserData(userdata);

        console.log("付箋を削除: ", stickynote.id);

        stickynoteArea.removeChild(stickynote.element);
    }
}
