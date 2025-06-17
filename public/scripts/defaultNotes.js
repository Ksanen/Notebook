/* Tutaj ustawiane są domyślne  dane dla aplikacji, można to w przyszłości przenieść do bazy danych.
Strona prezentuje działanie na localStoragu
*/

if (localStorage.getItem("NotebookApplicationData") === null) {
    let notebookApplicationData = {
        currentNoteId: -1,
        categories: [],
        notes: [],
        trash: [],
        options: {
            moveNoteToTheBin: true,
            darkMode: false,
            lang: "en"
        }
    }

    let categories = notebookApplicationData.notes;
    categories = categories.map((note) => note.category);
    categories = categories.filter((category) => category !== "");
    categories = [...new Set(categories)];
    notebookApplicationData.categories = categories;
    localStorage.setItem("NotebookApplicationData", JSON.stringify(notebookApplicationData));

}


