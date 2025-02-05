// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-analytics.js";
import { getFirestore, doc, deleteDoc, getDoc, setDoc, collection, getDocs, addDoc, query, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { getAuth, signInWithPopup, signInWithRedirect, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBtar2PHdz7N8WiNPSjnePddg27HBz8850",
    authDomain: "dicebase-8a06c.firebaseapp.com",
    projectId: "dicebase-8a06c",
    storageBucket: "dicebase-8a06c.firebasestorage.app",
    messagingSenderId: "18115705291",
    appId: "1:18115705291:web:ad8f8235826a56aa5b5e4e",
    measurementId: "G-57FNT8XCZN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let userId = null;
let displayName = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
      userId = user.uid; // UID des angemeldeten Benutzers
      displayName = user.displayName
      console.log("User ID:", userId);
      document.getElementById("userBtn").innerText = displayName;
      document.getElementById("userBtn").style.display = 'block';
      document.getElementById("loginBtn").style.display = 'none';
      computeHash();
      applyColorsFromFirebase();
  } else {
      console.log("Kein Benutzer angemeldet.");
      document.getElementById("userBtn").style.display = 'none';
      document.getElementById("loginBtn").style.display = 'block';
      userId = null;
      computeHash();
  }
});

const loginWithGoogle = async () => {
  console.log('logging in...')
  try {
    //const result = await signInWithRedirect(auth, provider);
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Zeige den angemeldeten Benutzer an
    console.log("Erfolgreich angemeldet:", user);
  } catch (error) {
    console.error("Fehler bei der Anmeldung:", error);
  }
};

async function getUserCharacters() {
  try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
          throw new Error("Nutzer ist nicht authentifiziert.");
      }

      const userId = currentUser.uid;
      const charactersRef = collection(db, "characters");
      const q = query(charactersRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
          console.warn("Keine Charaktere gefunden.");
          return [];
      }

      const characters = [];
      querySnapshot.forEach((doc) => {
          characters.push({ id: doc.id, ...doc.data() });
      });

      return characters;
  } catch (error) {
      console.error("Fehler beim Abrufen der Charaktere:", error.message);
      throw error;
  }
}

function generateCharacterList() {
  showContent()
  // Ruft die Charaktere des Nutzers ab
  getUserCharacters().then(characters => {
      // Wenn der Hash #characters ist
      if (getHash() === "characters") {
          // Container für die Charakterliste
          const contentDiv = document.querySelector(".content");
          contentDiv.innerHTML = '';  // Alte Liste entfernen

          // Durchlaufen der Charaktere
          characters.forEach(character => {
              // Erstellen des Listenelements für jeden Charakter
              const characterDiv = document.createElement('div');
              characterDiv.classList.add('character-item');
              characterDiv.addEventListener('click', () => {
                  // Hash zu der ID des Charakters ändern
                  window.location.hash = `#${character.id}`;
              });

              // Erstellen der linken Spalte (Bild)
              const imgDiv = document.createElement('div');
              imgDiv.classList.add('character-image-container');
              const img = document.createElement('img');
              img.src = character.img;  // Standardbild
              img.alt = character.name;
              img.classList.add('character-image');
              imgDiv.appendChild(img);

              // Erstellen der rechten Spalte (Name und Beschreibung)
              const infoDiv = document.createElement('div');
              infoDiv.classList.add('character-info');

              // Name des Charakters
              const name = document.createElement('div');
              name.classList.add('character-name');
              name.textContent = character.name;

              // Beschreibung des Charakters
              const description = document.createElement('div');
              description.classList.add('character-description');
              description.textContent = character.description;

              // Die Elemente in den Info-Container einfügen
              infoDiv.appendChild(name);
              infoDiv.appendChild(description);

              // Die beiden Spalten zusammen in das Character-Div einfügen
              characterDiv.appendChild(imgDiv);
              characterDiv.appendChild(infoDiv);

              // Das Element zur content-Div hinzufügen
              contentDiv.appendChild(characterDiv);
          });
          const newBtn = document.createElement('button');
          newBtn.classList.add('new-character-btn');
          newBtn.innerHTML = "+ new character";
          newBtn.addEventListener("click", function() {window.location.hash = "createCharacter"})
          contentDiv.appendChild(newBtn)
      }
  }).catch(error => {
      console.error("Fehler beim Abrufen der Charaktere:", error);
  });
}

// Die Funktion, die den Charakter anhand der ID sucht und Fehlerbehandlung implementiert
async function getCharacter(characterId) {
  showContent()
  // Initialisiere Firestore
  const db = getFirestore();

  // Referenziere das Dokument in der 'characters' Sammlung, basierend auf der Dokument-ID
  const characterRef = doc(db, "characters", characterId);
  console.log("Charakter-Referenz:", characterRef);

  const contentDiv = document.querySelector('.content');

  try {
      // Führe die Abfrage aus, um das Dokument abzurufen
      const characterDoc = await getDoc(characterRef);

      // Überprüfen, ob das Dokument existiert
      if (characterDoc.exists()) {
          // Speichern des Charakters in einer lokalen Variablen
          const characterData = characterDoc.data();

          // Debugging-Ausgabe des gefundenen Charakters
          console.log("Gefundener Charakter:", characterData);

          contentDiv.innerHTML = '';

          if (isMobileDevice()) {
            contentDiv.innerHTML = 'this page currently only supports desktop. We are activly working on a fix :)';
          } else {
            //###############
            // P C   P A G E
            //###############
            // Hauptcontainer
            const characterContainer = document.createElement("div");
            characterContainer.classList.add("character-container");

            // Bild
            const image = document.createElement("img");
            image.src = characterData.img || "assets/images/noImageSet.png";
            image.alt = `${characterData.name}'s Bild`;
            image.classList.add("character-page-image");

            // Name und Zusammenfassung
            const infoContainer = document.createElement("div");
            infoContainer.classList.add("info-container");

            const textContainer = document.createElement("div");
            textContainer.classList.add("text-container");

            const nameElement = document.createElement("h1");
            nameElement.textContent = characterData.name;
            nameElement.classList.add("character-page-name");

            const summaryElement = document.createElement("p");
            summaryElement.textContent = characterData.description;
            summaryElement.classList.add("character-summary");

            textContainer.appendChild(nameElement);
            textContainer.appendChild(summaryElement);

            // Ein-/Ausklappbare Felder
            const detailsContainer = document.createElement("div");
            detailsContainer.classList.add("details-container");

            if (characterData.details != null) {
                characterData.details.forEach((detail) => {
                    const detailSection = document.createElement("div");
                    detailSection.classList.add("detail-section");

                    const detailHeader = document.createElement("button");
                    detailHeader.classList.add("detail-header");
                    detailHeader.textContent = detail.title + " +";

                    const detailContent = document.createElement("div");
                    detailContent.classList.add("detail-content");
                    detailContent.style.display = "none";

                    // Überprüfen, ob der Inhalt ein Objekt ist
                    if (typeof detail.content === "object" && !Array.isArray(detail.content)) {
                        const objectContent = Object.entries(detail.content)
                            .map(([key, value]) => `<strong style="color:var(--accent-color);">${key}:</strong> ${value}`)
                            .join("<hr style=\"margin-top: 10px; margin-bottom: 10px; border: none; height: 1px; background-color: var(--accent-color); height: 2px\">");
                        detailContent.innerHTML = objectContent;
                    } else {
                        detailContent.innerHTML = fixDbText(detail.content);
                    }

                    // Toggle-Logik für Ein-/Ausklappen
                    detailHeader.addEventListener("click", () => {
                        const isVisible = detailContent.style.display === "block";
                        detailContent.style.display = isVisible ? "none" : "block";
                        detailHeader.textContent = detail.title + (isVisible ? " +" : " -");
                    });

                    detailSection.appendChild(detailHeader);
                    detailSection.appendChild(detailContent);
                    detailsContainer.appendChild(detailSection);
                });
            }

            // Zusammenfügen
            infoContainer.appendChild(image);
            infoContainer.appendChild(textContainer);
            characterContainer.appendChild(infoContainer);
            characterContainer.appendChild(detailsContainer);
            contentDiv.appendChild(characterContainer);

            const currentHash = getHash(); // Entfernt das '#' vom Hash
            const docRef = doc(db, 'characters', currentHash); // Verweis auf das Dokument in der Firestore-Datenbank

            try {
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const characterData = docSnap.data();
                    const characterUserId = characterData.userId;

                    if (characterUserId === userId) {
                        console.log("Der Nutzer darf den Charakter bearbeiten oder löschen.");

                        // Container für die Buttons
                        const buttonContainer = document.createElement('div');
                        buttonContainer.classList.add('button-container'); // Hinzufügen des Containers

                        // Edit-Button erstellen
                        const editBtn = document.createElement('button');
                        editBtn.innerHTML = 'edit';
                        editBtn.classList.add('character-editBtn');
                        buttonContainer.appendChild(editBtn);

                        // Edit-Button Logik
                        editBtn.addEventListener("click", function() {
                            const characterHash = getHash(); // Holen des aktuellen Hashes
                            window.location.href = `#${characterHash}//edit`; // Weiterleitung zur Edit-Seite
                        });

                        // Delete-Button erstellen
                        const deleteBtn = document.createElement('button');
                        deleteBtn.innerHTML = 'delete';
                        deleteBtn.classList.add('character-deleteBtn');
                        buttonContainer.appendChild(deleteBtn);

                        deleteBtn.addEventListener("click", function() {
                            // Popup-Container erstellen
                            const popupContainer = document.createElement('div');
                            popupContainer.classList.add('delete-popup-container');

                            // Overlay erstellen
                            const overlay = document.createElement('div');
                            overlay.classList.add('delete-popup-overlay');

                            // Popup-Box erstellen
                            const popupBox = document.createElement('div');
                            popupBox.classList.add('delete-popup-box');

                            // Header erstellen
                            const header = document.createElement('h2');
                            header.textContent = 'Are you sure you want to delete this character?';

                            // Button-Container erstellen
                            const buttonContainer = document.createElement('div');
                            buttonContainer.classList.add('delete-popup-buttons');

                            // Abbrechen-Button erstellen
                            const cancelBtn = document.createElement('button');
                            cancelBtn.classList.add('delete-popup-cancel');
                            cancelBtn.textContent = 'Cancel';

                            // Löschen-Button erstellen
                            const deleteBtnPopup = document.createElement('button');
                            deleteBtnPopup.classList.add('delete-popup-delete');
                            deleteBtnPopup.textContent = 'Delete';

                            // Buttons zum Button-Container hinzufügen
                            buttonContainer.appendChild(cancelBtn);
                            buttonContainer.appendChild(deleteBtnPopup);

                            // Popup-Box zusammenbauen
                            popupBox.appendChild(header);
                            popupBox.appendChild(buttonContainer);

                            // Popup-Container zusammenbauen
                            popupContainer.appendChild(overlay);
                            popupContainer.appendChild(popupBox);

                            // Popup zum Body hinzufügen
                            document.body.appendChild(popupContainer);

                            // Abbrechen-Button Logik
                            cancelBtn.addEventListener('click', () => {
                                popupContainer.remove(); // Löscht das Popup-Fenster
                            });

                            // Löschen-Button Logik
                            deleteBtnPopup.addEventListener('click', () => {
                                const characterId = getHash(); // Entfernt das '#' vom Hash
                                deleteCharacter(characterId); // Löscht den Charakter

                                // Ändert den Hash in "#characters"
                                window.location.hash = "#characters";
                                popupContainer.remove(); // Löscht das Popup-Fenster
                            });
                        });

                        contentDiv.appendChild(buttonContainer); // Button-Container zum Hauptcontainer hinzufügen
                    } else {
                        console.log("Der Nutzer hat nicht die Berechtigung, diesen Charakter zu löschen.");
                        // Hier kommt dein Code, der ausgeführt wird, wenn die IDs nicht übereinstimmen
                    }
                } else {
                    console.log("Das Dokument existiert nicht.");
                }
            } catch (error) {
                console.error("Fehler beim Überprüfen der Berechtigung: ", error);
            }
          }

          // Weiterverarbeiten der Daten, z.B. Rendern der Ansicht
          // Zum Beispiel: renderCharacter(characterData);
      } else {
          // Wenn das Dokument nicht existiert, zeige einen 404-Fehler an
          showError404();
      }
  } catch (error) {
      // Fehlerbehandlung: Überprüfen des Fehlertyps oder Statuscodes
      if (error.message.includes("permission")) {
          // Falls es ein Berechtigungsproblem gibt, zeige einen 402 Fehler an (Zugriffsproblem)
          showError402();
      } else if (error.message.includes("found")) {
          // Falls das Dokument nicht gefunden wurde, zeige einen 404 Fehler an
          showError404();
      } else {
          // Sonstige Fehler, die durch die Firebase-Verbindung oder Serverfehler auftreten können
          showError500();
      }

      // Zeige den Fehler in der Konsole für Debugging-Zwecke
      console.error("Fehler beim Abrufen des Charakters:", error);
  }
}

async function editCharacter() {
    showContent();
    const contentDiv = document.querySelector('.content');

    contentDiv.innerHTML = '';

    // Hilfsfunktion zum Erstellen eines Labels mit Eingabefeld und optionalem Tooltip
    function createInputField(labelText, inputType = "text", placeholder = "", hasTooltip = false, tooltipText = "") {
        const container = document.createElement("div");
        container.classList.add("input-container");

        const label = document.createElement("label");
        label.textContent = labelText + ":";
        label.style.marginRight = "5px";
        label.classList.add("input-label");

        let input;
        if (inputType === "textarea") {
            input = document.createElement("textarea");
        } else {
            input = document.createElement("input");
            input.type = inputType;
        }
        input.placeholder = placeholder;
        input.classList.add(`edit-${labelText.toLowerCase()}-input`);

        container.appendChild(label);
        container.appendChild(input);

        if (hasTooltip) {
            const tooltipIcon = document.createElement("span");
            tooltipIcon.textContent = "?";
            tooltipIcon.classList.add("tooltip-icon");

            const tooltipBox = document.createElement("span");
            tooltipBox.textContent = tooltipText;
            tooltipBox.classList.add("tooltip-box");

            tooltipIcon.addEventListener("mouseover", () => {
                tooltipBox.style.display = "inline";
            });
            tooltipIcon.addEventListener("mouseout", () => {
                tooltipBox.style.display = "none";
            });

            container.appendChild(tooltipIcon);
            container.appendChild(tooltipBox);
        }

        return container;
    }

    // Elemente erstellen und hinzufügen
    const formElements = [
        createInputField("Image", "text", "Image URL", true, "Enter a valid image URL."),
        createInputField("Name", "text", "Character name"),
        createInputField("Summary", "text", "Character summary"),
        createInputField("Race", "text", "Character race"),
        createInputField("Age", "number", "Character age"),
        createInputField("Gender", "text", "Character gender", true, "Specify gender as you like."),
        createInputField("Backstory", "textarea", "Explain the Backstory of your character. (Markdown support coming soon)", true, "Be as precise as you want to be."),
        createInputField("Additional", "textarea", "Additional information")
    ];

    formElements.forEach(element => contentDiv.appendChild(element));

    // Dokument-ID abrufen (getHash() und letzten 6 Zeichen entfernen)
    const characterHash = getHash();
    const documentId = characterHash.slice(0, -6);

    // Daten aus Firebase abrufen und Felder füllen
    try {
        const docRef = doc(db, "characters", documentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const characterData = docSnap.data();

            document.querySelector(`.edit-image-input`).value = characterData["img"]; // Wert setzen
            document.querySelector(`.edit-name-input`).value = characterData["name"]; // Wert setzen
            document.querySelector(`.edit-summary-input`).value = characterData["description"]; // Wert setzen
            document.querySelector(`.edit-race-input`).value = characterData["details"][0]["content"]["race"]; // Wert setzen
            document.querySelector(`.edit-age-input`).value = characterData["details"][0]["content"]["age"]; // Wert setzen
            document.querySelector(`.edit-gender-input`).value = characterData["details"][0]["content"]["gender"]; // Wert setzen
            document.querySelector(`.edit-backstory-input`).value = characterData["details"][1]["content"]; // Wert setzen
            document.querySelector(`.edit-additional-input`).value = characterData["details"][2]["content"]; // Wert setzen

            console.log(characterData);

        } else {
            console.error("No such document!");
        }
    } catch (error) {
        console.error("Error fetching document:", error);
    }

    // Speichern-Button
    const saveButton = document.createElement("button");
    saveButton.textContent = "Save";
    saveButton.classList.add("save-button");
    saveButton.addEventListener("click", () => {
        // Später die Speichervorgänge implementieren
        console.log("Save button clicked");
        updateCharacterWithMetadata(collectCharacterDataEdit(), db, userId);
        window.location.hash = "characters";
    });

    contentDiv.appendChild(saveButton);
}

function collectCharacterDataEdit() {
    const data = {
        name: "",
        description: "",
        img: "",
        details: []
    };
  
    // Sammle die Daten aus den Eingabefeldern
    data.img = document.querySelector(".edit-image-input").value || "";
    data.name = document.querySelector(".edit-name-input").value || "";
    data.description = document.querySelector(".edit-summary-input").value || "";
  
    // Füge detail-spezifische Inhalte hinzu
    const age = document.querySelector(".edit-age-input").value || "";
    const race = document.querySelector(".edit-race-input").value || "";
    const gender = document.querySelector(".edit-gender-input").value || "";
  
    const backstory = document.querySelector(".edit-backstory-input").value || "";
    const additional = document.querySelector(".edit-additional-input").value || "";
  
    data.details.push({
        title: "Basic Information",
        content: {
            age: age,
            race: race,
            gender: gender
        }
    });
  
    data.details.push({
        title: "Backstory",
        content: backstory
    })
  
    // Hier kannst du weitere Details hinzufügen, wenn es zusätzliche Felder gibt
    data.details.push({
        title: "Additional Notes",
        content: additional // Beschreibung aus der Textarea als ein Beispiel
    });
  
    return data;
  }

// Funktion zum Bearbeiten eines bestehenden Charakters
async function updateCharacterWithMetadata(characterData, db, userId) {
    try {
        // Dokument-ID aus Hash generieren (letzte 6 Zeichen entfernen)
        const characterHash = getHash();
        const documentId = characterHash.slice(0, -6);

        // Ergänze zusätzliche Felder
        const updatedData = {
            ...characterData, // Bestehende Charakterdaten
            updatedAt: serverTimestamp(), // Server-Timestamp für letzte Änderung
            userId: userId                // Benutzer-ID des aktuellen Nutzers (falls benötigt)
        };

        // Verweise auf das bestehende Dokument in der Collection "characters"
        const docRef = doc(db, "characters", documentId);

        // Dokument aktualisieren
        await setDoc(docRef, updatedData, { merge: true }); // Merge = true: nur Felder überschreiben, keine vollständige Ersetzung

        console.log("Charakter erfolgreich aktualisiert mit ID:", documentId);
        return documentId; // Rückgabe der Dokument-ID
    } catch (e) {
        console.error("Fehler beim Aktualisieren des Charakters:", e);
        throw e; // Fehler weiterwerfen
    }
}

// Funktion zum Löschen des Characters in der Firestore-Datenbank
async function deleteCharacter(characterId) {
  const db = getFirestore(); // Stelle eine Verbindung zur Firestore-Datenbank her
  const docRef = doc(db, 'characters', characterId);

  try {
      await deleteDoc(docRef);
      console.log("Character deleted successfully!");
  } catch (error) {
      console.error("Error deleting character: ", error);
  }
}

// Funktion zum Abmelden eines Benutzers
function signOutUser() {
  const auth = getAuth();  // Auth-Instanz holen
  signOut(auth).then(() => {
      console.log("Benutzer erfolgreich abgemeldet.");
  }).catch((error) => {
      console.error("Fehler beim Abmelden: ", error);
  });
}

// Beispiel-Fehlerfunktionen, die bei einem Fehler aufgerufen werden:
function showError404() {
  console.log("Fehler 404: Charakter nicht gefunden.");
  // Hier kannst du die Benutzeroberfläche aktualisieren, um den 404-Fehler anzuzeigen
  document.querySelector('.content').style.display = 'none'; // Verstecke das Markdown-Inhaltsdiv
  document.querySelector('.iframe-container').style.display = 'block'; // Zeige den iFrame an
  document.querySelector('.iframe-container').innerHTML = '<iframe src="system/error404.html" frameborder="0" style="width: 100%; height: 100%; border-radius=8px;"></iframe>';
}

function showError500() {
  console.log("Fehler 500: Serverfehler.");
  // Hier kannst du die Benutzeroberfläche aktualisieren, um den 500-Fehler anzuzeigen
  // Hier kannst du die Benutzeroberfläche aktualisieren, um den 404-Fehler anzuzeigen
  document.querySelector('.content').style.display = 'none'; // Verstecke das Markdown-Inhaltsdiv
  document.querySelector('.iframe-container').style.display = 'block'; // Zeige den iFrame an
  document.querySelector('.iframe-container').innerHTML = '<iframe src="system/error500.html" frameborder="0" style="width: 100%; height: 100%; border-radius=8px;"></iframe>';
}

function showError402() {
  console.log("Fehler 402: Zugriffsproblem.");
  // Hier kannst du die Benutzeroberfläche aktualisieren, um den 402-Fehler anzuzeigen
  // Hier kannst du die Benutzeroberfläche aktualisieren, um den 404-Fehler anzuzeigen
  document.querySelector('.content').style.display = 'none'; // Verstecke das Markdown-Inhaltsdiv
  document.querySelector('.iframe-container').style.display = 'block'; // Zeige den iFrame an
  document.querySelector('.iframe-container').innerHTML = '<iframe src="system/error402.html" frameborder="0" style="width: 100%; height: 100%; border-radius=8px;"></iframe>';
}

function showContent() {
  document.querySelector('.content').style.display = 'block'; // Verstecke das Markdown-Inhaltsdiv
  document.querySelector('.iframe-container').style.display = 'none'; // Zeige den iFrame an
  document.querySelector('.content').innerHTML = ''; // Leere den Inhalt des Markdown-Inhaltsdiv
}

function createCharacter() {
    showContent()
    const contentDiv = document.querySelector('.content');

    contentDiv.innerHTML = '';

    // Hilfsfunktion zum Erstellen eines Labels mit Eingabefeld und optionalem Tooltip
    function createInputField(labelText, inputType = "text", placeholder = "", hasTooltip = false, tooltipText = "") {
        const container = document.createElement("div");
        container.classList.add("input-container");

        const label = document.createElement("label");
        label.textContent = labelText + ":";
        label.style.marginRight = "5px"
        label.classList.add("input-label");
        
        let input;
        if (inputType === "textarea") {
            input = document.createElement("textarea");
        } else {
            input = document.createElement("input");
            input.type = inputType;
        }
        input.placeholder = placeholder;
        input.classList.add(`new-${labelText.toLowerCase()}-input`);
        
        container.appendChild(label);
        container.appendChild(input);

        if (hasTooltip) {
            const tooltipIcon = document.createElement("span");
            tooltipIcon.textContent = "?";
            tooltipIcon.classList.add("tooltip-icon");

            const tooltipBox = document.createElement("span");
            tooltipBox.textContent = tooltipText;
            tooltipBox.classList.add("tooltip-box");

            tooltipIcon.addEventListener("mouseover", () => {
                tooltipBox.style.display = "inline";
            });
            tooltipIcon.addEventListener("mouseout", () => {
                tooltipBox.style.display = "none";
            });

            container.appendChild(tooltipIcon);
            container.appendChild(tooltipBox);
        }

        return container;
    }

    // Elemente erstellen und hinzufügen
    const formElements = [
        createInputField("Image", "text", "Image URL", true, "Enter a valid image URL."),
        createInputField("Name", "text", "Character name"),
        createInputField("Summary", "text", "Character summary"),
        createInputField("Race", "text", "Character race"),
        createInputField("Age", "number", "Character age"),
        createInputField("Gender", "text", "Character gender", true, "Specify gender as you like."),
        createInputField("Backstory", "textarea", "Explain the Backstory of your character. (Markdown support coming soon)", true, "be as precise, as you want to be."),
        createInputField("Additional", "textarea", "Additional information")
    ];

    formElements.forEach(element => contentDiv.appendChild(element));

    // Speichern-Button
    const saveButton = document.createElement("button");
    saveButton.textContent = "Save";
    saveButton.classList.add("save-button");
    saveButton.addEventListener("click", () => {
        // Später die Speichervorgänge implementieren
        console.log("Save button clicked");
        saveCharacterWithMetadata(collectCharacterData(), db, userId)
        window.location.hash = "characters"
    });

    contentDiv.appendChild(saveButton);
}

function collectCharacterData() {
  const data = {
      name: "",
      description: "",
      img: "",
      details: []
  };

  // Sammle die Daten aus den Eingabefeldern
  data.img = document.querySelector(".new-image-input").value || "";
  data.name = document.querySelector(".new-name-input").value || "";
  data.description = document.querySelector(".new-summary-input").value || "";

  // Füge detail-spezifische Inhalte hinzu
  const age = document.querySelector(".new-age-input").value || "";
  const race = document.querySelector(".new-race-input").value || "";
  const gender = document.querySelector(".new-gender-input").value || "";

  const backstory = document.querySelector(".new-backstory-input").value || "";
  const additional = document.querySelector(".new-additional-input").value || "";

  data.details.push({
      title: "Basic Information",
      content: {
          age: age,
          race: race,
          gender: gender
      }
  });

  data.details.push({
      title: "Backstory",
      content: backstory
  })

  // Hier kannst du weitere Details hinzufügen, wenn es zusätzliche Felder gibt
  data.details.push({
      title: "Additional Notes",
      content: additional // Beschreibung aus der Textarea als ein Beispiel
  });

  return data;
}

// Funktion zum Speichern eines Charakters
async function saveCharacterWithMetadata(characterData, db, userId) {
  try {
      // Ergänze zusätzliche Felder
      const enhancedData = {
          ...characterData, // Bestehende Charakterdaten
          createdAt: serverTimestamp(), // Server-Timestamp für Erstellung
          updatedAt: serverTimestamp(), // Server-Timestamp für letzte Änderung
          userId: userId,               // Benutzer-ID des aktuellen Nutzers
          isPublic: false               // Standardwert für die Sichtbarkeit
      };

      // Speichere die Daten in der Collection "characters"
      const docRef = await addDoc(collection(db, "characters"), enhancedData);

      console.log("Charakter erfolgreich gespeichert mit ID:", docRef.id);
      return docRef.id; // Rückgabe der Dokument-ID
  } catch (e) {
      console.error("Fehler beim Speichern des Charakters:", e);
      throw e; // Fehler weiterwerfen
  }
}

async function submit_colors() {
    console.log("submitting colors");

    if (!userId) {
        console.error("User is not authenticated.");
        return;
    }

    const colorPickers = document.querySelectorAll('.colorPicker');
    const design = Array.from(colorPickers).map(picker => picker.value);

    const userDocRef = doc(db, "users", userId);
    const q = query(userDocRef, where("userId", "==", userId));

    try {
        await setDoc(q, { design: design }, { merge: true });
        console.log("Colors successfully submitted.");
    } catch (error) {
        console.error("Error submitting colors:", error);
    }
}

async function showSettings() {
    showContent();
    const contentDiv = document.querySelector('.content');
    contentDiv.innerHTML = ''; // Clear existing content

    const settingsSections = [
        {
            title: "Account Settings",
            content: `
                <p>Change your account settings here.</p>
                <button onclick="logout()">Logout</button>
            `
        },
        {
            title: "Appearance",
            content: `
                <label for="colorPicker">Choose a color:</label>
                <div class="color-picker-row">
                    <span>Accent color:</span>
                    <input type="color" id="colorPicker1" class="colorPicker" name="colorPicker" value="#ff0000">
                </div>
                <div class="color-picker-row">
                    <span>Color:</span>
                    <input type="color" id="colorPicker2" class="colorPicker" name="colorPicker" value="#ff0000">
                </div>
                <div class="color-picker-row">
                    <span>Color:</span>
                    <input type="color" id="colorPicker3" class="colorPicker" name="colorPicker" value="#ff0000">
                </div>
                <div class="color-picker-row">
                    <span>Color:</span>
                    <input type="color" id="colorPicker4" class="colorPicker" name="colorPicker" value="#ff0000">
                </div>
                <div class="color-picker-row">
                    <span>Color:</span>
                    <input type="color" id="colorPicker5" class="colorPicker" name="colorPicker" value="#ff0000">
                </div>
                <div class="color-picker-row">
                    <span>Color:</span>
                    <input type="color" id="colorPicker6" class="colorPicker" name="colorPicker" value="#ff0000">
                </div>
                <div class="color-picker-row">
                    <span>Color:</span>
                    <input type="color" id="colorPicker7" class="colorPicker" name="colorPicker" value="#ff0000">
                </div>
                <div class="color-picker-row">
                    <span>Color:</span>
                    <input type="color" id="colorPicker8" class="colorPicker" name="colorPicker" value="#ff0000">
                </div>
                <button id="submit_colors">submit-colors</button>
            `
        }
    ];

    settingsSections.forEach(section => {
        const sectionDiv = document.createElement('div');
        sectionDiv.classList.add('settings-section');

        const header = document.createElement('h2');
        header.textContent = section.title;
        header.classList.add('settings-header');
        header.addEventListener('click', () => {
            content.classList.toggle('hidden');
        });

        const content = document.createElement('div');
        content.classList.add('settings-content');
        content.innerHTML = section.content;

        sectionDiv.appendChild(header);
        sectionDiv.appendChild(content);
        contentDiv.appendChild(sectionDiv);
    });
    
    // Add event listener to submit colors button
    const submitColorsButton = document.getElementById('submit_colors');
    submitColorsButton.addEventListener('click', submit_colors);

    // Load user design settings from Firebase
    if (userId) {
        try {
            const userDoc = await getDoc(doc(db, "users", userId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const design = userData.design || [];
                design.forEach((color, index) => {
                    const colorPicker = document.getElementById(`colorPicker${index + 1}`);
                    if (colorPicker) {
                        colorPicker.value = color;
                    }
                });
            } else {
                console.log("No such document! Creating default settings.");
                const defaultDesign = [
                    "#f4f4f9", "#000000", "#181818", "#3f3f3f",
                    "#4f4f4f", "#333333", "#222222", "#666666"
                ];
                await addDoc(collection(db, "users"), { design: defaultDesign, userId: userId });
                defaultDesign.forEach((color, index) => {
                    const colorPicker = document.getElementById(`colorPicker${index + 1}`);
                    if (colorPicker) {
                        colorPicker.value = color;
                    }
                });
            }
        } catch (error) {
            console.error("Error getting or setting document:", error);
            console.log("No such document! Creating default settings.");
            const defaultDesign = [
                "#f4f4f9", "#000000", "#181818", "#3f3f3f",
                "#4f4f4f", "#333333", "#222222", "#666666"
            ];
            await addDoc(collection(db, "users"), { design: defaultDesign, userId: userId });
            defaultDesign.forEach((color, index) => {
                const colorPicker = document.getElementById(`colorPicker${index + 1}`);
                if (colorPicker) {
                    colorPicker.value = color;
                }
            });
        }
    }
}

// Helper functions for settings actions
function logout() {
    signOut(auth).then(() => {
        console.log('User signed out.');
    }).catch((error) => {
        console.error('Error signing out:', error);
    });
}

async function applyColorsFromFirebase() {
    if (!userId) {
        console.error("User is not authenticated.");
        return;
    }

    try {
        const charactersRef = collection(db, "users");
        const q = query(charactersRef, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.warn("Keine daten gefunden.");
        } 
        
        if (!querySnapshot.empty) {
            const userData = userDoc.data();
            const design = userData.design || [];
            const root = document.documentElement;

            // Liste der CSS-Variablen-Namen
            const cssVariables = [
                '--text-color',
                '--border-color',
                '--background-color',
                '--background-color-one',
                '--background-color-two',
                '--background-color-three',
                '--background-color-four',
                '--background-color-five'
            ];

            // Set CSS variables
            design.forEach((color, index) => {
                if (cssVariables[index]) {
                    root.style.setProperty(cssVariables[index], color);
                }
            });

            console.log("Colors successfully applied.");
        } else {
            console.log("No such document!");
        }
    } catch (error) {
        console.error("Error getting document:", error);
    }
}

function getHash() {
    return window.location.hash.replace('#', ''); // Entfernt das '#' vom Hash
}

function fixDbText(text) {
  return text.replace(/\n/g, "<br>");
}

function computeHash() {
    // Hier kannst du den Code hinzufügen, der ausgeführt wird, wenn sich der Hash ändert
    console.log('Der Hash hat sich geändert:', getHash());
    if (getHash() === "characters") generateCharacterList()
    else if (getHash() === "home") showHome()
    else if (getHash() === "") showHome()
    else if (getHash() === "about") showAbout()
    else if (getHash() === "license") showLicense()
    else if (getHash() === "settings") showSettings()
    else if (getHash() === "createCharacter") createCharacter()
    else if (getHash().endsWith("//edit")) editCharacter()
    else getCharacter(getHash())
}

function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// Füge einen Klick-Event-Listener zum userBtn hinzu
document.getElementById("userBtn").addEventListener("click", function() {
  // Hole das Drawer-Div
  var drawer = document.getElementById("buttonDrawer");
  
  // Toggle (umschalten) der Anzeige des Menüs (entweder zeigen oder verstecken)
  if (drawer.style.display === "none") {
    drawer.style.display = "block";  // Zeigt das Menü
  } else {
    drawer.style.display = "none";   // Versteckt das Menü
  }
});

document.getElementById("charactersBtn").addEventListener("click", function() {window.location.hash = "characters";});
document.getElementById("settingsBtn").addEventListener("click", function() {window.location.hash = "settings";});
document.getElementById("loginBtn").addEventListener("click", loginWithGoogle);
document.getElementById("logoutBtn").addEventListener("click", signOutUser);

window.addEventListener('hashchange', computeHash);
window.addEventListener('load', function(){
    computeHash()
});