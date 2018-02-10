/* global bootbox, Mustache, moment, storyLocalizations, getStoryImageByDescription, loadStoryModuleData, syncModuleSortOrder, MODULE_TYPE_TEMPLATE:true, initStoryEvents*/
// common variables
MODULE_TYPE_TEMPLATE = "";
var comments = [];
var commentStatus = {
    take: 10,
    skip: 0,
    count: 0
};
var displayTemplate = {};
var headerImageSizeDesktop = "w1200h186";
var bannerImageSizeDesktop = "w1200h500";
var headerImageSizeMobile = "w500h500";
var HiDefUrl = '';
var modules = [];
var story;
var storyView;
var templates = [];

/** story functions **/
function getStory(token, mode, callback, excludeModules) {
    showLoader();
    excludeModules = !(excludeModules === undefined || excludeModules === null);

    if (window.location.pathname.toLowerCase().indexOf("/review") > -1 || window.location.pathname.toLowerCase().indexOf("/preview") > -1) {
        mode = "Preview";
    }

    var url = String.format('/Story/API/{0}?token={1}', mode, token);

    if (mode !== "Preview") {
        initializeStickyAsides();
    }


    $.ajax({
        url: url,
        type: "get",
        contentType: "json",
        success: function (results) {
            if (results.Error !== null) {
                if (results.Error.toLowerCase().indexOf("unauthorized") >= 0) {
                    window.location.href = "/Error/AccessDenied";
                } else {
                    bootbox.alert(results.Error);
                }
                return false;
            }
            results.Data.LocalCulture = results.LocalCulture;

            //Set text direction for the content
            var textDirection = results.Data.IsLanguageDirectionRtl ? 'rtl' : 'ltr';
            $('#story').attr('dir', textDirection);

            loadStory(results.Data, mode);
            if (!excludeModules) {
                HiDefUrl = results.Data.Story.HiDefUrl;
                getStoryModules(results.Data.Token, mode, callback);
            }
            if (mode !== "Preview") {
                getStoryTags(token);

                if (results.Data.Story.CommentCount > 0)
                    getStoryComments(results.Data.Token, commentStatus.skip, commentStatus.take);
                else
                    $(".story-comments").removeClass("hidden");
            }
        },
        error: function (xhr, status, error) {
            bootbox.alert(error);
            hideLoader();
        },
        cache: false,
        processData: false
    });
}

function getStoryModules(token, mode, callback) {

    if (window.location.pathname.toLowerCase().indexOf("/review") > -1 || window.location.pathname.toLowerCase().indexOf("/preview") > -1) {
        mode = "Preview";
    }

    var url = String.format('/Story/API/Modules{0}?token={1}', mode, token);

    $.ajax({
        url: url,
        type: "get",
        contentType: "json",
        success: function (results) {
            if (results.Error !== null) {
                bootbox.alert(results.Error);
                return false;
            }
            //Get the HiDefUrl for Videos, if there is one.
            //Yes, it is hacky. --BB
            if (typeof (HiDefUrl) === "string" && HiDefUrl.length > 0 && results.Data.Modules[0]) {
                results.Data.Modules[0].HiDefUrl = HiDefUrl;
            }
            loadStoryModuleData(results.Data, (mode === "Preview"));

            if (typeof callback === 'function') {
                callback();
            }
        },
        error: function (xhr, status, error) {
            bootbox.alert(error);
        },
        cache: false,
        processData: false
    }).done(function () {
        $('[data-toggle="popover"]').popover().on('click', function (event) { event.stopPropagation(); });
        hideLoader();
        initStoryEvents();
        if (typeof syncModuleSortOrder === 'function') {
            syncModuleSortOrder();
        }
    });
}

function getStoryTags(token, callback) {
    var url = String.format('/Story/API/Tags?token={0}', token);

    $.ajax({
        url: url,
        type: "get",
        contentType: "json",
        success: function (results) {
            if (results.Error !== null) {
                return false;
            }

            if (results.Data.Total > 0) {
                var output = Mustache.render(templates.STORY_TAGS_TEMPLATE, results.Data);
                $(".story-tag-container").html(output);
                $(".story-tag-list span.tag-count").text(results.Data.Total);
                $(".story-tag-list").removeClass('hidden');
            }

            if (typeof callback === 'function') {
                callback();
            }
        },
        error: function (xhr, status, error) {
            bootbox.alert(error);
        },
        cache: false,
        processData: false
    });
}

function loadStory(data, mode) {
    storyView = data;
    story = data.Story;
    storyView.Story.Edit = (mode.toLowerCase() === "preview");

    //Parts of the storyView contain application interfaces that need to match the users language direction; not the language direction of the story module
    storyView.IsAppLanguageDirectionRtl = mec.globalConfig.isAppLanguageDirectionRtl;

    storyView.Text = storyLocalizations.hero;
    storyView.Text.SignIn = storyLocalizations.SiteStrings.SignIn;
    storyView.Text.JoinNow = storyLocalizations.SiteStrings.JoinNow;

    if (storyView.Type.toLowerCase() === 'course') {
        if (storyView.CompletionStatus === 'Completed') {
            storyView.StoryProgressLabel = storyLocalizations.hero.StatusCompleted;
            storyView.StoryProgress = storyView.CompletionStatus.toLowerCase();
        } else if (storyView.CompletionStatus === 'Incomplete') {
            storyView.StoryProgressLabel = storyLocalizations.hero.StatusInProgress;
            storyView.StoryProgress = storyView.CompletionStatus.toLowerCase();
        } else if (storyView.SuccessStatus === 'Failed') {
            storyView.StoryProgressLabel = storyLocalizations.hero.StatusFailed;
            storyView.StoryProgress = storyView.SuccessStatus.toLowerCase();
        }
    }

    if (storyView.Story.HasBadge || storyView.Story.HasCertificate || storyView.Story.HasPoints) {
        storyView.ShowCourseBanner = true;
        storyView.Text.CourseBanner = storyLocalizations.SiteStrings.CourseBanner;
        storyView.PointsText = String.format(storyLocalizations.SiteStrings.PointsText, storyView.Story.Points);
    }

    if (storyView.IsPublicView) {
        storyView.ShowJoinSignIn = true;
    }

    if (storyView.Story.Points !== undefined && storyView.Story.Points > 0) {
        storyView.ShowPoints = true;
    }


    if (storyView.Story.Date !== null && storyView.Story.Date !== undefined && storyView.Story.Date.length > 0) {
        storyView.Story.Date = setLocalDate(storyView.Story.Date, data.LocalCulture);
        //storyView.Story.Date = moment(storyView.Story.Date).format(storyLocalizations.SiteStrings.DateFormat);
    }
    storyView.Story.ShowEndDate = false;
    if (storyView.Story.Expired !== null && storyView.Story.Expired !== undefined && storyView.Story.Expired.length > 0) {
        storyView.Story.Expired = setLocalDate(storyView.Story.Expired, data.LocalCulture);
        //storyView.Story.Expired = moment(storyView.Story.Expired).format(storyLocalizations.SiteStrings.DateFormat);
        storyView.Story.ShowEndDate = true;
    }

    if (storyView.Story.EndDate !== null && storyView.Story.EndDate !== undefined && storyView.Story.EndDate.length > 0) {
        storyView.Story.EndDate = setLocalDate(storyView.Story.EndDate, data.LocalCulture);
        //storyView.Story.EndDate = moment(storyView.Story.EndDate).format(storyLocalizations.SiteStrings.DateFormat);
        if (storyView.Type === 'Skype Lesson' || storyView.Type === 'Virtual Field Trip') {
            storyView.Story.ShowEndDate = true;
        }

    }

    if (storyView.VoteByUser !== null) {
        if (storyView.VoteByUser === 1) {
            storyView.Story.VoteClass = 'upvoted';
        } else if (storyView.VoteByUser === -1) {
            storyView.Story.VoteClass = 'downvoted';
        }
    }

    $("#story").addClass("category-" + storyView.TopLevelCategory);

    if (!$("#story").hasClass("notification")) {
        if (storyView.Story.Type === "LandingPage")
            bindHeroModule('hero-toolbar');
        else
            bindHeroModule('hero-full');
    }

    if (data.AllowPin) {
        if (data.DisplayPriority === 'High') {
            $('.metrics-toolbar .glyphicon-pushpin')
                .removeClass('pushpin-unpinned')
                .addClass('pushpin-pinned');
        } else {
            $('.metrics-toolbar .glyphicon-pushpin')
                .removeClass('pushpin-pinned')
                .addClass('pushpin-unpinned');
        }
    }

    if (data.Story.AllowFavorite) {
        if (data.IsFavorite) {
            $('.metrics-toolbar .glyphicon-star-empty').attr('class', 'glyphicon glyphicon-star');
        }
    }

    if (data.Story.Type === "Community" && !data.IsFavorite) {
        $('.metrics-toolbar .glyphicon-star-empty').attr('title', 'Join');
    } else {
        $('.metrics-toolbar .glyphicon-star-empty').attr('title', '');
    }

    if (data.Story.AllowFlag) {
        if (data.FlaggedByUser) {
            //$('.metrics-toolbar .ezicon-flag').css("background-color", "red");
            $('.metrics-toolbar .ezicon-flag').attr('data-storyflaggedbyuser', 'true');
            $('.metrics-toolbar .ezicon-flag').attr('data-isstoryflagged', 'false');
        } else if (data.Story.IsFlagged) {
            //$('.metrics-toolbar .ezicon-flag').css("background-color", "yellow");
            $('.metrics-toolbar .ezicon-flag').attr('data-isstoryflagged', 'true');
            $('.metrics-toolbar .ezicon-flag').attr('data-storyflaggedbyuser', 'false');
        } else if (!data.FlaggedByUser && !data.IsFlagged) {
            $('.metrics-toolbar .ezicon-flag').css("background-color", "inherit");
            $('.metrics-toolbar .ezicon-flag').attr('data-storyflaggedbyuser', 'false');
            $('.metrics-toolbar .ezicon-flag').attr('data-isstoryflagged', 'false');
        }
    }

    $(document).trigger("OnStoryLoadComplete", storyView);
}

function setLocalDate(LocalDate, LocalCulture) {
    var options = { year: 'numeric', month: 'numeric', day: 'numeric' };
    var is_safari = navigator.userAgent.toLowerCase().indexOf('macintosh') > -1;

    if (LocalDate === null)
        return '';
    else {
        var tempDate = moment(LocalDate).toDate();
        //if (LocalCulture === null || is_safari)
        return moment(LocalDate).format(storyLocalizations.SiteStrings.DateFormat);
        //return tempDate.toLocaleString(LocalCulture, options);
    }
}

function pinStory(storyView) {
    var setDisplayPriority = (storyView.DisplayPriority === 'High' ? 'Normal' : 'High');
    var data = { token: storyView.Token, displayPriority: setDisplayPriority, expiration: '12/31/2099' };

    $.ajax({
        url: '/Story/API/SetDisplayPriority',
        data: data,
        type: "POST",
        dataType: "json",
        cache: false,
        success: function (result) {
            if (result.Error !== null) {
                bootbox.alert(result.Error);
            } else if (result.Data.DisplayPriority === 'High') {
                $('.metrics-toolbar .glyphicon-pushpin')
                .removeClass('pushpin-unpinned')
                .addClass('pushpin-pinned');
            } else {
                $('.metrics-toolbar .glyphicon-pushpin')
                .removeClass('pushpin-pinned')
                .addClass('pushpin-unpinned');
            }

            //Update DisplayPriority in JS object if successful
            storyView.DisplayPriority = setDisplayPriority;
        },
        error: function (xhr, status, error) {
            bootbox.alert("An error occurred while performing a Pin operation: <br />" + error);
        }
    });
}

function markFavorite(id) {
    var data = { token: storyView.Story.Token };
    $.ajax({
        url: '/Story/API/Favorite',
        data: data,
        type: "POST",
        //contentType: 'application/json',
        dataType: "json",
        cache: false,
        success: function (result) {
            if (result.Error !== null) {
                bootbox.alert(result.Error);
            }
            if (result.Data === 'Favorite') {
                $(id).attr('class', 'ezicon ezicon-favorite favorite-active');
                $('.metrics-toolbar .ezicon ezicon-favorite').attr('title', '');
            } else if (result.Data === 'Unfavorite') {
                $(id).attr('class', 'ezicon ezicon-favorite');
                $('.metrics-toolbar .ezicon ezicon-favorite').attr('title', 'Join');
            }
        },
        error: function (xhr, status, error) {
            bootbox.alert("An error occurred while marking/un-marking this item as favorite: <br />" + error);
        }
    });
}


$(document).on('click', '.js-on-flag-story', function () {

    var storyId = storyView.Story.Id;
    var flagReasonTypeId = $(this).attr('data-flag-reason-type');

    showFlagContentConfirmModal(storyId, flagReasonTypeId);
});

function showFlagContentConfirmModal(storyId, flagReasonTypeId) {
    bootbox.dialog({
        message: '<p>' + storyLocalizations.hero.FlagContentConfirmation + '</p>',
        buttons: {
            cancel: {
                label: storyLocalizations.SiteStrings.Cancel,
                className: "btn-link",
                callback: function () {
                    closeFlagContentContainer();
                }
            },
            confirm: {
                label: storyLocalizations.SiteStrings.OK,
                className: "btn-primary",
                callback: function () {
                    flagStory(storyId, flagReasonTypeId);
                }
            }
        }
    });

}

function flagStory(storyId, flagReasonTypeId) {
    var isDeleteFlag = false;
    var data = {
        id: storyId,
        flagType: 1,
        storyFlagReasonType: flagReasonTypeId,
        isDeleteFlag: isDeleteFlag,
    };

    $.ajax({
        url: '/Story/API/Flag',
        data: data,
        type: "POST",
        dataType: "json",
        cache: false,
        beforeSend: function () {

            //Disable Flag Dropdown Menu to prevent multiple submissions
            $('.flag-list-item.metrics-content-link').addClass('disabled');

            closeFlagContentContainer();
        },
        success: function (result) {
            if (result.Error !== null) {
                bootbox.alert(result.Error);
            }

            //Update icon to indicate flag success to user
            if (result.Data === 'This item has been flagged.') {
                $('.metrics-toolbar .ezicon-flag').css('color', '#ff0000');
            }
        },
        error: function (xhr, status, error) {
            bootbox.alert("An error occurred while marking/un-marking this item as Inappropriate: <br />" + error);
            isDeleteFlag = false;

            //Enable Flag Dropdown Menu if there was a server error to allow the user to retry
            $('.flag-list-item.metrics-content-link').removeClass('disabled');
        }
    });
}

function closeFlagContentContainer() {
    $('.flag-list-item').removeClass('active');
    $('.flag-content-container').addClass('hidden');
}

/*
function flagStory(Id) {
    var isDeleteFlag = false;
// this was commented out since they did not need unflagging by the user themseleves

    //if ($('.metrics-toolbar .ezicon-flag').attr('data-storyflaggedbyuser') === 'true') {
    //    //if ($('.metrics-toolbar .ezicon-flag').css("background-color") === "rgb(255, 0, 0)") {
    //    //isDeleteFlag = true;
    //} else if ($('.metrics-toolbar .ezicon-flag').attr('data-isstoryflagged') === 'true') {
    //    //else if ($('.metrics-toolbar .ezicon-flag').css("background-color") == "yellow") {
    //    return false;
    //} else {
    //    isDeleteFlag = false;
    //}
    var data = {
        id: Id,
        flagType: 1,
        storyFlagReasonType:$("#modal-flagreason .flagReasonValue").val(),
        isDeleteFlag: isDeleteFlag,
    };
    $.ajax({
        url: '/Story/API/Flag',
        data: data,
        type: "POST",
        //contentType: 'application/json',
        dataType: "json",
        cache: false,
        success: function (result) {
            if (result.Error !== null) {
                bootbox.alert(result.Error);
            }
                /*
            else if (result.Data === 'This item has been flagged.' && !isDeleteFlag) {
                // $('.metrics-toolbar .ezicon-flag').css("background-color", "red");
                $('.metrics-toolbar .ezicon-flag').attr('data-storyflaggedbyuser', 'true');
                $('.metrics-toolbar .ezicon-flag').attr('data-isstoryflagged', 'true');
                //Set Status to FlaggedByUser
            } else if (result.Data === 'This item has been flagged.' && isDeleteFlag) {
                //  $('.metrics-toolbar .ezicon-flag').css("background-color", "inherit");
                $('.metrics-toolbar .ezicon-flag').attr('data-storyflaggedbyuser', 'false');
                $('.metrics-toolbar .ezicon-flag').attr('data-isstoryflagged', 'false');
                //Set Status to FlaggedByUser
            }
            
            isDeleteFlag = false;
            
            $("#modal-flagreason").modal('hide');

        },
        error: function (xhr, status, error) {
            bootbox.alert("An error occurred while marking/un-marking this item as Inappropriate: <br />" + error);
            isDeleteFlag = false;
        }
    });
}
*/

function calcBootstrapColumnWidth(gridWidth, itemCount) {
    var colSize = 12;
    if (gridWidth >= itemCount) {
        colSize = Math.round(gridWidth / itemCount);
    }
    return colSize;
}



function bindHeroModule(heroLayout) {
    var headerImageDesktop = getStoryImageByDescription(headerImageSizeDesktop);
    var bannerImageDesktop = getStoryImageByDescription(bannerImageSizeDesktop);
    if (headerImageDesktop.Url.indexOf("1200x186") > 0 && !(headerImageDesktop.Url.indexOf("1200x500") > 0)) {
        headerImageDesktop = bannerImageDesktop;
    }
    var headerImageMobile = getStoryImageByDescription(headerImageSizeMobile);

    if (storyView.Story.HeroOverlay === null || storyView.Story.HeroOverlay === undefined) {
        if (headerImageDesktop === null && headerImageMobile === null) {
            storyView.Story.HeroOverlay = 'overlay-gradient';
        } else {
            storyView.Story.HeroOverlay = 'overlay-black';
        }
    }

    this.storyView.Story.IsExpired = (this.storyView.Story.Readiness === "Expired");
    this.storyView.Story.HeaderImageDesktop = headerImageDesktop;
    this.storyView.Story.HeaderImageMobile = headerImageMobile;

    if (storyView.TopLevelCategoryName === storyView.CategoryName) {
        storyView.CategoryName = "";
    }

    var template = getModuleDisplayTemplate('hero', heroLayout);
    var output = Mustache.render(template, this.storyView);

    $(".jumbotron-story-header").remove();
    $(".metrics-toolbar").remove();
    $("#story").prepend(output);

    if ($("#story.workspace").length === 0) {
        $("#story .jumbotron .btn-edit-icon").remove();
    }

    bindVoteControls();
}

function bindVoteControls() {

    if (mec.globalConfig.isGuestUser) {
        $('.requires-authentication').addClass('disabled');
    }

    if ($(".btn.btn-signin").length === 0) {

        $(".metrics-toolbar .glyphicon-pushpin").on('click', function (event) {
            event.stopPropagation();
            event.preventDefault();
            pinStory(storyView);
        });

        $(".metrics-toolbar .ezicon.ezicon-favorite").on('click', function (event) {
            event.preventDefault();
            markFavorite(this);
        });

        $("#story .metrics-toolbar").on("click", '.upvote:not(.upvoted)', function (event) {
            event.preventDefault;
            var metricsToolbar = $('#story .metrics-toolbar');
            if (parseInt($(metricsToolbar).find(".downvote-count").text()) !== 0 && $(this).hasClass('downvoted')) {
                $(metricsToolbar).find(".downvote-count").text(parseInt($(metricsToolbar).find(".downvote-count").text()) - 1);
            }
            $(metricsToolbar).find(".upvote, .downvote").removeClass('downvoted').addClass('upvoted');
            $(metricsToolbar).find(".upvote-count").text(parseInt($(metricsToolbar).find(".upvote-count").text()) + 1);
            vote(true);
        });

        $("#story .metrics-toolbar").on("click", '.downvote:not(.downvoted)', function (event) {
            event.preventDefault;
            var metricsToolbar = $('#story .metrics-toolbar');
            if (parseInt($(metricsToolbar).find(".upvote-count").text()) !== 0 && $(this).hasClass('upvoted')) {
                $(metricsToolbar).find(".upvote-count").text(parseInt($(metricsToolbar).find(".upvote-count").text()) - 1);
            }
            $(metricsToolbar).find(".upvote, .downvote").removeClass('upvoted').addClass('downvoted');
            $(metricsToolbar).find(".downvote-count").text(parseInt($(metricsToolbar).find(".downvote-count").text()) + 1);
            vote(false);
        });
    }

    $(".metrics-toolbar .ezicon-comments").on('click', function (event) {
        event.preventDefault();
        $('html, body').animate({
            scrollTop: $(".story-comments").offset().top - 100
        }, 2000);
    });


    // initalize tooltip
    $('[data-toggle="tooltip"]').tooltip({ container: 'body' });
}

function showLoader() {
    if ($('#story div.story-loader').length === 0) {
        $('#story').prepend('<div class="story-loader"><img src="/Assets/images/ajax-loader.gif" /></div>');
    }
}

function hideLoader() {
    $('#story div.story-loader').remove();
}

/** module functions **/
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

function getModulesByType(type) {
    var modulesFound = [],
        modulesLength = modules.length;
    for (var i = 0; i < modulesLength; i++) {
        if (modules[i] !== null && modules[i].Content.Type.toLowerCase() === type.toLowerCase()) {
            modulesFound.push(modules[i]);
        }
    }
    return modulesFound;
}

function getModuleDisplayTemplate(type, layout) {
    var displayTemplateTypeLength = displayTemplate[type].length;
    if (displayTemplate[type] !== undefined && displayTemplate[type] !== null) {
        for (var i = 0; i < displayTemplateTypeLength; i++) {
            if (displayTemplate[type][i] !== undefined && displayTemplate[type][i].Layout === layout) {
                return displayTemplate[type][i].Html;
            }
        }
        if (displayTemplate[type][0] !== undefined) {
            return displayTemplate[type][0].Html;
        }
    }
    return null;
}

function isModuleInViewport(el) {
    if (jQuery !== undefined && el instanceof jQuery) {
        el = el[0];
    }

    var rect = el.getBoundingClientRect();

    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

function fireIfModuleVisible(el, callbackVisible, callbackNotVisible) {
    return function () {
        if (isModuleInViewport(el)) {
            if (typeof callbackVisible === "function") {
                callbackVisible(el);
            }
        } else {
            if (typeof callbackNotVisible === "function") {
                callbackNotVisible(el);
            }
        }
    };
}

//token is optional
function vote(isUpVote, storyToken) {
    var token = storyToken;
    if (token === undefined) {
        token = storyView.Story.Token
    }
    var data = {
        token: token,
        isUpVote: isUpVote
    };

    $.ajax({
        url: '/Story/API/Vote',
        data: data,
        type: "POST",
        //contentType: 'application/json',
        dataType: "json",
        cache: false,
        success: function (result) {
            if (result.Error !== null) {
                bootbox.alert(result.Error);
            }
            if (result.Data === true && storyToken !== undefined) {
                processVote(isUpVote);
            }
        },
        error: function (xhr, status, error) {
            bootbox.alert("An error occurred while trying to submit a vote for this item: <br />" + error);
        }
    });
}

function processVote(isUpVote) {
    if (isUpVote) {
        storyView.Story.UpVoteCount++;
        if (storyView.VoteByUser === -1) {
            storyView.Story.DownVoteCount--;
        }
        storyView.VoteByUser = 1;
    } else {
        storyView.Story.DownVoteCount++;
        if (storyView.VoteByUser === 1) {
            storyView.Story.UpVoteCount--;
        }
        storyView.VoteByUser = -1;
    }
}

function removeNewReplies() {
    // remove any newly added replies
    $(".comments-wrapper li.comment-reply[data-id='0'][data-reply-last='true']").remove();
}

function getStoryComments(token, skip, take) {
    var data = {
        token: token,
        skip: skip,
        take: take
    };

    $("#btnLoadMoreComments").button('loading');
    $.ajax({
        url: '/Story/API/Comments',
        data: data,
        type: "POST",
        //contentType: 'application/json',
        dataType: "json",
        cache: false,
        success: function (results) {
            if (results.Error !== null) {
                $("#btnLoadMoreComments").button('reset');
                return;
            }
            results.Data.LocalCulture = results.LocalCulture;
            loadStoryCommentData(results.Data);
        },
        error: function (xhr, status, error) {
            bootbox.alert("An error occurred while trying to retrive comments for this item: <br />" + error);
        }
    }).done(function () {
        $("#btnLoadMoreComments").button('reset');
    });
}

function submitStoryComment() {
    if ($(".btn-signin").length === 0) {
        $(".story-comments #btnSubmitComment").button('loading');
        submitComment(storyView.Token, $("#txtComment").val(), null);
    }
}

function submitComment(token, comment, parentId) {
    var data = { token: token, comment: comment, parentId: parentId };
    var passedToken = token;
    $.ajax({
        url: '/Story/API/Comment',
        data: JSON.stringify(data),
        type: "POST",
        contentType: 'application/json',
        dataType: "json",
        cache: false,
        success: function (results) {
            if (results.Error !== null) {
                bootbox.alert(results.Error);
                $(".story-comments #btnSubmitComment").button('reset');
            }
            if (results.Data !== null) {
                results.Data.Token = passedToken;
                results.Data.PostedOn = moment(new Date(results.Data.PostedOn)).format(storyLocalizations.SiteStrings.DateFormat);
                renderCommentListItem(results.Data, true);
                onCommentSubmitted(results.Data);
            } else {
                bootbox.alert("An error occurred while trying to submit a comment for this item: <br />" + results.Error);
            }
        },
        error: function (xhr, status, error) {
            bootbox.alert("An error occurred while trying to submit a comment for this item: <br />" + error);
        }
    }).done(function () {
        $(".story-comments #btnSubmitComment").button('reset');
    });
}

function loadStoryCommentData(data) {
    storyView.Story.Comments = data;
    commentStatus.count = data.length;
    commentStatus.skip += data.length;

    $.each(data, function (index, item) {
        item.Token = storyView.Story.Token;
        item.PostedOn = setLocalDate(item.PostedOn, data.LocalCulture);
        //item.PostedOn = moment(new Date(item.PostedOn)).format(storyLocalizations.SiteStrings.DateFormat);
        renderCommentListItem(item);
    });

    // remove last top level comment indicator
    $(".comments-wrapper li.comment").removeAttr("data-last-top");
    $(".comments-wrapper li.comment").removeAttr("data-reply-last");

    // mark last top level comment indicator
    $(".comments-wrapper li.comment").not(".comment-reply").last().attr("data-last-top", true);

    $(".story-comments").removeClass("hidden");
    $(".comments-header .comment-text").text(storyView.Story.CommentCount);

    bindCommentVoteButtons();
    bindRedactorToCommentReply();
    bindViewMoreButton();
    bindFlagButtons();

    // initalize tooltip
    $('[data-toggle="tooltip"]').tooltip({ container: 'body' });
}

function incrementCommentCount() {
    storyView.Story.CommentCount++;
    $(".comment-count").text(storyView.Story.CommentCount);
}

function bindCommentVoteButtons() {
    // only enabled when user is logged in
    if ($(".btn-signin").length === 0) {
        $(".story-comments .upvote a").on("click", function (event) {
            event.preventDefault();
            $(this).prop("disabled", true);
            submitCommentVote($(this).attr("data-id"), true);
        });
        $(".story-comments .downvote a").on("click", function (event) {
            event.preventDefault();
            $(this).prop("disabled", true);
            submitCommentVote($(this).attr("data-id"), false);
        });
    }
}

function bindViewMoreButton() {
    $("#btnLoadMoreComments").unbind();
    if (storyView.Story.CommentCount > $('.comments-wrapper > li').length) {
        $("#btnLoadMoreComments").removeClass("hidden");
        $("#btnLoadMoreComments").click(function () {
            removeNewReplies();
            getStoryComments(storyView.Token, commentStatus.skip, commentStatus.take);
        });
    } else {
        $("#btnLoadMoreComments").addClass("hidden");
    }
}

function bindRedactorToCommentReply() {
    var $txtComment = $('#txtComment');

    if ($txtComment.length > 0) {
        initRedactorCommentReply($txtComment);
    }
}

function bindFlagButtons() {
    $(".story-comments a.flag-link").on("click", function (event) {
        // only enabled when user is logged in
        if ($(".btn-signin").length === 0) {
            event.preventDefault();
            $(this).prop("disabled", true);
            $(this).html("<img src='/images/loading.gif' border='0' />");
            flagComment($(this).attr("data-id"));
        }
    });
}

function renderCommentListItem(comment, isNewComment) {
    var template = $("#CommentsTpl").html();
    var container = $(".media-list.comments-wrapper");
    if ($(container).length > 1) {
        container = $(".media-list.comments-wrapper").closest(".commentlist[data-token='" + comment.Token + "']").find($(".media-list.comments-wrapper"));
    }
    //var partials = {
    //    "CommentContent": template
    //};

    //var output = Mustache.render(templates["MODULE_CANVAS_TEMPLATE"], storyModule.Content, partials);
    var output = Mustache.render(template, comment);

    if (isNewComment === true) {
        if (comment.ReplyTo !== null && comment.ReplyTo !== undefined) {
            $(output).insertAfter($(".comment[data-id=" + comment.ReplyTo + "]"));
        } else {
            $(output).prependTo(container);
        }
    } else {
        $(output).appendTo(container);
    }

    if (comment.ReplyTo === null || comment.ReplyTo === undefined) {
        // only enabled when user is logged in
        if ($(".btn-signin").length === 0) {

            //Allow click to generate reply form only once
            $(".comment[data-id=" + comment.Id + "] .reply-link").one("click", function (event) {
                event.preventDefault();

                addCommentReply(comment);

                //Subsequent clicks
                $(".comment[data-id=" + comment.Id + "] .reply-link").on("click", function (event) {
                    event.preventDefault();

                    var $childReplyContainer = $(".comment[data-id=" + comment.Id + "] .media-body").find('.reply-container');
                    $childReplyContainer.toggle(); //Toggle the visibility of the element

                });

            });

        }
    }
}



function addCommentReply(comment) {
    var template = $("#ReplyToCommentTpl").html();
    var container = $(".comment[data-id=" + comment.Id + "] .media-body");
    var output = Mustache.render(template, comment);

    $(output).appendTo(container);

    var $replyTextArea = container.find('.js-child-reply-textarea');
    initRedactorCommentReply($replyTextArea);

    // bind click event on submit button
    $(container).find(".reply-container button").click(function () {
        $(this).prop('disabled', true);
        var commentText = $(container).find(".reply-container textarea").val();
        submitComment(storyView.Token, commentText, comment.Id);
    });
};

function initRedactorCommentReply($replyTextArea) {
    var hasRedactor = $replyTextArea.attr('data-redactor') === "true";
    if (hasRedactor) {
        $replyTextArea.redactor({
            buttons: ['link'],
            allowedTags: ['a', 'p', 'br'],
            initCallback: function () {
                redactorDisableMicrosoftTranslator(this.$editor);
            }
            /* Not enabled - 11-7-2017
            syncBeforeCallback: function (html) {
                var cleanedHtml = cleanRedactorHtmlString(html);
                return cleanedHtml;
            }
            */
        });
    }
};

function onCommentSubmitted(comment) {
    var container;
    var $replyButtonContainer;
    if (comment.ReplyTo !== null && comment.ReplyTo !== undefined) {
        container = $(".comment[data-id=" + comment.ReplyTo + "] .media-body .reply-container");

        if ($(container).find("textarea").attr("data-redactor")) {
            //If this is a redactor textarea it has to also be cleared via redactor
            $(container).find("textarea").redactor('code.set', '');
        }
        $(container).find("textarea").val("");

        $(container).fadeOut();
        $(container).remove();

        $replyButtonContainer = $(".comment[data-id=" + comment.ReplyTo + "]").find('.reply-link').closest('li');
        if ($replyButtonContainer) {
            $replyButtonContainer.remove();
        }

        var replies = parseInt($(".comment[data-id=" + comment.ReplyTo + "] .reply-buttons .reply-count").text());
        replies++;
        $(".comment[data-id=" + comment.ReplyTo + "] .reply-buttons .reply-count").text(replies);

        var isReplyToLast = $(".comment[data-id=" + comment.ReplyTo + "]").attr("data-last-top");
        if (isReplyToLast) {
            $(".comment[data-id=" + comment.ReplyTo + "]").next("[data-id='0']").attr("data-reply-last", true);
        } else {
            commentStatus.skip += 1;
        }

    } else {
        if ($(".story-comments").length > 0) {

            if ($(".story-comments #txtComment").attr("data-redactor")) {
                //If this is a redactor textarea it has to also be cleared via redactor
                $(".story-comments #txtComment").redactor('code.set', '');
            }
            $(".story-comments #txtComment").val("");

            $('html, body').animate({
                scrollTop: $(".story-comments").offset().top - 100
            }, 1000);
        }
        else if ($("#txtComment" + comment.Token).length > 0) {

            if ($("#txtComment" + comment.Token).attr("data-redactor")) {
                //If this is a redactor textarea it has to also be cleared via redactor
                $("#txtComment" + comment.Token).redactor('code.set', '');
            }

            $("#txtComment" + comment.Token).val("");
        }
        commentStatus.skip += 1;
    }
    incrementCommentCount();
}

function onCommentVoteComplete(commentId, isUpVote) {
    var votes;
    var upVoteItem = $(".story-comments li.upvote[data-id=" + commentId + "]");
    var downVoteItem = $(".story-comments li.downvote[data-id=" + commentId + "]");
    var voteCountItem;

    if (isUpVote) {
        $(upVoteItem).addClass("upvoted");
        voteCountItem = $(upVoteItem).find("span.vote-count");
        if ($(downVoteItem).hasClass("downvoted")) {
            $(downVoteItem).removeClass("downvoted");
            votes = parseInt($(downVoteItem).find("span.vote-count").text());
            votes--;
            $(downVoteItem).find("span.vote-count").text(votes);
        }
    } else {
        $(downVoteItem).addClass("downvoted");
        $(upVoteItem).removeClass("upvoted");
        voteCountItem = $(downVoteItem).find("span.vote-count");
        if ($(upVoteItem).hasClass("upvoted")) {
            $(upVoteItem).removeClass("upvoted");
            votes = parseInt($(downVoteItem).find("span.vote-count").text());
            votes--;
            $(downVoteItem).find("span.vote-count").text(votes);
        }
    }
    votes = parseInt($(voteCountItem).text());
    votes++;
    $(voteCountItem).text(votes);
}

function submitCommentVote(commentId, isUpVote) {
    var data = { commentId: commentId, isUpVote: isUpVote };

    try {
        $.ajax({
            url: '/Story/API/CommentVote',
            data: data,
            type: "POST",
            //contentType: 'application/json',
            dataType: "json",
            cache: false,
            success: function (results) {
                //if (results.Error !== null) {
                //    //throw results.Error;
                //}
                if (results.Data !== null && results.Data === true) {
                    onCommentVoteComplete(commentId, isUpVote);
                } else {
                    throw "An error occurred while trying to submit a vote for this item: <br />" + results.Error;
                }
            },
            error: function (xhr, status, error) {
                throw "An error occurred while trying to submit a vote for this item: <br />" + error;
            }
        });
    } catch (e) {
        bootbox.alert(e.message);
        return null;
    }
}

function flagComment(commentId) {
    var data = {
        id: commentId,
        flagType: 2,
        storyFlagReasonType: '',
        isDeleteFlag: false,
    };

    $.ajax({
        url: '/Story/API/Flag',
        data: data,
        type: "POST",
        //contentType: 'application/json',
        dataType: "json",
        cache: false,
        success: function (results) {
            //if (results.Error !== null) {
            //    //throw results.Error;
            //}
            if (results !== null) {
                onCommentFlagComplete(commentId, results.Data);
            }
        },
        error: function (xhr, status, error) {
            bootbox.alert("An error occurred while trying to flag comment: <br />" + error);
        }
    });
}

function onCommentFlagComplete(commentId, message) {
    if (commentId !== undefined && commentId !== null) {
        var container = $(".comment[data-id=" + commentId + "] .media-body");
        container.find("p.comment").html(message);
        container.find(".flag-link").remove();
        container.find(".reply-link").remove();
    }
}

function initializeStickyAsides() {

}