/*global Backbone, $, Handlebars, window */

var Collections = {
	Articles: Backbone.Collection.extend({
		sync: function(method, collection, options) {
			var input = app.models.query.toJSON();

			if (!input.term) {
				return;
			}

			var data = app.models.query.toJSON();

			var view = app.views.articles;

			return app.services.crossref.search(data, view.offset, view.limit).done(options.success);
		},

		parse: function(items) {
			if (items.length) {
				app.views.pagination.setNextOffset();

				return $.map(items, function(item) {
					var openURL = $("<div/>").html(item.coins).text();
					var data = $.deparam(openURL);

					item.journalTitle = data["rft.jtitle"];
					item.pubDate = data["rft.date"];
					item.issue = data["rft.issue"];
					item.startPage = data["rft.spage"];
					item.volume = data["rft.volume"];

					if (data["rft.au"]) {
						if (!$.isArray(data["rft.au"])) {
							data["rft.au"] = [data["rft.au"]];
						}

						item.creator = $.map(data["rft.au"], function(author) {
							return { name: $.trim(author) };
						});
					}

					return new Models.Article(item);
				});
			}

			app.views.pagination.noMoreItems();
		},
	}),
	Links: Backbone.Collection.extend({}),
	Metrics: Backbone.Collection.extend({})
};
