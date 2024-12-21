import * as constants from "./constants.js";

/** Class to adapt the REST countries data into desireable format **/
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
                "landlocked": c.landlocked ? "Yes" : "No",
                "area": c.area ? formatNumberWithSpaces(c.population) + " km²" : "No data.",
                "gini": Object.keys(c.gini).length ? c.gini[Object.keys(c.gini)] + " (" + Object.keys(c.gini)[0] + ")" : "No data.",
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
        console.log(this.processedData);

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
                        prefix += "...)";
                        break;
                    }

                    prefix += suffix + ", ";
                    i++;
                }
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
                new QuizQuestion(randomCorrectAnswersIdxs[i], randomWrongAnswers[i], data)
            );
        }
    }

    /** Return the overall score **/
    getOverallScore() {
        return this.score;
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

    /** Check the answer and update the questions parameters and the overall score **/
    checkAnswer(answerIdx) {
        let currentQuestion = this.questions[this.currentQuestionIdx];

        if(answerIdx === currentQuestion.correctAnswerIdx) {
            currentQuestion.setCorrect();
            currentQuestion.computePoints();
            this.score += currentQuestion.getPoints();
        }
    }

    /** Check if the answers was correct - use only after Check answer! **/
    isAnswerCorrect(answerIdx) {
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

    init(data) {
        this.setHints(data);
        const toShuffle = this.wrongAnswersIdxs;
        toShuffle.push(this.correctAnswerIdx);
        this.allAnswersShuffeledIdxs = shuffleArray(toShuffle);
    }

    setHints(data) {
        const correctAnswerData = data[this.correctAnswerIdx];

        this.startHints = {
            "Region": correctAnswerData.region,
            "Population": correctAnswerData.population,
            "Landlocked": correctAnswerData.landlocked,
            "Area": correctAnswerData.area,
            "Gini index": correctAnswerData.gini,
            "UN member:": correctAnswerData.unMember,
            "Driving side": correctAnswerData.drivingSide,
            "Phone prefix": correctAnswerData.phonePrefix,
            "Currency symbol": correctAnswerData.currencySymbol,
        };

        this.additionalHints = {
            "Subregion": correctAnswerData.subregion,
            "Car license plate signs": correctAnswerData.carPlate,
            "Borders": correctAnswerData.borders,
            "Capital(s)": correctAnswerData.capital,
            "FlagURL": correctAnswerData.flag
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
            console.log("No more hints...");
            return null;
        }

        const keys = Object.keys(this.additionalHints);
        const nextHintVal = this.additionalHints[keys[this.nextHintIdx]];
        const returnVal = [keys[this.nextHintIdx], nextHintVal]

        this.hintsUsed += 1;
        this.nextHintIdx += 1;

        return returnVal;
    }
}

$(document).ready(function () {
    let dataPreprocessor = new RestCountriesDataPreprocessor();

    /** Fetch the data and process it **/
    $.get("../rest_countries.json", function(data) {
        dataPreprocessor.setInitialData(data);
        dataPreprocessor.processData();
    });

    /** Sections on the main page selectors **/
    const introSection = $("#intro");
    const menuSection = $("#menu");
    const categoriesSection = $("#categories");
    const quizSection = $("#quiz");
    const leaderboardSection = $("#leaderboards");
    const learnSection = $("#learn");

    /** Play buttons on category cards selector **/
    const cardPlayButtons = $("#categories .btn");

    /** Current selected menu item **/
    let currentMenuSelection = $('input[name="menu"]:checked').attr('id');

    /** Last selected category when clicked on Play button **/
    let currentQuizCategory = null;

    /** Event listener for the Menu radios **/
    $('input[name="menu"]').on('change', function () {
        currentMenuSelection = $(this).attr('id');
        updateMainScreenContentByMenuSelection();
    });

    /** Event listeners on the play buttons on category cards **/
    cardPlayButtons.click(function () {
        $("html, body").animate({ scrollTop: 0 });
        updateCategory($(this).attr('id'));
        updateMainScreenOnPlayBtnClick();
        // TODO - init quiz
    });

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
        currentQuizCategory = constants.CATEGORY_BTN_ID_TO_KEY[categoryBtnId];
        $("#quiz-heading-category").text(currentQuizCategory.charAt(0).toUpperCase() + currentQuizCategory.slice(1));
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