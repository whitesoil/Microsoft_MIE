/* global Mustache, getModule, getModuleDisplayTemplate, getModulesByType, storyView, storyLocalizations, getStory, removeModule, exports, global, register, preProcessAffiliatedUserData, preProcessAuthorData, preProcessFeaturedData, preProcessHeaderData, preProcessIntroductionData, USERPACKAGECATEGORYID:true, USERPACKAGESUBCATEGORYID:true */

var templates = [];
var modules = [];
var displayTemplate = {};
var story;

$(function () {

    // initEvents();
    initModuleTemplates(function () {
        if ($("#token").length > 0) {
            getStory($("#token").val(), "View");
        }
    });

    $('#story').on('click', '.btn-videoquality', function (event) {
        event.stopPropagation();

        var videoQualityBtn = $(this).find('.glyphicon');
        var videoPlayer = $(this).closest('.videoContainer').find('video').get(0);

        if ($(videoQualityBtn).hasClass('glyphicon-sd-video')) {
            $(videoQualityBtn).removeClass('glyphicon-sd-video').addClass('glyphicon-hd-video');
            $(videoPlayer).find('.video-hd').detach().prependTo($(videoPlayer));
        } else {
            $(videoQualityBtn).removeClass('glyphicon-hd-video').addClass('glyphicon-sd-video');
            $(videoPlayer).find('.video-sd').detach().prependTo($(videoPlayer));
        }
        videoPlayer.load();
        videoPlayer.play();
    });

   


});

function initModuleTemplates(callback) {

    $.get("/Assets/Modules/module-tpl.html", { "_": $.now() }, function (results) {
        templates.MODULE_CANVAS_TEMPLATE = $(results).filter("#ModuleWrapperTpl").html();
    });

    $.get("/Assets/Modules/display-tpl.min.html", function (results) {
        $(results).filter("[data-module-type]").each(function (index, element) {
            var layout = { Layout: $(element).attr("data-module-layout"), Html: $(element).html().replace("flashobject", "object") };
            if (displayTemplate[$(element).attr("data-module-type")] === undefined) {
                displayTemplate[$(element).attr("data-module-type")] = [];
            }
            displayTemplate[$(element).attr("data-module-type")].push(layout);
        });

        // execute the callback 
        if (typeof callback == 'function') {
            callback();
        }

        $.get("/Assets/Templates/expertzone/tags.html", { "_": $.now() }, function (results) {
            templates.STORY_TAGS_TEMPLATE = $(results).filter("#tagsTpl").html();
        });

    });


}

function loadStoryModuleData(data, isPreview) {

    if (data.Progress !== undefined && data.Progress !== null && data.Progress.FinishedTimestamp === null) {
        storyView.Progress = data.Progress;
        storyView.Progress.Modules = JSON.parse(data.Progress.ProgressData);
    } else {
        storyView.Progress = { Modules: [] };
        storyView.Progress.FinishedTimestamp = null;
        storyView.Progress.StartedTimestamp = null;
    }

    $.each(data.Modules, function (index, value) {
        var storyModule = value;
        storyModule.Content = JSON.parse(storyModule.ContentData);
        storyModule.index = index;
        storyModule.ProcessingStatus = "Pending";
        modules.push(storyModule);
    });

    var modulesLength = modules.length;
    for (var i = 0; i < modulesLength; i++) {
        var storyModule = modules[i];
        loadStoryModuleProgressData(storyModule);
        preProcessModuleData(storyModule);
        renderModule(modules[i], $("#story"));

        if (!isPreview && story.IsProgressTrackable && storyModule.TrackingEnabled) {
            attachModuleTracking(storyModule);
        }
        $(document).trigger("OnModuleRenderComplete", { data: storyModule });
    }

    var $affiliateUsersModule = $('.story-affiliatedusers .tile-wrapper');
    if ($affiliateUsersModule.length) {
        initUserTileEvents();
        $affiliateUsersModule.ezRotateTile();
    }

    // move the metrics bar for landing page
    if (storyView.Story.Type === "LandingPage") {
        $('.bdo-display-metrics-toolbar').appendTo(".module[data-module-type='Header']");
        $('.bdo-display-metrics-toolbar').appendTo(".module[data-module-type='Banner']");
        $('.bdo-display-metrics-toolbar').appendTo(".module .display-engagement-bar-below");
    }

    $(document).trigger("OnStoryRenderComplete", { data: data.Modules });

    if ($(".module[data-module-type='Recommended']").length > 0) {

        // add tracking event for recommendation click
        $(".module[data-module-type='Recommended']").on('click', "div.tile[data-recommended='true']", function (event) {
            callRecommendedClick($(this).attr("data-token"));
        });

        // add tracking event for compact widget recommendation click
        $(".module[data-module-type='Recommended']").on('click', ".recommended-aside.sticky .compact-recommendedbuttons li a[data-recommended='true']", function (event) {
            callRecommendedClick($(this).attr("data-token"));
        });

        // add tracking event for expanded widget recommendation click
        $(".module[data-module-type='Recommended']").on('click', ".recommended-aside.sticky .expanded-recommendedbuttons li a[data-recommended='true']", function (event) {
            callRecommendedClick($(this).attr("data-token"));
        });

    }

    if ($(".module[data-module-type='TileContent']").length > 0)
    {
        // add tracking event for recommendation click
        $(".module[data-module-type='TileContent']").on('click', "div.tile-content[data-recommended='true']", function (event) {
            callRecommendedClick($(this).attr("data-token"));
        });
    }

    var urlPath = window.location.pathname.toLowerCase();
    if (story.Type.toLowerCase() === "landingpage") {
        $(".story-type-name").addClass("hidden");
        if (urlPath == storyView.TopLevelCategoryUrl.toLowerCase()) {
            $(".story-category-name").text($(".story-category-name a").text());
        }
        if (storyView.CategoryId == 7000) {
            $(".story-category-name").addClass("hidden");
            $(".story-sub-category-name").addClass("hidden");
        }
        if (urlPath == storyView.CategoryUrl.toLowerCase()) {
            //$(".story-sub-category-name").addClass("hidden");
            $(".story-sub-category-name").text($(".story-sub-category-name a").text());
        }
    }

}

function callRecommendedClick(recommendedToken)
{

    if (recommendedToken!=="")
    {

        var data = {
            token: recommendedToken
        };

        $.ajax({
            url: '/Story/API/RecommendationClick',
            data: data,
            async: false,
            type: "POST",
            //contentType: 'application/json',
            dataType: "json",
            cache: false
        });

    }
}

function loadStoryModuleProgressData(module) {

    var lastModuleIndex = getLastModuleCompleteIndex(modules);

    var progress = $.grep(storyView.Progress.Modules, function (data) {
        if (data !== undefined && data !== null) {
            return (data.Id === module.Id);
        }
        return false;
    });

    // if the story is not complete then we should load the recent progress so the user can finish
    if (progress.length === 1 && storyView.Progress.FinishedTimestamp === null) {
        module.Progress = progress[0];
    } else {
        module.Progress = {};
        module.Progress.Id = module.Id;
        module.Progress.StartedTimestamp = null;
        module.Progress.FinishedTimestamp = null;
        // TODO: verify need to complete newly added modules to in-progress stories
        module.Progress.Status = ((module.index <= lastModuleIndex) ? "Completed" : "Pending");
    }

    module.Progress.IsStarted = (function (module) {
        return (this.StartedTimestamp !== null);
    });

    if (module.TrackingEnabled) {
        module.Progress.IsFinished = (function (module) {
            return (this.FinishedTimestamp !== null);
        });
    } else {
        module.Progress.IsFinished = (function (module) {
            return true;
        });
    }

}

function getLastModuleCompleteIndex(modules) {
    var lastModuleIndex = -1;
    if (storyView.Progress !== null && storyView.Progress !== undefined) {
        $.each(modules, function (i, m) {
            if (storyView.Progress.LastModuleId !== undefined && m.Id === storyView.Progress.LastModuleId) {
                lastModuleIndex = i;
            }
        });
    }
    return lastModuleIndex;
}

function preProcessModuleData(module) {
    if (module === undefined || module.Content === undefined || module.Content.Type === undefined) {
        return;
    }

    //fix modules where the parent array was saved into each child element
    for (var key in module.Content) {
        if (module.Content.hasOwnProperty(key)) {
            var thisElement = module.Content[key];
            if (Array.isArray(thisElement) && thisElement.length > 0) {
                var firstInArray = thisElement[0];
                if (Array.isArray(firstInArray) && firstInArray.length > 0 && firstInArray.length === thisElement.length) {
                    module.Content[key] = firstInArray;
                }
            }
        }
    }

    var i;
    switch (module.Content.Type.toLowerCase()) {
        case "quiz":
            if (module.Content.Randomize !== undefined && module.Content.Randomize !== null && module.Content.Randomize.toString() === "true") {
                module.Content.Questions = window.knuthShuffle(module.Content.Questions);
                for (i = 0; i < module.Content.Questions.length; i++) {
                    module.Content.Questions[i].SortOrder = i;
                }
            }
            break;
        case "survey":
            break;
        case "video":
            if (typeof (module.Content.IsEmbedded) === "string") {
                module.Content.IsEmbedded = module.Content.IsEmbedded.toLowerCase() === "true";
            }
            if (typeof (module.HiDefUrl) === "string" && module.HiDefUrl.length > 0) {
                module.Content.HiDefUrl = module.HiDefUrl;
            }
            break;
        case "introduction":
            if (!storyView.IsRegisteredForLesson) {
                module.Content.ActionButtonText = storyLocalizations.skyperegistration.RegisterForLesson + " " + story.TypeTitle;
                module.Content.Function = "register";
            }
            //else {
            //    module.Content.ActionButtonText = storyLocalizations.skyperegistration.UnRegisterForLesson + " " + story.TypeTitle;
            //    module.Content.Function = "unregister";
            // }
            preProcessIntroductionData(module, false);

            break;

        case "affiliateduser":
            preProcessAffiliatedUserData(module, false);
            break;

        case "header":
            preProcessHeaderData(module, false);
            USERPACKAGECATEGORYID = module.Content.TopLevelCategoryId;
            USERPACKAGESUBCATEGORYID = module.Content.SubCategoryId;
            break;
        case "featured":
            preProcessFeaturedData(module, false);
            break;
        case "postedby":
            preProcessAuthorData(module, false);
            break;
        case "scorm":
            preProcessSCORMData(module, false);
            break;
        case "tilecontent":
            if (module.Content.TileContentType.toLowerCase() === 'recommended') {
                module.Content.IsTileContentTypeRecommended = true;
            }
            break;
        case "globalfilter":
            if (module.Content.AutoGenerateTiles === undefined || module.Content.AutoGenerateTiles === null) {
                module.Content.AutoGenerateTiles = true;
            }

            //Existing modules don't have a ShowClear property so it needs to default to true so the Clear Button show up
            if (module.Content.ShowClear === undefined) {
                module.Content.ShowClear = true;
            }
        default:

    }
}

function attachModuleTracking(module) {

    var moduleElement = $(String.format(".module[data-module-id={0}]", module.Content.Identifier));
    var moduleTrackingFinishOnViewHandler = function () { trackModuleView($(moduleElement), false); };
    var moduleTrackingStartOnViewHandler = function () { trackModuleView($(moduleElement), true); };

    switch (module.Content.Type.toLowerCase()) {

        case "text":
        case "quote":
            $(window).on('DOMContentLoaded load resize scroll', moduleTrackingFinishOnViewHandler);
            break;
        case "image":
            if (module.Content.Layout.toLowerCase() === "image-gallery") {
                $(window).on('DOMContentLoaded load resize scroll', moduleTrackingStartOnViewHandler);
                $(moduleElement).find(".carousel").bind('slid.bs.carousel', function () {
                    var lastItem = $(this).find(".carousel-inner .item:last");
                    if (lastItem.length > 0 && $(lastItem).hasClass("active")) {
                        if (!module.Progress.IsFinished()) {
                            markModuleAsFinished(module);
                            saveProgress(module);
                        }
                    }
                });
            }
            else {
                $(window).on('DOMContentLoaded load resize scroll', moduleTrackingFinishOnViewHandler);
            }
            break;
        case "video":
            $(moduleElement).find("video").on("play", function () {
                if (!module.Progress.IsStarted() && !module.Progress.IsFinished()) {
                    markModuleAsStarted(module);
                    saveProgress(module);
                }
            });

            $(moduleElement).find("video").on("ended", function () {
                if (!module.Progress.IsFinished()) {
                    markModuleAsFinished(module);
                    saveProgress(module);
                }
            });

            if (module.Content.IsEmbedded.toString().toLowerCase() === "true") {
                // mark embedded videos or videos in IE8 as watched
                $(window).on('DOMContentLoaded load resize scroll', moduleTrackingFinishOnViewHandler);
            }

            break;
        case "knowledgecheck":
        case "quiz":
            $(moduleElement).find(".btn-startquiz").bind("click", function () {
                markModuleAsStarted(module);
                saveProgress(module);
            });

            break;

        case "introduction":
            $(window).on('DOMContentLoaded load resize scroll', moduleTrackingFinishOnViewHandler);
            break;

        default:
            $(window).on('DOMContentLoaded load resize scroll', moduleTrackingFinishOnViewHandler);
            break;

    }

}

function markQuizComplete(module) {
    if (!module.Progress.IsFinished()) {
        markModuleAsFinished(module);
        saveProgress(module);
    }
}

function markModuleAsStarted(module) {
    if (module.Progress.StartedTimestamp === null) {
        module.Progress.StartedTimestamp = new Date().toISOString();
        module.Progress.Status = "InProgress";
    }
}

function markModuleAsFinished(module) {
    if (isPreviousModuleComplete(module)) {
        // in the event the user uses page down or shift end and the bottom of the module
        // becomes in view or they scroll backwards
        if (module.Progress.StartedTimestamp === null) {
            module.Progress.StartedTimestamp = new Date().toISOString();
        }
        module.Progress.FinishedTimestamp = new Date().toISOString();
        module.Progress.Status = "Completed";
    }
}

function trackModuleView(el, startedOnly) {
    var id = $(el).attr("data-module-id");

    if ($(el).attr("data-tracking-complete") !== "y") {
        var module = getModule(id);

        if (jQuery !== undefined && el instanceof jQuery) {
            el = el[0];
        }

        var rect = el.getBoundingClientRect();

        if (rect.top >= 0 && rect.top <= (window.innerHeight || document.documentElement.clientHeight)) {
            markModuleAsStarted(module);
        }

        if (!startedOnly && (rect.bottom <= (window.innerHeight || document.documentElement.clientHeight))) {
            markModuleAsFinished(module);
        }

        if (((startedOnly && module.Progress.IsStarted()) || (module.Progress.IsStarted() && module.Progress.IsFinished())) && module.ProcessingStatus !== "Completed") {
            saveProgress(module);
        }
    }
}

function renderPreview() {
    $('.navbar-search').remove();
    $('.navbar-nav').not('.navbar-profile').remove();

}

function bindHeaderImage() {
    var headerImage = getStoryImageByDescription("w1200h186");
    if (headerImage !== null) {
        $(".jumbotron-story-header").css("background-image", String.format("url('{0}')", headerImage.Url));
    }
}

function getStoryImageByDescription(description) {
    var storyImagesLength = story.Images.length;
    for (var i = 0; i < storyImagesLength; i++) {
        if (story.Images[i].Description === description) {
            return story.Images[i];
        }
    }
    return null;
}

function renderModule(storyModule, container) {
    if (storyModule.Content.Type === undefined) {
        storyModule.Content.Type = "text";
    }

    // detect malformed data in image module and fix
    if (storyModule.TypeId === 2 && storyModule.Content.Images !== undefined && storyModule.Content.Images !== null && storyModule.Content.Images.length > 0 && storyModule.Content.Images[0][0] != undefined) {
        storyModule.Content.Images = storyModule.Content.Images[0];
    }

    var template = null;
    var ReturnUrl = "";
    storyModule.Content.StoryType = story.Type;
    if (storyView.IsPublicView) {
        template = getModuleDisplayTemplate(storyModule.Content.Type.toLowerCase(), "public");
        if (storyModule.Content.Type.toLowerCase() == "quiz") {
            storyModule.Content.ReturnUrl = "/Start/Welcome?ReturnUrl=" + encodeURIComponent(window.location.pathname + window.location.search);

        }

    }

    if (template === null || template === undefined) {
        template = getModuleDisplayTemplate(storyModule.Content.Type.toLowerCase(), storyModule.Content.Layout);
        if (template === null || template === undefined) {
            template = templates[storyModule.Content.Type.toLowerCase()];
        }
    }

    // This is where the localization magic happens.
    // It takes part of the array storyLocalizations (set in /Views/Shared/JavascriptLocalization.cshtml)
    // based on the storyModule.Content.Type (lowercase) and adds it to the json that is passed to the template
    // Anything in a template that starts with "Text" is from this operation
    //this functionality is in both story.editor.js and story.view.js
    storyModule.Content.Text = storyLocalizations[storyModule.Content.Type.toLowerCase()];

    var partials = {
        "ModuleContent": template
    };

    var output = Mustache.render(templates.MODULE_CANVAS_TEMPLATE, storyModule.Content, partials);

    $(output).appendTo(container);


    $(".story-text-tabbed .nav-tabs").each(function (index) {
        $(this).find('a:first').tab('show');
    });

    // check for any items that need localization
    $("div [data-module-id='" + storyModule.Content.Identifier + "']").find("[data-resource-key]").each(function () {
        if (storyLocalizations[$(this).data("resourceClassKey")] !== undefined && storyLocalizations[$(this).data("resourceClassKey")][$(this).data("resourceKey")] !== undefined) {
            $(this).text(storyLocalizations[$(this).data("resourceClassKey")][$(this).data("resourceKey")]);
        }
    });

    if ($(".oldie").length > 0 && storyModule.Content.Type.toLowerCase() === "video" && storyModule.Content.VideoUrl.toLowerCase().indexOf("pip.la") > -1) {
        initLegacyPlayer(storyModule);
    }

    // TODO: remove script once miles to reach goal is gone
    // Skypeathon
    if (storyModule.Content.Type.toLowerCase() === 'openhtml' && storyModule.Content.Html.indexOf('id="miles-left"') > -1) {
        initSkypeAThonOpenHTML();
    }

    if (storyModule.Content.Type.toLowerCase() === "introduction") {

        if (story.Readiness !== "Live") {
            $(".story-introduction .register").text(story.TypeTitle + ' ' + storyLocalizations.skyperegistration.RegistrationClosed)
                                              .addClass('btn-register-disabled')
                                              .click(function () { return false; })
                                              .prev().hide();
        }
        else {
            $(".story-introduction .register").on("click", function (event) {
                $(this).button('loading');
                event.preventDefault();
                getSchedule();
            });

            $(".story-introduction .unregister").on("click", function (event) {
                event.preventDefault();
                unregister();
            });

            //if register parameter passed through URL string then call getSchedule(); and display modal
            var showSchedule = getQSParm("ShowSchedule");
            if (showSchedule == "true") {
                getSchedule();
            }
        }

    }

}

function initLegacyPlayer(storyModule) {
    var height = "310";
    var width = "550";

    //video stories and centered video module heights are full screen
    if (storyModule.Content.Layout === "video-resource-center" || storyModule.Content.Layout === "video-center") {
        height = "600";
        width = "1000";
    }

    _V_(storyModule.Content.Identifier, { "controls": true, "autoplay": false, "preload": "auto", "width": width, "height": height }, function () {
        // Player (this) is initialized and ready.
    });

    // add trackable events
    _V_(storyModule.Content.Identifier).on("play", function () {
        onLegacyVideoPlay(storyModule.Content.Identifier);
    });

    _V_(storyModule.Content.Identifier).on("ended", function () {
        onLegacyVideoEnd(storyModule.Content.Identifier);
    });
}

// duplicate code found in editor.js
function showLoader() {
    if ($('#story div.story-loader').length === 0) {
        $('#story').append('<div class="story-loader"><img src="/Assets/images/ajax-loader.gif" /></div>');
    }
}

function hideLoader() {
    $('#story div.story-loader').remove();
}

function getModule(id) {
    var i = getModuleIndex(id);
    if (i !== null) {
        return modules[i];
    }
}

function removeModule(id) {
    var i = getModuleIndex(id);
    if (i !== null) {
        modules.splice(i, 1);
    }
}

function getModuleIndex(id) {
    var modulesLength = modules.length;
    for (var i = 0; i < modulesLength; i++) {
        if (modules[i] !== null && modules[i].Content.Identifier === id) {
            return i;
        }
    }
    return null;
}

function getModuleDisplayTemplate(type, layout) {
    var displayTemplateTypeLength = displayTemplate[type].length;
    if (displayTemplate[type] !== undefined && displayTemplate[type] !== null) {
        for (var i = 0; i < displayTemplateTypeLength; i++) {
            if (displayTemplate[type][i] !== undefined && displayTemplate[type][i].Layout === layout) {
                return displayTemplate[type][i].Html;
            }
        }
        if (displayTemplate[type][0] !== undefined && layout !== "public") {
            return displayTemplate[type][0].Html;
        }
    }
    return null;
}

function getModulesByType(type) {
    var modulesFound = [],
        modulesLength = modules.length;
    for (var i = 0; i < modulesLength; i++) {
        if (modules[i] !== null && modules[i].Content.Type === type) {
            modulesFound.push(modules[i]);
        }
    }
    return modulesFound;
}

function saveProgress(module, callback) {

    if (module.Progress.IsFinished()) {
        // mark this module as tracking complete
        $(".module[data-module-id=" + module.Content.Identifier + "]").attr("data-tracking-complete", "y");
    }

    if (storyView.Progress.FinishedTimestamp === null && module.ProcessingStatus !== "Processing" && module.ProcessingStatus !== "Submitted" && (module.TrackingEnabled || isStoryFinished())) {
        module.ProcessingStatus = "Processing";

        var isFinished = isStoryFinished();

        // no module validation for quiz if it is finished
        if (story.Type.toLowerCase() === "course" && module.Content.Type.toLowerCase() === "quiz" && module.Progress.IsFinished()) {
            isFinished = true;
            if (module.Progress.SuccessStatus != null && module.Progress.SuccessStatus == "Pass") {
                if ($("#StoryCompleteModal").length > 0) {
                    $("#StoryCompleteModal").modal("show");
                }
            }
        }

        var data = {
            token: storyView.Token,
            lastStoryModuleId: module.Id,
            progressData: getStoryProgressData(),
            isStarted: module.Progress.IsStarted(),
            isFinished: isFinished
        };

        $.ajax({
            url: '/Story/API/SetModuleProgress',
            data: data,
            type: "POST",
            //contentType: 'application/json',
            dataType: "json",
            cache: false,
            success: function (results) {
                if (results.Error === null) {
                    module.ProcessingStatus = module.Progress.IsFinished() ? "Submitted" : "Pending";
                    storyView.Progress.FinishedTimestamp = results.Data !== null ? results.Data.FinishedTimestamp : null;
                }
            },
            error: function (xhr, status, error) {
                module.ProcessingStatus = "Error";
                module.ProcessingError = error;
                $(".module[data-module-id=" + module.Content.Identifier + "]").attr("data-tracking-complete", "n");
            }

        }).done(function () {
            // TODO: use promise
            if (callback !== undefined && callback !== null && (typeof callback === 'function')) {
                callback();
            }
        });

    }

}

function getStoryProgressData() {
    var progress = [];
    $.each(modules, function (i, module) {
        progress.push(module.Progress);
    });
    return JSON.stringify(progress);
}

function isStoryFinished() {

    if (storyView.Progress.FinishedTimestamp !== null) {
        return true;
    }
    var modulesLength = modules.length;
    for (var i = 0; i < modulesLength; i++) {
        if (!modules[i].Progress.IsFinished()) {
            return false;
        }
    }
    return true;
}

function isPreviousModuleComplete(module) {
    var isCompleted = true;

    if ((storyView.Type.toLowerCase() === "course" && module.Content.Type.toLowerCase() === "quiz") || modules.length === 1) {
        return true;
    }

    for (var i = 0; i < modules.length; i++) {
        if (modules[i].Id === module.Id) {
            return true;
        }
        isCompleted = modules[i].Progress.IsFinished();
    }
    return isCompleted;
}

function onLegacyVideoPlay(moduleId) {
    var module = getModule(moduleId);
    if (module !== null && !module.Progress.IsStarted() && !module.Progress.IsFinished()) {
        markModuleAsStarted(module);
        saveProgress(module);
    }
}

function onLegacyVideoEnd(moduleId) {
    var module = getModule(moduleId);
    if (module !== null && !module.Progress.IsFinished()) {
        markModuleAsFinished(module);
        saveProgress(module);
    }
}

// shuffle functionality

/*jshint -W054 */
(function (exports) {
    'use strict';

    // http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
    function shuffle(array) {
        var currentIndex = array.length
          , temporaryValue
          , randomIndex
        ;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }

    exports.knuthShuffle = shuffle;
}('undefined' !== typeof exports && exports || 'undefined' !== typeof window && window || global));

// IE 8 or less
if (!Date.prototype.toISOString) {
    (function () {

        function pad(number) {
            if (number < 10) {
                return '0' + number;
            }
            return number;
        }

        Date.prototype.toISOString = function () {
            return this.getUTCFullYear() +
              '-' + pad(this.getUTCMonth() + 1) +
              '-' + pad(this.getUTCDate()) +
              'T' + pad(this.getUTCHours()) +
              ':' + pad(this.getUTCMinutes()) +
              ':' + pad(this.getUTCSeconds()) +
              '.' + (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
              'Z';
        };

    }());
}