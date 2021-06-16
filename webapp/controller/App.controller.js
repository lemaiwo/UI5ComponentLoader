sap.ui.define([
	"be/wl/zcomploaderlib/controllers/BaseController",
	"sap/ui/core/Component",
	"sap/ui/core/ComponentContainer",
	"be/wl/zcomploaderlib/library",
	'sap/ui/thirdparty/hasher'
], function (Controller, Component, ComponentContainer, CompLoadLib, hasher) {
	"use strict";

	return Controller.extend("be.wl.CompLoaderApp.controller.App", {
		onInit: function () {
			this.ConfigState = this.getOwnerComponent().getState(this.getOwnerComponent().CONFIG);
			this.oOwnerComponent = this.getOwnerComponent();
			this.oRouter = this.oOwnerComponent.getRouter();
			this.oRouter.attachRouteMatched(this.onRouteMatched, this);

			this.refreshOnNavigation = false;
			this.level = 1;
			this.view = "master";
			this.currentRouteName = "query";
			this.showComponent(this.level);
		},
		onRouteMatched: function (event) {
			var sRouteName = event.getParameter("name"),
				args = event.getParameter("arguments");
			this.level = 1; //args.level || 1;
			this.view = "master"; //args.view || "master";
			if (args) {
				if (args.level) {
					this.level = args.level;
				}
				if (args.view) {
					this.view = args.view;
				}
			}
			//to fix fuzzy search focus
			if (this.currentRouteName && this.currentRouteName === sRouteName && this.getComponent(this.level).isFioriElements()) {
				return;
			}
			// Save the current route name
			this.currentRouteName = sRouteName;
			this.showComponent(this.level);
		},
		getPrevMatchedRoute: function () {
			return this.getRouter()._oRouter._prevMatchedRequest; // eslint-disable-line
		},
		onStateChanged: function (oEvent) {
			var bIsNavigationArrow = oEvent.getParameter("isNavigationArrow"),
				sLayout = oEvent.getParameter("layout");
			// Replace the URL with the new layout if a navigation arrow was used
			if (bIsNavigationArrow) {
				this.oRouter.navTo(this.currentRouteName, {
					layout: sLayout,
					// assetid: this.currentAssetId,
					level: this.level,
					view: this.view
				}, true);
			}
		},
		setHashSilently: function (hash) {
			hasher.changed.active = false; //disable changed signal
			hasher.setHash(hash); //set hash without dispatching changed signal
			hasher.changed.active = true; //re-enable signal
		},
		getComponent: function (level) {
			return this.getScenario().getComponent(level);
		},
		getScenario: function () {
			return this.ConfigState.getProperty("scenario");
		},
		showComponent: function (level) {
			var currentHash = hasher.getHash(); //get current hash
			this.ConfigState.getBackendConfiguration().then((config) => {
				if (this.getComponent(level).isFioriElements()) {
					this.setHashSilently("");
				}
				return config;
			}).then((config) => {
				return this.ConfigState.getUIComponent(this.level);
			}).then((comp) => {
				if (comp.firsttime) {
					//first time only for fiori elements as well
					if (typeof comp.component.attachAction === "function") {
						comp.component.attachAction(this.onAction.bind(this, this.level));
					}
					//only first time set title for a component
					this.getOwnerComponent()._oScenarioService.getTitle(this.getScenario().scenario).then(response => {
						comp.component.getManifest()["sap.app"].title = response.data.scenario_descr;
					});
				}
				var currentContainerContent = this.byId("flexibleColumnLayout").getAggregation(this.getComponent(level).getViewAggregation() +
					"s");
				//first time + different component in same aggregation => update aggregation
				if (this.getComponent(level).isFioriElements() || !currentContainerContent || currentContainerContent.length === 0 || comp.component
					.getMetadata() !== currentContainerContent[0].getComponentInstance().getMetadata()) {
					this.byId("flexibleColumnLayout")[this.getComponent(level).getViewAggregationRemoveFn()]();
					var compContainer = new ComponentContainer({
						component: comp.component,
						height: "100%",
						width: "100%"
					});

					this.byId("flexibleColumnLayout")[this.getComponent(level).getViewAggregationAddFn()].call(this.byId("flexibleColumnLayout"),
						compContainer, false);

					//update custom components second time ==> Fiori elements needs to be reloaded completely everytime
					//first time is done by creating the component
					//will only happen in case the same aggregation is used for another new component
					if (!comp.firsttime && !this.getComponent(level).isFioriElements()) {
						this.getScenario().updateUIComponent(level);
					}
					//update model of fiori element second time when changes are made in detail page
					//first time is done automatically
					if (!comp.firsttime && this.refreshOnNavigation && this.getComponent(level).isFioriElements()) {
						this.refreshOnNavigation = false;
						this.getComponent(level).UIComponent.getModel().refresh();
					}
				} else {
					//trigger update action in component only
					this.getScenario().updateUIComponent(level);
				}

				if (this.getComponent(level).isFioriElements() && comp.component) {
					//works first time, when closing detail it reloads (should not be needed if no input is received) and shows no target found
					var uiVersion = parseInt(sap.ui.version.split(".")[1], 10);
					if (uiVersion < 70) {
						comp.component.getRouter().mEventRegistry.routeMatched && comp.component.getRouter().mEventRegistry.routeMatched.forEach(
							route => {
								comp.component.getRouter().detachRouteMatched(route.fFunction, route.oListener);
							});
					}
					comp.component.getRouter().mEventRegistry.bypassed && comp.component.getRouter().mEventRegistry.bypassed.forEach(route => {
						comp.component.getRouter().detachBypassed(route.fFunction, route.oListener);
					});
				}
				if (this.getComponent(level).isFioriElements()) {
					this.setHashSilently(currentHash);
				}
			});
		},
		onAction: function (level, event) {
			// var item = event.getParameter("item");
			//keep selection in state for next component
			this.refreshOnNavigation = false;
			if (event.getParameter("type") === CompLoadLib.CentralEntryPointType.ForceRefresh) {
				this.refreshOnNavigation = true;
				return;
			}
			this.getComponent(level).setData(event.getParameter("data"));
			let component;
			if (event.getParameter("type") === CompLoadLib.CentralEntryPointType.Back) {
				component = this.getScenario().getPreviousComponent(level);
			}
			if (event.getParameter("type") === CompLoadLib.CentralEntryPointType.Navigate) {
				component = this.getScenario().getNextComponent(level);
			}
			if (event.getParameter("type") === CompLoadLib.CentralEntryPointType.NavigateToLevel) {
				component = this.getScenario().getComponent(event.getParameter("level"));
			}
			if (component) {
				//get next component info
				// let nextComponent = this.getScenario().getNextComponent(level);
				if (component.getLevel() !== this.level) {
					this.oRouter.navTo("app", {
						view: component.getView(),
						layout: component.getLayout(),
						level: component.getLevel()
					});
				} else if (event.getParameter("type") === CompLoadLib.CentralEntryPointType.Navigate || event.getParameter("type") === CompLoadLib.CentralEntryPointType
					.NavigateToLevel) {
						//in case route stays the same, it won't trigger the onroutematched function
					if (component.isFioriElements()) {
						this.showComponent(component.getLevel());
					} else {
						this.getScenario().updateUIComponent(component.getLevel());
					}
				}
			}
		},
		onExit: function () {
			this.oRouter.detachRouteMatched(this.onRouteMatched, this);
		}
	});
});