import * as constants from "./constants.js";

/** Class to adapt the REST countries data into desirable format **/
class RestCountriesDataPreprocessor {
    constructor() {
        this.data = null;
        this.processedData = null;
    }

    /** Sets initial data to preprocess **/
    setInitialData(data) {
        this.data = data;
    }

    /** Processes the initial data into a desirable format **/
    processData() {
        if(this.data === null) {
            throw "Initial data is null.";
        }

        this.processedData = [];

        for(let c of this.data) {
            let processedCountryData = {
                "nameCommon": c.name.common ? c.name.common : "No data.",
                "nameOfficial": c.name.official ? c.name.official : "No data.",
                "cca3": c.cca3 ? c.cca3 : "No data",
                "region": c.region ? c.region : "No data.",
                "population": c.population ? formatNumberWithSpaces(c.population) : "No data.",
                "hasSea": c.landlocked ? "No" : "Yes",
                "area": c.area ? formatNumberWithSpaces(c.area) + " km²" : "No data.",
                "unMember": c.unMember ? "Yes" : "No",
                "drivingSide": c.car.side ? c.car.side.charAt(0).toUpperCase() + c.car.side.slice(1) : "No data.",
                "phonePrefix": getPhonePrefixes(c),
                "currencySymbol": getCurrencySymbols(c),
                "subregion": c.subregion ? c.subregion : "No data.",
                "carPlate": getCarLicensePlateSigns(c),
                "borders": getCountryNeighbors(c.borders, this.data),
                "capital": getCapitals(c),
                "flag": c.flags.png,
                "maps": c.maps.googleMaps ? c.maps.googleMaps : "No data."
            };

            this.processedData.push(processedCountryData);
        }

        /** Function which gets neighbor common names and returns them as a string **/
        function getCountryNeighbors(bordersCca3, data) {
            let neighborNames = "";

            const neighbors = bordersCca3.map(
                (cca3) => data.find((c) => c.cca3 === cca3).name);

            for(let neighbor of neighbors) {
                neighborNames += neighbor.common + ", ";
            }

            neighborNames = neighborNames.slice(0, -2);

            return neighborNames.length > 0 ? neighborNames : "None";
        }

        /** Function which gets countrie's capital cities and returns them as a string **/
        function getCapitals(country) {
            let capitals = "";

            for(let capital of country.capital) {
                capitals += capital + ", "
            }

            capitals = capitals.slice(0, -2);

            return capitals.length > 0 ? capitals : "No data.";
        }

        /** Function which gets car license plate codes and returns them as a string **/
        function getCarLicensePlateSigns(country) {
            let signs = "";

            for(let sign of country.car.signs) {
                signs += sign + ", ";
            }

            signs = signs.slice(0, -2);

            return signs.length > 0 ? signs : "No data.";
        }

        /** Function which gets countrie's currency symbols and returns them as a string **/
        function getCurrencySymbols(country) {
            const keys = Object.keys(country.currencies);

            let currencies = "";

            for(let key of keys) {
                currencies += country.currencies[key].symbol + ", ";
            }

            currencies = currencies.slice(0, -2);

            return currencies.length > 0 ? currencies : "No data.";
        }

        /** Function which gets countrie's phone prefixes and returns them as a string **/
        function getPhonePrefixes(country) {
            let prefix = country.idd.root;

            if(country.idd.suffixes.length === 1) {
                prefix += country.idd.suffixes[0];
            }
            else if(country.idd.suffixes.length > 1) {
                prefix += "(";
                let i = 0;

                for(let suffix of country.idd.suffixes) {
                    if(i > 4) {
                        break;
                    }

                    prefix += suffix + ", ";
                    i++;
                }

                prefix = prefix.slice(0, -2);
                prefix += "...)";
            }

            return prefix.length > 0 ? prefix : "No data.";
        }
    }

    /** Returns filtered processed data based on category **/
    getProcessedDataByCategory(category) {
        if(this.processedData === null) {
            throw "Processed data is null.";
        }

        if(this.processedData.length === 0) {
            throw "Processed data is empty.";
        }

        if(category === "world") {
            return this.processedData;
        }

        return this.processedData.filter(c => c.region.toLowerCase() === category);
    }
}

/** The quiz class which manages all the quiz data **/
class Quiz {
    constructor(data) {
        this.data = data;
        this.score = 0;
        this.currentQuestionIdx = 0;
        this.questions = [];
        this.init();
    }

    /** Init function **/
    init() {
        const indexes = Array.from({ length: this.data.length },
            (_, i) => i);
        const randomCorrectAnswersIdxs = this.getRandomCorrectAnswersIdxs(indexes);

        // Remove the correct answers from the array of indexes, so the wrong options can't contain them
        for(let i = 0; i < randomCorrectAnswersIdxs.length; i++) {
            let idxToRemove = indexes.indexOf(randomCorrectAnswersIdxs[i]);
            indexes.splice(idxToRemove, 1);
        }

        const randomWrongAnswers = this.getRandomWrongAnswersIdxs(indexes);

        for(let i = 0; i < constants.QUIZ_QUESTION_COUNT; i++) {
            this.questions.push(
                new QuizQuestion(randomCorrectAnswersIdxs[i], randomWrongAnswers[i], this.data)
            );
        }
    }

    /** Return the data used for the quiz **/
    getQuizCountryData() {
        return this.data;
    }

    /** Return the overall score **/
    getOverallScore() {
        return this.score;
    }

    /** Return all the questions **/
    getQuestions() {
        return this.questions;
    }

    /** Get current question number **/
    getCurrentQuestionNumber() {
        return this.currentQuestionIdx + 1;
    }

    /** Update current question index **/
    updateCurrentQuestionIndex() {
        this.currentQuestionIdx += 1;
    }

    /** Returns starting hints for current question **/
    getCurrentQuestionStartHints() {
        return this.questions[this.currentQuestionIdx].getStartHints();
    }

    /** Returns additional hint for current question **/
    getCurrentQuestionNextHint() {
        return this.questions[this.currentQuestionIdx].getHint();
    }

    /** Returns indexes of all possible answers for question **/
    getCurrentQuestionAnswersIdxs() {
        return this.questions[this.currentQuestionIdx].getShuffeledAnswerIdxs();
    }

    /** Returns current questions points **/
    getCurrentQuestionPoints() {
        return this.questions[this.currentQuestionIdx].getPoints();
    }

    /** Returns correct answer index **/
    getCurrentQuestionCorrectAnswerIdx() {
        return this.questions[this.currentQuestionIdx].getCorrectAnswerIdx();
    }

    /** Returns count of hints used in question **/
    getCurrentQuestionHintCount() {
        return this.questions[this.currentQuestionIdx].getHintCount();
    }

    /** Check the answer and update the questions parameters and the overall score **/
    checkAnswer(answerIdx) {
        let currentQuestion = this.questions[this.currentQuestionIdx];

        if(answerIdx === currentQuestion.correctAnswerIdx) {
            currentQuestion.setCorrect();
            currentQuestion.computePoints();
            this.score += currentQuestion.getPoints();
        }

        currentQuestion.setGuessedIdx(answerIdx);
    }

    /** Check if the answers was correct - use only after Check answer! **/
    isAnswerCorrect() {
        return this.questions[this.currentQuestionIdx].getWasCorrect();
    }

    /** Return whether it is the last question of the quiz **/
    isLastQuestion() {
        return this.currentQuestionIdx + 1 === constants.QUIZ_QUESTION_COUNT;
    }

    /** Returns an array of distinct ID's, which represent correct answers **/
    getRandomCorrectAnswersIdxs(indexes) {
        // Shuffle the array of indexes
        let randomCountryIDXS = shuffleArray(indexes);

        // Return only the first n ID's, up to the question count in quiz
        return randomCountryIDXS.slice(0, constants.QUIZ_QUESTION_COUNT);
    }

    /** Returns an array of arrays of ID's, which represent wrong options for each correct **/
    getRandomWrongAnswersIdxs(indexes) {
        const randomWrongAnswers = [];

        for(let i = 0; i < constants.QUIZ_QUESTION_COUNT; i++) {
            const wrongAnswers = shuffleArray(indexes);
            randomWrongAnswers.push(wrongAnswers.slice(0, constants.QUIZ_QUESTION_OPTION_COUNT - 1));
        }

        return randomWrongAnswers;
    }
}

/** Class representing information about a certain question, such as the correct answer and more **/
class QuizQuestion {
    constructor(correctAnswerIdx, wrongAnswersIdxs, data) {
        this.correctAnswerIdx = correctAnswerIdx;
        this.guessIdx = null;
        this.wrongAnswersIdxs = wrongAnswersIdxs;
        this.startHints = null;
        this.additionalHints = null;
        this.hintsUsed = 0;
        this.nextHintIdx = 0;
        this.allAnswersShuffeledIdxs = null;
        this.wasCorrect = false;
        this.points = 0;
        this.init(data);
    }

    /** Init function **/
    init(data) {
        this.setHints(data);
        const toShuffle = this.wrongAnswersIdxs;
        toShuffle.push(this.correctAnswerIdx);
        this.allAnswersShuffeledIdxs = shuffleArray(toShuffle);
    }

    /** Function which sets the hints for the question instance **/
    setHints(data) {
        const correctAnswerData = data[this.correctAnswerIdx];

        this.startHints = {
            "Region": correctAnswerData.region,
            "Population": correctAnswerData.population,
            "Sea access": correctAnswerData.hasSea,
            "Area": correctAnswerData.area,
            "UN member:": correctAnswerData.unMember,
            "Driving side": correctAnswerData.drivingSide,
            "Phone prefix": correctAnswerData.phonePrefix,
            "Currency symbol": correctAnswerData.currencySymbol,
        };

        this.additionalHints = {
            "Subregion": correctAnswerData.subregion,
            "Borders": correctAnswerData.borders,
            "Capital(s)": correctAnswerData.capital,
            "Car license plate signs": correctAnswerData.carPlate,
            "Flag": correctAnswerData.flag
        };
    }

    /** Set the guess idk the player made **/
    setGuessedIdx(guessIdx) {
        this.guessIdx = guessIdx;
    }

    /** Get the summary data **/
    getSummaryData() {
        return {
            "wasCorrect": this.wasCorrect,
            "guessedCountryIdx": this.guessIdx,
            "correctCountryIdx": this.correctAnswerIdx,
            "hintsUsed": this.hintsUsed,
            "points": this.points
        };
    }

    /** Sets question answer as correct **/
    setCorrect() {
        this.wasCorrect = true;
    }

    /** Compute points based on answer and hints **/
    computePoints() {
        if(this.wasCorrect) {
            this.points += constants.QUIZ_QUESTION_MAX_POINTS -
                this.hintsUsed * constants.QUIZ_QUESTION_HINT_PENALIZATION;
        }
    }

    /** Return shuffeled possible answers indexes **/
    getShuffeledAnswerIdxs() {
        return this.allAnswersShuffeledIdxs;
    }

    /** Return points obtained in the question **/
    getPoints() {
        return this.points;
    }

    /** Returns correct answer index **/
    getCorrectAnswerIdx() {
        return this.correctAnswerIdx;
    }

    /** Return if the question was correct **/
    getWasCorrect() {
        return this.wasCorrect;
    }

    /** Returns start hints **/
    getStartHints() {
        return this.startHints;
    }

    /** Returns the next hint **/
    getHint() {
        if(this.hintsUsed >= constants.QUIZ_QUESTION_MAX_HINTS) {
            return null;
        }

        const keys = Object.keys(this.additionalHints);
        const nextHintVal = this.additionalHints[keys[this.nextHintIdx]];
        const returnVal = [keys[this.nextHintIdx], nextHintVal]

        this.hintsUsed += 1;
        this.nextHintIdx += 1;

        return returnVal;
    }

    /** Get hint count **/
    getHintCount() {
        return this.hintsUsed;
    }
}

$(document).ready(function () {
    /** Selectors **/
    const introSection = $("#intro");
    const menuSection = $("#menu");
    const categoriesSection = $("#categories");
    const quizSection = $("#quiz");
    const leaderboardSection = $("#leaderboards");
    const learnSection = $("#learn");

    /** Vital variables **/
    let currentQuizCategory = null;
    let currentLearnCategory = null;
    let dataPreprocessor = new RestCountriesDataPreprocessor();
    let quiz = null;
    let leaderboards = null;
    let learnCache = null;
    let newScoreIndex = null;
    let currentMenuSelection = $('input[name="menu"]:checked').attr('id');

    /** Check if leaderboards are defined, if not, define the initial structure **/
    if(!localStorage.leaderboards) {
        const leaderboards = {};

        for(let category of Object.values(constants.CATEGORY_ID_TO_KEY)) {
            leaderboards[category] = [
                {"score": "", "name": ""},
                {"score": "", "name": ""},
                {"score": "", "name": ""}
            ];
        }

        localStorage.setItem("leaderboards", JSON.stringify(leaderboards));
    }

    /** Check if learn cache structure is defined, if not, define the initial structure **/
    if(!localStorage.learnCache) {
        const learnCache = {};

        for(let category of Object.values(constants.CATEGORY_ID_TO_KEY)) {
            learnCache[category] = 0;
        }

        localStorage.setItem("learnCache", JSON.stringify(learnCache));
    }

    /** Parse the leaderboards and refresh the leaderboards on frontend **/
    leaderboards = JSON.parse(localStorage.leaderboards);
    refreshLeaderboards();

    /** Parse the learnCache and refresh learn section on frontend **/
    learnCache = JSON.parse(localStorage.learnCache);

    /** Fetch the data and process it **/
    $.get("rest_countries.json", function(data) {
        dataPreprocessor.setInitialData(data);
        dataPreprocessor.processData();
        createLearnSection();
    });

    /** Event listener for the Menu buttons **/
    $('input[name="menu"]').on('change', function () {
        currentMenuSelection = $(this).attr('id');
        updateMainScreenContentByMenuSelection();
    });

    // TODO comment
    $("#learn-random-btn").click(function () {
        let max = dataPreprocessor.getProcessedDataByCategory(currentLearnCategory).length - 1;
        let randomIdx = getRandomIntInclusive(0, max);
        updateCountryInfo(currentLearnCategory, null, randomIdx);
        learnCache[currentLearnCategory] = randomIdx;
        localStorage.setItem("learnCache", JSON.stringify(learnCache));
        updateLearnCounter();
    });

    /** Event listener for the hint button **/
    $("#hintBtn").click(function () {
        addAdditionalHint();

        if(quiz.getCurrentQuestionHintCount() === constants.QUIZ_QUESTION_MAX_HINTS) {
            $(this).addClass("disabled");
        }
    });

    /** Event listener for the next step button **/
    $("#quiz-next-step-btn").click(function () {
        $("html, body").animate({ scrollTop: 0 });

        if(quiz.isLastQuestion()) {
            updateScreenOnQuizSummary();
            $(this).text("Next country");
            $(this).append(`
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="mb-1 bi bi-chevron-right" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"/>
                </svg>
            `);
            return;
        }

        quiz.updateCurrentQuestionIndex();
        drawQuestion();
    });

    /** Event listener for the end quiz confirmation modal button **/
    $("#endQuizConfirmationBtn").click(function () {
        $("#quiz").addClass("d-none");

        $("#menu").removeClass("d-none");
        $("#intro").removeClass("d-none");
        $("#categories").removeClass("d-none");

        $("#quiz-next-step-btn").text("Next country");
        $("#quiz-next-step-btn").append(`
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="mb-1 bi bi-chevron-right" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"/>
            </svg>
        `);
    });

    /** Event listener for the back to menu button **/
    $("#quiz-back-to-menu-btn").click(function () {
        quiz = null;
        currentQuizCategory = null;

        $("#quiz-summary").addClass("d-none");
        $("#quiz").addClass("d-none");
        $("#quiz-final-score").addClass("d-none");
        $("#quiz-end-controls").addClass("d-none");
        $("#quiz-on-podium").addClass("d-none");

        $("#end-quiz-btn").removeClass("d-none");
        $("#quiz-progress").removeClass("d-none");
        $("#quiz-initial-clues-and-hints").removeClass("d-none");
        $("#quiz-current-score").removeClass("d-none");
        $("#quiz-answers").removeClass("d-none");
        $("#menu").removeClass("d-none");
        $("#intro").removeClass("d-none");
        $("#categories").removeClass("d-none");
    });

    /** Event listener for the play again button **/
    $("#quiz-play-again-btn").click(function () {
        $("html, body").animate({ scrollTop: 0 });
        quiz = new Quiz(dataPreprocessor.getProcessedDataByCategory(currentQuizCategory));

        $("#quiz-summary").addClass("d-none");
        $("#quiz-final-score").addClass("d-none");
        $("#quiz-end-controls").addClass("d-none");
        $("#quiz-on-podium").addClass("d-none");

        $("#quiz-progress").removeClass("d-none");
        $("#quiz-initial-clues-and-hints").removeClass("d-none");
        $("#quiz-current-score").removeClass("d-none");
        $("#quiz-answers").removeClass("d-none");
        $("#end-quiz-btn").removeClass("d-none");

        drawQuestion();
    });

    /** Event listeners on the play buttons on category cards **/
    $("#categories .btn").click(function () {
        $("html, body").animate({ scrollTop: 0 });
        updateCategory($(this).attr('id'));
        quiz = new Quiz(dataPreprocessor.getProcessedDataByCategory(currentQuizCategory));
        drawQuestion();
        updateMainScreenOnPlayBtnClick();
    });

    /** Event listener on the name textfield button **/
    $("#name-form").submit(function () {
        event.preventDefault();
        const name = $("#name-input").val();
        $("#name-input").val("");

        $("#leaderboard-category-tbody").children(`:nth-child(${newScoreIndex + 1})`).children(":nth-child(2)").text(name);

        leaderboards[currentQuizCategory][newScoreIndex].name = name;
        localStorage.setItem("leaderboards", JSON.stringify(leaderboards));
        refreshLeaderboards();
    });

    // TODO comment
    $("#country-form").submit(function () {
        event.preventDefault();
        const name = $("#country-name-input").val();
        $("#country-name-input").val("");

        updateCountryInfo(null, name, null);
    });

    /** Show the quiz summary **/
    function updateScreenOnQuizSummary() {
        $("#end-quiz-btn").addClass("d-none");
        $("#quiz-initial-clues-and-hints").addClass("d-none");
        $("#quiz-answers").addClass("d-none");
        $("#quiz-progress").addClass("d-none");
        $("#quiz-current-score").addClass("d-none");

        $("#quiz-final-score-label").text(quiz.getOverallScore());
        setSummaryItems();

        newScoreIndex = isHighscore(quiz.getOverallScore());

        if(newScoreIndex !== null) {
            leaderboards[currentQuizCategory].splice(newScoreIndex, 0, {
                "name": "Player",
                "score": quiz.getOverallScore()
            });

            leaderboards[currentQuizCategory].pop();

            localStorage.setItem("leaderboards", JSON.stringify(leaderboards));
            refreshLeaderboards();
            updateLeaderboardOnPodium(newScoreIndex);
            $("#quiz-on-podium").removeClass("d-none");
        }

        $("#quiz-summary").removeClass("d-none");
        $("#quiz-final-score").removeClass("d-none");
        $("#quiz-end-controls").removeClass("d-none");
    }

    // TODO comment
    function updateLeaderboardOnPodium(index) {
        $("#leaderboard-category").text(capitalizeFirstLetterOfString(currentQuizCategory) + " leaderboard");
        $("#leaderboard-category-tbody").empty();

        let position = 1;

        for(let podium of leaderboards[currentQuizCategory]) {
            const tRow = `
                <tr>
                    <th scope="row">${position}</th>
                    <td>${podium.name}</td>
                    <td>${podium.score}</td>
                </tr>
            `;

            $("#leaderboard-category-tbody").append(tRow);

            position++;
        }

        $("#leaderboard-category-tbody").children(`:nth-child(${index + 1})`).addClass("table-info");
    }

    // TODO comment
    function isHighscore(score) {
        let newScoreIndex = null;
        const categoryLeaderboard = leaderboards[currentQuizCategory];

        for(let i = 0; i < 3; i++) {
            const podium = categoryLeaderboard[i];

            if(podium.score === "" || score > podium.score) {
                newScoreIndex = i;
                break;
            }
        }

        return newScoreIndex;
    }

    // TODO comment
    function setSummaryItems() {
        $("#quiz-summary-tbody").empty();

        const quizCountryData = quiz.getQuizCountryData();
        const questions = quiz.getQuestions();
        let i = 1;

        for(let question of questions) {
            let questionData = question.getSummaryData();

            $("#quiz-summary-tbody").append(
                `
                <tr>
                    <th scope="row" class="${questionData.wasCorrect ? 'table-success' : 'table-danger'}">${i}</th>
                    <td>${quizCountryData[questionData.guessedCountryIdx].nameCommon}</td>
                    <td>${quizCountryData[questionData.correctCountryIdx].nameCommon}</td>
                    <td>${questionData.hintsUsed}</td>
                    <td>${questionData.points}</td>
                </tr>
                `
            );

            i++;
        }

        $("#quiz-summary-tbody").append(
            `
            <tr>
                <th scope="row">Total</th>
                <td></td>
                <td></td>
                <td></td>
                <td><b>${quiz.getOverallScore()}</b></td>
            </tr>
            `
        );
    }

    /** Draw the question of the quiz **/
    function drawQuestion() {
        if(quiz.isLastQuestion()) {
            $("#quiz-next-step-btn").text("Finish quiz");
            $("#quiz-next-step-btn").append(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="mb-1 bi bi-chevron-right" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"/>
                        </svg>
            `);
        }

        $("#hintBtn").removeClass("disabled");
        $("#quiz-next-step-btn").addClass("disabled");
        $("#quiz-correct-alert").addClass("d-none");
        $("#quiz-wrong-alert").addClass("d-none");

        $("#initial-clues").empty();
        $("#hints").empty();
        $("#answerBtns").empty();

        updateHintsUsed();
        updateOverallScore();
        updateCountryNo();
        updateProggressbar();
        updateInitialClues();
        updateHintsUsed();
        updateAnswers();
    }

    /** Function to refresh learn section on frontend **/
    function createLearnSection() {
        for (let category of Object.keys(learnCache)) {
            const categoryName = capitalizeFirstLetterOfString(category);

            let tabButton = `
                <li class="nav-item" role="presentation">
                    <button class="nav-link" 
                            id="learn-${category}-tab" 
                            data-bs-toggle="tab" 
                            data-bs-target="#learn-${category}-tab-pane" 
                            type="button" 
                            role="tab" 
                            aria-controls="learn-${category}-tab-pane"
                            value="${category}">
                        ${categoryName}
                    </button>
                </li>
            `;

            $("#learnTabs").append(tabButton);

            let tabContent = constructTabContent(category);

            $("#learnTabContent").append(tabContent);

            updateCountryInfo(category, null, null);
        }

        // TODO comment
        $("#learnTabs li button").click(function () {
            currentLearnCategory = $(this).val();

            if(currentLearnCategory === "search") {
                $("#learn-controls").addClass("d-none");
            }
            else {
                $("#learn-controls").removeClass("d-none");
            }

            updateLearnCounter();
        });

        // TODO comment
        $("#learn-reset-btn").click(function () {
            learnCache[currentLearnCategory] = 0;
            localStorage.setItem("learnCache", JSON.stringify(learnCache));
            updateCountryInfo(currentLearnCategory, null, null);
            updateLearnCounter();
        });

        // TODO comment
        $("#learn-previous-btn").click(function () {
            let previousIdx = learnCache[currentLearnCategory];
            let dataLength = dataPreprocessor.getProcessedDataByCategory(currentLearnCategory).length;
            previousIdx -= 1;

            if(previousIdx < 0) {
                previousIdx = dataLength - 1;
            }

            learnCache[currentLearnCategory] = previousIdx;
            localStorage.setItem("learnCache", JSON.stringify(learnCache));

            updateCountryInfo(currentLearnCategory, null, null);
            updateLearnCounter();
        });

        $("#learn-next-btn").click(function () {
            let nextIdx = learnCache[currentLearnCategory];
            let dataLength = dataPreprocessor.getProcessedDataByCategory(currentLearnCategory).length;
            nextIdx += 1;

            if(nextIdx > dataLength - 1) {
                nextIdx = 0;
            }

            learnCache[currentLearnCategory] = nextIdx;
            localStorage.setItem("learnCache", JSON.stringify(learnCache));

            updateCountryInfo(currentLearnCategory, null, null);
            updateLearnCounter();
        });

        $("#learnTabs").children().first().find("button").addClass("active");
        $("#learnTabContent").children().first().addClass("show active");
        currentLearnCategory = "search";
    }

    // TODO comment
    function updateLearnCounter() {
        $("#learn-counter").text(`${learnCache[currentLearnCategory] + 1} / ${dataPreprocessor.getProcessedDataByCategory(currentLearnCategory).length}`);
    }

    // TODO comment
    function constructTabContent(category) {
        let tabContent = `
                <div class="tab-pane fade" 
                     id="learn-${category}-tab-pane" 
                     role="tabpanel" 
                     aria-labelledby="learn-${category}-tab">
                     
                    <div id="learn-${category}-tab-pane-country" class="container d-flex flex-column p-0 m-0 gap-4">
                        
                    </div>
                </div>
            `;
        return tabContent;
    }

    //TODO comment
    function updateCountryInfo(category, name, index) {
        let countryData;

        if(name !== null) {
            countryData = getCountryByName(name);
            category = "search";

            $(`#learn-${category}-tab-pane-country`).empty();

            if(countryData.length > 1) {
                $(`#learn-${category}-tab-pane-country`).append(`
                    <div class="alert alert-warning w-50" role="alert">
                        Too many results. Try to search more specifically.
                    </div>
                `);

                return;
            } else if (countryData.length === 0) {
                $(`#learn-${category}-tab-pane-country`).append(`
                    <div class="alert alert-danger w-50" role="alert">
                        No results found.
                    </div>
                `);

                return;
            }
            else {
                countryData = countryData[0];
            }
        } else if(index !== null) {
            countryData = dataPreprocessor.getProcessedDataByCategory(category)[index];
        }
        else {
            countryData = dataPreprocessor.getProcessedDataByCategory(category)[learnCache[category]];
        }

        $(`#learn-${category}-tab-pane-country`).empty();

        $(`#learn-${category}-tab-pane-country`).append(`
            <div class="container d-flex flex-row p-0 m-0 gap-3">
                <img class="border border-dark-subtle rounded-1" src=${countryData.flag} alt="" width="184">
                <div class="container d-flex flex-column gap-3 p-0 m-0">
                    <h3 class="p-0 m-0">${countryData.nameCommon}</h3>
                    <a href="${countryData.maps}" class="d-flex gap-2 align-items-center btn btn-outline-dark align-self-start" target="_blank">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-geo-alt" viewBox="0 0 16 16">
                            <path d="M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A32 32 0 0 1 8 14.58a32 32 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10"/>
                            <path d="M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4m0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/>
                        </svg>
                        Show on google maps
                    </a>
                </div>
            </div>

       
            <div class="container d-flex flex-row gap-5 p-0 m-0">
                <div class="container p-0 m-0">
                    <ul class="list-group">
                        <li class="list-group-item">
                            <div class="container d-flex flex-row p-0 m-0">
                                <h5 class="m-0 col-5">Official name</h5>
                                <p class="m-0 col">${countryData.nameOfficial}</p>
                            </div>
                        </li>
                        <li class="list-group-item">
                            <div class="container d-flex flex-row p-0 m-0">
                                <h5 class="m-0 col-5">Capital(s)</h5>
                                <p class="m-0 col">${countryData.capital}</p>
                            </div>
                        </li>
                        <li class="list-group-item">
                            <div class="container d-flex flex-row p-0 m-0">
                                <h5 class="m-0 col-5">Region</h5>
                                <p class="m-0 col">${countryData.region}</p>
                            </div>
                        </li>
                        <li class="list-group-item">
                            <div class="container d-flex flex-row p-0 m-0">
                                <h5 class="m-0 col-5">Subregion</h5>
                                <p class="m-0 col">${countryData.subregion}</p>
                            </div>
                        </li>
                        <li class="list-group-item">
                            <div class="container d-flex flex-row p-0 m-0">
                                <h5 class="m-0 col-5">Borders</h5>
                                <p class="m-0 col">${countryData.borders}</p>
                            </div>
                        </li>
                        <li class="list-group-item">
                            <div class="container d-flex flex-row p-0 m-0">
                                <h5 class="m-0 col-5">Area</h5>
                                <p class="m-0 col">${countryData.area}</p>
                            </div>
                        </li>
                        <li class="list-group-item">
                            <div class="container d-flex flex-row p-0 m-0">
                                <h5 class="m-0 col-5">Population</h5>
                                <p class="m-0 col">${countryData.population}</p>
                            </div>
                        </li>
                    </ul>
                </div>
                
                <div class="container p-0 m-0">
                    <ul class="list-group">
                        <li class="list-group-item">
                            <div class="container d-flex flex-row p-0 m-0">
                                <h5 class="m-0 col-5">Sea access</h5>
                                <p class="m-0 col">${countryData.hasSea}</p>
                            </div>
                        </li>
                        <li class="list-group-item">
                            <div class="container d-flex flex-row p-0 m-0">
                                <h5 class="m-0 col-5">UN member</h5>
                                <p class="m-0 col">${countryData.unMember}</p>
                            </div>
                        </li>
                        <li class="list-group-item">
                            <div class="container d-flex flex-row p-0 m-0">
                                <h5 class="m-0 col-5">Driving side</h5>
                                <p class="m-0 col">${countryData.drivingSide}</p>
                            </div>
                        </li>
                        <li class="list-group-item">
                            <div class="container d-flex flex-row p-0 m-0">
                                <h5 class="m-0 col-5">Car license plate</h5>
                                <p class="m-0 col">${countryData.carPlate}</p>
                            </div>
                        </li>
                        <li class="list-group-item">
                            <div class="container d-flex flex-row p-0 m-0">
                                <h5 class="m-0 col-5">CCA3 identificator</h5>
                                <p class="m-0 col">${countryData.cca3}</p>
                            </div>
                        </li>
                        <li class="list-group-item">
                            <div class="container d-flex flex-row p-0 m-0">
                                <h5 class="m-0 col-5">Phone prefix</h5>
                                <p class="m-0 col">${countryData.phonePrefix}</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        `);
    }

    /** Function to refresh leaderboards on frontend **/
    function refreshLeaderboards() {
        // Clear existing tabs and tab content

        for (let category of Object.keys(leaderboards)) {
            const categoryName = capitalizeFirstLetterOfString(category);

            let tabButton = `
                <li class="nav-item" role="presentation">
                    <button class="nav-link" 
                            id="${category}-tab" 
                            data-bs-toggle="tab" 
                            data-bs-target="#${category}-tab-pane" 
                            type="button" 
                            role="tab" 
                            aria-controls="${category}-tab-pane">
                        ${categoryName}
                    </button>
                </li>
            `;

            $("#leaderboardsTabs").append(tabButton);

            let tabContent = `
                <div class="tab-pane fade" 
                     id="${category}-tab-pane" 
                     role="tabpanel" 
                     aria-labelledby="${category}-tab">
                     
                    <table class="table w-50">
                        <thead>
                        <tr>
                            <th scope="col">#</th>
                            <th scope="col">Name</th>
                            <th scope="col">Score</th>
                        </tr>
                        </thead>
                        <tbody class="table-group-divider">
                            <tr>
                                <th class="table-warning" scope="row">1</th>
                                <td>${leaderboards[category][0].name}</td>
                                <td>${leaderboards[category][0].score}</td>
                            </tr>
                            <tr>
                                <th class="table-secondary" scope="row">2</th>
                                <td>${leaderboards[category][1].name}</td>
                                <td>${leaderboards[category][1].score}</td>
                            </tr>
                            <tr>
                                <th class="table-danger" scope="row">3</th>
                                <td>${leaderboards[category][2].name}</td>
                                <td>${leaderboards[category][2].score}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;

            $("#leaderboardTabContent").append(tabContent);
        }

        $("#leaderboardsTabs").children().first().find("button").addClass("active");
        $("#leaderboardTabContent").children().first().addClass("show active");
    }

    /** Add additional hint **/
    function addAdditionalHint() {
        let additionalHint = quiz.getCurrentQuestionNextHint();
        let liElement;

        if(additionalHint[0] === "Flag") {
            liElement = `
                <li class="list-group-item">
                    <div class="container d-flex flex-row p-0 m-0">
                        <h5 class="m-0 col-5">${additionalHint[0]}</h5>
                        <img class="border border-dark-subtle rounded-1" src=${additionalHint[1]} alt="" height="120">
                    </div>
                </li>
            `;
        }
        else {
            liElement = `
                <li class="list-group-item">
                    <div class="container d-flex flex-row p-0 m-0">
                        <h5 class="m-0 col-5">${additionalHint[0]}</h5>
                        <p class="m-0 col">${additionalHint[1]}</p>
                    </div>
                </li>
            `;
        }

        $("#hints").append(liElement);
        updateHintsUsed();
    }

    /** Update answers **/
    function updateAnswers() {
        let answerIdxs = quiz.getCurrentQuestionAnswersIdxs();

        for(let idx of answerIdxs) {
            let countryName = quiz.data[idx].nameCommon;

            let btnElement = `
                <button id=${idx} type="button" class="btn btn-outline-primary">${countryName}</button>
            `;

            $("#answerBtns").append(btnElement);
        }

        /** Answer button event listener **/
        $("#answerBtns button").click(answerBtnClickHandler);
    }

    /** Answer button click handler **/
    function answerBtnClickHandler() {
        $(this).parent().children().addClass("disabled");
        $("#hintBtn").addClass("disabled");
        $("#quiz-next-step-btn").removeClass("disabled");

        let clickedId = Number($(this).attr('id'));

        quiz.checkAnswer(clickedId);
        let isCorrect = quiz.isAnswerCorrect(clickedId);

        if(isCorrect) {
            let points = quiz.getCurrentQuestionPoints();
            $("#quiz-correct-alert").text("Correct! You earn " + points + " points.").removeClass("d-none");
            $(this).addClass("btn-success").removeClass("btn-outline-primary").prepend(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="mb-1bi bi-check-lg" viewBox="0 0 16 16">
                        <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/>
                    </svg>
                `);
        }
        else {
            $("#quiz-wrong-alert").removeClass("d-none");
            $(this).addClass("btn-danger").removeClass("btn-outline-primary").prepend(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="mb-1 bi bi-x-lg" viewBox="0 0 16 16">
                        <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
                    </svg>
                `);
            $(`#${quiz.getCurrentQuestionCorrectAnswerIdx()}`).addClass("btn-success").removeClass("btn-outline-primary");
        }

        $("#quiz-overall-score").text(quiz.getOverallScore());
    }

    /** Update initial clues **/
    function updateInitialClues() {
        let initialClues = quiz.getCurrentQuestionStartHints();

        for(let key of Object.keys(initialClues)) {
            let liElement = `
                <li class="list-group-item">
                    <div class="container d-flex flex-row p-0 m-0">
                        <h5 class="m-0 col-5">${key}</h5>
                        <p class="m-0 col">${initialClues[key]}</p>
                    </div>
                </li>
            `;

            $("#initial-clues").append(liElement);
        }
    }

    /** Update progressbar **/
    function updateProggressbar() {
        $("#quiz-progress .progress-bar").css("width", `${quiz.getCurrentQuestionNumber() / constants.QUIZ_QUESTION_COUNT * 100}%`);
    }

    /** Update hints used **/
    function updateHintsUsed() {
        $("#quiz-hints-count").text(quiz.getCurrentQuestionHintCount() + "/" + constants.QUIZ_QUESTION_MAX_HINTS);
    }

    /** Update quiz overall score **/
    function updateOverallScore() {
        $("#quiz-overall-score").text(quiz.getOverallScore());
    }

    /** Update country number (quiz question number) **/
    function updateCountryNo() {
        $("#quiz-country-no").text(quiz.getCurrentQuestionNumber() + "/" + constants.QUIZ_QUESTION_COUNT);
    }

    /** Function to update the content depending on current Menu selection **/
    function updateMainScreenContentByMenuSelection() {
        switch (currentMenuSelection) {
            case "menu-quiz-radio":
                categoriesSection.removeClass("d-none");
                leaderboardSection.addClass("d-none");
                learnSection.addClass("d-none");
                break;
            case "menu-leaderboards-radio":
                categoriesSection.addClass("d-none");
                leaderboardSection.removeClass("d-none");
                learnSection.addClass("d-none");
                break;
            case "menu-learn-radio":
                categoriesSection.addClass("d-none");
                leaderboardSection.addClass("d-none");
                learnSection.removeClass("d-none");
                break;
            default:
                throw("ERROR: Switch case does not match the menu radio ID.");
        }
    }

    /** Function to update the content when the Play button is clicked **/
    function updateMainScreenOnPlayBtnClick() {
        introSection.addClass("d-none");
        menuSection.addClass("d-none");
        categoriesSection.addClass("d-none");
        quizSection.removeClass("d-none");
    }

    /** Function to update the category when Play button is clicked and the heading category in quiz **/
    function updateCategory(categoryBtnId) {
        currentQuizCategory = constants.CATEGORY_ID_TO_KEY[categoryBtnId];
        $("#quiz-heading-category").text(capitalizeFirstLetterOfString(currentQuizCategory));
    }

    /** Search a country **/
    function getCountryByName(name) {
        return fuzzySearch(name, dataPreprocessor.getProcessedDataByCategory("world"), ["nameCommon", "nameOfficial"]);
    }
});

/** Formats a number so it contains spaces between characters **/
function formatNumberWithSpaces(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** Shuffles the array using Fisher-Yates Shuffle and returns a new array **/
function shuffleArray(array) {
    const arrayCpy = array.slice();
    const arrayLength = arrayCpy.length;

    for (let i = arrayLength - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [arrayCpy[i], arrayCpy[j]] = [arrayCpy[j], arrayCpy[i]];
    }

    return arrayCpy;
}

/** Capitalize the first letter of a string and return the new string **/
function capitalizeFirstLetterOfString(stringToCapitalize) {
    return stringToCapitalize.charAt(0).toUpperCase() + stringToCapitalize.slice(1);
}

/** Get random integer in range **/
function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** FROM GPT - fuzzysearch **/
function levenshteinDistance(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, (_, i) => Array(b.length + 1).fill(i));
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,        // Deletion
                matrix[i][j - 1] + 1,        // Insertion
                matrix[i - 1][j - 1] + cost  // Substitution
            );
        }
    }
    return matrix[a.length][b.length];
}

/** FROM GPT - fuzzysearch **/
function fuzzySearch(query, objects, keys, threshold = 1) {
    query = query.toLowerCase();
    return objects.filter((obj) => {
        return keys.some((key) => {
            const fieldValue = obj[key].toLowerCase();
            const distance = levenshteinDistance(query, fieldValue);
            return distance <= threshold || fieldValue.includes(query);
        });
    });
}