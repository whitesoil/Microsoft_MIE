function createAtlasTag(id) {
    var e = document.createElement("script");
    e.async = true;
    e.src = "//ad.atdmt.com/m/a.js;m=" + id + ";cache=" + Math.random() + "?";
    var s = document.getElementsByTagName("script")[0];
    s.parentNode.insertBefore(e, s);
}


function trackAtlasEvent(id, uri) {
    var e = document.createElement("script");
    e.async = true;
    e.src = "//ad.atdmt.com/m/a.js;m=" + id + ";cache=" + Math.random() + "?event=" + uri;
    var s = document.getElementsByTagName("script")[0];
    s.parentNode.insertBefore(e, s);
}