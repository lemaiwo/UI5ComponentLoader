sap.ui.define([
	"be/wl/zcomploaderlib/objects/BaseObject",
	"sap/ui/core/Component",
	"./Param",
	"sap/base/strings/capitalize",
	"sap/f/library",
	"sap/ui/model/resource/ResourceModel"
], function (BaseObject, Component, Param, capitalize, fioriLibrary, ResourceModel) {
	"use strict";
	return BaseObject.extend("be.wl.CompLoaderApp.model.Component", {
		constructor: function (data) {
			BaseObject.call(this, data);
			if (data.toParams) {
				this.setParams(data.toParams.results);
			}
		},
		setParams: function (params) {
			this.params = params.map((param) => new Param(param));
		},
		getConfig: function () {
			return this.params.reduce((config, param) => {
				if (this.fioriElements || param.seqnr !== "00000") {
					if (!config[param.id]) {
						config[param.id] = [];
					}
					config[param.id].push(param.getConvertedValue());
				} else {
					config[param.id] = param.getConvertedValue();
				}

				return config;
			}, {});
		},
		getComponentId: function () {
			return this.componentid;
		},
		getLevel: function () {
			return this.level_cl;
		},
		getView: function () {
			switch (this.viewid) {
				case "MA":
					return "master";
				case "DE":
					return "detail";
				case "DD":
					return "detailDetail";
				default:
					return "master";
			}
		},
		getLayout: function () {
			let layout;
			switch (this.getView()) {
				case "master":
					layout = fioriLibrary.LayoutType.OneColumn;
					break;
				case "detail":
					layout = fioriLibrary.LayoutType.TwoColumnsMidExpanded;
					break;
				case "detailDetail":
					layout = fioriLibrary.LayoutType.ThreeColumnsEndExpanded;
					break;
				default:
					layout = fioriLibrary.LayoutType.OneColumn;
			}
			return this.layout || layout;
		},
		getViewAggregation: function () {
			switch (this.viewid) {
				case "MA":
					return "beginColumnPage";
				case "DE":
					return "midColumnPage";
				case "DD":
					return "endColumnPage";
				default:
					return "beginColumnPage";
			}
		},
		getViewAggregationAddFn: function () {
			return "add" + capitalize(this.getViewAggregation());
		},
		getViewAggregationRemoveFn: function () {
			return "removeAll" + capitalize(this.getViewAggregation()) + "s";
		},
		isFioriElements: function () {
			return this.fioriElements;
		},
		updateUIComponentInput: function (params) {
			params.config = this.getConfig();
			this.UIComponent.setInput(params);
		},
		getUIComponent: function (params) {
			if (this.UIComponent && (!this.isFioriElements() || !(params.data && params.data.startupParameters))) {
				return Promise.resolve({
					component: this.UIComponent,
					firsttime: false
				});
			}
			params.config = this.getConfig();
			if (params.data && params.data.startupParameters) {
				var startupParametersData = params.data.startupParameters;
				// startupParameters : {
				// 	Txt30: ["Open"]
				// }
			}
			var startupParameters = {};
			if (this.isFioriElements()) {
				sap.ui.loader._.declareModule(this.componentid.replace(/\./g, "/") + "/changes/changes-bundle.json");
				var startupParametersConfig = params.config;
				startupParameters = params.startupParameters || {};
			}
			//merge startup params
			var allFields = {
				...startupParametersData,
				...startupParametersConfig
			};

			// var startupParameters = {};
			for (var field in allFields) {
				startupParameters[field] = [];
				startupParametersData && startupParametersData[field] && startupParameters[field].push(...startupParametersData[field]);
				startupParametersConfig && startupParametersConfig[field] && startupParameters[field].push(...startupParametersConfig[field]);
			}
			return Component.create({
				// return Component.load({
				name: this.componentid,
				url: this.componenturl,
				height: "100%",
				style: "height: 100%",
				manifest: true,
				async: true,
				componentData: {
					startupParameters: startupParameters,
					input: params
				}
			}).then((childComponent) => {
				this.UIComponent = childComponent;
				//load i18n for fiori elements manually.
				if (this.isFioriElements()) {
					var compModels = this.UIComponent.getManifestEntry("sap.ui5").models;
					for (var modelName in compModels) {
						if (compModels[modelName].type === "sap.ui.model.resource.ResourceModel") {
							var bundleName = (compModels[modelName].uri && this.UIComponent.getMetadata().getComponentName() + "." + compModels[modelName].uri.split(".")[0].replace(
								/\//gi, ".")) || (compModels[modelName].settings && compModels[modelName].settings.bundleName);
							var i18nModel = new ResourceModel({
								bundleName: bundleName
							});
							this.UIComponent.setModel(i18nModel, modelName);
						}
					}
				}
				return {
					component: this.UIComponent,
					firsttime: true
				};
			}).catch((error) => {
				console.error(error);
				throw "Error create component";
			});
		},
		setData: function (data) {
			this.data = data;
		},
		getData: function () {
			return this.data;
		},
		getJSON: function () {
			let component = this.getJSONObject(["viewid", "level_cl", "componentid"]);
			component.Data = this.data;
			component.params = this.params.map((param) => param.getJSON());
			return component;
		}
	});
});