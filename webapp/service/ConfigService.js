sap.ui.define([
	"be/wl/zcomploaderlib/objects/BaseService",
	"sap/ui/model/Sorter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseService, Sorter, Filter, FilterOperator) {
	"use strict";

	var ConfigService = BaseService.extend("be.wl.CompLoaderApp.service.ConfigService", {
		constructor: function (model) {
			BaseService.call(this, model);
		},
		getBackendConfiguration: function (scenario) {
			var filters = [];
			filters.push(new Filter({
				path: "scenario",
				operator: FilterOperator.EQ,
				value1: scenario.id
			}));
			filters.push(new Filter({
				path: "type",
				operator: FilterOperator.EQ,
				value1: scenario.type
			}));
			return this.odata("/zcl_config_c").get({
				filters: filters,
				urlParameters: {
					$expand: "toParams"
				}
			});
		}
	});
	return ConfigService;
});