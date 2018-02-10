// this script must be placed below Atlas

createAtlasTag("11087202446070");

$(document).on("OnAnalyticsTrackingEvent", function (event, data) {
    try {
        data.Value = data.Value != null ? data.Value : 0;
        data.Action = data.Action != null ? data.Action : "";
        data.Label = data.Label != null ? data.Label : "";

        // we need to track registration complete
        if (data.Category.length > 0 && data.Category == "Registration" && data.Action.length > 0 && data.Action == "Completed") {
            trackAtlasEvent('11087202446070', 'DND_MSCOM_GBL_Clk_Prd_JoinTheCommunity_CON');
        }

    } catch (e) {

    }

});
