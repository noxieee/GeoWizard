$(document).ready(function () {
    /** Section on the page selectors **/
    const introSection = $("#intro");
    const menuSection = $("#menu");
    const categoriesSection = $("#categories");
    const quizSection = $("#quiz");
    const leaderboardSection = $("#leaderboards");
    const learnSection = $("#learn");

    /** Current selected menu item **/
    let currentMenuSelection = $('input[name="menu"]:checked').attr('id');

    /** Event listener for the Menu radios **/
    $('input[name="menu"]').on('change', function () {
        currentMenuSelection = $(this).attr('id');
        updateMainScreenContentByMenuSelection();
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
});