class DataManager {
    static saveApplicationData(applicationData) {
        localStorage.setItem("NotebookApplicationData", JSON.stringify(applicationData));
    }
    static loadData(item) {
        const data = localStorage.getItem(item);
        if (!data) return null;
        try {
            return JSON.parse(data);
        }
        catch (e) {
            console.error("parsing error");
            return null;
        }
    }
    static async getLanguageData() {
        try {
            const data = await import(`./languagesData.js`);
            return data;
        }
        catch (e) {
            console.log("Language data cannot be accessed");
            return false;
        }
    }
    static defaultLanguageDataForAnnouncements() {
        return {
            announcements: {
                noteIsSaved: "Note saved",
                BinEmptied: "The bin has been emptied",
                CategoryExists: "A category with this name already exists",
                CategoryRenamed: "Category name has been changed",
                NoteDeleted: "Note has been deleted",
                noteRestored: "Note has been restored",
                restoredAllNotes: "All notes has been restored",
                categoryChanged: "Category has been changed",
                categoryDeletedFromNote: "Category has been removed from the note",
                noCategoryToChoose: "No category to choose",
                dataLoaded: "Data loaded",
                parsingError: "Parsing error",
                unableToLoad: "Unable to load",
            }
        };
    }
    static checkIfDataAreValid(data) {
        const validStructure = {
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
        const keys = Object.keys(data);
        const validKeys = Object.keys(validStructure);
        if (JSON.stringify(keys) !== JSON.stringify(validKeys)) { return false }
        if (!Array.isArray(data.categories)) { return false; }
        if (!Array.isArray(data.notes)) { return false; }
        if (!Array.isArray(data.trash)) { return false; }
        const optionsKeys = Object.keys(data.options);
        const validOptionsKeys = Object.keys(validStructure.options);
        if (JSON.stringify(optionsKeys) !== JSON.stringify(validOptionsKeys)) { return false; }
        if (typeof data.options.darkMode !== "boolean" && typeof data.options.darkMode !== "undefined") { return false }
        if (typeof data.options.moveNoteToTheBin !== "boolean") { return false }
        for (let i = 0; i < data.notes.length; i++) {
            if (!this.checkIfNoteIsValid(data.notes[i])) {
                return false;
            }
        }
        for (let i = 0; i < data.trash.length; i++) {
            if (!this.checkIfNoteIsValid(data.trash[i])) {
                return false;
            }
        }
        return true;
    }
    static checkIfNoteIsValid(note) {
        const validExampleStructureOfNote = {
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
        }
        let keysOfNote = Object.keys(note);
        let validKeysOfNote = Object.keys(validExampleStructureOfNote);
        if (JSON.stringify(keysOfNote) !== JSON.stringify(validKeysOfNote)) {
            return false;
        }
        let lastEditedKeys = Object.keys(note.lastEdited);
        let lastEditedValidKeys = Object.keys(validExampleStructureOfNote.lastEdited);
        if (JSON.stringify(lastEditedKeys) !== JSON.stringify(lastEditedValidKeys)) {
            return false;
        }
        let lastEditedValues = Object.values(note.lastEdited);
        for (let i = 0; i < lastEditedValues.length; i++) {
            if (!Number.isInteger(parseInt(lastEditedValues[i]))) { return false; }
        }
        return true;
    }
}
class UIManager {
    constructor(notebook) {
        this.notebook = notebook;
        this.data = this.notebook.data;
        this.note = new Note(this.data);
        this.binPage = document.querySelector(".bin_notes");
        this.notePage = document.querySelector(`[page="main"]`);
        this.animation = {
            returnTitle: {
                rectOfTitleNote: undefined,
            },
            titleMove: {
                rectOFTitleMain: undefined,
            },
            addBtnAnimation: {
                returned: true,
                rectOfTitleMain: undefined
            }
        };
        this.timeouts = new Set();

        const darkModeSwitchOption = document.querySelector(".setting_switch_option");
        if (this.data.options.darkMode) {
            darkModeSwitchOption.checked = true;
            document.querySelector("body").setAttribute("mode", "dark");
        }
        else {
            darkModeSwitchOption.checked = false;
            document.querySelector("body").setAttribute("mode", "bright");
        }

    }
    /*
        layer1 - po kliknięciu w ten layer, layer zostanie wyłączony, używane przy menu. Jak kliknie się w ten layer
        to menu się również zamknie.Został przypisany domyślny event listener do layeru. 
        layer2 - po kliknięciu w ten layer nic się nie stanie, używane przy pop-up, jedyny sposób na dezaktywacje jest wybranie opcji w pop-upie, która wywołuje funkcje zamykającą.
    */
    openLayer = (num) => {
        document.querySelector(`.layer${num}`).classList.add("layer-active");
    }
    closeLayer = (num) => {
        document.querySelector(`.layer${num}`).classList.remove("layer-active");
    }
    openMenu = () => {
        document.querySelector(`.nav`).classList.add('nav--open');
        this.openLayer(1);
    }
    closeMenu = () => {
        document.querySelector(`.nav`).classList.remove("nav--open")
        this.closeLayer(1);
    }
    closePopUp = () => {
        const popUpShow = document.querySelectorAll(".pop-up--show");
        popUpShow.forEach((popUp) => {
            popUp.classList.remove("pop-up--appear");
            popUp.classList.remove("pop-up--show");
        })
    }
    closeSearchBar() {
        requestAnimationFrame(() => {
            document.querySelector(".header--search").classList.add("close");
            document.querySelector(".icon-container--search").classList.remove("close");
            document.querySelector(".search-container_input").classList.remove("search-container_input--open");
            document.querySelector(".search-container_icon").classList.remove("search-container_icon--end")
        })
        this.returnAddNoteBtnToItPreviousPosition();
    }
    openSearchBar(searchIcon) {
        let searchInput = document.getElementById("search");
        searchInput.classList.remove("close");
        searchIcon.classList.add("close");
        document.querySelector(`[header-page="main"]`).classList.add("close");
        document.querySelector(`.header--search`).classList.remove("close");
        setTimeout(() => {
            document.querySelector(".search-container_input").classList.add("search-container_input--open");
            document.querySelector(".search-container_icon").classList.add("search-container_icon--end")
            searchInput.focus();
            this.moveAddNoteBtnToBottom();
            this.animation.addBtnAnimation.returned = false;
        }, 1)

    }
    moveAddNoteBtnToBottom() {
        if (window.innerWidth >= 600) {
            const addNoteSearch = document.querySelector(".add-note--search")
            const rect = addNoteSearch.getBoundingClientRect();
            const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
            const right = window.innerWidth - rect.right - scrollBarWidth;
            const distanceFromBottom = window.innerHeight - rect.bottom;

            addNoteSearch.style.position = "fixed"
            addNoteSearch.style.bottom = `${distanceFromBottom}px`;
            addNoteSearch.style.right = `${right}px`;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    addNoteSearch.style.bottom = "20px";
                })
            })
        }
    }
    returnAddNoteBtnToItPreviousPosition() {
        if (this.animation.addBtnAnimation.returned === false && window.innerWidth >= 600) {
            const addNoteSearch = document.querySelector(".add-note--search");
            const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
            const rectSearch = addNoteSearch.getBoundingClientRect();
            const searchRight = window.innerWidth - rectSearch.right - scrollBarWidth;
            const searchBottom = window.innerHeight - rectSearch.bottom;
            addNoteSearch.style.removeProperty("right");
            addNoteSearch.style.removeProperty("position");
            addNoteSearch.style.removeProperty("bottom");
            const addNoteMain = document.querySelector(".add-note--main")
            const temporaryElement = addNoteMain.cloneNode(true);
            temporaryElement.style.visibility = "hidden";
            addNoteMain.parentNode.appendChild(temporaryElement);
            requestAnimationFrame(() => {
                const temporaryRect = temporaryElement.getBoundingClientRect();
                const temporaryRight = window.innerWidth - temporaryRect.right - scrollBarWidth;
                const temporaryBottom = window.innerHeight - temporaryRect.bottom;
                addNoteMain.style.position = "fixed";
                addNoteMain.style.right = `${searchRight}px`;
                addNoteMain.style.bottom = `${searchBottom}px`;
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        addNoteMain.style.right = `${temporaryRight}px`;
                        addNoteMain.style.bottom = `${temporaryBottom}px`;
                        setTimeout(() => {
                            temporaryElement.remove();
                            addNoteMain.style.removeProperty("position");
                            addNoteMain.style.removeProperty("bottom");
                            addNoteMain.style.removeProperty("right");
                        }, 500)

                    })
                })
            })
            this.animation.addBtnAnimation.returned = true;
        }
    }
    showOptions = (currentPage) => {
        document.querySelectorAll("[option-page]").forEach((optionContainer) => {
            if (optionContainer.getAttribute("option-page") === currentPage) {
                optionContainer.classList.add("options-active");
            }
        })
        this.openLayer(1);
    }
    hideOptions = () => {
        let options = document.querySelector(".options-active");
        if (options) {
            options.classList.remove("options-active");
        }
        this.closeLayer(1);
    }
    loadLanguageOnPage() {
        let labelNames = document.querySelectorAll("[label-name]");
        labelNames.forEach((label) => {
            let labelType = label.getAttribute("label-type");
            let attribute = label.getAttribute("label-name");
            switch (labelType) {
                case "text":
                    label.innerHTML = this.notebook.MESSAGES["text"][attribute];
                    break;
                case "button":
                    label.value = this.notebook.MESSAGES["button"][attribute];
                    break;
                case "placeholder":
                    label.placeholder = this.notebook.MESSAGES["placeholder"][attribute];
                    break;
                case "language":
                    label.innerHTML = this.notebook.MESSAGES.language[attribute];
                    break;
            }

        })
        document.querySelector(".setting_select").value = this.notebook.data.options.lang;
    }
    loadLanguagesInSelect() {
        const settingSelect = document.querySelector(".setting_select");
        const languages = this.notebook.languageData.languages;
        const languagesNames = Object.keys(languages);
        let numberOfLanguages = languagesNames.length;
        for (let i = 0; i < numberOfLanguages; i++) {
            const option = document.createElement("option");
            option.value = languagesNames[i];
            option.innerHTML = this.notebook.MESSAGES.language[languagesNames[i]];
            option.setAttribute("label-name", `${languagesNames[i]}`)
            option.setAttribute("label-type", "language");
            settingSelect.appendChild(option);
        }

    }
    showPopUpInformation(information) {
        let popUp = document.querySelector(".pop-up--information");

        document.getElementsByClassName("pop-up--information-text")[0].innerHTML = information;
        popUp.classList.remove("pop-up--show", "pop-up--bottom", "pop-up--disappearring");
        this.clearTimeouts();
        /* zabezpieczenie przed szybkim usuwaniem notatek, dzięki temu animacja zawsze, będzie się wykonywać od początku nawet jak będzie uruchamiana co chwilę */
        requestAnimationFrame(() => {
            popUp.classList.add("pop-up--show");
            const firstStep = setTimeout(() => {
                popUp.classList.add("pop-up--bottom");
            }, 1)
            const secondStep = setTimeout(() => {
                popUp.classList.add("pop-up--disappearring");
            }, 2000)
            const thirdStep = setTimeout(() => {
                popUp.classList.remove("pop-up--show", "pop-up--bottom", "pop-up--disappearring");
            }, 2400)
            this.timeouts.add(firstStep);
            this.timeouts.add(secondStep)
            this.timeouts.add(thirdStep);
        })

    }
    clearTimeouts() {
        this.timeouts.forEach((timeout) => {
            clearTimeout(timeout);
        })
        this.timeouts.clear();
    }
    setActiveTab(tab) {
        this.clearActiveTabs();
        tab.classList.add("nav-section-element-active");
    }
    clearActiveTabs() {
        let activeTabs = Array.from(document.getElementsByClassName("nav-section-element-active"));
        activeTabs.forEach((activeTab) => {
            activeTab.classList.remove("nav-section-element-active");
        })
    }
    openPage(pageName) {
        document.querySelectorAll("[page]").forEach(page => {
            if (page.getAttribute("page") === pageName) {
                page.classList.remove("close");
            }
            else {
                page.classList.add("close");
            }
        })
        document.querySelectorAll("[header-page]").forEach((headerPage) => {
            if (headerPage.getAttribute("header-page") === pageName) {
                headerPage.classList.remove("close");
            }
            else {
                headerPage.classList.add("close");
            }
        })
    }
    changePage(nextPageName) {
        const mainTitle = document.querySelector(".application-title--main");
        const noteTitle = document.querySelector(".application-title--note");
        if (this.notebook.currentPage === "note") {
            this.animation.returnTitle.rectOfTitleNote = noteTitle.getBoundingClientRect();
        }
        this.openPage(nextPageName);
        if (this.notebook.currentPage == "main" && mainTitle.parentNode.classList.contains("close")) {
            mainTitle.parentNode.classList.remove("close");
            this.animation.titleMove.rectOFTitleMain = mainTitle.getBoundingClientRect();
            mainTitle.parentNode.classList.add("close");
        }
        this.closeSearchBar();
        requestAnimationFrame(() => {
            /* zmiana strony note na main wywoła animacje */
            if (nextPageName === "main" && this.notebook.currentPage === "note") {
                this.titleReturnAnimation(this.animation.returnTitle.rectOfTitleNote);
            }
            /* zmiana strony note na inną wywoła animacje */
            else if (nextPageName === "note") {
                this.noteTitleAnimation(this.animation.titleMove.rectOFTitleMain);

            }
            this.notebook.currentPage = nextPageName;
        })
    }
    titleReturnAnimation(rectOfTitleNote) {
        const mainTitle = document.querySelector(".application-title--main");
        const rectOFTitleMain = mainTitle.getBoundingClientRect();
        mainTitle.style.top = `${rectOfTitleNote.top}px`;
        mainTitle.style.left = `${rectOfTitleNote.left}px`;
        mainTitle.style.position = "fixed";
        const parentOfFirstTitle = mainTitle.parentNode;
        const temporaryElement = document.createElement("div");
        const options = parentOfFirstTitle.querySelector(".header-options");
        parentOfFirstTitle.insertBefore(temporaryElement, options);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                mainTitle.style.left = `${rectOFTitleMain.left}px`;
                mainTitle.style.top = `${rectOFTitleMain.top}px`;
                setTimeout(() => {
                    mainTitle.style.removeProperty("left");
                    mainTitle.style.removeProperty("top");
                    mainTitle.style.removeProperty("position");
                    temporaryElement.remove();
                }, 500)
            })
        })
    }
    noteTitleAnimation(rectOFTitleMain) {
        const mainTitle = document.querySelector(".application-title--main");
        if (mainTitle.classList.contains("close")) {
            mainTitle.classList.remove("close");
            requestAnimationFrame(() => {
                rectOFTitleMain = mainTitle.getBoundingClientRect();

            })
        }
        const noteTitle = document.querySelector(".application-title--note");
        const rectOfTitleNote = noteTitle.getBoundingClientRect();
        noteTitle.style.position = "fixed";
        noteTitle.style.left = `${rectOFTitleMain.left}px`;
        noteTitle.style.top = `${rectOFTitleMain.top}px`;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                noteTitle.style.left = `${rectOfTitleNote.left}px`;
                noteTitle.style.top = `${rectOfTitleNote.top}px`;
                setTimeout(() => {
                    noteTitle.style.removeProperty("left");
                    noteTitle.style.removeProperty("top");
                    noteTitle.style.removeProperty("position");

                }, 500)
            })
        })
    }
    loadNotes(notes, page) {
        page.innerHTML = "";
        notes.forEach((note) => {
            let text = note.category;
            let title = note.title === "" ? `${this.notebook.MESSAGES.text.withoutTitle}` : note.title;
            let noteHTML = `            <section class="note" tabindex="0">
                    <input note-id=${note.id} type="hidden">
                    <h1>${title}</h1>
                    <div class="note-information">
                        <p class="note-information-category">${text}</p>
                        <p class="note-information-data">${this.notebook.MESSAGES.text.lastSave}: ${note.lastEdited.day}.${note.lastEdited.month}.${note.lastEdited.year},${note.lastEdited.hour}.${note.lastEdited.minute}</p>
                    </div>
            </section>`;
            page.innerHTML += noteHTML;

        });
    }
    addNewCategory = (addCategoryBtn) => {
        let categoryNameInput = addCategoryBtn.parentNode.querySelector(".edit-category_add_text");
        let categoryName = categoryNameInput.value;
        categoryNameInput.value = "";
        let categories = this.data.categories;
        if (categoryName != "" && !categories.find((category) => category === categoryName)) {
            categories.push(categoryName);
        }
        DataManager.saveApplicationData(this.data);
        this.reloadFragmentOfThePage("categories");
    }
    loadCategoriesOnEditCategoryPage() {
        let categorySectionContainer = document.querySelector(".edit-category_container");
        categorySectionContainer.innerHTML = "";
        let categories = this.data.categories;
        categories.forEach((categoryName) => {
            let category = document.createElement("div");
            category.classList.add("category");
            category.setAttribute("category-name", categoryName);
            category.innerHTML = `
                    <div>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M3 6C3 4.34315 4.34315 3 6 3H7C8.65685 3 10 4.34315 10 6V7C10 8.65685 8.65685 10 7 10H6C4.34315 10 3 8.65685 3 7V6Z"
                                 stroke-width="2" />
                            <path
                                d="M14 6C14 4.34315 15.3431 3 17 3H18C19.6569 3 21 4.34315 21 6V7C21 8.65685 19.6569 10 18 10H17C15.3431 10 14 8.65685 14 7V6Z"
                                 stroke-width="2" />
                            <path
                                d="M14 17C14 15.3431 15.3431 14 17 14H18C19.6569 14 21 15.3431 21 17V18C21 19.6569 19.6569 21 18 21H17C15.3431 21 14 19.6569 14 18V17Z"
                                 stroke-width="2" />
                            <path
                                d="M3 17C3 15.3431 4.34315 14 6 14H7C8.65685 14 10 15.3431 10 17V18C10 19.6569 8.65685 21 7 21H6C4.34315 21 3 19.6569 3 18V17Z"
                                 stroke-width="2" />
                        </svg>
                        <p>${categoryName}</p>
                    </div>
                    <div class="category-options">
                        <svg option="editNameOfCategory" viewBox="0 0 24 24" 
                            xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" clip-rule="evenodd"
                                d="M20.8477 1.87868C19.6761 0.707109 17.7766 0.707105 16.605 1.87868L2.44744 16.0363C2.02864 16.4551 1.74317 16.9885 1.62702 17.5692L1.03995 20.5046C0.760062 21.904 1.9939 23.1379 3.39334 22.858L6.32868 22.2709C6.90945 22.1548 7.44285 21.8693 7.86165 21.4505L22.0192 7.29289C23.1908 6.12132 23.1908 4.22183 22.0192 3.05025L20.8477 1.87868ZM18.0192 3.29289C18.4098 2.90237 19.0429 2.90237 19.4335 3.29289L20.605 4.46447C20.9956 4.85499 20.9956 5.48815 20.605 5.87868L17.9334 8.55027L15.3477 5.96448L18.0192 3.29289ZM13.9334 7.3787L3.86165 17.4505C3.72205 17.5901 3.6269 17.7679 3.58818 17.9615L3.00111 20.8968L5.93645 20.3097C6.13004 20.271 6.30784 20.1759 6.44744 20.0363L16.5192 9.96448L13.9334 7.3787Z"
                                 />
                        </svg>
                        <svg option="deleteCategory" viewBox="-0.5 0 19 19" version="1.1"
                            xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
                            xmlns:sketch="http://www.bohemiancoding.com/sketch/ns">

                            <title>icon/18/icon-delete</title>
                            <desc>Created with Sketch.</desc>
                            <defs>

                            </defs>
                            <g id="out" stroke="none" stroke-width="1"  fill-rule="evenodd"
                                sketch:type="MSPage">
                                <path
                                    d="M4.91666667,14.8888889 C4.91666667,15.3571429 5.60416667,16 6.0625,16 L12.9375,16 C13.3958333,16 14.0833333,15.3571429 14.0833333,14.8888889 L14.0833333,6 L4.91666667,6 L4.91666667,14.8888889 L4.91666667,14.8888889 L4.91666667,14.8888889 Z M15,3.46500003 L12.5555556,3.46500003 L11.3333333,2 L7.66666667,2 L6.44444444,3.46500003 L4,3.46500003 L4,4.93000007 L15,4.93000007 L15,3.46500003 L15,3.46500003 L15,3.46500003 Z"
                                    id="path"  sketch:type="MSShapeGroup">

                                </path>
                            </g>
                        </svg>
                    </div>`;
            categorySectionContainer.appendChild(category);
        })
    }
    openPopUpCategoryRename = (categoryName) => {
        document.querySelector(".pop-up_paragraph--wrong").innerHTML = "";
        let popUpCategory = document.querySelector(".pop-up--category");
        popUpCategory.classList.add("pop-up--show");
        requestAnimationFrame(() => {
            popUpCategory.classList.add("pop-up--appear");

        })
        document.getElementsByClassName("pop-up--category-change-name")[0].value = categoryName;
        document.getElementById("nameOfCategory").value = categoryName;
    }
    openPopUpCategorize() {
        let popUpCategorize = document.querySelector(".pop-up--categorize");
        let information = popUpCategorize.querySelector(".pop-up--information-text");
        information.innerHTML = "";
        popUpCategorize.classList.add("pop-up--show");
        requestAnimationFrame(() => {
            popUpCategorize.classList.add("pop-up--appear");
        })
        const categories = document.querySelector(".pop-up_categories");
        categories.innerHTML = "";
        this.notebook.data.categories.forEach((category) => {
            const categoryContainer = document.createElement("div");
            categoryContainer.classList.add("pop-up_categories_category");
            const categoryLabel = document.createElement("label");
            categoryLabel.setAttribute("for", category);
            categoryLabel.innerHTML = category;
            categoryContainer.append(categoryLabel);
            const categoryRadio = document.createElement("input");
            categoryRadio.setAttribute('type', "radio");
            categoryRadio.setAttribute('name', "category");
            categoryRadio.setAttribute('value', `${category}`);
            categoryRadio.setAttribute('id', `${category}z34`);
            const note = this.data.notes.find((note) => note.id === this.data.currentNoteId);
            const currentCategory = note.category;
            categoryRadio.checked = currentCategory === category ? true : false;
            categoryContainer.append(categoryRadio);
            categories.append(categoryContainer);
        })
        if (this.notebook.data.categories.length === 0) {
            ;
            information.innerHTML = this.notebook.MESSAGES.announcements.noCategoryToChoose;
        }
    }
    selectCategory() {
        if (document.querySelector(`input[name="category"]:checked`)) {
            const category = document.querySelector(`input[name="category"]:checked`).value;
            const note = this.data.notes.find((note) => note.id === this.data.currentNoteId);
            if (note.category !== category) {
                note.category = category;
                DataManager.saveApplicationData(this.data);
                this.showPopUpInformation(this.notebook.MESSAGES.announcements.categoryChanged);
            }
        }
    }
    loadCategoriesOnNav() {
        this.removeCategoriesOnNav();
        let categories = this.data.categories;
        let navCategories = document.getElementsByClassName("nav-catogories")[0];
        let noCategory = document.getElementById("noCategory");
        categories.forEach((category) => {
            let navCategory = document.createElement("div");
            navCategory.setAttribute(`nav-element-type`, `category`);
            navCategory.setAttribute(`category-name`, `${category}`);
            navCategory.setAttribute("tabindex", "0");
            navCategory.classList.add("nav-section-element");

            navCategory.innerHTML = `     
                    <svg class="label-icon" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="icons_Q2" data-name="icons Q2">
                                <path
                                    d="M33.5,9H4a2,2,0,0,0-2,2V37a2,2,0,0,0,2,2H33.5a.9.9,0,0,0,.8-.4L45.6,25.2a2.1,2.1,0,0,0,0-2.4L34.3,9.4a.9.9,0,0,0-.8-.4Z" />
                            </g>
                        </g>
                    </svg>
                    <p>${category}</p>`
            navCategories.insertBefore(navCategory, noCategory);
        })
    }
    removeCategoriesOnNav() {
        let categoriesOnNav = Array.from(document.querySelectorAll(`[nav-element-type="category"]`));
        categoriesOnNav = categoriesOnNav.filter((category) => category.getAttribute("category-name") !== "all");
        categoriesOnNav.forEach(category => category.remove());
    }
    reloadFragmentOfThePage(fragment) {
        switch (fragment) {
            case "categories":
                this.loadCategoriesOnEditCategoryPage();
                this.loadCategoriesOnNav();
                break;
            case "notes":
                this.notebook.sortNotesByDate();
                if (this.notebook.currentCategory === 1) {
                    this.loadNotes(this.notebook.data.notes, this.notePage);
                }
                else {
                    let notesToLoad = this.notebook.data.notes.filter((note) => note.category === this.notebook.currentCategory);
                    this.loadNotes(notesToLoad, this.notePage);
                }
                break;
            case "deletedNotes":
                this.loadNotes(this.data.trash, this.binPage);
                break;
        }
    }
    showPopUpOfTheNoteInTrash() {
        let popUp = document.querySelector(".pop-up--note-in-bin");
        popUp.classList.add("pop-up--show");
    }
    changeMode(darkModeSwitch) {
        const body = document.querySelector("body");
        if (darkModeSwitch.checked) {
            body.setAttribute("mode", "dark");
            this.data.options.darkMode = true;
        }
        else {
            body.setAttribute("mode", "bright")
            this.data.options.darkMode = false;
        }
    }
}
class EventManager {
    constructor(notebook) {
        this.notebook = notebook;
        this.data = this.notebook.data;
    }
    addDefaultEventListeners() {
        document.querySelector(".layer1").addEventListener("click", this.notebook.UIManager.hideOptions);
        let iconOpeningOptions = Array.from(document.getElementsByClassName("icon-container--open-options"));
        iconOpeningOptions.forEach(icon => {
            icon.addEventListener("click", () => {
                this.notebook.UIManager.showOptions(this.notebook.currentPage)
            });
            icon.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    icon.dispatchEvent(new Event("click", { bubbles: true }));
                }
            });
        })
        document.querySelector(".btn-save").addEventListener("click", () => {
            this.notebook.UIManager.showPopUpInformation(this.notebook.MESSAGES.announcements.noteIsSaved);
        })
        document.querySelectorAll(".add-note").forEach((element) => {
            element.addEventListener("click", () => {
                this.notebook.UIManager.changePage('note');
                this.notebook.UIManager.note.createNote(this.notebook.currentCategory);
            })
            element.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    element.dispatchEvent(new Event("click", { bubbles: true }));
                }
            })
        })
        document.querySelectorAll(".icon-container--back").forEach(element => {
            element.addEventListener("click", () => {
                this.notebook.data.currentNoteId = -1;
                this.notebook.UIManager.changePage("main");
                this.notebook.UIManager.reloadFragmentOfThePage("notes");
            });
            element.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    element.dispatchEvent(new Event("click", { bubbles: true }));
                }
            });
        })
        this.addImportDataListener();
        this.darkModeEventListener();
        this.addEventListenersToSearchBar();
        this.addEventListenersToNav();
        this.addEventListenersToOptions();
        this.addEventListenersToNotes();
        this.addEventListenersToNotesInBin()
        this.addEventListenerToLanguageSelect();
    }
    addImportDataListener() {
        const importDataInput = document.getElementById("importData");
        const importDataLabel = document.querySelector(`.import-data-label`);
        importDataInput.addEventListener("change", () => {
            const file = importDataInput.files[0];
            if (!file) { return; }
            const fileReader = new FileReader();
            fileReader.onload = () => {
                try {
                    const data = JSON.parse(fileReader.result);
                    if (DataManager.checkIfDataAreValid(data)) {
                        Object.keys(this.data).forEach(key => delete this.data[key]);
                        Object.assign(this.data, data);
                        this.notebook.UIManager.showPopUpInformation(this.notebook.MESSAGES.announcements.dataLoaded);
                        DataManager.saveApplicationData(this.data);
                        /* jeżeli wczytany język jest inny od obecnego oraz dane językowe zostały pobrane, język zostanie zmieniony */
                        if (this.currentLanguage !== this.data.options.lang && this.notebook.languageData) {
                            this.notebook.changeLanguage(this.data.options.lang);
                        }
                        this.notebook.UIManager.reloadFragmentOfThePage("categories");
                    }
                    else {
                        this.notebook.UIManager.showPopUpInformation(this.notebook.MESSAGES.announcements.unableToLoad);
                    }
                }
                catch (e) {
                    this.notebook.UIManager.showPopUpInformation(this.notebook.MESSAGES.announcements.parsingError);//
                    console.log("bład parsowania", e);
                }
            }
            fileReader.readAsText(file);
        })
        importDataLabel.addEventListener("keydown", (e) => {
            if (e.key === `Enter`) {
                importDataInput.click();
            }
        })
    }
    darkModeEventListener() {
        const darkModeSwitch = document.querySelector(".setting_switch_option");
        darkModeSwitch.addEventListener("keydown", (e) => {
            if (e.key === `Enter`) {
                darkModeSwitch.checked = !darkModeSwitch.checked;
                darkModeSwitch.dispatchEvent(new Event("change", { bubbles: true }));
            }
        })
        darkModeSwitch.addEventListener("change", () => {
            this.notebook.UIManager.changeMode(darkModeSwitch);
            DataManager.saveApplicationData(this.data);
        })
    }
    addEventListenersToSearchBar() {
        const searchContainer = document.querySelector(".icon-container--search");
        searchContainer.addEventListener("click", () => this.notebook.UIManager.openSearchBar(searchContainer))
        const searchContainerInput = document.querySelector(`.search-container_input`);
        searchContainer.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                searchContainer.dispatchEvent(new Event("click", { bubbles: true }));
            }
        })
        searchContainerInput.addEventListener("input", () => this.searchBarHandler(searchContainerInput))
        searchContainerInput.addEventListener("blur", () => {
            searchContainerInput.value = "";
        })
    }
    searchBarHandler(searchContainerInput) {
        const searchIcon = document.querySelector(`.search-container_icon`);
        const value = searchContainerInput.value.toLowerCase();
        if (value.length === 0) {
            searchIcon.classList.remove("close");
        }
        else {
            searchIcon.classList.add("close");
        }
        /*
            1 - wszystkie notatki
            Jeżeli jest ustawiona kategoria na 1 to oznacza, że wyświetlać się będą wszystkie notatki, w przeciwnym wypadku filtruje notatki z ustawionej kategorii
        */
        let notes;
        notes = this.notebook.currentCategory === 1 ? this.data.notes : this.data.notes.filter((note) => note.category === this.notebook.currentCategory);
        /* notatki bez tytułu mają ustawiony tytuł na pusty string, dlatego jak użytkownik będzie wpisywał
        frazę oznaczającą w różnych językach 'bez tytułu', to chcę żeby notatki z pustym stringiem się wliczały, ponieważ w interfejsie notatki bez tytułu wyświetlają się z tą frazą
        */
        notes = notes.filter((note) => {
            const title = note.title.toLowerCase();
            const phrase = this.notebook.MESSAGES.text.withoutTitle.toLowerCase();
            if (note.title === "") {
                if (phrase.search(value) > -1) {
                    return true;
                }
            }
            return title.search(value) > -1;
        });
        this.notebook.UIManager.loadNotes(notes, this.notebook.UIManager.notePage);
    }
    addEventListenerToLanguageSelect() {
        const languageSelect = document.querySelector(`.setting_select`);
        languageSelect.addEventListener("change", () => {
            const language = languageSelect.value;
            this.notebook.changeLanguage(language);
        })
    }
    noteHandler(note, type) {
        this.data.currentNoteId = parseInt(note.querySelector(`[note-id]`).getAttribute(`note-id`));
        DataManager.saveApplicationData(this.data);
        switch (type) {
            case "normal":
                this.notebook.UIManager.changePage("note");
                this.notebook.UIManager.note.loadNote();
                break;
            case "bin":
                this.notebook.UIManager.showPopUpOfTheNoteInTrash();
                this.notebook.UIManager.openLayer(2);
                break;
        }
    }
    addEventListenersToNotes() {
        const notesSection = document.querySelector(".notes");
        notesSection.addEventListener("click", (e) => {
            let note = e.target.closest(".note");
            if (note) {
                this.noteHandler(note, "normal");
            }
        })
        notesSection.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                let note = e.target.closest(".note");
                if (note) {
                    this.noteHandler(note, "normal");
                }
            }
        })
    }
    addEventListenersToNotesInBin() {
        const binSection = document.querySelector(".bin");
        binSection.addEventListener("click", (e) => {
            let note = e.target.closest(".note");
            if (note) {
                this.noteHandler(note, "bin");
            }
        })
    }
    addEventListenersToNav() {
        this.nav = document.getElementsByClassName("nav")[0];
        this.layer = document.querySelector(".layer1");
        this.menuIcons = Array.from(document.getElementsByClassName("icon-container--menu"));
        this.menuIcons.forEach(menuIcon => {
            menuIcon.addEventListener("click", this.notebook.UIManager.openMenu);
        });
        this.layer.addEventListener("click", this.notebook.UIManager.closeMenu);
        this.nav.addEventListener("click", (e) => {
            const navElement = e.target.closest(".nav-section-element");
            if (navElement) {
                this.navSectionHandler(navElement);
            }
        })
        this.nav.addEventListener("keydown", (e) => {
            if (e.key === `Enter`) {
                const navElement = e.target.closest(".nav-section-element");
                if (navElement) {
                    this.navSectionHandler(navElement);
                }
            }
        })
        window.addEventListener("resize", () => {
            if (window.innerWidth >= 600) {
                this.notebook.UIManager.closeMenu();
            }
        });
    }
    navSectionHandler(element) {
        this.notebook.data.currentNoteId = -1;
        switch (element.getAttribute(`nav-element-type`)) {
            case "category":
                this.notebook.UIManager.changePage("main");
                this.notebook.currentCategory = element.getAttribute("category-name");
                this.notebook.UIManager.reloadFragmentOfThePage("notes");
                break;
            case "noCategory":
                this.notebook.UIManager.changePage("main");
                this.notebook.currentCategory = "";
                this.notebook.UIManager.loadNotes(
                    this.data.notes.filter((note) => note.category === ""),
                    this.notebook.UIManager.notePage
                );
                break;
            case "all":
                this.notebook.UIManager.changePage("main");
                this.notebook.currentCategory = 1;
                this.notebook.UIManager.reloadFragmentOfThePage("notes");
                break;

            case "bin":
                this.notebook.UIManager.changePage("bin");
                this.notebook.UIManager.reloadFragmentOfThePage("deletedNotes");
                break;

            case "editCategory":
                this.notebook.UIManager.changePage("editCategory");
                this.notebook.UIManager.reloadFragmentOfThePage("categories");
                break;

            case "settings":
                this.notebook.UIManager.changePage("settings");
                break;
        }
        this.notebook.UIManager.closeMenu();
        this.notebook.UIManager.setActiveTab(element);
    }
    optionHandler = (e) => {
        const option = e.target.closest(`[option]`);
        if (option) {
            this.optionEventListener(option);
        }
    }
    optionHandlerEnter = (e) => {
        if (e.key === "Enter") {
            this.optionHandler(e);
        }
    }
    addEventListenersToOptions() {
        document.querySelector("body").addEventListener("click", this.optionHandler);
        document.querySelector("body").addEventListener("keydown", this.optionHandlerEnter);
    }
    optionEventListener = (option) => {
        let categoryName;
        switch (option.getAttribute("option")) {
            case "restoreDeletedNotes":
                this.notebook.restoreDeletedNotes();
                this.notebook.UIManager.showPopUpInformation(this.notebook.MESSAGES.announcements.restoredAllNotes)
                DataManager.saveApplicationData(this.data);
                this.notebook.UIManager.reloadFragmentOfThePage("deletedNotes");
                this.notebook.UIManager.hideOptions();
                break;
            case "emptyTheBin":
                this.notebook.emptyTheBin();
                this.notebook.UIManager.showPopUpInformation(this.notebook.MESSAGES.announcements.BinEmptied)
                DataManager.saveApplicationData(this.data);
                this.notebook.UIManager.reloadFragmentOfThePage("deletedNotes");
                this.notebook.UIManager.hideOptions();
                break;
            case "deleteNote":
                this.notebook.UIManager.note.moveNoteToBin();
                this.notebook.UIManager.changePage("main");
                this.data.currentNoteId = -1;
                DataManager.saveApplicationData(this.data);
                this.notebook.UIManager.showPopUpInformation(this.notebook.MESSAGES.announcements.NoteDeleted);
                this.notebook.UIManager.reloadFragmentOfThePage("notes");
                this.notebook.UIManager.hideOptions();
                break;
            case "deleteCategory":
                categoryName = option.closest("[category-name]").getAttribute("category-name")
                /*usuwa kategorię z listy kategorii */
                this.data.categories = this.data.categories.filter((category) => category != categoryName);
                /*usuwa usuniętą kategorię ze wszystkich notatek */
                this.data.notes.forEach((note) => {
                    if (note.category === categoryName) {
                        note.category = "";
                    }
                });
                this.data.trash.forEach((note) => {
                    if (note.category === categoryName) {
                        note.category = "";
                    }
                });
                DataManager.saveApplicationData(this.data);
                this.notebook.UIManager.reloadFragmentOfThePage("categories");
                break;
            case "editNameOfCategory":
                categoryName = option.closest("[category-name]").getAttribute("category-name")
                this.notebook.UIManager.openPopUpCategoryRename(categoryName);
                this.notebook.UIManager.openLayer(2);
                break;
            case "renameCategory":
                this.notebook.renameCategory()
                break;
            case "addNewCategory":
                this.notebook.UIManager.addNewCategory(option);
                break;
            case "cancel":
                this.notebook.UIManager.closePopUp()
                this.notebook.UIManager.closeLayer(2);
                break;
            case "confirmOptionOfNoteInBin":
                this.notebook.UIManager.closePopUp();
                if (document.querySelector(`input[name="noteOption"]:checked`)) {
                    const noteOption = document.querySelector(`input[name="noteOption"]:checked`);
                    switch (noteOption.value) {
                        case "restore":
                            this.notebook.UIManager.note.restoreDeletedNote();
                            this.notebook.UIManager.showPopUpInformation(this.notebook.MESSAGES.announcements.noteRestored)
                            break;
                        case "delete":
                            this.notebook.UIManager.note.deleteNotePermanently();
                            this.notebook.UIManager.showPopUpInformation(this.notebook.MESSAGES.announcements.NoteDeleted);
                            break;
                    }
                    noteOption.checked = false;
                }
                this.notebook.UIManager.closeLayer(2);
                this.notebook.UIManager.reloadFragmentOfThePage("deletedNotes");
                break;
            case "categorize":
                this.notebook.UIManager.openPopUpCategorize();
                this.notebook.UIManager.openLayer(2);
                this.notebook.UIManager.hideOptions();
                break;
            case "selectCategory":
                this.notebook.UIManager.closePopUp();
                this.notebook.UIManager.closeLayer(2);
                this.notebook.UIManager.selectCategory();
                break;
            case "deleteCategoryFromNote":
                const note = this.notebook.data.notes.find((note) => note.id === this.notebook.data.currentNoteId);
                note.category = "";
                this.notebook.UIManager.showPopUpInformation(this.notebook.MESSAGES.announcements.categoryDeletedFromNote);
                this.notebook.UIManager.hideOptions();
                DataManager.saveApplicationData(this.data);
                break;
            case "exportData":
                const exportData = document.getElementById("exportData");
                const data = JSON.stringify(this.data);
                const blob = new Blob([data], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                exportData.href = url;
                exportData.download = "Notebook.txt";
                break;
        }
    }
}
class Notebook {
    constructor() {
        try {
            this.data = DataManager.loadData("NotebookApplicationData");
            if (this.data === null) {
                throw new Error("invalid Data");
            }
        }
        catch (e) {
            console.error(e);
        }
        this.currentPage = "main";
        this.data.currentNoteId = -1;
        this.currentCategory = 1; //1 oznacza wyświetlanie wszystkich notatek
        this.sortNotesByDate();
        this.UIManager = new UIManager(this);
        this.EventManager = new EventManager(this);
        this.loadPage();
    }
    async loadPage() {
        this.languageData = await DataManager.getLanguageData();
        if (this.languageData) {
            this.currentLanguage = this.data.options.lang;
            this.MESSAGES = this.languageData.languages[`${this.currentLanguage}`];
            this.UIManager.loadLanguagesInSelect();
            this.UIManager.loadLanguageOnPage();
        }
        else {
            document.querySelector(".setting_select").parentNode.style.display = "none";
            //jeżeli nie ma języków to z ustawień zniknie możliwość ich wybierania
            this.MESSAGES = DataManager.defaultLanguageDataForAnnouncements();
        }
        this.UIManager.reloadFragmentOfThePage("deletedNotes");
        this.UIManager.reloadFragmentOfThePage("categories");
        this.UIManager.reloadFragmentOfThePage("notes");
        this.EventManager.addDefaultEventListeners();
    }
    changeLanguage(lang) {
        /*jeżeli wybrany język nie zostanie znaleziony w danych językowych, to zmiana się nie odbędzie */
        if (!Object.keys(this.languageData.languages).find(language => language === lang)) {
            return;
        }
        this.data.options.lang = lang;
        this.MESSAGES = this.languageData.languages[`${this.data.options.lang}`];
        this.UIManager.loadLanguageOnPage();
        DataManager.saveApplicationData(this.data);
    }
    renameCategory() {
        const oldNameOfCategory = document.getElementById("nameOfCategory").value;
        const newNameOfCategory = document.querySelector(".pop-up--category-change-name").value;
        if (newNameOfCategory === "") { return; }
        if (this.data.categories.find((category) => category === newNameOfCategory)) {
            let popUpParagraphWrong = document.getElementsByClassName("pop-up_paragraph--wrong")[0];
            popUpParagraphWrong.innerHTML = this.MESSAGES.announcements.CategoryExists;
        }
        else {
            for (let i = 0; i < this.data.categories.length; i++) {
                if (this.data.categories[i] === oldNameOfCategory) {
                    this.data.categories[i] = newNameOfCategory;
                }
            }
            for (let i = 0; i < this.data.notes.length; i++) {
                if (this.data.notes[i].category === oldNameOfCategory) {
                    this.data.notes[i].category = newNameOfCategory;
                }
            }
            for (let i = 0; i < this.data.trash.length; i++) {
                if (this.data.trash[i].category === oldNameOfCategory) {
                    this.data.trash[i].category = newNameOfCategory;
                }
            }
            DataManager.saveApplicationData(this.data);
            this.UIManager.reloadFragmentOfThePage("categories");
            this.UIManager.closePopUp();
            this.UIManager.closeLayer(2);
        }
    }
    sortNotesByDate() {
        this.data.notes = this.data.notes.sort((a, b) => {
            a = a.lastEdited;
            b = b.lastEdited;
            return new Date(`${b.year}-${b.month}-${b.day}T${b.hour}:${b.minute}:${b.second}`).getTime() - new Date(`${a.year}-${a.month}-${a.day}T${a.hour}:${a.minute}:${a.second}`).getTime();
        })
        this.data.trash = this.data.trash.sort((a, b) => {
            a = a.lastEdited;
            b = b.lastEdited;
            return new Date(`${b.year}-${b.month}-${b.day}T${b.hour}:${b.minute}:${b.second}`).getTime() - new Date(`${a.year}-${a.month}-${a.day}T${a.hour}:${a.minute}:${a.second}`).getTime();
        })
    }
    restoreDeletedNotes() {
        this.data.trash.forEach((note) => {
            this.data.notes.push(note);
        })
        this.emptyTheBin();
    }
    emptyTheBin() {
        this.data.trash = [];
    }
}
class Note {
    constructor(data) {
        this.data = data;
        this.btnSave = document.querySelector(".btn-save");
        this.btnSave.addEventListener("click", this.saveNote);
        this.isRestoring = false;
    }
    loadNote() {
        this.noteTitleHTML = document.querySelector(".note-open-title");
        this.noteTextHTML = document.querySelector(".note-open-text");
        this.note = this.data.notes.find((note) => note.id === this.data.currentNoteId);
        this.noteTitleHTML.value = this.note.title;
        this.noteTextHTML.value = this.note.text;
    }
    saveNote = () => {
        this.note.title = this.noteTitleHTML.value;
        this.note.text = this.noteTextHTML.value
        this.note.lastEdited = this.upgradeDateOfNote();
        DataManager.saveApplicationData(this.data);
    }
    moveNoteToBin = () => {
        const currentId = this.data.currentNoteId;
        const noteToRemove = this.data.notes.find((note) => note.id === currentId);
        if (noteToRemove) {
            this.data.notes = this.data.notes.filter((note) => note.id !== currentId)
            this.data.trash.push(noteToRemove);
            DataManager.saveApplicationData(this.data);
        }

    }
    deleteNotePermanently() {
        this.data.trash = this.data.trash.filter((note) => note.id !== this.data.currentNoteId);
        this.data.currentNoteId = -1;
        DataManager.saveApplicationData(this.data);
    }
    restoreDeletedNote() {
        const noteToRestore = this.data.trash.find((note) => note.id === this.data.currentNoteId);
        if (noteToRestore) {
            this.data.trash = this.data.trash.filter((note) => note !== noteToRestore);
            this.data.notes.push(noteToRestore);
            this.data.currentNoteId = -1
            DataManager.saveApplicationData(this.data);
        }
    }
    upgradeDateOfNote() {
        const today = new Date();
        return {
            year: today.getFullYear(),
            month: String(today.getMonth() + 1).padStart(2, '0'),
            day: String(today.getDate()).padStart(2, '0'),
            hour: String(today.getHours()).padStart(2, '0'),
            minute: String(today.getMinutes()).padStart(2, '0'),
            second: String(today.getSeconds()).padStart(2, '0')
        }
    }
    generateUniqueId() {
        let id;
        if (this.data.notes.length === 0) {
            id = 0;
        }
        else {
            do {
                id = Math.floor(Math.random() * 1000);
            } while (this.data.notes.find((note) => note.id === id))
        }
        return id;
    }
    createNote = (category) => {
        let id = this.generateUniqueId();
        category = category === 1 ? "" : category;
        this.data.currentNoteId = id;
        let note = {
            id: id,
            lastEdited: this.upgradeDateOfNote(),
            title: "",
            text: "",
            category: category
        }
        this.data.notes.push(note);
        DataManager.saveApplicationData(this.data);
        this.loadNote();
    }
}
let notebook = new Notebook();