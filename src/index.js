import * as constants from "./constants.js";

$(document).ready(function () {
    /** Section on the main page selectors **/
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