var Models = {
    Query: Backbone.Model.extend({
        defaults: {
            "filters":  {
                "oa_status": {
                    name: "free full text",
                    value: "Open Access",
                    enabled: false
                },
                "sort": {
                    name: "sort by relevance",
                    value: "relevance",
                    enabled: false
                },
            },
            "days": 0,
            "term": ""
        }
    }),

    Article: Backbone.Model.extend({
        augmentors: {
            altmetric: function() {
                var model = this,
                    service = app.services.altmetric,
                    data = this.toJSON(),
                    path = service.path({ doi: data.doi, pubmed: data.pmid });

                if(!path) return;

                service.fetch(path).done(function(data) {
                    var items = service.parse(data);
                    model.metrics.add(items);
                });
            },

            scopus: function() {
                var model = this,
                    service = app.services.scopus,
                    doi = this.get("doi");

                if(!doi) return;

                service.fetch(doi).done(function(data) {
                    var item = service.parse(data);
                    if(item) model.metrics.add(item);
                });
            }
        },

        events: {
            "change:pmid": "setLinks",
            "change:doi": "setLinks"
        },

        initialize: function() {
            this.metrics = new Collections.Metrics();
            this.links = new Collections.Links({ model: Models.Link });
            this.setLinks();

            if (app.models.options.get("metrics")) {
                var model = this;
                $.each(this.augmentors, function(name, augmentor) {
                    augmentor.call(model);
                });
            }
        },

        setLinks: function() {
            var pmid = this.get("pmid");
            var doi = this.get("doi");
            var title = this.get("title");

            var items = [
                {
                    text: "Google Scholar",
                    attributes: {
                        rel: "full-text",
                        href: "http://scholar.google.com/scholar?" + (doi ? "cluster=http://dx.doi.org/" + encodeURIComponent(doi) : "q=" + encodeURIComponent(title)),
                        title: "Find in Google Scholar",
                        target: "_blank"
                    }
                },

                {
                    text: "✫ Save",
                    attributes: {
                        rel: "save",
                        href: "http://www.mendeley.com/import/?url=" + encodeURIComponent("http://dx.doi.org/" + doi),
                        title: "Save to Mendeley",
                        type: "com.mendeley",
                        target: "_blank"
                    }
                }
                /*
                {
                    text: "⇣ RIS",
                    attributes: {
                        rel: "save",
                        download: "hubmed-" + pmid,
                        href: "http://pubmed.macropus.org/articles/?format=application%2Fresearch-info-systems&id=" + pmid,
                        type: "application/research-info-systems",
                        title: "Download as RIS",
                    }
                },

                {
                    text: "⇣ BibTeX",
                    attributes: {
                        rel: "save",
                        download: "hubmed-" + pmid,
                        href: "http://pubmed.macropus.org/articles/?format=text%2Fbibtex&id=" + pmid,
                        type: "text/bibtex",
                        title: "Download as BibTeX"
                    }
                }
                */
            ];

            this.links.reset(items);
        }
    }),

    Link: Backbone.Model.extend({}),
    Info: Backbone.Model.extend({}),
    Options: Backbone.Model.extend({})
};