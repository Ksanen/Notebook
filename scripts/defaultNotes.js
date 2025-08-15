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
      lang: "en",
    },
  };

  localStorage.setItem("NotebookApplicationData", JSON.stringify(notebookApplicationData));
}
