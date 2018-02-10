var authType = "";
var signInMode = "auth";
var isSaving = false;
var validatorControlList = [];
var validatorControlMessages = [];
var vldControl = {};

$(function () {
    $('#SignInModal').on('show.bs.modal', function (event) {
        var button = $(event.relatedTarget) // Button that triggered the modal
        signInMode = $(button).data("mode");
        if (signInMode == "register") {
            $(document).trigger("OnAnalyticsTrackingEvent", { Category: "Registration", Action: "Started", Value: 1 });
        }
        else {
            $(document).trigger("OnAnalyticsTrackingEvent", { Category: "SignIn", Action: "Started", Value: 1 });
        }
        loadSignInSignUpView(signInMode == "register", false);
        initSignInSignUpEvents();
    });

    if (window.location.hash !== undefined && window.location.hash.toLowerCase().indexOf('signin') >= 0) {
        $(".navbar-signin .btn-signin").trigger("click");
        $(document).trigger("OnAnalyticsTrackingEvent", { Category: "SignIn", Action: "Started", Value: 1 });
        window.location.hash = "";
    }

    if (window.location.hash !== undefined && window.location.hash.toLowerCase().indexOf('register') >= 0) {
        $(".navbar-signin .btn-join").trigger("click");
        $(document).trigger("OnAnalyticsTrackingEvent", { Category: "Registration", Action: "Started", Value: 1 });
        window.location.hash = "";
    }

    $(document).on("click", "a[href='#Register'],a[href='#register']", function () {
        $(".navbar-signin .btn-join").trigger("click");
    });

    $(document).on("click", "a[href='#signin'],a[href='#SignIn'],a[href='#Signin']", function () {
        $(".navbar-signin .btn-signin").trigger("click");
    });

    // update the shared header "Sign in" link
    $(document).on("click", ".msame_Header_name", function () {
        $(".navbar-signin .btn-signin").trigger("click");
        $(document).trigger("OnAnalyticsTrackingEvent", { Category: "SignIn", Action: "Started", Value: 1 });
    });

    window.addEventListener("message", onMessageRecieved, false);

});

function onMessageRecieved(event) {
    if (event.data === undefined || event.data === null)
        return;

    if (event.data == "signin") {
        stopLoginTimer();
        $(document).trigger("OnAnalyticsTrackingEvent", { Category: "SignIn", Action: "Completed", Value: 1 });

        $("#SignInModal").modal('hide');
        window.location.href = window.location.href.replace("#", "");
    }
    else if (event.data == "registration") {
        stopLoginTimer();
        loadSignInSignUpView(true, true);
    }
}

function initSignInSignUpEvents() {

    if (signInMode === undefined && signInMode === null)
        return;

    $("#SignInModal .already-a-member a").click(function (event) {
        event.preventDefault();
        signInMode = "register";
        loadSignInSignUpView(true, false);
    });

    $("#SignInModal .join-now a").click(function (event) {
        event.preventDefault();
        signInMode = "auth";
        showAuthMethods();
        loadSignInSignUpView(false, false);
    });

    $("#SignInModal").on("click", "#MoreAuthMethodsLink", function () {
        $(this).fadeOut();
        $("#OtherAuthMethods").fadeOut();
        $("#OtherAuthMethods").removeClass("hidden");
        $("#OtherAuthMethods").fadeIn();
        $(document).trigger("OnAnalyticsTrackingEvent", { Category: "SignIn", Action: "MoreOptions", Value: 1 });
    });

    $("#SignInModal").on("click", ".welcome-button", function () {
        event.preventDefault();
    });

    $("body").on("click", ".auth-select .auth-row a", function () {
        authType = $(this).attr("data-auth-type");
        returnUrl = $(this).attr("data-returnurl");
        showExternalSignIn(authType, returnUrl);
        $(document).trigger("OnAnalyticsTrackingEvent", { Category: "SignIn", Action: "AuthTypeSelected (" + authType + ")", Value: 1 });
    });

    $("#SignInModal").on("click", "#JoinNowButton", function () {
        if (validateRegistrationForm()) {
            $(document).trigger("OnAnalyticsTrackingEvent", { Category: "Registration", Action: "Submitted", Value: 1 });
            saveRegistration();
        }
    });

    // clears the validation on text boxes on blur
    $(document).on("blur", "input", function () {
        clearValidation($(this));
    });

    // clears the validation on drop down
    $(document).on("change", "select", function () {
        clearValidation($(this));
    });

    // clears the validation on drop down
    $(document).on("change", "select", function () {
        clearValidation($(this));
    });

    // adds the asterix to the labels
    $(".ValidateMessage, .ValidateMessageForLabel").each(function () {
        if ($(this).attr("data-validate-type") === "Required") {
            $(this).closest(".form-group").addClass("required");
        }
    });

    $(".ValidateMessage, .ValidateServerMessage").each(function () {
        if ($(this).attr("data-error") === "true") {
            $(this).closest(".form-group").addClass("required");
        }
    });

    $("#SignInModal").on("click", "#SignUpCancelLink", function () {
        window.location.href = "/start/account/signout"
    });

}

function validateRegistrationForm() {
    validatorControlMessages = [];

    $(this).prop("disabled", true);
    $(".panel-validation-summary").hide();

    if (authType.length == 0) {
        bootbox.alert("Please select an authentication type before continuing.", function () {
            setTimeout(function () {
                if (isABootstrapModalOpen()) {
                    $(document.body).addClass('modal-open');
                }
            }, 500);

        });
    }

    if (isSaving) {
        return false;
    }

    isSaving = true;

    $(".panel-validation-summary .panel-body").empty();

    $(".ValidateMessage").each(function () {
        var currField = this;
        vldControl = {};
        vldControl.Key = $(currField).attr("data-validator-id");
        validatorControlList.push(vldControl);
    });

    $(".ValidateMessageForLabel").each(function () {
        var currField = this;
        vldControl = {};
        vldControl.Key = $(currField).attr("data-validator-id");
        validatorControlList.push(vldControl);
    });

    $.each(validatorControlList, function (index, item) {
        clearErrorMessage(item.Key);
    });

    $(".ValidateMessage").each(function () {
        var $currField = $(this);
        var control = $("#" + $currField.data("control-id"));
        var datavalidatetype = $currField.data("validate-type");
        var dataerrormessage = $currField.data("error-message");
        var dataparameter = $currField.data("parameter");
        var validatorcontrol = $("#" + $currField.data("validator-id"));
        var controltype = $currField.data("control-type");
        var dependency = $("#" + $currField.data("dependency-id"));

        switch (datavalidatetype.toLowerCase()) {
            case "regex":
                if (!validateRegex(control, dataerrormessage, dataparameter, validatorcontrol)) {
                    createValidationErrorMessages(dataerrormessage, validatorcontrol, "regex");
                } else {
                    removeValidationErrorMessages(validatorcontrol, "regex");
                }
                break;
            case "required":
                if (!validateRequired(control, dataerrormessage, 1, validatorcontrol, controltype)) {
                    createValidationErrorMessages(dataerrormessage, validatorcontrol, "required");
                } else {
                    removeValidationErrorMessages(validatorcontrol, "required");
                }
                break;
            case "maxlength":
                if (!validateMaxLength(control, dataerrormessage, dataparameter, validatorcontrol)) {
                    createValidationErrorMessages(dataerrormessage, validatorcontrol, "maxlength");
                } else {
                    removeValidationErrorMessages(validatorcontrol, "maxlength");
                }
                break;
            case "minlength":
                if (!validateMinLength(control, dataerrormessage, dataparameter, validatorcontrol)) {
                    createValidationErrorMessages(dataerrormessage, validatorcontrol, "minlength");
                } else {
                    removeValidationErrorMessages(validatorcontrol, "minlength");
                }
                break;
            case "compare":
                if (!validateCompare(control, dataerrormessage, dataparameter, validatorcontrol)) {
                    createValidationErrorMessages(dataerrormessage, validatorcontrol, "compare");
                } else {
                    removeValidationErrorMessages(validatorcontrol, "compare");
                }
                break;
            case "dependency":
                if (!validateDependency(dependency, control)) {
                    createValidationErrorMessages(dataerrormessage, validatorcontrol, "dependency");
                } else {
                    removeValidationErrorMessages(validatorcontrol, "dependency");
                }
                break;
            default:
        }
    });

    $(".ValidateMessageForLabel").each(function () {
        var currField = this;
        var control = $("#" + $(currField).attr("data-control-id"));
        var datavalidatetype = $(currField).attr("data-validate-type");
        var dataerrormessage = $(currField).attr("data-error-message");
        //var dataparameter = $(currField).attr("data-parameter");
        var validatorcontrol = $("#" + $(currField).attr("data-validator-id"));
        var controltype = $(currField).attr("data-control-type");

        switch (datavalidatetype.toLowerCase()) {
            case "required":
                if (!validateRequired(control, dataerrormessage, 1, validatorcontrol, controltype)) {
                    createValidationErrorMessages(dataerrormessage, validatorcontrol, "required");
                } else {
                    removeValidationErrorMessages(validatorcontrol, "required");
                }
                break;
            default:
        }
    });

    $.each(validatorControlMessages, function (index, item) {
        if (item.Message !== "") {
            displayErrorMessage(item.validatorcontrol, item.Message);
        }
    });

    $(".errorTerms").addClass("hidden");

    if (validatorControlMessages.length === 0) {
        $(".hide").remove();
        $(this).prop("disabled", false);
        return true;
    }

    $(".panel-validation-summary").show();

    $(this).prop("disabled", false);

    isSaving = false;
    return false;

}

function displayErrorMessage(validatorcontrol, errorMessage) {
    var control = $("#" + validatorcontrol);
    $(control).html(errorMessage);
    if (errorMessage !== "") {
        $(control).closest("div").not($(".help-block")).addClass("has-error");
        $(control).closest(".panel").not($(".help-block")).addClass("panel-required");
    } else {
        $(control).attr("id").closest("div").removeClass("has-error");
        $(control).closest(".panel").removeClass("panel-required");
    }
    $(".help-block").removeClass("has-error");
}

function clearValidation(control) {
    if ($(control).val() !== "" || $(control).val() !== "-1") {
        clearErrorMessage($(control).closest("div").find(".ValidateMessage").attr("data-validator-id"));
    }
}

function clearErrorMessage(validatorcontrol) {
    var control = $("#" + validatorcontrol);
    control.html("");
    $(control).closest("div").removeClass("has-error");
}

function createValidationErrorMessages(dataerrormessage, validatorcontrol, validationtype) {
    var validatorContolMessage = {};
    validatorContolMessage.Key = ($(validatorcontrol).attr("id") + validationtype).toLowerCase();
    validatorContolMessage.Message = dataerrormessage;
    validatorContolMessage.validatorcontrol = $(validatorcontrol).attr("id");
    validatorControlMessages.push(validatorContolMessage);

    if ($(".panel-validation-summary").is(":hidden")) {
        $(".panel-validation-summary").show();
    }
    $(".panel-validation-summary .panel-body").append(dataerrormessage + "<br/>");
}

function removeValidationErrorMessages(validatorcontrol, validationtype) {
    var index = -1;
    $.each(validatorControlMessages, function (i, e) {
        if (e.Key == ($(validatorcontrol).attr("id") + validationtype).toLowerCase()) {
            index = i;
            return false;
        }
    });

    if (index != -1)
        validatorControlMessages.splice(index, 1);
}

function validateRegex(currField, message, value) {
    if ($(currField).val() === null) {
        return false;
    }

    if (value.length === 0 || $(currField).val() === "") return true;

    var rx = new RegExp(value);
    var matches = rx.exec($(currField).val());

    if (matches === null) {
        return false;
    }

    if (matches[0] === "") {
        return false;
    }
    return true;
}

function validateRequired(currField, message, value, validatorcontrol, controltype) {
    if (controltype === "checkboxlist") {
        if ($(currField).find("input:checked").length === 0) {
            return false;
        }

    }
    else {
        if ($(currField).val() === null) {
            return false;
        }
        if ($(currField).val().length === 0 || $(currField).val() === "" || $(currField).val() === "-1") {
            return false;
        }
    }
    return true;
}

function validateCompare(currField, message, value) {
    if ($(currField).val() === null) {
        return false;
    }

    if (value.length === 0 || $(currField).val() === "") return true;

    if ($.trim($("#" + value).val()).toLowerCase() !== $.trim($(currField).val()).toLowerCase()) {
        return false;
    }
    return true;
}

function validateMaxLength(currField, message, value) {
    if ($(currField).val() === null) {
        return false;
    }

    if (value.length === 0 || $(currField).val() === "") return true;

    if ($.trim($(currField).val()).length > value) {
        return false;
    }
    return true;
}

function validateMinLength(currField, message, value) {
    if ($(currField).val() === null) {
        return false;
    }

    if (value.length === 0 || $(currField).val() === "") return true;

    if ($.trim($(currField).val()).length < value) {
        return false;
    }
    return true;
}

function isEmpty(value) {
    return (value == null || value.length === 0);
}

function validateDependency(dependency, currField) {

    if (!isEmpty($(dependency).val()) && isEmpty($(currField).val())) {
        return false;
    }

    return true;
}

function switchToActiveRegistration() {
    hideAlreadyAMember();
    hideJoinNowLinks();
    hideJoinNowDescription();
    deactiveAuthMethods();
    hideNonSelectedAuthMethods();

    if (authType === undefined || authType === null || authType === "")
        $('#SignInModal .modal-body .sign-up-container').addClass("hidden");
    else
        $('#SignInModal .modal-body .sign-up-container').removeClass("hidden");
}

function hideAlreadyAMember() {
    $(".already-a-member").addClass("hidden");
}

function hideJoinNowDescription() {
    $("#SignInModal .join-now-description").addClass("hidden");
}

function hideJoinNowLinks() {
    $(".join-now").removeClass("hidden");
    $(".join-now .link").addClass("hidden");
}

function deactiveAuthMethods() {
    $("body").off("click", ".auth-select .auth-row a");
}

function hideNonSelectedAuthMethods() {
    $(".auth-row").addClass("hidden");
    showAuthMethods(authType.toLowerCase());
    $("#MoreAuthMethodsLink").addClass("hidden");
}

function showAuthMethods(authType) {
    if (authType !== undefined && authType !== null) {
        $(".auth-row." + authType).removeClass("hidden");
    }
    else
        $(".auth-row").removeClass("hidden");
}

function loadSignInSignUpView(includeRegistration, reload) {

    showAuthenticationView();

    var returnUrl = encodeURIComponent(window.location.hash.replace('#Register?', '').replace('#SignIn?', ''));
   
    if ($('#SignInModal .modal-body .sign-in-container').length == 0 || reload) {

        $(".listloading").removeClass("hidden");

        $.ajax({
            url: '/start/account/signinsignup',
            type: "get",
            data: { IsRegistrationView: signInMode == "register", returnUrl: returnUrl },
            contentType: "html",
            cache: false,
            success: function (results) {
                $('#SignInModal .modal-body').html(results);
                if (includeRegistration)
                    showRegistrationView();
                if (reload)
                    switchToActiveRegistration();
            }
        });
    }
    else {
        if (includeRegistration)
            showRegistrationView();
    }

}

function showRegistrationView() {
    //$('#SignInModal .modal-body').append(results);
    $(".glyphicon.glyphicon-eye-open").hide();
    $(".panel-validation-summary").hide();
    $("#SignInModal .join-now").removeClass("hidden");
    $("#SignInModal .already-a-member").addClass("hidden");
    $("#SignInModal .modal-body .auth-row a[data-auth-type='Basic']").addClass("hidden");
    $(".listloading").addClass("hidden");

    if (authType === undefined || authType === null || authType === "")
        $('#SignInModal .modal-body .sign-up-container').addClass("hidden");
    else
        $('#SignInModal .modal-body .sign-up-container').removeClass("hidden");
}

function showAuthenticationView() {
    $(".panel-validation-summary").hide();
    $("#SignInModal .join-now").addClass("hidden");
    $("#SignInModal .already-a-member").removeClass("hidden");
    $("#SignInModal .modal-body .auth-row a[data-auth-type='Basic']").removeClass("hidden");
    $('#SignInModal .modal-body .sign-up-container').addClass("hidden");
}

function loadRegistrationView(reload) {

    if ($('#SignInModal .modal-body .sign-up-container').length == 0 || reload == true) {
        $.ajax({
            url: '/start/account/authmethods',
            type: "get",
            contentType: "html",
            cache: false,
            success: function (results) {
                $('#SignInModal .modal-body').html();
                $('#SignInModal .modal-body').append(results);
                $(".glyphicon.glyphicon-eye-open").hide();
                $(".panel-validation-summary").hide();
            }
        });
    }
    else {
        $('#SignInModal .modal-body .sign-up-container').removeClass("hidden");
    }

    $("#SignInModal .already-a-member").removeClass("hidden");
    $("#SignInModal .join-now").addClass("hidden");
    $("#SignInModal .modal-body .auth-row a[data-auth-type='Basic']").addClass("hidden");

}

var loginWindow;
var loginTimer;

function hideBasicAuth() {
    $(".auth-select .auth-row[data-auth-type='Basic']").addClass("hidden");
}

function showBasicAuth() {
    $(".auth-select .auth-row[data-auth-type='Basic']").addClass("hidden");
}

function showExternalSignIn(provider, returnUrl) {
    var h = $("#SignInModal .modal-content").height() + 50;
    var w = $("#SignInModal .modal-content").width() + 50;

    if (h > 500)
        h = 500;

    // Fixes dual-screen position                         Most browsers      Firefox
    var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
    var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;

    width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    var left = ((width / 2) - (w / 2)) + dualScreenLeft;
    var top = ((height / 2) - (h / 2)) + dualScreenTop;

    var loginUrl = (returnUrl == "")
        ? "/Start/Account/ExternalLogin?Provider=" + provider + "&ReturnUrl=/Start/Account/SignInComplete"
        : "/Start/Account/ExternalLogin?Provider=" + provider + "&" + decodeURI(returnUrl).replace(/%3D/g, "=").replace(/%2F/g, "/");
    var options = "toolbar=no,scrollbars=yes,resizable=no,top=100,left=" + left.toString() + ",width=" + w.toString() + ",height=" + h.toString();

    loginWindow = window.open(loginUrl, "SignInWindow", options, false);

    if (!loginWindow || loginWindow.closed || typeof loginWindow.closed == 'undefined')
        window.location.href = "/start/welcome";

    startLoginTimer();
}

function startLoginTimer() {

    if (loginTimer)
        stopLoginTimer();

    loginTimer = window.setInterval(function () { loginTimerElapsed() }, 10000);

}

function stopLoginTimer() {
    window.clearInterval(loginTimer);
}

function loginTimerElapsed() {

    try {

        // check for disconnected Azure AD scenario
        if (!loginWindow && authType == "Azure") {
            checkSignInStatus();
        }

        if (loginWindow.location.pathname == undefined) {
            stopLoginTimer();
            return;
        }

        if (loginWindow.location.pathname.toLowerCase() == "/sitepages/public/signinhandler.aspx" || loginWindow.location.pathname.toLowerCase().indexOf("externallogin") > 0 || loginWindow.location.pathname.toLowerCase().indexOf("blank") > -1) {
            return;
        }

        if (loginWindow.location.pathname.toLowerCase() == "/start/account/signincomplete") {
            closeLoginWindow(window.location.href.replace("#", ""));
            return;
        }

        closeLoginWindow(loginWindow.location.pathname.toLowerCase());

    } catch (e) {
        // test for 0365/Edge bug
        if (loginWindow && e.message !== undefined && e.message === "" && navigator.userAgent.indexOf("Edge") > 0) {
            checkSignInStatus();
        }
    }

}

function closeLoginWindow(url) {
    stopLoginTimer();

    if (!loginWindow && !loginWindow.closed && loginWindow.location.hash !== undefined && loginWindow.location.hash.toLowerCase().indexOf('register') >= 0) {
        loadSignInSignUpView(true, true);
    }
    else if (url != undefined && url != null && url.length > 0) {
        $("#SignInModal").modal('hide');
        window.location.href = window.location.href = url;
    }
    else {
        $("#SignInModal").modal('hide');
        window.location.href = window.location.href.replace("#", "");
    }

    try {
        loginWindow.close();
    } catch (e) {

    }
}

//********************PropertyChanged************************************/
function OnPropertyChange(fieldName, newValue) {
    var params = {
        fieldName: fieldName,
        newValue: newValue
    };

    var isCountryField = false;

    if (fieldName === "CountryField") {
        isCountryField = true;
    }

    if (isCountryField) {
        $("#EmailOptInField").hide();
        $("#OptInPromotionsField").hide();
        $("#NoticeCountriesEmailField").hide();
        //showNoticeLoader();
    }

    $.ajax({
        data: JSON.stringify(params),
        contentType: 'application/json',
        cache: false,
        dataType: 'json',
        type: 'post',
        url: '/Start/Registration/OnChange',
        success: function (data) {
            if (data !== null) {
                $.each(data, function (index, newHtml) {
                    var obj = $("#" + index);
                    //var oldHtml = obj.html();
                    //find hidden field containing the model type
                    var modelName = obj.find("input[name$='.ModelType']").attr("name");
                    if (modelName !== undefined) {
                        //extract old form variable prefix, e.g. [13].
                        var formVarPrefix = modelName.replace("ModelType", "");
                        //apply old prefix to new HTML
                        newHtml = newHtml.replace(/name="/g, 'name="' + formVarPrefix);
                    }
                    $(obj).replaceWith(newHtml);
                });
            }
        }
    }).done(function () {
        if (isCountryField) {
            $("#EmailOptInField").show();
            $("#OptInPromotionsField").show();
            $("#NoticeCountriesEmailField").show();
            //hideNoticeLoader();
        }
    });
}


function OnBlur(fieldName, newValue) {
    var params = {
        fieldName: fieldName,
        newValue: newValue
    };

  

    $.ajax({
        data: JSON.stringify(params),
        contentType: 'application/json',
        cache: false,
        dataType: 'json',
        type: 'post',
        url: '/Start/Registration/OnBlur',
        success: function (data) {
            if (data !== null) {
                $.each(data, function (index, newHtml) {
                    var obj = $("#" + index);
                    //var oldHtml = obj.html();
                    //find hidden field containing the model type
                    var modelName = obj.find("input[name$='.ModelType']").attr("name");
                    if (modelName !== undefined) {
                        //extract old form variable prefix, e.g. [13].
                        var formVarPrefix = modelName.replace("ModelType", "");
                        //apply old prefix to new HTML
                        newHtml = newHtml.replace(/name="/g, 'name="' + formVarPrefix);
                    }
                    $(newHtml).insertAfter($("#PromoCodeField"));
                });
            }
        }
    }).done(function () {
       
    });
}


function checkSignInStatus() {

    $.ajax({
        url: '/start/account/signinstatus',
        type: "get",
        cache: false,
        success: function (results) {
            if (results.Data !== undefined && results.Data !== null && !results.Data.IsGuestUser) {
                if (results.Data.RegistrationRequired) {
                    stopLoginTimer();
                    loadSignInSignUpView(true, true)
                } else {
                    closeLoginWindow("");
                }
            }
        }
    });

}

function saveRegistration() {
    var params = {};

    params["authType"] = authType;

    var controls = $(".sign-up-container").find("input,select,hidden");

    $("#JoinNowButton").button('loading');

    $(controls).each(function (i, item) {
        if ($(item).attr("name") !== undefined)
            params[$(item).attr("name")] = $(item).val();
    });

    $.ajax({
        data: params,
        cache: false,
        dataType: 'json',
        type: 'post',
        url: '/Start/Registration/SaveMinimal',
        success: function (data) {
            if (data !== null) {
                if (data.Error !== null) {
                    var msg = '<ul><li>' + data.Data.map(function (e) { return e.ErrorMessage; }).join('</li><li>') + '</li></ul>';
                    bootbox.alert({ title: data.Error, message: msg });
                } else {
                    $(document).trigger("OnAnalyticsTrackingEvent", { Category: "Registration", Action: "Completed", Value: 1 });
                    $("#SignInModal").modal('hide');
                    window.location.href = window.location.href.replace("#", "");
                }
            }

            $("#JoinNowButton").button('reset');

        }
    }).done(function () {
        isSaving = false;
    });

}