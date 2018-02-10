// this script must be placed below Atlas


$(function () {

    var mvaClicked = false;

    // add page view event for campaigns associated trainings
    switch (window.location.pathname.toLowerCase()) {
        case '/learningpath/mietrainer':
            trackAtlasEvent('11087208014961', 'USCMO_MIETrainerOnDemand_Vue_Sit_MIETrainerOnDemand_LP');
            break;

        case '/gettrained/teacher-academy-onenote-the-ultimate-collaboration-tool':
            trackAtlasEvent('11087208014961', 'USCMO_OneNoteOnDemand_Vue_Sit_OneNoteOnDemand_LP');
            break;

        case '/gettrained/teachccga':
            trackAtlasEvent('11087208014961', 'USCMO_CCGAOnDemand_Vue_Sit_CCGAOnDemand_LP');
            break;

        default:
            createAtlasTag("11087208014961");

    }

});
