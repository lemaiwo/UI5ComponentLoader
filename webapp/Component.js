sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/core/mvc/View",
	"sap/ui/core/mvc/ViewType",
	'sap/ui/model/json/JSONModel',
	"sap/ui/Device",
	"be/wl/CompLoaderApp/model/models",
	"./service/ConfigService",
	"./service/ScenarioService",
	"./state/ConfigState",
	'sap/f/library'
], function (UIComponent, View, ViewType, JSONModel, Device, models, ConfigService, ScenarioService, ConfigState, fioriLibrary) {
	"use strict";

	return UIComponent.extend("be.wl.CompLoaderApp.Component", {

		metadata: {
			manifest: "json",
			properties: {
				"currentRouteName": {} // default type == "string"
			}
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		CONFIG: "Config",
		init: function () {
			let scenarioParams;
			var compData = this.getComponentData();
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);
			if (compData && compData.startupParameters && compData.startupParameters.scenario) {
				scenarioParams = {
					scenario: compData.startupParameters.scenario[0],
					type: compData.startupParameters.type[0],
					startupParameters: compData.startupParameters
				};
			}
			this._ocConfigService = new ConfigService(this.getModel("config"));
			this._oScenarioService = new ScenarioService(this.getModel("scenario"));
			this._oConfigState = new ConfigState(this._ocConfigService, scenarioParams);

			var oModel = new JSONModel();
			this.setModel(oModel);
			// enable routing
			// this.getRouter().initialize();
			var oRouter = this.getRouter();
			oRouter.attachBeforeRouteMatched(this._onBeforeRouteMatched, this);
			oRouter.initialize();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			this.updateTitle(scenarioParams.scenario);
		},
		updateTitle: function (scenarioid) {
			Promise.all([this.getService("ShellUIService"), this._oScenarioService.getTitle(scenarioid)]).then(result => {
				result[0].setTitle(result[1].data.scenario_descr);
			});
		},
		_onBeforeRouteMatched: function (event) {
			var oModel = this.getModel(),
				sLayout = event.getParameters().arguments.layout;

			this.setCurrentRouteName(event.getParameter("name"));

			// If there is no layout parameter, set a default layout (normally OneColumn)
			if (!sLayout) {
				sLayout = fioriLibrary.LayoutType.OneColumn;
			}

			oModel.setProperty("/layout", sLayout);
		},
		getState: function (sState) {
			return this["_o" + sState + "State"];
		}

	});
});