var Service = function() {};

Service.prototype.get = function(options) {
    options = $.extend({ cache: true }, options);
    options.data = $.extend({}, this.defaults, options.data);

    var method = options.queue ? $.ajaxQueue : $.ajax;
    return method(options);
};

var CrossRef = function(options) {
    this.defaults = $.extend({}, options);

    this.url = $("link[rel='service.crossref']").attr("href");

    this.search = function(input, offset, limit) {
        var parts = [input.term];

        var data = {
            q: parts.join(" "),
            sort: "year",
            page: Math.ceil(offset / limit) + 1,
            rows: limit,
            header: "true"
        };

        $.each(input.filters, function(index, item) {
            if (item.enabled) {
                data[index] = item.value;
            }
        });

        return this.get({ url: this.url, data: data });
    };

    this.fetch = function(doi){
        return this.get({ url: "http://dx.doi.org/" + doi, dataType: "json", queue: true });
    };

    this.parse = function(data) {
        console.log(data);
        if(!data.OK || !data.OK.results || !data.OK.results.length) return;

        var item = data.OK.results[0];

        var citedbycount = Number(item.citedbycount);
        if(!citedbycount) return;

        return {
            url: item.inwardurl,
            text: citedbycount,
            image: "sciverse.png"
        };
    };
};

CrossRef.prototype = new Service();

var Altmetric = function(options) {
    this.defaults = $.extend({}, options);

    var node = $("link[rel='service.altmetric']");

    this.url = node.attr("href");
    this.key = node.data("key");

    this.path = function(identifiers) {
        if (identifiers.doi) return "doi/" + identifiers.doi;
        if (identifiers.pmid) return "pmid/" + identifiers.pmid;
        return false;
    };

    this.fetch = function(path){
        var data = { key: this.key };
        return this.get({ url: this.url + path, data: data, queue: false });
    };

    this.parse = function(data){
        var id = encodeURIComponent(data.altmetric_id),
            items = [],
            mendeley_url;

        if (data.cited_by_blogs_count) {
            items.push({
                url: "http://altmetric.com/details.php?citation_id=" + id,
                text: data.cited_by_blogs_count,
                image: "altmetric.png"
            });
        }

        if (data.cited_by_tweeters_count){
            items.push({
              url: "http://altmetric.com/details.php?citation_id=" + id,
              text: data.cited_by_tweeters_count,
              image: "twitter.png"
          });
        }

        data.readers.mendeley = Number(data.readers.mendeley);

        if (data.readers.mendeley) {
            if (data.pmid) mendeley_url = "http://www.mendeley.com/openURL?id=pmid:" + encodeURIComponent(data.pmid);
            else if (data.doi) mendeley_url = "http://www.mendeley.com/openURL?id=doi:" + encodeURIComponent(data.doi);
            else mendeley_url = "http://altmetric.com/details.php?citation_id=" + id;

            items.push({
                url: mendeley_url,
                text: data.readers.mendeley,
                image: "mendeley.png"
            });
        }

        return items;
    };
};

Altmetric.prototype = new Service();

var Scopus = function(options) {
    this.defaults = $.extend({}, options);

    var node = $("link[rel='service.scopus']");

    this.url = node.attr("href");
    this.key = node.data("key");

    this.fetch = function(doi){
        var data = {
            apiKey: this.key,
            search: "DOI(" + doi + ")"
        };

        return this.get({ url: this.url + "documentSearch.url", data: data, dataType: "jsonp", queue: true });
    };

    this.parse = function(data) {
        if(!data.OK || !data.OK.results || !data.OK.results.length) return;

        var item = data.OK.results[0];

        var citedbycount = Number(item.citedbycount);
        if(!citedbycount) return;

        return {
            url: item.inwardurl,
            text: citedbycount,
            image: "sciverse.png"
        };
    };
};

Scopus.prototype = new Service();

