/* Global App Namespace */
var ez = ez || {};

(function (helpers) {
    /**
     * Render mustache
     * @params {(Object|Object[])} params
     * @params {string} params.target
     * @params {string} params.template
     * @params {string} params.templateId
     * @params {string} params.data
     * 
     * @params {string} params[].target
     * @params {string} params[].template
     * @params {string} params[].templateId
     * @params {string} params[].data
     */
    helpers.renderTemplate = function renderTemplate(params) {
        if ($.isArray(params)) {
            $.each(params, function (index, param) {
                $(param.target).html(Mustache.render($(param.template).filter(param.templateId).html(), param.data));
            });
            return;
        }
        $(params.target).html(Mustache.render($(params.template).filter(params.templateId).html(), params.data));
    }

    /**
     * @description Truncates strings to characters with spaces length and re-trims string to keep whole words. Includes parameter to add Ellipsis at the end.
     * @param {string} string
     * @param {number} maxLength
     * @param {boolean} hasEllipsis
     * @returns {string} 
     */
    helpers.truncateString = function truncateString(string, maxLength, hasEllipsis) {
        if (string && string.length > maxLength) {
            var trimmedString = string.substr(0, maxLength);

            trimmedString = trimmedString.substr(0, Math.min(trimmedString.length, trimmedString.lastIndexOf(" ")));

            if (hasEllipsis) {
                trimmedString = trimmedString + '\u2026';
            }
            return trimmedString;
        } else {
            return string;
        }
    }

    /**
     * @description Takes a vertical list inside a parent container and splits it into multiple vertical Bootstrap columns. Example method call: splitListToBootstrapColumns(".registrationCheckBox", ".checkbox", "form-group", "sm", 3);
     * @param {string} containerSelector - Options "[selector] - Parent container of the list
     * @param {string} childSelector - Options "[selector] | null" - Selector for the child elements to split into columns. Example ".user-address-info" 
     * @param {string} rowType - Options "row | form-group"
     * @param {string} colSize - Options "xs | sm | md | lg"
     * @param {number} colNum - Options "1 | 2 | 3 | 4 | 6". Must be divisible by 12.
     */

    helpers.splitListToBootstrapColumns = function splitListToBootstrapColumns(containerSelector, childSelector, rowType, colSize, colNum) {
        var
          colNum = colNum,
          $containers = $(containerSelector),
          childSelector = childSelector ? childSelector : null;

        try {
            if ($.inArray(colNum, [1, 2, 3, 4, 6]) <= 0) {
                throw ("Number of columns passed to splitListToBootstrapColumns method must be one of the following: 1,2,3,4,6");
            }
        } catch (error) {
            console.error(error);
        }

        $containers.each(function (index) {
            var $this = $(this),
            $listArray = $this.children(childSelector),
            listTotal = $listArray.length,
            bsColumnClass = "col-" + colSize + "-" + (12 / colNum),
            count = Math.ceil(listTotal / colNum),
            column = 0;

            if (listTotal !== 0) {
                $this.addClass(rowType);

                for (var i = 0; i < listTotal; i += count) {
                    column++;
                    var colName = "split-column-" + column;
                    $this.append('<div class="' + colName + ' ' + bsColumnClass + '"></div>');
                    $this.find("." + colName).html($listArray.splice(0, count));
                }
            }
        });
    }

    /**
    * @description Add a URL parameter 
    * @param {url}   string - url 
    * @param {param} string - the key to set
    * @param {value} string - value 
*/
    helpers.addParamaddParameter = function addParameter(url, param, value) {
        param = encodeURIComponent(param);
        var a = document.createElement('a');
        param += (value ? "=" + encodeURIComponent(value) : "");
        a.href = url;
        a.search += (a.search ? "&" : "") + param;
        return a.href;
    }

    /**
    * @description Add a URL parameter (or update if already exists)
    * @param {string} url - url 
    * @param {string} param - the key to set
    * @param {string} value - value 
    */
    helpers.addOrUpdateParameter = function addOrUpdateParameter(url, param, value) {
        param = encodeURIComponent(param);
        var r = "([&?]|&amp;)" + param + "\\b(?:=(?:[^&#]*))*";
        var a = document.createElement('a');
        var regex = new RegExp(r);
        var str = param + (value ? "=" + encodeURIComponent(value) : "");
        a.href = url;
        var q = a.search.replace(regex, "$1" + str);
        if (q === a.search) {
            a.search += (a.search ? "&" : "") + str;
        } else {
            a.search = q;
        }
        return a.href;
    }

    //Form Helpers
    helpers.form = {};

    /**
     * @description Clears all form elements.
     * @param {string} form element
     */
    helpers.form.clearForm = function clearForm(form) {
        // iterate over all of the inputs for the form element that was passed in
        $(':input', form).each(function () {
            var type = this.type;
            var tag = this.tagName.toLowerCase(); // normalize case

            if (type == 'text' || type == 'email' || type == 'password' || tag == 'textarea') {
                // it's ok to reset the value attr of text inputs,
                // password inputs, and textareas
                this.value = "";
            } else if (type == 'checkbox' || type == 'radio') {
                // checkboxes and radios need to have their checked state cleared
                // but should *not* have their 'value' changed
                this.checked = false;
            } else if (tag == 'select') {
                // select elements need to have their 'selectedIndex' property set to -1
                // (this works for both single and multiple select elements)
                this.selectedIndex = -1;
                //Iterate over all of the options and reselect the "selected" attributes. Also works for multiple selections with the "multiple" attribute.
                $(this).find('option').prop('selected', function () {
                    return this.defaultSelected;
                });
            }
        });
    };

    /**
     * @description Counts the number of characters the user is allowed to enter into an input or textarea 
     * @param {string} inputElement - Options input element | textarea element
     * @param {string} outputCountContainer - Target element to output the count to
     * @element attribute {string} - maxlength attribute with a value needs to be set on the inputElement
     */
    helpers.form.characterCount = function characterCount(inputElement, outputCountContainer) {
        if (!(inputElement instanceof jQuery)) {
            var inputElement = $(inputElement);
        }

        //inputElement can be a input or textarea; a 'maxlength' attribute on the element is required in order to set the limit
        var maxLength = parseInt(inputElement.attr('maxlength'));

        //Catch Missing parameters
        try {
            if (!inputElement) {
                throw ("'inputElement' needs to be passed a jQuery object defined with $('.inputElementName')");
            }
            if (!outputCountContainer) {
                throw ("'outputCountContainer' needs to be specified to output add the remaining count to");
            }
            if (!maxLength) {
                throw ("'maxlength' attribute needs to be set on the input or textarea that characters are entered into");
            }
        } catch (error) {
            console.error(error);
        }

        var remainingChars = inputElement.val().length;

        $(outputCountContainer).html(remainingChars + " / " + maxLength);
    };


    //String Helpers
    helpers.string = {};

    helpers.string.strStartsWith = function strStartsWith(str, prefix) {
        return str.indexOf(prefix) === 0;
    };

    helpers.string.strEndsWith = function strEndsWith(str, suffix) {
        return str.match(suffix + "$") == suffix;
    };


})(ez.helpers || (ez.helpers = {}));

$(function () {
    var $userAvailable = $('.usersummary .available');

    $.ajaxSetup({ cache: false });

    $(document.body).on('click', '.overlayClickTrack', function (event) {
        event.preventDefault();
        var href = $(this).attr('href');

        var data = { token: $(this).data('token') };

        $.ajax({
            url: '/Story/API/SetViewed',
            data: data,
            type: "POST",
            cache: false
        }).done(function () {
            window.location = href;
        });
    });

    $(document).on('click', '.availablenowlink', function (event) {
        event.preventDefault();
        event.stopPropagation();
        $("#availableNowModal").modal();
    });


    $(document).on('click', '.saveavailablenow', function (event) {
        event.preventDefault();
        event.stopPropagation();
        var data = { hour: $("#availabliltyhours").val() };
        $.ajax({
            url: '/User/UserInteraction/SaveAvailableNow',
            data: data,
            type: "POST",
            cache: false
        }).done(function () {
            $('#availableNowModal').modal('hide');
            $userAvailable.removeClass('hidden');
        });
    });


    $(document).on('change', '#availableNowModal .options.no', function (event) {
        event.preventDefault();
        bootbox.confirm(storyLocalizations.AvailableNow.AvailableNowModalDeleteMessage, function (result) {
            if (result) {
                event.preventDefault();
                event.stopPropagation();

                $.ajax({
                    url: '/User/UserInteraction/RemoveAvailableNow',
                    type: "POST",
                    cache: false
                }).done(function () {
                    $('#availableNowModal').modal('hide');
                    $userAvailable.addClass('hidden');
                });
            }
        });
    });
});

(function () {
    //$(document).ready(function () {
    /**
     * SMOOTH SCROLL FOR ANCHOR (JUMP) LINKS
     * Instructions: Define jump links that point to standard HTML anchors and add a 'anchorScroll' class
     * Example:
     * 
     */


    $(document).on('click', '.js-click-anchor-scroll', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();

        anchorScroll($(this), $($(this).attr('href')), 1000);
    });
    //});

    function anchorScroll(thisObj, thatObj, baseSpeed) {
        var thisOffset = thisObj.offset(),
            thatOffset = thatObj.offset(),
            offsetDiff = Math.abs(thatOffset.top - thisOffset.top),
            speed = (offsetDiff * baseSpeed) / 1000; //Logic to keep the animation smooth on different vieports; mobile, tablets, desktop

        var scrollToHere = thatOffset.top;

        // Reduce the amount of scrolling so target elemnt top doesn't align with the viewport or the .sticky-navbar
        var offsetScroll = 20;

        scrollToHere -= offsetScroll;

        if ($('.sticky-navbar')) {

            var isStickyNavbarFixed = $('.sticky-navbar').hasClass('navbar-fixed-top');

            if (isStickyNavbarFixed) {
                scrollToHere -= $('.sticky-navbar').height(); //If sticky-navbar is fixed to top of viewport and no longer in the DOM then we need to adds it's height back into the amount to be scrolled.
            } else {
                // .sticky-navbar height needs to be subtracted twice if it is not already fixed.
                var doubleStickyNavbarHeight = ($('.sticky-navbar').height() * 2);
                scrollToHere -= doubleStickyNavbarHeight;
            }
        }

        $('html,body').animate({
            scrollTop: (scrollToHere)
        }, speed);

        // Add hash (#) to URL when done scrolling (default click behavior)
        window.location.hash = thisObj[0].hash;
    }


    $(document).on("OnStoryRenderComplete", function (event, modules) {
        var badgepopup = $('a[href$="#badgepopup#"]')
        if (badgepopup.length > 0) {

            $(badgepopup).on('click', function (e) {
                e.preventDefault();
                $("#modal-points").modal("show");
            });
        }

        // auto scroll to querystring #anchorName
        var hash = window.location.hash.replace('#', '');

        if( hash !== '' )
        {
            var anchorElement = $('a[name="' + hash + '"]');

            if( anchorElement.length )
                anchorScroll( $(":visible"), anchorElement, 1000 );
        }
    });


})();



function createCookie(name, value, days) {
    var expires = '';
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toGMTString();
    }
    document.cookie = name + '=' + value + expires + '; path=/';
}

function deleteCookie(name) {
    //createCookie parameters: nameOfExistingCookie, emptyString, -1 (-1 subtracts the current day and makes cookie invalid)
    createCookie(name, "", -1);
}

function getCookie(cname) {
    var name = cname + '=',
        ca = document.cookie.split(';'),
        caLength = ca.length,
        i,
        c;

    for (i = 0; i < caLength; i++) {
        c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return '';
}

function throttle(func, rate) {
    var counter = 0;
    return function () {
        var context = this;
        var args = arguments;
        counter++;
        if (counter === rate) {
            func.apply(context, args);
            counter = 0;
        }
    };
}

function getDateFromJSON(jsonDate) {
    if (jsonDate === null || typeof jsonDate === 'undefined') {
        return jsonDate;
    }
    var d = new Date(parseInt(jsonDate.substr(6)));
    d = (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear();
    if (d === '1/1/1') { d = false; }
    return d;
}

function OnRatingClick(ctl) {
    var id = $(ctl).data('id');
    var ratingtype = $(ctl).data('ratingtype');
    var rating = $(ctl).data('rating');
    var commandUrl = $(ctl).data('commandurl') + "?eZItemId=" + id + "&ratingType=" + ratingtype + "&rating=" + rating;

    $(ctl).closest('.list-ratings').append('<li><div class="loading loading-tiny"></div></li>');

    $.ajax({
        url: commandUrl,
        type: "POST",
        cache: false
    }).done(function (html) {
        $(ctl).closest('.list-ratings').replaceWith(html);
    });
}

function OnCommentVoteClick(ctl) {
    var useritemtocommentid = $(ctl).data('useritemtocommentid');
    var isupvote = $(ctl).data('isupvote');
    var commandUrl = $(ctl).data('commandurl') + "?userItemToCommentId=" + useritemtocommentid + "&isUpVote=" + isupvote;

    $(ctl).closest('.list-ratings').append('<li><div class="loading loading-tiny"></div></li>');

    $.ajax(
        { url: commandUrl, cache: false, type: "POST" }
        ).success(function (result) {
            if (result !== null) {
                $(ctl).closest('.list-ratings').find("#upvotecount").text(result.Data.UpVoteCount);
                $(ctl).closest('.list-ratings').find("#downvotecount").text(result.Data.DownVoteCount);
                $(ctl).closest('.list-ratings').find(".loading-tiny").remove();

                if (isupvote === "True") {
                    $(ctl).addClass('upvoted');
                    $(ctl).closest('.list-ratings').find(".downvote").removeClass("downvoted");
                } else if (isupvote === "False") {
                    $(ctl).addClass('downvoted');
                    $(ctl).closest('.list-ratings').find(".upvote").removeClass("upvoted");
                }

            }

        });
    return false;
}

function openShare(link) {
    var options = "toolbar=no,scrollbars=no,resizable=no,height=500,width=600";
    loginWindow = window.open(link, "ShareWindow", options, false);
}

function TrackShareActivity(token, shareType) {
    if (token == undefined || token == null || token.length == 0)
        return;

    $(document).trigger("OnAnalyticsTrackingEvent", { Category: "Content", Action: "Share", Label: shareType, Value: 1 });

    $.ajax({
        async: false,
        type: "POST",
        url: "/Story/API/Share",
        data: "token=" + token + "&ShareType=" + shareType
    });
}

function GrowProgressArrow(ctl) {
    var pctNotComplete = (100 - ctl.data('progress')) / 100;
    var newTop = $(ctl).closest('.profileTile').height() * pctNotComplete;

    ctl.animate({ top: newTop + 'px' }, 1000);
}


function setMomentDate(dateObject, stringFormat, removeOffset, removeTime) {
    if (removeOffset === undefined || removeOffset === null) { removeOffset = false; }
    if (removeTime === undefined || removeTime === null) { removeTime = false; }
    if (stringFormat === null || stringFormat === undefined) { stringFormat = 'L'; }
    if (dateObject !== null && dateObject !== undefined && dateObject.length > 0) {
        if (removeOffset === true) {
            dateObject = dateObject.substring(0, dateObject.lastIndexOf("-"));
        }
        if (removeTime === true) {
            dateObject = dateObject.substring(0, dateObject.lastIndexOf("T"));
        }
        return moment(dateObject).format(stringFormat);
    }
    return "";
}


function hide(elem) {
    $(elem).addClass('hidden');
}

function show(elem) {
    $(elem).removeClass('hidden');
}

function removeSpaces(str) {
    str = str.replace(/\s+/g, '');
    return str.toLowerCase();
}

//extending the array function to allow items to be cleaned.
//Examples::
//test = new Array("", "One", "Two", "", "Three", "", "Four").clean("");
//test2 = [1, 2, , 3, , 3, , , , , , 4, , 4, , 5, , 6, , , , ];
//test2.clean(undefined);

Array.prototype.clean = function (deleteValue) {
    var arrayLength = this.length;

    for (var i = 0; i < arrayLength; i++) {
        if (this[i] === deleteValue) {
            this.splice(i, 1);
            i--;
        }
    }
    return this;
};


/**
 * Create array of interger from an array of interger type string
 * @param  {Array} arr array of interger type string
 * @return {Array}     new array of interger
 *
 * @example
 * makeIntArray(['1', '2', '3', 'aasdf'])
 * [1, 2, 3, NaN]
 */
function makeIntArray(arr) {
    if (!$.isArray(arr) && arr.length === 0) {
        return;
    }

    return $.map(arr, function (val) {
        return parseInt(val, 10);
    });
}


function getQSParm(arg) {
    var href = window.location.href;
    var parm = "";
    if (href.indexOf(arg + "=") !== -1) {
        parm = href.split(arg + "=")[1];
        if (parm.indexOf("&") !== -1) { parm = parm.split("&")[0]; }
    }
    return parm;
}

function capitalizeFirstLetter(string) {
    if (string === undefined || string === '') {
        return;
    }
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}


function showLoading() {
    $('<div class="modal-backdrop in" id="loading"><div class="spinner"><div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div></div></div>').appendTo(document.body);
}

function removeLoading() {
    $('#loading').remove();
}


function isABootstrapModalOpen() {
    return $('.modal.in').length > 0;
}


function checkParentCategory(obj) {
    if ($(obj).is(":checked")) {
        $("." + $(obj).attr("data-parent")).prop("checked", true);
    }
}

var alreadySticky = false;
var fixNavBar = false;

$(function () {
    if ($('.sticky-navbar').length > 0) {
        getScrollPosition();
        initNavbar();
        if ($('.jumbotron-carousel').length > 0) {
            if ($(window).scrollTop() < 480) {
                $('.container-branding').removeClass('hide');
            }
        }
    }
});

function initNavbar() {
    $(window).scroll(function () {
        getScrollPosition();
    });

    $('#slide-nav.navbar .container').append($('<div id="navbar-height-col"></div>'));

    //If a submenu has a current tag, open that up.
    $('.navbar-side .nav ul .current').closest('.panel-collapse').collapse('show');

    if (sessionStorage.getItem('menu-toggled') === null) {
        $('.wrapper[data-sidemenu="true"]').addClass('firsttime');
    }
    if (sessionStorage.getItem('menu-toggled') === 'true' || sessionStorage.getItem('menu-toggled') === null) {
        $('.wrapper[data-sidemenu="true"]').addClass('toggled initalload');
    }


    $('#menu-toggle').on('click', function (e) {
        e.preventDefault();
        var setToggleState = true;
        if ($(".wrapper").hasClass("firsttime")) {
            if ($(".navbar-side").width() == 0) {
                $(".wrapper").removeClass("toggled");
                setToggleState = false;
            }
        }
        $(".wrapper").removeClass("initalload").removeClass("firsttime");
        $(".wrapper").toggleClass("toggled");
        if (setToggleState === true) {
            sessionStorage.setItem('menu-toggled', $(".wrapper").hasClass("toggled"));
        }
    });

    //don't allow widows in the menu
    $('.navbar-side span, .navbar-side ul a').html(function (i, oldHtml) {
        return oldHtml.replace(/\s+([^\s]+)$/, "&nbsp;$1");
    });

    //load in-product notifications
    if ($('.notification-icon-container').length > 0)
        $.ajax({
            type: 'GET',
            url: '/Dashboard/Messages/Get',
            cache: false,
            success: function (data) {
                if (data.Error !== null && data.Error !== undefined) {
                    bootbox.alert(data.Error);
                    return false;
                }

                $.each(data.Data, function (i, item) {
                    if (item) {
                        item.Notification.Date = setLocalDate(item.Notification.Date, data.LocalCulture);
                        if (item.Notification.Url === '')
                            item.Notification.Url = '#';
                    }
                });

                if (data.Count > 0) {
                    $('.notification-count').removeClass('hidden');
                    $('.notification-count').html(data.Count > 9 ? '9+' : data.Count);
                    $('.notification-count').attr('data-count', data.Count);
                }

                var notificationsLayoutTpl;
                $.get("/Assets/Templates/expertzone/notifications.html", { "_": $.now() }, function (results) {
                    notificationsLayoutTpl = $(results).filter("#notificationsLayoutTpl").html();
                }).done(function () {
                    var content = Mustache.render(notificationsLayoutTpl, { Title: data.DataSecond, Notifications: data.Data });

                    $('.notification-container').html(content);
                });
            }
        });
}

function getScrollPosition() {

    var scrollTop = $(window).scrollTop(),
        mainHeaderHeight = $('.mainheader').height() || 0,
        jumbotronHeight = $('.jumbotron-carousel').height(),
        distance = 0;

    if ($('.sticky-navbar-admin').length > 0) {
        /* Check if this is the Content Creator admin sticky-navbar. If it is make it sticky by default. */
        distance = 0;
    } else {
        /* Calculate the postion of the Community Menu in the user interface */
        distance = parseInt(mainHeaderHeight - scrollTop);
    }

    if ($('.jumbotron-searchbox').is(':visible')) {
        jumbotronHeight = $('.jumbotron-searchbox').height();
    }

    if (scrollTop < jumbotronHeight) {
        distance = 1;
    }

    if (distance <= 0) {
        stickyNav(true, fixNavBar);
    } else {
        stickyNav(false, fixNavBar);
    }
}

function stickyNav(b, val) {

    if (b !== val) {
        var stickyNavbarHeight = $('.sticky-navbar').height(),
        $pageContentEl = $('.page-content');

        fixNavBar = b;

        $('.sticky-navbar').toggleClass('navbar-fixed-top', b);

        if (fixNavBar && stickyNavbarHeight) {
            //Once the '.sticky-navbar' becomes fixed add a top margin to the '.page-content' element so it doesn't jump behind the '.sticky-navbar'
            $pageContentEl.css("margin-top", stickyNavbarHeight);
        } else if (!fixNavBar && stickyNavbarHeight) {
            // Remove the "margin-top" property once the '.sticky-navbar' is no longer fixed to the top of the page
            var myCss = $pageContentEl.attr('style');
            if (myCss) {
                if (myCss == '') {
                    $pageContentEl.removeAttr('style');
                } else {
                    myCss = myCss.replace('margin-top: ' + $pageContentEl.css('margin-top') + ';', '');
                    $pageContentEl.attr('style', myCss);
                }
            }
        }

    }

}

function setLocalDate(LocalDate, LocalCulture) {
    var options = { year: 'numeric', month: 'numeric', day: 'numeric' };
    var is_safari = navigator.userAgent.toLowerCase().indexOf('macintosh') > -1;

    if (LocalDate === null)
        return '';
    else {
        var tempDate = moment(LocalDate).toDate();
        if (LocalCulture === null || is_safari)
            return moment(LocalDate).format('MM/DD/YYYY');
        return tempDate.toLocaleString(LocalCulture, options);
    }
}

function OnNotificationClick(ctl) {
    $.ajax({
        type: 'POST',
        url: '/Dashboard/Messages/Click?alertId=' + $(ctl).data('alertid'),
        success: function (data) {
            if (data.Error !== null && data.Error !== undefined)
                bootbox.alert(data.Error);
        }
    });

    return true;
}

function OnNotificationDelete(ctl) {
    bootbox.confirm(storyLocalizations.Notifications.ModalDeleteConfirmationMessage,
        function (result) {
            if (result) {
                $.ajax({
                    type: 'POST',
                    url: '/Dashboard/Messages/Delete?alertId=' + $(ctl).data('alertid'),
                    success: function (data) {
                        if (data.Error !== null && data.Error !== undefined) {
                            bootbox.alert(data.Error);
                        } else {
                            var $isNotificationNew = $(ctl).attr('data-is-new') == "true";
                            if ($isNotificationNew) {
                                subtractNotificationCount(ctl);
                            }
                            $(ctl).parent().hide();
                        }

                    }
                });
            }
        });

    return false;
}

function subtractNotificationCount(ctl) {

    var $notificationCountEl = $(ctl).closest('.navbar-notification').find('.notification-count');
    var currentCount = parseInt($notificationCountEl.attr('data-count'));
    var newCount = currentCount - 1;

    $notificationCountEl.attr('data-count', newCount);

    if (newCount === 0) {
        $('.notification-count').addClass('hidden');
    } else if (newCount <= 9) {
        $notificationCountEl.html(newCount);
    }


}
$(function () {
    var $body = $(document.body);
    $body.on('click', '.closeBtn', function () {
        $(this).parents('.profilepopup').hide();
        $('.modalmask').hide();
        $body.css('overflow', 'scroll');
        return false;
    });

    $body.on('hidden.bs.modal', '#commentModal', function () {
        $(this).removeData('bs.modal');
    });

    $('.commentLink').each(function () {
        LoadCommentCount($(this));
    });

    $body.on('click', '.modal-comment-link', function (e) {
        e.preventDefault();
        var target = $(this).attr("href");

        // load the url and show modal on success
        $("#commentModal .modal-content").empty();

        $.ajax({
            url: target,
            cache: false
        }).done(function (html) {
            $("#commentModal .modal-content").append(html);
            $("#commentModal").modal();
        });
    });
});

function LoadCommentCount(ctl) {
    var id = ctl.data('id');
    var type = ctl.data('type');
    var commandUrl = '/Comments/CreateLink?eZItemId=' + id + '&commentType=' + type;

    $.ajax({ url: commandUrl, cache: false })
        .done(function (html) {
            ctl.html(html);
        });
}

function LoadComments(ctl) {
    var id = $(ctl).data('id');
    var type = $(ctl).data('type');
    var commandUrl = '/Comments/Show?eZItemId=' + id + '&commentType=' + type;
    $('#uxCommentsPlaceholder').empty();

    var $profileDisplayDiv = $('#uxCommentsPlaceholder');

    var top = $(document).scrollTop();

    $.ajax({ url: commandUrl, cache: false })
        .done(function (html) {
            $profileDisplayDiv.html(html);
            $profileDisplayDiv.css({ 'top': top + 10, 'left': 5 });
            $profileDisplayDiv.show();
            $('.modalmask').css({ 'top': top });
            $('.modalmask').show(); 
            $('body').css('overflow', 'hidden');
        });

    return false;
}

function ShowReplyArea(ctl) {
    $(ctl).hide();
    $(ctl).closest(".reply-buttons").next().removeClass("hidden");

    return false;
}

function HideReplyArea(ctl) {
    $(ctl).closest("#AddCommentContainer").addClass("hidden");
    $(ctl).closest("#AddCommentContainer").prev().find(".reply-link").show();

    return false;
}

function UserReplyToComment(ctl) {

    var id = $(ctl).data('id');
    var userEnteredComment = $(ctl).parent().parent().parent().find(':text').val();
    var commandUrl = '/Comments/ReplyToComment?parentCommentId=' + id + '&comment=' + encodeURIComponent(userEnteredComment);

    $(ctl).attr('disabled', 'disabled');

    $.ajax({ url: commandUrl, cache: false })
        .done(function (html) {
            $(ctl).closest(".parentli").after(html);
            HideReplyArea(ctl);
            var commentCount = $('#CommentList').find('.comment-text').text();
            commentCount = parseInt(commentCount) + 1;
            $('#CommentList').find('.comment-text').text(commentCount);
        });
    return false;
}

function NewUserComment(ctl) {
    var id = $(ctl).data('id');
    var type = $(ctl).data('type');
    var userEnteredComment = $('#AddCommentText').val();
    var commandUrl = '/Comments/Comment?eZItemId=' + id + '&commentType=' + type + '&comment=' + encodeURIComponent(userEnteredComment) + "&upVote=0&downVote=0";

    $(ctl).attr('disabled', 'disabled');

    $.ajax({
        url: commandUrl,
        cache: false
    }).done(function (html) {
        var commentContainer = $('#CommentList');
        if ($('#collectionCarousel').length > 0) {
            commentContainer = $('#collectionCarouselContainer');
        }
        commentContainer.html(html);
        commentContainer.parent().animate({ scrollTop: 0 }, 'normal');

        //var commentCount = $('#CommentList').find('.comment-text').text();
        //commentCount = parseInt(commentCount) + 1;
        //$('#CommentList').find('.comment-text').text(commentCount);
    });
    return false;
}

//function UserLikesIt(ctl) {
//    var id = $(ctl).data('id');
//    var type = $(ctl).data('type');
//    var commandUrl = '/ThumbsUp/Like?eZItemId=' + id + '&likeTypeName=' + type;

//    $.ajax({ url: commandUrl, cache: false })
//        .done(function (html) {
//            $(ctl).parent().parent().html(html);
//        });

//    return false;
//}

function UserFlaggedComment(ctl) {
    var id = $(ctl).data('id');
    var commandUrl = '/FlaggedComment/Flag?commentId=' + id;

    $.ajax({ url: commandUrl, cache: false })
        .done(function (html) {
            $(ctl).parent().html(html);
        });

    return false;
}

$(function () {
    $(document.body).on('click', '.navbar-search', function () {
        if ($(this).hasClass('rm-search')) {
            window.location.href = "/Main/Search";
            return false;
        }

        var isSearchboxVisible = ($('.jumbotron-searchbox').is(':visible')) ? true : false;
        var hasCarousel = $('.jumbotron-carousel').length > 0;

        if (hasCarousel) {
            if (isSearchboxVisible) {
                $('.jumbotron-searchbox').hide();
                $('.jumbotron-carousel').show();
                $('.navbar-search').removeClass('active');
            } else {
                $('.jumbotron-searchbox').show();
                $('.jumbotron-carousel').hide();
                getPopularTags();
                $('.navbar-search').addClass('active');
            }
        } else {
            if (isSearchboxVisible) {
                $('.jumbotron-searchbox').hide('slow', function () { getScrollPosition(); });
                $('.navbar-search').removeClass('active');
            } else {
                $('#slide-nav').removeClass('navbar-fixed-top');
                $('.container-branding').removeClass('hide');
                getPopularTags();
                $('.jumbotron-searchbox').show('slow', function () { getScrollPosition(); });
                $('.form-control-searchbox').focus();
                $('.navbar-search').addClass('active');
            }
        }             
    });

    $('#search').keypress(function (e) {
        if (e.which === 13) {
            submitSearch();
            return false;
        }
    });
});

function submitSearch() {
    window.location.href = "/Main/Search?SearchTerm=" + $("#search").val();
}

function getPopularTags() {
    $.get("/Assets/templates/expertzone/searchbox.html", { "_": $.now() }, function (template) {
        $.ajax({
            url: '/Story/Metadata/PopularTags',
            success: function (jsonObject) {
                var data = { "Tags": jsonObject.Data };
                var searchItemTpl = Mustache.render($(template).filter('#search-item-tpl').html(), data);
                $('.list-searchbox').html(searchItemTpl);
                $('#search')[0].focus();
            }
        });
    });
}
/// <reference path="~/Assets/js/libraries/jquery.min.js" />
/// <reference path="~/Assets/js/libraries/mustache.js" />
/* global Mustache, makeIntArray, bootbox, storyLocalizations, moment, TILES_TEMPLATE:true, TILES_CURRENT:true, storageAvailable  */

TILES_TEMPLATE = "";
TILES_CURRENT = {};
var tileEventsInitialized = false;

var checkingForAsyncTileResults = false;
var asyncTileResults = [];
var hasAsyncTileResults = false;
var myLazyLoad = new LazyLoad({ elements_selector: ".bgImgContainer" });

//Test calling once
var onlyOnce = true;


/* Global App Namespace */
var mec;
(function (mec) {
    var tiles;
    (function (tiles) {

        function toggleFavorite(element, token) {
            var data = { 'token': token };
            $.ajax({
                url: '/Story/API/Favorite',
                data: data,
                type: "POST",
                dataType: "json",
                cache: false,
                success: function (result) {
                    if (result.Error !== null) {
                        bootbox.alert(result.Error);
                    }
                    var isFavorite = (result.Data === 'Favorite');
                    $(element).toggleClass('favorite-active', isFavorite);
                    $(element).closest('.favorite-container').find('.tile-favorite-count').toggleClass('hidden', isFavorite);


                },
                error: function (xhr, status, error) {
                    bootbox.alert("An error occurred while marking/un-marking this item as favorite: <br />" + error);
                }
            });
        }

        tiles.toggleFavorite = toggleFavorite;

    })(mec.tiles || (mec.tiles = {}));
})(mec || (mec = {}));


$(function () {
    // story specific tracking
    initTiles();
});

function initTiles() {
    getTilesTemplate();
    initTileListeners();
}

function initTileListeners() {
    //tile events:
    // updateTiles - in tiles.js

    // Here you register for the event and do whatever you need to do.
    $(document).on('updateTiles', function (event) {
        //TODO: only change the tiles that are flagged to change
        //For now, specify the ones to change
        $('.tile-wrapper').each(function () {
            var formattype = $(this).attr('data-formattype');

            if (formattype !== 'related' && formattype !== 'recommended' && formattype !== 'featured') {
                if (formattype === 'mycontent' || formattype === "tilecontent" || formattype == "myfavorite") {
                    // this is the check for tilcontent not updating on filter change - cool
                    if ($(this).attr("data-triggeronfilterchange") === "false") {
                        return;
                    }
                }
                $(this).empty().attr('data-currentpage', 0);
                getTiles($(this), false);

            }
        });

    });

    // add listener to close the sharing popovers if user clicks on any other part of the document
    $('body').on('click', function (e) {
        $('[data-toggle=popover]').each(function () {
            // hide any open popovers when the anywhere else in the body is clicked
            if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
                $(this).popover('hide');
            }
        });
    });

}

function getTilesTemplate() {
    if (TILES_TEMPLATE.length === 0) {
        //hard code the cache string to the date of the release
        $.ajaxSetup({ cache: true });
        var deferred = $.get("/assets/templates/expertzone/tiles.html", { "_": $.now() }, function (template) {
            TILES_TEMPLATE = template;
        });
        $.ajaxSetup({ cache: false });
        return deferred;
    }
    return TILES_TEMPLATE;
}

function initTileEvents() {
    if (!tileEventsInitialized) {
        tileEventsInitialized = true;

        $('.tile-wrapper').on('mouseenter', '.show-metrics, .tile-video', function () {
            $(this).addClass('hover');
        });

        $('.tile-wrapper').on('mouseleave', '.show-metrics, .tile-video', function () {
            $(this).removeClass('hover');
        });

        $('.tile-wrapper').on('click', '.tile-video', function () {
            var videoPlayer = $(this).find('video').get(0);
            if ($(this).hasClass('playing')) {
                videoPlayer.pause();
                $(this).removeClass('playing');
            } else {
                videoPlayer.play();
                $(this).addClass('playing');
            }
        });

        $("div.tile-wrapper").on('click', "div.tile[data-tile-type='Tile'],div.tile[data-tile-type='LearningPath']", function (event) {
            event.stopPropagation();
            var token = $(this).attr("data-token");
            if (token !== undefined && token !== null) {
                // record view for tiles
                $.post("/Story/API/SetViewed?token=" + token);
            }
        });

        $('.tile-wrapper').on('click', '.btn-videoquality', function (event) {
            event.stopPropagation();

            var videoQualityBtn = $(this).find('.glyphicon');
            var videoPlayer = $(this).closest('.tile-video').find('video').get(0);

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

        $('.tile-wrapper').on('click', '.js-click-favorite', function (event) {
            event.preventDefault();

            var token = $(this).parents('.tile-container').data('token');
            mec.tiles.toggleFavorite(this, token);
        });

        // view more
        $(document).on('click', '.tiles-viewmore', function (event) {
            event.stopPropagation();
            event.preventDefault();
            getTiles($('*[data-tilesname="' + $(this).attr('data-assocatedtiles') + '"]'), false);
        });
    }

    $(document).on('click', '.tile .upvote', function (event) {
        event.preventDefault();
        event.stopPropagation();
        if ($(".btn-signin").length === 0) {
            var $this = $(this);
            if (!$this.hasClass('upvoted')) {
                $this.addClass('upvoted');
                $this.find(".upvote-count").text(parseInt($this.find(".upvote-count").text()) + 1);
                vote(true, $(this).closest('.tile').data('token'));
            }
        }
    });

    $(document).on('click', '.tile-content .upvote', function (event) {
        event.preventDefault();
        event.stopPropagation();
        if ($(".btn-signin").length === 0) {
            var $this = $(this);
            if (!$this.hasClass('upvoted')) {
                $this.addClass('upvoted');
                $this.find(".upvote-count").text(parseInt($this.find(".upvote-count").text()) + 1);
                vote(true, $(this).closest('.tile-content').data('token'));
            }
        }
    });

}

function initUserTileEvents() {
    var USER_TILE_SPEED = 1000;

    $('.user-tile .view-more').each(function (index, el) {

        //// wait for the image to load 

        var $imgElement = $(el).parent().find("img");
        if ($imgElement.length > 0) {
            $imgElement.addClass('img-responsive');
            $imgElement.load(function () {
                updateTileViewMore(el);
            });
        } else {
            updateTileViewMore(el);
        }
    });

    $('.tile-wrapper').on('click', '.user-tile .down', function (e) {
        e.preventDefault();
        var $this = $(this),
            $bio = $this.parents('.user-tile').find('.user-tile-bio'),
            $bioHeight = $bio.height(),
            scrollPosition = $bio.data('position') || 0,
            nextPosition = scrollPosition + $bioHeight,
            scrollHeight = $bio.prop('scrollHeight') - $bioHeight;

        if (nextPosition > scrollHeight) {
            nextPosition = scrollHeight;
            $this.addClass('invisible');
        }

        // show previous button
        $this.siblings('a').removeClass('invisible');
        $bio.animate({ scrollTop: nextPosition }, USER_TILE_SPEED);

        $bio.data('position', nextPosition);
    });

    $('.tile-wrapper').on('click', '.user-tile .up', function (e) {
        e.preventDefault();
        var $this = $(this),
            $bio = $this.parents('.user-tile').find('.user-tile-bio'),
            $bioHeight = $bio.height(),
            scrollPosition = $bio.data('position') || 0,
            nextPosition = scrollPosition - $bioHeight;

        if (nextPosition <= 0) {
            nextPosition = 0;
            $this.addClass('invisible');
        }

        // show next button
        $this.siblings('a').removeClass('invisible');
        $bio.animate({ scrollTop: nextPosition }, USER_TILE_SPEED);

        $bio.data('position', nextPosition);
    });

}

function updateTileViewMore(el) {
    $el = $(el);
    var tileHeight = $el.parent().height() - 60; //40px is tile user-tile padding
    var userImageHeight = $el.parent().find('.user-image').height();
    var headerHeight = $el.parent().find('.header').height();
    var $bio = $el.parent().find('.user-tile-bio');
    var bioHeight = $bio.height() - 20; //20px is the margin on the top

    if (userImageHeight + headerHeight + bioHeight > tileHeight || $bio.attr('data-hasmorelink')) {
        $bio.height(tileHeight - userImageHeight - headerHeight);
        $bio.attr('data-hasmorelink', 'true');
    } else {
        $el.remove();
    }
}

function getTiles(tileWrapper, isInitalLoad, callback) {
    if ($(tileWrapper).hasClass("autogeneratetiles")) {
        $(tileWrapper).attr("data-showstatusindicator", "true");
        $(tileWrapper).attr("data-showlevelindicator", "true");
    }

    if ($(tileWrapper).attr("data-fetchdata") && $(tileWrapper).attr("data-fetchdata") !== "true") {
        return;
    }
    if (isInitalLoad === undefined) {
        isInitalLoad = true;
    }
    // in some cases, we need to turn off autoloading of tiles
    if ($(tileWrapper).attr("data-autoload") !== undefined && $(tileWrapper).attr("data-autoload") === "false") {
        return;
    }


    //Assume there will be results to display when filtering
    hasAsyncTileResults = true;
    setFilterNoResultsMessage(hasAsyncTileResults);

    var assocatedTiles = $(tileWrapper).attr('data-tilesname');
    var $btn = $('.tiles-viewmore[data-assocatedtiles="' + assocatedTiles + '"]').button('loading');
    $(tileWrapper).append('<div class="col-xs-12 "><div class="home-loader"><img src="/Assets/images/ajax-loader.gif" /></div></div>');

    var formattype = $(tileWrapper).attr('data-formattype');
    var tileType = $(tileWrapper).attr('data-tiletype');
    var publicView = $(tileWrapper).attr('data-publicview') === "true";
    var tilecontenttype = $(tileWrapper).attr('data-tilecontenttype');

    var url = '/Story/API';
    if (formattype === 'mycontent') {
        if (publicView == false)
            url = '/Story/API/Retrieve';
        else
            url = '/Story/API';
    } else if (formattype === 'related') {
        url = '/Story/API/GetRelatedStories';
    } else if (formattype === 'recommended') {
        url = '/Story/API/Recommendations';
    } else if (formattype === 'tilecontent') {
        if (tilecontenttype !== undefined && tilecontenttype.toLowerCase() === 'recommended') {
            url = '/Story/API/PersonalRecommendations';
        }
    }

    if (tilecontenttype !== undefined && tilecontenttype.toLowerCase() === 'recommended' && $("#story.workspace").length === 0) {
        $(tileWrapper).closest(".module").hide();
    }


    var take = parseInt($(tileWrapper).attr('data-take'));
    var currentPage = parseInt($(tileWrapper).attr('data-currentpage'));

    var params = getTileParams(tileWrapper, formattype, publicView, take, currentPage);

    TILES_CURRENT[assocatedTiles] = JSON.parse(JSON.stringify(params));

    var updateFromHash = false;
    if (window.location.hash) {

        if (formattype !== 'related' && formattype !== 'recommended' && formattype !== 'featured' && formattype !== "tilecontent") {
            updateFromHash = true;

        } else if ((formattype === 'mycontent' || formattype === "tilecontent" || formattype === 'myfavorite') && $(tileWrapper).attr("data-triggeronfilterchange") === "true") {
            updateFromHash = true;

        }
    }


    if (updateFromHash) {
        TILES_CURRENT[assocatedTiles] = updateObjectFromQueryString(TILES_CURRENT[assocatedTiles], window.location.hash.split('#')[1]);
    }

    //TODO
    ////If the user had did paging, show them where they were.
    //if (isInitalLoad && !jQuery.isEmptyObject(TILES_CURRENT[assocatedTiles])) {
    //    if (TILES_CURRENT[assocatedTiles].Skip > 0) {
    //        currentPage = (TILES_CURRENT[assocatedTiles].Skip / TILES_CURRENT[assocatedTiles].Take);
    //        TILES_CURRENT[assocatedTiles].Skip = 0;
    //        TILES_CURRENT[assocatedTiles].Take = (TILES_CURRENT[assocatedTiles].Take * (currentPage + 1));
    //        //update the current page, so paging workds
    //        $(tileWrapper).attr('data-currentpage', currentPage);
    //    }
    //}

    var asyncRequestTiles = $.ajax({
        url: url,
        data: TILES_CURRENT[assocatedTiles],
        type: "POST",
        cache: false,
        dataType: "json",
        success: function (data) {

            if (data.Error !== null) {
                bootbox.alert(data.Error);
                return false;
            } else {
                var jsonObject = massageJsonData(data.Data, formattype, tileType, publicView);
                if (jsonObject === null) {
                    return;
                }
                jsonObject.ShowLevelIndicator = false;
                if (tileWrapper.attr("data-showlevelindicator") && tileWrapper.attr("data-showlevelindicator") == "true") {
                    $(jsonObject).each(function (index, value) {
                        value.ShowLevelIndicator = true;
                    });
                }

                $(jsonObject).each(function (index, value) {
                    if (value.Story.LevelOfDifficultValue) {
                        value.Story.HasLevelOfDifficultyValue = true;
                    }
                    else {
                        value.Story.HasLevelOfDifficultyValue = false;
                    }

                    if (value.Hierarchy) {
                        value.HasHierarchy = true;
                    }
                    else {
                        value.HasHierarchy = false;
                    }

                });


                jsonObject.ShowStatusIndicator = false;
                if (tileWrapper.attr("data-showstatusindicator") && tileWrapper.attr("data-showstatusindicator") == "true") {
                    $(jsonObject).each(function (index, value) {
                        value.ShowStatusIndicator = true;
                    });
                }

                if (formattype === 'usertile') {
                    if (params.Skip === 0) {
                        tileWrapper.empty();
                        tileWrapper.append('<div class="col-xs-12 "><div class="home-loader"><img src="/Assets/images/ajax-loader.gif" /></div></div>');
                    }
                }

                //show hide the view more button
                if (data.Count <= TILES_CURRENT[assocatedTiles].Skip + TILES_CURRENT[assocatedTiles].Take) {
                    $(tileWrapper).attr('data-currentpage', -1);
                    $('.tiles-viewmore[data-assocatedtiles="' + $(tileWrapper).attr('data-tilesname') + '"]').closest('.tiles-viewmore-container').hide();

                } else {
                    $(tileWrapper).attr('data-currentpage', currentPage + 1);
                    $('.tiles-viewmore[data-assocatedtiles="' + $(tileWrapper).attr('data-tilesname') + '"]').closest('.tiles-viewmore-container').show();
                }

                //Check if the 'formattype' is undefined which indicates it is the View All layout (#tileLayoutTpl)
                //setAvailabilityMatchType should only be used with the #tileLayoutTpl when a filter is applied and uses this layout
                if (formattype === undefined) {
                    //Set the active state for the 'availabilityMatchType' based on Story data returned
                    setAvailabilityMatchType(data.Data, TILES_CURRENT[assocatedTiles]);
                }
        
                var layoutTpl = getTileFormatTemplate(formattype, tileType);
                updateTiles(tileWrapper, layoutTpl, jsonObject);

                toggleFilterTitle(data.Count);

                toggleFilterAvailabilityInfo(data.Count);

                // rotate tiles if needed
                var autoRotate = false;
                var samePage = true;
                var perPage = 3;
                if (jsonObject.length > 0
                    && formattype === 'recommended' || (formattype === 'tilecontent' && tileType === 'row') || formattype === 'related' || formattype === 'featured') {

                    if (formattype === 'related' || formattype === 'featured') {
                        autoRotate = true;
                    }
                    if (formattype === 'tilecontent' && tileType === 'row') {
                        perPage = 4;
                        samePage = false;
                    }

                    tileWrapper.ezRotateTile({
                        autoRotate: autoRotate, samePage: samePage, perPage: perPage, formatType: formattype
                    });
                    //you don't need the view more if you are rotating
                    $('.tiles-viewmore[data-assocatedtiles="' + $(tileWrapper).attr('data-tilesname') + '"]').closest('.tiles-viewmore-container').hide();
                }

                //show the featured row if there are tilesgetTiles
                if (jsonObject.length > 0 && (formattype === 'featured') && (!window.location.hash)) {
                    $('.featured-row').show();
                }
                else {

                    //$(".tile-wrapper").each(function () {
                    //    if ($(this).attr("data-tilecontenttype") == "Featured") {
                    //        if (window.location.hash != undefined && window.location.hash != "") {
                    //            $(this).closest(".module-content").hide();
                    //        }
                    //        else {
                    //            $(this).closest(".module-content").show();
                    //        }
                    //    }
                    //});

                }

                if (jsonObject.length > 0 && (formattype === 'recommended')) {
                    $('.featured-row').show();
                    if ($(".module[data-module-type='Recommended'] div.tile[data-recommended='true']").length > 0) {
                        var pageUrl = window.location.pathname + (window.location.search != null ? window.location.search : "");
                        $(document).trigger("OnAnalyticsTrackingEvent", { Category: "Recommendation", Action: "Presented", Label: pageUrl });
                    }
                }

                if (jsonObject.length > 0 && (formattype === 'tilecontent')) {
                    if ($(".module[data-module-type='TileContent'] div.tile-content[data-recommended='true']").length > 0) {
                        pageUrl = window.location.pathname + (window.location.search != null ? window.location.search : "");
                        $(document).trigger("OnAnalyticsTrackingEvent", { Category: "PersonalRecommendation", Action: "Presented", Label: pageUrl });
                    }
                }
                if ($("#story.workspace").length === 0) {
                    if (jsonObject.length > 0 && tilecontenttype !== undefined && tilecontenttype.toLowerCase() === 'recommended') {
                        tileWrapper.closest(".module").show();
                    }
                }
                //update the total number of results based on the tile count
                if (typeof updateFilterTotals === 'function') {
                    updateFilterTotals(data.Count, assocatedTiles);
                }

            }
        }
    }).done(function (jsonObject) {
        $btn.button('reset');
        $(tileWrapper).find('.home-loader').parent().remove();
        initTileEvents();
        initUserTileEvents();

        //Lazy Load images
        myLazyLoad.update();

        //Whenever an async request for tiles completes check to see if the other requests also completed.
        checkForResolvedTileRequests();

        //TODO
        ////Reset the skip/take to the defaults on the page
        //if (isInitalLoad && !jQuery.isEmptyObject(TILES_CURRENT[assocatedTiles])) {
        //    TILES_CURRENT[assocatedTiles].Skip = currentPage * take;
        //    TILES_CURRENT[assocatedTiles].Take = take;

        //    if (TILES_CURRENT[assocatedTiles].CurrentItem !== undefined) {
        //        $('html, body').animate({
        //            scrollTop: $('.tile[data-token="' + TILES_CURRENT[assocatedTiles].CurrentItem + '"]').offset().top - 150
        //        }, 1000);
        //        TILES_CURRENT[assocatedTiles].CurrentItem = null;
        //    }
        //}

        if (callback !== undefined) {
            callback(jsonObject);
        }
    });

    asyncTileResults.push(asyncRequestTiles);

}

function checkForResolvedTileRequests() {

    if (!checkingForAsyncTileResults) {
        checkingForAsyncTileResults = true;

        $.when.apply(this, asyncTileResults).done(function () {
            //If asyncTileResults has a single result the result is an Object. 
            //If asyncTileResults has multiple results the result is an Array. 
            if (asyncTileResults.length === 1 && arguments.length > 1) {
                var tileResult = arguments[0];
                if (tileResult.Count > 0) {
                    hasAsyncTileResults = true;
                } else {
                    hasAsyncTileResults = false;
                }

            } else {

                for (var i = 0; i < arguments.length; i++) {
                    var tileResult = arguments[i];

                    if (tileResult[0].Count > 0) {
                        hasAsyncTileResults = true;
                        break; //Break out of the loop once positive results found. This prevents it from being set back to false.
                    } else {
                        hasAsyncTileResults = false;
                    }

                }
            }

            checkingForAsyncTileResults = false;

            setFilterNoResultsMessage(hasAsyncTileResults);


            //Clear the array and wait for next request for tiles
            asyncTileResults = [];
        });
    }
}


function moveTilesToTop() {

}

function setAvailabilityMatchType(tileData, paramsWithHash) {
    if (typeof paramsWithHash === 'object' && paramsWithHash.hasOwnProperty('MatchType') && tileData.length > 0) {
        //All data returned will have the same "HasAvailability" boolean set so we only need to know what the properties are in the first object
        var jsonObject = tileData[0];

        // Remove any 'is-active' classes for 'MatchType'
        $('.tile-filter-availability-legend-container').find('.toggle-filter').removeClass('is-active');

        if (jsonObject.hasOwnProperty('HasAvailabilityExact') && jsonObject.HasAvailabilityExact) {
            //Set the active state for this button
            $('li[data-availability="exact"]').addClass('is-active');
        }

        if (jsonObject.hasOwnProperty('HasAvailabilityFlexible') && jsonObject.HasAvailabilityFlexible) {
            //Set the active state for this button
            $('li[data-availability="flexible"]').addClass('is-active');
        }

        if (jsonObject.hasOwnProperty('HasAvailabilityPrivate') && jsonObject.HasAvailabilityPrivate) {
            //Set the active state for this button
            $('li[data-availability="private"]').addClass('is-active');
        }
    }
}

function setFilterNoResultsMessage(hasAsyncTileResults) {
    if (hasAsyncTileResults) {
        $('.no-results-container').hide();
    } else {
        $('.no-results-container').show();
    }
};

function toggleFilterAvailabilityInfo(count) {
    var isFilterAvailabilityActive = (typeof FILTER_QUERYSTRING !== 'undefined' && typeof FILTER_QUERYSTRING.ScheduleAvailability !== 'undefined');
    $(".tile-filter-availability-legend-hidden").hide();
    if (isFilterAvailabilityActive) {
        if ($("#selectedDisplayType").val() == "true") {
            $(".tile-filter-availability-legend-hidden").show();
        }
    }
}

function toggleFilterTitle(count) {
    //Per request 6759480 - Supress the page title when there are no search results
    //Per request 6967494 - Supress the page title when the user is filtering be availability
    var hasTileResults = (count > 0);
    var isFilterAvailabilityActive = (typeof FILTER_QUERYSTRING !== 'undefined' && typeof FILTER_QUERYSTRING.ScheduleAvailability !== 'undefined' && count > 0);

    var showTitle = function () {
        if (isFilterAvailabilityActive) {
            return false;
        }
        if (hasTileResults) {
            return true;
        }
        return false;
    }

    $("#filterTitle").toggle(showTitle());
}

function getTileFormatTemplate(formatType, tileType) {

    //based on the tile type, use a different template.
    if (tileType === 'narrow') {
        return '#tileNarrowLayoutTpl';

    } else if (formatType === 'tilecontent' && tileType === 'row') {
        return '#tileContentRowLayoutTpl';

    } else {
        // some formattypes always use the same layout template
        switch (formatType) {
            case 'usertile':
                return '#tileUserLayoutTpl';
                break;

            case "featured":
            case "recommended":
                return '#tileFeatureLayoutTpl';
                break;

            case 'mycontent':
            case 'myfavorite':
                return '#tileMyContentLayoutTpl';
                break;

            case 'related':
                return '#tileRelatedLayoutTpl';
                break;

            default:
                return '#tileLayoutTpl';
                break;
        }
    }
}

function getTileParams(tileWrapper, formattype, publicView, take, currentPage) {
    var usertoken = $(tileWrapper).attr('data-usertoken');
    var group = $(tileWrapper).attr('data-group');
    var sortAscending = $(tileWrapper).attr('data-sortascending');
    if (sortAscending !== 'false' && sortAscending !== '0') { sortAscending = true; }

    var params = {
        Skip: currentPage * take,
        Take: take,
        SortOrder: $(tileWrapper).attr('data-sortorder'),
        SortAscending: sortAscending,
        Readiness: "Live"
    };

    var searchCriteria = {};
    if (formattype === 'myfavorite') {
        searchCriteria.FavoritesOnly = true;
        searchCriteria.Skip = currentPage * take;
        searchCriteria.Take = take;
        searchCriteria.SortOrder = "DateCreated";
        searchCriteria.ContentLanguageId = null;
        searchCriteria.IsMaster = false;
        searchCriteria.IsFeatured = false;
        searchCriteria.IsBannered = false;
        searchCriteria.SearchReasonType = "ForPrimaryDisplay";
    }

    else if (formattype === 'mycontent' && publicView) {
        searchCriteria.Skip = currentPage * take;
        searchCriteria.Take = take;
        searchCriteria.SortOrder = "DateCreated";
        searchCriteria.ContentLanguageId = null;
        searchCriteria.IsMaster = false;
        searchCriteria.IsFeatured = false;
        searchCriteria.IsBannered = false;
        searchCriteria.SearchReasonType = "ForPrimaryDisplay";

        searchCriteria.CreatedByToken = usertoken;
        searchCriteria.Group = group;

    } else if (formattype === 'mycontent') {
        //if ($("#contentFilter").val() !== "Expired") {
        //    searchCriteria.ItemStatus = $("#contentFilter").val();
        //} else {
        //    searchCriteria.Readiness = "Expired";
        //}

        searchCriteria.Skip = currentPage * take;
        searchCriteria.Take = take;
        searchCriteria.SortOrder = "DateCreated";
        //searchCriteria.StoryTypes = null;
        searchCriteria.ContentLanguageId = null;
        searchCriteria.IsMaster = false;
        searchCriteria.IsFeatured = false;
        searchCriteria.IsBannered = false;
        searchCriteria.SearchReasonType = "ForPrimaryDisplay";

        searchCriteria.CreatedByToken = usertoken;
        searchCriteria.Group = group;

    } else if (formattype === 'related') {
        params = {
            token: $("#token").val(),
            storyRelationshipType: 'RelatedTo'
        };

    } else if (formattype === 'recommended') {
        params = {
            token: $("#token").val(),
            restrictToContentType: $(tileWrapper).attr('data-restricttocontenttype')
        };

    } else if (formattype === 'tilecontent') {
        var tilecontenttype = $(tileWrapper).attr('data-tilecontenttype');
        if (tilecontenttype === undefined) { tilecontenttype = ''; }
        switch (tilecontenttype.toLowerCase()) {
            case "recommended":
                $.extend(params, { ContainerToken: $("#token").val() });
                break;
            case "popular":
                $.extend(params, { SortOrder: "Popularity" });
                break;
            case "featured":
                $.extend(params, { IsFeatured: true });
                $.extend(params, { SortOrder: "Date" });
                $.extend(params, { SortAscending: false });
                break;
            case "new":
                $.extend(params, { SortOrder: "New" });
                $.extend(params, { SortAscending: false });
                break;
            case "mostupvoted":
                $.extend(params, { SortOrder: "Rating" });
                $.extend(params, { SortAscending: false });
                break;
            case "favorites":
                $.extend(params, { FavoritesOnly: true });
                $.extend(params, { SortOrder: "FavoriteDate" });
                $.extend(params, { SortAscending: false });
                break;
            case "displaypriority":
            case "":
                $.extend(params, { SortOrder: "DisplayPriority" });
                $.extend(params, { SortAscending: true });
                break;
            default:
                $.extend(params, { SortOrder: "Date" });
                $.extend(params, { SortAscending: false });
        }

    }

    if (!jQuery.isEmptyObject(searchCriteria)) {
        params = searchCriteria;
    }

    // Include Hidden
    if ($(tileWrapper).attr('data-includehidden') && $(tileWrapper).attr('data-includehidden').length > 0) {
        $.extend(params, { IncludeHidden: $(tileWrapper).attr('data-includehidden') });
    }

    //Story Type, multiple
    if ($(tileWrapper).attr('data-type') && $(tileWrapper).attr('data-type').length > 0) {
        $.extend(params, { StoryTypes: $(tileWrapper).attr('data-type').split(',').clean('') });
    }

    if ($(tileWrapper).attr('data-formattype') && $(tileWrapper).attr('data-formattype').toLowerCase() === "featured") {
        $.extend(params, { IsFeatured: true });
    }

    if ($(tileWrapper).attr('data-minimumpoints')) {
        $.extend(params, { MinimumPoints: $(tileWrapper).attr('data-minimumpoints') });
    }

    if ($(tileWrapper).attr('data-maximumpoints')) {
        $.extend(params, { MaximumPoints: $(tileWrapper).attr('data-maximumpoints') });
    }
    // Nav Category, fixed value set on the filter
    var navCategoryArray = [];
    var navCategory = {};

    // Nav Categories these are the tags that will have to allow multiples
    if ($(tileWrapper).attr('data-nav-category') && $(tileWrapper).attr('data-nav-category').length > 0) {
        navCategory = makeIntArray($(tileWrapper).attr('data-nav-category').split(',').clean(''));
        navCategoryArray = navCategory.concat(navCategoryArray);
    }

    if (navCategoryArray.length > 0) {
        $.extend(params, { NavCategories: navCategoryArray });
    }

    // Sub Category
    if ($(tileWrapper).attr('data-sub-nav-category') && $(tileWrapper).attr('data-sub-nav-category').length > 0 && parseInt($(tileWrapper).attr('data-sub-nav-category')) !== 0) {
        $.extend(params, { SubnavCategoryId: parseInt($(tileWrapper).attr('data-sub-nav-category')) });
    }

    var categoryArray = [];
    var category = {};

    // Tags these are the tags that will have to allow multiples

    if ($(tileWrapper).attr('data-category') && $(tileWrapper).attr('data-category') !== "," && $(tileWrapper).attr('data-category').length > 0) {
        category = makeIntArray($(tileWrapper).attr('data-category').split(',').clean('').clean('0').clean('4000'));
        categoryArray = category.concat(categoryArray);
    }


    if (categoryArray.length > 0) {
        $.extend(params, { TagCategories: categoryArray });
    }


    var featuredCategoryArray = [];
    var featuredCategory = {};

    // Nav Categories these are the tags that will have to allow multiples
    if ($(tileWrapper).attr('data-featured-category') && $(tileWrapper).attr('data-featured-category').length > 0) {
        featuredCategory = makeIntArray($(tileWrapper).attr('data-featured-category').split(',').clean(''));
        featuredCategoryArray = featuredCategory.concat(featuredCategoryArray);
    }

    if (featuredCategoryArray.length > 0) {
        $.extend(params, { FeaturedCategories: featuredCategoryArray });
    }


    // Country Breakdown
    var countryArray = [];
    var country = {};
    if ($(tileWrapper).attr('data-country') && $(tileWrapper).attr('data-country').length > 0) {

        country = $(tileWrapper).attr('data-country').split(',').clean('');
        countryArray = makeIntArray(country);
        $.extend(params, { Countries: countryArray });
    }

    // Language Breakdown, multiple
    var languageArray = [];
    var language = {};
    if ($(tileWrapper).attr('data-language') && $(tileWrapper).attr('data-language').length > 0) {
        language = $(tileWrapper).attr('data-language').split(',').clean('');
        languageArray = makeIntArray(language);
        $.extend(params, { Languages: languageArray });
    }

    // Editor Picks Breakdown
    if ($(tileWrapper).attr('data-editorpicks') && $(tileWrapper).attr('data-editorpicks').length > 0) {
        $.extend(params, { OnlyShowEditorPicks: $(tileWrapper).attr('data-editorpicks') });
    }

    // User Group attributes
    if ($(tileWrapper).attr('data-attributes') && $(tileWrapper).attr('data-attributes').length > 0 && parseInt($(tileWrapper).attr('data-attributes')) !== 0) {
        $.extend(params, { Attributes: $(tileWrapper).attr('data-attributes').split(',').clean('') });
    }

    // Favorites
    if ($(tileWrapper).attr('data-showfavorite') && $(tileWrapper).attr('data-showfavorite').length > 0) {
        $.extend(params, { FavoritesOnly: $(tileWrapper).attr('data-showfavorite') });
    }

    // By Popularity
    if ($(tileWrapper).attr('data-showbypopularity') && $(tileWrapper).attr('data-showbypopularity').length > 0) {
        //we are checking if this is not popular tile row then  
        if ($(tileWrapper).attr('data-tilecontenttype') && $(tileWrapper).attr('data-tilecontenttype').toLowerCase() !== "popular") {
            $.extend(params, { ShowByPopularity: $(tileWrapper).attr('data-showbypopularity') });

            if ($(tileWrapper).attr('data-showbypopularity').toLowerCase() === "true") {
                $.extend(params, { SortOrder: "Popularity" });
            }
        }
    }

    if ($(tileWrapper).attr('data-showbynew') && $(tileWrapper).attr('data-showbynew').length > 0) {
        //we are checking this if this is not new tile row then  
        if ($(tileWrapper).attr('data-tilecontenttype') && $(tileWrapper).attr('data-tilecontenttype').toLowerCase() !== "new") {
            {
                if ($(tileWrapper).attr('data-showbynew').toLowerCase() === "true") {
                    $.extend(params, { SortOrder: "New" });
                }
            }
        }
    }
    if ($(tileWrapper).attr('data-showbyfeatured') && $(tileWrapper).attr('data-showbyfeatured').length > 0) {
        //we are checking if this is not featured tile row then  
        if ($(tileWrapper).attr('data-tilecontenttype') && $(tileWrapper).attr('data-tilecontenttype').toLowerCase() !== "featured") {
            $.extend(params, { IsFeatured: $(tileWrapper).attr('data-showbyfeatured') });
            if ($(tileWrapper).attr('data-showbyfeatured').toLowerCase() === "true") {
                $.extend(params, { SortOrder: "Date" });
                $.extend(params, { SortAscending: false });
            }
        }
    }


    var completionStatuses = [];

    if ($(tileWrapper).attr('data-inprogress') && $(tileWrapper).attr('data-inprogress').length > 0) {

        $.extend(params, { ShowInProgress: $(tileWrapper).attr('data-inprogress') });
        $.extend(params, { SortOrder: "DisplayPriority" });
    }

    if ($(tileWrapper).attr('data-notstarted') && $(tileWrapper).attr('data-notstarted').length > 0) {
        $.extend(params, { ShowNotStarted: $(tileWrapper).attr('data-notstarted') });
        $.extend(params, { SortOrder: "DisplayPriority" });
    }

    currentFilterData = {};
    if ($(tileWrapper).attr("data-datestarting")) {
        currentFilterData.DateStarting = $(tileWrapper).attr("data-datestarting");
    }

    if ($(tileWrapper).attr("data-dateending")) {
        currentFilterData.DateEnding = $(tileWrapper).attr("data-dateending");
    }

    if ($(tileWrapper).attr("data-starttime")) {
        currentFilterData.StartTime = $(tileWrapper).attr("data-starttime");
    }

    if ($(tileWrapper).attr("data-endtime")) {
        currentFilterData.EndTime = $(tileWrapper).attr("data-endtime");
    }

    if (currentFilterData !== null) {
        $.extend(params, {
            ScheduleAvailability: currentFilterData
        });
    }

    //affiliateduser
    if ($(tileWrapper).attr('data-affilateduser') && $(tileWrapper).attr('data-affilateduser').length > 0) {
        var affilateduserArray = [];
        var affilatedusers = $(tileWrapper).attr('data-affilateduser').split(",");
        var affilatedusersLength = affilatedusers.length;
        for (i = 0; i < affilatedusersLength; i++) {
            if ($.trim(affilatedusers[i]).length > 0) {
                var affilateduser = {};
                affilateduser.UserType = $.trim(affilatedusers[i].split("|")[0]);
                affilateduser.UserItemId = affilatedusers[i].split("|")[1];
                affilateduserArray.push(affilateduser);
            }
        }
        $.extend(params, { AffiliatedUsers: affilateduserArray });
    }

    //storytype

    var storyTypeAttributes;
    var storyTypeAttributesLength = 0;
    var userGroupIds = [];

    if ($(tileWrapper).attr('data-showusergroupcheckbox') && $(tileWrapper).attr('data-showusergroupcheckbox').length > 0 && $(tileWrapper).attr('data-showusergroupcheckbox') === "true") {
        storyTypeAttributes = $(tileWrapper).attr('data-storytypeattributeselected').split(",").clean('');
        if (storyTypeAttributes.length === 0) {
            storyTypeAttributes = $(tileWrapper).attr('data-storytypeattribute').split(",").clean('');
        }
        storyTypeAttributesLength = storyTypeAttributes.length;
        for (var i = 0; i < storyTypeAttributesLength; i++) {
            if ($.trim(storyTypeAttributes[i]).length > 0) {
                switch (storyTypeAttributes[i].split("|")[1]) {
                    case "28":
                        userGroupIds.push(1);
                        break;
                    case "26":
                        userGroupIds.push(2);
                        break;
                    case "27":
                        userGroupIds.push(3);
                        break;
                    case "29":
                        userGroupIds.push(8);
                        break;
                    case "30":
                        userGroupIds.push(7);
                        break;
                    default:
                }
            }
        }
        $.extend(params, { AssociatedUserGroups: userGroupIds });

    } else if ($(tileWrapper).attr('data-storytypeattribute') && $(tileWrapper).attr('data-storytypeattribute').length > 0) {
        storyTypeAttributes = $(tileWrapper).attr('data-storytypeattribute').split(",").clean('');
        storyTypeAttributesLength = storyTypeAttributes.length;
        for (var i = 0; i < storyTypeAttributesLength; i++) {
            if ($.trim(storyTypeAttributes[i]).length > 0) {
                switch (storyTypeAttributes[i].split("|")[1]) {
                    case "28":
                        userGroupIds.push(1);
                        break;
                    case "26":
                        userGroupIds.push(2);
                        break;
                    case "27":
                        userGroupIds.push(3);
                        break;
                    case "29":
                        userGroupIds.push(8);
                        break;
                    case "30":
                        userGroupIds.push(7);
                        break;
                    default:
                }
            }
        }
        $.extend(params, { AssociatedUserGroups: userGroupIds });
    }
    // Status


    if ($(tileWrapper).attr("data-formattype")) {
        if ($(tileWrapper).attr("data-formattype") === "mycontent" && $(tileWrapper).attr('data-publicview') === "false" && $(tileWrapper).attr("data-contentstatus")) {
            var itemStatusArray = [];
            var expired = false;
            if ($(tileWrapper).attr('data-itemstatus') && $(tileWrapper).attr('data-itemstatus').length > 0) {
                itemStatusArray = $(tileWrapper).attr('data-itemstatus').split(',');
                $.each(itemStatusArray, function (i, value) {
                    switch (value) {
                        case 'Active':
                            itemStatusArray[i] = 'Active';
                            break;
                        case 'Preliminary':
                            itemStatusArray[i] = 'Preliminary';
                            break;
                        case 'Draft':
                            itemStatusArray[i] = 'Draft';
                            break;
                        case 'InReview':
                            itemStatusArray[i] = 'InReview';
                            break;
                        case 'ReviewedNotApproved':
                            itemStatusArray[i] = 'ReviewedNotApproved';
                            break;
                        case 'Expired':
                            expired = true;;
                            break;
                        case 'Archived':
                            itemStatusArray[i] = 'Archived';
                            break;
                    }
                });

                if (expired) {
                    $.extend(params, { Readiness: "Expired" });
                }
                else {
                    $.extend(params, { ItemStatus: itemStatusArray });
                }

            }

        }
    }

    if ($('.tile-filter-availability-legend-container').data('filter-match-type') !== undefined)
        $.extend(params, { MatchType: $('.tile-filter-availability-legend-container').data('filter-match-type') });

    return params;
}

function massageJsonData(data, formattype, tiletype, publicView) {
    var jsonObject = data;
    if (tiletype === undefined) { tiletype = ''; }

    $.each(jsonObject, function (i, item) {

        //Object to hold Story Localizations text
        jsonObject[i].Story.Localizations = {};
        //Shorthand reference to localizations
        var localizations = jsonObject[i].Story.Localizations;

        if (formattype === 'mycontent' && !publicView) {
            jsonObject[i].Story = item.Story;
            jsonObject[i].Story.Url = "/Story/Content/Edit?token=" + jsonObject[i].Story.Token;
        } else if (formattype === 'related') {
            jsonObject[i].Story = jsonObject[i];
        }

        //find tile size
        //set the correct background image for the tile, if there is one
        //Not if a usertile

        if (formattype !== 'usertile') {
            var tileBGImageUrl = findImageUrlForType(jsonObject[i].Story.Images, 1);



            if (tiletype === 'narrow')
                tileBGImageUrl = findImageUrlForType(jsonObject[i].Story.Images, 2);

            if (formattype !== 'featured' && formattype !== 'recommended' && formattype !== 'mycontent' && tiletype !== 'narrow' && formattype !== "tilecontent") {
                if (i % 7 === 0 || (i % 7) - 6 === 0) {
                    jsonObject[i].tileTypeDouble = true;
                    tileBGImageUrl = findImageUrlForType(jsonObject[i].Story.Images, 2);
                }
            }

            if (formattype === undefined) { /* undefined indicates .tile-brick or view all layouts */

                if (jsonObject[i].tileTypeDouble) { /* if tileTypeDouble then double the amount of characters to display before adding an ellipsis */
                    jsonObject[i].Story.Title = ez.helpers.truncateString(jsonObject[i].Story.Title, 145, true);
                } else {
                    jsonObject[i].Story.Title = ez.helpers.truncateString(jsonObject[i].Story.Title, 62, true);
                }
            }

            if (formattype === "tilecontent") {
                tileBGImageUrl = findImageUrlForType(jsonObject[i].Story.Images, 2);

                jsonObject[i].Story.Title = ez.helpers.truncateString(jsonObject[i].Story.Title, 48, true);

                if (jsonObject[i].Story.Title.length <= 65) {
                    jsonObject[i].Story.Description = ez.helpers.truncateString(jsonObject[i].Story.Description, 80, true);
                } else {
                    jsonObject[i].Story.Description = "";
                }
            }

            if (formattype === 'mycontent' || formattype === 'myfavorite') {
                if ((i % 3) - 2 === 0) {
                    jsonObject[i].tileTypeDouble = true;
                    tileBGImageUrl = findImageUrlForType(jsonObject[i].Story.Images, 2);
                }
            }

            //encode BG Image URL & Set it
            if (tileBGImageUrl !== null) {
                if (tileBGImageUrl.indexOf(' ') > 0) {
                    jsonObject[i].tileBGImageUrl = encodeURI(tileBGImageUrl);
                } else {
                    jsonObject[i].tileBGImageUrl = tileBGImageUrl;
                }
            }
        }

        //if there isn't any qualifications, set as IsMet
        if (jsonObject[i].Qualification === null || jsonObject[i].Qualification === undefined) {
            jsonObject[i].Qualification = [];
            jsonObject[i].Qualification.IsMet = true;
        }

        if (jsonObject[i].Story.Type.toLowerCase() === 'course') {
            //set completion status

            if (jsonObject[i].CompletionStatus !== "NotApplicable") {
                jsonObject[i].HasCompletionStatus = true;
            }

            switch (jsonObject[i].CompletionStatus) {
                case 'Incomplete':
                    jsonObject[i].CompletionStatusIncomplete = true;
                    jsonObject[i].StatusProgress = storyLocalizations.SiteStrings.StatusProgress;
                    break;
                case 'Completed':
                    jsonObject[i].CompletionStatusCompleted = true;
                    jsonObject[i].StatusComplete = storyLocalizations.SiteStrings.StatusComplete;
                    break;
                case 'Failed':
                    jsonObject[i].CompletionStatusFailed = true;
                    jsonObject[i].StatusFail = storyLocalizations.SiteStrings.StatusFail;
                    break;
            }
        }

        //check if this is a usertile
        if (jsonObject[i].Story.Type === 'ProfileTile') {
            jsonObject[i].Story.IsUser = true;
        }

        //set tile data
        jsonObject[i].PointKey = storyLocalizations.SiteStrings.PointKey;
        jsonObject[i].ViewKey = storyLocalizations.SiteStrings.ViewKey;
        jsonObject[i].EventKey = storyLocalizations.SiteStrings.EventKey;
        jsonObject[i].MoreKey = storyLocalizations.SiteStrings.More.toUpperCase();

        jsonObject[i].TextAvailabilityMatch = storyLocalizations.FilterAvailability.TextAvailabilityMatch;
        jsonObject[i].TextAvailabilityFlexible = storyLocalizations.FilterAvailability.TextAvailabilityFlexible;
        jsonObject[i].TextAvailabilityPrivate = storyLocalizations.FilterAvailability.TextAvailabilityPrivate;
        jsonObject[i].TextRequestSession = storyLocalizations.FilterAvailability.TextRequestSession;

        jsonObject[i].ShowRequestSession = isRequestSession(jsonObject[i]);
        jsonObject[i].Story.UrlSession = ez.helpers.addOrUpdateParameter(jsonObject[i].Story.Url, "ShowSchedule", "true");

        localizations.BadgeAvailable = storyLocalizations.SiteStrings.BadgeAvailable;
        localizations.Points = storyLocalizations.SiteStrings.Points;

        localizations.AddToFavorites = storyLocalizations.SiteStrings.AddToFavorites;
        localizations.UpVote = storyLocalizations.SiteStrings.UpVote;
        localizations.Comment = storyLocalizations.SiteStrings.Comment;
        localizations.Share = storyLocalizations.SiteStrings.Share;


        //If adding points back, look at the history for 9/24/2015
        if (jsonObject[i].Story.Type === 'Event') {
            //always show event date
            jsonObject[i].ShowEventDate = true;
            jsonObject[i].Story.Date = moment(jsonObject[i].Story.Date).format(storyLocalizations.SiteStrings.DateFormat);
        } else {
            //show badges and points container if they exist
            jsonObject[i].ShowBadgesPointsContainer = (jsonObject[i].Story.HasBadge || jsonObject[i].Story.HasPoints);

            //always show views
            jsonObject[i].ShowViewCount = true;
        }

        //Tell user if they upvoted this story
        if (jsonObject[i].VoteByUser !== null
            && jsonObject[i].VoteByUser === 1) {
            jsonObject[i].Story.VoteClass = 'upvoted';
        }
    });
    return jsonObject;
}

function isRequestSession(jsonObject) {
    if (typeof FILTER_QUERYSTRING !== 'undefined' && typeof FILTER_QUERYSTRING.ScheduleAvailability !== 'undefined') {
        if (jsonObject.HasAvailabilityExact === true || jsonObject.HasAvailabilityFlexible === true || jsonObject.HasAvailabilityPrivate === true) {
            return true;
        }
    }
    return false;
}


function findImageUrlForType(images, type) {
    var imagesLength = images.length;
    if (imagesLength !== 0) {
        for (var i = 0; i < imagesLength; i += 1) {
            if (images[i].Type === type) {
                return images[i].Url;
            }
        }
    }
    return null;
}

function updateTiles(tileWrapper, templateId, jsonObject) {

    if ($("#story.workspace").length === 0) {
        if ($(".module[data-module-id=" + $(tileWrapper).attr("data-tilesname") + "]").attr("data-module-type") == null || $(".module[data-module-id=" + $(tileWrapper).attr("data-tilesname") + "]").attr("data-module-type").toLowerCase() != "globalfilter") {
            if (jsonObject.length === 0) {
                //Hide the TileContent Module if no results
                //Removes the TileContent Title and .home-loader
                $(".module[data-module-id=" + $(tileWrapper).attr("data-tilesname") + "]").hide();
                return;
            }
            else {
                //Show the TileContent Module if there are results 
                $(".module[data-module-id=" + $(tileWrapper).attr("data-tilesname") + "]").show();
            }
        }
    }

    var partials = {
        "tileSingleTpl": $(TILES_TEMPLATE).filter('#tileSingleTpl').html(),
        "tileNarrowSingleTpl": $(TILES_TEMPLATE).filter('#tileNarrowSingleTpl').html(),
        "tileUserSingleTpl": $(TILES_TEMPLATE).filter('#tileUserSingleTpl').html(),
        "tileSingleRelatedTpl": $(TILES_TEMPLATE).filter('#tileSingleRelatedTpl').html(),
        "tileContentRowTpl": $(TILES_TEMPLATE).filter('#tileContentRowTpl').html()
    };


    var tileLayoutTpl = Mustache.render($(TILES_TEMPLATE).filter(templateId).html(), { Tiles: jsonObject }, partials);
    if (templateId === '#tileFeatureLayoutTpl') {
        $(tileWrapper).html(tileLayoutTpl);
    } else {
        $(tileWrapper).append(tileLayoutTpl);
    }

    $(tileWrapper).find('[data-toggle="tooltip"]').tooltip();
    $(tileWrapper).find('[data-toggle="popover"]').popover({
        content: function () {
            var jsonObject = {
                Token: $(this).data('token'),
                FacebookLink: $(this).data('facebook-link'),
                TwitterLink: $(this).data('twitter-link'),
                LinkedInLink: $(this).data('linkedin-link'),
                EmailLink: $(this).data('email-link'),
                Text: storyLocalizations["hero"]
            }
            return Mustache.render($(TILES_TEMPLATE).filter('#tileShareTemplate').html(), jsonObject);
        },
        placement: 'top',
        html: true,
        container: 'body',
        trigger: "click focus"
    });
}


/* global isInitialViewModeDetermined:true, FILTER_TEMPLATE:true, FILTER_QUERYSTRING:true, story, storyLocalizations, bootbox, AllProductsText, AllTypesText, AllLatestText, AllCountryText, AllLanguageText, ApplyFiltersText, ClearFiltersText */

//These variables are truly global and therefore we don't want to put a VAR in front of them
isInitialViewModeDetermined = false;
FILTER_TEMPLATE = ""; //The global var that holds the filter template;
FILTER_QUERYSTRING = {}; //Pulled from the hash tag and syncs with it.
FILTERBAR_MODEL = []; //Global var that holds the current model data of the ".filter-bar" and is used to update the ".filter-applied-list-output"

COURSESTORYTYPEID = "1";
if (window.location.hash) {
    FILTER_QUERYSTRING = updateObjectFromQueryString(FILTER_QUERYSTRING, window.location.hash.split('#')[1]);
}

var EZ = EZ || {};
var FILTER_HAS_ASSOCIATED_TILES = false;
var DEFAULT_LANGUAGEID;
$(function () {
    if ($("#defaultlanguageId").val() !== "") {
        DEFAULT_LANGUAGEID = $("#defaultlanguageId").val();
    }

    getFilterTemplate();

    // story specific tracking
    $(document).on("OnStoryRenderComplete", function (event, modules) {
        initFilters();
    });

});

function initFilters() {
    //If there is a filter on the page since this is part of functions.js
    initFilterEvents();
    initFilterListeners();

    //set the default filter to a data attribute if the
    //filter is flagged to use the hash as the default

    //  if ($(".filter-bar").attr('data-type') && $(".filter-bar").attr('data-type').length > 0) {
    ///   FILTER_QUERYSTRING["PresetStoryTypes"] = $(".filter-bar").attr('data-type').split(',').clean('')
    //  }


    // if ($(".filter-bar").attr('data-category') && $(".filter-bar").attr('data-category').length > 0) {
    //    FILTER_QUERYSTRING["PresetTagCategories"] = $(".filter-bar").attr('data-category').split(',').clean('')
    // }

    // if ($(".filter-bar").attr('data-affilateduser') && $(".filter-bar").attr('data-affilateduser').length > 0) {
    //FILTER_QUERYSTRING["PresetAffiliatedUsers"] = $(".filter-bar").attr('data-affilateduser').split(',').clean('');
    // }



    if ($(".filter-bar").attr('data-defaultlanguage') && $(".filter-bar").attr('data-defaultlanguage').length > 0) {
        if (FILTER_QUERYSTRING["Languages"] == undefined || FILTER_QUERYSTRING["Languages"] == null) {
            FILTER_QUERYSTRING["Languages"] = $(".filter-bar").attr('data-defaultlanguage').split(',').clean('');
            $(".filter-bar").removeAttr('data-defaultlanguage');
        }
    }


    if ($(".filter-bar").attr('data-language') && $(".filter-bar").attr('data-language').length > 0) {
        if (FILTER_QUERYSTRING["Languages"] == undefined || FILTER_QUERYSTRING["Languages"] == null) {
            FILTER_QUERYSTRING["Languages"] = $(".filter-bar").attr('data-language').split(',').clean('');
            $(".filter-bar").removeAttr('data-language');
        }
    }


    if (FILTER_QUERYSTRING !== undefined && $('.filter-bar').attr('data-reverttohashonclear') === "true") {
        $('.filter-bar').attr('data-defaultsearch', encodeURIComponent(JSON.stringify(FILTER_QUERYSTRING)));
    }

    // if this is the user filter, we don't want filtering by availability yet
    if ($(".filter-bar").closest(".module").attr("data-module-type") === "UserFilter") {
        $(".filter-bar").attr("data-dontshow", "availability,");
    }


    if (FILTER_QUERYSTRING !== undefined && FILTER_QUERYSTRING["MatchType"] !== undefined) {
        var matchType = FILTER_QUERYSTRING["MatchType"];
        $('li[data-availability="' + matchType + '"]').addClass('is-active');
    }


    $.each($(".tile-wrapper"), function (index, item) {
        if ($(item).attr("data-tilesname") == $(".filter-bar").attr("data-assocatedtiles")) {
            FILTER_HAS_ASSOCIATED_TILES = true;
        }
    });

}

function initFilterListeners() {
    //filter events:
    // onFilterLoadComplete - on specific pages
    // onFilterChangeComplete - on specific pages, called by onFilterChangeg
    // onFilterClearComplete - on specific pages, trigger by clear
    // onPreFilterClearComplete - on specific pages, trigger before the clear is trigered
    // onFilterChange - in filter.js

    // Here you register for the event and do whatever you need to do.
    $(document).on('onFilterChange', function (event, params) {
        if (params.triggerType === undefined) {
            params.triggerType = 'filter';
        }


        // Only update the history with the hash value when you change the filters.
        // and remove when clearing
        if (params.triggerType === 'clear') {
            $(document).trigger("OnAnalyticsTrackingEvent",
                { Category: "ContentFilter", Action: "Clear", Label: null, Value: 1 });
            if ($(".filter-bar").attr("data-autogeneratetiles") === undefined)
                setAutoGenerateTile(true);
            else if ($(".filter-bar").attr("data-autogeneratetiles") != "true") {
                selectDisplayOptions($("#displayoverview"));
                setAutoGenerateTile(false);
                $(".module[data-module-type='TileContent']:not([data-triggeronfilterchange='false'])").show();
            }
            if (jQuery.isEmptyObject(FILTER_QUERYSTRING)) {
                history.pushState("", document.title, window.location.pathname + window.location.search);
            } else {
                history.pushState("",
                    document.title,
                    window.location.pathname +
                    window.location.search +
                    '#' +
                    encodeURIComponent(JSON.stringify(FILTER_QUERYSTRING)));
            }


            $(document).trigger('updateTiles'); // in tiles.js

        } else {
            // Clean up FILTER_QUERYSTRING, remove empty items
            if (!jQuery.isEmptyObject(FILTER_QUERYSTRING) && FILTER_QUERYSTRING !== '') {
                $.each(FILTER_QUERYSTRING,
                    function (item, value) {
                        if ((typeof value === 'object' && jQuery.isEmptyObject(value)) ||
                            (typeof value === 'string' && (value === '' || value === null || value === ','))) {
                            delete FILTER_QUERYSTRING[item];
                        } else if (typeof value === 'object' && item != "ScheduleAvailability") {
                            FILTER_QUERYSTRING[item] = FILTER_QUERYSTRING[item].clean('').sort().join(',');
                        }
                    });
            }
            if ((typeof FILTER_QUERYSTRING === 'object' && jQuery.isEmptyObject(FILTER_QUERYSTRING)) ||
                (typeof FILTER_QUERYSTRING === 'string' && FILTER_QUERYSTRING === '')) {
                FILTER_QUERYSTRING = {};
            }

            // if FILTER_QUERYSTRING is empty, remove the hashtag
            if (jQuery.isEmptyObject(FILTER_QUERYSTRING)) {
                history.pushState("", document.title, window.location.pathname + window.location.search);
            }
            else {
                //if (window.location.pathname.toLowerCase().indexOf("/seeall") < 0 && FILTER_QUERYSTRING["ScheduleAvailability"] != null) {
                //    var pathName = window.location.pathname;
                //    if (pathName != "/")
                //        pathName += "/";
                //    window.location.href = pathName + 'SeeAll' + window.location.search + '#' + encodeURIComponent(JSON.stringify(FILTER_QUERYSTRING));
                //    return;
                //}
                //else {
                history.pushState("",
                    document.title,
                    window.location.pathname +
                    window.location.search +
                    '#' +
                    encodeURIComponent(JSON.stringify(FILTER_QUERYSTRING)));
                //}
            }
        }

        if ($(".filter-bar").attr('data-autogeneratetiles') !== undefined && $(".filter-bar").attr('data-autogeneratetiles') === "true") {
            //Display Auto Generated tiles in brick view
            setAutoGenerateTile(true);
            getTiles($(".autogeneratetiles"), true);

        }
        else if ($(".filter-bar").attr('data-showbothdisplay') !== undefined && $(".filter-bar").attr('data-showbothdisplay') === "true") {

            //Logic to handle displaying Overview and View All Layouts
            if (jQuery.isEmptyObject(FILTER_QUERYSTRING)) {
                selectDisplayOptions($("#displayoverview"));
                setAutoGenerateTile(false);
                //Displays the TileContent Modules
                $(".module[data-module-type='TileContent']:not([data-triggeronfilterchange='false'])").show();
                $(document).trigger('updateTiles'); // in tiles.js

            } else {
                selectDisplayOptions($("#displayviewall"));
                setAutoGenerateTile(true);
                //Hides the TileContent Module
                $(".module[data-module-type='TileContent']:not([data-triggeronfilterchange='false'])").hide();
                getTiles($(".autogeneratetiles"), true);
            }

        }

        else {
            //Default to displaying tile rows

            setAutoGenerateTile(false);
            //Displays the TileContent Modules
            $(".module[data-module-type='TileContent']:not([data-triggeronfilterchange='false'])").show();
            $(document).trigger('updateTiles'); // in tiles.js
        }

        //Get the updated FILTERBAR_MODEL
        var jsonObject = getUpdatedFilterBarModel();

        //Update the list of user applied filters in the view
        updateAppliedFiltersList(jsonObject);

        //Update the FILTERBAR_MODEL model in JS with user changes
        setFilterBarModel(jsonObject);


        // external hook/callback when filter change is constructed
        $(document).trigger('onFilterChangeComplete');
    });

    $(document).on('onFilterLoadComplete', function (event, params) {
        $(".filter-bar #recurrence").change(function (event) {
            if ($(this).find("option:selected").val() !== "3") {
                $(this).closest(".filter-availability-menu").find(".day-of-week-group").addClass("hidden");
                $(this).closest(".filter-availability-menu").find(".day-of-week-group .day-of-week-parent").removeClass("active");
            }
            else {
                $(this).closest(".filter-availability-menu").find(".day-of-week-group").removeClass("hidden");
            }
        });

        var itemstatusfilter = $(".filter-bar").find(".filter-itemstatus")
        $(itemstatusfilter).hide();
        if ($(".filter-bar").attr("data-formattype")) {

            if ($(".filter-bar").attr("data-formattype") === "mycontent" && $(".filter-bar").attr('data-publicview') === "false") {
                $(itemstatusfilter).show();
            }
            else {
                $(itemstatusfilter).remove();
            }
        }
        else {
            $(itemstatusfilter).remove();
        }

    });

}

function getUpdatedFilterBarModel() {
    var jsonObject = {};
    var $filterBar = $('.filter-bar');
    var params = getFilterParams($filterBar);

    //Create a new FILTERBAR_MODEL with changes from the filter parameters
    jsonObject = massageFilterBarData({ Data: $.extend(true, {}, FILTERBAR_MODEL), Error: null }, $filterBar, JSON.parse(JSON.stringify(params)));

    return jsonObject;
}


function updateAppliedFiltersList(jsonObject) {
    var filterGroupTemplate = $(FILTER_TEMPLATE).filter('#filterAppliedTabsGroupTpl').html();
    var filterGroupHtml = Mustache.render(filterGroupTemplate, jsonObject);

    //Empty the container
    $('.filter-applied-list-output').empty();

    $('.filter-applied-list-output').html(filterGroupHtml);
};

function setAutoGenerateTile(isVisible) {
    $(".autogeneratetiles").attr("data-autoload", isVisible);
    $(".autogeneratetiles").attr("data-fetchdata", isVisible);
    $(".autogeneratetiles").attr("data-currentpage", "0");
    $(".autogeneratetiles").attr("data-take", "7");
    $("#selectedDisplayType").val(isVisible);
    $(".autogeneratetiles").empty();

    $(".tiles-viewmore-container").hide();

}
function selectDisplayOptions(link) {
    $(link).prop("checked", true);
    $(link).closest(".btn-group-link").find(".btn-link").removeClass("active");
    $(link).closest(".btn-link").addClass("active");
}

function getFilterGroupType(filterType) {
    switch (filterType.toLowerCase()) {
        case 'type':
            return 'StoryTypes';
        case 'category':
            return 'TagCategories';
        case 'country':
            return 'Countries';
        case 'language':
            return 'Languages';
        case 'latest':
            return 'CompletionStatuses';
        case 'availability':
            return 'Availability';
        case 'availabilitymatchtype':
            return 'MatchType';
        case 'itemstatus':
            return 'ItemStatus';
    }
    return filterType;
}

function initFilterEvents() {

    var backButtonClicked = false;

    window.onhashchange = function (event) {
        if (event.newURL.split('#')[1].match("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}") === null) {
            FILTER_QUERYSTRING = updateObjectFromQueryString(FILTER_QUERYSTRING, window.location.hash.split('#')[1]);
            $('.filter-bar').each(function () {
                getFilter($(this));
            });
            $(document).trigger('onFilterChange', { triggerType: (backButtonClicked) ? "clear" : null });
        }
        backButtonClicked = false;
    }

    window.onpopstate = function (event) {
        backButtonClicked = true;
    };

    $(document).on('change', '.displayResultOptions', function () { handleViewModeChange($(this)); });

    // TOGGLE FILTER MENU FOR DESKTOP
    $(document).on('click', '.filter-link', function (event) {
        event.preventDefault();
        event.stopPropagation();
        var filterType = $(this).data('filtertype');

        if (filterType === 'clear') {
            clearFilter();
        } else if (filterType === 'mobile') {
            $('.filter-mobile > .filter-mobile-container').show();
        } else {
            toggleFilterMenu(filterType, $(this));
        }
    });


    $(document).on('click', '.btn-filter:not(.filter-link)', function (event) {
        $('.filter-desktop').toggleClass('hidden');
        $('.btn-filter').toggleClass('open');
        //sessionStorage.setItem('filter-hidden', $('.filter-desktop').hasClass('hidden'));
    });

    // TOGGLE FILTER ITEM
    $(document).on('click', '.toggle-filter', function (event) {

        event.preventDefault();
        event.stopPropagation();

        var filterType = $(this).data('filtertype');
        var groupType = getFilterGroupType(filterType);

        if (!filterIsValid(this))
            return;


        //var categoryNumber = $(this).data('id').toString().charAt(0);
        var isAgeSelected = 0;
        var allAgesId = '4070';

        if (jQuery.isEmptyObject(FILTER_QUERYSTRING)) {
            FILTER_QUERYSTRING = {};
        }

        if (jQuery.isEmptyObject(FILTER_QUERYSTRING[groupType])) {
            FILTER_QUERYSTRING[groupType] = '';
        }

        var currentFilterData = FILTER_QUERYSTRING[groupType];

        if (!currentFilterData) {
            currentFilterData = '';
        } else {
            if (typeof currentFilterData !== 'object') {
                currentFilterData = currentFilterData.split(',').clean('')
            }
            currentFilterData = currentFilterData.clean('').sort().join(',') + ',';
        }

        if (groupType !== 'MatchType') {

            if ($(this).hasClass('filter-active')) {
                // Remove selection
                $(this).removeClass('filter-active');

                if (groupType === 'TagCategories') {
                    currentFilterData = currentFilterData.replace($(this).data('id') + ',', '').split(',').clean('').join(',') + ',';

                    //when selecting ages, always add in all ages (4070)
                    isAgeSelected = $(this).closest(".filter-items").find(".filter-agegroup-menu").find(".filter-active").length;
                    if (isAgeSelected === 0) {
                        currentFilterData = currentFilterData.replace(allAgesId + ',', '');
                    }

                }
                else if (groupType === 'ItemStatus') {
                    currentFilterData = currentFilterData.replace($(this).data('identifier') + ',', '').split(',').clean('').join(',') + ',';

                }
                else {
                    currentFilterData = currentFilterData.replace($(this).data('id') + ',', '');
                }
            } else {
                $(this).addClass('filter-active');

                if (groupType === 'TagCategories') {
                    currentFilterData = currentFilterData.split(',').clean('').join(',') + ',' + $(this).data('id') + ',';

                    isAgeSelected = $(this).closest(".filter-items").find(".filter-agegroup-menu").find(".filter-active").length;
                    if (isAgeSelected > 0
                        && $(this).closest(".filter-agegroup-menu").length > 0) {
                        currentFilterData = currentFilterData + allAgesId + ",";
                        $('.toggle-filter[data-id="' + allAgesId + '"]').addClass('filter-active');
                    }
                }
                else if (groupType === 'ItemStatus') {
                    currentFilterData = currentFilterData.split(',').clean('').join(',') + ',' + $(this).data('identifier') + ',';
                }
                else {
                    currentFilterData = currentFilterData + $(this).data('id') + ',';
                }
            }
        }

        if (groupType.toLowerCase() === "availability") {
            // ignore
            groupType = "ScheduleAvailability";
            currentFilterData = {};
            currentFilterData.DateStarting = $(this).closest(".filter-availability-menu").find(".filter-availability-schedule-start-date").val();
            currentFilterData.DateEnding = $(this).closest(".filter-availability-menu").find(".filter-availability-schedule-end-date").val();
            currentFilterData.StartTime = $(this).closest(".filter-availability-menu").find("#filter-availability-schedule-time-start option:selected").val();
            currentFilterData.EndTime = $(this).closest(".filter-availability-menu").find("#filter-availability-schedule-time-end option:selected").val();
            currentFilterData.Value = getCalculatedTimeValue($(this), parseInt(currentFilterData.StartTime), parseInt(currentFilterData.EndTime));
            currentFilterData.Recurrence = $(this).closest(".filter-availability-menu").find("#recurrence option:selected").val();
            currentFilterData.DayOfWeek = 0; // bitwise - indicates all days of the week
            if (currentFilterData.Recurrence == "3") {
                $(this).closest(".filter-availability-menu").find(".day-of-week-group .day-of-week-parent.active").each(function (index, item) {
                    currentFilterData.DayOfWeek += parseInt($(item).attr("value"));
                });
            } else {
                currentFilterData.DayOfWeek = 127;
            }

            //Default the MatchType to 'exact' when skype availability filter is first applied
            //After that refer to the users selection
            //if (FILTER_QUERYSTRING !== undefined && FILTER_QUERYSTRING["MatchType"] === undefined) {
            $('li[data-availability="exact"]').addClass('is-active');
            FILTER_QUERYSTRING['MatchType'] = 'exact';
            //}

            //Fallback to check for 'flexible' availability matches if no 'exact' matches found
            FILTER_QUERYSTRING['FallbackMatchType'] = 'flexible';
        }

        if (groupType === 'MatchType') {
            var matchType = $(this).attr('data-availability');

            $(this).closest('.tile-filter-availability-legend-container').find('.toggle-filter').removeClass('is-active');
            $(this).addClass('is-active');

            currentFilterData = matchType;

            //If the user selects a 'MatchType' the 'FallbackmatchType' should be deleted so the users choice is respected even if no results are returned
            delete FILTER_QUERYSTRING['FallbackMatchType'];
        }

        if (groupType === 'StoryTypes') {

            //If Community Contributors Id then check to see if Hide Community Contributors checkbox needs to be turned off.
            if ($(this).data('id') === 21) {
                $('.filter-checkboxes [data-type="hidecommunitycontributor"]').find('input').prop('checked', false);
                delete FILTER_QUERYSTRING.HideCommunityContributor;
            }
        }

        // Update the global array
        FILTER_QUERYSTRING[groupType] = currentFilterData;

        sendAnalyticsTrackingForStandardFilterChanges(groupType, $(this).data('id'));

        // close the filter menu and search
        // 'MatchType' exists outside of the '.filter-menu' so no need to call this function
        if (groupType !== 'MatchType') {
            toggleFilterMenu(filterType, $(this));
        }

        // Run the search
        $(document).trigger('onFilterChange', {});
    });



    // Clear availability filters
    $('.filter-bar').on('click', '.js-filter-availability-clear', function clearFilterAvailability(event) {
        event.preventDefault();
        event.stopPropagation();

        var groupType = 'ScheduleAvailability';
        var filterType = $(this).data('filtertype');
        var parentForm = $(this).closest('.form-filter-availability');

        ez.helpers.form.clearForm(parentForm);
        parentForm.find(".day-of-week-group").addClass("hidden");
        parentForm.find('.day-of-week-parent').removeClass('active');

        // Delete the "ScheduleAvailability" object from the FILTER_QUERYSTRING since it has been cleared
        delete FILTER_QUERYSTRING[groupType];

        if (FILTER_QUERYSTRING['SortOrder'] === 'Availability') {
            delete FILTER_QUERYSTRING['SortOrder'];
        }

        // Delete 'MatchType' since it is tied to the 'ScheduleAvailability' filter 
        delete FILTER_QUERYSTRING['MatchType'];
        //Delete 'FallbackMatchType' since it is tied to the 'ScheduleAvailability' filter 
        delete FILTER_QUERYSTRING['FallbackMatchType'];

        // Remove any 'is-active' classes for 'MatchType'
        $('.tile-filter-availability-legend-container').find('.toggle-filter').removeClass('is-active');
        //Hide the Availability icons since they should not display with the new results
        $(".tile-filter-availability-legend-hidden").hide();


        // close the filter menu and search
        toggleFilterMenu(filterType, $(this));

        // Run the search
        $(document).trigger('onFilterChange', {});

    });

    $('.filter-bar').on('click', '.js-date-picker-clear', function filterDatePickerClear(event) {
        var $datePicker = $(this).closest('.date-picker');
        $datePicker.data("DateTimePicker").date(null);
        $datePicker.find('.form-control').val('');
    });

    /* Duplicate code to what is in '.filter-bar .filter-content input' below
    $(document).on('change', '.filter-bar .filter-content-hidecommunitycontributor', function (event) {
        event.preventDefault();
        event.stopPropagation();

        var currentFilterData = {};

        if (!jQuery.isEmptyObject(FILTER_QUERYSTRING)) {
            currentFilterData = FILTER_QUERYSTRING;
        }

        if ($(this).is(":checked")) {
            currentFilterData.HideCommunityContributor = true;
            $(".filter-type .filter-type-menu").find(".list-filter-menu [data-id=21]").removeClass("filter-active");
        } else {
            delete currentFilterData.HideCommunityContributor;
        }

    });*/

    $(document).on('change', '.filter-bar .filter-content input', function (event) {
        event.preventDefault();
        event.stopPropagation();

        //The element that is delivering the event
        var $el = $(this);

        var currentFilterData = {};
        var filterType = $(this).closest('.filter-content').attr('data-type');

        if (!jQuery.isEmptyObject(FILTER_QUERYSTRING)) {
            currentFilterData = FILTER_QUERYSTRING;
        }


        if (filterType === 'hidecommunitycontributor') {
            if (this.checked) {
                currentFilterData.HideCommunityContributor = true;
                $(".filter-type .filter-type-menu").find(".list-filter-menu [data-id=21]").removeClass("filter-active");
                if (currentFilterData["StoryTypes"] !== undefined) {
                    currentFilterData["StoryTypes"] = currentFilterData["StoryTypes"].replace("21", "");
                }
            } else {
                delete currentFilterData.HideCommunityContributor;
            }
        }
        else if (filterType === 'favorite') {
            if (this.checked) {
                currentFilterData.FavoritesOnly = true;
            } else {
                delete currentFilterData.FavoritesOnly;
            }
        }
        else if (filterType === 'showbypopularity') {
            if (this.checked) {
                currentFilterData.ShowByPopularity = true;
            } else {
                delete currentFilterData.ShowByPopularity;
            }

        }
        else if (filterType === 'showbynew') {
            if (this.checked) {
                currentFilterData.ShowByNew = true;
            } else {
                delete currentFilterData.ShowByNew;
            }
        }
        else if (filterType === 'showbyfeatured') {
            if (this.checked) {
                currentFilterData.IsFeatured = true;
            } else {
                delete currentFilterData.IsFeatured;
            }

        }
        else if (filterType === 'showinprogress') {
            if (this.checked) {
                currentFilterData.ShowInProgress = true;
            } else {
                delete currentFilterData.ShowInProgress;
            }
        }
        else if (filterType === 'completed') {
            if (this.checked) {
                currentFilterData.ShowCompleted = true;
            } else {
                delete currentFilterData.ShowCompleted;
            }
        }
        else if (filterType === 'shownotstarted') {
            if (this.checked) {
                currentFilterData.ShowNotStarted = true;
            } else {
                delete currentFilterData.ShowNotStarted;
            }
        }


        else if (filterType === 'usergroup') {
            var storyTypeAttributeArray = "";

            if ($(".filter-content .StoryTypeAttrribute").is(":checked") === false) {
                storyTypeAttributeArray = $('.filter-bar').attr("data-storytypeattribute");
            } else {

                delete currentFilterData.ShowPartnerSelected;
                delete currentFilterData.ShowGuestSpeakerSelected;
                delete currentFilterData.ShowMysterySkypeSelected;
                delete currentFilterData.ShowTrainerSelected;
                delete currentFilterData.ShowMIEExpertSelected;

                $(".filter-content .StoryTypeAttrribute:checked").each(function () {
                    var storyTypeAttribute = {
                    };
                    storyTypeAttribute = {
                    };
                    storyTypeAttribute.StoryType = $(this).attr('data-parent').split("-")[1];
                    storyTypeAttribute.AttributeId = $(this).val();
                    if (storyTypeAttributeArray.length === 0) {
                        storyTypeAttributeArray = storyTypeAttribute.StoryType + "|" + storyTypeAttribute.AttributeId;
                    } else {
                        storyTypeAttributeArray += "," + storyTypeAttribute.StoryType + "|" + storyTypeAttribute.AttributeId;
                    }

                    switch (storyTypeAttribute.AttributeId) {
                        case "28":
                            currentFilterData.ShowPartnerSelected = true;
                            break;
                        case "26":
                            currentFilterData.ShowGuestSpeakerSelected = true;
                            break;
                        case "27":
                            currentFilterData.ShowMysterySkypeSelected = true;
                            break;
                        case "29":
                            currentFilterData.ShowTrainerSelected = true;
                            break;
                        case "30":
                            currentFilterData.ShowMIEExpertSelected = true;
                            break;
                        default:
                    }
                });
            }

            if (storyTypeAttributeArray !== null && storyTypeAttributeArray !== undefined && storyTypeAttributeArray.length > 0) {
                currentFilterData.storyTypeAttributeArray = storyTypeAttributeArray;
            } else {
                delete currentFilterData.storyTypeAttributeArray;
            }
        }

        FILTER_QUERYSTRING = currentFilterData;

        hideMobileFilter($el);

        $(document).trigger('onFilterChange', {});
    });

    $(document).click(function (e) {
        if (!$(e.target).closest(".filter-bar").hasClass('filter-bar')) {
            toggleFilterMenu('', $(this));
        }
    });

    /**
     * Close mobile filter bar if click elsewhere when open
     */
    $(document.body).on('click', function (e) {
        var $target = $(e.target);
        var $container = $('.filter-mobile > .filter-mobile-container');

        if (!$container.is(':visible')) {
            return;
        }

        if ($target.closest('.filter-mobile-container').length === 0) {
            $container.hide();
        }
    });

    $(document.body).on('click', '.filter-close', function (event) {
        //The element that is delivering the event
        var $el = $(this);
        hideMobileFilter($el);
    });
}

function handleViewModeChange(radioButton) {
    if (radioButton.val() === "viewall") {
        setAutoGenerateTile(true);
        //Hides the TileContent Module
        $(".module[data-module-type='TileContent']:not([data-triggeronfilterchange='false'])").hide();
        getTiles($(".autogeneratetiles"), true);
    }
    else {
        // Hide the tile-filter-availability-legend-hidden element when displaying tile rows
        $(".tile-filter-availability-legend-hidden").hide();
        setAutoGenerateTile(false);
        //Displays the TileContent Module
        $(".module[data-module-type='TileContent']:not([data-triggeronfilterchange='false'])").show();
        $(document).trigger('updateTiles'); // in tiles.js
    }
}

function sendAnalyticsTrackingForStandardFilterChanges(groupType, selectedValue) {
    try {

        if (groupType === "ScheduleAvailability") {
            selectedValue = "Search";
        }

        if (selectedValue !== undefined && selectedValue !== null && selectedValue.toString().length > 0) {
            var actionValue = groupType + "_" + selectedValue.toString();
            $(document).trigger("OnAnalyticsTrackingEvent", { Category: "ContentFilter", Action: groupType, Label: selectedValue, Value: 1 });
        }

    } catch (e) {
        // ignore error
    }
}

function toggleFilterMenu(filterType, element) {
    var menu = $('.filter-bar .filter-' + filterType + '-menu');

    //The element that is delivering the event
    var $el = element;

    $('.filter-menu').not(menu).hide();

    if ($(element).parents(".filter-mobile-container") && $(menu).length == 0) {
        menu = $(element).parents(".filter-mobile-container");
    }

    $('.filter-link:not([data-filtertype = "' + filterType + '"]) .ezicon').closest('li').removeClass('active');

    if (menu.is(':visible')) {
        menu.hide();

        hideMobileFilter($el);

        $('.filter-link[data-filtertype = "' + filterType + '"] .ezicon').closest('li').removeClass('active');
    } else {
        menu.show();
        $('.filter-link[data-filtertype = "' + filterType + '"] .ezicon').closest('li').addClass('active');
    }
}

function hideMobileFilter($el) {
    if ($el.closest('.filter-mobile-container')) {
        $('.filter-mobile-container').hide();
    }
}

function clearFilter(runTriggers) {
    if (runTriggers !== false) {
        runTriggers = true;
    }

    if ($('.filter-bar').attr('data-defaultsearch') !== undefined && $('.filter-bar').attr('data-defaultsearch') !== '') {
        FILTER_QUERYSTRING = JSON.parse(decodeURIComponent($('.filter-bar').attr('data-defaultsearch')));
    } else {
        // clear out the querystring
        FILTER_QUERYSTRING = {};
    }

    //clear out the filter bar and generate a new one
    $(document).trigger('onPreFilterClearComplete', {});

    // Remove any 'is-active' classes for 'MatchType'
    $('.tile-filter-availability-legend-container').find('.toggle-filter').removeClass('is-active');
    //Hide the Availability icons since they should not display with the new results
    $(".tile-filter-availability-legend-hidden").hide();

    getFilter($('.filter-bar'));

    if (runTriggers) {
        $(document).trigger('onFilterClearComplete', {});
        $(document).trigger('onFilterChange', { triggerType: 'clear' });
    }
}

// load the filter tempates in FILTER_TEMPLATE
// only if it hasn't been loaded already
function getFilterTemplate() {

    if (FILTER_TEMPLATE.length === 0) {
        //hard code the cache string to the date of the release
        $.ajaxSetup({ cache: true });
        var deferred = $.get("/assets/templates/expertzone/filter.html", { "_": $.now() }, function (template) {
            FILTER_TEMPLATE = template;
        });
        $.ajaxSetup({ cache: false });
        return deferred;
    }
    return FILTER_TEMPLATE;
}

function getFilter(filterBar) {
    var url = '/Story/API/Breakdown';
    var params = getFilterParams(filterBar);

    if ($(filterBar).attr("data-formattype") && $(filterBar).attr("data-formattype") === "mycontent" && $(filterBar).attr('data-publicview') === "false") {
        url = '/Story/API/BreakDownUser';
        $.extend(params, {
            ReturnAllRecords: true
        });
    }

    if ($(filterBar).attr("data-formattype") && ($(filterBar).attr("data-formattype") === "mycontent" || $(filterBar).attr("data-formattype") === "myfavorite")) {
        $.extend(params, {
            ContentLanguageId: null
        });
        $.extend(params, {
            IsMaster: false
        });
        $.extend(params, {
            IsFeatured: false
        });
        $.extend(params, {
            IsBannered: false
        });

    } else {
        $.extend(params, {
            Readiness: "Live"
        });
    }

    if (!EZ.filters) {
        $.ajax({
            url: url,
            data: JSON.parse(JSON.stringify(params)),
            type: "POST",
            cache: false,
            success: function (data) {
                if (data.Error !== null) {
                    bootbox.alert(data.Error);
                    return false;
                } else {
                    var jsonObject = massageFilterBarData(data, filterBar, JSON.parse(JSON.stringify(params)));

                    renderFilterbar(jsonObject, filterBar, JSON.parse(JSON.stringify(params)));

                    //Update the list of user applied filters in the view
                    updateAppliedFiltersList(jsonObject);

                    setFilterBarModel(jsonObject);
                }
            }
        }).done(function () {
            if ($(filterBar).attr('data-dontshow') && $(filterBar).attr('data-dontshow').length > 0) {
                var dontshow = $(filterBar).attr('data-dontshow').split(',');
                $.each(dontshow, function (i) {
                    $('.filter-' + dontshow[i]).remove();
                });
            }
            //If you have a "show completed" checkbox, you shouldn't be able to filter by the status
            if ($(filterBar).attr('data-showcompletedcheckbox') && $(filterBar).attr('data-showcompletedcheckbox').length > 0 && ($(filterBar).data('showcompletedcheckbox') === "true" || $(filterBar).data('showcompletedcheckbox') === true)) {
                $('.filter-status').remove();
            }
        });
    } else {
        var jsonObject = massageFilterBarData({ Data: $.extend(true, {}, EZ.filters), Error: null }, filterBar, params);

        renderFilterbar(jsonObject, filterBar, params);

        //Update the list of user applied filters in the view
        updateAppliedFiltersList(jsonObject);

        setFilterBarModel(jsonObject);
    }
}

//JSON object returned from massageFilterBarData is used by the mustache template for the view
//This data is not sent to the Story/API endpoint or used in the address bar for the FILTER_QUERYSTRING
function massageFilterBarData(data, filterBar, params) {

    var jsonObject = data.Data;

    //Text
    jsonObject.FilterTitle = filterBar.attr('data-text-filtertitle');
    jsonObject.FilterString = filterBar.attr('data-text-filterstring');
    jsonObject.ClearFilters = filterBar.attr('data-text-clearfilters');


    jsonObject.ProductsText = AllProductsText; //Assigned in the _layout.cshtml
    jsonObject.TypeText = AllTypesText; //Assigned in the _layout.cshtml
    jsonObject.LatestText = AllLatestText; //Assigned in the _layout.cshtml
    jsonObject.CountryText = AllCountryText;
    jsonObject.LanguageText = AllLanguageText;
    jsonObject.ApplyFiltersText = ApplyFiltersText;
    jsonObject.ClearFiltersText = ClearFiltersText;
    jsonObject.DisplayResultOverview = DisplayResultOverview;
    jsonObject.DisplayResultViewAll = DisplayResultViewAll;

    //Object to hold Localizations text
    jsonObject.Localizations = filterLocalizations;

    jsonObject.ShowAppliedFilters = false;

    jsonObject.TextInstructions = storyLocalizations.FilterAvailability.TextInstructions;
    jsonObject.LabelDate = storyLocalizations.FilterAvailability.LabelDate;
    jsonObject.LabelTime = storyLocalizations.FilterAvailability.LabelTime;
    jsonObject.LabelRecurrence = storyLocalizations.FilterAvailability.LabelRecurrence;
    jsonObject.LabelRecurrenceHelpText = storyLocalizations.FilterAvailability.LabelRecurrenceHelpText;
    jsonObject.TabAvailability = storyLocalizations.FilterAvailability.TabAvailability;
    jsonObject.ButtonFilter = storyLocalizations.FilterAvailability.ButtonFilter;
    jsonObject.ButtonClear = storyLocalizations.FilterAvailability.ButtonClear;

    jsonObject.SelectOptionStart = storyLocalizations.FilterAvailability.SelectOptionStart;
    jsonObject.SelectOptionEnd = storyLocalizations.FilterAvailability.SelectOptionEnd;
    jsonObject.SelectOptionSelect = storyLocalizations.FilterAvailability.SelectOptionSelect;
    jsonObject.SelectOptionDoesNotRepeat = storyLocalizations.FilterAvailability.SelectOptionDoesNotRepeat;
    jsonObject.SelectOptionWeekly = storyLocalizations.FilterAvailability.SelectOptionWeekly;
    jsonObject.LabelOn = storyLocalizations.FilterAvailability.LabelOn;

    jsonObject.IsScheduleAvailabilitySet = false;
    jsonObject.IsAdditionalFiltersSet = false;

    if (params.ScheduleAvailability !== undefined && params.ScheduleAvailability != null) {
        jsonObject.IsScheduleAvailabilitySet = true;
        jsonObject.ShowAppliedFilters = true;
        jsonObject.ScheduleAvailability = params.ScheduleAvailability;
    }

    // Add new content button
    var userGeneratedCategory = parseInt(filterBar.attr('data-nav-category'));
    if (userGeneratedCategory == 403 || userGeneratedCategory == 404 || userGeneratedCategory == 405 || userGeneratedCategory == 502 || userGeneratedCategory == 503) {
        processAdd(jsonObject, filterBar);
    }



    //Check if checkbox should be shown
    if (filterBar.attr('data-showoverview') === "true" && filterBar.attr('data-showoverview') == "true") {
        jsonObject.ShowDisplayOptions = true;

    }

    jsonObject.HideCommunityContributorText = HideCommunityContributorText;
    jsonObject.ShowCommunityContributorCheckbox = false;

    if (filterBar.attr('data-showcommunitycontributorcheckbox') === undefined || filterBar.attr('data-showcommunitycontributorcheckbox') === "false") {
        jsonObject.ShowCommunityContributorCheckbox = true;
    }


    if (filterBar.attr('data-hidecommunitycontributor') === "true"
       || FILTER_QUERYSTRING !== undefined && (FILTER_QUERYSTRING.HideCommunityContributor !== undefined && FILTER_QUERYSTRING.HideCommunityContributor === true)) {
        jsonObject.HideCommunityContributor = true;
        jsonObject.IsAdditionalFiltersSet = true;
    } else {
        jsonObject.HideCommunityContributor = false;
    }


    if (filterBar.attr('data-showfavoritecheckbox') === "true") {
        jsonObject.ShowFavoritesOnlyText = ShowFavoritesOnlyText;
        jsonObject.ShowFavoriteCheckbox = true;
    }

    if (filterBar.attr('data-showfavorite') === "true"
        || (FILTER_QUERYSTRING !== undefined && FILTER_QUERYSTRING.FavoritesOnly !== undefined && FILTER_QUERYSTRING.FavoritesOnly === true)) {
        jsonObject.ShowFavorite = true;
        jsonObject.IsAdditionalFiltersSet = true;
    } else {
        jsonObject.ShowFavorite = false;
    }

    if (filterBar.attr('data-showbyfeaturedcheckbox') === "true") {
        jsonObject.ShowByFeaturedText = ShowByFeaturedText;
        jsonObject.ShowByFeaturedCheckbox = true;
    }

    if (filterBar.attr('data-showbyfeatured') === "true" ||
        (FILTER_QUERYSTRING !== undefined && FILTER_QUERYSTRING.IsFeatured !== undefined && FILTER_QUERYSTRING.IsFeatured === true)) {
        jsonObject.ShowByFeatured = true;
        jsonObject.IsAdditionalFiltersSet = true;
    } else {
        jsonObject.ShowByFeatured = false;
    }

    if (filterBar.attr('data-showbynewcheckbox') === "true") {
        jsonObject.ShowByNewText = ShowByNewText;
        jsonObject.ShowByNewCheckbox = true;
    }

    if (filterBar.attr('data-showbynew') === "true" ||
        (FILTER_QUERYSTRING !== undefined && FILTER_QUERYSTRING.ShowByNew !== undefined && FILTER_QUERYSTRING.ShowByNew === true)) {
        jsonObject.ShowByNew = true;
        jsonObject.IsAdditionalFiltersSet = true;
    } else {
        jsonObject.ShowByNew = false;
    }

    if (filterBar.attr('data-showbypopularitycheckbox') === "true") {
        jsonObject.ShowByPopularityText = ShowByPopularityText;
        jsonObject.ShowByPopularityCheckbox = true;
    }

    if (filterBar.attr('data-showbypopularity') === "true" ||
    (FILTER_QUERYSTRING !== undefined && FILTER_QUERYSTRING.ShowByPopularity !== undefined && FILTER_QUERYSTRING.ShowByPopularity === true)) {
        jsonObject.ShowByPopularity = true;
        jsonObject.IsAdditionalFiltersSet = true;
    } else {
        jsonObject.ShowByPopularity = false;
    }

    if (filterBar.attr('data-showinprogresscheckbox') === "true") {
        jsonObject.ShowInProgressText = ShowInProgressText;
        jsonObject.ShowInProgressCheckbox = true;
    }

    if (filterBar.attr('data-showinprogress') === "true" ||
        (FILTER_QUERYSTRING !== undefined && FILTER_QUERYSTRING.ShowInProgress !== undefined && FILTER_QUERYSTRING.ShowInProgress === true)) {
        jsonObject.ShowInProgress = true;
        jsonObject.IsAdditionalFiltersSet = true;
    } else {
        jsonObject.ShowInProgress = false;
    }

    if (filterBar.attr('data-showcompletedcheckbox') === "true") {
        jsonObject.ShowCompletedText = ShowCompletedText;
        jsonObject.ShowCompletedCheckbox = true;
    }

    //TODO: Consider refactoring. data-showcompleted is not on the filterBar so this comparison never returns true: filterBar.attr('data-showcompleted') === "true"
    if (filterBar.attr('data-showcompleted') === "true"
        || (FILTER_QUERYSTRING !== undefined && FILTER_QUERYSTRING.ShowCompleted !== undefined && FILTER_QUERYSTRING.ShowCompleted === true)) {
        jsonObject.ShowCompleted = true;
        jsonObject.IsAdditionalFiltersSet = true;
    } else {
        jsonObject.ShowCompleted = false;
    }

    if (filterBar.attr('data-shownotstartedcheckbox') === "true") {
        jsonObject.ShowNotStartedText = ShowNotStartedText;
        jsonObject.ShowNotStartedCheckbox = true;
    }
    if (filterBar.attr('data-shownotstarted') === "true"
        || FILTER_QUERYSTRING !== undefined && (FILTER_QUERYSTRING.ShowNotStarted !== undefined && FILTER_QUERYSTRING.ShowNotStarted === true)) {
        jsonObject.ShowNotStarted = true;
        jsonObject.IsAdditionalFiltersSet = true;
    } else {
        jsonObject.ShowNotStarted = false;
    }




    if (filterBar.attr('data-showusergroupcheckbox') === "true") {
        jsonObject.ShowUserGroupCheckbox = true;
    }
    if (filterBar.attr('data-showusergroup') === "true") {
        jsonObject.ShowUserGroup = true;
    }

    if (filterBar.attr('data-showbothdisplay') === "true") {
        jsonObject.ShowBothDisplay = true;
        filterBar.closest('.story-globalfilter').addClass('show-both-display-container');
    }





    if (filterBar.attr('data-background-color')) {
        //Set background color of 'filter-desktop' to same color as 'story-globalfilter'
        var backgroundColorName = filterBar.attr('data-background-color');
        if (backgroundColorName === 'background-none') {
            jsonObject.BackgroundColor = 'background-page-content';
        } else {
            jsonObject.BackgroundColor = filterBar.attr('data-background-color');
        }
    }

    if (filterBar.attr('data-showusergroupcheckbox') && filterBar.attr('data-showusergroupcheckbox').length > 0 && filterBar.attr('data-showusergroupcheckbox') === "true") {
        var storyTypeAttributes = filterBar.attr('data-storytypeattributeselected').split(",").clean('');

        if (storyTypeAttributes.length == 0 && FILTER_QUERYSTRING !== undefined && FILTER_QUERYSTRING.StoryTypeAttributes !== undefined) {
            storyTypeAttributes = FILTER_QUERYSTRING.StoryTypeAttributes;
        }

        var storyTypeAttributesLength = storyTypeAttributes.length;

        for (var i = 0; i < storyTypeAttributesLength; i++) {
            if ($.trim(storyTypeAttributes[i]).length > 0) {
                switch (storyTypeAttributes[i].split("|")[1]) {
                    case "28":
                        jsonObject.ShowPartnerSelected = true;
                        break;
                    case "26":
                        jsonObject.ShowGuestSpeakerSelected = true;
                        break;
                    case "27":
                        jsonObject.ShowMysterySkypeSelected = true;
                        break;
                    case "29":
                        jsonObject.ShowTrainerSelected = true;
                        break;
                    case "30":
                        jsonObject.ShowMIEExpertSelected = true;
                        break;
                    default:
                }
            }
        }
    }

    if (filterBar.attr("data-storytypeattribute") !== null && filterBar.attr("data-storytypeattribute") !== undefined && filterBar.attr("data-storytypeattribute") !== "") {
        var storytypeattribute = filterBar.attr("data-storytypeattribute");
        if (storytypeattribute !== "") {

            var attributes = storytypeattribute.split(',').clean('');

            if (attributes !== null && attributes.length > 1) {
                for (var i = 0; i < attributes.length; i++) {
                    var attributeId = attributes[i].split('|')[1];
                    switch (attributeId) {
                        case "28":
                            jsonObject.ShowPartner = true;
                            break;
                        case "26":
                            jsonObject.ShowGuestSpeaker = true;
                            break;
                        case "27":
                            jsonObject.ShowMysterySkype = true;
                            break;
                        case "29":
                            jsonObject.ShowTrainer = true;
                            break;
                        case "30":
                            jsonObject.ShowMIEExpert = true;
                            break;
                        default:
                    }
                }
            }
        }
    }

    // GroupFilterType - this was added so that when they select any of the tags (subject, age and any other) 
    // it adds it to the data-category attribute of the filter bar

    for (var i = 0; i < jsonObject.Children.length; i++) {

        var valuei = jsonObject.Children[i];
        var type = valuei.Type.toLowerCase().replace(/ /g, "");

        if (type !== null) {
            valuei.FilterType = type;

            //Check to load the filter availability template
            if (type === 'availability') {
                valuei.isAvailabilityFilter = true;
            }

            valuei.GroupFilterType = type;

            switch (type) {
                case 'type':
                    if (!EZ.filters) {
                        valuei.Title = AllTypesText;
                    }
                    break;
                case 'status':
                    if (!EZ.filters) {
                        valuei.Title = AllLatestText;
                    }
                    break;
                case 'language':
                    valuei.GroupFilterType = 'language';
                    break;

                case 'agegroup':
                case 'subject':
                case 'britishcouncilsubject':
                case 'skillsdevelopment':
                case 'campaign':
                case 'products':
                    valuei.GroupFilterType = 'category';
                    break;
            }
        } else {
            valuei.FilterType = 'category';
            valuei.GroupFilterType = "category";
        }

        if (valuei) {
            var currentFilterType;
            var currentFilterTypeSelection;
            var defaultFilterTypeSelection;
            var groupType;

            valuei.hasSubmenuChildren = false;
            valuei.hasSelectedChildren = false;

            for (var j = 0; j < valuei.Children.length; j++) {

                var valuej = valuei.Children[j];

                //Check if "list-filter-menu" has children in order to set number of columns
                var hasChildren = valuej.Children.length;
                if (hasChildren) {
                    valuei.hasSubmenuChildren = true;
                }

                if (currentFilterType !== valuei.GroupFilterType) {
                    currentFilterType = valuei.GroupFilterType;

                    groupType = getFilterGroupType(currentFilterType);
                    if (filterBar.attr('data-' + currentFilterType) !== undefined) {
                        defaultFilterTypeSelection = filterBar.attr('data-' + currentFilterType).split(',').clean('').sort().join(',') + ',';
                    }

                    if (groupType !== undefined
                        && FILTER_QUERYSTRING !== undefined
                        && FILTER_QUERYSTRING[groupType] !== undefined) {
                        currentFilterTypeSelection = FILTER_QUERYSTRING[groupType];
                        if (typeof currentFilterTypeSelection !== 'object') {
                            currentFilterTypeSelection = currentFilterTypeSelection.split(',');
                        }
                        currentFilterTypeSelection = currentFilterTypeSelection.clean('').sort().join(',') + ',';
                    } else {
                        currentFilterTypeSelection = '';
                    }
                }


                var defaultSelection = true;
                //Check if the user has made changes to the hash which indicates the filter is no longer pristine, if so don't use the default selection anymore
                if (window.location.hash) {
                    defaultSelection = false;
                }

                //if (defaultFilterTypeSelection === currentFilterTypeSelection) {
                //    defaultSelection = true;
                //}

                if (type == "itemstatus") {
                    valuej.Selected = false;
                    if ((',' + currentFilterTypeSelection).indexOf(',' + valuej.Identifier + ',') > -1
                        && !defaultSelection) {
                        valuej.Selected = true;
                        valuei.hasSelectedChildren = true;
                        jsonObject.ShowAppliedFilters = true;

                    }

                    for (var k = 0; k < valuej.Children.length; k++) {
                        var valuek = valuej.Children[k];

                        valuek.Selected = false;
                        if ((',' + currentFilterTypeSelection).indexOf(',' + valuek.Identifier + ',') > -1) {
                            valuek.Selected = true;
                            valuei.hasSelectedChildren = true;
                            jsonObject.ShowAppliedFilters = true;

                        }
                    };
                }
                else {
                    valuej.Selected = false;

                    if ((',' + currentFilterTypeSelection).indexOf(',' + valuej.Id + ',') > -1
                        && !defaultSelection) {
                        valuej.Selected = true;
                        valuei.hasSelectedChildren = true;
                        jsonObject.ShowAppliedFilters = true;
                    }

                    for (var k = 0; k < valuej.Children.length; k++) {
                        var valuek = valuej.Children[k];

                        valuek.Selected = false;
                        if ((',' + currentFilterTypeSelection).indexOf(',' + valuek.Id + ',') > -1) {
                            valuek.Selected = true;
                            valuei.hasSelectedChildren = true;
                            jsonObject.ShowAppliedFilters = true;
                        }
                    };
                }
            };
        }
    };

    return jsonObject;
}


function setFilterBarModel(jsonObject) {
    FILTERBAR_MODEL = jsonObject;
}

function renderFilterbar(jsonObject, filterBar, params) {

    var partials = {
        "filterAvailabilityTpl": $(FILTER_TEMPLATE).filter('#filterAvailabilityTpl').html(),
        "displayResultOptionsTpl": $(FILTER_TEMPLATE).filter('#displayResultOptionsTpl').html(),
    };

    //Filter Bar
    var filterBarTpl = Mustache.render($(FILTER_TEMPLATE).filter('#filterBarTpl').html(), jsonObject, partials);
    filterBar.html(filterBarTpl);

    bindAvailabilityControls(jsonObject);

    $(filterBar).find('.list-filter-sub-menu').each(function () {
        if ($.trim($(this).html()) === '') {
            $(this).remove();
        };
    });

    if (sessionStorage.getItem('filter-hidden') !== null && sessionStorage.getItem('filter-hidden') !== 'true') {
        $('.filter-desktop').removeClass('hidden');
        $('.btn-filter').addClass('open');
    }

    // external hook/callback when filter is constructed
    $(document).trigger('onFilterLoadComplete', { param1: params, data: jsonObject });


    //Initialize Popovers once filter menu is loaded
    $(".filter-bar").find('[data-toggle="popover"]').popover({
        container: 'body'
    });
}

function bindDatepickers() {

    var dNext = new Date();
    dNext.setMonth(dNext.getMonth() + 6);
    dNext.setDate(dNext.getDate() + 1);

    $(".js-datetimepicker-start, .js-datetimepicker-end").datetimepicker({
        format: dateFormat,
        minDate: new Date(),
        maxDate: dNext,
        useCurrent: false,
        locale: calculatedUserLocale,
        ignoreReadonly: true
    });

    //Link datepickers together to prevent end dates from being older than start dates
    //Also sets the end date calendar month to same month selected in start date
    $(".filter-desktop .js-datetimepicker-start").on("dp.change", function (e) {
        $(".filter-desktop .js-datetimepicker-end").data("DateTimePicker").minDate(e.date);
    });
    $(".filter-desktop .js-datetimepicker-end").on("dp.change", function (e) {
        $(".filter-desktop .js-datetimepicker-start").data("DateTimePicker").maxDate(e.date);
    });
    $(".filter-mobile .js-datetimepicker-start").on("dp.change", function (e) {
        $(".filter-mobile .js-datetimepicker-end").data("DateTimePicker").minDate(e.date);
    });
    $(".filter-mobile .js-datetimepicker-end").on("dp.change", function (e) {
        $(".filter-mobile .js-datetimepicker-start").data("DateTimePicker").maxDate(e.date);
    });
}

function bindAvailabilityControls(filterData) {
    //Bind DatePicker after availability datepicker fields created
    bindDatepickers();

    if (filterData.ScheduleAvailability !== undefined && filterData.ScheduleAvailability !== null) {
        $(".filter-bar #filter-availability-schedule-time-start").val(filterData.ScheduleAvailability.StartTime);
        $(".filter-bar #filter-availability-schedule-time-end").val(filterData.ScheduleAvailability.EndTime);
        $(".filter-bar #recurrence").val(filterData.ScheduleAvailability.Recurrence);
        if (filterData.ScheduleAvailability.Recurrence === "3") {
            $(".filter-bar .day-of-week-group").removeClass("hidden");
            $(".filter-bar .day-of-week-group .day-of-week-parent").each(function (index, item) {
                var value = parseInt($(item).attr("value"));
                if (parseInt(value & filterData.ScheduleAvailability.DayOfWeek) != 0) {
                    $(this).addClass("active");
                }
            });
        }

    }

}

function processAdd(jsonObject, filterBar) {

    if (typeof story !== 'undefined' && story !== undefined) {
        if (story.IsAuthenticationRequired !== undefined && !story.IsAuthenticationRequired) {
            return;
        }
    }

    if ($(filterBar).attr('data-show-add') === "true") {
        jsonObject.ShowAdd = true;
        jsonObject.CreateButtonText = storyLocalizations.SiteStrings.CreateButton;
    }

    var typestoAdd = [];
    var typeToAdd = {};
    var title = "";
    var url = "";

    var topnavcategory = parseInt($(filterBar).attr('data-nav-category'));

    switch (topnavcategory) {
        case 502:
            title = "Lesson Plan";
            url = String.format("/Story/Content/Create?type={0}&categoryid={1}", "Lesson", 502);
            createStoryTypeButton(typestoAdd, typeToAdd, storyLocalizations.SiteStrings.Lesson, url);
            break;

        case 503:
            title = "Video Tutorial";
            url = String.format("/Story/Content/Create?type={0}&categoryid={1}", "Tutorial", 503);
            createStoryTypeButton(typestoAdd, typeToAdd, storyLocalizations.SiteStrings.Tutorial, url);
            break;

        case 403:
            title = "Skype Lesson";
            url = String.format("/Story/Content/Create?type={0}&categoryid={1}", "SkypeLesson", 403);
            createStoryTypeButton(typestoAdd, typeToAdd, storyLocalizations.SiteStrings.SkypeLesson, url);
            break;

        case 404:
            title = "Skype Collaboration";
            url = String.format("/Story/Content/Create?type={0}&categoryid={1}", "SkypeCollaboration", 404);
            createStoryTypeButton(typestoAdd, typeToAdd, storyLocalizations.SiteStrings.SkypeCollaboration, url);
            break;

        case 405:
            title = "Virtual Field Trip";
            url = String.format("/Story/Content/Create?type={0}&categoryid={1}", "VirtualFieldTrip", 405);
            createStoryTypeButton(typestoAdd, typeToAdd, storyLocalizations.SiteStrings.VirtualFieldTrip, url);
            break;

        default:
            break;

    }
    if (typestoAdd.length > 0) {
        jsonObject.TypesToAdd = typestoAdd;
    }

    return jsonObject;
}

function createStoryTypeButton(typestoAdd, typeToAdd, title, url) {
    typeToAdd = {};
    typeToAdd.Title = title;
    typeToAdd.CreateContentUrl = url;
    typestoAdd.push(typeToAdd);

    return typestoAdd;
}

function updateFilterTotals(currentTotal, assocatedTiles) {
    if ($('[data-module-id=' + assocatedTiles + '] .filter-values').length > 0) {
        if ($('[data-module-id=' + assocatedTiles + ']').find('.tile-wrapper[data-tilesname=' + assocatedTiles + ']').hasClass("autogeneratetiles")) {
            $('[data-module-id=' + assocatedTiles + '] .filter-values').text(currentTotal);
        }
    }

}

//Get the filter options from the HTML on the page
function getFilterParams(element) {
    var params = {
    };

    // Container Token, for communities
    if ($(element).attr('data-container-token') && $(element).attr('data-container-token').length > 0) {
        $.extend(params, {
            ContainerToken: $(element).attr('data-container-token')
        });
    }

    //Story Type, multiple
    if (FILTER_QUERYSTRING != null && FILTER_QUERYSTRING["StoryTypes"] != undefined && FILTER_QUERYSTRING["StoryTypes"].length > 0) {
        $.extend(params, {
            StoryTypes: $.isArray(FILTER_QUERYSTRING["StoryTypes"]) ? FILTER_QUERYSTRING["StoryTypes"].clean('') : FILTER_QUERYSTRING["StoryTypes"].split(',').clean('')
        });
    } else {
        if ($(element).attr('data-type') && $(element).attr('data-type').length > 0) {
            $.extend(params, {
                StoryTypes: $(element).attr('data-type').split(',').clean('')
            });
        }
    }


    if (FILTER_QUERYSTRING != null && FILTER_QUERYSTRING["ScheduleAvailability"] != undefined && typeof FILTER_QUERYSTRING["ScheduleAvailability"] == 'object') {
        $.extend(params, {
            ScheduleAvailability: FILTER_QUERYSTRING["ScheduleAvailability"]
        });
    }

    if (FILTER_QUERYSTRING != null && FILTER_QUERYSTRING["MatchType"] != undefined) {
        $.extend(params, {
            MatchType: FILTER_QUERYSTRING["MatchType"]
        });
    } else {


    }

    // Nav Category, fixed value set on the filter
    var navCategoryArray = [];
    var navCategory = {};
    if ($(element).attr('data-nav-category') && $(element).attr('data-nav-category').length > 0) {
        navCategory = makeIntArray($(element).attr('data-nav-category').split(',').clean(''));
        navCategoryArray = navCategory.concat(navCategoryArray);
    }

    if (navCategoryArray.length > 0) {
        $.extend(params, {
            NavCategories: navCategoryArray
        });
    }

    // Tags these are the tags that will have to allow multiples
    var categoryArray = [];
    var category = {
    };

    if ($(element).attr('data-category') && $(element).attr('data-category') !== "," && $(element).attr('data-category').length > 0) {
        category = makeIntArray($(element).attr('data-category').split(',').clean('').clean('0').clean('4000'));
        categoryArray = category.concat(categoryArray);
    }

    if (categoryArray.length > 0) {
        $.extend(params, {
            TagCategories: categoryArray
        });
    }

    // Country Breakdown
    var countryArray = [];
    var country = {
    };
    if ($(element).attr('data-country') && $(element).attr('data-country').length > 0) {
        country = $(element).attr('data-country').split(',').clean('');
        countryArray = makeIntArray(country);
        $.extend(params, {
            Countries: countryArray
        });
    }

    // Language Breakdown, multiple
    var languageArray = [];
    var language = {
    };
    if ($(element).attr('data-language') && $(element).attr('data-language').length > 0) {
        language = $(element).attr('data-language').split(',').clean('');
        languageArray = makeIntArray(language);
        $.extend(params, {
            Languages: languageArray
        });
    }

    // Editor Picks Breakdown
    if ($(element).attr('data-editorpicks') && $(element).attr('data-editorpicks').length > 0) {
        $.extend(params, {
            OnlyShowEditorPicks: $(element).attr('data-editorpicks')
        });
    }


    if ($(element).attr('data-attributes') && $(element).attr('data-attributes').length > 0 && parseInt($(element).attr('data-attributes')) !== 0) {
        $.extend(params, {
            Attributes: $(element).attr('data-attributes').split(',').clean('')
        });
    }

    // Include Hidden
    if ($(element).attr('data-includehidden') && $(element).attr('data-includehidden').length > 0) {
        $.extend(params, {
            IncludeHidden: $(element).attr('data-includehidden')
        });
    }

    //Favorites
    if ($(element).attr('data-showfavorite') && $(element).attr('data-showfavorite').length > 0) {
        $.extend(params, {
            FavoritesOnly: $(element).attr('data-showfavorite')
        });
    }


    var splitRows;
    var splitRowsLength;
    var i;

    //affiliateduser
    if ($(element).attr('data-affilateduser') && $(element).attr('data-affilateduser').length > 0) {
        var affilateduserArray = [];
        splitRows = $(element).attr('data-affilateduser').split(",");
        splitRowsLength = splitRows.length;
        for (i = 0; i < splitRowsLength; i++) {
            if ($.trim(splitRows[i]).length > 0) {
                var affilateduser = {
                };
                affilateduser.UserType = $.trim(splitRows[i].split("|")[0]);
                affilateduser.UserItemId = splitRows[i].split("|")[1];
                affilateduserArray.push(affilateduser);
            }
        }
        $.extend(params, {
            AffiliatedUsers: affilateduserArray
        });
    }

    // storytype 
    var userGroupIds = [];

    if ($(element).attr('data-showusergroupcheckbox') && $(element).attr('data-showusergroupcheckbox').length > 0) {

        var storyTypeAttributes = $(element).attr('data-storytypeattributeselected').split(",").clean('');
        if (storyTypeAttributes.length === 0) {
            storyTypeAttributes = $(element).attr('data-storytypeattribute').split(",").clean('');
        }
        var storyTypeAttributesLength = storyTypeAttributes.length;

        for (var i = 0; i < storyTypeAttributesLength; i++) {
            if ($.trim(storyTypeAttributes[i]).length > 0) {
                switch (storyTypeAttributes[i].split("|")[1]) {
                    case "28":
                        userGroupIds.push(1);
                        break;
                    case "26":
                        userGroupIds.push(2);
                        break;
                    case "27":
                        userGroupIds.push(3);
                        break;
                    case "29":
                        userGroupIds.push(8);
                        break;
                    case "30":
                        userGroupIds.push(7);
                        break;
                    default:
                }
            }
        }

        $.extend(params, {
            AssociatedUserGroups: userGroupIds
        });

    } else {

        if ($(element).attr('data-storytypeattribute') && $(element).attr('data-storytypeattribute').length > 0) {

            splitRows = $(element).attr('data-storytypeattribute').split(",");
            splitRowsLength = splitRows.length;
            for (i = 0; i < splitRowsLength; i++) {
                if ($.trim(splitRows[i]).length > 0) {
                    switch (splitRows[i].split("|")[1]) {
                        case "28":
                            userGroupIds.push(1);
                            break;
                        case "26":
                            userGroupIds.push(2);
                            break;
                        case "27":
                            userGroupIds.push(3);
                            break;
                        case "29":
                            userGroupIds.push(8);
                            break;
                        case "30":
                            userGroupIds.push(7);
                            break;
                        default:
                    }
                }
            }
            $.extend(params, {
                AssociatedUserGroups: userGroupIds
            });
        }

    }
    if ($(element).attr('data-group') && $(element).attr('data-group').length > 0) {
        $.extend(params, {
            Group: $(element).attr('data-group')
        });
    }

    if ($(element).attr('data-usertoken') && $(element).attr('data-usertoken').length > 0) {
        $.extend(params, {
            CreatedByToken: $(element).attr('data-usertoken')
        });
    }

    //Status
    var completionStatuses = [];

    //TODO: Remove code. This doesn't seem to be used for anything
    if ($(element).attr('data-showinprogres') && $(element).attr('data-showinprogres').length > 0) {
        $.extend(params, {
            ShowInProgress: $(element).attr('data-showinprogres')
        });
    }

    //TODO: Remove code. This doesn't seem to be used for anything. Also data-showcompleted attribute doesn't exist on the element so this will always be false
    if ($(element).attr('data-showcompleted') && $(element).attr('data-showcompleted').length > 0) {
        $.extend(params, {
            ShowCompleted: $(element).attr('data-showcompleted')
        });
    }

    //TODO: Remove code. This doesn't seem to be used for anything
    if ($(element).attr('data-shownotstarted') && $(element).attr('data-shownotstarted').length > 0) {
        $.extend(params, {
            ShowNotStarted: $(element).attr('data-shownotstarted')
        });

        $.extend(params, {
            CompletionStatuses: completionStatuses
        });
    }

    //TODO: Remove code. This doesn't seem to be used for anything
    if ($(element).attr('data-hidecommunitycontributor') && $(element).attr('data-hidecommunitycontributor').length > 0) {
        $.extend(params, {
            HideCommunityContributor: $(element).attr('data-hidecommunitycontributor')
        });
    }

    if ($(element).attr("data-formattype")) {
        if ($(element).attr("data-formattype") === "mycontent" && $(element).attr('data-publicview') === "false" && $(element).attr("data-itemstatus")) {
            var itemStatusArray = [];
            var expired = false;
            if ($(element).attr('data-itemstatus') && $(element).attr('data-itemstatus').length > 0) {
                itemStatusArray = $(element).attr('data-itemstatus').split(',');
                $.each(itemStatusArray, function (i, value) {
                    switch (value) {
                        case 'Active':
                            itemStatusArray[i] = 'Active';
                            break;
                        case 'Preliminary':
                            itemStatusArray[i] = 'Preliminary';
                            break;
                        case 'Draft':
                            itemStatusArray[i] = 'Draft';
                            break;
                        case 'InReview':
                            itemStatusArray[i] = 'InReview';
                            break;
                        case 'ReviewedNotApproved':
                            itemStatusArray[i] = 'ReviewedNotApproved';
                            break;
                        case 'Expired':
                            expired = true;
                            break;
                        case 'Archived':
                            itemStatusArray[i] = 'Archived';
                            break;
                    }
                });

                if (expired) {

                    itemStatusArray = itemStatusArray.filter(function (el) { return el != "Expired"; });

                    $.extend(params, { Readiness: "Expired" });
                }
                else {
                    $.extend(params, { ItemStatus: itemStatusArray });
                }

            }

        }
    }

    return params;
}

//used by both tiles and filters
function updateObjectFromQueryString(objCurrent, str) {
    var obj = {};
    try {
        obj = JSON.parse(decodeURIComponent(str));
    } catch (e) {
        return;
    }

    if (jQuery.isEmptyObject(objCurrent)) {
        objCurrent = {};
    }

    if (obj.NavCategories !== undefined) {
        if (typeof obj.NavCategories === 'object') {
            objCurrent.NavCategories = obj.NavCategories.clean();
        } else {
            objCurrent.NavCategories = obj.NavCategories.split(',').clean('');
        }

        if ($('.filter-bar').attr("data-nav-category") != null && $('.filter-bar').attr("data-nav-category").length == 0 && objCurrent.NavCategories.length > 0) {
            $('.filter-bar').attr("data-nav-category", objCurrent.NavCategories.join(","));
        }

    }
    if (obj.AffiliatedUsers !== undefined) {

        var affilateduserArray = [];
        var affilateduserArray = [];
        splitRows = obj.AffiliatedUsers.split(",");
        splitRowsLength = splitRows.length;
        for (i = 0; i < splitRowsLength; i++) {
            if ($.trim(splitRows[i]).length > 0) {
                var affilateduser = {};
                affilateduser.UserType = $.trim(splitRows[i].split("|")[0]);
                affilateduser.UserItemId = splitRows[i].split("|")[1];
                affilateduserArray.push(affilateduser);
            }
        }
        objCurrent.AffiliatedUsers = affilateduserArray;

        //FILTER_QUERYSTRING["PresetAffiliatedUsers"] = $(".filter-bar").attr('data-affilateduser').split(',').clean('');
    }
    else if (obj.PresetAffiliatedUsers !== undefined) {

        var affilateduserArray = [];
        var affilateduserArray = [];
        splitRows = obj.PresetAffiliatedUsers.split(",");
        splitRowsLength = splitRows.length;
        for (i = 0; i < splitRowsLength; i++) {
            if ($.trim(splitRows[i]).length > 0) {
                var affilateduser = {};
                affilateduser.UserType = $.trim(splitRows[i].split("|")[0]);
                affilateduser.UserItemId = splitRows[i].split("|")[1];
                affilateduserArray.push(affilateduser);
            }
        }
        objCurrent.AffiliatedUsers = affilateduserArray;
    }



    if (obj.TagCategories !== undefined) {
        var categories = obj.TagCategories;
        if (typeof categories !== 'object') {
            categories = categories.split(',');
        }
        categories = makeIntArray(categories.clean('').clean('0').clean('4000'));
        if (typeof objCurrent.TagCategories === 'object') {
            categories = categories.concat(objCurrent.TagCategories);
        }
        objCurrent.TagCategories = categories;
    }
    else
        if (obj.PresetTagCategories !== undefined) {
            var categories = obj.PresetTagCategories;
            if (typeof categories !== 'object') {
                categories = categories.split(',');
            }
            categories = makeIntArray(categories.clean('').clean('0').clean('4000'));
            objCurrent.TagCategories = categories;
        }

    if (obj.CompletionStatuses !== undefined) {
        var completionStatuses = obj.CompletionStatuses.split(',').clean('');
        $.each(completionStatuses, function (i, value) {
            switch (value) {
                case '0': //Unknown
                    completionStatuses[i] = 'Unknown';
                    break;
                case '1': //Completed
                    completionStatuses[i] = 'Completed';

                    break;
                case '2': //Incomplete
                    completionStatuses[i] = 'Incomplete';
                    break;
                case '3': //NotAttempted
                    completionStatuses[i] = 'NotAttempted';
                    break;
                case '4': //Failed
                    completionStatuses[i] = 'Failed';
                    break;
                case '5': //NotApplicable
                    completionStatuses[i] = 'NotApplicable';
                    break;
            }
        });
        objCurrent.CompletionStatuses = completionStatuses;
    }


    if (obj.StoryTypes !== undefined) {
        if ($.isArray(obj.StoryTypes)) {
            objCurrent.StoryTypes = obj.StoryTypes.clean();
        } else {
            objCurrent.StoryTypes = obj.StoryTypes.split(',').clean('');
        }

    }
    else {
        if (obj.DefinedStoryTypes != null) {
            if (typeof obj.PresetStoryTypes === 'object') {
                objCurrent.StoryTypes = obj.PresetStoryTypes.clean();
            } else {
                objCurrent.StoryTypes = obj.PresetStoryTypes.split(',').clean('');
            }

        }

    }

    if (obj.ItemStatus !== undefined) {
        var expired = false;
        var itemStatusArray = obj.ItemStatus.split(',').clean('');

        $.each(itemStatusArray, function (i, value) {
            switch (value) {
                case 'Active':
                    itemStatusArray[i] = 'Active';
                    break;
                case 'Preliminary':
                    itemStatusArray[i] = 'Preliminary';
                    break;
                case 'Draft':
                    itemStatusArray[i] = 'Draft';
                    break;
                case 'InReview':
                    itemStatusArray[i] = 'InReview';
                    break;
                case 'ReviewedNotApproved':
                    itemStatusArray[i] = 'ReviewedNotApproved';
                    break;
                case 'Expired':
                    expired = true;;
                    break;
                case 'Archived':
                    itemStatusArray[i] = 'Archived';
                    break;
            }
        });
        objCurrent.ItemStatus = itemStatusArray;
        if (expired) {
            itemStatusArray = itemStatusArray.filter(function (el) { return el != "Expired"; });
            objCurrent.Readiness = "Expired";
        }
    }


    if (obj.Countries !== undefined) {
        var countries = obj.Countries;
        if (typeof countries !== 'object') {
            countries = countries.split(',');
        }
        countries = makeIntArray(countries.clean(''));
        objCurrent.Countries = countries;
    }

    if (obj.Languages !== undefined) {
        var languages = obj.Languages;
        if (typeof languages !== 'object') {
            languages = languages.split(',');
        }
        languages = makeIntArray(languages.clean(''));
        objCurrent.Languages = languages;
    }

    if (obj.group !== undefined) {
        objCurrent.Group = obj.group;
    }

    if (obj.ShowCompleted !== undefined) {
        objCurrent.ShowCompleted = obj.ShowCompleted;
        if (obj.ShowCompleted === true) {

            var StoryTypes = [];
            StoryTypes.push(COURSESTORYTYPEID);
            objCurrent.StoryTypes = StoryTypes;

            objCurrent.CompletionStatuses = [];
        }
    }

    if (obj.HideCommunityContributor !== undefined) {
        objCurrent.HideCommunityContributor = obj.HideCommunityContributor;
        if (obj.HideCommunityContributor === true) {

            if (objCurrent.StoryTypes !== undefined) {

                //If Community Contributors Id 21 is found in objCurrent.StoryTypes array remove it
                var index = $.inArray("21", objCurrent.StoryTypes);
                if (index !== -1) {
                    objCurrent.StoryTypes.splice(index, 1);
                }

                /*if ($.inArray("21", storyTypes) > -1) {
                    objCurrent.StoryTypes = $.grep(storyTypes, function (value) {
                        return value != "21";
                    });
                }*/
            }
        }
    }


    if (obj.FavoritesOnly !== undefined) {
        objCurrent.FavoritesOnly = obj.FavoritesOnly;
    }

    if (obj.SortAscending !== undefined) {
        objCurrent.SortAscending = obj.SortAscending;
    } else {
        //Default SortAscending to true if undefined. This fixes issue with cleared filter not reverting back to initial result display
        objCurrent.SortAscending = true;
    }

    if (obj.SortOrder !== undefined) {
        objCurrent.SortOrder = obj.SortOrder;
    }

    if (obj.IsFeatured !== undefined) {
        objCurrent.IsFeatured = obj.IsFeatured;
    }

    if (obj.ShowByNew !== undefined) {
        objCurrent.SortOrder = "New";
        objCurrent.ShowByNew = obj.ShowByNew;
    }

    if (obj.ShowByPopularity !== undefined) {
        objCurrent.SortOrder = "Popularity";
        objCurrent.ShowByPopularity = obj.ShowByPopularity;
    }

    if (obj.ShowNotStarted !== undefined) {
        obj.StoryTypes = [];
        if (jQuery.inArray("1", obj.StoryTypes) == -1) {
            obj.StoryTypes.push(COURSESTORYTYPEID);
            objCurrent.StoryTypes = obj.StoryTypes;
        }


        objCurrent.ShowNotStarted = obj.ShowNotStarted;
    }

    if (obj.ShowInProgress !== undefined) {
        obj.StoryTypes = [];
        if (jQuery.inArray("1", obj.StoryTypes) == -1) {
            obj.StoryTypes.push(COURSESTORYTYPEID);
            objCurrent.StoryTypes = obj.StoryTypes;
        }


        objCurrent.ShowInProgress = obj.ShowInProgress;
    }


    if (obj.storyTypeAttributeArray !== undefined) {

        var storyTypeAttributeArray = [];
        var storyTypeAttributes = obj.storyTypeAttributeArray.split(",").clean('');
        var storyTypeAttributesLength = storyTypeAttributes.length;

        for (var i = 0; i < storyTypeAttributesLength; i++) {
            if ($.trim(storyTypeAttributes[i]).length > 0) {
                var storyTypeAttribute = {
                };
                storyTypeAttribute.StoryType = $.trim(storyTypeAttributes[i].split("|")[0]);
                storyTypeAttribute.AttributeId = storyTypeAttributes[i].split("|")[1];
                storyTypeAttributeArray.push(storyTypeAttribute);

                switch (storyTypeAttribute.AttributeId) {
                    case "28":
                        objCurrent.ShowPartnerSelected = true;
                        break;
                    case "26":
                        objCurrent.ShowGuestSpeakerSelected = true;
                        break;
                    case "27":
                        objCurrent.ShowMysterySkypeSelected = true;
                        break;
                    case "29":
                        objCurrent.ShowTrainerSelected = true;
                        break;
                    case "30":
                        objCurrent.ShowMIEExpertSelected = true;
                        break;
                    default:
                }

            }
        }
        objCurrent.StoryTypeAttributes = storyTypeAttributes;
    }

    if (obj.SortOrder !== undefined) {
        if (obj.SortOrder == "New") {
            objCurrent.SortOrder = "New";
        } else if (obj.SortOrder == "Popularity") {
            objCurrent.SortOrder = "Popularity";
        }
    }

    if (obj.ScheduleAvailability !== undefined && obj.ScheduleAvailability !== null) {
        objCurrent.ScheduleAvailability = obj.ScheduleAvailability;
        objCurrent.SortOrder = "Availability";
    }

    if (obj.MatchType !== undefined) {
        objCurrent.MatchType = obj.MatchType;
    }

    if (obj.FallbackMatchType !== undefined) {
        objCurrent.FallbackMatchType = obj.FallbackMatchType;
    }

    return objCurrent;
}

function filterIsValid(filter) {

    var filterType = $(filter).data('filtertype');
    var groupType = getFilterGroupType(filterType);
    var validationMessage = [];

    if (groupType.toLowerCase() == 'availability') {

        if ($(filter).closest(".filter-availability-menu").find(".filter-availability-schedule-start-date").val() == "") {
            validationMessage.push(storyLocalizations["FilterAvailability"]["ValidationMessageStartDate"])
        }

        if ($(filter).closest(".filter-availability-menu").find("#filter-availability-schedule-time-start option:selected").val() == "0" || $(filter).closest(".filter-availability-menu").find("#filter-availability-schedule-time-end option:selected").val() == "0") {
            validationMessage.push(storyLocalizations["FilterAvailability"]["ValidationMessageTimeOfDay"])
        }

        if ($(filter).closest(".filter-availability-menu").find("#recurrence option:selected").val() === "3" && $(filter).closest(".filter-availability-menu").find(".day-of-week-group .day-of-week-parent.active").length === 0) {
            validationMessage.push(storyLocalizations["FilterAvailability"]["ValidationMessageDayOfWeek"])
        }

        if (validationMessage.length > 0) {
            var message = "";
            for (var i = 0; i < validationMessage.length; i++) {
                message += String.format("<li>{0}</li>", validationMessage[i]);
            }
            bootbox.alert(String.format("<p>{0}</p><ul>{1}</ul>", storyLocalizations["FilterAvailability"]["ValidationMessage"], message));
            return false;
        }

    }

    return true;

}

function getCalculatedTimeValue(container, startTime, endTime) {

    var value = 0;

    if (startTime === 24)
        startTime = 0;

    for (var i = startTime; i < endTime; i++) {
        switch (i) {
            case 0:
                value += 1;
                break;
            case 1:
                value += 2;
                break;
            case 2:
                value += 4;
                break;
            case 3:
                value += 8;
                break;
            case 4:
                value += 16;
                break;
            case 5:
                value += 32;
                break;
            case 6:
                value += 64;
                break;
            case 7:
                value += 128;
                break;
            case 8:
                value += 256;
                break;
            case 9:
                value += 512;
                break;
            case 10:
                value += 1024;
                break;
            case 11:
                value += 2048;
                break;
            case 12:
                value += 4096;
                break;
            case 13:
                value += 8192;
                break;
            case 14:
                value += 16384;
                break;
            case 15:
                value += 32768;
                break;
            case 16:
                value += 65536;
                break;
            case 17:
                value += 131072;
                break;
            case 18:
                value += 262144;
                break;
            case 19:
                value += 524288;
                break;
            case 20:
                value += 1048576;
                break;
            case 21:
                value += 2097152;
                break;
            case 22:
                value += 4194304;
                break;
            case 23:
                value += 8388609;
                break;
            default:
                value += 0;

        }
    }

    return value;

}
// Improvement?:
// - Show inital selected option instead of placeholder if there is one
$(function () {
    var allCustomSelect = $(".custom-select");

    allCustomSelect.each(function () {
        var customSelect = $(this),
            // TODO: use Mustache template
            template = '<div class="' + customSelect.attr("class") + '">';

        template += '<span class="custom-select-trigger">' + customSelect.attr("placeholder") + '</span>';
        template += '<div class="custom-options">';
        customSelect.find("option").each(function () {
            var option = $(this);
            template += '<span class="custom-option ' + option.attr("class") + '" data-value="' + option.attr("value") + '">' + option.html() + '</span>';
        });
        template += '</div></div>';
        customSelect.wrap('<div class="custom-select-wrapper"></div>');
        customSelect.hide();
        customSelect.after(template);
    });

    $(".custom-select-trigger").on("click", function (event) {
        $(document.body).one('click', function () {
            $(".custom-select").removeClass("opened");
        });
        $(this).parents(".custom-select").toggleClass("opened");
        event.stopPropagation();
    });
    $(".custom-option").on("click", function () {
        var option = $(this);

        option.parents(".custom-select-wrapper").find("select").val(option.data("value"));
        option.parents(".custom-options").find(".custom-option").removeClass("selection");
        option.addClass("selection");
        option.parents(".custom-select").removeClass("opened");
        option.parents(".custom-select").find(".custom-select-trigger").text(option.text());
    });
});
if (navigator.userAgent.match(/IEMobile\/10\.0/)) {
    var msViewportStyle = document.createElement('style');
    msViewportStyle.appendChild(
        document.createTextNode(
            '@-ms-viewport{width:auto!important}'
        )
    );
    document.querySelector('head').appendChild(msViewportStyle);
}


$(function () {
    if ($('.accred-page')) {
        $(".mobile .ezicon-arrow-select").on("click", function () {
            var mobileContainer = $(this).next().next();
            if (mobileContainer.hasClass('hidden')) {
                $(this).closest('li').addClass('active');
                mobileContainer.removeClass('hidden');
            } else {
                $(this).closest('li').removeClass('active');
                mobileContainer.addClass('hidden');
            }
        });
    }

    getHeaderFooter();
    initSigninButton();
    initStoryEvents();
    initVideoPlayers();


    $('[data-toggle="popover"]').popover();
});

function initVideoPlayers() {
    $(document).on('click', '.video-wrapper', function () {
        var videoPlayer = $(this).parent().find('video').get(0);
        if ($(this).hasClass('playing')) {
            videoPlayer.pause();
            $(this).removeClass('playing');
        } else {
            videoPlayer.play();
            $(this).addClass('playing');
        }
    });
}

function initSigninButton() {
    if (mec.globalConfig.isGuestUser) {
        $(document).on("click", ".requires-authentication, [requires-authentication]", function (event) {
            event.stopPropagation();
            event.preventDefault();
            showAuthModal();
        });
    }
}

function showAuthModal() {
    bootbox.dialog({
        message: storyLocalizations.SiteStrings.ActionSignInRequired,
        buttons: {
            signin: {
                label: storyLocalizations.SiteStrings.SignIn,
                className: "btn-primary btn-auth-sign-in",
                callback: function () {
                    $(this).attr('data-mode', 'auth');
                    if (RegistrationType == "SignInSignUp") {
                        var $btnSignIn = $(this).find('.btn-auth-sign-in');
                        $btnSignIn.attr('data-mode', 'auth');
                        $(this).modal('hide');
                        //Send the jQuery object button as a secondary parameter so you have access to event.relatedTarget.
                        $("#SignInModal").modal("show", $btnSignIn);
                        $('#SignInModal').on('shown.bs.modal', function () {
                            //this fixes an issue with scrolling when opening a second modal.
                            $(document.body).addClass('modal-open');
                        });
                    } else {
                        var queryString = "";
                        if (encodeURIComponent)
                            queryString = "?ReturnUrl=" + encodeURIComponent(window.location.pathname + window.location.search);
                        window.location.href = "/Start/Welcome" + queryString;
                    }
                }
            },
            joinnow: {
                label: '<span style="text-transform: none; font-weight: normal">' + storyLocalizations.SiteStrings.NotAMember + '</span> ' + storyLocalizations.SiteStrings.JoinNow,
                className: "btn-primary btn-auth-join-now",
                callback: function () {
                    var $btnJoinNow = $(this).find('.btn-auth-join-now');
                    $btnJoinNow.attr('data-mode', 'register');
                    $(this).modal('hide');
                    //Send the jQuery object button as a secondary parameter so you have access to event.relatedTarget.
                    $("#SignInModal").modal("show", $btnJoinNow);
                    $('#SignInModal').on('shown.bs.modal', function () {
                        //this fixes an issue with scrolling when opening a second modal.
                        $(document.body).addClass('modal-open');
                    });
                }
            }
        }
    });

}

function getHeaderFooter() {
    //Uses a global JS variable
    //Header
    $.ajax({
        url: 'https://uhf.microsoft.com/' + calculatedUserLocale + '/shell/xml/epgeam?headerId=epgeamheader_edu&footerId=epgeamfooter_edu' + calculatedCookieCompliance,
        type: "get",
        dataType: "xml",
        cache: false,
        success: function (results) {
            var cssStyleSheet = $(results).find("cssIncludes").text();
            if (cssStyleSheet.indexOf('rel="stylesheet"') > -1) {
                fetchHeaderFooter(results);
            } else {
                fetchEnUHF();
            }

        },
        error: function (request, status, error) {
            fetchEnUHF();
        }
    }).done(function () {

        //The Javascript code to display the UhfPromoBanner takes awhile to execute
        // so we need to prevent the UhfPromoBanner from displaying initially
        $('#epb').hide();

        //This sections needs to be hidden while it is rendering to prevent a redraw.
        //we are using the invisible class to prevent jumping.
        setTimeout(function () {
            $('.mainheader').removeClass('invisible');
            $('.footer-ms-generated').removeClass('invisible');

            //Set the height of the header once it's been loaded into the page in case it is a different height than what we were expecting in the CSS code
            setMainheaderAndNavbarSidePos();

            $(window).resize(function () {
                setMainheaderAndNavbarSidePos();
            });

        },
            750);

        setTimeout(function () {
            //Check if UhfPromoBanner is visible
            var isEpbVisible = !$('#epb').hasClass('x-hidden');
            if (isEpbVisible) {

                // If there is a UhfPromoBanner display it now
                $('#epb').show(0,
                    '',
                    function () {
                        //The epb banner has a CSS animation property on it that has to be completed before the header can be recalculated
                        // epb banner CSS animation we are waiting to be completed: #epb { animation: slidedown .5s ease-in; }
                        setTimeout(function () {
                            setMainheaderAndNavbarSidePos();
                        },
                            700);
                    });

                initEpbCloseEvent();
            }
        },
            7e3);
        //uhf-main.var.min.js has onLoadTimeoutMs set to 6e3 before executing the deferred functions for the UhfPromoBanner so this setTimeout needs to be set to 7e3
    });
    //fetch header method


    function fetchEnUHF() {
        $.ajax({
            url: 'https://uhf.microsoft.com/en-US/shell/xml/epgeam?headerId=epgeamheader_edu&footerId=epgeamfooter_edu' + calculatedCookieCompliance,
            type: "get",
            dataType: "xml",
            cache: false,
            success: function (results) {
                fetchHeaderFooter(results);
            }
        })
    };
    function fetchHeaderFooter(results) {
        $('head').append($(results).find("cssIncludes").text());
        $('body').append($(results).find("javascriptIncludes").text());
        // replace links with current environment
        var origin = location.origin;
        if (origin === undefined) {
            origin = location.protocol + "//" + location.host;
        }

        var headerHtml = $(results).find("headerHtml").text()
            .replace(/(http|https):\/\/education.microsoft.com/gi, origin);

        $('.mainheader').html(headerHtml);
        $('.mainheader').removeClass('invisible');
        $('.unauthenticated > div').removeClass('hidden');

        if (typeof userToken != "undefined" && userToken != "GUEST") {
            $(".msame_Header_name").text(storyLocalizations["SiteStrings"]["SignOut"])
            $(".msame_Header_name").click(function () {
                window.location.href = "/start/account/signout"
            });
        }

        //use new footer from the Unified Header call above
        var footerHtml = $(results).find("footerHtml").text();
        $('.footer-ms-generated').html(footerHtml);
        $('.footer-ms-generated').removeClass('invisible');
    };
    function initEpbCloseEvent() {
        /* When the user closes the UhfPromoBanner with the close button we need to recalculate the top position of '.navbar-side' */
        var closeSelector = 'button.c-action-trigger.glyph-cancel';
        $('.mainheader').on('click',
            closeSelector,
            function () {
                //The epb banner has a CSS animation property on it that has to be completed before the header can be recalculated
                // epb banner CSS animation we are waiting to be completed: #epb.epb-rollup {animation:slideup .5s ease-in;}
                setTimeout(function () {
                    setMainheaderAndNavbarSidePos();
                },
                    700);
            });
    }

    function setMainheaderAndNavbarSidePos() {
        /*
           The Microsoft Unified Header is different heights depending on viewport and occassionally includes a message alert in the "#epb" DOM element
           The height of the Community Menu ".navbar-side" is dependent the height of ".mainheader" so we recalculate its' top position whenever
           the height of ".mainheader" is changed. 
        */
        //Set the '.mainheader' height based on Unified Header height '#headerArea'
        var headerAreaHeight = $('#headerArea').height();
        var $mainheader = $('.mainheader');

        $mainheader.css('height', headerAreaHeight);

        var combinedHeaderHeight = $mainheader.height() + $('.sticky-navbar').height();
        $('.navbar-side').css('top', combinedHeaderHeight);
    }
}


function initStoryEvents() {

    if (mec.globalConfig.isGuestUser) {
        $('.requires-authentication').addClass('disabled');
    }

    $('.metrics-content-link').on("click", function (e) {
        e.preventDefault();

        var $this = $(this);
        var $childMetricsContent = $(this).find('.metrics-content');

        //If the user is unauthenticated and this control requires authentication disable it
        if (mec.globalConfig.isGuestUser && $this.hasClass('requires-authentication')) {
            return;
        }

        //Prevent multiple clicks
        if ($this.hasClass('disabled')) {
            return;
        }

        if (!$childMetricsContent.has(e.target).length) {

            $this.toggleClass('active');
            $childMetricsContent.toggleClass('hidden');
        }

        $('.metrics-content-link').not($this).removeClass('active');
        $('.metrics-content').not($childMetricsContent).addClass('hidden');
    });

    $('body').on('click', function metricsContentCloser(e) {
        var $target = $(e.target);
        var $container = $('.metrics-content');

        if (!$container.is(':visible')) {
            return;
        }

        if ($target.closest('.metrics-content-link').length === 0) {
            $container.addClass('hidden');
            $('.metrics-content-link').removeClass('active');
        }
    });
}

function storageAvailable(type) {
    try {
        var storage = window[type],
            x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch (e) {
        return false;
    }
}

//Jquery Extension

(function ($) {
    $.fn.forceNumeric = function () {
        return this.each(function () {
            $(this).keydown(function (e) {
                var key = e.which || e.keyCode;

                if (!e.shiftKey && !e.altKey && !e.ctrlKey &&
                    // numbers   
                    key >= 48 && key <= 57 ||
                    // Numeric keypad
                    key >= 96 && key <= 105 ||
                    // comma, period and minus, . on keypad
                    key === 190 || key === 188 || key === 109 || key === 110 ||
                    // Backspace and Tab and Enter
                    key === 8 || key === 9 || key === 13 ||
                    // Home and End
                    key === 35 || key === 36 ||
                    // left and right arrows
                    key === 37 || key === 39 ||
                    // Del and Ins
                    key === 46 || key === 45) {
                    return true;
                }

                return false;
            });
        });
    };

})(jQuery);


function saveToCalendarDownload(id, recipientId) {
    var params = {
        Id: id
    };

    if (recipientId !== undefined) {
        $.extend(params, { RecipientId: recipientId });
    }

    $.ajax({
        async: false,
        data: params,
        type: 'post',
        url: '/Status/Dashboard/AddCalendarPopup',
        cache: false,
        success: function (data) {
            if (data.Error != null) {
                bootbox.alert(data.Error);
                return false;
            }

            var icsMSG = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//" + data.company
                + "//NONSGML v1.0//EN\nBEGIN:VEVENT\nUID:" + data.from
                + "\nDTSTAMP:" + data.currentDate
                + "\nATTENDEE;CN=" + data.attendee
                + ";RSVP=TRUE:MAILTO:" + data.rsvp
                + "\nORGANIZER;CN=" + data.organizer
                + ":MAILTO::" + data.mailOrganizer
                + "\nDTSTART:" + data.startTime
                + "\nDTEND:" + data.endTime
                + "\nLOCATION:" + data.mtgLocation
                + "\nSUMMARY:" + data.subject
                + "\nEND:VEVENT\nEND:VCALENDAR";
            window.open("data:text/calendar;charset=utf8," + escape(icsMSG));
            //$("#calendar-" + id).hide();
        },
        error: function (xhr, status, error) {
            bootbox.alert(error);
        }
    });
}

/* Use with Redactor */
function redactorDisableMicrosoftTranslator($editor) {
    /* Disables Microsoft Translator on a text area element */
    //$editor is a jQuery element
    $editor.attr('translate', 'no');
}

/* Use with Redactor */
function cleanRedactorHtmlString(htmlString) {
    /* This function cleans up the HTML generated by Microsoft Translator in the Redactor editor.
    Note: Translations are not sent to the server from the Redactor editor */
    var cleanedHtmlString = htmlString
        .replace(/"=""\s?/g, '') //Remove all instances of "="" from the htmlString
        .replace(/len="1"\s?/g, '') //Remove all instances of len="1" from the htmlString
        .replace(/color: rgb\(15, 15, 95\);/g, '') //Removes style color property from htmlString
        .replace(/background-color: rgb\(240, 240, 160\);/g, '')  //Removes style background-color property from htmlString
        .replace(/style="\s?"\s?/g, '') //Remove all empty style attributes from string
        .replace(/class="\s?"\s?/g, ''); //Remove all empty class attributes from string

    return cleanedHtmlString;
}
/* global bootbox*/
$(function () {
    document.execCommand("AutoUrlDetect", false, false);
    bindDownloadTrainingTrackerSessions();

    $('.workspace-exit').click(function (event) {
        var obj = $('.workspace-exit');
        var exitUrl = $(obj).attr('href');
        event.preventDefault();
        var exitMessage = "Are you sure you want to exit? You will lose all unsaved changes";
        if ($(obj).attr("href").toLowerCase().indexOf("master") > -1) {
            exitMessage = "Are you sure you want to exit? You will lose all unsaved changes. If you have made any changes to the Active Master, please click the 'Send Messages' to send a message alerting all subs who copied this Master prior to your changes";
        }
       
        bootbox.confirm(exitMessage, function (result) {
            if (result) {
                window.location = exitUrl;
            }
        });
    });

    $('[data-toggle=tooltip]').tooltip();
});




function bindDownloadTrainingTrackerSessions() {
    $(document).on('click', '.export', function (event) {
        event.preventDefault();
        downloadTrainingTrackerSessions();

    });
}

function downloadTrainingTrackerSessions() {
    
    window.location.href = "/Status/Dashboard/DownloadTrainingTrackerSessions";
    
}

//// Requires BingMaps Ajax V7 script
//// Requires Jquery.
/* global Microsoft, Mustache, _ */
var GageMaps = {
    LocationFinder: function (mapKey, mapAreaId, notifyAreaId, getAddressByLocationUrl
      , ISOCountryId, getLocationByCountryURL, options) {

        // Defaults properties that can be ovveriden from input.
        this.options = {
            DefaultStartingPoint: { Latitude: 39.443, Longitude: -98.957 },
            NotifyText: "Your approximate Location is <br/>",
            Width: '100%',
            Height: '600px',
            IconUrl: '../../assets/js/mediaelement/poi_custom.png'
        };

        // instance variables.
        this.mapKey = mapKey;
        this.mapAreaId = mapAreaId;
        this.notifyAreaId = notifyAreaId;
        this.getAddressByLocationUrl = getAddressByLocationUrl;
        this.inputCountryCode = ISOCountryId;
        this.getLocationByCountryURL = getLocationByCountryURL;
        // Extend the current from input
        this.options = $.extend(this.options, options);
        this.mapAreaDom;
        this.$mapArea;
        this.$notifyArea;
        this.assumedLocation;
        this.addressDescription;
        this.Map;

        // change this per Error log of application.
        this.LogError = function (errMsg) {
            console.log(errMsg);
            throw errMsg;
        };

        this.getSelectedLocation = function () {
            return {
                Point: { Latitude: this.assumedLocation.latitude, Longitude: this.assumedLocation.longitude },
                Address: this.addressDescription
            };
        };

        this.InitializeMap = function () {

            this.Map = new Microsoft.Maps.Map(this.mapAreaDom, {
                credentials: this.mapKey,
                enableClickableLogo: false,
                showLogo: false,
                showMapTypeSelector: false,
                mapTypeId: Microsoft.Maps.MapTypeId.road,
                showDashboard: true,
                maxZoom: 12,
                minZoom: 5,
                zoom: 5
            });

            // set the mapview.
            this.Map.setView({ zoom: 5, center: this.assumedLocation });
           
            // Add the Pushpin.
            this.Map.entities.clear();
            var pushpinOptions = { icon: this.options.IconUrl, draggable: true };
            var pushpin = new Microsoft.Maps.Pushpin(this.assumedLocation, pushpinOptions);
            var that = this;
            pushpindragend = Microsoft.Maps.Events.addHandler(pushpin, 'dragend', function (e) { that.pushPinEnddragDetails(e); });
            this.Map.entities.push(pushpin);
            
            //Hook up the event handlers we are interested in trapping
            Microsoft.Maps.Events.addHandler(this.Map, 'click', function (e) { that.setLocationFromClick(e); });
            $(this.mapAreaDom).height(this.options.Height);

        };

        this.pushPinEnddragDetails = function (e) {
            var location = e.location;
            this.assumedLocation = new Microsoft.Maps.Location(location.latitude, location.longitude);
            this.Map.entities.get(0).setLocation(location);
            this.AddressChanged();
         }

        this.setLocationFromClick = function (e) {
            if (e.targetType === "map") {
                var location = e.location;
                this.assumedLocation = new Microsoft.Maps.Location(location.latitude, location.longitude);
                this.Map.entities.get(0).setLocation(location);
                this.AddressChanged();
            }
        };

        // function to get Address Data from Server
        this.getAddressByLocation = function (location) {
            var that = this;
            return $.ajax({
                dataType: "json",
                url: that.getAddressByLocationUrl,
                data: { Latitude: location.latitude, Longitude: location.longitude }
            });
        };

        this.FormatAddressForDisplay = function (address) {
            var formatted = "";
            if (address) {
                formatted += address.adminDistrict2 + ", " + address.countryRegion + ", " + address.postalCode;
                formatted = formatted.replace(/null/gi, "");
                formatted = formatted.replace(/undefined/gi, "");            
            }
            return formatted;
        };

        this.AddressChanged = function () {
            // For First TIme Load the maps with the selected area.
            if (!this.Map) {
                this.InitializeMap();
            }

            // Now Get the description for the selected area
            this.ResetNotification(); // Reset the current address
            var that = this;
            var addressDfd = this.getAddressByLocation(this.assumedLocation);
            addressDfd.done(function (address) {
                that.AddressChangeComplete(address);
            })
            .fail(function () {
                that.AddressChangeComplete(null);
            });
        };

        this.AddressChangeComplete = function (address) {
            var description = this.FormatAddressForDisplay(address);            
            this.addressDescription = address;
            $(this).trigger("GageMaps.LocationFinder.LocationChanged", { Description: description, Latitude: this.assumedLocation.latitude, Longitude: this.assumedLocation.longitude });
        };

        this.geolocationSuccess = function (position) {
            var lat = position.coords.latitude;
            var long = Microsoft.Maps.Location.normalizeLongitude(position.coords.longitude);
            if (position.coords.accuracy < 483) {
                lat = lat + 0.005;
                long = long + 0.005; 
            }
            this.assumedLocation = new Microsoft.Maps.Location(lat, long);
            this.AddressChanged();
        };

        this.geolocationError = function () {
            this.getLocationByCountry();
        };

        // function to get Address Data from Srrver
        this.getLocationByCountryAjax = function () {
            var that = this;
            var countryDfd = $.Deferred();
            if (this.inputCountryCode && this.getLocationByCountryURL) {
                countryDfd = $.ajax({
                    dataType: "json",
                    url: that.getLocationByCountryURL,
                    data: { ISOCountryCode: that.inputCountryCode }
                });
            }
            else {
                countryDfd.resolve(null);
            }
            return countryDfd;
        };

        this.getLocationByCountry = function () {
            var that = this;
            var countryDfd = this.getLocationByCountryAjax();
            // Set assumed location only if the call is success.
            countryDfd.done(function (point) {
                if (point) {
                    that.assumedLocation = new Microsoft.Maps.Location(point.Latitude, point.Longitude);
                }
            }).always(function () {
                that.AddressChanged();
            });
        };

        this.ResetNotification = function () {
            this.addressDescription = null;
            var htmlString = '<img alt="Processing" src="../../assets/js/mediaelement/hourglass-busy.gif" />';
            this.$notifyArea.html(htmlString);
        };

        this.dispose = function () {
            if (this.Map) {
                this.Map.dispose();
                this.Map = null;
            }
        };

        //Constructor.
        this.Constructor = function () {
            // Check dependencies.
            if (!jQuery)
                this.LogError("Jquery not loaded.");
            if (!Microsoft.Maps.Map)
                this.LogError("BingMaps Ajax V7 script not loaded.");
            if (!this.mapKey || !this.mapAreaId || !this.notifyAreaId || !this.getAddressByLocationUrl)
                this.LogError("Some of the required input parm for locationfinder are undefined.");

            // needed by Bing maps.
            this.mapAreaDom = document.getElementById(this.mapAreaId);
            this.$mapArea = $("#" + this.mapAreaId);
            if (this.$mapArea.length !== 1)
                this.LogError("MapAreaId not in DOM or occurs more than once. Send only the literal name not the dom(or)$ element.");
            this.$notifyArea = $("#" + this.notifyAreaId);
 
            // Validations passed now do the processing.
            if (this.options.StartingLatitude > 0 || this.options.StartingLongitude > 0) {
                this.assumedLocation = new Microsoft.Maps.Location(this.options.StartingLatitude, this.options.StartingLongitude);
                this.AddressChanged();
                return;
            }
            this.assumedLocation = new Microsoft.Maps.Location(this.options.DefaultStartingPoint.Latitude, this.options.DefaultStartingPoint.Longitude);

            // try HTML5 Geolocation first.
            // Need to rebind scope on callbacks.
            var that = this;
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function (position) {
                        that.geolocationSuccess(position);
                    }, function () {
                        that.geolocationError();
                    }
                    );
            } else {
                this.getLocationByCountry();
            }
        };

        this.Constructor();
    }, // LOcationfinder ends here.

    
    MapSearch: function (mapKey, mapAreaId, notifyAreaId, getFilteredUserInfoUrl, referenceLocation, options) {

        // Defaults properties that can be ovveriden from input.
        this.options = {
            DefaultStartingPoint: { latitude: 39.443, longitude: -98.957 },
            IconUrl: '../../assets/js/mediaelement/poi_custom.png'
        };

        // instance variables.
        this.mapKey = mapKey;
        this.mapAreaId = mapAreaId;
        this.notifyAreaId = notifyAreaId;
        this.getFilteredUserInfoUrl = getFilteredUserInfoUrl;
        this.referenceLocation = referenceLocation;
        // Extend the current from input
        this.options = $.extend(this.options, options);
        this.mapAreaDom;
        this.$notifyArea;
        this.$mapArea;
        this.Map;
        this.infoAreaTemplate;
        this.MapEvents = [];
        this.pushPinArray = [];
        this.infoBoxArray = [];
        this.$mapAreaBusy;
        this.busyImageHTML = '<img  class="MapisBusyNow" alt="Processing" src="../../assets/js/mediaelement/hourglass-busy.gif" />';
        this.customInfobox;
        // change this per Error log of application.
        this.LogError = function (errMsg) {
            console.log(errMsg);
            throw errMsg;
        };

        this.InitializeMap = function () {
           this.Map = new Microsoft.Maps.Map(document.getElementById(this.mapAreaId), {
                credentials: this.mapKey,
                enableClickableLogo: false,
                showLogo: false,
                showMapTypeSelector: false,
                center: new Microsoft.Maps.Location(this.referenceLocation.latitude, this.referenceLocation.longitude),
                mapTypeId: Microsoft.Maps.MapTypeId.road,
                maxZoom: 10,
                minZoom: 5,
                zoom: 5,
                showDashboard: true
            });
            
            Microsoft.Maps.registerModule("CustomInfoboxModule", "../Assets/js/eduzone/components/V7CustomInfobox.js");
            Microsoft.Maps.loadModule("CustomInfoboxModule", {
                callback: function () {

                }
            });

            var that = this;
            this.MapEvents.push(Microsoft.Maps.Events.addHandler(this.Map, 'viewchangeend', function () { that.triggerMapViewChange(); }));
            this.MapEvents.push(Microsoft.Maps.Events.addHandler(this.Map, 'click', function () { that.hideInfoBox(); }));

        };

        this.triggerMapViewChange = function (/*e, data*/) {
            var mapBounds = this.GetCurrentMapViewBounds();
            //console.log("North: " + mapBounds.North + " South: " + mapBounds.South + " East: " + mapBounds.East + " West: " + mapBounds.West);
            $(this).trigger("GageMaps.MapSearch.MapViewChanged", mapBounds);
        };

        this.getAndBindDataToMap = function (nonMapFilters) {
            this.$notifyArea.html(this.busyImageHTML);
            nonMapFilters = nonMapFilters || {};
            this.existingFilters = nonMapFilters;
            var mapBounds = this.GetCurrentMapViewBounds();
            this.existingFilters = $.extend(this.existingFilters, { CurrentBounds: mapBounds });
            //Get the data.
            var that = this;
            var dataDfd = this.getUserInfoData(this.existingFilters);
            dataDfd.done(function (usersInfo) {
                that.mapUserData(usersInfo);
            })
            .fail(function (errorData) {
                this.LogError("An Error Occured getting Userinfo From Server" + errorData);
            });
        };       

        // function to get UserINfo From Server.
        this.getUserInfoData = function (data) {
            var that = this;
            return $.ajax({
                type: 'POST',
                dataType: 'json',
                contentType: 'application/json; charset=utf-8',
                url: that.getFilteredUserInfoUrl,
                data: JSON.stringify(data)
            });
        };

        this.setBusy = function () {
            this.$mapAreaBusy.show();
            this.$mapArea.hide();
            this.$mapArea.hide();
            this.$notifyArea.hide();
        };

        this.resetBusy = function () {
            this.$mapAreaBusy.hide();
            this.$mapArea.show();
            this.$mapArea.show();
            this.$notifyArea.show();
        };

        this.mapUserData = function (usersInfo, htmlTemplate) {
            //console.log("Items fetched count " + usersInfo.length);
            this.Map.entities.clear();

            this.pushPinArray = [];
            this.infoBoxArray = [];

            for (var index = 0, len = usersInfo.length; index < len; ++index) {
                var currentUser = usersInfo[index];
                // Do the pushpins and infobox in same order.
                this.createPushPin(currentUser);
                this.createInfoBox(currentUser, htmlTemplate);
            }
        };

        this.createPushPin = function (userInfo) {
            var pushpinOptions = { icon: userInfo.EmotIconUrl, draggable: false };
            var location = new Microsoft.Maps.Location(Math.round(userInfo.Latitude * 10000) / 10000, Math.round(userInfo.Longitude * 10000) / 10000);
            var pushpin = new Microsoft.Maps.Pushpin(location, pushpinOptions);
            var that = this;
            this.MapEvents.push(Microsoft.Maps.Events.addHandler(pushpin, 'click', function (e) { that.pushPinClick(e); }));
            // need pushpinArray to maintain the index of infobox.
            this.pushPinArray.push(pushpin);
            this.Map.entities.push(pushpin);
        };

        this.createInfoBox = function (userInfo, htmlTemplate) {
            //var infoboxOptions = { width: 200, height: 130, showPointer: true, zIndex: 0, visible: false, title: userInfo.FirstName, description: this.infoAreaTemplate({ userInfo: userInfo }) };
            var partials = {
                "userAvailabilityTpl": $(htmlTemplate).filter('#userAvailabilityTpl').html()
            };

            var resultTpl = Mustache.render($(htmlTemplate).filter('#resultTpl').html(), { SearchResults: userInfo }, partials);
            var infoboxOptions = { width: 200, height: 130, showPointer: true, zIndex: 200, visible: false, title: userInfo.FirstName, description: resultTpl};
            var location = new Microsoft.Maps.Location(Math.round(userInfo.Latitude * 10000) / 10000, Math.round(userInfo.Longitude * 10000) / 10000);
            var infobox = new Microsoft.Maps.Infobox(location, infoboxOptions);
            // need infoBoxArray to maintain the index of infobox.
            this.infoBoxArray.push(infobox);
            infobox.setMap(this.Map);
        };

        this.GetCurrentMapViewBounds = function () {
            var bounds = this.Map.getBounds();
            
            return {
                North: bounds.getNorth(),
                South: bounds.getSouth(),
                East: bounds.getEast(),
                West: bounds.getWest()
            };
        };
        this.hideInfoBox = function () {
            if (this.customInfobox) {
                this.customInfobox.hide();
            }
        }
        this.pushPinClick = function (e) {
            var indx = this.pushPinArray.indexOf(e.target);
            var map = this.Map;
            this.customInfobox = new CustomInfobox(map, { minWidth: 200, minHeight: 130, offset: { x: 20, y: 10 } });
            this.customInfobox.show(this.infoBoxArray[indx]._options.location, this.infoBoxArray[indx]._options.description);
            $('[data-toggle="popover"]').popover();
        };

        this.dispose = function () {
            for (var index = 0, len = this.MapEvents.length; index < len; ++index) {
                Microsoft.Maps.Events.removeHandler(this.MapEvents[index]);
            }
            if (this.Map) {
                this.Map.dispose();
                this.customInfobox.hide();
                this.Map = null;
            }
        };

        //Constructor.
        this.Constructor = function () {
            // Check dependencies.

            if (!this.mapKey || !this.mapAreaId)
                this.LogError("Some of the required input parm for MapSearch are undefined.");

            // needed by Bing maps.
            this.mapAreaDom = document.getElementById(this.mapAreaId);
            this.$mapArea = $("#" + this.mapAreaId);
            if (this.$mapArea.length !== 1)
                this.LogError("MapAreaId not in DOM or occurs more than once. Send only the literal name not the dom(or)$ element.");
            this.$notifyArea = $("#" + this.notifyAreaId);           
            
            if (!this.referenceLocation || !this.referenceLocation.latitude || !this.referenceLocation.longitude) {
                this.referenceLocation = this.options.DefaultStartingPoint;
            }
            this.referenceLocation = new Microsoft.Maps.Location(this.referenceLocation.latitude, this.referenceLocation.longitude);

            this.InitializeMap();

            // attach event to view more
            $(document.body).on('click', '.map-view-bio', function (e) {
                e.preventDefault();
                ShowMiniProfile($(this).attr("data-token"));
             });
        };

        this.Constructor();
    } // MapSearch ends here.

};
$(function () {
    $('.alert-cookiebanner').on('click', '.ezicon-close', function () {
        var expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + 180);
        expireDate = expireDate.getDate() + '/' + (expireDate.getMonth() + 1) + '/' + expireDate.getFullYear();
        createCookie('AcceptCookieBanner', expireDate, 180);
    });
});

var notificationEnabled = "";
var notificationInterval = "300000";
var timer = null;

function getBadgeNotification() {

    window.clearInterval(timer);

    $.ajax({
        url: '/Main/Notification/GetBadgeNotification',
        type: "GET",
        cache: false,
        success: function (data) {

            if (data.Error) {
                return;
            }

            if (data.NotificationHtml) {
                $("#myModal").find('.notifcation-content').html(data.NotificationHtml);
                $('#myModal').modal();
            } else {
                timer = window.setInterval(getBadgeNotification, notificationInterval);
            }
        },
        error: function (xhr, status, error) {
            //console.log(error);
        }
    });
}

function closeBadgeNotification() {
    timer = window.setInterval(getBadgeNotification, notificationInterval);
}

function initBadgeNotification() {

    var data = {
        method: "setup"
    };

    $.ajax({
        url: '/Main/Notification/GetBadgeNotification',
        data: data,
        type: "GET",
        cache: false,
        success: function (data) {

            if (data.Error) {
                return;
            }

            notificationEnabled = data.Enabled;
            notificationInterval = data.Interval;

            if (notificationEnabled) {

                $('.mainfooter').append($('#badgeNotificationTpl').html());
                $('#myModal').on('hidden.bs.modal', closeBadgeNotification);

                getBadgeNotification();
            }
        },
        error: function (xhr, status, error) {
            //console.log(error);
        }
    });
}

var isProposingNewTime = false;
var canProposeNewTime = false;
var allTimes = [];
var timeToSelect = null;
$(document).ready(function () {

    $('body').on("click", "#scheduleModal button.modal-back", function (e) {
        getScheduledTimes($(this).attr("data-storytoken"), $(this).attr("data-usertoken"), true, "", $(this).attr("data-localtime"), $("#interaction-message").val());
    });


    $("body").on("click", ".scheduleConfirmClose", function(e){
        bindInteractionRequestSummary();
    });

    //if ($("#scheduleModal").attr("data-requesttype") != null && $("#scheduleModal").attr("data-requesttype").length > 0 && ($("#scheduleModal").attr("data-requesttype") === "SkypeLesson" || $("#scheduleModal").attr("data-requesttype") === "VirtualFieldTrip")) {

    //    $(document).on('click', '.scheduleConfirmClose', function (event) {
    //        event.preventDefault();

    //        var params = {
    //            RegistrationType: $("#scheduleModal").attr("data-requesttype"),
    //            StoryToken: $("#scheduleModal").attr("data-storytoken"),
    //            UserToken: $("#scheduleModal").attr("data-usertoken")
    //        };

    //        $.ajax({
    //            url: '/API/Interaction/RegistrationThankYou',
    //            data: params,
    //            type: "POST",
    //            cache: false
    //        })
    //            .done(function (result) {
    //                if (result.Error !== undefined && result.Error !== null) {
    //                    if (result.Error.toLowerCase().indexOf("unauthorized") >= 0) {
    //                        showAuthModal();
    //                    } else {
    //                        bootbox.alert(result.Error);
    //                    }
    //                    return false;
    //                }
    //                $("#scheduleModal").html(result);
    //                return true;
    //            }
    //            );
    //    });
    //}

});

// Schedule Modal Logic
function cancelScheduleDataChangePrompt(oldDate, location) {
    bootbox.dialog({
        message: NoteProposeTime,
        buttons: {
            success: {
                label: storyLocalizations.SiteStrings.Proceed,
                className: "btn-primary",
                callback: function () {
                    $('.modal').on('hidden.bs.modal', function (e) {
                        if (isABootstrapModalOpen()) {
                            $('body').addClass('modal-open');
                        }
                    });
                    return true;
                }
            },
            cancel: {
                label: storyLocalizations.SiteStrings.Cancel,
                className: "btn-link",
                callback: function () {
                    $('.modal').on('hidden.bs.modal', function (e) {
                        if (isABootstrapModalOpen()) {
                            $('body').addClass('modal-open');
                        }
                    });
                    updateScheduleTimeList(scheduleTimes[oldDate.format('M/D/YYYY')], oldDate.format('M/D/YYYY'), location);
                    activateDate(location);
                    return true;
                }
            }
        }
    });
}

function scheduleDateChange(e) {
    var location = $(e.currentTarget).attr("data-location");
    var thedate = e.date;

    if (e.change !== "M") {
        if (isProposingNewTime) {
            updateScheduleTimeList(allTimes[thedate.format('M/D/YYYY')], thedate.format('M/D/YYYY'), location);
        } else {
            if (canProposeNewTime && allTimes[thedate.format("M/D/YYYY")] === undefined) {
                updateScheduleTimeList(allTimes[thedate.format('M/D/YYYY')], thedate.format('M/D/YYYY'), location);
            } else {
                updateScheduleTimeList(allTimes[thedate.format('M/D/YYYY')], thedate.format('M/D/YYYY'), location);
            }
        }
    }
    activateDate(location);
    if ($("#ddlStatus").val() !== "1"
        && e.thedate !== undefined
        && $('[data-day="' + e.thedate.format('MM/DD/YYYY') + '"]') !== undefined
        && $('[data-day="' + e.thedate.format('MM/DD/YYYY') + '"]').hasClass('unspecified')) {
        cancelScheduleDataChangePrompt(e.oldDate, location);
    }

    if (timeToSelect !== null) {
        $("input[data-display='" + timeToSelect.format("M/D/YYYY h:00 A") + "']").prop("checked", "true");
    }
    $(".availableTimeWarning").addClass('hidden');
    $(".unspecifiedTimeWarning").addClass('hidden');
    $(".additionalTimeWarning").addClass('hidden');
    if (!canProposeNewTime)
    {
        $(".availableTimeWarning").removeClass('hidden');
    }
    else if ($('[data-day="' + thedate.format('MM/DD/YYYY') + '"]').hasClass('unspecified')) {
        $('.unspecifiedTimeWarning').removeClass('hidden');
    }
    else {
        $('.additionalTimeWarning').removeClass('hidden');
    }

}

function updateScheduleTimeList(timeList, selectedDate, location) {
    var $timeList = $('#schedule-time-' + location);

    if (typeof (timeList) !== "undefined") {
        var time = "";
        $.each(timeList, function (index, data) {
            if (location === "profile" || location === "miniprofile") {

                if (data.IsScheduled !== null) {
                    if (data.IsScheduled) {
                        time += '<li><span class="available"><strong>' + data.DisplayTime + '-' + data.DisplayEndTime + '</strong></span></li>';
                    }
                    else {
                        time += '<li><span class="unspecified">' + data.DisplayTime + '-' + data.DisplayEndTime + '</span></li>';
                    }
                }
                else {
                    time += '<li><span class="unspecified">' + data.DisplayTime + '-' + data.DisplayEndTime + '</span></li>';
                }


                
            } else {
                if ($("#ddlStatus").val() === "12" || $("#ddlStatus").val() === "4" || moment(data.UTCTime).isAfter()) {
                    if (data.IsScheduled !== null) {
                        if (data.IsScheduled) {
                            time += '<li><label><input type="radio" name="time" data-display="' + selectedDate + " " + data.DisplayTime + '" value="' + data.UTCTime + '" /> <span class="available">' + data.DisplayTime + '-' + data.DisplayEndTime + ' ' + data.TimeZone + '</strong></label></li>';
                        }
                        else {
                            time += '<li><label><input type="radio" name="time" data-display="' + selectedDate + " " + data.DisplayTime + '" value="' + data.UTCTime + '" /> <span class="unspecified">' + data.DisplayTime + '-' + data.DisplayEndTime + ' ' + data.TimeZone + '</span></label></li>';
                        }
                    }
                    else
                    {
                        time += '<li><label><input type="radio" name="time" data-display="' + selectedDate + " " + data.DisplayTime + '" value="' + data.UTCTime + '" /> <span class="unspecified">' + data.DisplayTime + '-' + data.DisplayEndTime + ' ' + data.TimeZone + '</span></label></li>';
                    }
                } 
            }
        });
        $timeList.empty().append(time);
    } else {
        $timeList.empty();
    }
    $('.schedule-active-date').text(selectedDate);
}

function clearCalendarDay() {
    $('#schedule-calendar-modal .day.available').add($('#schedule-calendar-modal .day.active')).removeClass('available active');
}

function proposeNewTimeClick(event) {
    event.preventDefault();
    isProposingNewTime = !isProposingNewTime;
    clearCalendarDay();
    $('#schedule-time-modal').empty();

    if (isProposingNewTime) {
        $('.scheduleNewTime').text(viewHostsAvailableTimesLabel);
        $('.propose-copy').hide();
    } else {
        $('.scheduleNewTime').text(proposeNewTimeLabel);
        $('.propose-copy').show();
    }
    activateDate("modal");
}

function bindScheduleDateControls(location, isChangeDateOnly, timesToDisplay, proposeaNewTime) {
    if (typeof (scheduleTimes) !== "undefined") {
        var d = new Date();
        var dNext = new Date();

        if (isChangeDateOnly) {
            dNext = new Date(interactionDate);
            d.setMonth(dNext.getMonth() - 6);
            d.setDate(dNext.getDate() - 1);
        }
        else {
        if ($("#ddlStatus").val() === "12" || $("#ddlStatus").val() === "4") {
            d.setMonth(dNext.getMonth() - 6);
            d.setDate(dNext.getDate() - 1);
        }   
        }

        dNext.setMonth(dNext.getMonth() + 6);
        dNext.setDate(dNext.getDate() - 1);

        // Profile Viewer
        //$('#date-picker-' + location).datetimepicker({ inline: true, widgetParent: '#schedule-calendar-' + location, format: dateFormat, minDate: d, maxDate: dNext });
        $('#date-picker-' + location).datetimepicker({
            inline: true,
            widgetParent: '#schedule-calendar-' + location,
            format: dateFormat,
            minDate: d,
            maxDate: dNext,
            locale: calculatedUserLocale
        });
        $('#date-picker-' + location).on('dp.change', scheduleDateChange);
        $('#date-picker-' + location).on('dp.update', scheduleDateChange);

        $('.date-picker-clear').on('click', function (event) {
            $(this).closest('.date-picker').find('.form-control').val('');
        });

        $('.scheduleNewTime').on('click', proposeNewTimeClick);
        if (typeof (timesToDisplay) !== "undefined") {
            if (allTimes.length == 0) {
                allTimes = timesToDisplay;
            }
        }

        if (typeof (proposeaNewTime) !== "undefined") {
            canProposeNewTime = proposeaNewTime;
        }
        activateDate(location);
    }
}

function activateDate(location) {
    var DatePicker = $('#date-picker-' + location).data('DateTimePicker');
    if (typeof (DatePicker) === "undefined") {
        return;
    }
    var date,
        currentMonth = DatePicker.viewDate().month(),
        currentYear = DatePicker.viewDate().year(),
        currentDate;

    var inMonth = [];
    var awayDates = [];
    var unspecifiedDates = [];
    var datesToUse = canProposeNewTime ? allTimes : scheduleTimes
    for (date in datesToUse) {

        currentDate = moment(date);

        if (currentDate.month() === currentMonth && currentDate.year() === currentYear) {
            if ((typeof (scheduleTimes) !== "undefined" && scheduleTimes[date] !== undefined && scheduleTimes[date].length > 0 && scheduleTimes[date][0].IsAway === false)) {
                inMonth.push(currentDate.format('D'));
            } else if (canProposeNewTime) {
                unspecifiedDates.push(currentDate.format('D'));
            } else {
                awayDates.push(currentDate.format('D'));
            }
        }
    }
    if (inMonth.length > 0 || awayDates.length > 0 || unspecifiedDates.length > 0) {
        selectDay(location, inMonth, awayDates, unspecifiedDates);
    } else {
        $('#schedule-calendar-' + location + ' .day').not('.old').not('.new').addClass("disabled");
    }
}

function selectDay(location, days, awayDates, unspecifiedDates) {
    $('#schedule-calendar-' + location + ' .day').not('.old').not('.new').each(function () {

        $(this).removeClass("unavailable disabled available unspecified today")

        if (days.indexOf($(this).text()) > -1) {
            $(this).addClass('available');
        } else if (awayDates.indexOf($(this).text()) > -1) {
            $(this).addClass("unavailable").addClass("disabled");
        } else if (unspecifiedDates.indexOf($(this).text()) > -1) {
            if ($("#scheduleModal").attr("data-interactiontype") !== "edit-session") {
                $(this).addClass("unspecified");
            }
        } else {
            $(this).addClass("disabled");
        }
    });
}

function getScheduledTimes(storyToken, userToken, excludeExistingSessions, interactionType, setCurrentDate, messageForHost) {
    var datetoSelect = moment();
    if (storyToken === undefined) {
        storyToken = "";
    }
    if (userToken === undefined) {
        userToken = "";
    }
    if (setCurrentDate !== undefined) {
        datetoSelect = moment(setCurrentDate);
    }
    if (excludeExistingSessions === undefined) {
        excludeExistingSessions = false;
    }
    if (interactionType === undefined) {
        interactionType = "";
    }
    if (messageForHost === undefined) {
        messageForHost = "";
    }

    var params = {
        storyToken: storyToken,
        userToken: userToken,
        type: interactionType,
        excludeExistingSessions: excludeExistingSessions,

    };
    scheduleTimes = "";
    isProposingNewTime = false;

    $.ajax({
        data: params,
        type: 'post',
        url: '/API/Interaction/GetSchedule',
        success: function (data) {
            if (data.Error !== null && data.Error !== undefined && data.Error !== "") {
                if (data.Error.toLowerCase().indexOf("unauthorized") >= 0) {
                    showAuthModal();
                } else {
                    bootbox.alert(data.Error);
                }
                $('.story-introduction .register').button('reset');
                $('#requestGuestSpeaker').button('reset');
                $('#mysterySkype').button('reset');

                return false;
            } else {
                $('.scheduleData').empty();
                if (data.Data !== null && data.Data !== undefined) {

                    allTimes = data.Data;
                    scheduleTimes = data.DataSecond;

                    canProposeNewTime = data.IsProposeANewTimeAllowed;
                    $("#scheduleModal").load("/API/Interaction/ScheduleModal?viewType=new&userToken=" + userToken + "&storyToken=" + storyToken, function (response, status, xhr) {
                        bindScheduleDateControls("modal", false);
                        var e = {};
                        e.currentTarget = '<div data-location="modal" />';
                        e.date = datetoSelect;
                        scheduleDateChange(e);

                        $("#scheduleModal").modal();

                        if (setCurrentDate !== undefined) {
                            timeToSelect = datetoSelect;
                            $("td[data-action='selectDay'][data-day='" + datetoSelect.format("MM/DD/YYYY") + "']").click();
                        }

                        $("#interaction-message").val(messageForHost);

                        if (interactionType !== '') {
                            $(".registerStoryType").val(interactionType);
                        }
                        else {
                            $(".registerStoryType").val($('.story-introduction .register').data('story-type'));
                        }

                        $("#scheduleModal").attr("data-requesttype", $(".registerStoryType").val());
                        $("#scheduleModal").attr("data-usertoken", userToken);
                        $("#scheduleModal").attr("data-storytoken", storyToken);

                        $('.story-introduction .register').button('reset');
                        $('#requestGuestSpeaker').button('reset');
                        $('#mysterySkype').button('reset');

                    });
                }
            }
        }
    });
}

// Edit Schedule Logic
var currentMode = "availability";
var currentAvailability;
var allAvailableTimes = [];
var profileScheduleTimes = [];
var daysOfWeekAvailable = [];

function bindScheduleDateControlsForProfile() {
    var dNext = new Date();
    dNext.setMonth(dNext.getMonth() + 6);
    dNext.setDate(dNext.getDate() + 1);
    $('#profile-schedule-calendar').datetimepicker({
        inline: true,
        format: dateFormat,
        minDate: new Date(),
        maxDate: dNext,
        locale: calculatedUserLocale
    });

    $('#profile-schedule-calendar').on("dp.change", profileDateSelected);
    $('#profile-schedule-calendar').on("dp.update", profileDateSelected);
    $("#profile-schedule-btn-availability,#profile-schedule-btn-away").on("click", toggleAway);
    $("#profile-schedule-blockout-reset").on("click", function (e) {
        e.preventDefault();
        $("#profile-schedule-blocked-start,#profile-schedule-blocked-end").val("");
        $("#profile-schedule-blockout-hint-until").hide();
        $("#profile-schedule-blockout-hint-from").show();
    });
    $("#profile-schedule-blockout-save").on("click", saveBlockoutDate);
    $("#profile-schedule-blockout-hint-until").hide();
    $("#profile-schedule-blockout-hint-from").show();

    loadAvailabilityForEdit();

}
function addAvailability(e) {
    var availabilityType = $("#profile-schedule-type").val();

    //var val = availabilityType === "every" ? $("#profile-schedule-type").attr("data-day") : $("#profile-schedule-type").attr("data-date");
    var val = "";
    if (availabilityType === "every") {
        val = (parseInt($("#profile-schedule-type").attr("data-day")) + moment.localeData(calculatedUserLocale).firstDayOfWeek()).toString();
        if (val === "7")
            val = "0";
    } else
        val = $("#profile-schedule-type").attr("data-date");

    e.preventDefault();
    var error = false;
    var adjustStart = false;
    var adjustEnd = false;
    $("#profile-schedule-times li").each(function (i) {

        if (parseInt($("#profile-schedule-time-start").val()) >= parseInt($(this).attr("data-start")) && parseInt($("#profile-schedule-time-end").val()) <= parseInt($(this).attr("data-end"))) {
            error = true;
            return;
        }

    });
    if (error) {
        bootbox.alert(storyLocalizations["Availability"]["ErrorOverlapping"]);
        return;
    }
    var startTimeInt = parseInt($("#profile-schedule-time-start").val());
    var endTimeInt = parseInt($("#profile-schedule-time-end").val());
    if (isNaN(startTimeInt)) {
        bootbox.alert(storyLocalizations["Availability"]["ErrorFromTime"]);
    } else if (isNaN(endTimeInt)) {
        bootbox.alert(storyLocalizations["Availability"]["ErrorUntilTime"]);
    }
    if (startTimeInt >= endTimeInt) {
        bootbox.alert(storyLocalizations["Availability"]["ErrorBefore"]);
        return;
    }

    if (adjustStart) {
        $("#profile-schedule-time-start").val(startTimeInt + 1);
    }
    if (adjustEnd) {
        $("#profile-schedule-time-end").val(endTimeInt - 1);
    }


    var data = {
        type: availabilityType,
        data: val,
        isAvailable: true,
        startingTime: $("#profile-schedule-time-start").val(),
        endingTime: $("#profile-schedule-time-end").val(),
        startingDate: $("#profile-schedule-date-start").val(),
        endingDate: $("#profile-schedule-date-end").val(),
        userItemKey: $("#userItemKey").val()
    };
    $.ajax({
        url: '/API/Interaction/AddSchedule',
        data: data,
        type: "POST",
        dataType: "json",
        cache: false,
        success: function (result) {
            if (result.Error !== null) {
                if (result.Error.toLowerCase().indexOf("unauthorized") >= 0) {
                    showAuthModal();
                } else {
                    bootbox.alert(result.Error);
                }
                return false;
            }
            if (result.Data === true) {
                loadAvailabilityForEdit();
            } else {
                bootbox.alert(errorMsg);
            }

        }
    });

}

function loadAvailabilityForEdit() {

    var data = {
        userItemKey: $("#userItemKey").val()
    };

    $("#profile-schedule-calendar div.datepicker td.day").removeClass("available");
    $.ajax({
        url: '/API/Interaction/GetScheduleForEdit',
        data: data,
        type: "POST",
        dataType: "json",
        cache: false,
        success: function (result) {
            if (result.Error !== null) {
                if (result.Error.toLowerCase().indexOf("unauthorized") >= 0) {
                    showAuthModal();
                } else {
                    bootbox.alert(result.Error);
                }
                return false;
            }
            currentAvailability = result.Data;
            processAvailabilityForEdit();
            displayBlockedOutdates();
            profileDateSelected({ date: $('#profile-schedule-calendar').data("DateTimePicker").date() }, null);
        }
    });

}
// Blocked Out Date Methods
function displayBlockedOutdates() {

    var content = Mustache.render($("#profile-schedule-blocked-out-times-template").html(), currentAvailability);
    $("#blocked-out-times").html(content);

    if (currentAvailability.DaysBlockedOut.length > 0) {
        $(".blocked-out-time-remove").on("click", removeBlockoutDate);
    } else {
        $("#profile-schedule-calendar td.unavailable").removeClass("unavailable");
    }

    $("input.schedule-blockout").bind({
        keydown: function (e) {
            //console.log(e.which);
            if (e.shiftKey === true) {
                if (e.which === 9) {
                    return true;
                }
                return false;
            }
            if (e.which > 7 && e.which < 10) {
                return true;
            }
            if (e.which > 45 && e.which < 58) {
                return true;
            }
            if (e.which > 36 && e.which < 41) {
                return true;
            }
            if (e.which === 191) {
                return true;
            }

            return false;
        }
    });

}
function saveBlockoutDate(e) {
    e.preventDefault();
    if ($("#profile-schedule-blocked-start").val() === "") {
        bootbox.alert(storyLocalizations["Availability"]["ErrorFromDate"]);
        return false;
    }
    if ($("#profile-schedule-blocked-end").val() === "") {
        bootbox.alert(storyLocalizations["Availability"]["ErrorUntilDate"]);
        return false;
    }

    if (moment($("#profile-schedule-blocked-start").val()).isSameOrAfter(moment($("#profile-schedule-blocked-end").val()))) {
        bootbox.alert(storyLocalizations["Availability"]["ErrorFromDateAfterUntilDate"]);
        return false;
    }

    var data = { fromDate: $("#profile-schedule-blocked-start").val(), thruDate: $("#profile-schedule-blocked-end").val() + " 23:59:59" };
    sendBlockedoutRequest("/API/Interaction/AddBlockedTime", data);
}
function removeBlockoutDate(e) {
    e.preventDefault();
    var data = { id: $(this).attr("data-id") };
    sendBlockedoutRequest("/API/Interaction/RemoveBlockedTime", data);
}
function sendBlockedoutRequest(url, data) {
    $.ajax({
        url: url,
        type: "POST",
        data: data,
        dataType: "json",
        cache: false,
        success: function (result) {
            if (result.Error !== null) {
                if (result.Error.toLowerCase().indexOf("unauthorized") >= 0) {
                    showAuthModal();
                } else {
                    bootbox.alert(result.Error);
                }
                return false;
            }
            if (result.Data === false) {
                bootbox.alert(storyLocalizations["Availability"]["ErrorSaving"]);
            } else {
                loadAvailabilityForEdit();
                $("#profile-schedule-blocked-start").val("");
                $("#profile-schedule-blocked-end").val("");
            }
        },
        error: function (result) {
            bootbox.alert(storyLocalizations["Availability"]["ErrorSaving"]);
        }
    });
}
function toggleAway(e) {
    e.preventDefault();
    $avail = $("#profile-schedule-wizard");
    $away = $("#profile-schedule-blockout");
    if ($avail.hasClass("hidden")) {
        $away.addClass("hidden");
        $avail.removeClass("hidden");
        $("#profile-schedule-btn-availability").addClass("btn-primary");
        $("#profile-schedule-btn-away").removeClass("btn-primary");
        currentMode = "availability";
    } else {
        setAwayAsActive($avail, $away);
    }

}
function setAwayAsActive($avail, $away) {
    $avail.addClass("hidden");
    $away.removeClass("hidden");
    $("#profile-schedule-btn-away").addClass("btn-primary");
    $("#profile-schedule-btn-availability").removeClass("btn-primary");
    currentMode = "away";
}

// /Blocked Out Date Methods

function modifyScheduleForEdit(element) {
    $("#profile-schedule-time-start option[value='" + $(element).attr("data-start") + "']").prop('selected', true);
    $("#profile-schedule-time-end option[value='" + $(element).attr("data-end") + "']").prop('selected', true);

}
function removeScheduleForEdit(element) {
    var data = {
        id: $(element).attr("data-id"),
        addTime: false,
        startingTime: $(element).attr("data-start"),
        endingTime: $(element).attr("data-end")
    };

    var url;
    if ($(element).attr("data-onetime") === "true") {
        url = '/API/Interaction/UpdateScheduleDateForEdit';
    } else {
        url = '/API/Interaction/UpdateScheduleForEdit';
    }

    $.ajax({
        url: url,
        type: "POST",
        data: data,
        dataType: "json",
        cache: false,
        success: function (result) {
            if (result.Error !== null) {
                if (result.Error.toLowerCase().indexOf("unauthorized") >= 0) {
                    showAuthModal();
                } else {
                    bootbox.alert(result.Error);
                }
                return false;
            }
            loadAvailabilityForEdit();
        }
    });
}

function removeTimesForDay(e) {
    var schedules = [];
    var times = [];
    $('input[name="TimesToRemove"]:checked').each(function () {
        var scheduleId = $(this).attr("data-scheduleid");
        var found = false;
        for (var i = 0; i < schedules.length; i++) {
            if (schedules[i].scheduleId === scheduleId) {
                found = true;
                break;
            }
        }

        if (!found) {
            schedules.push({ scheduleId: scheduleId, times: [] });
        }
        _.where(schedules, { scheduleId: scheduleId })[0].times.push($(this).val());
        times.push($(this).next().text());
    });
    var message = storyLocalizations["Availability"]["RemoveEachTimePrompt"];
    message = message.replace("##date##", $("#profile-schedule-wizard").attr("data-currentDay"));
    message = message.replace("##time##", times);
    if (document.getElementById("userItemId"))
        var userItemId = document.getElementById("userItemId").value;
    else userItemId = 0;
    bootbox.confirm(message, function (result) {
        if (result) {
            $.each(schedules, function (i, v) {
                var data = {
                    userItemId: userItemId,
                    scheduleId: v.scheduleId,
                    date: $("#profile-schedule-wizard").attr("data-currentDay"),
                    timesToRemove: v.times
                };
                $.ajax({
                    url: "/API/Interaction/RemoveTimesFromDay",
                    type: "POST",
                    data: data,
                    dataType: "json",
                    cache: false,
                    success: function (result) {
                        if (result.Error !== null) {
                            if (result.Error.toLowerCase().indexOf("unauthorized") >= 0) {
                                showAuthModal();
                            } else {
                                bootbox.alert(result.Error);
                            }
                            return false;
                        }
                        loadAvailabilityForEdit();
                    }
                });
            });
        }
    });


}
function processAvailabilityForEdit() {

    if (typeof (currentAvailability) === "undefined") {
        loadAvailabilityForEdit();
        return;
    }

    for (dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        profileScheduleTimes[dayOfWeek] = {};
        daysOfWeekAvailable[dayOfWeek] = false;
    }
    var recurring = Object.keys(currentAvailability.DaysRecurring);
    $.each(recurring, function (i, val) {
        var currentDayNumber = val;

        daysOfWeekAvailable[currentDayNumber] = true; // There is data, it's available
        var currentDayTimes = currentAvailability.DaysRecurring[currentDayNumber];

        currentDayNumber = (parseInt(currentDayNumber) - moment.localeData(calculatedUserLocale).firstDayOfWeek()).toString();
        if (currentDayNumber === "-1")
            currentDayNumber = "6";

        $.each(currentDayTimes, function (j, timeValue) {

            var day = timeValue;
            var startingDate = new Date();
            var endingDate = new Date();
            endingDate.setMonth(startingDate.getMonth() + 6);
            endingDate.setDate(endingDate.getDate() + 1);

            if (day.StartDate !== null) {
                startingDate = day.StartDate;
            }
            if (day.EndDate !== null) {
                endingDate = day.EndDate;
            }

            if (typeof (profileScheduleTimes[currentDayNumber][day.Id]) === "undefined") {
                profileScheduleTimes[currentDayNumber][day.Id] = { id: day.Id, startDate: day.StartDate, endDate: day.EndDate, times: [], eachTime: [] };

                var currentTime = -1;
                var startTime = -1;
                var endTime = -1;

                $.each(day.Times, function (index, value) {
                    profileScheduleTimes[currentDayNumber][day.Id].eachTime.push({ scheduleId: day.Id, startTime: value, displayStartTime: $("#profile-schedule-time-start option[value='" + value + "']").text(), endTime: value + 1, displayEndTime: $("#profile-schedule-time-end option[value='" + (value + 1) + "']").text() });
                    if (startTime < 0) {
                        startTime = value;
                    }
                    endTime = value + 1;
                });
                profileScheduleTimes[currentDayNumber][day.Id].times.push({ startTime: startTime, endTime: endTime, displayStartTime: $("#profile-schedule-time-start option[value='" + startTime + "']").text(), displayEndTime: $("#profile-schedule-time-end option[value='" + endTime + "']").text() });
            }

            $("#profile-schedule-calendar div.datepicker td.day[data-dow='" + currentDayNumber + "']").each(function () {
                var currentDay = Date.parse($(this).attr("data-day"));
                if (profileScheduleTimes[currentDayNumber][day.Id].times.length > 0 && currentDay >= Date.parse(startingDate) && currentDay < Date.parse(endingDate)) {
                    $(this).addClass("available");
                }
            });
        });
    });

    for (var key in currentAvailability.DaysRecurringExclusion) {
        $daytd = $("#profile-schedule-calendar div.datepicker td.day[data-day='" + key + "']");
        if ($daytd.length > 0) { // Day may not be visible currently
            if (Object.keys(profileScheduleTimes[parseInt($daytd.attr("data-dow"))]).length === currentAvailability.DaysRecurringExclusion[key].length) {
                $daytd.removeClass("available");
            }
        }
    }
    // One-Time Dates
    for (var key in currentAvailability.DaysOneTime) {
        var val = currentAvailability.DaysOneTime[key];
        if (val.Times.length > 0 && Date.parse(key) >= new Date()) {
            $("#profile-schedule-calendar div.datepicker td.day[data-day='" + key + "']").addClass("available");
        }
    }

    // Blocked Out Days
    for (var key in currentAvailability.DaysBlockedOut) {
        if (key !== "clean") {
            var val = currentAvailability.DaysBlockedOut[key];
            var startingDate = val.DateStarting;
            var endingDate = val.DateEnding;

            var numberOfDays = (moment(endingDate) - moment(startingDate)) / 86400000; // 86400000 = milliseconds in a day

            for (var i = 0; i <= numberOfDays; i++) {
                $(".datepicker-days td[data-day='" + moment(startingDate).add(i, 'days').format(dateFormat) + "']").addClass("unavailable");
            }
        }
    }

}

function profileDateSelected(newDate, oldDate) {
    var curDate;
    var currentDayOfWeek;
    if (newDate.date !== null && newDate.change !== "M") {

        curDate = newDate.date.format("MM/DD/YYYY");
        currentDayOfWeek = newDate.date.format("dddd");
        var currentDay = newDate.date.format(dateFormat);
        var currentDayOfWeekNumber = newDate.date.format("e");
        var thisDay = Date.parse(newDate.date);
        var data = {
            selectedDate: currentDay,
            selectedDay: currentDayOfWeek,
            dayOfWeek: currentDayOfWeekNumber,
            templateType: "profile"

        };
        $("#profile-schedule-instructions").addClass("hidden");

        if (currentMode === "availability") {
            var content = Mustache.render($("#profile-schedule-template").html(), data);
            $("#profile-schedule-wizard").html(content);
            $("#profile-schedule-wizard").removeClass("hidden");


            $("#profile-add-availability").on("click", addAvailability);

            $("#profile-schedule-data-start").val(currentDay);
        } else {

            if ($("#profile-schedule-blocked-start").val() === "" || moment(currentDay).isSameOrBefore(moment($("#profile-schedule-blocked-start").val()))) {
                $("#profile-schedule-blocked-start").val(currentDay);
                $("#profile-schedule-blocked-end").val("");
                $("#profile-schedule-blockout-hint-until").show();
                $("#profile-schedule-blockout-hint-from").hide();
            } else {
                $("#profile-schedule-blocked-end").val(currentDay);
                $("#profile-schedule-blockout-hint-until").hide();
                $("#profile-schedule-blockout-hint-from").hide();
            }
        }

    }
    if (currentAvailability === null) {
        loadAvailabilityForEdit();
        return;
    }
    processAvailabilityForEdit();
    if ($(".datepicker-days td[data-day='" + currentDay + "']").hasClass("unavailable")) {
        $avail = $("#profile-schedule-wizard");
        $away = $("#profile-schedule-blockout");
        setAwayAsActive($avail, $away);
        $("#profile-schedule-btn-availability").hide();
    } else {
        $("#profile-schedule-btn-availability").show();
    }
    var timesToShow = [];
    var eachTimeToShow = [];

    for (var schedules in profileScheduleTimes[currentDayOfWeekNumber]) {
        var schedule = profileScheduleTimes[currentDayOfWeekNumber][schedules];
        if ((schedule.startDate === null && schedule.endDate === null) || (Date.parse(schedule.startDate) <= thisDay && Date.parse(schedule.endDate) >= thisDay)) {
            if (schedule.startDate !== null) {
                $("#profile-schedule-data-start").val(schedule.startDate);
            }
            if (schedule.endDate !== null) {
                $("#profile-schedule-data-end").val(schedule.endDate);
            }
            if (!_.contains(currentAvailability.DaysRecurringExclusion[curDate], schedule.id)) {
                timesToShow.push(schedule);

                $.each(schedule.eachTime, function () {
                    if (typeof (eachTimeToShow[$(this)[0].startTime] === "undefined")) {
                        eachTimeToShow[$(this)[0].startTime] = $(this)[0];
                    }
                });
            }
        }
    }

    if (typeof (currentAvailability !== "undefined") && typeof (currentAvailability.DaysOneTime[curDate]) !== "undefined") {
        var oneOffTimes = currentAvailability.DaysOneTime[curDate].Times;

        var currentTime = -1;
        var startTime = -1;
        var endTime = -1;
        var oneOffTimesToShow = { id: curDate, OneTimeDate: curDate, times: [], eachTime: [] };
        $.each(oneOffTimes, function (index, value) {
            oneOffTimesToShow.eachTime.push({ scheduleId: 0, oneTimeSchedule: true, startTime: value, displayStartTime: $("#profile-schedule-time-start option[value='" + value + "']").text(), endTime: value + 1, displayEndTime: $("#profile-schedule-time-end option[value='" + (value + 1) + "']").text() });
            if (currentTime > -1) {
                if (currentTime !== value - 1) { // Not a concurrent time
                    endTime = oneOffTimes[index - 1] + 1; // Check if < 0?
                    oneOffTimesToShow.times.push({ oneTimeSchedule: true, startTime: startTime, endTime: endTime, displayStartTime: $("#profile-schedule-time-start option[value='" + startTime + "']").text(), displayEndTime: $("#profile-schedule-time-end option[value='" + endTime + "']").text() });
                    startTime = value;
                    if (index < oneOffTimes.length - 1) {
                        endTime = -1;
                    } else {
                        endTime = value + 1;
                    }
                } else {
                    endTime = value + 1;
                }
            } else {
                startTime = value;
                endTime = value + 1;
            }
            currentTime = value;
        });

        if (currentTime > -1) {
            oneOffTimesToShow.times.push({ oneTimeSchedule: true, startTime: startTime, endTime: endTime, displayStartTime: $("#profile-schedule-time-start option[value='" + startTime + "']").text(), displayEndTime: $("#profile-schedule-time-end option[value='" + endTime + "']").text() });
        }

        if (oneOffTimesToShow.eachTime.length > 0) {
            timesToShow.push(oneOffTimesToShow);
            $.each(oneOffTimesToShow.eachTime, function () {
                if (typeof (eachTimeToShow[$(this)[0].startTime] === "undefined")) {
                    eachTimeToShow[$(this)[0].startTime] = $(this)[0];
                }
            });
        }
    }
    $("#profile-schedule-wizard").attr("data-currentDay", curDate);
    var timeGrid = Mustache.render($("#profile-schedule-time-grid-template").html(), { selectedDate: curDate, dayOfWeek: currentDayOfWeek, schedules: _.sortBy(timesToShow, function (val) { return val.times[0].startTime; }), allTimes: eachTimeToShow });

    $("#profile-schedule-times").empty().append(timeGrid);

    if (_.where(timesToShow, { OneTimeDate: undefined }).length === 0) {
        $("#sessionAvailability").hide();
    } else {
        $("#sessionAvailability").show();
    }

    if (timesToShow.length === 0) {
        $("#profile-schedule-eachtime-remove-block").hide();
    } else {
        $("#profile-schedule-eachtime-remove-block").show();
    }

    $(".profile-schedule-time-remove").on("click", function (e) {
        e.preventDefault();
        var $li = $(this).closest("li");
        var message = storyLocalizations["Availability"]["RemoveRecurringPrompt"];
        message = message.replace("##time##", $(this).closest("li").find(".remove-time").text());
        message = message.replace("##day##", $("#profile-schedule-calendar").data("DateTimePicker").date().format("dddd"));
        bootbox.confirm(message, function (result) {
            if (result) {
                removeScheduleForEdit($li);
            }
        });
    });
    $(".profile-schedule-time-modify").on("click", function (e) {
        e.preventDefault();
        modifyScheduleForEdit($(this).closest("li"));
    });
    $('#profile-schedule-time-eachtime-remove').on("click", function (e) {
        e.preventDefault();
        removeTimesForDay(e);
    });
}

function bindInteractionRequestSummary() {
    $.each($("[data-type='InteractionRequest']"), function (index, item) {
        getInteractionRequests($(item).attr("data-interactiontype"), $(item).attr("data-interactionhost"), $("#token").val(), $(item).attr("data-interactionmaxsessions"), item);
    });
}

function getInteractionRequests(type, host, token, maxSessions, container) {

    if (typeof userToken !== 'undefined' && userToken === "GUEST")
        return;

    if (maxSessions === undefined || maxSessions === null || parseInt(maxSessions) === 0) {
        maxSessions = 2;
    }

    var params = { HostToken: host, InteractionType: type, MaxSessions: 2, StoryToken: token };

    $.ajax({
        url: "/Api/Interaction/InteractionRequestSummary",
        data: params,
        type: "POST",
        cache: false,
        success: function (data) {
            if (data.Error != null) {
                bootbox.alert(data.Error);
                return false;
            } else {
                $(container).html(data);
            }
        }
    });
}

/******************** Edit Profile Begin****************************/

var currentMode = "availability";

var sortedAvailabilityList;

$(document).ready(function () {
    initializeScheduleAvailabilityEvents();
});

function initializeScheduleAvailabilityEvents() {

    $("#profile-schedule-btn-away").prop("disabled", false);

    inititalizeDeleteScheduleEvents();

    $(document).on('click', '#profile-save-availability', function (e) {
        e.preventDefault();

        saveSchedule();
    });

    $(document).on('dp.change', '.availabilityend-date-group.date-picker', function (e) {
        onEndDateChanged();
    });

    $(document).on('change', '.profile-recurrence', function () {
        resetScheduleFormDefaultConfiguration();
    });

    $(document).on('change', '.js-profile-duration', function () {
        resetDurationEndDateConfiguration();
    });

    $(document).on('click', '#profile-clear-availability', function (e) {
        e.preventDefault();
        clearScheduleFormFields();
        resetScheduleFormDefaultConfiguration();
    });

    $(document).on('click', ':not(".delete-each-schedule") .schedule-time-container ', function () {
        setScheduleFormValues(this);
    });

    $(document).on('click', '.js-profile-all-day', function () {
        if ($(this).is(":checked")) {
            disableScheduleTimeValues(this);
        }
        else {
            resetScheduleTimeValues(this);
        }
    });

    $(document).on('click', '.next-month', function (e) {

        $(this).closest(".month-wrapper").removeClass("active");
        $(this).closest(".month-wrapper").hide().next('.month-wrapper').addClass("active").show();
        $(".month-wrapper.active").find(".previous-month").show();

        if ($(".month-wrapper.active").next('.month-wrapper').length === 0) {
            $(".month-wrapper.active").find(".next-month").hide();
        }
        else {
            $(".month-wrapper.active").next('.month-wrapper').find(".next-month").show();
        }
    });

    $(document).on('click', '.previous-month', function (e) {
        $(this).closest(".month-wrapper").removeClass("active").hide().prev('.month-wrapper').show();
        $(".month-wrapper.active").find(".next-month").show();
    });

}

function inititalizeDeleteScheduleEvents() {

    $(document).on('click', '.delete-each-schedule', function (e) {

        e.preventDefault();
        clearScheduleFormFields();
        e.stopPropagation()
        displayDeleteOptionsForEach(this);
    });

    $(document).on('click', '.delete-day-schedule', function (e) {

        e.preventDefault();
        clearScheduleFormFields();
        displayDeleteOptionsForDay(this);
    });

    $(document).on('click', '.delete-entire-schedule', function (e) {

        e.preventDefault();

        bootbox.confirm(
            {
                title: '&#160;', //Generate empty .modal-header for layout.
                message: '<div class="profile-modal-text">' + storyLocalizations["Availability"]["DeleteAllScheduleMessage"] + '</div>',
                buttons: {
                    confirm: {
                        label: storyLocalizations["Availability"]["DeleteScheduleModalDeleteButton"],
                        className: 'btn-primary'
                    },
                    cancel: {
                        label: storyLocalizations["SiteStrings"]["Cancel"],
                        className: 'pull-right btn-link'
                    }
                },
                callback: function (result) {
                    if (result) {
                        deleteEntireSchedule();
                        clearScheduleFormFields();
                    }
                }
            });


    });

    $(document).on('click', '.js-confirm-delete-schedule', function (e) {

        var deleteScheduleArray = [];
        e.preventDefault();
        $(".delete-day-schedule-option:checked").each(function () {
            var option = this;
            var deletecontainer = $(option).closest(".delete-day-schedule-container").find(".delete-day-schedule-time-container");

            var recurring = $(deletecontainer).attr("data-isrecurring");
            var scheduleId = $(deletecontainer).attr("data-scheduleid");
            var selectedDate = $(deletecontainer).attr("data-startdate");
            var recurringType = "";
            if (recurring == "true") {
                if ($(option).val() == "single") {
                    recurringType = "TimeSlot";
                }
                else if ($(option).val() == "series") {
                    recurringType = "EntireSeries";
                }
            }
            else {
                recurringType = "NonRecurring";
            }

            if (recurringType !== "") {
                var deleteEachSchedule = {};
                deleteEachSchedule.ScheduleId = scheduleId;
                deleteEachSchedule.SelectedDate = selectedDate;
                deleteEachSchedule.RecurringType = recurringType;
                deleteScheduleArray.push(deleteEachSchedule);
            }
        });

        deleteScheduleList(deleteScheduleArray);
        $("#deleteDayScheduleModal").modal("hide");

    });

}

function displayDeleteOptionsForDay(obj) {

    var containers = $(obj).closest(".schedule-all-time-container").find(".schedule-time-container");

    var scheduleIds = $.map(containers, function (e) {
        return $(e).attr("data-scheduleid");
    }).join(", ");

    if (scheduleIds.length > 0) {
        var returnedDate;
        if (sortedAvailabilityList.Data) {
            $.each(sortedAvailabilityList.Data.SortedMonths, function (sortedMonthIndex, item) {
                if (item) {

                    $.each(item.SortedDates, function (sortedDateIndex, element) {
                        if (element.StartDate == $(obj).attr("data-startdate")) {
                            returnedDate = element;
                            return false;
                        }
                    });
                }
            });
        }

        if (returnedDate !== null && returnedDate !== undefined) {

            returnedDate.IsDayDelete = true;
            $.each(returnedDate.Times, function (index, element) {
                if (element.IsRecurring == true) {
                    returnedDate.HasRecurringTimes = true;
                    returnedDate.RecurringDeleteMessage = storyLocalizations["Availability"]["RecurrringDeleteMessage"];
                }
                else {
                    returnedDate.NonRecurringDeleteMessage = storyLocalizations["Availability"]["NonRecurrringDeleteMessage"];
                }
            });

            var content = Mustache.render($("#deleteAvailabilityDisplayTpl").html(), returnedDate);
            $(".js-delete-day-schedule-modal-body").html(content);
            $("#deleteDayScheduleModal").modal();

            //Init tooltip in modal for recurrence
            $('[data-toggle="tooltip"]').tooltip();

        }
    }
}

function displayDeleteOptionsForEach(obj) {

    var container = $(obj).closest(".schedule-time-container");
    var returnedDate = null;
    var returnedTimes = null;
    // this makes a clone of the object. this was done since we are extracting only the required date from the master sorted list
    var newSortedAvailabilityList = jQuery.extend(true, {}, sortedAvailabilityList);

    if (newSortedAvailabilityList.Data) {
        $.each(newSortedAvailabilityList.Data.SortedMonths, function (sortedMonthIndex, item) {
            if (item) {
                $.each(item.SortedDates, function (sortedDateIndex, element) {
                    if (element.StartDate == $(container).attr("data-startdate")) {
                        returnedDate = element;
                        return false;
                    }
                });
            }
        });

        var selectedDate = returnedDate;
        if (returnedDate !== null && returnedDate !== undefined) {
            returnedDate.IsDayDelete = false;
            $.each(returnedDate.SortedTimes, function (index, element) {

                if (element.UserItemScheduleId == parseInt($(container).attr("data-scheduleId"))
                    && element.StartTime == parseInt($(container).attr("data-starttime"))
                    && element.EndTime == parseInt($(container).attr("data-endtime"))) {
                    returnedTimes = element;

                    if (element.IsRecurring == true) {
                        selectedDate.HasRecurringTimes = true;
                        selectedDate.RecurringDeleteMessage = storyLocalizations["Availability"]["RecurrringTimeDeleteMessage"];
                    }
                    else {
                        //Doesn't display in Mustache temlate
                        //selectedDate.NonRecurringDeleteMessage = storyLocalizations["Availability"]["NonRecurrringDeleteMessage"];
                    }
                    selectedDate.SortedTimes = [];
                    selectedDate.SortedTimes.push(returnedTimes);

                }
            });

            var content = Mustache.render($("#deleteAvailabilityDisplayTpl").html(), selectedDate);
            $(".js-delete-day-schedule-modal-body").html(content);
            $("#deleteDayScheduleModal").modal();

        }
    }


}

function deleteScheduleList(deleteScheduleArray) {

    var data = {
        deleteScheduleList: deleteScheduleArray,
        userItemKey: $("#userItemKey").val(),
    };

    var url = "/API/Interaction/DeleteScheduleList";


    $.ajax({
        url: url,
        data: data,
        type: "POST",
        dataType: "json",
        cache: false,
        success: function (result) {
            if (result.Error !== null) {
                if (result.Error.toLowerCase().indexOf("unauthorized") >= 0) {
                    showAuthModal();
                } else {
                    bootbox.alert(result.Error);
                }
                return false;
            }
            if (result.Data === true) {
                $("#deleteScheduleModal .delete-schedule-option").prop("checked", false);
                getScheduleListForDisplay();
                $("#deleteScheduleModal").modal('hide');

                $
            } else {
                bootbox.alert(errorMsg);
            }
        }
    });

}

function deleteSchedule(scheduleId, selectedDate, deleteScheduleType) {

    var data = {
        userItemScheduleId: scheduleId,
        userItemKey: $("#userItemKey").val(),
        dateSelected: selectedDate,
        deleteScheduleType: deleteScheduleType
    };

    var url = "/API/Interaction/DeleteSchedule";


    $.ajax({
        url: url,
        data: data,
        type: "POST",
        dataType: "json",
        cache: false,
        success: function (result) {
            if (result.Error !== null) {
                if (result.Error.toLowerCase().indexOf("unauthorized") >= 0) {
                    showAuthModal();
                } else {
                    bootbox.alert(result.Error);
                }
                return false;
            }
            if (result.Data === true) {
                $("#deleteScheduleModal .delete-schedule-option").prop("checked", false);
                getScheduleListForDisplay();
                $("#deleteScheduleModal").modal('hide');

                $
            } else {
                bootbox.alert(errorMsg);
            }
        }
    });

}

function deleteEntireSchedule() {

    var data = {
        userItemKey: $("#userItemKey").val()
    };

    var url = "/API/Interaction/DeleteEntireScheduleForUser";


    $.ajax({
        url: url,
        data: data,
        type: "POST",
        dataType: "json",
        cache: false,
        success: function (result) {
            if (result.Error !== null) {
                if (result.Error.toLowerCase().indexOf("unauthorized") >= 0) {
                    showAuthModal();
                } else {
                    bootbox.alert(result.Error);
                }
                return false;
            }
            if (result.Data === true) {

                getScheduleListForDisplay();

                $
            } else {
                bootbox.alert(errorMsg);
            }
        }
    });

}

function toggleAvailabiltyType(e) {

    e.preventDefault();
    clearScheduleFormFields();
    resetScheduleFormDefaultConfiguration();

    if (currentMode == "availability") {
        $(".schedule-availabilitytype-heading").html(storyLocalizations["Availability"]["AwaySettings"])
        currentMode = "away";
        $("#profile-schedule-btn-away").addClass("active").prop("disabled", true);
        $("#profile-schedule-btn-availability").removeClass("active").prop("disabled", false);
        $(".schedule-availabilitytype-heading")
           .addClass("heading-away")
           .removeClass("heading-available");

    } else {
        $(".schedule-availabilitytype-heading").html(storyLocalizations["Availability"]["AvailabilitySettings"])
        $("#profile-schedule-btn-availability").addClass("active").prop("disabled", true);
        $("#profile-schedule-btn-away").removeClass("active").prop("disabled", false);
        $(".schedule-availabilitytype-heading")
            .addClass("heading-available")
            .removeClass("heading-away");
        currentMode = "availability";
    }


}

function setToggleAvailability() {

    if (currentMode == "away") {
        $(".schedule-availabilitytype-heading").html(storyLocalizations["Availability"]["AwaySettings"])
        currentMode = "away";
        $("#profile-schedule-btn-away").addClass("active").prop("disabled", true);
        $("#profile-schedule-btn-availability").removeClass("active").prop("disabled", false);
        $(".schedule-availabilitytype-heading")
            .addClass("heading-away")
            .removeClass("heading-available");

    } else {
        $(".schedule-availabilitytype-heading").html(storyLocalizations["Availability"]["AvailabilitySettings"])

        $("#profile-schedule-btn-availability").addClass("active").prop("disabled", true);
        $("#profile-schedule-btn-away").removeClass("active").prop("disabled", false);
        $(".schedule-availabilitytype-heading")
                    .addClass("heading-available")
                    .removeClass("heading-away");
        currentMode = "availability";
    }
}

function clearScheduleListDatesSelection() {
    var container = $(".media-list .js-schedule-dates-container");
    var timecontainer = $(".schedule-time-container");

    $(container).removeClass("active");
    $(timecontainer).removeClass("active");

    //$(timecontainer).css('background-color', $(timecontainer).attr("data-default-background-color")).css("font-weight", "");
    $(container).css('background-color', '').css("font-weight", "");

    //$(container).find(".lead").css("font-weight", "");
}

function disableScheduleTimeValues() {
    $("#profile-schedule-time-start").val("0");
    $("#profile-schedule-time-end").val("24");
    $("#profile-schedule-time-start").attr("disabled", true);
    $("#profile-schedule-time-end").attr("disabled", true);
}

function resetScheduleTimeValues(obj) {
    $("#profile-schedule-time-start").val("");
    $("#profile-schedule-time-end").val("");
    $("#profile-schedule-time-start").removeAttr("disabled");
    $("#profile-schedule-time-end").removeAttr("disabled");
}

function setScheduleFormValues(obj) {

    clearScheduleFormFields();

    // set availabilty mode
    currentMode = "availability";
    if ($(obj).attr("data-isblocked") == "true") {
        currentMode = "away";
    }

    // this is for the list on the right. This needs to be moved to a class
    $(obj).closest(".js-schedule-dates-container").addClass("active");
    $(obj).addClass("active").addClass("");

    $("#userscheduleitemid").val($(obj).attr("data-scheduleid"));


    $("#originalstartdate").val($(obj).attr("data-original-startdate"));
    // start and end dates
    var startDate = setMomentDate($(obj).closest(".js-schedule-dates-container").find(".schedule-individual-date-container").attr("data-startdate"), storyLocalizations["SiteStrings"]["DateFormat"]);
    $(".availabilitystart-date-group").data("DateTimePicker").date(startDate);
    var endDate = setMomentDate($(obj).attr("data-enddate"), storyLocalizations["SiteStrings"]["DateFormat"]);
    $(".availabilityend-date-group").data("DateTimePicker").date(endDate)
    $(".availability-duration-end-date-group").data("DateTimePicker").date(endDate);
    // start and edn times
    $("#profile-schedule-time-start").val($(obj).attr("data-starttime"));
    $("#profile-schedule-time-end").val($(obj).attr("data-endtime"));
    //// recurrence

    $(".profile-recurrence").val($(obj).attr("data-recurrence"));
    // duration

    $(".js-profile-duration").val($(obj).attr("data-duration"));




    // day of week
    $(".day-of-week-row").addClass("hide");
    $(".js-profile-duration-row").addClass("hide");
    $(".js-profile-duration-end-date-row").addClass("hide");

    if ($(obj).attr("data-recurrence") == "3") {
        $(".day-of-week-row").removeClass("hide");
        $(".js-profile-duration-row").removeClass("hide");
        $(".js-profile-duration-end-date-row").removeClass("hide");
    }

    if ($(obj).attr("data-dayofweek") !== "") {
        $(".day-of-week-group .day-of-week-parent").removeClass("active");
        var dayofweekArray = $(obj).attr("data-dayofweek").split(',');
        for (var i = 0; i < dayofweekArray.length; i++) {
            $(".day-of-week-group .day-of-week-parent").each(function () {
                if ($(this).attr("value") == dayofweekArray[i]) {
                    $(this).addClass("active");
                }
            });;
        }
    }


    // disable start and end time if all day
    if ($("#profile-schedule-time-start").val() === "0" && $("#profile-schedule-time-end").val() === "24") {
        $(".js-profile-all-day").prop("checked", true);
        disableScheduleTimeValues();
    }


    // end by based on duration
    if ($(obj).attr("data-duration") == "2") {
        $(".availability-duration-end-date-group").data("DateTimePicker").date(endDate)
    }
    else {
        resetDurationEndDateConfiguration();
    }

    setToggleAvailability();
}


function saveSchedule() {
    if (!validateScheduleFormFields()) return;

    //$('#profile-save-availability').button('saving');
    var $this = $("#profile-save-availability");
    $this.button('loading');

    setTimeout(function () {
        if ($("#userscheduleitemid").val() != "") {
            updateSchedule();
            $('#profile-save-availability').button('reset');
        }
        else {
            addSchedule();
            $('#profile-save-availability').button('reset');
        }
    }, 3000);

}

function updateSchedule() {

    var recurrence = $(".profile-recurrence").val();

    //var val = availabilityType === "every" ? $("#profile-schedule-type").attr("data-day") : $("#profile-schedule-type").attr("data-date");
    var recurrenceValue = "";

    if (recurrence === "3") {
        var arr = {}
        var arr = $('.day-of-week-parent.active').map(function () {
            return $(this).attr("value");
        }).get();
        recurrenceValue = arr.toString();

        if (recurrenceValue === "") {
            bootbox.alert(storyLocalizations["Availability"]["RecurrenceValue"]);
            return false;
        }
    }

    var startdate = $(".profile-schedule-start-date").val();

    if ($("#userscheduleitemid").val() !== "") {
        startdate = $("#originalstartdate").val();
    }

    var endDate = $(".profile-schedule-end-date").val();

    if ($(".js-profile-duration").val() == "2") {
        if ($(".profile-schedule-duration-end-date").val() !== "") {
            endDate = $(".profile-schedule-duration-end-date").val();
        }
    }

    var data = {
        userItemScheduleId: $("#userscheduleitemid").val(),
        recurrence: $(".profile-recurrence").val(),
        chooseDays: recurrenceValue,
        startingTime: $("#profile-schedule-time-start").val(),
        endingTime: $("#profile-schedule-time-end").val(),
        startingDate: startdate,
        endingDate: endDate,
        userItemKey: $("#userItemKey").val(),
        isBlocked: (currentMode == "away"),
        duration: $(".js-profile-duration").val()
    };

    // 'Does Not Repeat' gets no bootbox
    if ($(".profile-recurrence").val() === "1") {
        $.ajax({
            url: "/API/Interaction/UpdateSchedule",
            data: data,
            type: "POST",
            dataType: "json",
            cache: false,
            success: function (result) {
                if (result.Error !== null) {
                    if (result.Error.toLowerCase().indexOf("unauthorized") >= 0) {
                        showAuthModal();
                    } else {
                        bootbox.alert(result.Error);
                        $('#profile-save-availability').button('reset');
                    }
                    return false;
                }
                if (result.Data === true) {
                    clearScheduleFormFields();
                    getScheduleListForDisplay();
                } else {
                    bootbox.alert(errorMsg);
                }
                $('#profile-save-availability').button('reset');
            }

        });
        return true;
    };

    bootbox.confirm(storyLocalizations["Availability"]["ConfirmUpdateAvailability"], function (result) {
        if (result) {
            $.ajax({
                url: "/API/Interaction/UpdateSchedule",
                data: data,
                type: "POST",
                dataType: "json",
                cache: false,
                success: function (result) {
                    if (result.Error !== null) {
                        if (result.Error.toLowerCase().indexOf("unauthorized") >= 0) {
                            showAuthModal();
                        } else {
                            bootbox.alert(result.Error);
                        }
                        $('#profile-save-availability').button('reset');
                        return false;
                    }
                    if (result.Data === true) {
                        clearScheduleFormFields();
                        getScheduleListForDisplay();
                    } else {
                        bootbox.alert(errorMsg);
                        $('#profile-save-availability').button('reset');

                    }

                }

            });
            return true;
        }
        return true;
    });



}

function addSchedule() {

    var recurrence = $(".profile-recurrence").val();

    //var val = availabilityType === "every" ? $("#profile-schedule-type").attr("data-day") : $("#profile-schedule-type").attr("data-date");
    var recurrenceValue = "";

    if (recurrence === "3") {
        var arr = {}
        var arr = $('.day-of-week-parent.active').map(function () {
            return $(this).attr("value");
        }).get();
        recurrenceValue = arr.toString();


        if (recurrenceValue === "") {
            bootbox.alert(storyLocalizations["Availability"]["RecurrenceValue"]);
            return false;
        }
    }
    var startdate = $(".profile-schedule-start-date").val();

    if ($("#userscheduleitemid").val() !== "") {
        startdate = $("#originalstartdate");
    }

    var endDate = $(".profile-schedule-end-date").val();

    if ($(".js-profile-duration").val() == "2") {
        if ($(".profile-schedule-duration-end-date").val() !== "") {
            endDate = $(".profile-schedule-duration-end-date").val();
        }
    }

    var data = {
        recurrence: $(".profile-recurrence").val(),
        chooseDays: recurrenceValue,
        startingTime: $("#profile-schedule-time-start").val(),
        endingTime: $("#profile-schedule-time-end").val(),
        startingDate: startdate,
        endingDate: endDate,
        userItemKey: $("#userItemKey").val(),
        isBlocked: (currentMode == "away"),
        duration: $(".js-profile-duration").val()
    };

    $.ajax({
        url: "/API/Interaction/AddSchedule",
        data: data,
        type: "POST",
        dataType: "json",
        cache: false,
        success: function (result) {
            if (result.Error !== null) {
                if (result.Error.toLowerCase().indexOf("unauthorized") >= 0) {
                    showAuthModal();
                } else {
                    bootbox.alert(result.Error);
                }
                return false;
            }
            if (result.Data === true) {
                clearScheduleFormFields();
                getScheduleListForDisplay();
            } else {
                bootbox.alert(errorMsg);
                $('#profile-save-availability').button('reset');
            }

        },
    });
}



function validateScheduleFormFields() {
    var startTimeInt = parseInt($("#profile-schedule-time-start").val());
    var endTimeInt = parseInt($("#profile-schedule-time-end").val());

    if ($(".profile-schedule-start-date").val() === "") {
        bootbox.alert(storyLocalizations["Availability"]["ErrorFromDate"]);
        $('#profile-save-availability').button('reset');
        return false;
    }
    if (isNaN(startTimeInt)) {
        bootbox.alert(storyLocalizations["Availability"]["ErrorFromTime"]);
        $('#profile-save-availability').button('reset');
        return false;
    } else if (isNaN(endTimeInt)) {
        bootbox.alert(storyLocalizations["Availability"]["ErrorUntilTime"]);
        $('#profile-save-availability').button('reset');
        return false;
    }
    if (startTimeInt >= endTimeInt) {
        bootbox.alert(storyLocalizations["Availability"]["ErrorBefore"]);
        $('#profile-save-availability').button('reset');
        return false;
    }

    if ($(".profile-recurrence").val() === "") {
        bootbox.alert(storyLocalizations["Availability"]["ErrorRecurrence"]);
        $('#profile-save-availability').button('reset');
        return false;
    }


    if ($(".js-profile-duration-row").is(":visible") && $(".js-profile-duration").val() == "2"
        && ($(".profile-schedule-duration-end-date").val() == "" && $(".profile-schedule-end-date").val() === "")) {
        bootbox.alert(storyLocalizations["Availability"]["RequiredEitherEndDate"]);
        return false;
    }

    return true;


}

function resetScheduleFormDefaultConfiguration() {

    $(".js-profile-all-day").prop("checked", false);
    $(".day-of-week-row").addClass("hide");
    $(".js-profile-duration-row").addClass("hide");
    $(".js-profile-duration-end-date-row").addClass("hide");

    $(".js-profile-duration").val("");
    resetDurationEndDate();

    if ($(".profile-recurrence").val() == "3") {
        // weekly
        $(".day-of-week-row").removeClass("hide")
        $(".js-profile-duration-row").removeClass("hide");

    }
    else {
        $(".day-of-week-parent").each(function () {
            $(this).removeClass("active");
        });
    }



}

function clearScheduleFormFields() {

    $("#userscheduleitemid").val("");

    $("#originalstartdate").val("");
    $(".profile-recurrence").val("1");
    $(".js-profile-duration").val("");
    $(".js-profile-duration").val("");
    $(".js-profile-all-day").prop("checked", false);

    $(".day-of-week-group .day-of-week-parent").removeClass("active");

    resetScheduleTimeValues();
    resetDefaultDates();
    clearScheduleListDatesSelection();
    resetScheduleFormDefaultConfiguration($(".profile-recurrence"));

}

function getScheduleListForDisplay() {

    var data = {
        userItemKey: $("#userItemKey").val()
    };

    $("#profile-schedule-calendar div.datepicker td.day").removeClass("available");
    $.ajax({
        url: '/API/Interaction/GetScheduleForDisplay',
        data: data,
        type: "POST",
        dataType: "json",
        cache: false,
        success: function (result) {
            if (result.Error !== null) {
                if (result.Error.toLowerCase().indexOf("unauthorized") >= 0) {
                    showAuthModal();
                } else {
                    bootbox.alert(result.Error);
                }

                return false;
            }
            if (result.Data.SortedMonths.length == 0) {
                result.Data.DisplayMessage = true;
                $(".delete-entire-schedule").prop("disabled", true);
                $(".delete-all-schedule").addClass("hidden");
            }
            else {
                $(".delete-entire-schedule").prop("disabled", false);
                $(".delete-all-schedule").removeClass("hidden");
            }


            if (result.Data) {
                $.each(result.Data.SortedMonths, function (i, item) {
                    if (item) {
                        $.each(item.SortedDates, function (i, sortedDate) {

                            $.each(sortedDate.SortedTimes, function (k, sortedTime) {
                                sortedTime.FormattedEndDate = sortedTime.EndDate !== null ? setMomentDate(sortedTime.EndDate, storyLocalizations["SiteStrings"]["DateFormat"]) : "";
                            });
                        });


                    }
                });
            }

            sortedAvailabilityList = result;

            var content = Mustache.render($("#availabilityDisplayTpl").html(), result.Data);
            $(".availabilityDisplay").html(content);

            $('[data-toggle="tooltip"]').tooltip();


            $ds = $(".availabilityDisplay").find(".month-wrapper")
            $ds.hide().eq(0).show();
            $ds.find(".previous-month").hide();

            if ($ds.next('.month-wrapper').length === 0) {
                $ds.find(".next-month").hide();
            }


        }
    });

}

function bindScheduleDateControlsForEditProfile() {

    getScheduleListForDisplay();
    $("#profile-schedule-btn-availability,#profile-schedule-btn-away").on("click", toggleAvailabiltyType);
    setavailabilityType();

}

function setavailabilityType() {

    $("#profile-schedule-instructions").addClass("hidden");

    var dNext = new Date();
    dNext.setMonth(dNext.getMonth() + 6);
    dNext.setDate(dNext.getDate() + 1);

    $('.date-picker').datetimepicker({

        format: dateFormat,
        minDate: new Date(),
        maxDate: dNext,
        useCurrent: false,
        locale: calculatedUserLocale,
        ignoreReadonly: true
    });
    //$('.date-picker').datetimepicker({ format: dateFormat, ignoreReadonly: true });

    $(".availabilitystart-date-group").on("dp.change", function (e) {
        $('.availabilityend-date-group').data("DateTimePicker").minDate(e.date);
        $('.availability-duration-end-date-group').data("DateTimePicker").minDate(e.date);
    });

    $(".availability-duration-end-date-group").on("dp.change", function (e) {
        $('.availabilitystart-date-group').data("DateTimePicker").maxDate(e.date);
    });

    $(".availabilityend-date-group").on("dp.change", function (e) {
        $('.availabilitystart-date-group').data("DateTimePicker").maxDate(e.date);
    });


    $('.date-picker-clear').on('click', function datePickerClear(event) {
        $(this).closest('.date-picker').data("DateTimePicker").date(null);
        $(this).closest('.date-picker').find('.form-control').val('');
    });
}

function resetDefaultDates() {

    var dNext = new Date();
    dNext.setMonth(dNext.getMonth() + 6);
    dNext.setDate(dNext.getDate() + 1);

    $(".availabilitystart-date-group").closest('.date-picker').find('.form-control').val('');
    $(".availabilityend-date-group").closest('.date-picker').find('.form-control').val('');
    $(".availability-duration-end-date-group").closest('.date-picker').find('.form-control').val('');


    $('.availabilitystart-date-group').data("DateTimePicker").date(null);
    $('.availabilityend-date-group').data("DateTimePicker").date(null);
    $('.availabilitystart-date-group').data("DateTimePicker").minDate(new Date());
    $('.availabilitystart-date-group').data("DateTimePicker").maxDate(dNext);
    $('.availabilityend-date-group').data("DateTimePicker").minDate(new Date());
    $('.availabilityend-date-group').data("DateTimePicker").maxDate(dNext);


    $('.availability-duration-end-date-group').data("DateTimePicker").date(null);
    $('.availability-duration-end-date-group').data("DateTimePicker").minDate(new Date());
    $('.availability-duration-end-date-group').data("DateTimePicker").maxDate(dNext);

}

function resetDurationEndDate() {

    var dNext = new Date();
    dNext.setMonth(dNext.getMonth() + 6);
    dNext.setDate(dNext.getDate() + 1);

    if ($(".js-profile-duration").val() === "1") {
        $('.availabilityend-date-group').data("DateTimePicker").date(null);
        $('.availabilityend-date-group').data("DateTimePicker").minDate(new Date());
        $('.availabilityend-date-group').data("DateTimePicker").maxDate(dNext);

    }

    if ($(".js-profile-duration").val() === "") {

        $('.availability-duration-end-date-group').data("DateTimePicker").date(null);
        $('.availability-duration-end-date-group').data("DateTimePicker").minDate(new Date());
        $('.availability-duration-end-date-group').data("DateTimePicker").maxDate(dNext);
    }
}

function resetDurationEndDateConfiguration() {
    resetDurationEndDate();
    $(".js-profile-duration-end-date-row").addClass("hide");
    if ($(".js-profile-duration").val() == "2") {
        $(".availability-duration-end-date-group").data("DateTimePicker").date($(".profile-schedule-end-date").val());
        $(".js-profile-duration-end-date-row").removeClass("hide");
    }
}

function onEndDateChanged() {

    //$(".profile-recurrence").val("3");
    //$(".js-profile-duration").val("2");
    //$(".availability-duration-end-date-group").data("DateTimePicker").date($(".profile-schedule-end-date").val());
    //$(".js-profile-duration-row").removeClass("hide");
    //$(".day-of-week-row").removeClass("hide")
    //$(".js-profile-duration-end-date-row").removeClass("hide");
}

/******************** Edit Profile End****************************/




//IIFE - Use IIFE to encapsulate application logic to protect it from the global namespace 
//If you want to expose public functions convert the IIFE to the "Revealing Module Pattern"
(function () {
    "use strict";

    var configBotConnection = mec.globalConfig.chatbot.botConnection,
        configUser = mec.globalConfig.chatbot.user,
        configBot = mec.globalConfig.chatbot.bot;

    var botConnection = new BotChat.DirectLine({ secret: configBotConnection.secret, token: configBotConnection.token }, configBotConnection.domain),        user = { id: configUser.id, name: configUser.name, isNewSession: configUser.isNewSession },
        bot = { id: configBot.id, name: configBot.name };

    if ($('#mec-chatbot').length) {
        initChatBot();
        initChatBotContainerEvents();
    }

    function initChatBot() {
        BotChat.App({ botConnection: botConnection, user: user, bot: bot }, document.getElementById("uxMecChatBot"));
    }

    function initChatBotContainerEvents() {

        var chatMethods = new BotChat.PublicMethods({ botConnection: botConnection, user: user, bot: bot });
        // Get saved data from session cookie or set to false
        var userStartedChat = (getCookie('userStartedChat') === "true");
        var isCurrentSession = (user.isNewSession === "False");
        var isChatStarted = isCurrentSession && userStartedChat;

        if (isChatStarted) {
            $('#mec-chat-button').html(storyLocalizations.ChatBot.ButtonTextChatContinue);
        }

        //Prevent button text from displaying until we know what text should be displayed
        $('.mec-chat-button-text').removeClass('invisible');

        $('.js-click-chatbot-toggle').on('click', function () {
            resizeDiv('#mec-chatbot');
            $('#mec-chatbot').show(function () {

                if (!isChatStarted) {
                    chatMethods.sendMessage('hi');
                } else {
                    chatMethods.autoScroll();
                }
                createCookie('userStartedChat', true);
                document.body.addEventListener('click', chatCloser, false);
            });
        });

        $('#mec-chatbot').on('click', '.js-click-chat-close', function (e) {
            chatCloser(e);
        });

        if ($('#mec-chatbot')) {
            $(window).resize(function () {
                resizeDiv('#mec-chatbot');
            });
        }

    }

    function chatCloser(e) {

        var $panel = $('#mec-chatbot');

        if ((e.target.id !== $panel.attr('id') && !$panel.has(e.target).length) || $(e.target).hasClass('js-click-chat-close')) {
            $('#mec-chat-button').html(storyLocalizations.ChatBot.ButtonTextChatContinue);

            document.body.removeEventListener('click', chatCloser, false);
            $('#mec-chatbot').hide(function () {

            });
        }
    }

    function resizeDiv(targetElement) {
        var vpw = $(window).width();
        var vph = $(window).height();

        var $element = $(targetElement);
        var $chatbotContainer = $element.closest('.chatbot-container')[0];

        var finalDivHeight = 0;

        //Add current viewport height
        finalDivHeight += vph;

        if ($chatbotContainer) {
            //Subtract elements position from top of viewport
            finalDivHeight -= $chatbotContainer.getBoundingClientRect().top;
        }

        //Set div to be a percentage of remaining height
        finalDivHeight *= .9;

        $element.css({ 'height': finalDivHeight + 'px' });
    }

})();

//IIFE - Use IIFE to encapsulate application logic to protect it from the global namespace 
//If you want to expose public functions convert the IIFE to the "Revealing Module Pattern"
(function () {
    "use strict";

    //If the user is a guest and the info-box-container exists initilize the info box
    if (mec.globalConfig.isGuestUser) {
        initInfoBox();
        initInfoBoxEvents();
    }

    function initInfoBox()
    {
        var $templateID = $('[data-info-box-target="sign-in-reminder"]').attr('data-info-box-template');
        var $infoBoxTemplate = $('#' + $templateID).html();

        var options = {
            animation: false,
            container: '.navbar-signin-container',
            template: $infoBoxTemplate,
            title: 'none',
            content: 'none',
            placement: 'auto bottom',
            trigger: 'manual'
        }

        $('[data-info-box-target="sign-in-reminder"]').popover(options);
    }

    function initInfoBoxEvents() {

        // Get saved data from session cookie or set default to false
        var userDismissedInfoBox = !!getCookie('userDismissedInfoBox');

        if (!userDismissedInfoBox) {
            setTimeout(function () {
                openInfoBox();
            }, 5000);
        }

        $('.navbar-signin-container').on('click', '.js-on-click-info-box-close', function (e) {

            $(e.delegateTarget).find('.popover').removeClass('in');
            //Wait for CSS animation to complete before removing popover
            setTimeout(function () {
                $('[data-info-box-target="sign-in-reminder"]').popover('hide');
            }, 300);

            //Check if user manually closed info box
            //If so, don't display it again for this user session
            userDismissedInfoBox = true;
            createCookie('userDismissedInfoBox', userDismissedInfoBox);
        });

        $('.navbar-signin-container').on('click', '.js-on-click-user-join, .js-on-click-user-sign-in', function (e) {

            $(e.delegateTarget).find('.popover').removeClass('in');
            //Wait for CSS animation to complete before removing popover
            setTimeout(function () {
                $('[data-info-box-target="sign-in-reminder"]').popover('hide');
            }, 300);
        });

    }

    function openInfoBox() {        // If user clicks outside the info box close it
        //document.body.addEventListener('click', infoBoxCloser, false);

        $('[data-info-box-target="sign-in-reminder"]').popover('show');
    };

    function infoBoxCloser(e) {
        var $panel = $('.info-box-content-container');
        var $target = $(e.target);

        if ((e.target.id !== $panel.attr('id') && !$panel.has(e.target).length) || $target.hasClass('js-on-click-info-box-close') || $target.closest('.js-on-click-info-box-close').length) {
            
            document.body.removeEventListener('click', infoBoxCloser, false);
            $('[data-info-box-target="sign-in-reminder"]').popover('hide');
        }
    }

})();

/* 
Extending bootstrap's collapse code
*/ 

function togglePlusMinusIcon(e) {
    $(e.target)
        .parent()
        .find('.plus-minus')
        .toggleClass('ezicon-plus-max ezicon-minus-min');
}
$(document).on('hidden.bs.collapse', '.collapse', togglePlusMinusIcon);
$(document).on('shown.bs.collapse', '.collapse', togglePlusMinusIcon);
(function ($) {
    var EzRotateTile = (function () {
        function EzRotateTile(element, options) {
            this.$wrapper = $(element);
            this.$tiles = this.$wrapper.children().not('.col-xs-12').detach();
            this.tilesLength = this.$tiles.length;
            this.opts = options;
            this.page = 0;
            this.intervalID = null;
            this.browserSize = window.innerWidth;
            this.calculateTotal();
            this.init();
        }
        EzRotateTile.prototype.init = function () {
            this.determinePage();
            this.showHideTiles();
            this.addArrow();
            this.bindEvent();
            this.startRotate();
            this.hideOrShowArrow();
        };
        EzRotateTile.prototype.calculateTotal = function () {
            this.totalPage = Math.ceil(this.tilesLength / this.opts.perPage) - 1;
        };
        EzRotateTile.prototype.determinePage = function () {
            if (this.opts.samePage) {
                return;
            }

            if (this.opts.formatType === "affiliateduser") {

                if (this.browserSize >= 1200) {
                    this.opts.perPage = 3;
                } else if (this.browserSize >= 992) {
                    this.opts.perPage = 2;
                }
                else if (this.browserSize >= 768) {
                    this.opts.perPage = 2;
                }
                else if (this.browserSize < 768) {
                    this.opts.perPage = 1;
                }

            } else {
                if (this.browserSize >= 1200) {
                    this.opts.perPage = 4;
                } else if (this.browserSize >= 992) {
                    this.opts.perPage = 3;
                }
                else if (this.browserSize >= 768) {
                    this.opts.perPage = 2;
                }
                else if (this.browserSize < 768) {
                    this.opts.perPage = 1;
                }
            }

            this.calculateTotal();
        };
        EzRotateTile.prototype.showHideTiles = function () {
            var offset = (this.page * this.opts.perPage),
                arrows = this.$wrapper.find('.arrow').detach();
            this.$wrapper.html(this.$tiles.slice(offset, offset + this.opts.perPage));
            this.$wrapper.append(arrows);
        };
        EzRotateTile.prototype.onArrowClick = function (e) {
            $(e.target).closest('.arrow').hasClass('right') ? this.page++ : this.page--;
            this.showHideTiles();
            this.hideOrShowArrow();
            if (this.opts.autoRotate) {
                clearInterval(this.intervalID);
                this.startRotate();
            }

            //Lazy Load images
            if( $(e.target).closest('.arrow').hasClass('right') )
                new LazyLoad( { elements_selector: ".bgImgContainer" } );
        };
        EzRotateTile.prototype.hideOrShowArrow = function () {
            this.$leftArrow[this.page === 0 ? 'addClass' : 'removeClass']('hidden');
            this.$rightArrow[this.page === this.totalPage ? 'addClass' : 'removeClass']('hidden');
        };
        EzRotateTile.prototype.startRotate = function () {
            if (!this.opts.autoRotate) {
                return;
            }
            this.intervalID = setInterval($.proxy(this.onEachInterval, this), this.opts.speed);
        };
        EzRotateTile.prototype.onEachInterval = function () {
            this.page++;
            if (this.page > this.totalPage) {
                this.page = 0;
            }
            this.showHideTiles();
            this.hideOrShowArrow();
        };
        EzRotateTile.prototype.addArrow = function () {
            if (this.opts.formatType === "tilecontent" || this.opts.formatType === "affiliateduser") {
                this.$wrapper.append('<a class="btn left arrow hidden"><span class="ezicon ezicon-arrow-prev"></span></a><a class="btn right arrow"><span class="ezicon ezicon-arrow-next"></span></a>');
            } else {
                this.$wrapper.append('<a class="btn left arrow hidden"><<div class="shadow"></div></a><a class="btn right arrow">><div class="shadow"></div></a>');
            }
            
            this.$leftArrow = this.$wrapper.find('.left');
            this.$rightArrow = this.$wrapper.find('.right');
        };
        EzRotateTile.prototype.bindEvent = function () {
            this.$wrapper.find('.arrow').on('click', $.proxy(this.onArrowClick, this));
            $(window).resize($.proxy(this.onBrowserResize, this));
        };
        EzRotateTile.prototype.onBrowserResize = function () {
            this.page = 0;
            //this.browserSize = $(window).width();
            this.browserSize = window.innerWidth;
            this.determinePage();
            this.showHideTiles();
            this.hideOrShowArrow();
        };
        return EzRotateTile;
    })();
    /**
    * ezRotateTile Plugin
    * @param  {Object} options
    * -     see defaults
    */
    $.fn.ezRotateTile = function (options) {
        var opts = $.extend({}, $.fn.ezRotateTile.defaults, options);
        // Iterate and reform each matched element.
        return this.each(function () {
            $(this).children().length <= 3 || $.data(this, 'ezRotateTile', new EzRotateTile(this, opts));
        });
    };
    $.fn.ezRotateTile.defaults = {
        autoRotate: false,
        samePage: false,
        speed: 10000,
        perPage: 3,
        formatType: "default"
    };
})(jQuery);