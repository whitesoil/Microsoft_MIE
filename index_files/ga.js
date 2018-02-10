$(function () {

    if (typeof(ga) == "undefined")
        return;

    var pageUrl = window.location.pathname + (window.location.search != null ? window.location.search : "");

    $(document).on("OnAnalyticsTrackingEvent", function (event, data) {
        try {
            data.Value = data.Value != null ? data.Value : 0;
            data.Action = data.Action != null ? data.Action : "";
            data.Label = data.Label != null ? data.Label : pageUrl;
            if (data.Category.length > 0 && data.Action.length > 0) {
                ga('send', 'event', data.Category, data.Action, data.Label, data.Value);
            } else if (data.Category.length > 0 && data.Action.length == 0 && data.Label != null) {
                // legacy fix when we were passing in label for action
                ga('send', 'event', data.Category, data.Label, null, data.Value);
            }

            // dataLayer updates
            if (data.Category === "SignIn" && data.Action === "Completed") {
                dataLayer.push({ 'event': 'signincomplete' });
            }
            if (data.Category === "Registration" && data.Action === "Completed") {
                dataLayer.push({ 'event': 'registrationcomplete' });
            }

        } catch (e) {

        }
    });

    // add tracking event to the submit button on registration
    if (window.location.pathname.toLowerCase() === '/create-my-account/default.aspx') {

        // set general registration complete event
        ga('send', 'event', 'Registration', 'Started');

        $("body").on("click", "button.submit.btn.btn-primary", function (event) {

            // if user signs up for mystery skype
            if ($("#MysterySkype").is(':checked')) {
                ga('send', 'event', 'Registration', 'Mystery Skype Selected', pageUrl);
            }

            // if user signs up for mystery skype
            if ($("#IsGuestSpeaker").is(':checked')) {
                ga('send', 'event', 'Registration', 'Guest Speaker Selected', pageUrl);
            }          

            // set general registration complete event
            ga('send', 'event', 'Registration', 'Completed');

        });
    }

    if (window.location.pathname.toLowerCase() === '/status/public') {

        // add tracking event to the add skype contact link
        $("body").on('click', "#addSkypeContact", function (event) {
            ga('send', 'event', 'Profile', 'Add Skype Contact', pageUrl);
        });

        // add tracking event to the add skype contact link
        $("body").on('click', "#followUser", function (event) {
            ga('send', 'event', 'Profile', 'Follow User', pageUrl);
        });
        
    }

    $(document).on("OnStoryRenderComplete", function (event, modules) {

        if (story != null) {
       
            // report event for displaying recommendations
            if ($(".module[data-module-type='Recommended']").length > 0) {

                // add tracking event for recommendation click
                $(".module[data-module-type='Recommended']").on('click', "div.tile[data-recommended='true']", function (event) {
                    ga('send', 'event', 'Recommendation', 'Clicked-Bottom', $(this).find("a").attr("href"));
                });

                // add tracking event for compact widget recommendation click
                $(".module[data-module-type='Recommended']").on('click', ".recommended-aside.sticky .compact-recommendedbuttons li a[data-recommended='true']", function (event) {
                    ga('send', 'event', 'Recommendation', 'Clicked-Widget', $(this).find("a").attr("href"));
                });

                // add tracking event for expanded widget recommendation click
                $(".module[data-module-type='Recommended']").on('click', ".recommended-aside.sticky .expanded-recommendedbuttons li a[data-recommended='true']", function (event) {
                    ga('send', 'event', 'Recommendation', 'Clicked-Widget-Expanded', $(this).find("a").attr("href"));
                });

            }

            if ($(".module[data-module-type='TileContent']").length > 0) {
                // add tracking event for recommendation click
                $(".module[data-module-type='TileContent']").on('click', "div.tile-content[data-recommended='true']", function (event) {
                    ga('send', 'event', 'PersonalRecommendation', 'Clicked', $(this).find("a").attr("href"), 0);
                });
            }

            // add tracking event for comment submission
            $("body").on('click', "#btnSubmitComment", function (event) {
                ga('send', 'event', 'Content', 'Submit Comment', pageUrl);
            });

            // add tracking event for comment reply submission
            $("body").on('click', ".reply-container .btn-primary", function (event) {
                ga('send', 'event', 'Content', 'Submit Comment', pageUrl);
            });

            $(".metrics-toolbar .glyphicon-star-empty").on('click', function (event) {
                ga('send', 'event', 'Content', 'Favorite', pageUrl);
            });

            $(".metrics-toolbar .ezicon-flag").on('click', function (event) {
                ga('send', 'event', 'Content', 'Flag as Innapropriate', pageUrl);
            });

            $("#story .metrics-toolbar").on("click", '.upvote:not(.upvoted)', function (event) {
                ga('send', 'event', 'Content', 'Up Vote', pageUrl);
            });

        }
    });

});