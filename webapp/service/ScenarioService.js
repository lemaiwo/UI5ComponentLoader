sap.ui.define([
	"be/wl/zcomploaderlib/objects/BaseService",
	"sap/ui/model/Sorter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseService, Sorter, Filter, FilterOperator) {
	"use strict";

	var ScenarioService = BaseService.extend("be.elia.bc.CentralEntryPointApp.service.ScenarioService", {
		constructor: function (model) {
			this.scenarioTitles = {};
			BaseService.call(this, model);
		},
		getTitle: function (scenarioid) {
			if (this.scenarioTitles[scenarioid]) {
				return Promise.resolve(this.scenarioTitles[scenarioid]);
			}
			return this.odata("/zcl_scenario_c('" + scenarioid + "')").get().then(response => {
				this.scenarioTitles[scenarioid] = response;
				return response;
			});
		}
	});
	return ScenarioService;
});