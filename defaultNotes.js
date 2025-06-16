/* Tutaj ustawiane są domyślne  dane dla aplikacji, można to w przyszłości przenieść do bazy danych.
Strona prezentuje działanie na localStoragu
*/

if (localStorage.getItem("NotebookApplicationData") === null) {
    let notebookApplicationData = {
        currentNoteId: -1,
        categories: [],
        notes: [{
            id: 0,
            lastEdited: {
                year: "2022",
                month: "12",
                day: "15",
                hour: "16",
                minute: "17",
                second: "12",
            },
            title: "ten",
            text: "20:00 - spotkanie sd",
            category: "ten"
        }, {
            id: 1,
            lastEdited: {
                year: "2022",
                month: "12",
                day: "15",
                hour: "16",
                minute: "30",
                second: "15",
            },
            title: "dwa",
            text: "trzy",
            category: "coś"
        }, {
            id: 2,
            lastEdited: {
                year: "2022",
                month: "12",
                day: "15",
                hour: "16",
                minute: "32",
                second: "10",
            },
            title: "Lidl",
            text: "mleko,\njajka,\nchleb",
            category: "Listy zakupów"
        }, {
            id: 3,
            lastEdited: {
                year: "2023",
                month: "12",
                day: "15",
                hour: "16",
                minute: "30",
                second: "15",
            },
            title: "mecz",
            text: "dzisiaj o 21 mecz barcelona-real",
            category: ""
        }],
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


