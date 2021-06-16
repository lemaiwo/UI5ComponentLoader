sap.ui.define([
	"be/wl/zcomploaderlib/objects/BaseState",
	"../model/Scenario"
], function (BaseState, Scenario) {
	"use strict";
	var ConfigState = BaseState.extend("be.wl.CompLoaderApp.state.ConfigState", {
		constructor: function (service, compData, comp) {
			this.data = {
				scenario: new Scenario(compData)
			};
			this.service = service;
			this.comp = comp;
			BaseState.call(this);
		},
		getService: function () {
			return this.service;
		},
		getBackendConfiguration: function () {
			if (this.getProperty("scenario").hasComponents()) {
				return Promise.resolve(this.getProperty("scenario"));
			}
			return this.getService().getBackendConfiguration(this.getProperty("scenario")).then((resp) => {
				this.getProperty("scenario").setComponents(resp.data.results);
				return this.getProperty("scenario");
			});
		},
		getUIComponent: function (level) {
			return this.getBackendConfiguration().then(() => this.getProperty("scenario").getUIComponent(level));
		}
	});
	return ConfigState;
});